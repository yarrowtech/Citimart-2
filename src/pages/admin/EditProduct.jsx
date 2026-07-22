// import React, { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import styles from "./EditProduct.module.css";
// import axios from "axios";

// // Nested Categories
// const CATEGORY_OPTIONS = {
//   Clothing: {
//     Men: ["Ethnic Wear", "Jeans", "Joggers", "Pants", "Shirts", "T-Shirts"],
//     Women: ["Tops", "Pants", "Jeans", "Skirts", "Ethnic Wear"],
//     "Kids Boys": ["T-Shirts", "Jeans", "Shorts", "Ethnic Wear"],
//     "Kids Girls": ["Dresses", "Tops", "Jeans", "Skirts", "Ethnic Wear"],
//   },
//   Accessories: {
//     "Men's Accessories": ["Belts", "Wallets", "Watches", "Sunglasses"],
//     "Women's Accessories": ["Handbags", "Jewelry", "Watches", "Sunglasses"],
//   },
//   Handmade: {
//     "Art & Crafts": ["Paintings", "Sculptures", "Decor Items"],
//     Jewelry: ["Earrings", "Necklaces", "Bracelets"],
//     Gifts: ["Personalized Gifts", "Handmade Cards", "Gift Hampers"],
//   },
//   "Home & Decor": {
//     Bedsheets: ["Cotton", "Silk", "Printed"],
//     Lighting: ["Lamps", "Ceiling Lights", "Fairy Lights"],
//     Utensils: ["Cookware", "Dinner Sets", "Storage Jars"],
//   },
// };

// // Web-Safe Colors
// const hexValues = ["00", "33", "66", "99", "CC", "FF"];
// const WEB_SAFE_COLORS = [];
// for (let r of hexValues) {
//   for (let g of hexValues) {
//     for (let b of hexValues) {
//       const hex = `#${r}${g}${b}`;
//       WEB_SAFE_COLORS.push({ name: hex, hex });
//     }
//   }
// }

// // Cloudinary Config
// const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dfvrobw6x/image/upload";
// const CLOUDINARY_UPLOAD_PRESET = "Citimart";

// const EditProduct = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();

//   const [productData, setProductData] = useState({
//     name: "",
//     description: "",
//     brand: "",
//     discount: "",
//     status: "active",
//     price: "",
//     category: "",
//     subCategory: "",
//     childCategory: "",
//     variants: [],
//     images: [],
//     specifications: [],
//     pairs_with: [],
//   });

//   const [newImages, setNewImages] = useState([]);
//   const [newImagePreviews, setNewImagePreviews] = useState([]);
//   const [specifications, setSpecifications] = useState([]);
//   const [variantInput, setVariantInput] = useState({ size: "", color: "", stock: "" , sku: ""  });
//   const [colorSearch, setColorSearch] = useState("");
//   const [selectedTab, setSelectedTab] = useState("All");
//   const [pairsWithInput, setPairsWithInput] = useState("");

//   // Fetch product data
//   useEffect(() => {
//     fetch(`http://localhost:5000/api/products/${id}`)
//       .then(res => res.json())
//       .then(data => {
//         if (data.product) {
//           if (data.product.added_by !== "admin") {
//             alert("You cannot edit vendor products.");
//             navigate("/admin/products");
//           } else {
//             setProductData({
//               ...data.product,
//               childCategory: data.product.childCategory || "",
//               pairs_with: data.product.pairs_with || [],
//             });
//             setSpecifications(data.product.specifications || []);
//           }
//         } else {
//           alert("Product not found");
//           navigate("/admin/products");
//         }
//       })
//       .catch(err => {
//         console.error(err);
//         alert("Failed to load product");
//         navigate("/admin/products");
//       });
//   }, [id, navigate]);

//   // Handle input change
//   const handleChange = (e) => {
//     setProductData({ ...productData, [e.target.name]: e.target.value });
//   };

//   // Determine if size is applicable
//   const isSizeApplicable =
//     productData.category === "Clothing" ||
//     (productData.category === "Handmade" && productData.subCategory === "Jewelry");

//   // Variant change
//   const handleVariantChange = (index, field, value) => {
//     const updated = [...productData.variants];
//     updated[index][field] = value;
//     setProductData({ ...productData, variants: updated });
//   };

