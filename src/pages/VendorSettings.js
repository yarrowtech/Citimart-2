import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../config";
import s from "./VendorSettings.module.css";

const STATUS_BADGE = {
  approved: { label: "Approved", cls: "badgeGreen" },
  pending_admin: { label: "Pending admin review", cls: "badgeAmber" },
  pending_subuser: { label: "Pending review", cls: "badgeAmber" },
  rejected: { label: "Rejected", cls: "badgeRed" },
};

const KYB_BADGE = {
  verified: { label: "Verified", cls: "badgeGreen" },
  pending_review: { label: "Pending review", cls: "badgeAmber" },
  rejected: { label: "Rejected", cls: "badgeRed" },
  not_submitted: { label: "Not submitted", cls: "badgeGray" },
};

const TABS = [
  { key: "profile", label: "Business Profile", icon: "🏢" },
  { key: "security", label: "Security", icon: "🔒" },
  { key: "payments", label: "Payout Details", icon: "💳" },
];

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("vendorToken") || localStorage.getItem("token")}`,
  "Content-Type": "application/json",
});

const ProfileTab = () => {
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const load = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/vendor/settings/profile`, { headers: authHeaders() });
    const body = await res.json();
    if (res.ok) { setData(body); setForm(body); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const { businessName, fullName, phone, businessType, businessAddress } = form;
      const res = await fetch(`${API_BASE}/api/vendor/settings/profile`, {
        method: "PUT", headers: authHeaders(),
        body: JSON.stringify({ businessName, fullName, phone, businessType, businessAddress }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Could not save profile");
      setMessage({ type: "ok", text: "Profile updated." });
      load();
    } catch (err) {
      setMessage({ type: "err", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (!data || !form) return <div className={s.loading}>Loading…</div>;

  const statusInfo = STATUS_BADGE[data.status] || { label: data.status || "Unknown", cls: "badgeGray" };
  const kybInfo = KYB_BADGE[data.kybStatus] || KYB_BADGE.not_submitted;

  return (
    <div className={s.card}>
      <div className={s.statusRow}>
        <div>
          <span className={s.statusLabel}>Account status</span>
          <span className={`${s.badge} ${s[statusInfo.cls]}`}>{statusInfo.label}</span>
        </div>
        <div>
          <span className={s.statusLabel}>Business verification</span>
          <span className={`${s.badge} ${s[kybInfo.cls]}`}>{kybInfo.label}</span>
          <Link to="/vendor/verify-business" className={s.inlineLink}>
            {data.kybStatus === "verified" ? "View" : "Complete verification"} →
          </Link>
        </div>
      </div>

      <form onSubmit={save} className={s.form}>
        <div className={s.formRow}>
          <label>Business name
            <input name="businessName" value={form.businessName} onChange={change} required />
          </label>
          <label>Contact person
            <input name="fullName" value={form.fullName} onChange={change} required />
          </label>
        </div>
        <div className={s.formRow}>
          <label>Phone
            <input name="phone" value={form.phone} onChange={change} required />
          </label>
          <label>Business type
            <select name="businessType" value={form.businessType} onChange={change}>
              <option value="Individual">Individual</option>
              <option value="Company">Company</option>
              <option value="Partnership">Partnership</option>
            </select>
          </label>
        </div>
        <label>Business address
          <textarea name="businessAddress" rows={3} value={form.businessAddress} onChange={change} required />
        </label>
        <label className={s.readOnlyField}>Login email (fixed)
          <input value={data.email} disabled />
        </label>

        {message && <p className={message.type === "err" ? s.errorText : s.okText}>{message.text}</p>}
        <button type="submit" className={s.primaryBtn} disabled={saving}>
          {saving ? "Saving…" : "Save profile"}
        </button>
      </form>

      <p className={s.footnote}>
        Store logo, description, banner and public link live on your{" "}
        <Link to="/vendor/storefront" className={s.inlineLink}>Storefront page</Link>.
      </p>
    </div>
  );
};

const SecurityTab = () => {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (form.newPassword !== form.confirmPassword) {
      setMessage({ type: "err", text: "New passwords do not match." });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/vendor/settings/password`, {
        method: "PUT", headers: authHeaders(),
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Could not update password");
      setMessage({ type: "ok", text: "Password updated. Use it next time you log in." });
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setMessage({ type: "err", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={s.card}>
      <h3 className={s.cardTitle}>Change password</h3>
      <form onSubmit={save} className={s.form}>
        <label>Current password
          <input type="password" name="currentPassword" value={form.currentPassword} onChange={change} required />
        </label>
        <div className={s.formRow}>
          <label>New password
            <input type="password" name="newPassword" value={form.newPassword} onChange={change} minLength={8} required />
          </label>
          <label>Confirm new password
            <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={change} minLength={8} required />
          </label>
        </div>
        <p className={s.hint}>At least 8 characters.</p>
        {message && <p className={message.type === "err" ? s.errorText : s.okText}>{message.text}</p>}
        <button type="submit" className={s.primaryBtn} disabled={saving}>
          {saving ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
};

const PaymentsTab = () => {
  const [form, setForm] = useState({ holderName: "", bankName: "", accountNumber: "", ifsc: "", upi: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const load = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/vendor/settings/payments`, { headers: authHeaders() });
    const body = await res.json();
    if (res.ok) setForm((f) => ({ ...f, ...body }));
  }, []);

  useEffect(() => { load(); }, [load]);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/api/vendor/settings/payments`, {
        method: "PUT", headers: authHeaders(), body: JSON.stringify(form),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Could not save payout details");
      setMessage({ type: "ok", text: "Payout details saved." });
    } catch (err) {
      setMessage({ type: "err", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={s.card}>
      <h3 className={s.cardTitle}>Payout bank details</h3>
      <p className={s.hint}>
        Used by Citimart's finance team to send your payouts. See <Link to="/vendor/payouts" className={s.inlineLink}>Payouts</Link> for your earnings history.
      </p>
      <form onSubmit={save} className={s.form}>
        <div className={s.formRow}>
          <label>Account holder name
            <input name="holderName" value={form.holderName} onChange={change} />
          </label>
          <label>Bank name
            <input name="bankName" value={form.bankName} onChange={change} />
          </label>
        </div>
        <div className={s.formRow}>
          <label>Account number
            <input name="accountNumber" value={form.accountNumber} onChange={change} />
          </label>
          <label>IFSC code
            <input name="ifsc" value={form.ifsc} onChange={change} />
          </label>
        </div>
        <label>UPI ID (optional)
          <input name="upi" value={form.upi} onChange={change} placeholder="yourname@bank" />
        </label>
        {message && <p className={message.type === "err" ? s.errorText : s.okText}>{message.text}</p>}
        <button type="submit" className={s.primaryBtn} disabled={saving}>
          {saving ? "Saving…" : "Save payout details"}
        </button>
      </form>
    </div>
  );
};

const VendorSettings = () => {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1>Settings</h1>
        <p>Manage your business profile, login security, and payout details.</p>
      </div>

      <div className={s.layout}>
        <nav className={s.tabRail}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`${s.tabBtn} ${activeTab === tab.key ? s.tabBtnActive : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </nav>
        <main className={s.content}>
          {activeTab === "profile" && <ProfileTab />}
          {activeTab === "security" && <SecurityTab />}
          {activeTab === "payments" && <PaymentsTab />}
        </main>
      </div>
    </div>
  );
};

export default VendorSettings;
