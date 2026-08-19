import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./AdminCollections.module.css";
import { API_BASE as BACKEND_BASE } from "../../config";

const API_BASE = `${BACKEND_BASE}/api/products/collections`;

const AdminCollections = () => {
  const [collections, setCollections] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [newCollection, setNewCollection] = useState({
    name: "",
    slug: "",
    description: "",
    products: [],
  });

  // -------------------- Fetch Data --------------------
  useEffect(() => {
    fetchCollections();
    fetchProducts();
  }, []);

  const fetchCollections = async () => {
    setLoadingCollections(true);
    try {
      const res = await axios.get(API_BASE);
      setCollections(res.data.collections || []);
    } catch (err) {
      console.error("❌ Error fetching collections:", err);
    } finally {
      setLoadingCollections(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${BACKEND_BASE}/api/products`);
      setAllProducts(res.data.products || []);
    } catch (err) {
      console.error("❌ Error fetching products:", err);
    }
  };

  // -------------------- Helpers --------------------
  const totalStock = (product) => {
    if (product.variants?.length > 0) {
      return product.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
    }
    return Number(product.stock ?? 0);
  };

  const handleCollectionChange = (field, value) => {
    setNewCollection({ ...newCollection, [field]: value });
  };

  const handleProductToggle = (id) => {
    const exists = newCollection.products.find((p) => p._id === id);
    if (exists) {
      setNewCollection({
        ...newCollection,
        products: newCollection.products.filter((p) => p._id !== id),
      });
    } else {
      const prod = allProducts.find((p) => p._id === id);
      if (prod) {
        setNewCollection({
          ...newCollection,
          products: [...newCollection.products, prod],
        });
      }
    }
  };

  const saveCollection = async () => {
  // --- Basic validation ---
  if (!newCollection.name.trim()) {
    alert("Please enter a collection name.");
    return;
  }
  if (!newCollection.slug.trim()) {
    alert("Please enter a slug.");
    return;
  }
  if (!newCollection.description.trim()) {
    alert("Please enter a description.");
    return;
  }
  if (newCollection.products.length === 0) {
    alert("Please select at least one product.");
    return;
  }

  try {
    if (editingCollection) {
      await axios.put(`${API_BASE}/${editingCollection._id}`, {
        ...newCollection,
        products: newCollection.products.map((p) => p._id),
        role: "admin",
      });
      alert("✅ Collection updated successfully!");
    } else {
      await axios.post(API_BASE, {
        ...newCollection,
        products: newCollection.products.map((p) => p._id),
        role: "admin",
      });
      alert("✅ Collection added successfully!");
    }

    // Reset form
    setEditingCollection(null);
    setNewCollection({ name: "", slug: "", description: "", products: [] });
    fetchCollections();
  } catch (err) {
    console.error("❌ Error saving collection:", err);
    alert("Error saving collection. Check the console for details.");
  }
};


  const editCollection = (c) => {
    setEditingCollection(c);
    setNewCollection({
      name: c.name,
      slug: c.slug,
      description: c.description,
      products: c.products || [],
    });
  };

  const deleteCollection = async (id) => {
    if (!window.confirm("Delete this collection?")) return;
    try {
      await axios.delete(`${API_BASE}/${id}?role=admin`);
      fetchCollections();
    } catch (err) {
      console.error("❌ Error deleting collection:", err);
    }
  };

  // -------------------- Render --------------------
  return (
    <div className={styles.collectionsTab}>
      <h3>🗂️ Admin Collections</h3>

      {loadingCollections ? (
        <p>Loading collections...</p>
      ) : (
        <div className={styles.collectionList}>
          {collections.length > 0 ? (
            collections.map((c) => (
              <div key={c._id} className={styles.collectionCard}>
                <div className={styles.collectionHeader}>
                  <strong>{c.name || "Unnamed Collection"}</strong>
                  <div className={styles.collectionActions}>
                    <button onClick={() => editCollection(c)}>✏️ Edit</button>
                    <button onClick={() => deleteCollection(c._id)}>🗑️ Delete</button>
                  </div>
                </div>

                {c.products?.length > 0 && (
                  <ul className={styles.productList}>
                    {c.products.map((p) => (
                      <li key={p._id} className={styles.productItem}>
                        <img
                          src={p.images?.[0] || "/placeholder.png"}
                          alt={p.name || "Unnamed"}
                          className={styles.productImage}
                        />
                        <div className={styles.productInfo}>
                          <strong>{p.name}</strong> – ₹{p.price || 0} | Stock:{" "}
                          {totalStock(p)} | Brand: {p.brand || "-"}
                          {p.variants?.length > 0 && (
                            <> | Variants: {p.variants.map((v) => v.size).join(", ")}</>
                          )}
                          {p.discount ? ` | Discount: ${p.discount}%` : ""}

                          {/* Colors + Sizes */}
                          <div className={styles.productColors}>
                            {p.variants?.map((v, idx) => (
                              <div
                                key={idx}
                                className={styles.colorCircle}
                                style={{ backgroundColor: v.color || "#ccc" }}
                              >
                                {v.size || ""}
                              </div>
                            ))}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))
          ) : (
            <p>No collections yet.</p>
          )}
        </div>
      )}

      {/* Add / Edit Collection Form */}
      <div className={styles.collectionForm}>
        <h4>{editingCollection ? "Edit Collection" : "Add New Collection"}</h4>
        <input
          type="text"
          placeholder="Name"
          value={newCollection.name}
          onChange={(e) => handleCollectionChange("name", e.target.value)}
        />
        <input
          type="text"
          placeholder="Slug"
          value={newCollection.slug}
          onChange={(e) => handleCollectionChange("slug", e.target.value)}
        />
        <input
          type="text"
          placeholder="Description"
          value={newCollection.description}
          onChange={(e) => handleCollectionChange("description", e.target.value)}
        />

        {/* Product selection */}
        <div className={styles.productSelectionContainer}>
          <p>Select Products:</p>
          {allProducts.map((p) => {
            const isChecked = newCollection.products.some((prod) => prod._id === p._id);
            return (
              <label key={p._id} className={styles.productSelectionLabel}>
                <input
                  type="checkbox"
                  className={styles.collectionCheckbox}
                  checked={isChecked}
                  onChange={() => handleProductToggle(p._id)}
                />
                <img
                  src={p.images?.[0] || "/placeholder.png"}
                  alt={p.name || "Unnamed"}
                />
                <div>
                  <strong>{p.name}</strong>
                  <br />
                  Price: ₹{p.price || 0} | Stock: {totalStock(p)} | Brand: {p.brand || "-"}
                  {p.variants?.length > 0 && (
                    <> | Variants: {p.variants.map((v) => v.size).join(", ")}</>
                  )}
                  {p.discount ? ` | Discount: ${p.discount}%` : ""}

                  <div className={styles.productColors}>
                    {p.variants?.map((v, idx) => (
                      <div
                        key={idx}
                        className={styles.colorCircle}
                        style={{ backgroundColor: v.color || "#ccc" }}
                      >
                        {v.size || ""}
                      </div>
                    ))}
                  </div>
                </div>
              </label>
            );
          })}
        </div>

        <button onClick={saveCollection} className={styles.primaryBtn}>
          {editingCollection ? "Update Collection" : "Add Collection"}
        </button>
        {editingCollection && (
          <button
            className={styles.cancelBtn}
            onClick={() => {
              setEditingCollection(null);
              setNewCollection({ name: "", slug: "", description: "", products: [] });
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

export default AdminCollections;