//   // Add variant with validation
//   const addVariant = () => {
//     if ((isSizeApplicable && !variantInput.size) || !variantInput.color || !variantInput.stock) {
//       alert("Please fill all required fields for the variant.");
//       return;
//     }
//     setProductData(prev => ({ ...prev, variants: [...prev.variants, variantInput] }));
//     setVariantInput({ size: "", color: "", stock: "" , sku: "" });
//   };

//   // Handle new images selection
//   const handleImageChange = (e) => {
//     const files = Array.from(e.target.files);
//     setNewImages(files);
//     setNewImagePreviews(files.map(file => URL.createObjectURL(file)));
//   };

//   // Filter colors by tab
//   const filterByTab = (color) => {
//     if (selectedTab === "All") return true;
//     if (selectedTab === "Red") return color.hex.includes("FF0000") || color.hex.startsWith("#FF");
//     if (selectedTab === "Green") return color.hex.includes("00FF00") || color.hex.startsWith("#0F");
//     if (selectedTab === "Blue") return color.hex.includes("0000FF") || color.hex.startsWith("#00");
//     if (selectedTab === "Gray") return color.hex[1] === color.hex[3] && color.hex[3] === color.hex[5];
//     return true;
//   };
//   const filteredColors = WEB_SAFE_COLORS.filter(
//     c => c.name.toLowerCase().includes(colorSearch.toLowerCase()) && filterByTab(c)
//   );

//   // Upload image to Cloudinary
//   const uploadImage = async (file) => {
//     const formData = new FormData();
//     formData.append("file", file);
//     formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
//     const res = await axios.post(CLOUDINARY_URL, formData);
//     return res.data.secure_url;
//   };

//   // Update product
//   const updateProduct = async (e) => {
//     e.preventDefault();

//     try {
//       // Upload new images
//       const uploadedUrls = [];
//       for (let img of newImages) {
//         const url = await uploadImage(img);
//         uploadedUrls.push(url);
//       }

//       const formData = new FormData();
//       formData.append("name", productData.name);
//       formData.append("description", productData.description);
//       formData.append("brand", productData.brand);
//       formData.append("discount", productData.discount || 0);
//       formData.append("status", productData.status);
//       formData.append("price", productData.price);
//       formData.append("category", productData.category);
//       formData.append("subCategory", productData.subCategory);
//       formData.append("childCategory", productData.childCategory || "");
//       formData.append("variants", JSON.stringify(productData.variants));
//       formData.append("specifications", JSON.stringify(specifications));
//       formData.append("pairs_with", JSON.stringify(productData.pairs_with));
//       formData.append("is_admin", "true");

//       // Append all images (existing + new)
//       productData.images.forEach((img) => formData.append("images", img));
//       uploadedUrls.forEach((url) => formData.append("images", url));

//       const res = await axios.put(`http://localhost:5000/api/products/${id}?is_admin=true`, formData);
//       if (res.status === 200) {
//         alert("✅ Product updated successfully!");
//         navigate("/admin/products");
//       }
//     } catch (err) {
//       console.error(err);
//       alert("⚠️ Failed to update product.");
//     }
//   };

//   return (
//     <div className={styles.editProduct}>
//       <h2>Edit Product</h2>
//       <form onSubmit={updateProduct} encType="multipart/form-data" className={styles.form}>
//         <input name="name" value={productData.name} onChange={handleChange} placeholder="Product Name" required />
//         <input name="brand" value={productData.brand} onChange={handleChange} placeholder="Brand" required />
//         <input name="discount" value={productData.discount} onChange={handleChange} placeholder="Discount %" type="number" />
//         <input name="price" value={productData.price} onChange={handleChange} placeholder="Price" type="number" required />

//         {/* Category selection */}
//         <select
//           name="category"
//           value={productData.category}
//           onChange={(e) =>
//             setProductData({ ...productData, category: e.target.value, subCategory: "", childCategory: "" })
//           }
//           required
//         >
//           <option value="">Select Category</option>
//           {Object.keys(CATEGORY_OPTIONS).map(cat => <option key={cat} value={cat}>{cat}</option>)}
//         </select>

