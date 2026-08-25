import React, { useState, useEffect, useCallback } from "react";
import { API_BASE } from "../../config";
import s from "../subuser/SubuserShared.module.css";

const statusBadge = (status) => {
  if (status === "verified") return `${s.badge} ${s.badgeGreen}`;
  if (status === "rejected") return `${s.badge} ${s.badgeRed}`;
  if (status === "pending_review") return `${s.badge} ${s.badgeAmber}`;
  return `${s.badge} ${s.badgeGray}`;
};

const statusLabel = (status) => ({
  not_submitted: "Not submitted",
  pending_review: "Pending review",
  verified: "Verified",
  rejected: "Rejected",
}[status] || status);

const VendorKYB = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    panNumber: "", gstNumber: "", businessRegNumber: "",
    panDocument: null, gstDocument: null, businessRegDocument: null,
  });

  const fetchStatus = useCallback(async () => {
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/vendor/kyb/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load verification status");
      setData(json);
    } catch (err) {
      setError(err.message || "Failed to load verification status");
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "file" ? files[0] : value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.panNumber || !form.gstNumber || !form.businessRegNumber) {
      setError("PAN number, GST number, and business registration number are all required");
      return;
    }
    if (!form.panDocument || !form.gstDocument || !form.businessRegDocument) {
      setError("Please upload all three documents");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const body = new FormData();
      body.append("panNumber", form.panNumber);
      body.append("gstNumber", form.gstNumber);
      body.append("businessRegNumber", form.businessRegNumber);
      body.append("panDocument", form.panDocument);
      body.append("gstDocument", form.gstDocument);
      body.append("businessRegDocument", form.businessRegDocument);

      const res = await fetch(`${API_BASE}/vendor/kyb/submit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Submission failed");
      await fetchStatus();
    } catch (err) {
      setError(err.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!data) return <div className={s.loadingState}>Loading…</div>;

  const canSubmit = data.kybStatus === "not_submitted" || data.kybStatus === "rejected";

  return (
    <div className={s.panel}>
      <div className={s.panelHeader}>
        <div>
          <h2 className={s.panelTitle}>Verify Your Business</h2>
          <p className={s.panelSubtitle}>
            You can list products and sell right away — but your earnings are held
            until this verification is complete.
          </p>
        </div>
      </div>

      <div className={s.card}>
        <span className={statusBadge(data.kybStatus)}>{statusLabel(data.kybStatus)}</span>
        {data.kybStatus === "rejected" && data.kybRejectionReason && (
          <p style={{ marginTop: 8, fontSize: 13, color: "#dc2626" }}>
            Reason: {data.kybRejectionReason}. Please correct and resubmit below.
          </p>
        )}
        {data.kybStatus === "pending_review" && (
          <p style={{ marginTop: 8, fontSize: 13, color: "#6b7280" }}>
            Your documents are submitted and awaiting review.
          </p>
        )}
        {data.kybStatus === "verified" && (
          <p style={{ marginTop: 8, fontSize: 13, color: "#6b7280" }}>
            Verified on {data.kybReviewedAt ? new Date(data.kybReviewedAt).toLocaleDateString() : "—"}.
            Your payouts will be released normally.
          </p>
        )}
      </div>

      {error && <div className={s.errorState}>{error}</div>}

      {canSubmit && (
        <form onSubmit={submit} className={s.card}>
          <div className={s.formGrid}>
            <div className={s.formGroup}>
              <label>PAN Number</label>
              <input className={s.input} name="panNumber" value={form.panNumber}
                onChange={handleChange} placeholder="ABCDE1234F" maxLength={10} />
            </div>
            <div className={s.formGroup}>
              <label>PAN Card Upload</label>
              <input className={s.input} type="file" name="panDocument"
                accept="image/*,.pdf" onChange={handleChange} />
            </div>
            <div className={s.formGroup}>
              <label>GST Number</label>
              <input className={s.input} name="gstNumber" value={form.gstNumber}
                onChange={handleChange} placeholder="22AAAAA0000A1Z5" maxLength={15} />
            </div>
            <div className={s.formGroup}>
              <label>GST Certificate Upload</label>
              <input className={s.input} type="file" name="gstDocument"
                accept="image/*,.pdf" onChange={handleChange} />
            </div>
            <div className={s.formGroup}>
              <label>Business Registration Number</label>
              <input className={s.input} name="businessRegNumber" value={form.businessRegNumber}
                onChange={handleChange} placeholder="CIN / Udyam / Partnership deed no." />
            </div>
            <div className={s.formGroup}>
              <label>Business Registration Proof</label>
              <input className={s.input} type="file" name="businessRegDocument"
                accept="image/*,.pdf" onChange={handleChange} />
            </div>
          </div>
          <button className={s.btnPrimary} type="submit" disabled={submitting}
            style={{ marginTop: 12, width: "fit-content" }}>
            {submitting ? "Submitting…" : "Submit for Review"}
          </button>
        </form>
      )}
    </div>
  );
};

export default VendorKYB;
