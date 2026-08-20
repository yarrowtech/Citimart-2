import React, { useEffect, useState, useCallback, useMemo } from "react";
import { API_BASE } from "../../../config";
import s from "../SubuserShared.module.css";

const EMPTY_FORM = {
  title: "", description: "", discount: "", code: "", type: "popup",
  start_date: "", end_date: "", min_purchase: "", max_discount: "",
};

const statusBadge = (status) => {
  if (status === "active") return `${s.badge} ${s.badgeGreen}`;
  if (status === "upcoming") return `${s.badge} ${s.badgeBlue}`;
  return `${s.badge} ${s.badgeGray}`;
};

const OffersPanel = ({ token, label }) => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/subuser/offers`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setOffers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load offers");
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => { fetchOffers(); }, [fetchOffers]);

  const openCreate = () => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true); };
  const openEdit = (offer) => {
    setForm({
      title: offer.title || "", description: offer.description || "",
      discount: offer.discount ?? "", code: offer.code || "", type: offer.type || "popup",
      start_date: offer.start_date ? offer.start_date.slice(0, 16) : "",
      end_date: offer.end_date ? offer.end_date.slice(0, 16) : "",
      min_purchase: offer.min_purchase ?? "", max_discount: offer.max_discount ?? "",
    });
    setEditingId(offer._id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body = new FormData();
      Object.entries(form).forEach(([k, v]) => body.append(k, v));
      const url = editingId ? `${API_BASE}/subuser/offers/${editingId}` : `${API_BASE}/subuser/offers`;
      const res = await fetch(url, { method: editingId ? "PUT" : "POST", headers, body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setShowForm(false);
      await fetchOffers();
    } catch (err) {
      setError(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this offer permanently?")) return;
    try {
      const res = await fetch(`${API_BASE}/subuser/offers/${id}`, { method: "DELETE", headers });
      if (!res.ok) throw new Error("Delete failed");
      await fetchOffers();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={s.panel}>
      <div className={s.panelHeader}>
        <div>
          <h2 className={s.panelTitle}>{label || "Promotions"}</h2>
          <p className={s.panelSubtitle}>Create and manage live discount offers and campaigns.</p>
        </div>
        <button className={s.btnPrimary} onClick={openCreate}>+ New Offer</button>
      </div>

      {error && <div className={s.errorState}>{error}</div>}

      {loading ? (
        <div className={s.loadingState}>Loading offers…</div>
      ) : offers.length === 0 ? (
        <div className={s.emptyState}>
          <span className={s.emptyIcon}>🏷️</span>
          No offers yet — create your first one.
        </div>
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Title</th><th>Code</th><th>Discount</th><th>Status</th><th>Ends</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((o) => (
                <tr key={o._id}>
                  <td>{o.title}</td>
                  <td>{o.code || "—"}</td>
                  <td>{o.discount}%</td>
                  <td><span className={statusBadge(o.status)}>{o.status}</span></td>
                  <td>{o.end_date ? new Date(o.end_date).toLocaleDateString() : "—"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button className={s.btnIcon} onClick={() => openEdit(o)} title="Edit">✏️</button>
                      <button className={s.btnDanger} onClick={() => handleDelete(o._id)}>Delete</button>
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
              <h3>{editingId ? "Edit Offer" : "New Offer"}</h3>
              <button className={s.modalClose} onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className={s.modalBody}>
              <div className={s.formGroup}>
                <label>Title</label>
                <input className={s.input} required value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className={s.formGroup}>
                <label>Description</label>
                <textarea className={s.textarea} value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className={s.formGrid}>
                <div className={s.formGroup}>
                  <label>Discount %</label>
                  <input className={s.input} type="number" required value={form.discount}
                    onChange={(e) => setForm({ ...form, discount: e.target.value })} />
                </div>
                <div className={s.formGroup}>
                  <label>Coupon Code (optional)</label>
                  <input className={s.input} value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })} />
                </div>
              </div>
              <div className={s.formGrid}>
                <div className={s.formGroup}>
                  <label>Start</label>
                  <input className={s.input} type="datetime-local" required value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                </div>
                <div className={s.formGroup}>
                  <label>End</label>
                  <input className={s.input} type="datetime-local" required value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                </div>
              </div>
              <button type="submit" className={s.btnPrimary} disabled={saving}>
                {saving ? "Saving…" : editingId ? "Save Changes" : "Create Offer"}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default OffersPanel;
