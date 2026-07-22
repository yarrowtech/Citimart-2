// import React, { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import styles from "./EditProducts.module.css";

// // Nested Categories



// // Web-Safe Colors
// const HEX_VALUES = ["00", "33", "66", "99", "CC", "FF"];
// const WEB_SAFE_COLORS = [];
// for (let r of HEX_VALUES) {
//   for (let g of HEX_VALUES) {
//     for (let b of HEX_VALUES) {
//       WEB_SAFE_COLORS.push(`#${r}${g}${b}`);
//     }
//   }
// }

// const EditProducts = () => {
//   const { productId } = useParams();
//   const navigate = useNavigate();
//   const vendorId = localStorage.getItem("vendor_id");
  
  
//   const [product, setProduct] = useState(null);
//   const [formData, setFormData] = useState({
//     name: "",
//     brand: "",
//     category: "",
//     subcategory: "",
//     childcategory: "",
//     price: "",
//     discount: "",
//     description: "",
//     status: "active",
//     variants: [],
//     specifications: [],
//     images: [],
//     pairs_with: [],
//   });

//   const [newImages, setNewImages] = useState([]);
//   const [newImagePreviews, setNewImagePreviews] = useState([]);
//   const [specifications, setSpecifications] = useState([]);
//   const [variantInput, setVariantInput] = useState({ size: "", color: "", stock: "",sku: "" });
//   const [pairsWithInput, setPairsWithInput] = useState("");
//   const [categoriesData, setCategoriesData] = useState({});

//    useEffect(() => {
//   const fetchCategories = async () => {
//     try {
//       // Get vendor ID from localStorage
//       const vendorId = localStorage.getItem("vendor_id"); 
//       if (!vendorId) {
//         console.error("Vendor ID not found in localStorage");
//         return;
//       }

//       // Fetch only approved categories for this vendor
//       const res = await fetch(`http://localhost:5000/api/categories/vendor/${vendorId}`);
//       const data = await res.json();

//       if (res.ok && data.categories) {
//         // Format categories for dropdowns
//         const formatted = {};
//         data.categories.forEach(cat => {
//           const subMap = {};
//           (cat.subCategories || []).forEach(sub => {
//             subMap[sub.name] = sub.childCategories || [];
//           });
//           formatted[cat.name] = subMap;
//         });

//         setCategoriesData(formatted);
//       } else {
//         console.error("Failed to fetch approved categories", data.error);
//       }
//     } catch (err) {
//       console.error("Error loading approved categories", err);
//     }
//   };

//   fetchCategories();
// }, []); // run once on mount

  
//   useEffect(() => {
//     const fetchProduct = async () => {
//       try {
//         const res = await fetch(`http://localhost:5000/api/products/${productId}`);
//         const data = await res.json();

//         if (!res.ok || !data.product) {
//           alert("Product not found");
//           navigate("/vendor/products");
//           return;
//         }

//         if (data.product.added_by !== "vendor" || data.product.vendor_id !== vendorId) {
//           alert("You are not authorized to edit this product");
//           navigate("/vendor/products");
//           return;
//         }

//         setProduct(data.product);
//         setFormData({
//           name: data.product.name || "",
//           brand: data.product.brand || "",
//           category: data.product.category || "",
//           subcategory: data.product.subcategory || "",
//           childcategory: data.product.childcategory || "",
//           price: data.product.price || "",
//           discount: data.product.discount || "",
//           description: data.product.description || "",
//           status: data.product.status || "active",
//           variants: data.product.variants || [],
//           specifications: data.product.specifications || [],
//           images: data.product.images || [],
//           pairs_with: data.product.pairs_with || [],
//         });
//         setSpecifications(data.product.specifications || []);
//       } catch (err) {
//         console.error(err);
//         alert("Failed to load product");
//         navigate("/vendor/products");
//       }
//     };
//     fetchProduct();
//   }, [productId, vendorId, navigate]);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handlePairsWithChange = (e) => setPairsWithInput(e.target.value);

