import React, { useEffect, useState, useCallback, useMemo } from "react";
import { API_BASE } from "../../../config";
import s from "../SubuserShared.module.css";

const EMPTY_FORM = { category: "", subcategories: [{ name: "", children: [""] }] };

const CategoriesPanel = ({ token }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState({});

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" }),
    [token]
  );

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/subuser/categories`, { headers: { Authorization: headers.Authorization } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setCategories(data.categories || []);
    } catch (err) {
      setError(err.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const toggleExpand = (name) => setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));

  const updateSub = (i, value) => {
    const subs = [...form.subcategories];
    subs[i] = { ...subs[i], name: value };
    setForm({ ...form, subcategories: subs });
  };
  const updateChild = (subIndex, childIndex, value) => {
    const subs = [...form.subcategories];
    const children = [...subs[subIndex].children];
    children[childIndex] = value;
    subs[subIndex] = { ...subs[subIndex], children };
    setForm({ ...form, subcategories: subs });
  };
  const addChildField = (subIndex) => {
    const subs = [...form.subcategories];
    subs[subIndex] = { ...subs[subIndex], children: [...subs[subIndex].children, ""] };
    setForm({ ...form, subcategories: subs });
  };
  const addSubField = () => {
    setForm({ ...form, subcategories: [...form.subcategories, { name: "", children: [""] }] });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.category.trim()) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        category: form.category.trim(),
        subcategories: form.subcategories
          .filter((sub) => sub.name.trim())
          .map((sub) => ({ name: sub.name.trim(), children: sub.children.filter((c) => c.trim()) })),
      };
      const res = await fetch(`${API_BASE}/subuser/categories`, { method: "POST", headers, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setForm(EMPTY_FORM);
      setShowForm(false);
      await fetchCategories();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const renameCategory = async (oldName) => {
    const newName = window.prompt("Rename category to:", oldName);
    if (!newName || newName.trim() === oldName) return;
    try {
      const res = await fetch(`${API_BASE}/subuser/categories/edit`, {
        method: "PUT", headers, body: JSON.stringify({ type: "category", old_name: oldName, new_name: newName.trim() }),
      });
      if (!res.ok) throw new Error("Rename failed");
      await fetchCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteCategory = async (name) => {
    if (!window.confirm(`Delete category "${name}" and all its subcategories?`)) return;
    try {
      const res = await fetch(`${API_BASE}/subuser/categories/delete`, {
        method: "DELETE", headers, body: JSON.stringify({ type: "category", name }),
      });
      if (!res.ok) throw new Error("Delete failed");
      await fetchCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteSubcategory = async (parentCategory, subName) => {
    if (!window.confirm(`Delete subcategory "${subName}"?`)) return;
    try {
      const res = await fetch(`${API_BASE}/subuser/categories/delete`, {
        method: "DELETE", headers, body: JSON.stringify({ type: "subcategory", name: subName, parentCategory }),
      });
      if (!res.ok) throw new Error("Delete failed");
      await fetchCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteChild = async (parentCategory, parentSub, childName) => {
    if (!window.confirm(`Delete "${childName}"?`)) return;
    try {
      const res = await fetch(`${API_BASE}/subuser/categories/delete`, {
        method: "DELETE", headers, body: JSON.stringify({ type: "child", name: childName, parentCategory, parentSub }),
      });
      if (!res.ok) throw new Error("Delete failed");
      await fetchCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={s.panel}>
      <div className={s.panelHeader}>
        <div>
          <h2 className={s.panelTitle}>Category Management</h2>
          <p className={s.panelSubtitle}>The category / subcategory / child tree used across the storefront.</p>
        </div>
        <button className={s.btnPrimary} onClick={() => setShowForm(true)}>+ New Category</button>
      </div>

      {error && <div className={s.errorState}>{error}</div>}

      {loading ? (
        <div className={s.loadingState}>Loading categories…</div>
      ) : categories.length === 0 ? (
        <div className={s.emptyState}><span className={s.emptyIcon}>📂</span>No categories yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {categories.map((cat) => (
            <div key={cat._id || cat.name} className={s.card}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <button
                  onClick={() => toggleExpand(cat.name)}
                  style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 800, color: "#111827" }}
                >
                  <span>{expanded[cat.name] ? "▾" : "▸"}</span> {cat.name}
                  <span className={`${s.badge} ${s.badgeBlue}`}>{(cat.subCategories || []).length} sub</span>
                </button>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className={s.btnIcon} onClick={() => renameCategory(cat.name)} title="Rename">✏️</button>
                  <button className={s.btnDanger} onClick={() => deleteCategory(cat.name)}>Delete</button>
                </div>
              </div>

              {expanded[cat.name] && (
                <div style={{ marginTop: 14, paddingLeft: 22, display: "flex", flexDirection: "column", gap: 10 }}>
                  {(cat.subCategories || []).length === 0 && (
                    <p style={{ color: "#9ca3af", fontSize: 12.5 }}>No subcategories.</p>
                  )}
                  {(cat.subCategories || []).map((sub) => (
                    <div key={sub.name}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{sub.name}</span>
                        <button className={s.btnDanger} onClick={() => deleteSubcategory(cat.name, sub.name)}>Delete</button>
                      </div>
                      {(sub.childCategories || []).length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                          {sub.childCategories.map((child) => (
                            <span key={child} className={`${s.badge} ${s.badgeGray}`} style={{ cursor: "pointer" }}
                              onClick={() => deleteChild(cat.name, sub.name, child)} title="Click to delete">
                              {child} ✕
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <>
          <div className={s.modalBackdrop} onClick={() => setShowForm(false)} />
          <div className={s.modalCard}>
            <div className={s.modalHeader}>
              <h3>New Category</h3>
              <button className={s.modalClose} onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleCreate} className={s.modalBody}>
              <div className={s.formGroup}>
                <label>Category Name</label>
                <input className={s.input} required value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </div>

              <div className={s.formGroup}>
                <label>Subcategories</label>
                {form.subcategories.map((sub, i) => (
                  <div key={i} style={{ marginBottom: 10, padding: 10, background: "#f9fafb", borderRadius: 10 }}>
                    <input className={s.input} placeholder="Subcategory name" value={sub.name}
                      onChange={(e) => updateSub(i, e.target.value)} style={{ marginBottom: 8 }} />
                    {sub.children.map((child, ci) => (
                      <input key={ci} className={s.input} placeholder="Child category" value={child}
                        onChange={(e) => updateChild(i, ci, e.target.value)} style={{ marginBottom: 6 }} />
                    ))}
                    <button type="button" className={s.btnSecondary} onClick={() => addChildField(i)}>+ Child</button>
                  </div>
                ))}
                <button type="button" className={s.btnSecondary} onClick={addSubField}>+ Subcategory</button>
              </div>

              <button type="submit" className={s.btnPrimary} disabled={saving}>
                {saving ? "Saving…" : "Create Category"}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default CategoriesPanel;
