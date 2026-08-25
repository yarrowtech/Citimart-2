import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../config";
import s from "./subuser/SubuserShared.module.css";
import styles from "./AdminSettings.module.css";

const TABS = [
  { key: "platform", label: "Platform", icon: "⚙️" },
  { key: "maintenance", label: "Maintenance Mode", icon: "🚧" },
  { key: "errors", label: "Error Logs", icon: "🐞" },
  { key: "tickets", label: "Support Tickets", icon: "🎫" },
  { key: "subusers", label: "Subusers", icon: "👥" },
  { key: "security", label: "Security", icon: "🔐" },
];

// ── Platform tab ─────────────────────────────────────────────────────────
const PlatformTab = () => {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/admin/settings/platform`)
      .then((res) => res.json())
      .then(setForm)
      .catch(() => setError("Failed to load platform settings"));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch(`${API_BASE}/admin/settings/platform`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!form) return <div className={s.loadingState}>Loading platform settings…</div>;

  return (
    <div className={s.panel}>
      <div className={s.panelHeader}>
        <div>
          <h2 className={s.panelTitle}>Platform Settings</h2>
          <p className={s.panelSubtitle}>Core store information used across the site.</p>
        </div>
      </div>
      {error && <div className={s.errorState}>{error}</div>}
      {saved && <div className={`${s.badge} ${s.badgeGreen}`} style={{ width: "fit-content" }}>✓ Saved</div>}
      <form onSubmit={handleSave} className={s.card}>
        <div className={s.formGrid}>
          <div className={s.formGroup}>
            <label>Platform Name</label>
            <input className={s.input} value={form.platformName || ""}
              onChange={(e) => setForm({ ...form, platformName: e.target.value })} />
          </div>
          <div className={s.formGroup}>
            <label>Support Email</label>
            <input className={s.input} type="email" value={form.supportEmail || ""}
              onChange={(e) => setForm({ ...form, supportEmail: e.target.value })} />
          </div>
          <div className={s.formGroup}>
            <label>Contact Number</label>
            <input className={s.input} value={form.contactNumber || ""}
              onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} />
          </div>
          <div className={s.formGroup}>
            <label>Currency</label>
            <select className={s.select} value={form.currency || "INR"}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}>
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
          <div className={s.formGroup}>
            <label>Time Zone</label>
            <input className={s.input} value={form.timeZone || ""}
              onChange={(e) => setForm({ ...form, timeZone: e.target.value })} />
          </div>
          <div className={s.formGroup}>
            <label>Standard Commission Rate (%)</label>
            <input className={s.input} type="number" min="0" max="100" step="0.5"
              value={form.commissionRate ?? ""}
              onChange={(e) => setForm({ ...form, commissionRate: parseFloat(e.target.value) })} />
          </div>
          <div className={s.formGroup}>
            <label>Pro Commission Rate (%)</label>
            <input className={s.input} type="number" min="0" max="100" step="0.5"
              value={form.proCommissionRate ?? ""}
              onChange={(e) => setForm({ ...form, proCommissionRate: parseFloat(e.target.value) })} />
          </div>
          <div className={s.formGroup}>
            <label>Pro Subscription Fee (₹/month)</label>
            <input className={s.input} type="number" min="0" step="1"
              value={form.proSubscriptionFee ?? ""}
              onChange={(e) => setForm({ ...form, proSubscriptionFee: parseFloat(e.target.value) })} />
          </div>
          <div className={s.formGroup}>
            <label>Premium Commission Rate (%)</label>
            <input className={s.input} type="number" min="0" max="100" step="0.5"
              value={form.premiumCommissionRate ?? ""}
              onChange={(e) => setForm({ ...form, premiumCommissionRate: parseFloat(e.target.value) })} />
          </div>
          <div className={s.formGroup}>
            <label>Premium Subscription Fee (₹/month)</label>
            <input className={s.input} type="number" min="0" step="1"
              value={form.premiumSubscriptionFee ?? ""}
              onChange={(e) => setForm({ ...form, premiumSubscriptionFee: parseFloat(e.target.value) })} />
          </div>
          <div className={s.formGroup}>
            <label>Default Language</label>
            <select className={s.select} value={form.defaultLanguage || "English"}
              onChange={(e) => setForm({ ...form, defaultLanguage: e.target.value })}>
              <option>English</option>
              <option>Hindi</option>
            </select>
          </div>
        </div>
        <button type="submit" className={s.btnPrimary} disabled={saving} style={{ marginTop: 16 }}>
          {saving ? "Saving…" : "Save Platform Settings"}
        </button>
      </form>
    </div>
  );
};

// ── Maintenance mode tab ─────────────────────────────────────────────────
const MaintenanceTab = () => {
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchStatus = useCallback(() => {
    fetch(`${API_BASE}/admin/settings/maintenance`)
      .then((res) => res.json())
      .then((data) => {
        setStatus(data.maintenanceMode);
        setMessage(data.maintenanceMessage || "");
      })
      .catch(() => setError("Failed to load maintenance status"));
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const toggle = async (enable) => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/admin/settings/maintenance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maintenanceMode: enable, maintenanceMessage: message }),
      });
      if (!res.ok) throw new Error("Update failed");
      fetchStatus();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (status === null) return <div className={s.loadingState}>Loading maintenance status…</div>;

  return (
    <div className={s.panel}>
      <div className={s.panelHeader}>
        <div>
          <h2 className={s.panelTitle}>Maintenance Mode</h2>
          <p className={s.panelSubtitle}>
            When enabled, the storefront and vendor tools return 503 to visitors. Admin, subuser, and login routes always stay reachable so you can turn it back off.
          </p>
        </div>
        <span className={`${s.badge} ${status ? s.badgeRed : s.badgeGreen}`}>
          {status ? "🔴 Maintenance ON" : "🟢 Site Live"}
        </span>
      </div>

      {error && <div className={s.errorState}>{error}</div>}

      <div className={s.card}>
        <div className={s.formGroup}>
          <label>Message shown to visitors while maintenance is on</label>
          <textarea className={s.textarea} value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="We're down for scheduled maintenance. Please check back soon." />
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          {!status ? (
            <button className={s.btnDanger} disabled={saving} onClick={() => toggle(true)}>
              {saving ? "…" : "🚧 Enable Maintenance Mode"}
            </button>
          ) : (
            <button className={s.btnSuccess} disabled={saving} onClick={() => toggle(false)}>
              {saving ? "…" : "✓ Disable Maintenance Mode — Go Live"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Error logs tab ───────────────────────────────────────────────────────
const ErrorLogsTab = () => {
  const [logs, setLogs] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLogs = useCallback(() => {
    setLoading(true);
    fetch(`${API_BASE}/admin/settings/error-logs`)
      .then((res) => res.json())
      .then((data) => { setLogs(data.logs || []); setCount(data.count || 0); })
      .catch(() => setError("Failed to load error logs"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleClear = async () => {
    if (!window.confirm("Clear all error logs? This cannot be undone.")) return;
    try {
      await fetch(`${API_BASE}/admin/settings/error-logs`, { method: "DELETE" });
      fetchLogs();
    } catch {
      setError("Failed to clear logs");
    }
  };

  return (
    <div className={s.panel}>
      <div className={s.panelHeader}>
        <div>
          <h2 className={s.panelTitle}>Error Logs</h2>
          <p className={s.panelSubtitle}>Unhandled backend exceptions, most recent first ({count} total).</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className={s.btnSecondary} onClick={fetchLogs}>↻ Refresh</button>
          {logs.length > 0 && <button className={s.btnDanger} onClick={handleClear}>Clear All</button>}
        </div>
      </div>

      {error && <div className={s.errorState}>{error}</div>}

      {loading ? (
        <div className={s.loadingState}>Loading logs…</div>
      ) : logs.length === 0 ? (
        <div className={s.emptyState}><span className={s.emptyIcon}>✅</span>No errors logged — clean slate.</div>
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead><tr><th>Time</th><th>Method</th><th>Path</th><th>Error</th></tr></thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id}>
                  <td style={{ whiteSpace: "nowrap" }}>{log.created_at ? new Date(log.created_at).toLocaleString() : "—"}</td>
                  <td><span className={`${s.badge} ${s.badgeBlue}`}>{log.method}</span></td>
                  <td style={{ fontFamily: "monospace", fontSize: 12 }}>{log.path}</td>
                  <td style={{ color: "#dc2626", maxWidth: 400 }}>{log.error_message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ── Support tickets tab ──────────────────────────────────────────────────
const STATUS_OPTIONS = ["open", "in_progress", "resolved"];
const statusBadgeClass = (status) => {
  if (status === "resolved") return `${s.badge} ${s.badgeGreen}`;
  if (status === "in_progress") return `${s.badge} ${s.badgeBlue}`;
  return `${s.badge} ${s.badgeAmber}`;
};

const TicketsTab = () => {
  const [messages, setMessages] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const fetchMessages = useCallback(() => {
    setLoading(true);
    const qs = filter ? `?status=${filter}` : "";
    fetch(`${API_BASE}/admin/settings/contact-messages${qs}`)
      .then((res) => res.json())
      .then((data) => setMessages(data.messages || []))
      .catch(() => setError("Failed to load support tickets"))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      await fetch(`${API_BASE}/admin/settings/contact-messages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchMessages();
    } catch {
      setError("Failed to update ticket");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className={s.panel}>
      <div className={s.panelHeader}>
        <div>
          <h2 className={s.panelTitle}>Support Tickets</h2>
          <p className={s.panelSubtitle}>Messages submitted through the Contact Us form.</p>
        </div>
        <select className={s.select} value={filter} onChange={(e) => setFilter(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt.replace("_", " ")}</option>)}
        </select>
      </div>

      {error && <div className={s.errorState}>{error}</div>}

      {loading ? (
        <div className={s.loadingState}>Loading tickets…</div>
      ) : messages.length === 0 ? (
        <div className={s.emptyState}><span className={s.emptyIcon}>🎫</span>No support tickets found.</div>
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead><tr><th>From</th><th>Subject</th><th>Message</th><th>Received</th><th>Status</th></tr></thead>
            <tbody>
              {messages.map((m) => (
                <tr key={m._id}>
                  <td>{m.name}<br /><span style={{ color: "#9ca3af", fontSize: 11 }}>{m.email}</span></td>
                  <td>{m.subject || "—"}</td>
                  <td style={{ maxWidth: 280 }}>{m.message}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{m.created_at ? new Date(m.created_at).toLocaleDateString() : "—"}</td>
                  <td>
                    <select
                      className={s.select}
                      value={m.status}
                      disabled={updatingId === m._id}
                      onChange={(e) => updateStatus(m._id, e.target.value)}
                      style={{ minWidth: 130 }}
                    >
                      {STATUS_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt.replace("_", " ")}</option>)}
                    </select>
                    <div style={{ marginTop: 6 }}>
                      <span className={statusBadgeClass(m.status)}>{m.status.replace("_", " ")}</span>
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

// ── Subusers tab — links out to the dedicated management page ───────────
const SubusersTab = () => (
  <div className={s.panel}>
    <div className={s.panelHeader}>
      <div>
        <h2 className={s.panelTitle}>Subusers</h2>
        <p className={s.panelSubtitle}>Invite, edit, and manage subuser accounts and their permissions.</p>
      </div>
    </div>
    <div className={s.card} style={{ textAlign: "center", padding: 40 }}>
      <p style={{ color: "#6b7280", marginBottom: 16 }}>
        Full subuser management — invitations, roles, permissions, password resets — lives on its own dedicated page.
      </p>
      <Link to="/admin/subusers" className={s.btnPrimary} style={{ textDecoration: "none", display: "inline-flex" }}>
        Open Subuser Management →
      </Link>
    </div>
  </div>
);

// ── Security tab — real admin account list ───────────────────────────────
const SecurityTab = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/admin/settings/admin-accounts`)
      .then((res) => res.json())
      .then((data) => setAdmins(data.admins || []))
      .catch(() => setError("Failed to load admin accounts"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={s.panel}>
      <div className={s.panelHeader}>
        <div>
          <h2 className={s.panelTitle}>Security — Admin Accounts</h2>
          <p className={s.panelSubtitle}>Everyone with admin-level access to this system.</p>
        </div>
      </div>

      {error && <div className={s.errorState}>{error}</div>}

      {loading ? (
        <div className={s.loadingState}>Loading admin accounts…</div>
      ) : admins.length === 0 ? (
        <div className={s.emptyState}><span className={s.emptyIcon}>🔐</span>No admin accounts found.</div>
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead><tr><th>Name</th><th>Email</th><th>Logins</th><th>Last Login</th></tr></thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a._id}>
                  <td>{a.name || "—"}</td>
                  <td>{a.email}</td>
                  <td>{a.login_count || 0}</td>
                  <td>{a.last_login ? new Date(a.last_login).toLocaleString() : "Never logged in"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ── Shell ─────────────────────────────────────────────────────────────────
const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState("platform");

  const renderContent = () => {
    switch (activeTab) {
      case "platform": return <PlatformTab />;
      case "maintenance": return <MaintenanceTab />;
      case "errors": return <ErrorLogsTab />;
      case "tickets": return <TicketsTab />;
      case "subusers": return <SubusersTab />;
      case "security": return <SecurityTab />;
      default: return null;
    }
  };

  return (
    <div className={styles.settingsContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h1>⚙️ SETTINGS</h1>
        </div>
        <div className={styles.nav}>
          <ul>
            {TABS.map((tab) => (
              <li
                key={tab.key}
                className={activeTab === tab.key ? styles.active : ""}
                onClick={() => setActiveTab(tab.key)}
              >
                <span style={{ marginRight: 8 }}>{tab.icon}</span>{tab.label}
              </li>
            ))}
          </ul>
        </div>
      </aside>
      <main className={styles.mainContent}>{renderContent()}</main>
    </div>
  );
};

export default AdminSettings;