//   const addPairsWith = () => {
//     const newId = pairsWithInput.trim();
//     if (newId && !formData.pairs_with.includes(newId)) {
//       setFormData((prev) => ({ ...prev, pairs_with: [...prev.pairs_with, newId] }));
//       setPairsWithInput("");
//     }
//   };

//   const removePairsWith = (index) => {
//     setFormData((prev) => ({
//       ...prev,
//       pairs_with: prev.pairs_with.filter((_, i) => i !== index),
//     }));
//   };

//   const handleAddVariant = () => {
//     if (!variantInput.color || !variantInput.stock) {
//       alert("Color and Stock are required for variant");
//       return;
//     }
//     setFormData((prev) => ({ ...prev, variants: [...prev.variants, variantInput] }));
//     setVariantInput({ size: "", color: "", stock: "" });
//   };

//   const handleVariantChange = (index, field, value) => {
//     const updated = [...formData.variants];
//     updated[index][field] = value;
//     setFormData({ ...formData, variants: updated });
//   };

//   const removeVariant = (index) => {
//     setFormData((prev) => ({
//       ...prev,
//       variants: prev.variants.filter((_, i) => i !== index),
//     }));
//   };

//   const handleAddSpecification = () => setSpecifications([...specifications, { key: "", value: "" }]);
//   const handleSpecificationChange = (index, field, value) => {
//     const updated = [...specifications];
//     updated[index][field] = value;
//     setSpecifications(updated);
//   };
//   const removeSpecification = (index) => setSpecifications(specifications.filter((_, i) => i !== index));

//   const handleImageUpload = (e) => {
//     const files = Array.from(e.target.files);
//     setNewImages(files);
//     setNewImagePreviews(files.map((file) => URL.createObjectURL(file)));
//   };

//   const handleRemoveNewImage = (index) => {
//     setNewImages(newImages.filter((_, i) => i !== index));
//     setNewImagePreviews(newImagePreviews.filter((_, i) => i !== index));
//   };

//   const handleRemoveExistingImage = (index) => {
//     setFormData((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const token = localStorage.getItem("token");
//       const form = new FormData();

//       for (const key in formData) {
//         if (["variants", "specifications", "pairs_with"].includes(key)) {
//           form.append(key, JSON.stringify(key === "specifications" ? specifications : formData[key]));
//         } else if (key !== "images") {
//           form.append(key, formData[key]);
//         }
//       }

//       form.append("vendor_id", vendorId);
//       form.append("is_admin", "false");

//       newImages.forEach((file) => form.append("images", file));

//       const res = await fetch(`http://localhost:5000/vendor/update-product/${productId}`, {
//         method: "PUT",
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//         body: form,
//       });

//       const result = await res.json();
//       if (res.ok) {
//         alert("✅ Product updated successfully");
//         navigate("/vendor/products");
//       } else {
//         alert(result.error || "Failed to update product");
//       }
//     } catch (err) {
//       console.error(err);
//       alert("Server error");
//     }
//   };

//   if (!product) return <div>Loading product...</div>;

//   return (
//     <div className={styles.editProduct}>
//       <h2>Edit Product</h2>
//       <form onSubmit={handleSubmit} className={styles.form} encType="multipart/form-data">
//         <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Product Name" required />
//         <input type="text" name="brand" value={formData.brand} onChange={handleInputChange} placeholder="Brand" required />
//         <input type="number" name="price" value={formData.price} onChange={handleInputChange} placeholder="Price" required />
//         <input type="number" name="discount" value={formData.discount} onChange={handleInputChange} placeholder="Discount %" />
//         <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Description" required />

//         <select
//   name="category"
//   value={formData.category}
//   onChange={(e) =>
//     setFormData({ ...formData, category: e.target.value, subcategory: "", childcategory: "" })
//   }
//   required
// >
//   <option value="">Select Category</option>
//   {Object.keys(categoriesData).map((cat) => (
//     <option key={cat} value={cat}>{cat}</option>
//   ))}
// </select>
//   <select
//   name="subcategory"
//   value={formData.subcategory}
//   onChange={(e) =>
//     setFormData({ ...formData, subcategory: e.target.value, childcategory: "" })
//   }
//   required
// >
//   <option value="">Select Subcategory</option>
//   {formData.category &&
//     Object.keys(categoriesData[formData.category] || {}).map((sub) => (
//       <option key={sub} value={sub}>{sub}</option>
//     ))}
// </select>

