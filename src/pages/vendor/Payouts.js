import React, { useState, useEffect, useCallback } from "react";
import { API_BASE } from "../../config";
import s from "../subuser/SubuserShared.module.css";

const statusBadge = (status) => {
  if (status === "paid") return `${s.badge} ${s.badgeGreen}`;
  return `${s.badge} ${s.badgeAmber}`;
};

const VendorPayouts = () => {
  const [data, setData] = useState(null);
  const [kybStatus, setKybStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const [payoutsRes, kybRes] = await Promise.all([
        fetch(`${API_BASE}/vendor/payouts`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/vendor/kyb/status`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const json = await payoutsRes.json();
      if (!payoutsRes.ok) throw new Error(json.error || "Failed to load payouts");
      setData(json);
      const kybJson = await kybRes.json();
      if (kybRes.ok) setKybStatus(kybJson.kybStatus);
    } catch (err) {
      setError(err.message || "Failed to load payouts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPayouts(); }, [fetchPayouts]);

  return (
    <div className={s.panel}>
      <div className={s.panelHeader}>
        <div>
          <h2 className={s.panelTitle}>Payouts</h2>
          <p className={s.panelSubtitle}>
            Real settlement ledger — one entry per delivered order, after platform commission.
          </p>
        </div>
      </div>

      {kybStatus && kybStatus !== "verified" && (
        <div className={`${s.badge} ${s.badgeAmber}`} style={{ width: "fit-content" }}>
          Business verification not complete — payouts stay "pending" until it's done.
          Complete it under "Verify Your Business".
        </div>
      )}

      {error && <div className={s.errorState}>{error}</div>}

      {loading ? (
        <div className={s.loadingState}>Loading payouts…</div>
      ) : (
        <>
          <div className={s.statGrid}>
            <div className={s.statCard}>
              <div className={s.statValue}>₹{data.total_pending.toLocaleString()}</div>
              <div className={s.statLabel}>Pending</div>
            </div>
            <div className={s.statCard}>
              <div className={s.statValue}>₹{data.total_paid.toLocaleString()}</div>
              <div className={s.statLabel}>Paid</div>
            </div>
          </div>

          {data.payouts.length === 0 ? (
            <div className={s.emptyState}>
              <span className={s.emptyIcon}>💰</span>
              No settled orders yet — payouts appear here once your orders are delivered.
            </div>
          ) : (
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>Order ID</th><th>Gross</th><th>Commission</th><th>Net Payout</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payouts.map((p) => (
                    <tr key={p._id}>
                      <td>{p.order_id}</td>
                      <td>₹{p.gross_amount}</td>
                      <td>₹{p.commission_amount} ({p.commission_rate}%)</td>
                      <td>₹{p.net_payout}</td>
                      <td><span className={statusBadge(p.status)}>{p.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VendorPayouts;
