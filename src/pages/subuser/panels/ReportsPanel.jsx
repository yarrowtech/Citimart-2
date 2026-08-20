import React, { useEffect, useState, useCallback, useMemo } from "react";
import { API_BASE } from "../../../config";
import s from "../SubuserShared.module.css";

const PERIODS = [
  { key: "daily", label: "24h" },
  { key: "weekly", label: "7d" },
  { key: "monthly", label: "30d" },
  { key: "yearly", label: "1y" },
];

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const stockBadge = (status) => {
  if (status === "Out of Stock") return `${s.badge} ${s.badgeRed}`;
  if (status === "Low Stock") return `${s.badge} ${s.badgeAmber}`;
  return `${s.badge} ${s.badgeGreen}`;
};

const ReportsPanel = ({ token }) => {
  const [period, setPeriod] = useState("monthly");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/subuser/reports?period=${period}`, { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load reports");
      setData(json);
    } catch (err) {
      setError(err.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [headers, period]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const maxRevenue = data?.monthly_revenue?.length
    ? Math.max(...data.monthly_revenue.map((m) => m.revenue || 0), 1)
    : 1;

  return (
    <div className={s.panel}>
      <div className={s.panelHeader}>
        <div>
          <h2 className={s.panelTitle}>Reports & Analytics</h2>
          <p className={s.panelSubtitle}>Live store performance for the selected period.</p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {PERIODS.map((p) => (
            <button
              key={p.key}
              className={period === p.key ? s.btnPrimary : s.btnSecondary}
              onClick={() => setPeriod(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className={s.errorState}>{error}</div>}

      {loading || !data ? (
        <div className={s.loadingState}>Loading reports…</div>
      ) : (
        <>
          <div className={s.statGrid}>
            <div className={s.statCard}>
              <span className={s.statIcon}>💰</span>
              <span className={s.statValue}>{money(data.total_sales)}</span>
              <span className={s.statLabel}>Total Sales</span>
            </div>
            <div className={s.statCard}>
              <span className={s.statIcon}>📈</span>
              <span className={s.statValue}>{money(data.total_revenue)}</span>
              <span className={s.statLabel}>Confirmed Revenue</span>
            </div>
            <div className={s.statCard}>
              <span className={s.statIcon}>👥</span>
              <span className={s.statValue}>{data.subusers?.length || 0}</span>
              <span className={s.statLabel}>Active Subusers</span>
            </div>
            <div className={s.statCard}>
              <span className={s.statIcon}>📦</span>
              <span className={s.statValue}>{data.stock_analysis?.length || 0}</span>
              <span className={s.statLabel}>Tracked SKUs</span>
            </div>
          </div>

          <div className={s.card}>
            <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 800, color: "#111827" }}>Revenue Trend</h3>
            {data.monthly_revenue?.length ? (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140 }}>
                {data.monthly_revenue.map((m) => (
                  <div key={m.name} style={{ flex: 1, textAlign: "center" }}>
                    <div
                      title={money(m.revenue)}
                      style={{
                        height: `${Math.max(6, (m.revenue / maxRevenue) * 110)}px`,
                        background: "linear-gradient(180deg, var(--accent, #6366f1), var(--accent-2, #8b5cf6))",
                        borderRadius: 6, marginBottom: 6,
                      }}
                    />
                    <span style={{ fontSize: 10, color: "#9ca3af" }}>{m.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={s.emptyState}><span className={s.emptyIcon}>📊</span>No revenue recorded in this period.</div>
            )}
          </div>

          <div className={s.card}>
            <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 800, color: "#111827" }}>Stock Status</h3>
            {data.stock_analysis?.length ? (
              <div className={s.tableWrap}>
                <table className={s.table}>
                  <thead><tr><th>Product</th><th>Quantity</th><th>Status</th></tr></thead>
                  <tbody>
                    {data.stock_analysis.slice(0, 12).map((item, i) => (
                      <tr key={i}>
                        <td>{item.name}</td>
                        <td>{item.quantity}</td>
                        <td><span className={stockBadge(item.status)}>{item.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={s.emptyState}><span className={s.emptyIcon}>📦</span>No stock data available.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsPanel;
