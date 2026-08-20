import React, { useEffect, useState, useCallback, useMemo } from "react";
import { API_BASE } from "../../../config";
import s from "../SubuserShared.module.css";

const VendorReviewPanel = ({ token }) => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState(null);

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" }),
    [token]
  );

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/subuser/vendors`, { headers: { Authorization: headers.Authorization } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setVendors(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load vendors");
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  const act = async (vendorId, approve) => {
    setActingId(vendorId);
    try {
      const res = await fetch(`${API_BASE}/subuser/vendor/${vendorId}/approve`, {
        method: "PATCH", headers, body: JSON.stringify({ approve }),
      });
      if (!res.ok) throw new Error("Action failed");
      await fetchVendors();
    } catch (err) {
      setError(err.message);
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className={s.panel}>
      <div className={s.panelHeader}>
        <div>
          <h2 className={s.panelTitle}>Vendor Approvals</h2>
          <p className={s.panelSubtitle}>New vendor applications awaiting your first-pass review before admin sign-off.</p>
        </div>
      </div>

      {error && <div className={s.errorState}>{error}</div>}

      {loading ? (
        <div className={s.loadingState}>Loading vendor applications…</div>
      ) : vendors.length === 0 ? (
        <div className={s.emptyState}><span className={s.emptyIcon}>🏬</span>No vendor applications pending review.</div>
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr><th>Business</th><th>Contact</th><th>Category</th><th style={{ textAlign: "right" }}>Action</th></tr>
            </thead>
            <tbody>
              {vendors.map((v) => (
                <tr key={v._id}>
                  <td>{v.businessName || v.fullName}</td>
                  <td>{v.email}</td>
                  <td>{(v.productCategories || []).join(", ") || "—"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button className={s.btnSuccess} disabled={actingId === v._id} onClick={() => act(v._id, true)}>✓ Approve</button>
                      <button className={s.btnDanger} disabled={actingId === v._id} onClick={() => act(v._id, false)}>✕ Reject</button>
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

export default VendorReviewPanel;
