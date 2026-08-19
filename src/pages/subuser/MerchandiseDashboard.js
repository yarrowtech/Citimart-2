
import React, { useState, useEffect } from "react";
import { useCallback } from "react";

import { useNavigate } from "react-router-dom";
import styles from "./MerchandiseDashboard.module.css";

import { API_BASE } from "../../config";
const TABS = ["Products", "Inventory", "Categories", "Collections", "Media", "Pricing","Promotions"];

const MerchandiseDashboard = () => {
  const [activeTab, setActiveTab] = useState("Products");
  const navigate = useNavigate();

  //  Logout handler
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("permissions");
    alert("You have been logged out!");
    navigate("/subuser/login");
  };

  // ------------------- Products -------------------
  const [products, setProducts] = useState([]);
  const [productForm, setProductForm] = useState({ name: "", description: "", price: "" });

  const addProduct = (e) => {
    e.preventDefault();
    setProducts([...products, { ...productForm, id: Date.now(), stock: 0 }]);
    setProductForm({ name: "", description: "", price: "" });
  };

  // ------------------- Inventory -------------------
const [inventoryProducts, setInventoryProducts] = useState([]);
const [loadingInventory, setLoadingInventory] = useState(true);
const [updatingStock, setUpdatingStock] = useState(null); // productId while updating
const [adjustForm, setAdjustForm] = useState({}); // { [variantId]: { type: "add"|"remove", qty: 0, reason: "" } }

// Fetch products from backend (with variants + stock)
useEffect(() => {
  const fetchInventory = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/products`);
      const data = await res.json();
      setInventoryProducts(data.products || []);
    } catch (err) {
      console.error("Error fetching inventory:", err);
      setInventoryProducts([]);
    } finally {
      setLoadingInventory(false);
    }
  };
  fetchInventory();
}, []);

// Handle stock adjustment input
const handleAdjustChange = (variantId, field, value) => {
  setAdjustForm({
    ...adjustForm,
    [variantId]: {
      ...adjustForm[variantId],
      [field]: value,
    },
  });
};

// Helper to normalize MongoDB number objects
const getNumber = (val) => {
  if (val == null) return 0;
  if (typeof val === "object") {
    if ("$numberInt" in val) return parseInt(val.$numberInt, 10);
    if ("$numberDouble" in val) return parseFloat(val.$numberDouble);
  }
  return val;
};

const updateVariantStock = async (productId, variantId, currentStockRaw) => {
  const form = adjustForm[variantId];
  if (!form || !form.qty || form.qty <= 0) return;

  const currentStock = getNumber(currentStockRaw);
  if (isNaN(currentStock)) {
    console.error("Invalid current stock for variant:", variantId, currentStockRaw);
    return;
  }

  const adjustment = form.type === "remove" ? -form.qty : +form.qty;
  const newStock = currentStock + adjustment;

  setUpdatingStock(productId);

  try {
    const res = await fetch(`${API_BASE}/api/products/${productId}/stock`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        variantId,
        stock: newStock,
        reason: form.reason || "Manual Update",
      }),
    });

    const data = await res.json();

    if (res.ok) {
      // Update local state
      setInventoryProducts(
        inventoryProducts.map((p) =>
          p._id === productId
            ? {
                ...p,
                variants: p.variants.map((v) =>
                  v._id === variantId ? { ...v, stock: newStock } : v
                ),
              }
            : p
        )
      );

      setAdjustForm({ ...adjustForm, [variantId]: {} }); // reset form
    } else {
      alert(data.error || "Failed to update stock");
    }
  } catch (err) {
    console.error("Error updating stock:", err);
  } finally {
    setUpdatingStock(null);
  }
};

 const normalizeValue = (val) => {
  if (val && typeof val === "object") {
    if (val.$numberInt) return parseInt(val.$numberInt, 10);
    if (val.$numberDouble) return parseFloat(val.$numberDouble);
  }
  return val;
};



  // ------------------- Categories -------------------
const [categories, setCategories] = useState([]);
const [loadingCategories, setLoadingCategories] = useState(true);
const [editingCategory, setEditingCategory] = useState(null); // for editing mode
const [categoryForm, setCategoryForm] = useState({
  category: "",
  subcategories: [{ name: "", children: [""] }],
});


// Handle subcategory name change
const handleSubChange = (index, value) => {
  const updated = [...categoryForm.subcategories];
  updated[index].name = value;
  setCategoryForm({ ...categoryForm, subcategories: updated });
};

// Handle child name change
const handleChildChange = (subIndex, childIndex, value) => {
  const updated = [...categoryForm.subcategories];
  updated[subIndex].children[childIndex] = value;
  setCategoryForm({ ...categoryForm, subcategories: updated });
};

// Add new child input
const addChild = (subIndex) => {
  const updated = [...categoryForm.subcategories];
  updated[subIndex].children.push("");
  setCategoryForm({ ...categoryForm, subcategories: updated });
};

// Add new subcategory input
const addSubcategory = () => {
  setCategoryForm({
    ...categoryForm,
    subcategories: [...categoryForm.subcategories, { name: "", children: [""] }],
  });
};

//  Fetch from backend
useEffect(() => {
  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/categories`);
      const data = await res.json();

      const formatted = (Array.isArray(data) ? data : data.categories || []).map((cat) => ({
        ...cat,
        subCategories: (cat.subCategories || []).map((sub) => ({
          ...sub,
          children: Array.isArray(sub.childCategories) ? sub.childCategories : [],
        })),
      }));

      setCategories(formatted);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  fetchCategories();
}, []);

