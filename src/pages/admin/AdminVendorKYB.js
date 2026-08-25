import React, { useState, useEffect, useCallback, useMemo } from "react";
import { API_BASE } from "../../config";
import s from "../subuser/SubuserShared.module.css";

const AdminVendorKYB = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${localStorage.getItem("adminToken")}`, "Content-Type": "application/json" }),
    []
  );

  const fetchPending = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/admin/kyb/pending`, { headers: { Authorization: headers.Authorization } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setVendors(data.vendors || []);
    } catch (err) {
      setError(err.message || "Failed to load pending verifications");
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const review = async (vendorId, status, reason) => {
    setActingId(vendorId);
    try {
      const res = await fetch(`${API_BASE}/admin/kyb/${vendorId}`, {
        method: "PUT", headers, body: JSON.stringify({ status, reason }),
      });
      if (!res.ok) throw new Error("Action failed");
      setRejectingId(null);
      setRejectReason("");
      await fetchPending();
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
          <h2 className={s.panelTitle}>Business Verification (KYB)</h2>
          <p className={s.panelSubtitle}>
            Review PAN, GST, and business registration documents. Vendors are already
            live and selling — this only gates whether their payouts can be released.
          </p>
        </div>
      </div>

      {error && <div className={s.errorState}>{error}</div>}

      {loading ? (
        <div className={s.loadingState}>Loading pending verifications…</div>
      ) : vendors.length === 0 ? (
        <div className={s.emptyState}>
          <span className={s.emptyIcon}>🪪</span>
          No business verifications pending review.
        </div>
      ) : (
        vendors.map((v) => (
          <div key={v._id} className={s.card} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <strong>{v.businessName || v.fullName}</strong>
              <div style={{ fontSize: 12.5, color: "#6b7280" }}>{v.email}</div>
            </div>

            <div className={s.formGrid}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>PAN: {v.panNumber}</div>
                <a href={v.panDocumentUrl} target="_blank" rel="noreferrer">View PAN document</a>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>GST: {v.gstNumber}</div>
                <a href={v.gstDocumentUrl} target="_blank" rel="noreferrer">View GST certificate</a>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Reg No: {v.businessRegNumber}</div>
                <a href={v.businessRegDocumentUrl} target="_blank" rel="noreferrer">View registration proof</a>
              </div>
            </div>

            {rejectingId === v._id ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  className={s.input}
                  placeholder="Reason for rejection"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button className={s.btnDanger} disabled={actingId === v._id || !rejectReason.trim()}
                  onClick={() => review(v._id, "rejected", rejectReason.trim())}>
                  Confirm Reject
                </button>
                <button className={s.btnSecondary} onClick={() => { setRejectingId(null); setRejectReason(""); }}>
                  Cancel
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <button className={s.btnSuccess} disabled={actingId === v._id}
                  onClick={() => review(v._id, "verified", null)}>
                  ✓ Verify
                </button>
                <button className={s.btnDanger} disabled={actingId === v._id}
                  onClick={() => setRejectingId(v._id)}>
                  ✕ Reject
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default AdminVendorKYB;
