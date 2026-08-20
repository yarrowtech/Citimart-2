import React, { useEffect, useState, useCallback, useMemo } from "react";
import { API_BASE } from "../../../config";
import s from "../SubuserShared.module.css";

const EMPTY_FORM = { title: "", body: "", page: "home", status: "draft" };
const PAGES = ["home", "about", "policy", "shipping", "returns"];

const ContentPanel = ({ token }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" }),
    [token]
  );

  const fetchContent = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/subuser/content`, { headers: { Authorization: headers.Authorization } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setItems(data.content || []);
    } catch (err) {
      setError(err.message || "Failed to load content");
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => { fetchContent(); }, [fetchContent]);

  const openCreate = () => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true); };
  const openEdit = (item) => {
    setForm({ title: item.title, body: item.body, page: item.page, status: item.status });
    setEditingId(item._id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const url = editingId ? `${API_BASE}/subuser/content/${editingId}` : `${API_BASE}/subuser/content`;
      const res = await fetch(url, { method: editingId ? "PUT" : "POST", headers, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setShowForm(false);
      await fetchContent();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this content block?")) return;
    try {
      const res = await fetch(`${API_BASE}/subuser/content/${id}`, { method: "DELETE", headers: { Authorization: headers.Authorization } });
      if (!res.ok) throw new Error("Delete failed");
      await fetchContent();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={s.panel}>
      <div className={s.panelHeader}>
        <div>
          <h2 className={s.panelTitle}>Content Curation</h2>
          <p className={s.panelSubtitle}>Text blocks and copy shown across storefront pages.</p>
        </div>
        <button className={s.btnPrimary} onClick={openCreate}>+ New Block</button>
      </div>

      {error && <div className={s.errorState}>{error}</div>}

      {loading ? (
        <div className={s.loadingState}>Loading content…</div>
      ) : items.length === 0 ? (
        <div className={s.emptyState}><span className={s.emptyIcon}>📝</span>No content blocks yet.</div>
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead><tr><th>Title</th><th>Page</th><th>Status</th><th style={{ textAlign: "right" }}>Action</th></tr></thead>
            <tbody>
              {items.map((c) => (
                <tr key={c._id}>
                  <td>{c.title}</td>
                  <td><span className={`${s.badge} ${s.badgeBlue}`}>{c.page}</span></td>
                  <td><span className={`${s.badge} ${c.status === "published" ? s.badgeGreen : s.badgeGray}`}>{c.status}</span></td>
                  <td>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button className={s.btnIcon} onClick={() => openEdit(c)}>✏️</button>
                      <button className={s.btnDanger} onClick={() => handleDelete(c._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <>
          <div className={s.modalBackdrop} onClick={() => setShowForm(false)} />
          <div className={s.modalCard}>
            <div className={s.modalHeader}>
              <h3>{editingId ? "Edit Content" : "New Content Block"}</h3>
              <button className={s.modalClose} onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className={s.modalBody}>
              <div className={s.formGroup}>
                <label>Title</label>
                <input className={s.input} required value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className={s.formGroup}>
                <label>Body</label>
                <textarea className={s.textarea} required value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })} />
              </div>
              <div className={s.formGrid}>
                <div className={s.formGroup}>
                  <label>Page</label>
                  <select className={s.select} value={form.page}
                    onChange={(e) => setForm({ ...form, page: e.target.value })}>
                    {PAGES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className={s.formGroup}>
                  <label>Status</label>
                  <select className={s.select} value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
              <button type="submit" className={s.btnPrimary} disabled={saving}>
                {saving ? "Saving…" : editingId ? "Save Changes" : "Create Content"}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default ContentPanel;