const handleAddCategory = async () => {
  if (!categoryForm.category.trim()) return;

  //  Correct payload for backend
  const newCategory = {
    category: categoryForm.category.trim(), // use 'category' not 'name'
    subcategories: categoryForm.subcategories
      .filter((s) => s.name.trim() !== "")
      .map((s) => ({
        name: s.name.trim(),
        children: s.children.filter((c) => c.trim() !== ""),
      })),
  };

  try {
    const res = await fetch(`${API_BASE}/api/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCategory),
    });

    const savedCat = await res.json();
    setCategories([...categories, savedCat]); // add the new category to state
    setCategoryForm({ category: "", subcategories: [{ name: "", children: [""] }] });
  } catch (err) {
    console.error("Error adding category:", err);
  }
};


const handleEditCategory = (cat) => {

  setEditingCategory(cat.id);

  setCategoryForm({
    category: cat.name,
    subcategories: Array.isArray(cat.subCategories) && cat.subCategories.length
      ? cat.subCategories.map((s) => ({
          name: s.name || "",
          children: Array.isArray(s.children) ? s.children : [],
        }))
      : [{ name: "", children: [""] }],
  });
};

const handleUpdateCategory = async () => {
  if (!categoryForm.category.trim()) return;

  const updatedCategory = {
    id: editingCategory,
    name: categoryForm.category.trim(),
    subCategories: categoryForm.subcategories
      .filter((s) => s.name.trim() !== "")
      .map((s) => ({
        name: s.name.trim(),
        children: s.children.filter((c) => c.trim() !== ""),
      })),
  };

  try {
    const res = await fetch(`${API_BASE}/api/categories/${editingCategory}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedCategory),
    });

    const savedCat = await res.json();
    setCategories(
      categories.map((cat) => (cat.id === savedCat.id ? savedCat : cat))
    );
    setEditingCategory(null);
    setCategoryForm({ category: "", subcategories: [{ name: "", children: [""] }] });
  } catch (err) {
    console.error("Error updating category:", err);
  }
};


// ------------------- Collections -------------------
const [collections, setCollections] = useState([]);
const [newCollection, setNewCollection] = useState({
  name: "",
  slug: "",
  description: "",
  products: [],
});
const [editingCollection, setEditingCollection] = useState(null);
const [loadingCollections, setLoadingCollections] = useState(true);

// Fetch collections from backend
useEffect(() => {
  const fetchCollections = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/products/collections`);
      const data = await res.json();
      setCollections(data.collections || []);
    } catch (err) {
      console.error("Error fetching collections:", err);
      setCollections([]);
    } finally {
      setLoadingCollections(false);
    }
  };
  fetchCollections();
}, []);

// Fetch all products for selection
const [allProducts, setAllProducts] = useState([]);
useEffect(() => {
  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/products`);
      const data = await res.json();
      setAllProducts(data.products || []);
    } catch (err) {
      console.error("Error fetching products:", err);
      setAllProducts([]);
    }
  };
  fetchProducts();
}, []);

