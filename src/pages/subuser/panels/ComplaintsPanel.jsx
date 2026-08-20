import React, { useEffect, useState, useCallback, useMemo } from "react";
import { API_BASE } from "../../../config";
import s from "../SubuserShared.module.css";

const STATUS_OPTIONS = ["Pending", "In Progress", "Resolved", "Rejected"];

const statusBadge = (status) => {
  if (status === "Resolved") return `${s.badge} ${s.badgeGreen}`;
  if (status === "Rejected") return `${s.badge} ${s.badgeRed}`;
  if (status === "In Progress") return `${s.badge} ${s.badgeBlue}`;
  return `${s.badge} ${s.badgeAmber}`;
};

const ComplaintsPanel = ({ token }) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/subuser/complaints`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setComplaints(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load complaints");
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`${API_BASE}/subuser/complaints/${id}`, {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Update failed");
      await fetchComplaints();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className={s.panel}>
      <div className={s.panelHeader}>
        <div>
          <h2 className={s.panelTitle}>Complaints & Issues</h2>
          <p className={s.panelSubtitle}>Customer complaints awaiting review or resolution.</p>
        </div>
      </div>

      {error && <div className={s.errorState}>{error}</div>}

      {loading ? (
        <div className={s.loadingState}>Loading complaints…</div>
      ) : complaints.length === 0 ? (
        <div className={s.emptyState}>
          <span className={s.emptyIcon}>💬</span>
          No complaints filed yet.
        </div>
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Customer</th><th>Category</th><th>Description</th><th>Date</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((c) => (
                <tr key={c.id}>
                  <td>{c.username}</td>
                  <td>{c.category}</td>
                  <td style={{ maxWidth: 260 }}>{c.description}</td>
                  <td>{c.date}</td>
                  <td>
                    <select
                      className={s.select}
                      value={c.status}
                      disabled={updatingId === c.id}
                      onChange={(e) => updateStatus(c.id, e.target.value)}
                      style={{ minWidth: 130 }}
                    >
                      {STATUS_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <div style={{ marginTop: 6 }}>
                      <span className={statusBadge(c.status)}>{c.status}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ComplaintsPanel;
