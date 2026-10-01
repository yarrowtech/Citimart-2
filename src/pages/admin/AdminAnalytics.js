import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import { API_BASE } from "../../config";
import s from "../subuser/SubuserShared.module.css";

const LIVE_POLL_MS = 15000;

const AdminAnalytics = () => {
  const [days, setDays] = useState(7);
  const [overview, setOverview] = useState(null);
  const [live, setLive] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${localStorage.getItem("adminToken")}` }),
    []
  );

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/admin/analytics/overview?days=${days}`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load analytics");
      setOverview(data);
    } catch (err) {
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [headers, days]);

  const fetchLive = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/analytics/live?minutes=5`, { headers });
      const data = await res.json();
      if (res.ok) setLive(data.live || []);
    } catch {
      // live panel failing silently is fine — overview is the primary view
    }
  }, [headers]);

  useEffect(() => { fetchOverview(); }, [fetchOverview]);

  useEffect(() => {
    fetchLive();
    const interval = setInterval(fetchLive, LIVE_POLL_MS);
    return () => clearInterval(interval);
  }, [fetchLive]);

  return (
    <div className={s.panel}>
      <div className={s.panelHeader}>
        <div>
          <h2 className={s.panelTitle}>Analytics</h2>
          <p className={s.panelSubtitle}>
            Real site traffic, signups, and activity — tracked from actual page visits, not estimates.
          </p>
        </div>
        <select className={s.select} value={days} onChange={(e) => setDays(Number(e.target.value))} style={{ maxWidth: 160 }}>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {error && <div className={s.errorState}>{error}</div>}

      {loading || !overview ? (
        <div className={s.loadingState}>Loading analytics…</div>
      ) : (
        <>
          <div className={s.statGrid}>
            <div className={s.statCard}>
              <div className={s.statValue}>{overview.unique_visitors}</div>
              <div className={s.statLabel}>Unique Visitors ({days}d)</div>
            </div>
            <div className={s.statCard}>
              <div className={s.statValue}>{overview.total_pageviews}</div>
              <div className={s.statLabel}>Page Views ({days}d)</div>
            </div>
            <div className={s.statCard}>
              <div className={s.statValue}>{overview.orders_total}</div>
              <div className={s.statLabel}>Orders ({days}d)</div>
            </div>
            <div className={s.statCard}>
              <div className={s.statValue}>{overview.total_customers}</div>
              <div className={s.statLabel}>Total Customers</div>
            </div>
            <div className={s.statCard}>
              <div className={s.statValue}>{overview.total_vendors}</div>
              <div className={s.statLabel}>Total Vendors</div>
            </div>
            <div className={s.statCard}>
              <div className={s.statValue}>{overview.total_subusers}</div>
              <div className={s.statLabel}>Total Subusers</div>
            </div>
            <div className={s.statCard}>
              <div className={s.statValue}>{overview.vendor_login_total}</div>
              <div className={s.statLabel}>Vendor Logins (lifetime)</div>
            </div>
            <div className={s.statCard}>
              <div className={s.statValue}>{overview.subuser_login_total}</div>
              <div className={s.statLabel}>Subuser Logins (lifetime)</div>
            </div>
            <div className={s.statCard}>
              <div className={s.statValue}>
                {overview.guest_leads_converted} / {overview.guest_leads_total}
              </div>
              <div className={s.statLabel}>Guest Leads Converted</div>
            </div>
          </div>

          <div className={s.card}>
            <h3 className={s.panelTitle} style={{ fontSize: 16 }}>Signups Over Time</h3>
            {overview.signup_trend.length === 0 ? (
              <div className={s.emptyState}>
                <span className={s.emptyIcon}>📈</span>
                No new signups in this window.
              </div>
            ) : (
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer>
                  <LineChart data={overview.signup_trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="customers" stroke="#6366f1" strokeWidth={2} />
                    <Line type="monotone" dataKey="vendors" stroke="#f59e0b" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div>
            <h3 className={s.panelTitle} style={{ fontSize: 16 }}>Most Viewed Pages ({days}d)</h3>
            {overview.top_pages.length === 0 ? (
              <div className={s.emptyState}>
                <span className={s.emptyIcon}>👀</span>
                No page views recorded yet.
              </div>
            ) : (
              <div className={s.tableWrap}>
                <table className={s.table}>
                  <thead><tr><th>Page</th><th>Views</th></tr></thead>
                  <tbody>
                    {overview.top_pages.map((p) => (
                      <tr key={p.path}><td>{p.path}</td><td>{p.views}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <div className={s.panelHeader}>
              <h3 className={s.panelTitle} style={{ fontSize: 16 }}>Live Activity</h3>
              <span className={`${s.badge} ${s.badgeGreen}`}>{live.length} active now</span>
            </div>
            <p className={s.panelSubtitle} style={{ marginTop: -8 }}>
              Last seen in the past 5 minutes — refreshes automatically, not a live push feed.
            </p>
            {live.length === 0 ? (
              <div className={s.emptyState}>
                <span className={s.emptyIcon}>💤</span>
                Nobody active in the last 5 minutes.
              </div>
            ) : (
              <div className={s.tableWrap}>
                <table className={s.table}>
                  <thead><tr><th>Who</th><th>Role</th><th>Page</th><th>Last Seen</th></tr></thead>
                  <tbody>
                    {live.map((row, i) => (
                      <tr key={i}>
                        <td>{row.label}</td>
                        <td><span className={`${s.badge} ${s.badgeBlue}`}>{row.role}</span></td>
                        <td>{row.path}</td>
                        <td>{row.seconds_ago}s ago</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminAnalytics;
