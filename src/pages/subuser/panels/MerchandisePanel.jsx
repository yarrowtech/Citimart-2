import React, { useEffect, useState, useCallback, useMemo } from "react";
import { API_BASE } from "../../../config";
import s from "../SubuserShared.module.css";
import CategoriesPanel from "./CategoriesPanel";
import CollectionsPanel from "./CollectionsPanel";

const SUB_TABS = [
  { key: "inventory", label: "Inventory" },
  { key: "categories", label: "Categories" },
  { key: "collections", label: "Collections" },
];

const InventoryTab = ({ token }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [drafts, setDrafts] = useState({});

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const fetchMerchandise = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/subuser/merchandise`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load merchandise");
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => { fetchMerchandise(); }, [fetchMerchandise]);

  const saveStock = async (item) => {
    const value = drafts[item._id];
    if (value === undefined || value === "" || Number(value) === item.stock) return;
    setSavingId(item._id);
    try {
      const res = await fetch(`${API_BASE}/api/inventory/${item._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: item.productId, sku: item.sku, stock: Number(value) }),
      });
      if (!res.ok) throw new Error("Stock update failed");
      await fetchMerchandise();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  const filtered = items.filter((i) =>
    !search || i.productName?.toLowerCase().includes(search.toLowerCase()) || i.sku?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={s.panel}>
      <div className={s.panelHeader}>
        <div>
          <h2 className={s.panelTitle}>Merchandise & Inventory</h2>
          <p className={s.panelSubtitle}>Live product stock across every SKU.</p>
        </div>
        <input
          className={s.input}
          placeholder="Search product or SKU…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 240 }}
        />
      </div>

      {error && <div className={s.errorState}>{error}</div>}

      {loading ? (
        <div className={s.loadingState}>Loading merchandise…</div>
      ) : filtered.length === 0 ? (
        <div className={s.emptyState}><span className={s.emptyIcon}>🧺</span>No products found.</div>
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Product</th><th>SKU</th><th>Variant</th><th>Price</th><th>Status</th><th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item._id}>
                  <td>{item.productName}</td>
                  <td>{item.sku}</td>
                  <td>{item.variant || "—"}</td>
                  <td>₹{item.price}</td>
                  <td>
                    <span className={`${s.badge} ${item.status === "In Stock" ? s.badgeGreen : s.badgeRed}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <input
                        className={s.input}
                        type="number"
                        style={{ width: 80, padding: "6px 8px" }}
                        defaultValue={item.stock}
                        onChange={(e) => setDrafts({ ...drafts, [item._id]: e.target.value })}
                      />
                      <button
                        className={s.btnSecondary}
                        disabled={savingId === item._id}
                        onClick={() => saveStock(item)}
                      >
                        {savingId === item._id ? "…" : "Save"}
                      </button>
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

const MerchandisePanel = ({ token }) => {
  const [subTab, setSubTab] = useState("inventory");

  return (
    <div className={s.panel}>
      <div style={{ display: "flex", gap: 6 }}>
        {SUB_TABS.map((t) => (
          <button
            key={t.key}
            className={subTab === t.key ? s.btnPrimary : s.btnSecondary}
            onClick={() => setSubTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === "inventory" && <InventoryTab token={token} />}
      {subTab === "categories" && <CategoriesPanel token={token} />}
      {subTab === "collections" && <CollectionsPanel token={token} />}
    </div>
  );
};

export default MerchandisePanel;
