import React, { useEffect, useState, useCallback, useMemo } from "react";
import { API_BASE } from "../../../config";
import s from "../SubuserShared.module.css";

const EMPTY_FORM = { name: "", slug: "", description: "", products: [] };

const CollectionsPanel = ({ token }) => {
  const [collections, setCollections] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
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

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/subuser/collections`, { headers: { Authorization: headers.Authorization } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setCollections(data.collections || []);
    } catch (err) {
      setError(err.message || "Failed to load collections");
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => {
    fetchCollections();
    fetch(`${API_BASE}/api/products`)
      .then((res) => res.json())
      .then((data) => setAllProducts(data.products || []))
      .catch(() => setAllProducts([]));
  }, [fetchCollections]);

  const openCreate = () => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true); };
  const openEdit = (col) => {
    setForm({
      name: col.name || "", slug: col.slug || "", description: col.description || "",
      products: col.products || [],
    });
    setEditingId(col._id);
    setShowForm(true);
  };

  const toggleProduct = (product) => {
    const isSelected = form.products.some((p) => p._id === product._id);
    setForm({
      ...form,
      products: isSelected ? form.products.filter((p) => p._id !== product._id) : [...form.products, product],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const url = editingId ? `${API_BASE}/subuser/collections/${editingId}` : `${API_BASE}/subuser/collections`;
      const payload = { ...form, role: "merchandise" };
      const res = await fetch(url, { method: editingId ? "PUT" : "POST", headers, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setShowForm(false);
      await fetchCollections();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this collection?")) return;
    try {
      const res = await fetch(`${API_BASE}/subuser/collections/${id}?role=merchandise`, {
        method: "DELETE", headers: { Authorization: headers.Authorization },
      });
      if (!res.ok) throw new Error("Delete failed");
      await fetchCollections();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={s.panel}>
      <div className={s.panelHeader}>
        <div>
          <h2 className={s.panelTitle}>Collections</h2>
          <p className={s.panelSubtitle}>Curated product groupings shown on the storefront.</p>
        </div>
        <button className={s.btnPrimary} onClick={openCreate}>+ New Collection</button>
      </div>

      {error && <div className={s.errorState}>{error}</div>}

      {loading ? (
        <div className={s.loadingState}>Loading collections…</div>
      ) : collections.length === 0 ? (
        <div className={s.emptyState}><span className={s.emptyIcon}>🗂️</span>No collections yet.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {collections.map((c) => (
            <div key={c._id} className={s.card}>
              <h3 style={{ margin: "0 0 4px", fontSize: 14.5, fontWeight: 800, color: "#111827" }}>{c.name}</h3>
              <p style={{ margin: "0 0 10px", fontSize: 12, color: "#6b7280" }}>{c.description || "No description"}</p>
              <span className={`${s.badge} ${s.badgeBlue}`}>{(c.products || []).length} products</span>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button className={s.btnIcon} onClick={() => openEdit(c)}>✏️</button>
                <button className={s.btnDanger} onClick={() => handleDelete(c._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <>
          <div className={s.modalBackdrop} onClick={() => setShowForm(false)} />
          <div className={s.modalCard}>
            <div className={s.modalHeader}>
              <h3>{editingId ? "Edit Collection" : "New Collection"}</h3>
              <button className={s.modalClose} onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className={s.modalBody}>
              <div className={s.formGrid}>
                <div className={s.formGroup}>
                  <label>Name</label>
                  <input className={s.input} required value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className={s.formGroup}>
                  <label>Slug</label>
                  <input className={s.input} value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                </div>
              </div>
              <div className={s.formGroup}>
                <label>Description</label>
                <textarea className={s.textarea} value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className={s.formGroup}>
                <label>Products ({form.products.length} selected)</label>
                <div style={{ maxHeight: 200, overflowY: "auto", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: 8 }}>
                  {allProducts.map((p) => (
                    <label key={p._id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 4px", fontSize: 12.5 }}>
                      <input type="checkbox" checked={form.products.some((sel) => sel._id === p._id)} onChange={() => toggleProduct(p)} />
                      {p.name} — ₹{p.price}
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit" className={s.btnPrimary} disabled={saving}>
                {saving ? "Saving…" : editingId ? "Save Changes" : "Create Collection"}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default CollectionsPanel;