// Handle input changes
const handleCollectionChange = (field, value) => {
  setNewCollection({ ...newCollection, [field]: value });
};

// Toggle product selection
const handleProductToggle = (productId) => {
  const selectedProduct = allProducts.find((p) => p._id === productId);
  if (!selectedProduct) return;

  const isSelected = newCollection.products.some((p) => p._id === productId);
  let updatedProducts;
  if (isSelected) {
    updatedProducts = newCollection.products.filter((p) => p._id !== productId);
  } else {
    updatedProducts = [...newCollection.products, selectedProduct];
  }
  setNewCollection({ ...newCollection, products: updatedProducts });
};

// Save Collection (Add / Update)
const saveCollection = async () => {
  if (!newCollection.name.trim()) return;

  try {
    const url = editingCollection
      ? `${API_BASE}/api/products/collections/${editingCollection}`
      : `${API_BASE}/api/products/collections`;

    const method = editingCollection ? "PUT" : "POST";

    // Send full product objects to backend
    const payload = {
      ...newCollection,
      products: newCollection.products.map((p) => ({
        _id: p._id,
        name: p.name,
        price: p.price,
        stock: p.stock,
        brand: p.brand,
        variants: p.variants,
        images: p.images,
        discount: p.discount,
      })),
      role: "merchandise",
    };

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!editingCollection) {
      setCollections([...collections, data.collection]);
    } else {
      setCollections(
        collections.map((c) =>
          c._id === editingCollection ? { ...c, ...payload } : c
        )
      );
    }

    setNewCollection({ name: "", slug: "", description: "", products: [] });
    setEditingCollection(null);
  } catch (err) {
    console.error("Error saving collection:", err);
  }
};

// Edit Collection
const editCollection = (collection) => {
  setEditingCollection(collection._id);
  setNewCollection({
    name: collection.name,
    slug: collection.slug || "",
    description: collection.description || "",
    products: (collection.products || []).map(pid =>
      allProducts.find(p => p._id === (typeof pid === "string" ? pid : pid._id))
    ).filter(Boolean), // filter out undefined
  });
};


// Delete Collection
const deleteCollection = async (id) => {
  if (!window.confirm("Are you sure you want to delete this collection?")) return;
  try {
    const res = await fetch(
      `${API_BASE}/api/products/collections/${id}?role=merchandise`,
      { method: "DELETE" }
    );
    const data = await res.json();
    if (res.ok) {
      setCollections(collections.filter((c) => c._id !== id));
    } else {
      alert(data.error || "Failed to delete");
    }
  } catch (err) {
    console.error("Error deleting collection:", err);
  }
};

const totalStock = (product) => {
  if (!product.variants || product.variants.length === 0) return 0;
  return product.variants.reduce((sum, v) => {
    // Handle number or {$numberInt: "x"}
    let stock = v.stock;
    if (typeof stock === 'object' && '$numberInt' in stock) {
      stock = parseInt(stock.$numberInt);
    }
    return sum + (stock || 0);
  }, 0);
};


  // ------------------- Media -------------------
  const [mediaFiles, setMediaFiles] = useState([]); // { file, url, cloudinaryId }

const handleDrop = useCallback((e) => {
  e.preventDefault();
  const files = Array.from(e.dataTransfer.files);
  uploadFiles(files);
}, []);

const handleFileSelect = (e) => {
  const files = Array.from(e.target.files);
  uploadFiles(files);
};

// Upload to Cloudinary
const uploadFiles = async (files) => {
  const uploaded = await Promise.all(
    files.map(async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "YOUR_CLOUDINARY_PRESET"); // replace with your preset

      try {
        const res = await fetch(
          "https://api.cloudinary.com/v1_1/YOUR_CLOUDINARY_CLOUD_NAME/image/upload", 
          { method: "POST", body: formData }
        );
        const data = await res.json();
        return { file, url: data.secure_url, cloudinaryId: data.public_id };
      } catch (err) {
        console.error("Cloudinary upload error:", err);
        return null;
      }
    })
  );

  setMediaFiles((prev) => [...prev, ...uploaded.filter(Boolean)]);
};