// <select
//   name="childcategory"
//   value={formData.childcategory}
//   onChange={handleInputChange}
// >
//   <option value="">Select Child Category (Optional)</option>
//   {formData.category &&
//     formData.subcategory &&
//     (categoriesData[formData.category]?.[formData.subcategory] || []).map((child) => (
//       <option key={child} value={child}>{child}</option>
//     ))}
// </select>


//     {/* Variants Section */}
// <h4>Variants</h4>

// {/* Add New Variant */}
// <div className={styles.addVariant}>
//   {/* Size input only for Clothing */}
//   {formData.category === "Clothing" && (
//     <input
//       placeholder="Size (optional)"
//       value={variantInput.size}
//       onChange={(e) => setVariantInput({ ...variantInput, size: e.target.value })}
//     />
//   )}

//   <input
//     placeholder="Stock"
//     type="number"
//     value={variantInput.stock}
//     onChange={(e) => setVariantInput({ ...variantInput, stock: e.target.value })}
//   />
//    <input
//     placeholder="SKU (optional)"
//     value={variantInput.sku}
//     onChange={(e) => setVariantInput({ ...variantInput, sku: e.target.value })}
//   />


//   {/* Horizontal Color Palette */}
//   <div className={styles.colorPaletteHorizontal}>
//     {WEB_SAFE_COLORS.map((color) => (
//       <div
//         key={color}
//         className={`${styles.colorCircle} ${variantInput.color === color ? styles.selected : ""}`}
//         style={{ backgroundColor: color }}
//         onClick={() => setVariantInput({ ...variantInput, color })}
//       />
//     ))}
//   </div>

//   <button type="button" onClick={handleAddVariant}>+ Add Variant</button>
// </div>

// {/* Existing Variants */}
// {formData.variants.length > 0 && (
//   <div className={styles.existingVariants}>
//     <h5>Existing Variants</h5>
//     {formData.variants.map((v, i) => (
//       <div key={i} className={styles.variantRow}>
//         {/* Editable Size */}
//         {formData.category === "Clothing" && (
//           <input
//             type="text"
//             value={v.size || ""}
//             placeholder="Size"
//             onChange={(e) => handleVariantChange(i, "size", e.target.value)}
//           />
//         )}

//         {/* Editable Stock */}
//         <input
//           type="number"
//           value={v.stock}
//           placeholder="Stock"
//           onChange={(e) => handleVariantChange(i, "stock", e.target.value)}
//         />
        
//          <input
//   type="text"
//   value={v.sku || ""}
//   placeholder="SKU (auto or manual)"
//   onChange={(e) => handleVariantChange(i, "sku", e.target.value)}
// />



//         {/* Editable Horizontal Color Palette */}
//         <div className={styles.colorPaletteHorizontal}>
//           {WEB_SAFE_COLORS.map((color) => (
//             <div
//               key={color}
//               className={`${styles.colorCircle} ${v.color === color ? styles.selected : ""}`}
//               style={{ backgroundColor: color }}
//               onClick={() => handleVariantChange(i, "color", color)}
//             />
//           ))}
//         </div>

//         {/* Remove Variant */}
//         <button type="button" onClick={() => removeVariant(i)}>❌</button>
//       </div>
//     ))}
//   </div>
// )}



//         {/* Specifications */}
//         <h4>Specifications</h4>
//         {specifications.map((spec, i) => (
//           <div key={i}>
//             <input placeholder="Key" value={spec.key} onChange={(e) => handleSpecificationChange(i, "key", e.target.value)} />
//             <input placeholder="Value" value={spec.value} onChange={(e) => handleSpecificationChange(i, "value", e.target.value)} />
//             <button type="button" onClick={() => removeSpecification(i)}>❌</button>
//           </div>
//         ))}
//         <button type="button" onClick={handleAddSpecification}>+ Add Specification</button>

