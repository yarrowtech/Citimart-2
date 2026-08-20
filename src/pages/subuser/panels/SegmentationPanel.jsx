import React, { useEffect, useState, useCallback, useMemo } from "react";
import { API_BASE } from "../../../config";
import s from "../SubuserShared.module.css";

const SegmentationPanel = ({ token }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState(null);

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/subuser/segment-requests`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setRequests(data.requests || []);
    } catch (err) {
      setError(err.message || "Failed to load segmentation requests");
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const act = async (userId, action) => {
    setActingId(userId);
    try {
      const res = await fetch(`${API_BASE}/subuser/segment-requests/${userId}/${action}`, {
        method: "POST", headers,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetchRequests();
    } catch (err) {
      setError(err.message || "Action failed");
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className={s.panel}>
      <div className={s.panelHeader}>
        <div>
          <h2 className={s.panelTitle}>Segmentation Requests</h2>
          <p className={s.panelSubtitle}>Customers requesting an upgraded pricing/segment tier.</p>
        </div>
      </div>

      {error && <div className={s.errorState}>{error}</div>}

      {loading ? (
        <div className={s.loadingState}>Loading requests…</div>
      ) : requests.length === 0 ? (
        <div className={s.emptyState}>
          <span className={s.emptyIcon}>🎯</span>
          No pending segmentation requests right now.
        </div>
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Email</th>
                <th>Requested Segment</th>
                <th>Proof</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r._id}>
                  <td>{r.name}</td>
                  <td>{r.email}</td>
                  <td><span className={`${s.badge} ${s.badgeBlue}`}>{r.segment_request?.requested_segment}</span></td>
                  <td>
                    {r.segment_request?.proof_image ? (
                      <a href={r.segment_request.proof_image} target="_blank" rel="noopener noreferrer">View</a>
                    ) : "—"}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button className={s.btnSuccess} disabled={actingId === r._id} onClick={() => act(r._id, "approve")}>
                        ✓ Forward
                      </button>
                      <button className={s.btnDanger} disabled={actingId === r._id} onClick={() => act(r._id, "reject")}>
                        ✕ Reject
                      </button>
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

export default SegmentationPanel;
