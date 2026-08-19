// src/pages/admin/HomepageCatalog.jsx
import React, { useState, useEffect } from "react";
import styles from "./HomepageCatalog.module.css"; // keep your CSS module
import { API_BASE } from "../../config";

const HomepageCatalog = () => {
  const [formData, setFormData] = useState({
    heroBanners: [],
    categories: [],
    trendingNow: [],
    featuredProducts: [],
    brands: [],
    reviews: [],
  });

  // local input states
  const [newBannerUrl, setNewBannerUrl] = useState("");
  const [bannerFile, setBannerFile] = useState(null);

  const [newCategory, setNewCategory] = useState({ name: "", image: "" });
  const [categoryFile, setCategoryFile] = useState(null);

  const [newTrending, setNewTrending] = useState({ name: "", price: "", image: "" });
  const [trendingFile, setTrendingFile] = useState(null);

  const [newFeatured, setNewFeatured] = useState({ name: "", price: "", image: "" });
  const [featuredFile, setFeaturedFile] = useState(null);

  const [newBrand, setNewBrand] = useState({ name: "", image: "" });
  const [brandFile, setBrandFile] = useState(null);

  const [newReview, setNewReview] = useState({ name: "", text: "", image: "" });
  const [reviewFile, setReviewFile] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
useEffect(() => {
  fetch(`${API_BASE}/api/products`)
    .then(r => r.json())
    .then(d => setAllProducts(d.products || d || []));
}, []);


  // fetch current homepage data
  useEffect(() => {
    fetch(`${API_BASE}/api/homepage`)
      .then((r) => r.json())
      .then((d) => setFormData(d || {}))
      .catch((e) => console.error("Failed to load homepage:", e));
  }, []);

  // generic helpers
  const addItem = (key, item) => {
    if (item == null) return;
    setFormData((p) => ({ ...p, [key]: [...(p[key] || []), item] }));
  };

  const removeItem = (key, idx) => {
    setFormData((p) => ({ ...p, [key]: p[key].filter((_, i) => i !== idx) }));
  };

  const uploadFile = async (file) => {
    if (!file) return null;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(`${API_BASE}/api/upload`, { method: "POST", body: fd });
      const j = await res.json();
      if (res.ok && j.url) return j.url;
      console.error("Upload error:", j);
      return null;
    } catch (err) {
      console.error("Upload failed:", err);
      return null;
    }
  };

  const handleSave = async () => {
    // Save full form data to backend
    try {
      const res = await fetch(`${API_BASE}/api/homepage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        alert("Homepage saved successfully.");
      } else {
        const j = await res.json();
        alert("Save failed: " + (j.error || "unknown"));
      }
    } catch (e) {
      console.error(e);
      alert("Save failed.");
    }
  };

  // ---- Banner helpers ----
  const handleBannerFileChange = (e) => setBannerFile(e.target.files?.[0] || null);

  const addBannerFromFile = async () => {
    if (bannerFile) {
      const url = await uploadFile(bannerFile);
      if (url) addItem("heroBanners", url);
      setBannerFile(null);
    } else if (newBannerUrl) {
      addItem("heroBanners", newBannerUrl);
      setNewBannerUrl("");
    }
  };

  // ---- Category helpers ----
  const handleCategoryFile = (e) => setCategoryFile(e.target.files?.[0] || null);
  const addCategory = async () => {
    let imageUrl = newCategory.image;
    if (categoryFile) {
      const url = await uploadFile(categoryFile);
      if (url) imageUrl = url;
      setCategoryFile(null);
    }
    if (!newCategory.name || !imageUrl) {
      return alert("Provide category name and image (file or URL).");
    }
    addItem("categories", { name: newCategory.name, image: imageUrl });
    setNewCategory({ name: "", image: "" });
  };

  // ---- Trending helpers ----
  const handleTrendingFile = (e) => setTrendingFile(e.target.files?.[0] || null);
  const addTrending = async () => {
  let img = newTrending.image;
  if (trendingFile) {
    const url = await uploadFile(trendingFile);
    if (url) img = url;
    setTrendingFile(null);
  }
  if (!newTrending.product_id) return alert("Enter product ID (Mongo _id)");
  addItem("trendingNow", { ...newTrending, image: img, product_id: newTrending.product_id });
  setNewTrending({ name: "", price: "", image: "", product_id: "" });
};


  // ---- Featured helpers ----
  const handleFeaturedFile = (e) => setFeaturedFile(e.target.files?.[0] || null);
  const addFeatured = async () => {
    let img = newFeatured.image;
    if (featuredFile) {
      const url = await uploadFile(featuredFile);
      if (url) img = url;
      setFeaturedFile(null);
    }
    if (!newFeatured.name) return alert("Enter product name");
    addItem("featuredProducts", { ...newFeatured, image: img });
    setNewFeatured({ name: "", price: "", image: "" });
  };

  // ---- Brand helpers ----
  const handleBrandFile = (e) => setBrandFile(e.target.files?.[0] || null);
  const addBrand = async () => {
    let img = newBrand.image;
    if (brandFile) {
      const url = await uploadFile(brandFile);
      if (url) img = url;
      setBrandFile(null);
    }
    if (!newBrand.name || !img) return alert("Brand name and image required");
    addItem("brands", { ...newBrand, image: img });
    setNewBrand({ name: "", image: "" });
  };

  // ---- Review helpers ----
  const handleReviewFile = (e) => setReviewFile(e.target.files?.[0] || null);
  const addReview = async () => {
    let img = newReview.image;
    if (reviewFile) {
      const url = await uploadFile(reviewFile);
      if (url) img = url;
      setReviewFile(null);
    }
    if (!newReview.name || !newReview.text) return alert("Name & review required");
    addItem("reviews", { ...newReview, image: img });
    setNewReview({ name: "", text: "", image: "" });
  };

  // ---- Render ----
  return (
    <div className={styles.container}>
      <h1>Homepage Catalog Manager</h1>

      {/* HERO BANNERS */}
      <section className={styles.section}>
        <h2>Hero Banners</h2>
        <div className={styles.grid}>
          {formData.heroBanners?.map((b, i) => (
            <div className={styles.card} key={i}>
              <img src={b} alt={`banner-${i}`} />
              <button className={styles.removeBtn} onClick={() => removeItem("heroBanners", i)}>Remove</button>
            </div>
          ))}
        </div>

        <div className={styles.row}>
          <input
            type="text"
            placeholder="Or paste banner image URL"
            value={newBannerUrl}
            onChange={(e) => setNewBannerUrl(e.target.value)}
          />
          <input type="file" accept="image/*" onChange={handleBannerFileChange} />
          <button onClick={addBannerFromFile}>Add Banner</button>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className={styles.section}>
        <h2>Categories</h2>
        <div className={styles.grid}>
          {formData.categories?.map((c, i) => (
            <div className={styles.card} key={i}>
              <img src={c.image} alt={c.name} />
              <div className={styles.cardBody}>
                <strong>{c.name}</strong>
                <button className={styles.removeBtn} onClick={() => removeItem("categories", i)}>Remove</button>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.row}>
          <input type="text" placeholder="Category name" value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} />
          <input type="text" placeholder="Or image URL" value={newCategory.image} onChange={(e) => setNewCategory({ ...newCategory, image: e.target.value })} />
          <input type="file" accept="image/*" onChange={handleCategoryFile} />
          <button onClick={addCategory}>Add Category</button>
        </div>
      </section>

      {/* TRENDING */}
      <section className={styles.section}>
        <h2>Trending Now</h2>
        <div className={styles.grid}>
          {formData.trendingNow?.map((p, i) => (
            <div className={styles.card} key={i}>
              <img src={p.image} alt={p.name} />
              <div className={styles.cardBody}>
                <strong>{p.name}</strong>
                <span>₹{p.price}</span>
                <button className={styles.removeBtn} onClick={() => removeItem("trendingNow", i)}>Remove</button>
              </div>
            </div>
          ))}
        </div>

       <select
  value={newTrending.product_id || ""}
  onChange={(e) => {
    const selectedProduct = allProducts.find(p => p._id === e.target.value);
    setNewTrending({
      ...newTrending,
      product_id: e.target.value,
      name: selectedProduct?.name || "",
      price: selectedProduct?.price || "",
      image: selectedProduct?.images?.[0] || "",
    });
  }}
>
  <option value="">Select Product</option>
  {allProducts.map(p => (
    <option key={p._id} value={p._id}>
      {p.name}
    </option>
  ))}
</select>

<input type="text" placeholder="Product name" 
  value={newTrending.name} 
  onChange={(e) => setNewTrending({ ...newTrending, name: e.target.value })} 
/>
<input type="number" placeholder="Price" 
  value={newTrending.price} 
  onChange={(e) => setNewTrending({ ...newTrending, price: e.target.value })} 
/>
<input type="text" placeholder="Or image URL" 
  value={newTrending.image} 
  onChange={(e) => setNewTrending({ ...newTrending, image: e.target.value })} 
/>
<input type="file" accept="image/*" onChange={handleTrendingFile} />
<button onClick={addTrending}>Add Trending</button>

      </section>

      {/* FEATURED */}
      <section className={styles.section}>
        <h2>Featured Products</h2>
        <div className={styles.grid}>
          {formData.featuredProducts?.map((p, i) => (
            <div className={styles.card} key={i}>
              <img src={p.image} alt={p.name} />
              <div className={styles.cardBody}>
                <strong>{p.name}</strong>
                <span>₹{p.price}</span>
                <button className={styles.removeBtn} onClick={() => removeItem("featuredProducts", i)}>Remove</button>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.row}>
         <select
  value={newFeatured.product_id || ""}
  onChange={(e) => {
    const selected = allProducts.find(p => p._id === e.target.value);
    setNewFeatured({
      ...newFeatured,
      product_id: e.target.value,
      name: selected?.name || "",
      price: selected?.price || "",
      image: selected?.images?.[0] || "",
    });
  }}
>
  <option value="">Select Product</option>
  {allProducts.map(p => (
    <option key={p._id} value={p._id}>{p.name}</option>
  ))}
</select>

<input
  type="text"
  placeholder="Or override image URL"
  value={newFeatured.image}
  onChange={(e) => setNewFeatured({ ...newFeatured, image: e.target.value })}
/>
<input type="file" accept="image/*" onChange={handleFeaturedFile} />
<button onClick={addFeatured}>Add Featured</button>

        </div>
      </section>

     {/* BRANDS */}
<section className={styles.section}>
  <h2>Brands</h2>
  <div className={styles.grid}>
    {formData.brands?.map((b, i) => (
      <div className={styles.card} key={i}>
        <img src={b.image} alt={b.name} />
        <div className={styles.cardBody}>
          <strong>{b.name}</strong>
          <button
            className={styles.removeBtn}
            onClick={() => removeItem("brands", i)}
          >
            Remove
          </button>
        </div>
      </div>
    ))}
  </div>

  <div className={styles.row}>
    {/* ✅ Select brand from dropdown */}
    <select
      value={newBrand.name || ""}
      onChange={(e) => {
        const brandName = e.target.value;
        // Try to find one product to grab image for brand (if exists)
        const product = allProducts.find(
          (p) => p.brand?.toLowerCase() === brandName.toLowerCase()
        );
        setNewBrand({
          name: brandName,
          image: product?.brandImage || product?.images?.[0] || "",
        });
      }}
    >
      <option value="">Select Brand</option>
      {/* ✅ Get unique brands from products */}
      {[...new Set(allProducts.map((p) => p.brand).filter(Boolean))].map(
        (bname) => (
          <option key={bname} value={bname}>
            {bname}
          </option>
        )
      )}
    </select>

    <input
      type="text"
      placeholder="Or image URL"
      value={newBrand.image}
      onChange={(e) =>
        setNewBrand({ ...newBrand, image: e.target.value })
      }
    />
    <input type="file" accept="image/*" onChange={handleBrandFile} />
    <button
      onClick={() => {
        if (!newBrand.name) return alert("Select or enter a brand name");
        addBrand(newBrand);
        setNewBrand({ name: "", image: "" });
      }}
    >
      Add Brand
    </button>
  </div>
</section>


      {/* REVIEWS */}
      <section className={styles.section}>
        <h2>Customer Reviews</h2>
        <div className={styles.grid}>
          {formData.reviews?.map((r, i) => (
            <div className={styles.card} key={i}>
              <img src={r.image} alt={r.name} />
              <div className={styles.cardBody}>
                <strong>{r.name}</strong>
                <p>{r.text}</p>
                <button className={styles.removeBtn} onClick={() => removeItem("reviews", i)}>Remove</button>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.row}>
          <input type="text" placeholder="Customer name" value={newReview.name} onChange={(e) => setNewReview({ ...newReview, name: e.target.value })} />
          <input type="text" placeholder="Review text" value={newReview.text} onChange={(e) => setNewReview({ ...newReview, text: e.target.value })} />
          <input type="text" placeholder="Or image URL" value={newReview.image} onChange={(e) => setNewReview({ ...newReview, image: e.target.value })} />
          <input type="file" accept="image/*" onChange={handleReviewFile} />
          <button onClick={addReview}>Add Review</button>
        </div>
      </section>

      <div className={styles.actionsRow}>
        <button className={styles.saveBtn} onClick={handleSave}>💾 Save Homepage</button>
      </div>
    </div>
  );
};

export default HomepageCatalog;