//         {/* Pairs With */}
//         <h4>Pairs With</h4>
//         <input placeholder="Product ID" value={pairsWithInput} onChange={handlePairsWithChange} />
//         <button type="button" onClick={addPairsWith}>+ Add</button>
//         {formData.pairs_with.map((id, i) => (
//           <div key={i}>
//             <span>{id}</span>
//             <button type="button" onClick={() => removePairsWith(i)}>❌</button>
//           </div>
//         ))}

//         {/* Images */}
//         <h4>Existing Images</h4>
//         {formData.images.map((img, i) => (
//           <div key={i}>
//             <img src={img.startsWith("http") ? img : `http://localhost:5000/${img}`} alt={`Product ${i}`} width={80} />
//             <button type="button" onClick={() => handleRemoveExistingImage(i)}>❌</button>
//           </div>
//         ))}

//         <h4>Upload New Images</h4>
//         <input type="file" multiple accept="image/*" onChange={handleImageUpload} />
//         {newImagePreviews.map((src, i) => (
//           <div key={i}>
//             <img src={src} alt={`New ${i}`} width={80} />
//             <button type="button" onClick={() => handleRemoveNewImage(i)}>❌</button>
//           </div>
//         ))}

//         <button type="submit">Update Product</button>
//       </form>
//     </div>
//   );
// };

// export default EditProducts;


import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./EditProducts.module.css";

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

// ── Measurement inputs block ─────────────────────────────────────────────────
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
        <input
          type="text" placeholder="e.g. 38" value={values[field] || ""}
          onChange={e => onChange(field, e.target.value)}
          style={{ width: 68, padding: "5px 8px", borderRadius: 7, border: "1px solid #d1d5db", fontSize: 13, outline: "none" }}
        />
      </label>
    ))}
  </div>
);