//         <select
//           name="subCategory"
//           value={productData.subCategory}
//           onChange={(e) =>
//             setProductData({ ...productData, subCategory: e.target.value, childCategory: "" })
//           }
//           required
//         >
//           <option value="">Select Subcategory</option>
//           {productData.category && Object.keys(CATEGORY_OPTIONS[productData.category] || {}).map(sub => (
//             <option key={sub} value={sub}>{sub}</option>
//           ))}
//         </select>

//         <select
//           name="childCategory"
//           value={productData.childCategory}
//           onChange={handleChange}
//         >
//           <option value="">Select Child Category (Optional)</option>
//           {productData.category && productData.subCategory &&
//             (CATEGORY_OPTIONS[productData.category]?.[productData.subCategory] || []).map(child => (
//               <option key={child} value={child}>{child}</option>
//             ))}
//         </select>

//         <textarea name="description" value={productData.description} onChange={handleChange} placeholder="Description" required />

//         {/* Variants */}
//         <h4>Add Variant</h4>
//         <div className={styles.variantRow}>
//           {isSizeApplicable && (
//             <input
//               name="size"
//               placeholder="Size"
//               value={variantInput.size}
//               onChange={(e) => setVariantInput({ ...variantInput, size: e.target.value })}
//             />
//           )}
//           <input
//             name="stock"
//             type="number"
//             placeholder="Stock"
//             value={variantInput.stock}
//             onChange={(e) => setVariantInput({ ...variantInput, stock: e.target.value })}
//           />

//            <input
//     name="sku"
//     placeholder="SKU (optional)"
//     value={variantInput.sku}
//     onChange={(e) => setVariantInput({ ...variantInput, sku: e.target.value })}
//   />


//         </div>

//         {/* Color picker */}
//         <div className={styles.colorPalette}>
//           {filteredColors.map(({ name, hex }) => (
//             <div
//               key={hex}
//               className={`${styles.colorCircle} ${variantInput.color === hex ? styles.selected : ""}`}
//               style={{ backgroundColor: hex }}
//               onClick={() => setVariantInput(prev => ({ ...prev, color: hex }))}
//             >
//               <span>{name}</span>
//             </div>
//           ))}
//         </div>

//         <button type="button" onClick={addVariant}>+ Add Variant</button>

//         {productData.variants.length > 0 && (
//           <div>
//             <h5>Existing Variants</h5>
//             {productData.variants.map((v, i) => (
//               <div key={i} className={styles.variantRow}>
//                 {isSizeApplicable && (
//                   <input
//                     value={v.size}
//                     onChange={(e) => handleVariantChange(i, "size", e.target.value)}
//                     placeholder="Size"
//                   />
//                 )}
//                 <div
//   style={{
//     width: "30px",
//     height: "30px",
//     borderRadius: "50%",
//     backgroundColor: v.color,
//     border: "1px solid #000",
//     display: "inline-block",
//     marginRight: "8px",
//   }}
// />
//                 <input
//                   type="number"
//                   value={v.stock}
//                   onChange={(e) => handleVariantChange(i, "stock", e.target.value)}
//                   placeholder="Stock"
//                 />
//                 <input
//       type="text"
//       value={v.sku || ""}
//       onChange={(e) => handleVariantChange(i, "sku", e.target.value)}
//       placeholder="SKU"
//     />
    

//                 <button type="button" onClick={() => {
//                   const updated = [...productData.variants];
//                   updated.splice(i, 1);
//                   setProductData({ ...productData, variants: updated });
//                 }}>❌</button>
//               </div>
//             ))}
//           </div>
//         )}

//         {/* Existing Images */}
// {productData.images.length > 0 && (
//   <div className={styles.imagePreview}>
//     <h4>Existing Images:</h4>
//     <div className={styles.previewGrid}>
//       {productData.images.map((img, i) => (
//         <div key={i} className={styles.previewImgWrapper}>
//           <img
//             src={img.startsWith("http") ? img : `http://localhost:5000/${img}`}
//             alt={`Existing ${i}`}
//             className={styles.previewImg}
//           />
//           <button
//             type="button"
//             className={styles.removeBtn}
//             onClick={() => {
//               setProductData(prev => ({
//                 ...prev,
//                 images: prev.images.filter((_, idx) => idx !== i)
//               }));
//             }}
//           >
//             ❌
//           </button>
//         </div>
//       ))}
//     </div>
//   </div>
// )}


