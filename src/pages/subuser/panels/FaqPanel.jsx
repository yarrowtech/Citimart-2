import React, { useEffect, useState, useCallback, useMemo } from "react";
import { API_BASE } from "../../../config";
import s from "../SubuserShared.module.css";

const EMPTY_FORM = { question: "", answer: "", category: "General", status: "published" };

const FaqPanel = ({ token }) => {
  const [faqs, setFaqs] = useState([]);
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

  const fetchFaqs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/subuser/faq`, { headers: { Authorization: headers.Authorization } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setFaqs(data.faqs || []);
    } catch (err) {
      setError(err.message || "Failed to load FAQs");
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => { fetchFaqs(); }, [fetchFaqs]);

  const openCreate = () => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true); };
  const openEdit = (faq) => {
    setForm({ question: faq.question, answer: faq.answer, category: faq.category, status: faq.status });
    setEditingId(faq._id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const url = editingId ? `${API_BASE}/subuser/faq/${editingId}` : `${API_BASE}/subuser/faq`;
      const res = await fetch(url, { method: editingId ? "PUT" : "POST", headers, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setShowForm(false);
      await fetchFaqs();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this FAQ?")) return;
    try {
      const res = await fetch(`${API_BASE}/subuser/faq/${id}`, { method: "DELETE", headers: { Authorization: headers.Authorization } });
      if (!res.ok) throw new Error("Delete failed");
      await fetchFaqs();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={s.panel}>
      <div className={s.panelHeader}>
        <div>
          <h2 className={s.panelTitle}>FAQ Management</h2>
          <p className={s.panelSubtitle}>Published here appear live on the storefront FAQ page.</p>
        </div>
        <button className={s.btnPrimary} onClick={openCreate}>+ Add FAQ</button>
      </div>

      {error && <div className={s.errorState}>{error}</div>}

      {loading ? (
        <div className={s.loadingState}>Loading FAQs…</div>
      ) : faqs.length === 0 ? (
        <div className={s.emptyState}><span className={s.emptyIcon}>❓</span>No FAQs yet — add the first one.</div>
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead><tr><th>Question</th><th>Category</th><th>Status</th><th style={{ textAlign: "right" }}>Action</th></tr></thead>
            <tbody>
              {faqs.map((f) => (
                <tr key={f._id}>
                  <td style={{ maxWidth: 320 }}>{f.question}</td>
                  <td>{f.category}</td>
                  <td><span className={`${s.badge} ${f.status === "published" ? s.badgeGreen : s.badgeGray}`}>{f.status}</span></td>
                  <td>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button className={s.btnIcon} onClick={() => openEdit(f)}>✏️</button>
                      <button className={s.btnDanger} onClick={() => handleDelete(f._id)}>Delete</button>
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
              <h3>{editingId ? "Edit FAQ" : "New FAQ"}</h3>
              <button className={s.modalClose} onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className={s.modalBody}>
              <div className={s.formGroup}>
                <label>Question</label>
                <input className={s.input} required value={form.question}
                  onChange={(e) => setForm({ ...form, question: e.target.value })} />
              </div>
              <div className={s.formGroup}>
                <label>Answer</label>
                <textarea className={s.textarea} required value={form.answer}
                  onChange={(e) => setForm({ ...form, answer: e.target.value })} />
              </div>
              <div className={s.formGrid}>
                <div className={s.formGroup}>
                  <label>Category</label>
                  <input className={s.input} value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })} />
                </div>
                <div className={s.formGroup}>
                  <label>Status</label>
                  <select className={s.select} value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>
              <button type="submit" className={s.btnPrimary} disabled={saving}>
                {saving ? "Saving…" : editingId ? "Save Changes" : "Create FAQ"}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default FaqPanel;
