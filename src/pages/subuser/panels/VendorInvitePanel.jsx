import React, { useEffect, useState, useCallback, useMemo } from "react";
import { API_BASE } from "../../../config";
import s from "../SubuserShared.module.css";

const EMPTY_FORM = { email: "", name: "", phone: "", businessName: "", businessType: "" };

const statusBadge = (status) => {
  if (status === "registered") return `${s.badge} ${s.badgeGreen}`;
  return `${s.badge} ${s.badgeAmber}`;
};

const VendorInvitePanel = ({ token }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sendSuccess, setSendSuccess] = useState("");

  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" }),
    [token]
  );

  const fetchInvites = useCallback(async () => {
    setLoading(true);
    setListError("");
    try {
      const res = await fetch(`${API_BASE}/subuser/vendor-invites`, { headers: { Authorization: headers.Authorization } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setInvites(data.invites || []);
    } catch (err) {
      setListError(err.message || "Failed to load invites");
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => { fetchInvites(); }, [fetchInvites]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email.trim()) return;
    setSending(true);
    setSendError("");
    setSendSuccess("");
    try {
      const res = await fetch(`${API_BASE}/subuser/vendor-invites`, {
        method: "POST",
        headers,
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send invite");
      setSendSuccess(`Invite sent to ${form.email}`);
      setForm(EMPTY_FORM);
      await fetchInvites();
    } catch (err) {
      setSendError(err.message || "Failed to send invite");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={s.panel}>
      <div className={s.panelHeader}>
        <div>
          <h2 className={s.panelTitle}>Invite Vendors</h2>
          <p className={s.panelSubtitle}>
            Send a prospective vendor a registration link with their details already filled in.
          </p>
        </div>
      </div>

      {sendError && <div className={s.errorState}>{sendError}</div>}
      {sendSuccess && <div className={`${s.badge} ${s.badgeGreen}`} style={{ width: "fit-content" }}>✓ {sendSuccess}</div>}

      <form onSubmit={submit} className={s.card}>
        <div className={s.formGrid}>
          <div className={s.formGroup}>
            <label>Vendor Email *</label>
            <input className={s.input} type="email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="vendor@example.com" required />
          </div>
          <div className={s.formGroup}>
            <label>Contact Name</label>
            <input className={s.input} value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className={s.formGroup}>
            <label>Phone</label>
            <input className={s.input} value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className={s.formGroup}>
            <label>Business Name</label>
            <input className={s.input} value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
          </div>
          <div className={s.formGroup}>
            <label>Business Type</label>
            <select className={s.select} value={form.businessType}
              onChange={(e) => setForm({ ...form, businessType: e.target.value })}>
              <option value="">Not specified</option>
              <option>Proprietor</option>
              <option>LLP</option>
              <option>Pvt. Ltd.</option>
              <option>Partnership</option>
              <option>Other</option>
            </select>
          </div>
        </div>
        <button className={s.btnPrimary} type="submit" disabled={sending} style={{ marginTop: 12, width: "fit-content" }}>
          {sending ? "Sending…" : "Send Invite"}
        </button>
      </form>

      {listError && <div className={s.errorState}>{listError}</div>}

      {loading ? (
        <div className={s.loadingState}>Loading sent invites…</div>
      ) : invites.length === 0 ? (
        <div className={s.emptyState}>
          <span className={s.emptyIcon}>📧</span>
          No invites sent yet.
        </div>
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr><th>Email</th><th>Name</th><th>Business</th><th>Sent</th><th>Status</th></tr>
            </thead>
            <tbody>
              {invites.map((inv) => (
                <tr key={inv._id}>
                  <td>{inv.email}</td>
                  <td>{inv.name || "—"}</td>
                  <td>{inv.businessName || "—"}</td>
                  <td>{inv.sentAt ? new Date(inv.sentAt).toLocaleDateString() : "—"}</td>
                  <td><span className={statusBadge(inv.status)}>{inv.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default VendorInvitePanel;