// Delete from Cloudinary
const deleteMedia = async (index) => {
  const file = mediaFiles[index];
  if (!window.confirm("Delete this image?")) return;

  try {
    // Optional: Call your backend to delete image from Cloudinary using file.cloudinaryId
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  } catch (err) {
    console.error("Failed to delete:", err);
  }
};

// Drag-over handler
const handleDragOver = (e) => e.preventDefault();

  // ------------------- Pricing -------------------
  const [discounts, setDiscounts] = useState([]);
  const [discountForm, setDiscountForm] = useState({ productId: "", percent: "" });

  const addDiscount = (e) => {
    e.preventDefault();
    if (!discountForm.productId || !discountForm.percent) return;
    setDiscounts([...discounts, { ...discountForm, id: Date.now() }]);
    setDiscountForm({ productId: "", percent: "" });
  };

//------------ Promotions ------------
 // ----------- Promotions Section (Improved) -----------
const [promotions, setPromotions] = useState([]);
const [promotionForm, setPromotionForm] = useState({
  _id: null, // for edit
  title: "",
  description: "",
  type: "offer", // 'offer' or 'campaign'
  productIds: [],
  discount: "",
});

// Fetch promotions
useEffect(() => {
  const fetchPromotions = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/promotions`);
      const data = await res.json();
      setPromotions(data.promotions || []);
    } catch (err) {
      console.error("Error fetching promotions:", err);
      setPromotions([]);
    }
  };
  fetchPromotions();
}, []);

const handlePromotionChange = (field, value) => {
  setPromotionForm({ ...promotionForm, [field]: value });
};

const handlePromotionProductToggle = (productId) => {
  const isSelected = promotionForm.productIds.includes(productId);
  const updated = isSelected
    ? promotionForm.productIds.filter((id) => id !== productId)
    : [...promotionForm.productIds, productId];
  setPromotionForm({ ...promotionForm, productIds: updated });
};

const savePromotion = async () => {
  // Validation
  if (!promotionForm.title.trim()) return alert("Title is required");
  if (promotionForm.productIds.length === 0) return alert("Select at least one product");
  if (!promotionForm.discount || promotionForm.discount < 0 || promotionForm.discount > 100) return alert("Discount must be 0-100%");

  try {
    const url = promotionForm._id
      ? `${API_BASE}/api/promotions/${promotionForm._id}`
      : `${API_BASE}/api/promotions`;
    const method = promotionForm._id ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(promotionForm),
    });
    const data = await res.json();

    if (promotionForm._id) {
      setPromotions(promotions.map(p => p._id === promotionForm._id ? data.promotion : p));
    } else {
      setPromotions([...promotions, data.promotion]);
    }

    setPromotionForm({ _id: null, title: "", description: "", type: "offer", productIds: [], discount: "" });
  } catch (err) {
    console.error("Error saving promotion:", err);
  }
};

const editPromotion = (p) => {
  setPromotionForm({
    _id: p._id,
    title: p.title,
    description: p.description,
    type: p.type,
    productIds: p.productIds || [],
    discount: p.discount || "",
  });
};

const deletePromotion = async (id) => {
  if (!window.confirm("Are you sure you want to delete this promotion?")) return;
  try {
    const res = await fetch(`${API_BASE}/api/promotions/${id}`, { method: "DELETE" });
    if (res.ok) setPromotions(promotions.filter(p => p._id !== id));
  } catch (err) {
    console.error("Error deleting promotion:", err);
  }
};

const renderPromotions = () => (
  <div>
    <h3>🎉 Promotions & Offers</h3>

    {/* Add/Edit Form */}
    <div className={styles.promotionForm}>
      <input type="text" placeholder="Title" value={promotionForm.title} onChange={e => handlePromotionChange('title', e.target.value)} />
      <input type="text" placeholder="Description" value={promotionForm.description} onChange={e => handlePromotionChange('description', e.target.value)} />
      <select value={promotionForm.type} onChange={e => handlePromotionChange('type', e.target.value)}>
        <option value="offer">Offer</option>
        <option value="campaign">Campaign</option>
      </select>
      <input type="number" placeholder="Discount %" value={promotionForm.discount} onChange={e => handlePromotionChange('discount', e.target.value)} />

      <div className={styles.productSelectionContainer}>
        <p>Select Products:</p>
        {allProducts.map(p => {
          const isChecked = promotionForm.productIds.includes(p._id);
          return (
            <label key={p._id} className={styles.productSelectionLabel}>
              <input type="checkbox" checked={isChecked} onChange={() => handlePromotionProductToggle(p._id)} />
              <img src={p.images?.[0] || '/placeholder.png'} alt={p.name} width={30} />
              {p.name} – ₹{p.price}
            </label>
          );
        })}
      </div>

      <button onClick={savePromotion} className={styles.primaryBtn}>{promotionForm._id ? "Update" : "Add"} {promotionForm.type}</button>
      {promotionForm._id && <button onClick={() => setPromotionForm({ _id: null, title: "", description: "", type: "offer", productIds: [], discount: "" })}>Cancel</button>}
    </div>

    {/* List */}
    <h4>Offers</h4>
    <ul className={styles.promotionList}>
      {promotions.filter(p => p.type === 'offer').map(p => (
        <li key={p._id}>
          <strong>{p.title}</strong> – {p.discount}% off | Products: {p.productIds.length}
          <button onClick={() => editPromotion(p)}>✏️</button>
          <button onClick={() => deletePromotion(p._id)}>🗑️</button>
        </li>
      ))}
      {promotions.filter(p => p.type === 'offer').length === 0 && <p>No offers yet.</p>}
    </ul>

    <h4>Campaigns</h4>
    <ul className={styles.promotionList}>
      {promotions.filter(p => p.type === 'campaign').map(p => (
        <li key={p._id}>
          <strong>{p.title}</strong> – {p.discount}% off | Products: {p.productIds.length}
          <button onClick={() => editPromotion(p)}>✏️</button>
          <button onClick={() => deletePromotion(p._id)}>🗑️</button>
        </li>
      ))}
      {promotions.filter(p => p.type === 'campaign').length === 0 && <p>No campaigns yet.</p>}
    </ul>
  </div>
);

  // ------------------- Render Tabs -------------------
  const renderContent = () => {
    switch (activeTab) {
      case "Products":
        return (
          <div>
            <h3>📦 Products</h3>
            <form onSubmit={addProduct}>
              <input
                type="text"
                placeholder="Product Name"
                value={productForm.name}
                onChange={(e) =>
                  setProductForm({ ...productForm, name: e.target.value })
                }
                required
              />
              <input
                type="text"
                placeholder="Description"
                value={productForm.description}
                onChange={(e) =>
                  setProductForm({ ...productForm, description: e.target.value })
                }
                required
              />
              <input
                type="number"
                placeholder="Price"
                value={productForm.price}
                onChange={(e) =>
                  setProductForm({ ...productForm, price: e.target.value })
                }
                required
              />
              <button type="submit">Add Product</button>
            </form>

            <ul>
              {products.map((p) => (
                <li key={p.id}>
                  {p.name} – ₹{p.price} ({p.description})
                </li>
              ))}
            </ul>
          </div>
        );

     case "Inventory":
  
  const getNumber = (val) => {
    if (val == null) return 0;
    if (typeof val === "object") {
      if ("$numberInt" in val) return parseInt(val.$numberInt);
      if ("$numberDouble" in val) return parseFloat(val.$numberDouble);
    }
    return val;
  };

  return (
    <div>
      <h3>📊 Inventory Management</h3>

      {loadingInventory ? (
        <p>Loading inventory...</p>
      ) : inventoryProducts.length === 0 ? (
        <p>No products available.</p>
      ) : (
        <div>
          {inventoryProducts.map((p) => (
            <div key={p._id} className={styles.inventoryCard}>
              <div className={styles.productHeader}>
                <img
                  src={p.images?.[0] || "/placeholder.png"}
                  alt={p.name}
                  className={styles.productImage}
                />
                <div>
                  <strong>{p.name}</strong> <br />
                   Brand: {p.brand || "—"} | Price: ₹{getNumber(p.price)} | Discount: {getNumber(p.discount)}%
                </div>
              </div>

              {/* Variants Table */}
              {p.variants?.length > 0 ? (
                <table className={styles.variantTable}>
                  <thead>
                    <tr>
                      <th>Variant</th>
                      <th>Color</th>
                      <th>SKU</th> 
                      <th>Stock</th>
                      <th>Adjust</th>
                      <th>Reason</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.variants.map((v) => {
                      const form = adjustForm[v._id] || {};
                      return (
                        <tr key={v._id}>
                          <td>{v.size || "—"}</td>
                          <td>
                            <div
                              className={styles.colorCircle}
                              style={{ backgroundColor: v.color || "#ccc" }}
                            />
                          </td>
                           <td
  style={{ cursor: "pointer", color: "#007bff" }}
  title="Click to copy SKU"
  onClick={() => {
    navigator.clipboard.writeText(v.sku || "");
    alert(`SKU copied: ${v.sku}`);
  }}
>
  {v.sku || "—"}
</td>

                          <td>{getNumber(v.stock)}</td>
                          <td>
                            <select
                              value={form.type || "add"}
                              onChange={(e) =>
                                handleAdjustChange(v._id, "type", e.target.value)
                              }
                            >
                              <option value="add">Add</option>
                              <option value="remove">Remove</option>
                            </select>
                            <input
                              type="number"
                              min="1"
                              value={form.qty || ""}
                              onChange={(e) =>
                                handleAdjustChange(v._id, "qty", parseInt(e.target.value))
                              }
                              className={styles.qtyInput}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              placeholder="Reason"
                              value={form.reason || ""}
                              onChange={(e) =>
                                handleAdjustChange(v._id, "reason", e.target.value)
                              }
                            />
                          </td>
                          <td>
                            <button
                              disabled={updatingStock === p._id}
                              onClick={() => updateVariantStock(p._id, v._id, getNumber(v.stock))}
                            >
                              {updatingStock === p._id ? "Updating..." : "Save"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p>No variants found.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );


          case "Categories":
  return (
    <div className={styles.categoriesTab}>
      <h3>📂 Categories</h3>

      {loadingCategories ? (
        <p>Loading categories...</p>
      ) : (
        <div className={styles.categoriesList}>
          {Array.isArray(categories) && categories.length > 0 ? (
            categories.map((cat) => (
              <div key={cat.id} className={styles.categoryCard}>
                <div className={styles.categoryHeader}>
                  <strong>{cat.name}</strong>
                  <button
                    className={styles.editBtn}
                    onClick={() => handleEditCategory(cat)}
                  >
                    ✏️ Edit
                  </button>
                </div>
                <div className={styles.subcategories}>
                  {cat.subCategories?.map((sub, idx) => (
                    <div key={idx} className={styles.subcategory}>
                      <em>{sub.name}</em>
                      <ul>
                        {sub.children?.map((child, j) => (
                          <li key={j}>{child}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p>No categories available</p>
          )}
        </div>
      )}

      {/* Add / Edit Category Form */}
      <div className={styles.categoryForm}>
        <h4>{editingCategory ? "Edit Category" : "Add New Category"}</h4>

        <input
          type="text"
          placeholder="Category"
          value={categoryForm.category}
          onChange={(e) =>
            setCategoryForm({ ...categoryForm, category: e.target.value })
          }
          className={styles.inputField}
        />

        {categoryForm.subcategories.map((sub, i) => (
          <div key={i} className={styles.subFormRow}>
            <input
              type="text"
              placeholder="Subcategory"
              value={sub.name}
              onChange={(e) => handleSubChange(i, e.target.value)}
              className={styles.inputField}
            />
            {sub.children.map((child, j) => (
              <input
                key={j}
                type="text"
                placeholder="Child"
                value={child}
                onChange={(e) => handleChildChange(i, j, e.target.value)}
                className={styles.inputField}
              />
            ))}
            <button
              type="button"
              className={styles.addBtn}
              onClick={() => addChild(i)}
            >
              ➕ Add Child
            </button>
          </div>
        ))}

        <div className={styles.formActions}>
          <button type="button" className={styles.addBtn} onClick={addSubcategory}>
            ➕ Add Subcategory
          </button>

          {editingCategory ? (
            <>
              <button
                type="button"
                className={styles.submitBtn}
                onClick={handleUpdateCategory}
              >
                ✅ Update Category
              </button>
              <button
                type="button"
                className={styles.resetBtn}
                onClick={() => {
                  setEditingCategory(null);
                  setCategoryForm({ category: "", subcategories: [{ name: "", children: [""] }] });
                }}
              >
                🔄 Reset
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={styles.submitBtn}
                onClick={handleAddCategory}
              >
                ✅ Submit Category
              </button>
              <button
                type="button"
                className={styles.resetBtn}
                onClick={() =>
                  setCategoryForm({ category: "", subcategories: [{ name: "", children: [""] }] })
                }
              >
                🔄 Reset
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );


     case "Collections":
  return (
    <div className={styles.collectionsTab}>
      <h3>🗂️ Collections</h3>

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
                          {Number(p.stock ?? 0)} | Brand: {p.brand || "-"}
                          {p.variants?.length > 0 && (
                            <>
                              | Variants:{" "}
                              {p.variants.map((v) => v.size).join(", ")}
                            </>
                          )}
                          {p.discount ? ` | Discount: ${p.discount}%` : ""}

                          {/* Color + size circles */}
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
            const isChecked = newCollection.products.some(
              (prod) => prod._id === p._id
            );
            return (
              <label key={p._id} className={styles.productSelectionLabel}>
                <input
                  type="checkbox"
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
                  Price: ₹{p.price || 0} | Stock: {totalStock(p)} | Brand:{" "}
                  {p.brand || "-"}
                  {p.variants?.length > 0 && (
                    <> | Variants: {p.variants.map((v) => v.size).join(", ")}</>
                  )}
                  {p.discount ? ` | Discount: ${p.discount}%` : ""}
                  {/* Variant circles */}
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
              setNewCollection({
                name: "",
                slug: "",
                description: "",
                products: [],
              });
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );


     case "Media":
  return (
    <div className={styles.mediaTab}>
      <h3>🖼️ Media</h3>
      <div
        className={styles.dropZone}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <p>Drag & drop files here or click to select</p>
        <input
          type="file"
          multiple
          onChange={handleFileSelect}
          style={{ display: "none" }}
          id="fileInput"
        />
        <label htmlFor="fileInput" className={styles.fileInputLabel}>
          Browse Files
        </label>
      </div>

      <div className={styles.mediaGrid}>
        {mediaFiles.map((m, i) => (
          <div key={i} className={styles.mediaCard}>
            <img src={m.url} alt="uploaded" />
            <button
              onClick={() => deleteMedia(i)}
              className={styles.deleteBtn}
            >
              ❌
            </button>
          </div>
        ))}
      </div>
    </div>
  );

 case "Promotions":
  return renderPromotions();
      case "Pricing":
        return (
          <div>
            <h3>💰 Pricing</h3>
            <form onSubmit={addDiscount}>
              <select
                value={discountForm.productId}
                onChange={(e) =>
                  setDiscountForm({ ...discountForm, productId: e.target.value })
                }
              >
                <option value="">Select Product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Discount %"
                value={discountForm.percent}
                onChange={(e) =>
                  setDiscountForm({ ...discountForm, percent: e.target.value })
                }
              />
              <button type="submit">Add Discount</button>
            </form>

            <ul>
              {discounts.map((d) => {
                const product = products.find((p) => p.id === d.productId);
                return (
                  <li key={d.id}>
                    {product?.name || "Unknown"} – {d.percent}% off
                  </li>
                );
              })}
            </ul>
          </div>
        );
       
      default:
        return <p>Select a module from the sidebar.</p>;
    }
  };
  
  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <h3>Merchandise Subuser</h3>
        <ul>
          {TABS.map((tab) => (
            <li
              key={tab}
              className={activeTab === tab ? styles.active : ""}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </li>
          ))}
          
        </ul>
        <button onClick={handleLogout} className={styles.logoutBtn}>
          🚪 Logout
        </button>
      </aside>

      {/* Content */}
      <main className={styles.content}>{renderContent()}</main>
    </div>
  );
};

export default MerchandiseDashboard;