//         {/* New Images */}
//         <div>
//           <label>Upload New Images:</label>
//           <input type="file" multiple accept="image/*" onChange={handleImageChange} />
//           {newImagePreviews.length > 0 && (
//             <div className={styles.previewGrid}>
//               {newImagePreviews.map((src, i) => (
//                 <div key={i} className={styles.previewImgWrapper}>
//                   <img src={src} alt={`New ${i}`} className={styles.previewImg} />
//                   <button type="button" onClick={() => {
//                     setNewImages(newImages.filter((_, idx) => idx !== i));
//                     setNewImagePreviews(newImagePreviews.filter((_, idx) => idx !== i));
//                   }}>❌</button>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         {/* Specifications */}
//         <h4>Specifications</h4>
//         {specifications.map((spec, i) => (
//           <div key={i} className={styles.specRow}>
//             <input
//               placeholder="Label"
//               value={spec.label}
//               onChange={(e) => {
//                 const updated = [...specifications];
//                 updated[i].label = e.target.value;
//                 setSpecifications(updated);
//               }}
//             />
//             <input
//               placeholder="Value"
//               value={spec.value}
//               onChange={(e) => {
//                 const updated = [...specifications];
//                 updated[i].value = e.target.value;
//                 setSpecifications(updated);
//               }}
//             />
//             <button type="button" onClick={() => setSpecifications(specifications.filter((_, idx) => idx !== i))}>❌</button>
//           </div>
//         ))}
//         <button type="button" onClick={() => setSpecifications([...specifications, { label: "", value: "" }])}>➕ Add Specification</button>

//         {/* Pairs With */}
//         <div className={styles.formGroup}>
//           <label>Pairs With (Product IDs)</label>
//           <div className={styles.pairInputRow}>
//             <input type="text" placeholder="Enter product ID" value={pairsWithInput} onChange={(e) => setPairsWithInput(e.target.value)} />
//             <button type="button" onClick={() => {
//               const newId = pairsWithInput.trim();
//               if (newId && !productData.pairs_with.includes(newId)) {
//                 setProductData(prev => ({ ...prev, pairs_with: [...prev.pairs_with, newId] }));
//                 setPairsWithInput("");
//               }
//             }}>➕ Add</button>
//           </div>
//           <div className={styles.pairList}>
//             {productData.pairs_with.map((id, i) => (
//               <div key={i} className={styles.pairItem}>
//                 <span>{id}</span>
//                 <button type="button" onClick={() => setProductData(prev => ({
//                   ...prev,
//                   pairs_with: prev.pairs_with.filter((_, idx) => idx !== i)
//                 }))}>❌</button>
//               </div>
//             ))}
//           </div>
//         </div>

//         <button type="submit">Update Product</button>
//       </form>
//     </div>
//   );
// };

// export default EditProduct;


import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./EditProduct.module.css";
import axios from "axios";

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dfvrobw6x/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "Citimart";

const HEX_VALUES = ["00", "33", "66", "99", "CC", "FF"];
const WEB_SAFE_COLORS = [];
for (let r of HEX_VALUES)
  for (let g of HEX_VALUES)
    for (let b of HEX_VALUES)
      WEB_SAFE_COLORS.push(`#${r}${g}${b}`);

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL"];
const MEASUREMENT_FIELDS = ["chest", "waist", "hips", "shoulder", "length"];

const BLANK_VARIANT = () => ({
  size: "", color: "", colorName: "", colorHex: "", stock: "", sku: "",
  measurements: { chest: "", waist: "", hips: "", shoulder: "", length: "" },
});

// ── Measurement inputs ───────────────────────────────────────────────────────
const MeasurementInputs = ({ values = {}, onChange }) => (
  <div style={{
    marginTop: 8, padding: "10px 12px",
    background: "#f0fdf4", border: "1px solid #bbf7d0",
    borderRadius: 10, display: "flex", flexWrap: "wrap", gap: 8,
  }}>
    <div style={{ width: "100%", fontSize: 12, fontWeight: 600, color: "#166534", marginBottom: 2 }}>
      📐 Measurements (inches) — optional
    </div>
    {MEASUREMENT_FIELDS.map(field => (
      <label key={field} style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 11, color: "#374151" }}>
        <span style={{ textTransform: "capitalize", fontWeight: 600 }}>{field}</span>
        <input type="text" placeholder="e.g. 38" value={values[field] || ""}
          onChange={e => onChange(field, e.target.value)}
          style={{ width: 68, padding: "5px 8px", borderRadius: 7, border: "1px solid #d1d5db", fontSize: 13, outline: "none" }} />
      </label>
    ))}
  </div>
);

