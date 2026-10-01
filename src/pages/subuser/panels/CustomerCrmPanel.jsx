import React, { useState, useEffect, useCallback, useMemo } from "react";
import { API_BASE } from "../../../config";
import s from "../SubuserShared.module.css";

const SUB_TABS = [
  { key: "customers", label: "Customers" },
  { key: "followups", label: "Follow-ups" },
  { key: "campaigns", label: "Campaigns" },
];

const reasonBadge = (reason) => {
  if (reason === "win_back") return `${s.badge} ${s.badgeAmber}`;
  return `${s.badge} ${s.badgeBlue}`;
};

const CustomerCrmPanel = ({ token }) => {
  const [subTab, setSubTab] = useState("customers");
  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" }),
    [token]
  );

  return (
    <div className={s.panel}>
      <div className={s.panelHeader}>
        <div>
          <h2 className={s.panelTitle}>Customer CRM</h2>
          <p className={s.panelSubtitle}>Repeat customers, follow-up reminders, and promotional campaigns.</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, borderBottom: "1px solid #f1f2f6", paddingBottom: 10 }}>
        {SUB_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setSubTab(t.key)}
            className={subTab === t.key ? s.btnPrimary : s.btnSecondary}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === "customers" && <CustomersTab headers={headers} />}
      {subTab === "followups" && <FollowupsTab headers={headers} />}
      {subTab === "campaigns" && <CampaignsTab headers={headers} />}
    </div>
  );
};