// ── Color picker — only sets hex, never touches colorName ────────────────────
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

      <input type="text" placeholder="Search hex e.g. #FF0000"
        value={search} onChange={e => setSearch(e.target.value)}
        style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e5e7eb",
          fontSize: 12, width: "100%", boxSizing: "border-box", marginBottom: 6 }} />

      <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
        {["All", "Red", "Green", "Blue", "Gray"].map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            style={{
              padding: "3px 12px", borderRadius: 20, fontSize: 11,
              border: "none", cursor: "pointer",
              background: tab === t ? "#ff3f6c" : "#f3f4f6",
              color:      tab === t ? "#fff"     : "#374151",
              fontWeight: tab === t ? 700 : 400,
            }}>{t}</button>
        ))}
      </div>

      {selectedHex && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: "50%",
            background: selectedHex, border: "2px solid #ccc", flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: "#555" }}>{selectedHex}</span>
        </div>
      )}

      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fill, 26px)",
        gap: 4, maxHeight: 160, overflowY: "auto", padding: "4px 2px",
      }}>
        {filtered.map(hex => (
          <div key={hex} title={hex}
            onClick={() => onSelect(hex)}
            style={{
              width: 26, height: 26, borderRadius: "50%",
              background: hex, cursor: "pointer",
              border: selectedHex === hex ? "3px solid #ff9800" : "1px solid #d1d5db",
              transform: selectedHex === hex ? "scale(1.2)" : "scale(1)",
              transition: "transform 0.15s",
            }} />
        ))}
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const EditProducts = () => {
  const { productId } = useParams();
  const navigate      = useNavigate();
  const vendorId      = localStorage.getItem("vendor_id");

  const [product,          setProduct]          = useState(null);
  const [formData,         setFormData]         = useState({
    name: "", brand: "", category: "", subcategory: "", childcategory: "",
    price: "", discount: "", description: "", status: "active",
    variants: [], specifications: [], images: [], pairs_with: [],
  });
  const [newImages,        setNewImages]        = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [specifications,   setSpecifications]   = useState([]);
  const [variantInput,     setVariantInput]     = useState(BLANK_VARIANT());
  const [pairsWithInput,   setPairsWithInput]   = useState("");
  const [categoriesData,   setCategoriesData]   = useState({});

  // ── Fetch vendor-approved categories ──
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res  = await fetch(`http://localhost:5000/api/categories/vendor/${vendorId}`);
        const data = await res.json();
        if (res.ok && data.categories) {
          const formatted = {};
          data.categories.forEach(cat => {
            const subMap = {};
            (cat.subCategories || []).forEach(sub => { subMap[sub.name] = sub.childCategories || []; });
            formatted[cat.name] = subMap;
          });
          setCategoriesData(formatted);
        }
      } catch (err) { console.error("Error loading categories", err); }
    };
    fetchCategories();
  }, []);

  // ── Fetch product ──
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res  = await fetch(`http://localhost:5000/api/products/${productId}`);
        const data = await res.json();
        if (!res.ok || !data.product) { alert("Product not found"); navigate("/vendor/products"); return; }
        if (data.product.added_by !== "vendor" || data.product.vendor_id !== vendorId) {
          alert("Not authorized"); navigate("/vendor/products"); return;
        }

        const p = data.product;

        // Normalise variants — ensure measurements is always an object
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

        setProduct(p);
        setFormData({
          name:          p.name          || "",
          brand:         p.brand         || "",
          category:      p.category      || "",
          subcategory:   p.subcategory   || "",
          childcategory: p.childcategory || "",
          price:         p.price         || "",
          discount:      p.discount      || "",
          description:   p.description   || "",
          status:        p.status        || "active",
          variants:      normalised,
          specifications: p.specifications || [],
          images:        p.images        || [],
          pairs_with:    p.pairs_with    || [],
        });
        setSpecifications(p.specifications || []);
      } catch (err) { console.error(err); alert("Failed to load product"); navigate("/vendor/products"); }
    };
    fetchProduct();
  }, [productId, vendorId, navigate]);

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  };

  const supportsSize = () =>
    formData.category === "Clothing" ||
    (formData.category === "Handmade" && formData.subcategory === "Jewelry");

  // ── Variant helpers ──
  const handleAddVariant = () => {
    if (!variantInput.color || !variantInput.stock) {
      alert("Color (hex) and Stock are required"); return;
    }
    setFormData(p => ({ ...p, variants: [...p.variants, { ...variantInput }] }));
    setVariantInput(BLANK_VARIANT());
  };

  const handleVariantChange = (idx, field, value) => {
    const updated = formData.variants.map((v, i) =>
      i === idx ? { ...v, [field]: value } : v
    );
    setFormData(p => ({ ...p, variants: updated }));
  };

  const handleVariantMeasurementChange = (idx, field, value) => {
    const updated = formData.variants.map((v, i) =>
      i === idx ? { ...v, measurements: { ...v.measurements, [field]: value } } : v
    );
    setFormData(p => ({ ...p, variants: updated }));
  };

  const removeVariant = idx =>
    setFormData(p => ({ ...p, variants: p.variants.filter((_, i) => i !== idx) }));

  // ── Spec helpers ──
  const handleAddSpecification    = () => setSpecifications(p => [...p, { key: "", value: "" }]);
  const handleSpecificationChange = (idx, field, val) => {
    const updated = [...specifications]; updated[idx][field] = val; setSpecifications(updated);
  };
  const removeSpecification = idx => setSpecifications(p => p.filter((_, i) => i !== idx));

  // ── Image helpers ──
  const handleImageUpload = e => {
    const files = Array.from(e.target.files);
    setNewImages(files);
    setNewImagePreviews(files.map(f => URL.createObjectURL(f)));
  };
  const handleRemoveNewImage      = idx => { setNewImages(p => p.filter((_, i) => i !== idx)); setNewImagePreviews(p => p.filter((_, i) => i !== idx)); };
  const handleRemoveExistingImage = idx => setFormData(p => ({ ...p, images: p.images.filter((_, i) => i !== idx) }));

  // ── Pairs With ──
  const addPairsWith = () => {
    const id = pairsWithInput.trim();
    if (id && !formData.pairs_with.includes(id)) {
      setFormData(p => ({ ...p, pairs_with: [...p.pairs_with, id] }));
      setPairsWithInput("");
    }
  };
  const removePairsWith = idx =>
    setFormData(p => ({ ...p, pairs_with: p.pairs_with.filter((_, i) => i !== idx) }));

  // ── Submit ──
  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const form  = new FormData();

      form.append("name",          formData.name);
      form.append("brand",         formData.brand);
      form.append("price",         formData.price);
      form.append("discount",      formData.discount || 0);
      form.append("description",   formData.description);
      form.append("category",      formData.category);
      form.append("subcategory",   formData.subcategory);
      form.append("childcategory", formData.childcategory);
      form.append("status",        formData.status);
      form.append("specifications",JSON.stringify(specifications));
      form.append("pairs_with",    JSON.stringify(formData.pairs_with));
      form.append("vendor_id",     vendorId);
      form.append("is_admin",      "false");

      // ✅ Send variants with colorName, colorHex, measurements nested
      form.append("variants", JSON.stringify(
        formData.variants.map(v => ({
          size:      v.size,
          color:     v.colorName || v.color,   // colorName for display
          colorName: v.colorName || v.color,
          colorHex:  v.colorHex  || v.color,
          stock:     Number(v.stock),
          sku:       v.sku || "",
          measurements: v.measurements || {},  // ✅ nested object
        }))
      ));

      newImages.forEach(f => form.append("images", f));

      const res    = await fetch(`http://localhost:5000/vendor/update-product/${productId}`, {
        method: "PUT", headers: { Authorization: `Bearer ${token}` }, body: form,
      });
      const result = await res.json();
      if (res.ok) { alert("✅ Product updated successfully"); navigate("/vendor/products"); }
      else alert(result.error || "Failed to update product");
    } catch (err) { console.error(err); alert("Server error"); }
  };

  if (!product) return <div>Loading product...</div>;

  return (
    <div className={styles.editProduct}>
      <h2>Edit Product</h2>
      <form onSubmit={handleSubmit} className={styles.form} encType="multipart/form-data">

        <input type="text"   name="name"        value={formData.name}        onChange={handleInputChange} placeholder="Product Name" required />
        <input type="text"   name="brand"        value={formData.brand}       onChange={handleInputChange} placeholder="Brand" required />
        <input type="number" name="price"        value={formData.price}       onChange={handleInputChange} placeholder="Price" required />
        <input type="number" name="discount"     value={formData.discount}    onChange={handleInputChange} placeholder="Discount %" />
        <textarea            name="description"  value={formData.description} onChange={handleInputChange} placeholder="Description" required />

        {/* Category */}
        <select name="category" value={formData.category} required
          onChange={e => setFormData(p => ({ ...p, category: e.target.value, subcategory: "", childcategory: "" }))}>
          <option value="">Select Category</option>
          {Object.keys(categoriesData).map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select name="subcategory" value={formData.subcategory} required
          onChange={e => setFormData(p => ({ ...p, subcategory: e.target.value, childcategory: "" }))}>
          <option value="">Select Subcategory</option>
          {Object.keys(categoriesData[formData.category] || {}).map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select name="childcategory" value={formData.childcategory} onChange={handleInputChange}>
          <option value="">Select Child Category (Optional)</option>
          {(categoriesData[formData.category]?.[formData.subcategory] || []).map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* ── Variants ── */}
        <h4>Variants</h4>

        {/* Add new variant */}
        <div className={styles.addVariant} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, marginBottom: 16 }}>
          <h5 style={{ margin: "0 0 10px", color: "#374151" }}>Add New Variant</h5>

          {supportsSize() && (
            <select value={variantInput.size}
              onChange={e => setVariantInput(p => ({ ...p, size: e.target.value }))}
              style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, width: "100%", marginBottom: 8 }}>
              <option value="">Size</option>
              {SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}

          {/* ✅ Color name — standalone, never auto-filled */}
          <input type="text" placeholder="Color name (e.g. Navy Blue) — type freely"
            value={variantInput.colorName}
            onChange={e => setVariantInput(p => ({ ...p, colorName: e.target.value }))}
            style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, width: "100%", boxSizing: "border-box", marginBottom: 8 }} />

          <input type="number" placeholder="Stock" value={variantInput.stock}
            onChange={e => setVariantInput(p => ({ ...p, stock: e.target.value }))}
            style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, width: "100%", boxSizing: "border-box", marginBottom: 8 }} />

          <input type="text" placeholder="SKU (optional)" value={variantInput.sku}
            onChange={e => setVariantInput(p => ({ ...p, sku: e.target.value }))}
            style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, width: "100%", boxSizing: "border-box", marginBottom: 8 }} />

          {/* ✅ Color picker — only sets hex */}
          <ColorPicker
            selectedHex={variantInput.color}
            onSelect={hex => setVariantInput(p => ({ ...p, color: hex, colorHex: hex }))}
          />

          {/* Measurements */}
          <MeasurementInputs
            values={variantInput.measurements}
            onChange={(field, val) => setVariantInput(p => ({ ...p, measurements: { ...p.measurements, [field]: val } }))}
          />

          <button type="button" onClick={handleAddVariant}
            style={{ marginTop: 12, padding: "8px 20px", background: "#16a34a", color: "#fff",
              border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
            ➕ Add Variant
          </button>
        </div>

        {/* Existing variants */}
        {formData.variants.length > 0 && (
          <div className={styles.existingVariants}>
            <h5 style={{ marginBottom: 10 }}>Current Variants</h5>
            {formData.variants.map((v, i) => (
              <div key={i} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, marginBottom: 12, background: i % 2 === 0 ? "#f9fafb" : "#fff" }}>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
                  {supportsSize() && (
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

                  {/* Current color swatch */}
                  {v.color && (
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
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
            <input placeholder="Key"   value={spec.key   || ""} onChange={e => handleSpecificationChange(i, "key",   e.target.value)} />
            <input placeholder="Value" value={spec.value || ""} onChange={e => handleSpecificationChange(i, "value", e.target.value)} />
            <button type="button" onClick={() => removeSpecification(i)}>❌</button>
          </div>
        ))}
        <button type="button" onClick={handleAddSpecification}>+ Add Specification</button>

        {/* Pairs With */}
        <h4>Pairs With</h4>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input placeholder="Product ID" value={pairsWithInput} onChange={e => setPairsWithInput(e.target.value)} />
          <button type="button" onClick={addPairsWith}>+ Add</button>
        </div>
        {formData.pairs_with.map((id, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
            <span>{id}</span>
            <button type="button" onClick={() => removePairsWith(i)}>❌</button>
          </div>
        ))}

        {/* Existing images */}
        <h4>Existing Images</h4>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
          {formData.images.map((img, i) => (
            <div key={i} style={{ position: "relative" }}>
              <img src={img.startsWith("http") ? img : `http://localhost:5000/${img}`}
                alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid #e5e7eb" }} />
              <button type="button" onClick={() => handleRemoveExistingImage(i)}
                style={{ position: "absolute", top: -6, right: -6, background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>❌</button>
            </div>
          ))}
        </div>

        <h4>Upload New Images</h4>
        <input type="file" multiple accept="image/*" onChange={handleImageUpload} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
          {newImagePreviews.map((src, i) => (
            <div key={i} style={{ position: "relative" }}>
              <img src={src} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid #e5e7eb" }} />
              <button type="button" onClick={() => handleRemoveNewImage(i)}
                style={{ position: "absolute", top: -6, right: -6, background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>❌</button>
            </div>
          ))}
        </div>

        <button type="submit"
          style={{ marginTop: 20, padding: "10px 28px", background: "#ff3f6c", color: "#fff",
            border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          Update Product
        </button>
      </form>
    </div>
  );
};

export default EditProducts;