// ── Color picker — only sets hex, never colorName ────────────────────────────
const ColorPicker = ({ selectedHex, onSelect }) => {
  const [search, setSearch] = useState("");
  const [tab,    setTab]    = useState("All");

  const filterByTab = hex => {
    if (tab === "All")   return true;
    if (tab === "Red")   return hex.startsWith("#FF") && hex !== "#FFFFFF";
    if (tab === "Green") return hex[3] !== "0" && hex.includes("FF") && !hex.startsWith("#FF");
    if (tab === "Blue")  return hex.endsWith("FF") && !hex.startsWith("#FF");
    if (tab === "Gray")  return hex[1] === hex[3] && hex[3] === hex[5];
    return true;
  };
  const filtered = WEB_SAFE_COLORS.filter(
    hex => hex.toLowerCase().includes(search.toLowerCase()) && filterByTab(hex)
  );

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
        Pick Color (hex) <span style={{ fontWeight: 400, color: "#6b7280" }}>— type name separately above</span>
      </div>
      <input type="text" placeholder="Search hex..." value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e5e7eb",
          fontSize: 12, width: "100%", boxSizing: "border-box", marginBottom: 6 }} />
      <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
        {["All", "Red", "Green", "Blue", "Gray"].map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            style={{ padding: "3px 12px", borderRadius: 20, fontSize: 11,
              border: "none", cursor: "pointer",
              background: tab === t ? "#ff3f6c" : "#f3f4f6",
              color:      tab === t ? "#fff"     : "#374151",
              fontWeight: tab === t ? 700 : 400 }}>{t}</button>
        ))}
      </div>
      {selectedHex && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: "50%",
            background: selectedHex, border: "2px solid #ccc", flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: "#555" }}>{selectedHex}</span>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 26px)",
        gap: 4, maxHeight: 160, overflowY: "auto", padding: "4px 2px" }}>
        {filtered.map(hex => (
          <div key={hex} title={hex} onClick={() => onSelect(hex)}
            style={{ width: 26, height: 26, borderRadius: "50%", background: hex,
              cursor: "pointer",
              border: selectedHex === hex ? "3px solid #ff9800" : "1px solid #d1d5db",
              transform: selectedHex === hex ? "scale(1.2)" : "scale(1)",
              transition: "transform 0.15s" }} />
        ))}
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const EditProduct = () => {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [categories,       setCategories]       = useState([]);
  const [productData,      setProductData]      = useState({
    name: "", description: "", brand: "", discount: "", status: "active",
    price: "", category: "", subCategory: "", childCategory: "",
    variants: [], images: [], specifications: [], pairs_with: [],
  });
  const [newImages,        setNewImages]        = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [specifications,   setSpecifications]   = useState([]);
  const [variantInput,     setVariantInput]     = useState(BLANK_VARIANT());
  const [pairsWithInput,   setPairsWithInput]   = useState("");

  // ── Fetch categories from API ──
  useEffect(() => {
    axios.get("http://localhost:5000/api/categories")
      .then(r => { if (r.data.categories) setCategories(r.data.categories); })
      .catch(e => console.error("Failed to fetch categories:", e));
  }, []);

  // ── Fetch product ──
  useEffect(() => {
    fetch(`http://localhost:5000/api/products/${id}`)
      .then(r => r.json())
      .then(data => {
        if (!data.product) { alert("Product not found"); navigate("/admin/products"); return; }
        if (data.product.added_by !== "admin") {
          alert("You cannot edit vendor products here.");
          navigate("/admin/products"); return;
        }

        const p = data.product;

        // Normalise variants
        const normalised = (p.variants || []).map(v => ({
          size:      v.size      || "",
          color:     v.color     || "",
          colorName: v.colorName || v.color || "",
          colorHex:  v.colorHex  || v.color || "",
          stock:     v.stock     ?? "",
          sku:       v.sku       || "",
          measurements: {
            chest:    v.measurements?.chest    || "",
            waist:    v.measurements?.waist    || "",
            hips:     v.measurements?.hips     || "",
            shoulder: v.measurements?.shoulder || "",
            length:   v.measurements?.length   || "",
          },
        }));

        setProductData({ ...p, variants: normalised, pairs_with: p.pairs_with || [], childCategory: p.childCategory || "" });
        setSpecifications(p.specifications || []);
      })
      .catch(err => { console.error(err); alert("Failed to load product"); navigate("/admin/products"); });
  }, [id, navigate]);

  const handleChange = e => setProductData(p => ({ ...p, [e.target.name]: e.target.value }));

  const isSizeApplicable = productData.category === "Clothing" ||
    (productData.category === "Handmade" && productData.subCategory === "Jewelry");

  // ── Variant helpers ──
  const addVariant = () => {
    if (!variantInput.color || !variantInput.stock) {
      alert("Color (hex) and Stock are required."); return;
    }
    setProductData(p => ({ ...p, variants: [...p.variants, { ...variantInput }] }));
    setVariantInput(BLANK_VARIANT());
  };

  const handleVariantChange = (idx, field, value) => {
    setProductData(p => ({
      ...p,
      variants: p.variants.map((v, i) => i === idx ? { ...v, [field]: value } : v),
    }));
  };

  const handleVariantMeasurementChange = (idx, field, value) => {
    setProductData(p => ({
      ...p,
      variants: p.variants.map((v, i) =>
        i === idx ? { ...v, measurements: { ...v.measurements, [field]: value } } : v
      ),
    }));
  };

  const removeVariant = idx =>
    setProductData(p => ({ ...p, variants: p.variants.filter((_, i) => i !== idx) }));

  // ── Image helpers ──
  const handleImageChange = e => {
    const files = Array.from(e.target.files);
    setNewImages(files);
    setNewImagePreviews(files.map(f => URL.createObjectURL(f)));
  };
  const removeNewImage      = idx => { setNewImages(p => p.filter((_, i) => i !== idx)); setNewImagePreviews(p => p.filter((_, i) => i !== idx)); };
  const removeExistingImage = idx => setProductData(p => ({ ...p, images: p.images.filter((_, i) => i !== idx) }));

  // ── Submit ──
  const updateProduct = async e => {
    e.preventDefault();
    try {
      // Upload new images to Cloudinary
      const uploadedUrls = [];
      for (const img of newImages) {
        const fd = new FormData();
        fd.append("file", img); fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
        const res = await axios.post(CLOUDINARY_URL, fd);
        uploadedUrls.push(res.data.secure_url);
      }

      const fd = new FormData();
      fd.append("name",          productData.name);
      fd.append("description",   productData.description);
      fd.append("brand",         productData.brand);
      fd.append("discount",      productData.discount || 0);
      fd.append("status",        productData.status);
      fd.append("price",         productData.price);
      fd.append("category",      productData.category);
      fd.append("subCategory",   productData.subCategory);
      fd.append("childCategory", productData.childCategory || "");
      fd.append("is_admin",      "true");
      fd.append("specifications",JSON.stringify(specifications));
      fd.append("pairs_with",    JSON.stringify(productData.pairs_with));

      // ✅ Send variants with colorName, colorHex, nested measurements
      fd.append("variants", JSON.stringify(
        productData.variants.map(v => ({
          size:      v.size,
          color:     v.colorName || v.color,
          colorName: v.colorName || v.color,
          colorHex:  v.colorHex  || v.color,
          stock:     Number(v.stock),
          sku:       v.sku || "",
          measurements: v.measurements || {},
        }))
      ));

      // All images: existing + newly uploaded
      const allImages = [...productData.images, ...uploadedUrls];
      allImages.forEach(img => fd.append("images", img));

      const res = await axios.put(`http://localhost:5000/api/products/${id}?is_admin=true`, fd);
      if (res.status === 200) {
        alert("✅ Product updated successfully!");
        navigate("/admin/products");
      }
    } catch (err) { console.error(err); alert("⚠️ Failed to update product."); }
  };

  // ── Category selectors derived from API ──
  const subCategories    = categories.find(c => c.name === productData.category)?.subCategories || [];
  const childCategories  = subCategories.find(s => s.name === productData.subCategory)?.childCategories || [];

  return (
    <div className={styles.editProduct}>
      <h2>Edit Product</h2>
      <form onSubmit={updateProduct} encType="multipart/form-data" className={styles.form}>

        <input name="name"        value={productData.name}        onChange={handleChange} placeholder="Product Name" required />
        <input name="brand"       value={productData.brand}       onChange={handleChange} placeholder="Brand" required />
        <input name="discount"    value={productData.discount}    onChange={handleChange} placeholder="Discount %" type="number" />
        <input name="price"       value={productData.price}       onChange={handleChange} placeholder="Price" type="number" required />

        {/* Category — from API */}
        <select name="category" value={productData.category} required
          onChange={e => setProductData(p => ({ ...p, category: e.target.value, subCategory: "", childCategory: "" }))}>
          <option value="">Select Category</option>
          {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
        </select>

        <select name="subCategory" value={productData.subCategory} required
          onChange={e => setProductData(p => ({ ...p, subCategory: e.target.value, childCategory: "" }))}>
          <option value="">Select Subcategory</option>
          {subCategories.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
        </select>

        <select name="childCategory" value={productData.childCategory} onChange={handleChange}>
          <option value="">Select Child Category (Optional)</option>
          {childCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <textarea name="description" value={productData.description} onChange={handleChange} placeholder="Description" required />

        {/* Status */}
        <select name="status" value={productData.status} onChange={handleChange}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        {/* ── Add Variant ── */}
        <h4>Add Variant</h4>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, marginBottom: 16 }}>

          {isSizeApplicable && (
            <select value={variantInput.size}
              onChange={e => setVariantInput(p => ({ ...p, size: e.target.value }))}
              style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #e5e7eb",
                fontSize: 13, width: "100%", marginBottom: 8 }}>
              <option value="">Size</option>
              {SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}

          {/* ✅ Color name — standalone */}
          <input type="text" placeholder="Color name (e.g. Navy Blue) — type freely"
            value={variantInput.colorName}
            onChange={e => setVariantInput(p => ({ ...p, colorName: e.target.value }))}
            style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #e5e7eb",
              fontSize: 13, width: "100%", boxSizing: "border-box", marginBottom: 8 }} />

          <input type="number" placeholder="Stock" value={variantInput.stock}
            onChange={e => setVariantInput(p => ({ ...p, stock: e.target.value }))}
            style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #e5e7eb",
              fontSize: 13, width: "100%", boxSizing: "border-box", marginBottom: 8 }} />

          <input type="text" placeholder="SKU (optional)" value={variantInput.sku}
            onChange={e => setVariantInput(p => ({ ...p, sku: e.target.value }))}
            style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #e5e7eb",
              fontSize: 13, width: "100%", boxSizing: "border-box", marginBottom: 8 }} />

          {/* ✅ Color picker — only sets hex */}
          <ColorPicker
            selectedHex={variantInput.color}
            onSelect={hex => setVariantInput(p => ({ ...p, color: hex, colorHex: hex }))}
          />

          <MeasurementInputs
            values={variantInput.measurements}
            onChange={(field, val) => setVariantInput(p => ({ ...p, measurements: { ...p.measurements, [field]: val } }))}
          />

          <button type="button" onClick={addVariant}
            style={{ marginTop: 12, padding: "8px 20px", background: "#16a34a", color: "#fff",
              border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
            ➕ Add Variant
          </button>
        </div>

        {/* ── Existing Variants ── */}
        {productData.variants.length > 0 && (
          <div>
            <h5 style={{ marginBottom: 10 }}>Current Variants</h5>
            {productData.variants.map((v, i) => (
              <div key={i} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12,
                marginBottom: 12, background: i % 2 === 0 ? "#f9fafb" : "#fff" }}>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
                  {isSizeApplicable && (
                    <select value={v.size}
                      onChange={e => handleVariantChange(i, "size", e.target.value)}
                      style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13 }}>
                      <option value="">Size</option>
                      {SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  )}

                  {/* ✅ Color name editable */}
                  <input type="text" placeholder="Color name"
                    value={v.colorName || ""}
                    onChange={e => handleVariantChange(i, "colorName", e.target.value)}
                    style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, width: 140 }} />

                  <input type="number" placeholder="Stock" value={v.stock}
                    onChange={e => handleVariantChange(i, "stock", e.target.value)}
                    style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, width: 80 }} />

                  <input type="text" placeholder="SKU" value={v.sku || ""}
                    onChange={e => handleVariantChange(i, "sku", e.target.value)}
                    style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, width: 110 }} />

                  {(v.colorHex || v.color) && (
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 26, height: 26, borderRadius: "50%",
                        background: v.colorHex || v.color, border: "2px solid #ccc", flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: "#6b7280" }}>{v.colorHex || v.color}</span>
                    </div>
                  )}

                  <button type="button" onClick={() => removeVariant(i)}
                    style={{ marginLeft: "auto", background: "#fee2e2", border: "none",
                      borderRadius: 8, padding: "5px 12px", cursor: "pointer",
                      color: "#dc2626", fontWeight: 600, fontSize: 12 }}>
                    ✕ Remove
                  </button>
                </div>

                {/* ✅ Color picker for existing variant */}
                <ColorPicker
                  selectedHex={v.colorHex || v.color}
                  onSelect={hex => {
                    handleVariantChange(i, "color",    hex);
                    handleVariantChange(i, "colorHex", hex);
                  }}
                />

                {/* ✅ Measurements for existing variant */}
                <MeasurementInputs
                  values={v.measurements || {}}
                  onChange={(field, val) => handleVariantMeasurementChange(i, field, val)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Specifications */}
        <h4>Specifications</h4>
        {specifications.map((spec, i) => (
          <div key={i} className={styles.specRow}>
            <input placeholder="Label" value={spec.label || ""}
              onChange={e => { const u = [...specifications]; u[i].label = e.target.value; setSpecifications(u); }} />
            <input placeholder="Value" value={spec.value || ""}
              onChange={e => { const u = [...specifications]; u[i].value = e.target.value; setSpecifications(u); }} />
            <button type="button" onClick={() => setSpecifications(p => p.filter((_, j) => j !== i))}>❌</button>
          </div>
        ))}
        <button type="button" onClick={() => setSpecifications(p => [...p, { label: "", value: "" }])}>
          ➕ Add Specification
        </button>

        {/* Pairs With */}
        <div className={styles.formGroup}>
          <label>Pairs With (Product IDs)</label>
          <div className={styles.pairInputRow}>
            <input type="text" placeholder="Enter product ID"
              value={pairsWithInput} onChange={e => setPairsWithInput(e.target.value)} />
            <button type="button" onClick={() => {
              const id2 = pairsWithInput.trim();
              if (id2 && !productData.pairs_with.includes(id2)) {
                setProductData(p => ({ ...p, pairs_with: [...p.pairs_with, id2] }));
                setPairsWithInput("");
              }
            }}>➕ Add</button>
          </div>
          <div className={styles.pairList}>
            {productData.pairs_with.map((pid, i) => (
              <div key={i} className={styles.pairItem}>
                <span>{pid}</span>
                <button type="button" onClick={() =>
                  setProductData(p => ({ ...p, pairs_with: p.pairs_with.filter((_, j) => j !== i) }))}>❌</button>
              </div>
            ))}
          </div>
        </div>

        {/* Existing images */}
        {productData.images.length > 0 && (
          <div className={styles.imagePreview}>
            <h4>Existing Images:</h4>
            <div className={styles.previewGrid}>
              {productData.images.map((img, i) => (
                <div key={i} className={styles.previewImgWrapper}>
                  <img src={img.startsWith("http") ? img : `http://localhost:5000/${img}`}
                    alt="" className={styles.previewImg} />
                  <button type="button" className={styles.removeBtn} onClick={() => removeExistingImage(i)}>❌</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New images */}
        <div>
          <label>Upload New Images:</label>
          <input type="file" multiple accept="image/*" onChange={handleImageChange} />
          {newImagePreviews.length > 0 && (
            <div className={styles.previewGrid}>
              {newImagePreviews.map((src, i) => (
                <div key={i} className={styles.previewImgWrapper}>
                  <img src={src} alt="" className={styles.previewImg} />
                  <button type="button" onClick={() => removeNewImage(i)}>❌</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit"
          style={{ marginTop: 20, padding: "10px 28px", background: "#ff3f6c",
            color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          Update Product
        </button>
      </form>
    </div>
  );
};

export default EditProduct;