const CustomersTab = ({ headers }) => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [profile, setProfile] = useState(null);

  const fetchCustomers = useCallback(async (term) => {
    setLoading(true);
    setError("");
    try {
      const qs = term ? `?search=${encodeURIComponent(term)}` : "";
      const res = await fetch(`${API_BASE}/subuser/crm/customers${qs}`, { headers: { Authorization: headers.Authorization } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setCustomers(data.customers || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => {
    const t = setTimeout(() => fetchCustomers(search), 300);
    return () => clearTimeout(t);
  }, [search, fetchCustomers]);

  const openProfile = async (id) => {
    setSelectedId(id);
    setProfile(null);
    try {
      const res = await fetch(`${API_BASE}/subuser/crm/customers/${id}`, { headers: { Authorization: headers.Authorization } });
      const data = await res.json();
      if (res.ok) setProfile(data);
    } catch {
      // handled by selectedId staying set with no profile -> shows loading state
    }
  };

  if (selectedId) {
    return (
      <div className={s.panel}>
        <button className={s.btnSecondary} onClick={() => { setSelectedId(null); setProfile(null); }} style={{ width: "fit-content" }}>
          ← Back to Customers
        </button>
        {!profile ? (
          <div className={s.loadingState}>Loading profile…</div>
        ) : (
          <>
            <div className={s.card}>
              <h3 style={{ margin: 0 }}>{profile.profile.name}</h3>
              <p className={s.panelSubtitle}>{profile.profile.email}</p>
            </div>
            <div className={s.statGrid}>
              <div className={s.statCard}>
                <div className={s.statValue}>{profile.order_count}</div>
                <div className={s.statLabel}>Orders</div>
              </div>
              <div className={s.statCard}>
                <div className={s.statValue}>₹{profile.lifetime_spent.toLocaleString()}</div>
                <div className={s.statLabel}>Lifetime Spent</div>
              </div>
              <div className={s.statCard}>
                <div className={s.statValue}>{profile.complaints.length}</div>
                <div className={s.statLabel}>Complaints</div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={s.panel}>
      <div className={s.formGroup} style={{ maxWidth: 320 }}>
        <label>Search customers</label>
        <input className={s.input} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or email…" />
      </div>
      {error && <div className={s.errorState}>{error}</div>}
      {loading ? (
        <div className={s.loadingState}>Loading customers…</div>
      ) : customers.length === 0 ? (
        <div className={s.emptyState}><span className={s.emptyIcon}>🧑‍🤝‍🧑</span>No customers found.</div>
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead><tr><th>Name</th><th>Email</th><th>Orders</th><th></th></tr></thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c._id}>
                  <td>{c.name}</td>
                  <td>{c.email}</td>
                  <td>{c.order_count}</td>
                  <td><button className={s.btnSecondary} onClick={() => openProfile(c._id)}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const FollowupsTab = ({ headers }) => {
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sendingFor, setSendingFor] = useState(null);
  const [draft, setDraft] = useState({ subject: "", body: "" });

  const fetchFollowups = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/subuser/crm/followups`, { headers: { Authorization: headers.Authorization } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setFollowups(data.followups || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => { fetchFollowups(); }, [fetchFollowups]);

  const startDraft = (row) => {
    setSendingFor(row);
    const defaultSubject = row.reason === "win_back" ? "We miss you at Citimart!" : "How was your order?";
    const defaultBody = row.reason === "win_back"
      ? `Hi ${row.name || "there"}, it's been a while — come check out what's new!`
      : `Hi ${row.name || "there"}, thanks for your recent order! We'd love to hear your feedback.`;
    setDraft({ subject: defaultSubject, body: defaultBody });
  };

  const send = async () => {
    try {
      const res = await fetch(`${API_BASE}/subuser/crm/followups/send`, {
        method: "POST", headers,
        body: JSON.stringify({
          customer_id: sendingFor.customer_id, reason: sendingFor.reason,
          order_id: sendingFor.order_id, subject: draft.subject, body: draft.body,
        }),
      });
      if (!res.ok) throw new Error("Failed to send");
      setSendingFor(null);
      await fetchFollowups();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={s.panel}>
      {error && <div className={s.errorState}>{error}</div>}
      {loading ? (
        <div className={s.loadingState}>Loading follow-ups…</div>
      ) : followups.length === 0 ? (
        <div className={s.emptyState}><span className={s.emptyIcon}>✅</span>Nobody's due for a follow-up right now.</div>
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead><tr><th>Customer</th><th>Reason</th><th>Detail</th><th></th></tr></thead>
            <tbody>
              {followups.map((f, i) => (
                <tr key={i}>
                  <td>{f.name || f.email}</td>
                  <td><span className={reasonBadge(f.reason)}>{f.reason === "win_back" ? "Win-back" : "Post-purchase"}</span></td>
                  <td style={{ maxWidth: 280 }}>{f.detail}</td>
                  <td><button className={s.btnSecondary} onClick={() => startDraft(f)}>Send Follow-up</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sendingFor && (
        <div className={s.modalBackdrop} onClick={() => setSendingFor(null)}>
          <div className={s.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={s.modalHeader}>
              <h3>Follow-up for {sendingFor.name || sendingFor.email}</h3>
              <button className={s.modalClose} onClick={() => setSendingFor(null)}>✕</button>
            </div>
            <div className={s.modalBody}>
              <div className={s.formGroup}>
                <label>Subject</label>
                <input className={s.input} value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} />
              </div>
              <div className={s.formGroup}>
                <label>Message</label>
                <textarea className={s.textarea} rows={5} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
              </div>
              <button className={s.btnPrimary} onClick={send} style={{ width: "fit-content" }}>Send Email</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CampaignsTab = ({ headers }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ subject: "", body: "", audienceType: "all", segment: "vip", emails: "" });

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/subuser/campaigns`, { headers: { Authorization: headers.Authorization } });
      const data = await res.json();
      if (res.ok) setCampaigns(data.campaigns || []);
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.body.trim()) return;
    setSending(true);
    setError("");
    try {
      const audience = form.audienceType === "segment"
        ? { type: "segment", segment: form.segment }
        : form.audienceType === "custom"
          ? { type: "custom", emails: form.emails.split(",").map((e) => e.trim()).filter(Boolean) }
          : { type: "all" };

      const res = await fetch(`${API_BASE}/subuser/campaigns`, {
        method: "POST", headers,
        body: JSON.stringify({ subject: form.subject, body: form.body, audience }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      setForm({ subject: "", body: "", audienceType: "all", segment: "vip", emails: "" });
      await fetchCampaigns();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={s.panel}>
      {error && <div className={s.errorState}>{error}</div>}

      <form onSubmit={submit} className={s.card}>
        <div className={s.formGrid}>
          <div className={s.formGroup}>
            <label>Subject</label>
            <input className={s.input} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          </div>
          <div className={s.formGroup}>
            <label>Audience</label>
            <select className={s.select} value={form.audienceType} onChange={(e) => setForm({ ...form, audienceType: e.target.value })}>
              <option value="all">All customers</option>
              <option value="segment">A segment</option>
              <option value="custom">Specific emails</option>
            </select>
          </div>
          {form.audienceType === "segment" && (
            <div className={s.formGroup}>
              <label>Segment</label>
              <input className={s.input} value={form.segment} onChange={(e) => setForm({ ...form, segment: e.target.value })} />
            </div>
          )}
          {form.audienceType === "custom" && (
            <div className={s.formGroup}>
              <label>Emails (comma-separated)</label>
              <input className={s.input} value={form.emails} onChange={(e) => setForm({ ...form, emails: e.target.value })} />
            </div>
          )}
        </div>
        <div className={s.formGroup} style={{ marginTop: 12 }}>
          <label>Message (use {"{{name}}"} to personalize)</label>
          <textarea className={s.textarea} rows={5} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
        </div>
        <button className={s.btnPrimary} type="submit" disabled={sending} style={{ marginTop: 12, width: "fit-content" }}>
          {sending ? "Sending…" : "Send Campaign"}
        </button>
      </form>

      {loading ? (
        <div className={s.loadingState}>Loading sent campaigns…</div>
      ) : campaigns.length === 0 ? (
        <div className={s.emptyState}><span className={s.emptyIcon}>📨</span>No campaigns sent yet.</div>
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead><tr><th>Subject</th><th>Recipients</th><th>Sent</th><th>Date</th></tr></thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c._id}>
                  <td>{c.subject}</td>
                  <td>{c.recipient_count}</td>
                  <td>{c.sent_count}</td>
                  <td>{c.sentAt ? new Date(c.sentAt).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CustomerCrmPanel;
