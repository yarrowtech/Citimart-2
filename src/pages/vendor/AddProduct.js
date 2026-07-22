// import React, { useState, useEffect } from "react";
// import styles from "./AddProduct.module.css"; // adjust path if needed


// // Web-safe colors
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

// const SIZE_OPTIONS = ["S", "M", "L", "XL", "XXL"];

// const AddProduct = () => {
//   // Category states
//   const [approvedCategories, setApprovedCategories] = useState([]);
//   const [approvedSubcategories, setApprovedSubcategories] = useState({});
//   const [approvedChildcategories, setApprovedChildcategories] = useState({});

//   const [loadingCategories, setLoadingCategories] = useState(true);

//   const [reqCategory, setReqCategory] = useState("");
//   const [reqSubCategory, setReqSubCategory] = useState("");
//   const [reqChildCategory, setReqChildCategory] = useState("");
//   const [requestSelections, setRequestSelections] = useState([]);
//   const [requestInput, setRequestInput] = useState("");
//   const [showModal, setShowModal] = useState(false);
  
//   const [fetchedCategories, setFetchedCategories] = useState({});

   
//   // Single product form
//   const [form, setForm] = useState({
//     name: "",
//     brand: "",
//     price: "",
//     discount: "",
//     description: "",
//     specifications: [{ label: "", value: "" }],
//     images: [],
//     category: "",
//     subCategory: "",
//     childCategory: "",
//     variants: [],
//     pairs_with: [],
//     pairs_with_input: "",
//   });

//   // Bulk mode
//   const [bulkMode, setBulkMode] = useState(false);
//   const [bulkProducts, setBulkProducts] = useState([{ ...form }]);

//   const [variantInput, setVariantInput] = useState({ size: "", color: "", stock: "" ,sku: ""});
//   const [colorSearch, setColorSearch] = useState("");
//   const [selectedTab, setSelectedTab] = useState("All");
//   const [imagePreviews, setImagePreviews] = useState([]);
//   const [errors, setErrors] = useState({});

//   // Fetch vendor approved categories
//   useEffect(() => {
//     const fetchVendorProfile = async () => {
//       try {
//         const token = localStorage.getItem("token");
//         const res = await fetch("http://localhost:5000/vendor/profile", {
//           headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
//           credentials: "include",
//         });
//         if (res.ok) {
//           const data = await res.json();
//           setApprovedCategories(data.approved_categories || []);
//           setApprovedSubcategories(data.approved_subcategories || {});
//           setApprovedChildcategories(data.approved_childcategories || {});
//         } else {
//           setApprovedCategories([]);
//           setApprovedSubcategories({});
//           setApprovedChildcategories({});
//         }
//       } catch (err) {
//         console.error(err);
//         setApprovedCategories([]);
//         setApprovedSubcategories({});
//         setApprovedChildcategories({});
//       }
//       setLoadingCategories(false);
//     };
//     fetchVendorProfile();
//   }, []);

//      useEffect(() => {
//   const fetchAllCategories = async () => {
//     try {
//       const res = await fetch("http://localhost:5000/api/categories");
//       if (!res.ok) throw new Error("Failed to fetch categories");
//       const data = await res.json();
//       const obj = {};
//       data.categories.forEach((cat) => {
//         obj[cat.name] = {};
//         (cat.subCategories || []).forEach((sub) => {
//           obj[cat.name][sub.name] = sub.childCategories || [];
//         });
//       });
//       setFetchedCategories(obj);
//     } catch (err) {
//       console.error("Error fetching categories:", err);
//       setFetchedCategories({});
//     }
//   };
//   fetchAllCategories();
// }, []);



//   // Color filter
//   const filterByTab = (color) => {
//     if (selectedTab === "All") return true;
//     if (selectedTab === "Red") return color.hex.toUpperCase().startsWith("#FF");
//     if (selectedTab === "Green") return color.hex.toUpperCase().startsWith("#0F");
//     if (selectedTab === "Blue") return color.hex.toUpperCase().startsWith("#00");
//     if (selectedTab === "Gray") return color.hex[1] === color.hex[3] && color.hex[3] === color.hex[5];
//     return true;
//   };
//   const filteredColors = WEB_SAFE_COLORS.filter(
//     (c) => c.name.toLowerCase().includes(colorSearch.toLowerCase()) && filterByTab(c)
//   );

//   // Handlers
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setForm((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleCategoryChange = (e) => {
//     const selectedCategory = e.target.value;
//     setForm((prev) => ({
//       ...prev,
//       category: selectedCategory,
//       subCategory: "",
//       childCategory: "",
//     }));
//   };
//   const handleSubCategoryChange = (e) => {
//     setForm((prev) => ({ ...prev, subCategory: e.target.value, childCategory: "" }));
//   };
//   const handleChildCategoryChange = (e) => {
//     setForm((prev) => ({ ...prev, childCategory: e.target.value }));
//   };

//   const handleImageChange = (e) => {
//     const files = Array.from(e.target.files);
//     setForm((prev) => ({ ...prev, images: files }));
//     setImagePreviews(files.map((file) => URL.createObjectURL(file)));
//   };

//   const supportsSize = (p = form) => {
//     if (p.category === "Clothing") return true;
//     if (p.category === "Handmade" && p.subCategory === "Jewelry") return true;
//     return false;
//   };

//   const addVariant = (p = form, setP = setForm) => {
//     if ((!supportsSize(p) || variantInput.size) && variantInput.color && variantInput.stock) {
//       setP((prev) => ({
//         ...prev,
//         variants: [...prev.variants, variantInput],
//       }));
//       setVariantInput({ size: "", color: "", stock: "" ,sku: "" });
//     }
//   };

//   const removeVariant = (idx, p = form, setP = setForm) => {
//     setP((prev) => ({
//       ...prev,
//       variants: prev.variants.filter((_, i) => i !== idx),
//     }));
//   };

//   const handleReset = () => {
//     setForm({
//       name: "",
//       brand: "",
//       price: "",
//       discount: "",
//       description: "",
//       specifications: [{ label: "", value: "" }],
//       images: [],
//       category: "",
//       subCategory: "",
//       childCategory: "",
//       variants: [],
//       pairs_with: [],
//       pairs_with_input: "",
//     });
//     setImagePreviews([]);
//     setErrors({});
//     setVariantInput({ size: "", color: "", stock: "" });
//     setColorSearch("");
//     setSelectedTab("All");
//   };

//   const validate = (p = form) => {
//     const newErrors = {};
//     if (!p.name) newErrors.name = "Product name is required";
//     if (!p.brand) newErrors.brand = "Brand is required";
//     if (!p.price) newErrors.price = "Price is required";
//     if (!p.category) newErrors.category = "Category is required";
//     if (!p.subCategory) newErrors.subCategory = "Subcategory is required";
//     if (!p.childCategory) newErrors.childCategory = "Child category is required";
//     if (p.images.length === 0) newErrors.images = "At least one image is required";
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };
//  // === VARIANTS ===
// const handleVariantInputChange = (e) => {
//   const { name, value } = e.target;
//   setVariantInput((prev) => ({ ...prev, [name]: value }));
// };

// // === CATEGORY REQUEST MODAL ===
// const handleAddSelection = () => {
//   if (!reqCategory) return;
//   const newSelection = {
//     category: reqCategory,
//     subCategory: reqSubCategory,
//     childCategory: reqChildCategory,
//   };
//   setRequestSelections((prev) => [...prev, newSelection]);
// };

// const handleRequestSubmit = async () => {
//   if (requestSelections.length === 0 && !requestInput.trim()) {
//     alert("Please add a selection or write a request");
//     return;
//   }

//   try {
//     const token = localStorage.getItem("token");
//     const res = await fetch("http://localhost:5000/vendor/request-category", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//       credentials: "include",
//       body: JSON.stringify({
//         selections: requestSelections,
//         note: requestInput,
//       }),
//     });

//     const data = await res.json();

//     if (res.ok) {
//       alert("Category request submitted!");
//       setShowModal(false);
//       setReqCategory("");
//       setReqSubCategory("");
//       setReqChildCategory("");
//       setRequestSelections([]);
//       setRequestInput("");
//     } else {
//       alert("Error: " + (data.error || "Unknown error"));
//     }
//   } catch (err) {
//     console.error(err);
//     alert("Network error while sending request");
//   }
// };

// // === SPECIFICATIONS ===
// const handleSpecChange = (index, field, value) => {
//   setForm((prev) => {
//     const specs = [...prev.specifications];
//     specs[index][field] = value;
//     return { ...prev, specifications: specs };
//   });
// };

// const addSpecification = () => {
//   setForm((prev) => ({
//     ...prev,
//     specifications: [...prev.specifications, { label: "", value: "" }],
//   }));
// };

// const removeSpecification = (index) => {
//   setForm((prev) => ({
//     ...prev,
//     specifications: prev.specifications.filter((_, i) => i !== index),
//   }));
// };
   
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!validate()) return;

//     const formData = new FormData();
//     formData.append("name", form.name);
//     formData.append("brand", form.brand);
//     formData.append("price", form.price);
//     formData.append("discount", form.discount);
//     formData.append("description", form.description);
//     formData.append("category", form.category);
//     formData.append("subcategory", form.subCategory);
//     formData.append("childcategory", form.childCategory);
//     formData.append("specifications", JSON.stringify(form.specifications));
//     formData.append("variants", JSON.stringify(form.variants));
//     formData.append("pairs_with", JSON.stringify(form.pairs_with));

//     form.images.forEach((file) => formData.append("images", file));

//     try {
//       const token = localStorage.getItem("token");
//       const response = await fetch("http://localhost:5000/vendor/add-product", {
//         method: "POST",
//         credentials: "include",
//         headers: { Authorization: `Bearer ${token}` },
//         body: formData,
//       });
//       if (response.ok) {
//         alert("Product added successfully!");
//         handleReset();
//       } else {
//         const error = await response.json();
//         alert("❌ Failed: " + (error.error || error.message || "Unknown error"));
//       }
//     } catch (err) {
//       alert("⚠️ Error adding product");
//     }
//   };

//   // Bulk submit
//   const handleBulkSubmit = async () => {
//     for (let product of bulkProducts) {
//       const formData = new FormData();
//       formData.append("name", product.name);
//       formData.append("brand", product.brand);
//       formData.append("price", product.price);
//       formData.append("discount", product.discount);
//       formData.append("description", product.description);
//       formData.append("category", product.category);
//       formData.append("subcategory", product.subCategory);
//       formData.append("childcategory", product.childCategory);
//       formData.append("specifications", JSON.stringify(product.specifications));
//       formData.append("variants", JSON.stringify(product.variants));
//       formData.append("pairs_with", JSON.stringify(product.pairs_with));
//       product.images.forEach((file) => formData.append("images", file));

//       try {
//         const token = localStorage.getItem("token");
//         const response = await fetch("http://localhost:5000/vendor/add-product", {
//           method: "POST",
//           credentials: "include",
//           headers: { Authorization: `Bearer ${token}` },
//           body: formData,
//         });
//         if (!response.ok) {
//           const error = await response.json();
//           console.error("Bulk product error:", error);
//         }
//       } catch (err) {
//         console.error("Error submitting bulk product:", err);
//       }
//     }
//     alert("Bulk products submitted!");
//     setBulkProducts([{ ...form }]);
//   };

//   // Bulk product row component
//    const BulkProductRow = ({ index, product, updateProduct, removeProduct }) => {
//   const [variantInput, setVariantInput] = useState({ size: "", color: "", stock: "" });
//   const [imagePreviews, setImagePreviews] = useState((product.images || []).map((f) => URL.createObjectURL(f)));

//   // Field change handler
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     updateProduct({ ...product, [name]: value });
//   };

//   // Image handlers
//   const handleImageChange = (e) => {
//     const files = Array.from(e.target.files);
//     updateProduct({ ...product, images: files });
//     setImagePreviews(files.map((f) => URL.createObjectURL(f)));
//   };
//   const removeImage = (idx) => {
//     const newImages = product.images.filter((_, i) => i !== idx);
//     const newPreviews = imagePreviews.filter((_, i) => i !== idx);
//     updateProduct({ ...product, images: newImages });
//     setImagePreviews(newPreviews);
//   };

//   // Variants
//   const addVariant = () => {
//     if ((!supportsSize(product) || variantInput.size) && variantInput.color && variantInput.stock) {
//       updateProduct({ ...product, variants: [...product.variants, variantInput] });
//       setVariantInput({ size: "", color: "", stock: "" });
//     }
//   };
//   const removeVariant = (idx) => {
//     updateProduct({ ...product, variants: product.variants.filter((_, i) => i !== idx) });
//   };

//   // Specifications
//   const handleSpecChange = (idx, field, value) => {
//     const newSpecs = [...product.specifications];
//     newSpecs[idx][field] = value;
//     updateProduct({ ...product, specifications: newSpecs });
//   };
//   const addSpecification = () => {
//     updateProduct({ ...product, specifications: [...product.specifications, { label: "", value: "" }] });
//   };
//   const removeSpecification = (idx) => {
//     updateProduct({ ...product, specifications: product.specifications.filter((_, i) => i !== idx) });
//   };

//   return (
//     <div className={styles.bulkRow}>
//   <h4>Product #{index + 1}</h4>

//   {/* Category Selection */}
//   <div className={styles.formGroup}>
//     <label>Category</label>
//     <select
//       value={product.category}
//       onChange={(e) =>
//         updateProduct({
//           ...product,
//           category: e.target.value,
//           subCategory: "",
//           childCategory: "",
//         })
//       }
//     >
//       <option value="">Select Category</option>
//       {approvedCategories.map((cat) => (
//         <option key={cat} value={cat}>
//           {cat}
//         </option>
//       ))}
//     </select>
//   </div>

//   <div className={styles.formGroup}>
//     <label>Subcategory</label>
//     <select
//       value={product.subCategory}
//       onChange={(e) =>
//         updateProduct({
//           ...product,
//           subCategory: e.target.value,
//           childCategory: "",
//         })
//       }
//       disabled={!product.category}
//     >
//       <option value="">Select Subcategory</option>
//       {(approvedSubcategories[product.category] || []).map((sub) => (
//         <option key={sub} value={sub}>
//           {sub}
//         </option>
//       ))}
//     </select>
//   </div>

//   <div className={styles.formGroup}>
//     <label>Child Category</label>
//     <select
//       value={product.childCategory}
//       onChange={(e) =>
//         updateProduct({ ...product, childCategory: e.target.value })
//       }
//       disabled={!product.subCategory}
//     >
//       <option value="">Select Child Category</option>
//       {(approvedChildcategories[product.subCategory] || []).map((child) => (
//         <option key={child} value={child}>
//           {child}
//         </option>
//       ))}
//     </select>
//   </div>

//   {/* Product Info */}
//   <div className={styles.formGroup}>
//     <label>Product Name</label>
//     <input
//       name="name"
//       value={product.name}
//       onChange={handleChange}
//       placeholder="Product Name"
//     />
//   </div>

//   <div className={styles.formGroup}>
//     <label>Brand</label>
//     <input
//       name="brand"
//       value={product.brand}
//       onChange={handleChange}
//       placeholder="Brand"
//     />
//   </div>

//   <div className={styles.formRow}>
//     <div className={styles.formGroup}>
//       <label>Price</label>
//       <input
//         name="price"
//         type="number"
//         value={product.price}
//         onChange={handleChange}
//         placeholder="Price"
//       />
//     </div>

//     <div className={styles.formGroup}>
//       <label>Discount (%)</label>
//       <input
//         name="discount"
//         type="number"
//         value={product.discount}
//         onChange={handleChange}
//         placeholder="Discount"
//       />
//     </div>
//   </div>

//   {/* Variants */}
//   <div className={styles.formGroup}>
//     <label>Variants</label>

//     {supportsSize(product) && (
//       <select
//         value={variantInput.size}
//         onChange={(e) =>
//           setVariantInput({ ...variantInput, size: e.target.value })
//         }
//       >
//         <option value="">Size</option>
//         {SIZE_OPTIONS.map((s) => (
//           <option key={s} value={s}>
//             {s}
//           </option>
//         ))}
//       </select>
//     )}

//     {/* Color Palette */}
//     <div className={styles.formGroup}>
//       <label>Select Color</label>
//       <div className={styles.colorPalette}>
//         {WEB_SAFE_COLORS.map(({ hex }) => (
//           <div
//             key={hex}
//             className={`${styles.colorCircle} ${
//               variantInput.color === hex ? styles.selected : ""
//             }`}
//             style={{ backgroundColor: hex }}
//             onClick={() =>
//               setVariantInput((prev) => ({ ...prev, color: hex }))
//             }
//           ></div>
//         ))}
//       </div>
//     </div>

//     <input
//       type="number"
//       placeholder="Stock"
//       value={variantInput.stock}
//       onChange={(e) =>
//         setVariantInput({ ...variantInput, stock: e.target.value })
//       }
//     />

//     {/* ✅ SKU Field */}
//     <input
//       type="text"
//       placeholder="SKU (optional)"
//       value={variantInput.sku || ""}
//       onChange={(e) =>
//         setVariantInput({ ...variantInput, sku: e.target.value })
//       }
//     />

//     <button type="button" onClick={addVariant}>
//       ➕ Add Variant
//     </button>

//     {/* Added Variants */}
//     {product.variants.map((v, i) => (
//       <div key={i} className={styles.variantItem}>
//         {supportsSize(product) && `Size: ${v.size} | `}
//         Color:
//         <span
//           style={{
//             background: v.color,
//             display: "inline-block",
//             width: 20,
//             height: 20,
//             borderRadius: "50%",
//             margin: "0 6px",
//           }}
//         ></span>
//         | Stock: {v.stock}
//         {v.sku && <> | SKU: {v.sku}</>}
//         <button type="button" onClick={() => removeVariant(i)}>
//           ❌
//         </button>
//       </div>
//     ))}
//   </div>

//   {/* Images */}
//   <div className={styles.formGroup}>
//     <label>Product Images</label>
//     <input type="file" multiple onChange={handleImageChange} />
//     <div className={styles.previewRow}>
//       {imagePreviews.map((src, i) => (
//         <div key={i}>
//           <img src={src} alt="preview" />
//           <button type="button" onClick={() => removeImage(i)}>
//             ❌
//           </button>
//         </div>
//       ))}
//     </div>
//   </div>

//   {/* Specifications */}
//   <div className={styles.formGroup}>
//     <label>Specifications</label>
//     {product.specifications.map((spec, i) => (
//       <div key={i} className={styles.specRow}>
//         <input
//           placeholder="Label"
//           value={spec.label}
//           onChange={(e) => handleSpecChange(i, "label", e.target.value)}
//         />
//         <input
//           placeholder="Value"
//           value={spec.value}
//           onChange={(e) => handleSpecChange(i, "value", e.target.value)}
//         />
//         {product.specifications.length > 1 && (
//           <button type="button" onClick={() => removeSpecification(i)}>
//             ❌
//           </button>
//         )}
//       </div>
//     ))}
//     <button type="button" onClick={addSpecification}>
//       ➕ Add Specification
//     </button>
//   </div>

//   {/* Remove Button (Bottom) */}
//   <div className={styles.actions}>
//     <button type="button" onClick={removeProduct} className={styles.deleteBtn}>
//       🗑️ Remove 
//     </button>
//   </div>
// </div>

//   );
// };

//   return (
//     <div className={styles.container}>
//       <h1 className={styles.title}>Add Product</h1>

//       {/* Toggle Bulk Mode */}
//       <div className={styles.toggleBulk}>
//         <label>
//           <input
//             type="checkbox"
//             checked={bulkMode}
//             onChange={() => setBulkMode((prev) => !prev)}
//           />
//           Bulk Mode
//         </label>
//       </div>

//       {loadingCategories ? (
//         <p>Loading categories...</p>
//       ) : !bulkMode ? (
//         <form className={styles.form} onSubmit={handleSubmit}>
//           {/* Product Name */}
//           <div className={styles.formGroup}>
//             <label>Product Name</label>
//             <input name="name" value={form.name} onChange={handleChange} />
//             {errors.name && <span className={styles.error}>{errors.name}</span>}
//           </div>

//           {/* Brand */}
//           <div className={styles.formGroup}>
//             <label>Brand</label>
//             <input name="brand" value={form.brand} onChange={handleChange} />
//             {errors.brand && <span className={styles.error}>{errors.brand}</span>}
//           </div>

//           {/* Price & Discount */}
//           <div className={styles.formRow}>
//             <div className={styles.formGroup}>
//               <label>Price</label>
//               <input
//                 type="number"
//                 name="price"
//                 value={form.price}
//                 onChange={handleChange}
//               />
//               {errors.price && <span className={styles.error}>{errors.price}</span>}
//             </div>
//             <div className={styles.formGroup}>
//               <label>Discount (%)</label>
//               <input
//                 type="number"
//                 name="discount"
//                 value={form.discount}
//                 onChange={handleChange}
//               />
//             </div>
//           </div>

//           {/* Variants */}
//           <div className={styles.formGroup}>
//             <label>Variants</label>
//              <div className={styles.variantRow}>
//   {supportsSize() && (
//     <select
//       name="size"
//       value={variantInput.size}
//       onChange={handleVariantInputChange}
//     >
//       <option value="">Size</option>
//       {SIZE_OPTIONS.map((s) => (
//         <option key={s} value={s}>
//           {s}
//         </option>
//       ))}
//     </select>
//   )}

//   <input
//     type="number"
//     name="stock"
//     placeholder="Stock"
//     value={variantInput.stock}
//     onChange={handleVariantInputChange}
//   />

// <input
//     type="text"
//     name="sku"
//     placeholder="SKU"
//     value={variantInput.sku}
//     onChange={handleVariantInputChange}
//   />

// </div>


//             {/* Color Palette */}
//             <div className={styles.formGroup}>
//               <label>Pick Color</label>

//               {/* Search Bar */}
//               <input
//                 type="text"
//                 placeholder="Search color..."
//                 value={colorSearch}
//                 onChange={(e) => setColorSearch(e.target.value)}
//                 className={styles.colorSearch}
//               />

//               {/* Tabs */}
//               <div className={styles.colorTabs}>
//                 {["All", "Red", "Green", "Blue", "Gray"].map((tab) => (
//                   <button
//                     key={tab}
//                     className={`${styles.colorTab} ${
//                       selectedTab === tab ? styles.activeTab : ""
//                     }`}
//                     onClick={() => setSelectedTab(tab)}
//                     type="button"
//                   >
//                     {tab}
//                   </button>
//                 ))}
//               </div>

//               {/* Color grid */}
//               <div className={styles.colorPalette}>
//                 {filteredColors.map(({ name, hex }) => (
//                   <div
//                     key={hex}
//                     className={`${styles.colorCircle} ${
//                       variantInput.color === hex ? styles.selected : ""
//                     }`}
//                     style={{ backgroundColor: hex }}
//                     onClick={() =>
//                       setVariantInput((prev) => ({ ...prev, color: hex }))
//                     }
//                   >
                    
//                   </div>
//                 ))}
//               </div>
//             </div>

//             <button type="button" onClick={addVariant} className={styles.addBtn}>
//               Add Variant
//             </button>

//             <div>
//               {form.variants.map((v, i) => (
//                 <div key={i} className={styles.variantItem}>
//   <span>
//     {supportsSize() && `Size: ${v.size} | `}
//     Color:{" "}
//     <span
//       style={{
//         background: v.color,
//         padding: "0 8px",
//         border: "1px solid #000",
//         display: "inline-block",
//         width: "20px",
//         height: "20px",
//         borderRadius: "50%",
//       }}
//     ></span>
//     {" | "} Stock: {v.stock}
//      {v.sku && ` | SKU: ${v.sku}`}
//   </span>
//   <button type="button" onClick={() => removeVariant(i)}>
//     ❌
//   </button>
// </div>

//               ))}
//             </div>
//           </div>

//          {/* Category */}
// <div className={styles.formGroup}>
//   <label>Category</label>
//   <div className={styles.flexRow}>
//     <select value={form.category} onChange={handleCategoryChange}>
//       <option value="">Select Category</option>
//       {approvedCategories.map((catName) => (
//         <option key={catName} value={catName}>
//           {catName}
//         </option>
//       ))}
//     </select>

//     {/* Request Category Button */}
//     <button
//       type="button"
//       onClick={() => setShowModal(true)}
//       className={styles.requestBtn}
//     >
//       Request Category
//     </button>
//   </div>
//   {errors.category && <span className={styles.error}>{errors.category}</span>}
// </div>

// {/* Subcategory */}
// <div className={styles.formGroup}>
//   <label>Subcategory</label>
//   <select
//     value={form.subCategory}
//     onChange={handleSubCategoryChange}
//     disabled={!form.category}
//   >
//     <option value="">Select Subcategory</option>
//     {(approvedSubcategories[form.category] || []).map((subName) => (
//       <option key={subName} value={subName}>
//         {subName}
//       </option>
//     ))}
//   </select>
//   {errors.subCategory && <span className={styles.error}>{errors.subCategory}</span>}
// </div>

// {/* Child Category */}
// <div className={styles.formGroup}>
//   <label>Child Category</label>
//   <select
//     value={form.childCategory}
//     onChange={handleChildCategoryChange}
//     disabled={!form.subCategory}
//   >
//     <option value="">Select Child Category</option>
//     {(approvedChildcategories[form.subCategory] || []).map((childName) => (
//       <option key={childName} value={childName}>
//         {childName}
//       </option>
//     ))}
//   </select>
//   {errors.childCategory && (
//     <span className={styles.error}>{errors.childCategory}</span>
//   )}
// </div>

//  {/* Modal */}
// {showModal && (
//   <div className={styles.modalOverlay}>
//     <div className={styles.modal}>
//       <h2>Request Category</h2>

//       {/* Category Selectors */}
//       <div className={styles.formGroup}>
//         <label>Category</label>
//         <select
//           value={reqCategory}
//           onChange={(e) => {
//             setReqCategory(e.target.value);
//             setReqSubCategory("");
//             setReqChildCategory("");
//           }}
//         >
//           <option value="">Select Category</option>
//            {Object.keys(fetchedCategories).map((cat) => (
//   <option key={cat} value={cat}>{cat}</option>
// ))}

//         </select>
//       </div>

//       {reqCategory && (
//         <div className={styles.formGroup}>
//           <label>Subcategory</label>
//           <select
//             value={reqSubCategory}
//             onChange={(e) => {
//               setReqSubCategory(e.target.value);
//               setReqChildCategory("");
//             }}
//           >
//             <option value="">Select Subcategory</option>
//              {reqCategory && Object.keys(fetchedCategories[reqCategory] || {}).map((sub) => (
//   <option key={sub} value={sub}>{sub}</option>
// ))}

//           </select>
//         </div>
//       )}

//       {reqSubCategory && (
//         <div className={styles.formGroup}>
//           <label>Child Category</label>
//           <select
//             value={reqChildCategory}
//             onChange={(e) => setReqChildCategory(e.target.value)}
//           >
//             <option value="">Select Child Category</option>
//             {reqSubCategory && (fetchedCategories[reqCategory][reqSubCategory] || []).map((child) => (
//   <option key={child} value={child}>{child}</option>
// ))}

//           </select>
//         </div>
//       )}

//       <button type="button" onClick={handleAddSelection} className={styles.addBtn}>
//         ➕ Add Selection
//       </button>

//       {/* Show Added Selections */}
//       <div className={styles.selectionList}>
//         {requestSelections.map((sel, i) => (
//           <div key={i} className={styles.selectionItem}>
//             <span>
//               {sel.category}
//               {sel.subCategory && ` > ${sel.subCategory}`}
//               {sel.childCategory && ` > ${sel.childCategory}`}
//             </span>
//             <button
//               type="button"
//               onClick={() =>
//                 setRequestSelections((prev) => prev.filter((_, idx) => idx !== i))
//               }
//             >
//               ❌
//             </button>
//           </div>
//         ))}
//       </div>

//       {/* Request Input (auto-filled but editable) */}
//       <textarea
//         placeholder="Your request..."
//         value={requestInput}
//         onChange={(e) => setRequestInput(e.target.value)}
//         className={styles.textArea}
//       />

//       {/* Actions */}
//       <div className={styles.actions}>
//         <button type="button" onClick={() => setShowModal(false)}>
//           Cancel
//         </button>
//         <button type="button" onClick={handleRequestSubmit}>
//           Send Request
//         </button>
//       </div>
//     </div>
//   </div>
// )}


//           {/* Images */}
//           <div className={styles.formGroup}>
//             <label>Product Images</label>
//             <input type="file" multiple accept="image/*" onChange={handleImageChange} />
//             {errors.images && <span className={styles.error}>{errors.images}</span>}
//             <div className={styles.previewRow}>
//               {imagePreviews.map((src, i) => (
//                 <img key={i} src={src} alt="preview" />
//               ))}
//             </div>
//           </div>

//           {/* Specifications */}
//           <div className={styles.formGroup}>
//             <label>Specifications</label>
//             {form.specifications.map((spec, i) => (
//               <div key={i} className={styles.specRow}>
//                 <input
//                   placeholder="Label"
//                   value={spec.label}
//                   onChange={(e) => handleSpecChange(i, "label", e.target.value)}
//                 />
//                 <input
//                   placeholder="Value"
//                   value={spec.value}
//                   onChange={(e) => handleSpecChange(i, "value", e.target.value)}
//                 />
//                 {form.specifications.length > 1 && (
//                   <button type="button" onClick={() => removeSpecification(i)}>
//                     ❌
//                   </button>
//                 )}
//               </div>
//             ))}
//             <button type="button" onClick={addSpecification} className={styles.addBtn}>
//                Add Specification
//             </button>
//           </div>

//           {/* Description */}
//           <div className={styles.formGroup}>
//             <label>Description</label>
//             <textarea name="description" value={form.description} onChange={handleChange} />
//           </div>

//           {/* Pairs With */}
//           <div className={styles.formGroup}>
//             <label>Pairs With (Product IDs)</label>
//             <div className={styles.pairInputRow}>
//               <input
//                 type="text"
//                 placeholder="Enter product ID"
//                 value={form.pairs_with_input || ""}
//                 onChange={(e) =>
//                   setForm((prev) => ({ ...prev, pairs_with_input: e.target.value }))
//                 }
//               />
//               <button
//                 type="button"
//                 onClick={() => {
//                   const newId = (form.pairs_with_input || "").trim();
//                   if (newId && !form.pairs_with.includes(newId)) {
//                     setForm((prev) => ({
//                       ...prev,
//                       pairs_with: [...prev.pairs_with, newId],
//                       pairs_with_input: "",
//                     }));
//                   }
//                 }}
//                 className={styles.addBtn}
//               >
//                  Add
//               </button>
//             </div>

//             <div className={styles.pairList}>
//               {form.pairs_with.map((id, i) => (
//                 <div key={i} className={styles.pairItem}>
//                   <span>{id}</span>
//                   <button
//                     type="button"
//                     onClick={() =>
//                       setForm((prev) => ({
//                         ...prev,
//                         pairs_with: prev.pairs_with.filter((_, idx) => idx !== i),
//                       }))
//                     }
//                   >
//                     ❌
//                   </button>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* Submit & Reset */}
//           <div className={styles.actions}>
//             <button type="submit" className={styles.submitBtn}>
//               Submit
//             </button>
//             <button type="button" onClick={handleReset} className={styles.resetBtn}>
//               Reset
//             </button>
//           </div>
//         </form>
//          ) : (
//         <div>
//           {bulkProducts.map((product, idx) => (
//             <BulkProductRow
//               key={idx}
//               index={idx}
//               product={product}
//               updateProduct={(newData) => {
//                 const temp = [...bulkProducts];
//                 temp[idx] = newData;
//                 setBulkProducts(temp);
//               }}
//               removeProduct={() => {
//                 setBulkProducts((prev) => prev.filter((_, i) => i !== idx));
//               }}
//             />
//           ))}
//           <button
//             type="button"
//             className={styles.addBtn}
//             onClick={() => setBulkProducts((prev) => [...prev, { ...form }])}
//           >
//             ➕ Add Another Product
//           </button>
//           <button type="button" className={styles.submitBtn} onClick={handleBulkSubmit}>
//             Submit Bulk Products
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };






// export default AddProduct;
// import React, { useState, useEffect, useRef } from "react";
// import styles from "./AddProduct.module.css";
// import SizeChartUpload from "./SizeChartUpload";

// const hexValues = ["00", "33", "66", "99", "CC", "FF"];
// const WEB_SAFE_COLORS = [];
// for (let r of hexValues)
//   for (let g of hexValues)
//     for (let b of hexValues)
//       WEB_SAFE_COLORS.push({ name: `#${r}${g}${b}`, hex: `#${r}${g}${b}` });

// const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL"];
// const MEASUREMENT_FIELDS = ["chest", "waist", "hips", "shoulder", "length"];

// const BLANK_VARIANT = () => ({
//   size: "", color: "", colorName: "", colorHex: "", stock: "", sku: "",
//   measurements: { chest: "", waist: "", hips: "", shoulder: "", length: "" },
// });

// const BLANK_PRODUCT = () => ({
//   name: "", brand: "", price: "", discount: "", description: "",
//   specifications: [{ label: "", value: "" }],
//   images: [], category: "", subCategory: "", childCategory: "",
//   variants: [], pairs_with: [], pairs_with_input: "",
// });

// // ── Reusable measurement inputs ──────────────────────────────────────────────
// const MeasurementInputs = ({ values = {}, onChange }) => (
//   <div style={{
//     marginTop: 8, padding: "10px 12px",
//     background: "#f0fdf4", border: "1px solid #bbf7d0",
//     borderRadius: 10, display: "flex", flexWrap: "wrap", gap: 8,
//   }}>
//     <div style={{ width: "100%", fontSize: 12, fontWeight: 600, color: "#166534", marginBottom: 2 }}>
//       📐 Measurements (inches) — optional
//     </div>
//     {MEASUREMENT_FIELDS.map(field => (
//       <label key={field} style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 11, color: "#374151" }}>
//         <span style={{ textTransform: "capitalize", fontWeight: 600 }}>{field}</span>
//         <input
//           type="text" placeholder="e.g. 38" value={values[field] || ""}
//           onChange={e => onChange(field, e.target.value)}
//           style={{ width: 68, padding: "5px 8px", borderRadius: 7, border: "1px solid #d1d5db", fontSize: 13, outline: "none" }}
//         />
//       </label>
//     ))}
//   </div>
// );

// // ── Post-submit result card (single product) ─────────────────────────────────
// const SubmitResultCard = ({ result, supportsSize }) => {
//   const [showSizeChart, setShowSizeChart] = useState(false);
//   if (!result) return null;
//   return (
//     <div style={{
//       margin: "16px 0", padding: "14px 18px",
//       background: result.success ? "#f0fdf4" : "#fef2f2",
//       border: `1.5px solid ${result.success ? "#86efac" : "#fca5a5"}`,
//       borderRadius: 12,
//     }}>
//       <div style={{ fontWeight: 700, fontSize: 14, color: result.success ? "#15803d" : "#b91c1c" }}>
//         {result.success ? "✅ Product submitted!" : "❌ Submission failed"}
//       </div>
//       {result.message && <div style={{ fontSize: 12, color: "#374151", marginTop: 4 }}>{result.message}</div>}
//       {result.success && result.productId && supportsSize && (
//         <div style={{ marginTop: 10 }}>
//           <button type="button"
//             onClick={() => setShowSizeChart(p => !p)}
//             style={{
//               padding: "6px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600,
//               background: showSizeChart ? "#dcfce7" : "white",
//               border: "1.5px solid #16a34a", color: "#16a34a", cursor: "pointer",
//             }}>
//             {showSizeChart ? "▲ Hide size chart" : "📐 Attach size chart"}
//           </button>
//           {showSizeChart && <SizeChartUpload productId={result.productId} />}
//         </div>
//       )}
//     </div>
//   );
// };

// // ── Bulk result card (single row) ────────────────────────────────────────────
// const BulkResultCard = ({ r }) => {
//   const [showSC, setShowSC] = useState(false);
//   return (
//     <div style={{
//       marginBottom: 10, padding: "12px 16px",
//       background: r.success ? "#f0fdf4" : "#fef2f2",
//       border: `1.5px solid ${r.success ? "#86efac" : "#fca5a5"}`,
//       borderRadius: 10,
//     }}>
//       <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
//         <span style={{ fontWeight: 700, fontSize: 13, color: r.success ? "#15803d" : "#b91c1c" }}>
//           {r.success ? "✅" : "❌"} {r.name}
//         </span>
//         {r.success && r.productId && r.supportsSize && (
//           <button type="button" onClick={() => setShowSC(p => !p)} style={{
//             padding: "4px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600,
//             background: showSC ? "#dcfce7" : "white",
//             border: "1.5px solid #16a34a", color: "#16a34a", cursor: "pointer",
//           }}>
//             {showSC ? "▲ Hide" : "📐 Size Chart"}
//           </button>
//         )}
//       </div>
//       {r.message && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>{r.message}</div>}
//       {showSC && r.productId && <SizeChartUpload productId={r.productId} />}
//     </div>
//   );
// };

// // ── Bulk result cards list ────────────────────────────────────────────────────
// const BulkResultCards = ({ results, onClear }) => {
//   if (!results.length) return null;
//   return (
//     <div style={{ marginBottom: 24 }}>
//       <h3 style={{ fontSize: 15, fontWeight: 700, color: "#374151", marginBottom: 12 }}>Submission Results</h3>
//       {results.map((r, i) => <BulkResultCard key={i} r={r} />)}
//       <button type="button" onClick={onClear}
//         style={{ marginTop: 4, fontSize: 12, color: "#6b7280", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
//         Clear results
//       </button>
//     </div>
//   );
// };

// // ── Main component ────────────────────────────────────────────────────────────
// const AddProduct = () => {
//   // Category states
//   const [approvedCategories,     setApprovedCategories]     = useState([]);
//   const [approvedSubcategories,  setApprovedSubcategories]  = useState({});
//   const [approvedChildcategories,setApprovedChildcategories]= useState({});
//   const [loadingCategories,      setLoadingCategories]      = useState(true);
//   const [fetchedCategories,      setFetchedCategories]      = useState({});

//   // Modal state
//   const [showModal,         setShowModal]         = useState(false);
//   const [reqCategory,       setReqCategory]       = useState("");
//   const [reqSubCategory,    setReqSubCategory]    = useState("");
//   const [reqChildCategory,  setReqChildCategory]  = useState("");
//   const [requestSelections, setRequestSelections] = useState([]);
//   const [requestInput,      setRequestInput]      = useState("");

//   // Single product form
//   const [form,          setForm]          = useState(BLANK_PRODUCT());
//   const [imagePreviews, setImagePreviews] = useState([]);
//   const [errors,        setErrors]        = useState({});
//   const [submitResult,  setSubmitResult]  = useState(null); // { success, message, productId }

//   // Variant input
//   const [variantInput, setVariantInput] = useState(BLANK_VARIANT());
//   const [colorSearch,  setColorSearch]  = useState("");
//   const [selectedTab,  setSelectedTab]  = useState("All");

//   // Bulk mode
//   const [bulkMode,        setBulkMode]        = useState(false);
//   const [bulkProducts,    setBulkProducts]    = useState([]);
//   const [bulkResults,     setBulkResults]     = useState([]); // [{ name, success, productId, message }]
//   const [bulkSubmitting,  setBulkSubmitting]  = useState(false);

//   // ── Fetch vendor profile ──
//   useEffect(() => {
//     const fetchVendorProfile = async () => {
//       try {
//         const token = localStorage.getItem("token");
//         const res = await fetch("http://localhost:5000/vendor/profile", {
//           headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
//           credentials: "include",
//         });
//         if (res.ok) {
//           const data = await res.json();
//           setApprovedCategories(data.approved_categories || []);
//           setApprovedSubcategories(data.approved_subcategories || {});
//           setApprovedChildcategories(data.approved_childcategories || {});
//         } else {
//           setApprovedCategories([]); setApprovedSubcategories({}); setApprovedChildcategories({});
//         }
//       } catch { setApprovedCategories([]); setApprovedSubcategories({}); setApprovedChildcategories({}); }
//       setLoadingCategories(false);
//     };
//     fetchVendorProfile();
//   }, []);

//   // ── Fetch all categories (for request modal) ──
//   useEffect(() => {
//     const fetchAllCategories = async () => {
//       try {
//         const res = await fetch("http://localhost:5000/api/categories");
//         if (!res.ok) throw new Error();
//         const data = await res.json();
//         const obj = {};
//         data.categories.forEach(cat => {
//           obj[cat.name] = {};
//           (cat.subCategories || []).forEach(sub => {
//             obj[cat.name][sub.name] = sub.childCategories || [];
//           });
//         });
//         setFetchedCategories(obj);
//       } catch { setFetchedCategories({}); }
//     };
//     fetchAllCategories();
//   }, []);

//   // ── Helpers ──
//   const supportsSize = (p = form) =>
//     p.category === "Clothing" || (p.category === "Handmade" && p.subCategory === "Jewelry");

//   const filterByTab = hex => {
//     if (selectedTab === "All")   return true;
//     if (selectedTab === "Red")   return hex.startsWith("#FF") && hex !== "#FFFFFF";
//     if (selectedTab === "Green") return hex[3] !== "0" && hex.includes("FF") && !hex.startsWith("#FF");
//     if (selectedTab === "Blue")  return hex.endsWith("FF") && !hex.startsWith("#FF");
//     if (selectedTab === "Gray")  return hex[1] === hex[3] && hex[3] === hex[5];
//     return true;
//   };
//   const filteredColors = WEB_SAFE_COLORS.filter(
//     c => c.name.toLowerCase().includes(colorSearch.toLowerCase()) && filterByTab(c.hex)
//   );

//   const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
//   const handleCategoryChange    = e => setForm(p => ({ ...p, category: e.target.value, subCategory: "", childCategory: "" }));
//   const handleSubCategoryChange = e => setForm(p => ({ ...p, subCategory: e.target.value, childCategory: "" }));
//   const handleChildCategoryChange = e => setForm(p => ({ ...p, childCategory: e.target.value }));

//   const handleImageChange = e => {
//     const files = Array.from(e.target.files);
//     setForm(p => ({ ...p, images: files }));
//     setImagePreviews(files.map(f => URL.createObjectURL(f)));
//   };

//   const handleVariantInputChange = e => {
//     const { name, value } = e.target;
//     setVariantInput(p => ({ ...p, [name]: value }));
//   };

//   const handleVariantMeasurementChange = (field, value) =>
//     setVariantInput(p => ({ ...p, measurements: { ...p.measurements, [field]: value } }));

//   const handleSpecChange = (i, field, value) => {
//     setForm(p => { const s = [...p.specifications]; s[i][field] = value; return { ...p, specifications: s }; });
//   };
//   const addSpecification    = () => setForm(p => ({ ...p, specifications: [...p.specifications, { label: "", value: "" }] }));
//   const removeSpecification = i  => setForm(p => ({ ...p, specifications: p.specifications.filter((_, j) => j !== i) }));

//   const addVariant = () => {
//     if ((supportsSize() && !variantInput.size) || !variantInput.color || !variantInput.stock) return;
//     setForm(p => ({ ...p, variants: [...p.variants, { ...variantInput }] }));
//     setVariantInput(BLANK_VARIANT());
//   };
//   const removeVariant = i => setForm(p => ({ ...p, variants: p.variants.filter((_, j) => j !== i) }));

//   const handleReset = () => {
//     setForm(BLANK_PRODUCT()); setImagePreviews([]); setErrors({});
//     setVariantInput(BLANK_VARIANT()); setColorSearch(""); setSelectedTab("All");
//     setSubmitResult(null);
//   };

//   const validate = (p = form) => {
//     const e = {};
//     if (!p.name)          e.name          = "Product name is required";
//     if (!p.brand)         e.brand         = "Brand is required";
//     if (!p.price)         e.price         = "Price is required";
//     if (!p.category)      e.category      = "Category is required";
//     if (!p.subCategory)   e.subCategory   = "Subcategory is required";
//     if (!p.childCategory) e.childCategory = "Child category is required";
//     if (!p.images.length) e.images        = "At least one image is required";
//     setErrors(e);
//     return !Object.keys(e).length;
//   };

//   // ── Submit single product ──
//   const handleSubmit = async e => {
//     e.preventDefault();
//     if (!validate()) return;
//     const formData = new FormData();
//     formData.append("name",           form.name);
//     formData.append("brand",          form.brand);
//     formData.append("price",          form.price);
//     formData.append("discount",       form.discount);
//     formData.append("description",    form.description);
//     formData.append("category",       form.category);
//     formData.append("subcategory",    form.subCategory);
//     formData.append("childcategory",  form.childCategory);
//     formData.append("specifications", JSON.stringify(form.specifications));
//     formData.append("variants",       JSON.stringify(form.variants.map(v => ({
//       ...v, stock: Number(v.stock),
//       colorName: v.colorName || v.color,
//       colorHex:  v.colorHex  || v.color,
//     }))));
//     formData.append("pairs_with", JSON.stringify(form.pairs_with));
//     form.images.forEach(f => formData.append("images", f));
//     try {
//       const token = localStorage.getItem("token");
//       const res = await fetch("http://localhost:5000/vendor/add-product", {
//         method: "POST", credentials: "include",
//         headers: { Authorization: `Bearer ${token}` },
//         body: formData,
//       });
//       const data = await res.json();
//       if (res.ok) {
//         setSubmitResult({ success: true, message: data.message, productId: data.product_id });
//         // reset form but keep result card visible
//         setForm(BLANK_PRODUCT()); setImagePreviews([]);
//         setVariantInput(BLANK_VARIANT()); setColorSearch(""); setSelectedTab("All");
//         setErrors({});
//       } else {
//         setSubmitResult({ success: false, message: data.error || "Unknown error" });
//       }
//     } catch {
//       setSubmitResult({ success: false, message: "Network error" });
//     }
//   };

//   // ── Category request modal handlers ──
//   const handleAddSelection = () => {
//     if (!reqCategory) return;
//     setRequestSelections(p => [...p, { category: reqCategory, subCategory: reqSubCategory, childCategory: reqChildCategory }]);
//   };
//   const handleRequestSubmit = async () => {
//     if (!requestSelections.length && !requestInput.trim()) { alert("Please add a selection or write a request"); return; }
//     try {
//       const token = localStorage.getItem("token");
//       const res = await fetch("http://localhost:5000/vendor/request-category", {
//         method: "POST", credentials: "include",
//         headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//         body: JSON.stringify({ selections: requestSelections, note: requestInput }),
//       });
//       const data = await res.json();
//       if (res.ok) {
//         alert("Category request submitted!");
//         setShowModal(false); setReqCategory(""); setReqSubCategory(""); setReqChildCategory("");
//         setRequestSelections([]); setRequestInput("");
//       } else { alert("Error: " + (data.error || "Unknown error")); }
//     } catch { alert("Network error"); }
//   };

//   // ── Bulk submit — returns product_id per product for size chart attachment ──
//   const handleBulkSubmit = async () => {
//     setBulkSubmitting(true);
//     const results = [];
//     for (const product of bulkProducts) {
//       const formData = new FormData();
//       formData.append("name",           product.name);
//       formData.append("brand",          product.brand);
//       formData.append("price",          product.price);
//       formData.append("discount",       product.discount);
//       formData.append("description",    product.description || "");
//       formData.append("category",       product.category);
//       formData.append("subcategory",    product.subCategory);
//       formData.append("childcategory",  product.childCategory);
//       formData.append("specifications", JSON.stringify(product.specifications));
//       formData.append("variants",       JSON.stringify(product.variants.map(v => ({
//         ...v, stock: Number(v.stock),
//         colorName: v.colorName || v.color,
//         colorHex:  v.colorHex  || v.color,
//       }))));
//       formData.append("pairs_with", JSON.stringify(product.pairs_with || []));
//       (product.images || []).forEach(f => formData.append("images", f));
//       try {
//         const token = localStorage.getItem("token");
//         const res = await fetch("http://localhost:5000/vendor/add-product", {
//           method: "POST", credentials: "include",
//           headers: { Authorization: `Bearer ${token}` },
//           body: formData,
//         });
//         const data = await res.json();
//         results.push({
//           name: product.name || `Product`,
//           success: res.ok,
//           productId: data.product_id || null,
//           message: data.message || data.error || "",
//           supportsSize: supportsSize(product),
//         });
//       } catch (err) {
//         results.push({ name: product.name || `Product`, success: false, message: "Network error", productId: null });
//       }
//     }
//     setBulkResults(results);
//     setBulkProducts([]);
//     setBulkSubmitting(false);
//   };

//   // ── Bulk result cards — rendered in JSX below ───────────────────────────
//   // (BulkResultCard is defined as a top-level component above AddProduct)

//   // ── Bulk product row ─────────────────────────────────────────────────────
//   const BulkProductRow = ({ index, product, updateProduct, removeProduct }) => {
//     const [bVariantInput, setBVariantInput] = useState(BLANK_VARIANT());
//     const [bColorSearch,  setBColorSearch]  = useState("");
//     const [bTab,          setBTab]          = useState("All");
//     const [bPreviews,     setBPreviews]     = useState(
//       (product.images || []).map(f => URL.createObjectURL(f))
//     );
//     const [bErrors, setBErrors] = useState({});

//     const bSupportsSize = () =>
//       product.category === "Clothing" ||
//       (product.category === "Handmade" && product.subCategory === "Jewelry");

//     const bFilterByTab = hex => {
//       if (bTab === "All")   return true;
//       if (bTab === "Red")   return hex.startsWith("#FF") && hex !== "#FFFFFF";
//       if (bTab === "Green") return hex[3] !== "0" && hex.includes("FF") && !hex.startsWith("#FF");
//       if (bTab === "Blue")  return hex.endsWith("FF") && !hex.startsWith("#FF");
//       if (bTab === "Gray")  return hex[1] === hex[3] && hex[3] === hex[5];
//       return true;
//     };
//     const bFilteredColors = WEB_SAFE_COLORS.filter(
//       c => c.name.toLowerCase().includes(bColorSearch.toLowerCase()) && bFilterByTab(c.hex)
//     );

//     // ── per-row validation ──
//     const validateRow = () => {
//       const e = {};
//       if (!product.name)          e.name          = "Required";
//       if (!product.brand)         e.brand         = "Required";
//       if (!product.price)         e.price         = "Required";
//       if (!product.category)      e.category      = "Required";
//       if (!product.subCategory)   e.subCategory   = "Required";
//       if (!product.childCategory) e.childCategory = "Required";
//       setBErrors(e);
//       return !Object.keys(e).length;
//     };

//     const handleChange     = e => updateProduct({ ...product, [e.target.name]: e.target.value });
//     const handleImageChange = e => {
//       const files = Array.from(e.target.files);
//       updateProduct({ ...product, images: files });
//       setBPreviews(files.map(f => URL.createObjectURL(f)));
//     };
//     const removeImage = i => {
//       const ni = product.images.filter((_, j) => j !== i);
//       const np = bPreviews.filter((_, j) => j !== i);
//       updateProduct({ ...product, images: ni });
//       setBPreviews(np);
//     };

//     const bAddVariant = () => {
//       if ((bSupportsSize() && !bVariantInput.size) || !bVariantInput.color || !bVariantInput.stock) return;
//       updateProduct({ ...product, variants: [...product.variants, { ...bVariantInput }] });
//       setBVariantInput(BLANK_VARIANT());
//     };
//     const bRemoveVariant = i => updateProduct({ ...product, variants: product.variants.filter((_, j) => j !== i) });

//     const bSpecChange = (i, field, val) => {
//       const s = [...product.specifications]; s[i][field] = val;
//       updateProduct({ ...product, specifications: s });
//     };
//     const bAddSpec    = () => updateProduct({ ...product, specifications: [...product.specifications, { label: "", value: "" }] });
//     const bRemoveSpec = i  => updateProduct({ ...product, specifications: product.specifications.filter((_, j) => j !== i) });

//     const inputStyle = (errKey) => ({
//       padding: "7px 10px", borderRadius: 8, fontSize: 13, width: "100%", boxSizing: "border-box",
//       border: `1px solid ${bErrors[errKey] ? "#f87171" : "#e5e7eb"}`,
//     });

//     return (
//       <div className={styles.bulkRow}>
//         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
//           <h4 style={{ margin: 0 }}>Product #{index + 1}</h4>
//           <button type="button" onClick={removeProduct} className={styles.deleteBtn}>🗑️ Remove</button>
//         </div>

//         {/* ── Category ── */}
//         <div className={styles.formGroup}>
//           <label>Category {bErrors.category && <span style={{ color: "#ef4444", fontSize: 11 }}>{bErrors.category}</span>}</label>
//           <select value={product.category} style={inputStyle("category")}
//             onChange={e => updateProduct({ ...product, category: e.target.value, subCategory: "", childCategory: "" })}>
//             <option value="">Select Category</option>
//             {approvedCategories.map(c => <option key={c} value={c}>{c}</option>)}
//           </select>
//         </div>
//         <div className={styles.formGroup}>
//           <label>Subcategory {bErrors.subCategory && <span style={{ color: "#ef4444", fontSize: 11 }}>{bErrors.subCategory}</span>}</label>
//           <select value={product.subCategory} disabled={!product.category} style={inputStyle("subCategory")}
//             onChange={e => updateProduct({ ...product, subCategory: e.target.value, childCategory: "" })}>
//             <option value="">Select Subcategory</option>
//             {(approvedSubcategories[product.category] || []).map(s => <option key={s} value={s}>{s}</option>)}
//           </select>
//         </div>
//         <div className={styles.formGroup}>
//           <label>Child Category {bErrors.childCategory && <span style={{ color: "#ef4444", fontSize: 11 }}>{bErrors.childCategory}</span>}</label>
//           <select value={product.childCategory} disabled={!product.subCategory} style={inputStyle("childCategory")}
//             onChange={e => updateProduct({ ...product, childCategory: e.target.value })}>
//             <option value="">Select Child Category</option>
//             {(approvedChildcategories[product.subCategory] || []).map(c => <option key={c} value={c}>{c}</option>)}
//           </select>
//         </div>

//         {/* ── Basic fields ── */}
//         <div className={styles.formGroup}>
//           <label>Product Name {bErrors.name && <span style={{ color: "#ef4444", fontSize: 11 }}>{bErrors.name}</span>}</label>
//           <input name="name" value={product.name} onChange={handleChange} placeholder="Product Name" style={inputStyle("name")} />
//         </div>
//         <div className={styles.formGroup}>
//           <label>Brand {bErrors.brand && <span style={{ color: "#ef4444", fontSize: 11 }}>{bErrors.brand}</span>}</label>
//           <input name="brand" value={product.brand} onChange={handleChange} placeholder="Brand" style={inputStyle("brand")} />
//         </div>
//         <div className={styles.formRow}>
//           <div className={styles.formGroup}>
//             <label>Price {bErrors.price && <span style={{ color: "#ef4444", fontSize: 11 }}>{bErrors.price}</span>}</label>
//             <input name="price" type="number" value={product.price} onChange={handleChange} placeholder="Price" style={inputStyle("price")} />
//           </div>
//           <div className={styles.formGroup}>
//             <label>Discount (%)</label>
//             <input name="discount" type="number" value={product.discount} onChange={handleChange} placeholder="Discount" style={inputStyle()} />
//           </div>
//         </div>

//         {/* ── Description ── */}
//         <div className={styles.formGroup}>
//           <label>Description</label>
//           <textarea name="description" value={product.description || ""}
//             onChange={handleChange}
//             style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, minHeight: 70, boxSizing: "border-box", resize: "vertical" }} />
//         </div>

//         {/* ── Variants ── */}
//         <div className={styles.formGroup}>
//           <label>Variants</label>
//           {bSupportsSize() && (
//             <select value={bVariantInput.size}
//               onChange={e => setBVariantInput(p => ({ ...p, size: e.target.value }))}
//               style={{ marginBottom: 6, padding: "7px 10px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, width: "100%" }}>
//               <option value="">Size</option>
//               {SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
//             </select>
//           )}
//           <input type="text" placeholder="Color name (e.g. Navy Blue)"
//             value={bVariantInput.colorName}
//             onChange={e => setBVariantInput(p => ({ ...p, colorName: e.target.value }))}
//             style={{ marginTop: 6, padding: "7px 10px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, width: "100%", boxSizing: "border-box" }} />
//           <input type="number" placeholder="Stock" value={bVariantInput.stock}
//             onChange={e => setBVariantInput(p => ({ ...p, stock: e.target.value }))}
//             style={{ marginTop: 6, padding: "7px 10px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, width: "100%", boxSizing: "border-box" }} />
//           <input type="text" placeholder="SKU (optional)" value={bVariantInput.sku}
//             onChange={e => setBVariantInput(p => ({ ...p, sku: e.target.value }))}
//             style={{ marginTop: 6, padding: "7px 10px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, width: "100%", boxSizing: "border-box" }} />

//           {/* Color palette */}
//           <div className={styles.formGroup} style={{ marginTop: 8 }}>
//             <label>Pick Color</label>
//             <input type="text" placeholder="Search color..." value={bColorSearch} onChange={e => setBColorSearch(e.target.value)} className={styles.colorSearch} />
//             <div className={styles.colorTabs}>
//               {["All", "Red", "Green", "Blue", "Gray"].map(tab => (
//                 <button key={tab} type="button"
//                   className={`${styles.colorTab} ${bTab === tab ? styles.activeTab : ""}`}
//                   onClick={() => setBTab(tab)}>{tab}</button>
//               ))}
//             </div>
//             {bVariantInput.color && (
//               <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 0" }}>
//                 <div style={{ width: 24, height: 24, borderRadius: "50%", background: bVariantInput.color, border: "2px solid #ccc" }} />
//                 <span style={{ fontSize: 12, color: "#555" }}>{bVariantInput.color}</span>
//               </div>
//             )}
//             <div className={styles.colorPalette}>
//               {bFilteredColors.map(({ hex }) => (
//                 <div key={hex}
//                   className={`${styles.colorCircle} ${bVariantInput.color === hex ? styles.selected : ""}`}
//                   style={{ backgroundColor: hex }}
//                   onClick={() => setBVariantInput(p => ({
//                     ...p, color: hex, colorHex: hex,
//                     colorName: p.colorName.trim() ? p.colorName : hex,
//                   }))}
//                 />
//               ))}
//             </div>
//           </div>

//           {bSupportsSize() && (
//             <MeasurementInputs
//               values={bVariantInput.measurements}
//               onChange={(field, val) => setBVariantInput(p => ({ ...p, measurements: { ...p.measurements, [field]: val } }))}
//             />
//           )}

//           <button type="button" onClick={bAddVariant} className={styles.addBtn} style={{ marginTop: 10 }}>
//             ➕ Add Variant
//           </button>

//           {product.variants.map((v, i) => (
//             <div key={i} className={styles.variantItem}>
//               {bSupportsSize() && <span>Size: <strong>{v.size}</strong> | </span>}
//               <span style={{ display: "inline-block", width: 16, height: 16, borderRadius: "50%",
//                 background: v.color, border: "1px solid #ccc", margin: "0 4px", verticalAlign: "middle" }} />
//               <span><strong>{v.colorName || v.color}</strong></span>
//               <span> | Stock: <strong>{v.stock}</strong></span>
//               {v.sku && <span> | SKU: <strong>{v.sku}</strong></span>}
//               {v.measurements && Object.values(v.measurements).some(Boolean) && (
//                 <span style={{ fontSize: 11, color: "#16a34a", marginLeft: 6 }}>
//                   📐 {Object.entries(v.measurements).filter(([,val]) => val).map(([k,val]) => `${k}:${val}`).join(", ")}
//                 </span>
//               )}
//               <button type="button" onClick={() => bRemoveVariant(i)}>❌</button>
//             </div>
//           ))}
//         </div>

//         {/* ── Images ── */}
//         <div className={styles.formGroup}>
//           <label>Product Images</label>
//           <input type="file" multiple onChange={handleImageChange} />
//           <div className={styles.previewRow}>
//             {bPreviews.map((src, i) => (
//               <div key={i} style={{ position: "relative", display: "inline-block" }}>
//                 <img src={src} alt="preview" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 6 }} />
//                 <button type="button" onClick={() => removeImage(i)}
//                   style={{ position: "absolute", top: -6, right: -6, background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>❌</button>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* ── Specifications ── */}
//         <div className={styles.formGroup}>
//           <label>Specifications</label>
//           {product.specifications.map((spec, i) => (
//             <div key={i} className={styles.specRow}>
//               <input placeholder="Label" value={spec.label} onChange={e => bSpecChange(i, "label", e.target.value)} />
//               <input placeholder="Value" value={spec.value} onChange={e => bSpecChange(i, "value", e.target.value)} />
//               {product.specifications.length > 1 && (
//                 <button type="button" onClick={() => bRemoveSpec(i)}>❌</button>
//               )}
//             </div>
//           ))}
//           <button type="button" onClick={bAddSpec}>➕ Add Specification</button>
//         </div>

//         {/* ── Pairs With ── */}
//         <div className={styles.formGroup}>
//           <label>Pairs With (Product IDs)</label>
//           <div className={styles.pairInputRow}>
//             <input type="text" placeholder="Enter product ID"
//               value={product.pairs_with_input || ""}
//               onChange={e => updateProduct({ ...product, pairs_with_input: e.target.value })} />
//             <button type="button" className={styles.addBtn}
//               onClick={() => {
//                 const id = (product.pairs_with_input || "").trim();
//                 if (id && !(product.pairs_with || []).includes(id))
//                   updateProduct({ ...product, pairs_with: [...(product.pairs_with || []), id], pairs_with_input: "" });
//               }}>
//               ➕ Add
//             </button>
//           </div>
//           <div className={styles.pairList}>
//             {(product.pairs_with || []).map((id, i) => (
//               <div key={i} className={styles.pairItem}>
//                 <span>{id}</span>
//                 <button type="button"
//                   onClick={() => updateProduct({ ...product, pairs_with: product.pairs_with.filter((_, j) => j !== i) })}>❌</button>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // ── RENDER ────────────────────────────────────────────────────────────────
//   return (
//     <div className={styles.container}>
//       <h1 className={styles.title}>Add Product</h1>

//       <div className={styles.toggleBulk}>
//         <label>
//           <input type="checkbox" checked={bulkMode} onChange={() => { setBulkMode(p => !p); setBulkResults([]); }} />
//           &nbsp;Bulk Mode
//         </label>
//       </div>

//       {loadingCategories ? <p>Loading categories…</p> : !bulkMode ? (
//         /* ══════════════════════════════════════════
//            SINGLE PRODUCT FORM
//         ══════════════════════════════════════════ */
//         <>
//           {/* Result card appears above the (already-reset) form */}
//           <SubmitResultCard result={submitResult} supportsSize={submitResult?.productId && supportsSize()} />

//           <form className={styles.form} onSubmit={handleSubmit}>

//             <div className={styles.formGroup}>
//               <label>Product Name</label>
//               <input name="name" value={form.name} onChange={handleChange} />
//               {errors.name && <span className={styles.error}>{errors.name}</span>}
//             </div>

//             <div className={styles.formGroup}>
//               <label>Brand</label>
//               <input name="brand" value={form.brand} onChange={handleChange} />
//               {errors.brand && <span className={styles.error}>{errors.brand}</span>}
//             </div>

//             <div className={styles.formRow}>
//               <div className={styles.formGroup}>
//                 <label>Price</label>
//                 <input type="number" name="price" value={form.price} onChange={handleChange} />
//                 {errors.price && <span className={styles.error}>{errors.price}</span>}
//               </div>
//               <div className={styles.formGroup}>
//                 <label>Discount (%)</label>
//                 <input type="number" name="discount" value={form.discount} onChange={handleChange} />
//               </div>
//             </div>

//             {/* ── Variants ── */}
//             <div className={styles.formGroup}>
//               <label>Variants</label>
//               <div className={styles.variantRow}>
//                 {supportsSize() && (
//                   <select name="size" value={variantInput.size} onChange={handleVariantInputChange}>
//                     <option value="">Size</option>
//                     {SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
//                   </select>
//                 )}
//                 <input type="number" name="stock" placeholder="Stock" value={variantInput.stock} onChange={handleVariantInputChange} />
//                 <input type="text" name="sku" placeholder="SKU (optional)" value={variantInput.sku} onChange={handleVariantInputChange} />
//               </div>
//               <input type="text" name="colorName" placeholder="Color name (e.g. Navy Blue)"
//                 value={variantInput.colorName}
//                 onChange={e => setVariantInput(p => ({ ...p, colorName: e.target.value }))}
//                 className={styles.colorSearch} style={{ marginTop: 6 }} />

//               <div className={styles.formGroup}>
//                 <label>Pick Color</label>
//                 <input type="text" placeholder="Search color..." value={colorSearch}
//                   onChange={e => setColorSearch(e.target.value)} className={styles.colorSearch} />
//                 <div className={styles.colorTabs}>
//                   {["All", "Red", "Green", "Blue", "Gray"].map(tab => (
//                     <button key={tab} type="button"
//                       className={`${styles.colorTab} ${selectedTab === tab ? styles.activeTab : ""}`}
//                       onClick={() => setSelectedTab(tab)}>{tab}</button>
//                   ))}
//                 </div>
//                 {variantInput.color && (
//                   <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 0" }}>
//                     <div style={{ width: 24, height: 24, borderRadius: "50%", background: variantInput.color, border: "2px solid #ccc" }} />
//                     <span style={{ fontSize: 12, color: "#555" }}>{variantInput.color}</span>
//                   </div>
//                 )}
//                 <div className={styles.colorPalette}>
//                   {filteredColors.map(({ hex }) => (
//                     <div key={hex}
//                       className={`${styles.colorCircle} ${variantInput.color === hex ? styles.selected : ""}`}
//                       style={{ backgroundColor: hex }}
//                       onClick={() => setVariantInput(p => ({
//                         ...p, color: hex, colorHex: hex,
//                         colorName: p.colorName.trim() ? p.colorName : hex,
//                       }))}
//                     />
//                   ))}
//                 </div>
//               </div>

//               {supportsSize() && (
//                 <MeasurementInputs values={variantInput.measurements} onChange={handleVariantMeasurementChange} />
//               )}

//               <button type="button" onClick={addVariant} className={styles.addBtn}>➕ Add Variant</button>

//               <div>
//                 {form.variants.map((v, i) => (
//                   <div key={i} className={styles.variantItem}>
//                     {supportsSize() && <span>Size: <strong>{v.size}</strong> | </span>}
//                     Color: <span style={{ display: "inline-block", width: 16, height: 16, borderRadius: "50%",
//                       background: v.color, border: "1px solid #ccc", margin: "0 4px", verticalAlign: "middle" }} />
//                     <strong>{v.colorName || v.color}</strong>
//                     {" | "} Stock: <strong>{v.stock}</strong>
//                     {v.sku && <> | SKU: <strong>{v.sku}</strong></>}
//                     {v.measurements && Object.values(v.measurements).some(Boolean) && (
//                       <span style={{ fontSize: 11, color: "#16a34a", marginLeft: 6 }}>
//                         📐 {Object.entries(v.measurements).filter(([,val]) => val).map(([k,val]) => `${k}:${val}`).join(", ")}
//                       </span>
//                     )}
//                     <button type="button" onClick={() => removeVariant(i)}>❌</button>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* Category */}
//             <div className={styles.formGroup}>
//               <label>Category</label>
//               <div className={styles.flexRow}>
//                 <select value={form.category} onChange={handleCategoryChange}>
//                   <option value="">Select Category</option>
//                   {approvedCategories.map(c => <option key={c} value={c}>{c}</option>)}
//                 </select>
//                 <button type="button" onClick={() => setShowModal(true)} className={styles.requestBtn}>
//                   Request Category
//                 </button>
//               </div>
//               {errors.category && <span className={styles.error}>{errors.category}</span>}
//             </div>
//             <div className={styles.formGroup}>
//               <label>Subcategory</label>
//               <select value={form.subCategory} onChange={handleSubCategoryChange} disabled={!form.category}>
//                 <option value="">Select Subcategory</option>
//                 {(approvedSubcategories[form.category] || []).map(s => <option key={s} value={s}>{s}</option>)}
//               </select>
//               {errors.subCategory && <span className={styles.error}>{errors.subCategory}</span>}
//             </div>
//             <div className={styles.formGroup}>
//               <label>Child Category</label>
//               <select value={form.childCategory} onChange={handleChildCategoryChange} disabled={!form.subCategory}>
//                 <option value="">Select Child Category</option>
//                 {(approvedChildcategories[form.subCategory] || []).map(c => <option key={c} value={c}>{c}</option>)}
//               </select>
//               {errors.childCategory && <span className={styles.error}>{errors.childCategory}</span>}
//             </div>

//             {/* Category Request Modal */}
//             {showModal && (
//               <div className={styles.modalOverlay}>
//                 <div className={styles.modal}>
//                   <h2>Request Category</h2>
//                   <div className={styles.formGroup}>
//                     <label>Category</label>
//                     <select value={reqCategory} onChange={e => { setReqCategory(e.target.value); setReqSubCategory(""); setReqChildCategory(""); }}>
//                       <option value="">Select Category</option>
//                       {Object.keys(fetchedCategories).map(c => <option key={c} value={c}>{c}</option>)}
//                     </select>
//                   </div>
//                   {reqCategory && (
//                     <div className={styles.formGroup}>
//                       <label>Subcategory</label>
//                       <select value={reqSubCategory} onChange={e => { setReqSubCategory(e.target.value); setReqChildCategory(""); }}>
//                         <option value="">Select Subcategory</option>
//                         {Object.keys(fetchedCategories[reqCategory] || {}).map(s => <option key={s} value={s}>{s}</option>)}
//                       </select>
//                     </div>
//                   )}
//                   {reqSubCategory && (
//                     <div className={styles.formGroup}>
//                       <label>Child Category</label>
//                       <select value={reqChildCategory} onChange={e => setReqChildCategory(e.target.value)}>
//                         <option value="">Select Child Category</option>
//                         {(fetchedCategories[reqCategory]?.[reqSubCategory] || []).map(c => <option key={c} value={c}>{c}</option>)}
//                       </select>
//                     </div>
//                   )}
//                   <button type="button" onClick={handleAddSelection} className={styles.addBtn}>➕ Add Selection</button>
//                   <div className={styles.selectionList}>
//                     {requestSelections.map((sel, i) => (
//                       <div key={i} className={styles.selectionItem}>
//                         <span>{sel.category}{sel.subCategory && ` > ${sel.subCategory}`}{sel.childCategory && ` > ${sel.childCategory}`}</span>
//                         <button type="button" onClick={() => setRequestSelections(p => p.filter((_, j) => j !== i))}>❌</button>
//                       </div>
//                     ))}
//                   </div>
//                   <textarea placeholder="Your request..." value={requestInput}
//                     onChange={e => setRequestInput(e.target.value)} className={styles.textArea} />
//                   <div className={styles.actions}>
//                     <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
//                     <button type="button" onClick={handleRequestSubmit}>Send Request</button>
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* Images */}
//             <div className={styles.formGroup}>
//               <label>Product Images</label>
//               <input type="file" multiple accept="image/*" onChange={handleImageChange} />
//               {errors.images && <span className={styles.error}>{errors.images}</span>}
//               <div className={styles.previewRow}>
//                 {imagePreviews.map((src, i) => <img key={i} src={src} alt="preview" />)}
//               </div>
//             </div>

//             {/* Specifications */}
//             <div className={styles.formGroup}>
//               <label>Specifications</label>
//               {form.specifications.map((spec, i) => (
//                 <div key={i} className={styles.specRow}>
//                   <input placeholder="Label" value={spec.label} onChange={e => handleSpecChange(i, "label", e.target.value)} />
//                   <input placeholder="Value" value={spec.value} onChange={e => handleSpecChange(i, "value", e.target.value)} />
//                   {form.specifications.length > 1 && <button type="button" onClick={() => removeSpecification(i)}>❌</button>}
//                 </div>
//               ))}
//               <button type="button" onClick={addSpecification} className={styles.addBtn}>➕ Add Specification</button>
//             </div>

//             {/* Description */}
//             <div className={styles.formGroup}>
//               <label>Description</label>
//               <textarea name="description" value={form.description} onChange={handleChange} />
//             </div>

//             {/* Pairs With */}
//             <div className={styles.formGroup}>
//               <label>Pairs With (Product IDs)</label>
//               <div className={styles.pairInputRow}>
//                 <input type="text" placeholder="Enter product ID"
//                   value={form.pairs_with_input || ""}
//                   onChange={e => setForm(p => ({ ...p, pairs_with_input: e.target.value }))} />
//                 <button type="button" className={styles.addBtn}
//                   onClick={() => {
//                     const id = (form.pairs_with_input || "").trim();
//                     if (id && !form.pairs_with.includes(id))
//                       setForm(p => ({ ...p, pairs_with: [...p.pairs_with, id], pairs_with_input: "" }));
//                   }}>➕ Add</button>
//               </div>
//               <div className={styles.pairList}>
//                 {form.pairs_with.map((id, i) => (
//                   <div key={i} className={styles.pairItem}>
//                     <span>{id}</span>
//                     <button type="button" onClick={() => setForm(p => ({ ...p, pairs_with: p.pairs_with.filter((_, j) => j !== i) }))}>❌</button>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             <div className={styles.actions}>
//               <button type="submit" className={styles.submitBtn}>Submit</button>
//               <button type="button" onClick={handleReset} className={styles.resetBtn}>Reset</button>
//             </div>
//           </form>
//         </>

//       ) : (
//         /* ══════════════════════════════════════════
//            BULK MODE
//         ══════════════════════════════════════════ */
//         <div>
//           {/* Result cards from previous bulk submit */}
//           <BulkResultCards results={bulkResults} onClear={() => setBulkResults([])} />

//           {bulkProducts.map((product, idx) => (
//             <BulkProductRow
//               key={idx}
//               index={idx}
//               product={product}
//               updateProduct={newData => {
//                 const temp = [...bulkProducts]; temp[idx] = newData; setBulkProducts(temp);
//               }}
//               removeProduct={() => setBulkProducts(p => p.filter((_, i) => i !== idx))}
//             />
//           ))}

//           <button type="button" className={styles.addBtn}
//             onClick={() => setBulkProducts(p => [...p, {
//               name: "", brand: "", price: "", discount: "", description: "",
//               specifications: [{ label: "", value: "" }],
//               images: [], category: "", subCategory: "", childCategory: "",
//               variants: [], pairs_with: [], pairs_with_input: "",
//             }])}>
//             ➕ Add Another Product
//           </button>

//           {bulkProducts.length > 0 && (
//             <button type="button" className={styles.submitBtn}
//               disabled={bulkSubmitting}
//               onClick={handleBulkSubmit}
//               style={{ marginLeft: 12 }}>
//               {bulkSubmitting ? "Submitting…" : `Submit ${bulkProducts.length} Product${bulkProducts.length > 1 ? "s" : ""}`}
//             </button>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default AddProduct;


import React, { useState, useEffect } from "react";
import styles from "./AddProduct.module.css";
import SizeChartUpload from "./SizeChartUpload";

const hexValues = ["00", "33", "66", "99", "CC", "FF"];
const WEB_SAFE_COLORS = [];
for (let r of hexValues)
  for (let g of hexValues)
    for (let b of hexValues)
      WEB_SAFE_COLORS.push({ name: `#${r}${g}${b}`, hex: `#${r}${g}${b}` });

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL"];
const MEASUREMENT_FIELDS = ["chest", "waist", "hips", "shoulder", "length"];

const BLANK_VARIANT = () => ({
  size: "", color: "", colorName: "", colorHex: "", stock: "", sku: "",
  measurements: { chest: "", waist: "", hips: "", shoulder: "", length: "" },
});

const BLANK_PRODUCT = () => ({
  name: "", brand: "", price: "", discount: "", description: "",
  specifications: [{ label: "", value: "" }],
  images: [], category: "", subCategory: "", childCategory: "",
  variants: [], pairs_with: [], pairs_with_input: "",
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
        <input
          type="text" placeholder="e.g. 38" value={values[field] || ""}
          onChange={e => onChange(field, e.target.value)}
          style={{ width: 68, padding: "5px 8px", borderRadius: 7, border: "1px solid #d1d5db", fontSize: 13, outline: "none" }}
        />
      </label>
    ))}
  </div>
);

// ── Color Picker — separated from color name ─────────────────────────────────
// Shows only the hex grid + search + tabs. Never touches colorName.
const ColorPicker = ({ selectedHex, onSelect, colorSearch, setColorSearch, selectedTab, setSelectedTab }) => {
  const filterByTab = hex => {
    if (selectedTab === "All")   return true;
    if (selectedTab === "Red")   return hex.startsWith("#FF") && hex !== "#FFFFFF";
    if (selectedTab === "Green") return hex[3] !== "0" && hex.includes("FF") && !hex.startsWith("#FF");
    if (selectedTab === "Blue")  return hex.endsWith("FF") && !hex.startsWith("#FF");
    if (selectedTab === "Gray")  return hex[1] === hex[3] && hex[3] === hex[5];
    return true;
  };
  const filtered = WEB_SAFE_COLORS.filter(
    c => c.hex.toLowerCase().includes(colorSearch.toLowerCase()) && filterByTab(c.hex)
  );
  return (
    <div style={{ marginTop: 8 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
        Pick Color (hex) <span style={{ fontWeight: 400, color: "#6b7280" }}>— type name above separately</span>
      </label>

      {/* Search */}
      <input type="text" placeholder="Search hex e.g. #FF0000"
        value={colorSearch} onChange={e => setColorSearch(e.target.value)}
        className={styles.colorSearch} />

      {/* Tabs */}
      <div className={styles.colorTabs}>
        {["All", "Red", "Green", "Blue", "Gray"].map(tab => (
          <button key={tab} type="button"
            className={`${styles.colorTab} ${selectedTab === tab ? styles.activeTab : ""}`}
            onClick={() => setSelectedTab(tab)}>{tab}</button>
        ))}
      </div>

      {/* Selected preview */}
      {selectedHex && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 0" }}>
          <div style={{ width: 24, height: 24, borderRadius: "50%",
            background: selectedHex, border: "2px solid #ccc", flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: "#555" }}>{selectedHex}</span>
          <span style={{ fontSize: 11, color: "#9ca3af" }}>← hex picked</span>
        </div>
      )}

      {/* Grid */}
      <div className={styles.colorPalette}>
        {filtered.map(({ hex }) => (
          <div key={hex}
            className={`${styles.colorCircle} ${selectedHex === hex ? styles.selected : ""}`}
            style={{ backgroundColor: hex }}
            onClick={() => onSelect(hex)}  // ← ONLY sets hex, never touches colorName
          />
        ))}
      </div>
    </div>
  );
};

// ── Post-submit result card ──────────────────────────────────────────────────
const SubmitResultCard = ({ result, showSizeUpload }) => {
  const [showSC, setShowSC] = useState(false);
  if (!result) return null;
  return (
    <div style={{
      margin: "16px 0", padding: "14px 18px",
      background: result.success ? "#f0fdf4" : "#fef2f2",
      border: `1.5px solid ${result.success ? "#86efac" : "#fca5a5"}`,
      borderRadius: 12,
    }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: result.success ? "#15803d" : "#b91c1c" }}>
        {result.success ? "✅ Product submitted!" : "❌ Submission failed"}
      </div>
      {result.message && <div style={{ fontSize: 12, color: "#374151", marginTop: 4 }}>{result.message}</div>}
      {result.success && result.productId && (
        <div style={{ marginTop: 10 }}>
          <button type="button" onClick={() => setShowSC(p => !p)}
            style={{
              padding: "6px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: showSC ? "#dcfce7" : "white",
              border: "1.5px solid #16a34a", color: "#16a34a", cursor: "pointer",
            }}>
            {showSC ? "▲ Hide size chart upload" : "📐 Upload Size Chart (optional)"}
          </button>
          {showSC && <SizeChartUpload productId={result.productId} role="vendor" />}
        </div>
      )}
    </div>
  );
};

// ── Bulk result card ─────────────────────────────────────────────────────────
const BulkResultCard = ({ r }) => {
  const [showSC, setShowSC] = useState(false);
  return (
    <div style={{
      marginBottom: 10, padding: "12px 16px",
      background: r.success ? "#f0fdf4" : "#fef2f2",
      border: `1.5px solid ${r.success ? "#86efac" : "#fca5a5"}`,
      borderRadius: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: r.success ? "#15803d" : "#b91c1c" }}>
          {r.success ? "✅" : "❌"} {r.name}
        </span>
        {r.success && r.productId && (
          <button type="button" onClick={() => setShowSC(p => !p)} style={{
            padding: "4px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600,
            background: showSC ? "#dcfce7" : "white",
            border: "1.5px solid #16a34a", color: "#16a34a", cursor: "pointer",
          }}>
            {showSC ? "▲ Hide" : "📐 Size Chart"}
          </button>
        )}
      </div>
      {r.message && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>{r.message}</div>}
      {showSC && r.productId && <SizeChartUpload productId={r.productId} role="vendor" />}
    </div>
  );
};

const BulkResultCards = ({ results, onClear }) => {
  if (!results.length) return null;
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#374151", marginBottom: 12 }}>Submission Results</h3>
      {results.map((r, i) => <BulkResultCard key={i} r={r} />)}
      <button type="button" onClick={onClear}
        style={{ marginTop: 4, fontSize: 12, color: "#6b7280", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
        Clear results
      </button>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const AddProduct = () => {
  const [approvedCategories,      setApprovedCategories]      = useState([]);
  const [approvedSubcategories,   setApprovedSubcategories]   = useState({});
  const [approvedChildcategories, setApprovedChildcategories] = useState({});
  const [loadingCategories,       setLoadingCategories]       = useState(true);
  const [fetchedCategories,       setFetchedCategories]       = useState({});

  const [showModal,         setShowModal]         = useState(false);
  const [reqCategory,       setReqCategory]       = useState("");
  const [reqSubCategory,    setReqSubCategory]    = useState("");
  const [reqChildCategory,  setReqChildCategory]  = useState("");
  const [requestSelections, setRequestSelections] = useState([]);
  const [requestInput,      setRequestInput]      = useState("");

  const [form,          setForm]          = useState(BLANK_PRODUCT());
  const [imagePreviews, setImagePreviews] = useState([]);
  const [errors,        setErrors]        = useState({});
  const [submitResult,  setSubmitResult]  = useState(null);

  const [variantInput, setVariantInput] = useState(BLANK_VARIANT());
  // ✅ color picker state is SEPARATE from colorName
  const [colorSearch,  setColorSearch]  = useState("");
  const [selectedTab,  setSelectedTab]  = useState("All");

  const [bulkMode,       setBulkMode]       = useState(false);
  const [bulkProducts,   setBulkProducts]   = useState([]);
  const [bulkResults,    setBulkResults]    = useState([]);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  useEffect(() => {
    const fetchVendorProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/vendor/profile", {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setApprovedCategories(data.approved_categories || []);
          setApprovedSubcategories(data.approved_subcategories || {});
          setApprovedChildcategories(data.approved_childcategories || {});
        }
      } catch {}
      setLoadingCategories(false);
    };
    fetchVendorProfile();
  }, []);

  useEffect(() => {
    const fetchAllCategories = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/categories");
        if (!res.ok) throw new Error();
        const data = await res.json();
        const obj = {};
        data.categories.forEach(cat => {
          obj[cat.name] = {};
          (cat.subCategories || []).forEach(sub => {
            obj[cat.name][sub.name] = sub.childCategories || [];
          });
        });
        setFetchedCategories(obj);
      } catch {}
    };
    fetchAllCategories();
  }, []);

  const supportsSize = (p = form) =>
    p.category === "Clothing" || (p.category === "Handmade" && p.subCategory === "Jewelry");

  const handleChange              = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleCategoryChange      = e => setForm(p => ({ ...p, category: e.target.value, subCategory: "", childCategory: "" }));
  const handleSubCategoryChange   = e => setForm(p => ({ ...p, subCategory: e.target.value, childCategory: "" }));
  const handleChildCategoryChange = e => setForm(p => ({ ...p, childCategory: e.target.value }));
  const handleImageChange         = e => {
    const files = Array.from(e.target.files);
    setForm(p => ({ ...p, images: files }));
    setImagePreviews(files.map(f => URL.createObjectURL(f)));
  };
  const handleVariantMeasurementChange = (field, value) =>
    setVariantInput(p => ({ ...p, measurements: { ...p.measurements, [field]: value } }));

  const handleSpecChange    = (i, field, val) => {
    setForm(p => { const s = [...p.specifications]; s[i][field] = val; return { ...p, specifications: s }; });
  };
  const addSpecification    = () => setForm(p => ({ ...p, specifications: [...p.specifications, { label: "", value: "" }] }));
  const removeSpecification = i  => setForm(p => ({ ...p, specifications: p.specifications.filter((_, j) => j !== i) }));

  const addVariant = () => {
    // color is required; colorName is optional (vendor may or may not type it)
    if ((supportsSize() && !variantInput.size) || !variantInput.color || !variantInput.stock) return;
    setForm(p => ({ ...p, variants: [...p.variants, { ...variantInput }] }));
    setVariantInput(BLANK_VARIANT());
    setColorSearch(""); setSelectedTab("All");
  };
  const removeVariant = i => setForm(p => ({ ...p, variants: p.variants.filter((_, j) => j !== i) }));

  const handleReset = () => {
    setForm(BLANK_PRODUCT()); setImagePreviews([]); setErrors({});
    setVariantInput(BLANK_VARIANT()); setColorSearch(""); setSelectedTab("All");
    setSubmitResult(null);
  };

  const validate = (p = form) => {
    const e = {};
    if (!p.name)          e.name          = "Product name is required";
    if (!p.brand)         e.brand         = "Brand is required";
    if (!p.price)         e.price         = "Price is required";
    if (!p.category)      e.category      = "Category is required";
    if (!p.subCategory)   e.subCategory   = "Subcategory is required";
    if (!p.childCategory) e.childCategory = "Child category is required";
    if (!p.images.length) e.images        = "At least one image is required";
    setErrors(e); return !Object.keys(e).length;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validate()) return;
    const fd = new FormData();
    fd.append("name",           form.name);
    fd.append("brand",          form.brand);
    fd.append("price",          form.price);
    fd.append("discount",       form.discount);
    fd.append("description",    form.description);
    fd.append("category",       form.category);
    fd.append("subcategory",    form.subCategory);
    fd.append("childcategory",  form.childCategory);
    fd.append("specifications", JSON.stringify(form.specifications));
    fd.append("variants", JSON.stringify(form.variants.map(v => ({
      ...v, stock: Number(v.stock),
      colorName: v.colorName || v.color, // fallback to hex if name not typed
      colorHex:  v.colorHex  || v.color,
    }))));
    fd.append("pairs_with", JSON.stringify(form.pairs_with));
    form.images.forEach(f => fd.append("images", f));
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/vendor/add-product", {
        method: "POST", credentials: "include",
        headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitResult({ success: true, message: data.message, productId: data.product_id });
        setForm(BLANK_PRODUCT()); setImagePreviews([]);
        setVariantInput(BLANK_VARIANT()); setColorSearch(""); setSelectedTab("All"); setErrors({});
      } else {
        setSubmitResult({ success: false, message: data.error || "Unknown error" });
      }
    } catch { setSubmitResult({ success: false, message: "Network error" }); }
  };

  const handleAddSelection = () => {
    if (!reqCategory) return;
    setRequestSelections(p => [...p, { category: reqCategory, subCategory: reqSubCategory, childCategory: reqChildCategory }]);
  };
  const handleRequestSubmit = async () => {
    if (!requestSelections.length && !requestInput.trim()) { alert("Please add a selection or write a request"); return; }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/vendor/request-category", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ selections: requestSelections, note: requestInput }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Category request submitted!");
        setShowModal(false); setReqCategory(""); setReqSubCategory(""); setReqChildCategory("");
        setRequestSelections([]); setRequestInput("");
      } else { alert("Error: " + (data.error || "Unknown error")); }
    } catch { alert("Network error"); }
  };

  const handleBulkSubmit = async () => {
    setBulkSubmitting(true);
    const results = [];
    for (const product of bulkProducts) {
      const fd = new FormData();
      fd.append("name",           product.name);
      fd.append("brand",          product.brand);
      fd.append("price",          product.price);
      fd.append("discount",       product.discount);
      fd.append("description",    product.description || "");
      fd.append("category",       product.category);
      fd.append("subcategory",    product.subCategory);
      fd.append("childcategory",  product.childCategory);
      fd.append("specifications", JSON.stringify(product.specifications));
      fd.append("variants",       JSON.stringify(product.variants.map(v => ({
        ...v, stock: Number(v.stock),
        colorName: v.colorName || v.color,
        colorHex:  v.colorHex  || v.color,
      }))));
      fd.append("pairs_with", JSON.stringify(product.pairs_with || []));
      (product.images || []).forEach(f => fd.append("images", f));
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/vendor/add-product", {
          method: "POST", credentials: "include",
          headers: { Authorization: `Bearer ${token}` }, body: fd,
        });
        const data = await res.json();
        results.push({
          name: product.name || "Product",
          success: res.ok,
          productId: data.product_id || null,
          message: data.message || data.error || "",
        });
      } catch { results.push({ name: product.name || "Product", success: false, message: "Network error", productId: null }); }
    }
    setBulkResults(results); setBulkProducts([]); setBulkSubmitting(false);
  };

  // ── Bulk product row ─────────────────────────────────────────────────────
  const BulkProductRow = ({ index, product, updateProduct, removeProduct }) => {
    const [bVariantInput, setBVariantInput] = useState(BLANK_VARIANT());
    const [bColorSearch,  setBColorSearch]  = useState("");
    const [bTab,          setBTab]          = useState("All");
    const [bPreviews,     setBPreviews]     = useState(
      (product.images || []).map(f => URL.createObjectURL(f))
    );

    const bSupportsSize = () =>
      product.category === "Clothing" || (product.category === "Handmade" && product.subCategory === "Jewelry");

    const handleChange = e => updateProduct({ ...product, [e.target.name]: e.target.value });
    const handleImageChange = e => {
      const files = Array.from(e.target.files);
      updateProduct({ ...product, images: files });
      setBPreviews(files.map(f => URL.createObjectURL(f)));
    };
    const removeImage = i => {
      updateProduct({ ...product, images: product.images.filter((_, j) => j !== i) });
      setBPreviews(bPreviews.filter((_, j) => j !== i));
    };
    const bAddVariant = () => {
      if ((bSupportsSize() && !bVariantInput.size) || !bVariantInput.color || !bVariantInput.stock) return;
      updateProduct({ ...product, variants: [...product.variants, { ...bVariantInput }] });
      setBVariantInput(BLANK_VARIANT()); setBColorSearch(""); setBTab("All");
    };
    const bRemoveVariant = i => updateProduct({ ...product, variants: product.variants.filter((_, j) => j !== i) });
    const bSpecChange = (i, field, val) => {
      const s = [...product.specifications]; s[i][field] = val;
      updateProduct({ ...product, specifications: s });
    };
    const bAddSpec    = () => updateProduct({ ...product, specifications: [...product.specifications, { label: "", value: "" }] });
    const bRemoveSpec = i  => updateProduct({ ...product, specifications: product.specifications.filter((_, j) => j !== i) });

    return (
      <div className={styles.bulkRow}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h4 style={{ margin: 0 }}>Product #{index + 1}</h4>
          <button type="button" onClick={removeProduct} className={styles.deleteBtn}>🗑️ Remove</button>
        </div>

        {/* Category */}
        <div className={styles.formGroup}>
          <label>Category</label>
          <select value={product.category}
            onChange={e => updateProduct({ ...product, category: e.target.value, subCategory: "", childCategory: "" })}>
            <option value="">Select Category</option>
            {approvedCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label>Subcategory</label>
          <select value={product.subCategory} disabled={!product.category}
            onChange={e => updateProduct({ ...product, subCategory: e.target.value, childCategory: "" })}>
            <option value="">Select Subcategory</option>
            {(approvedSubcategories[product.category] || []).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label>Child Category</label>
          <select value={product.childCategory} disabled={!product.subCategory}
            onChange={e => updateProduct({ ...product, childCategory: e.target.value })}>
            <option value="">Select Child Category</option>
            {(approvedChildcategories[product.subCategory] || []).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Product Name</label>
          <input name="name" value={product.name} onChange={handleChange} placeholder="Product Name" />
        </div>
        <div className={styles.formGroup}>
          <label>Brand</label>
          <input name="brand" value={product.brand} onChange={handleChange} placeholder="Brand" />
        </div>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Price</label>
            <input name="price" type="number" value={product.price} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Discount (%)</label>
            <input name="discount" type="number" value={product.discount} onChange={handleChange} />
          </div>
        </div>
        <div className={styles.formGroup}>
          <label>Description</label>
          <textarea name="description" value={product.description || ""} onChange={handleChange}
            style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, minHeight: 70, boxSizing: "border-box" }} />
        </div>

        {/* Variants */}
        <div className={styles.formGroup}>
          <label>Variants</label>

          {bSupportsSize() && (
            <select value={bVariantInput.size}
              onChange={e => setBVariantInput(p => ({ ...p, size: e.target.value }))}
              style={{ marginBottom: 6, padding: "7px 10px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, width: "100%" }}>
              <option value="">Size</option>
              {SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}

          {/* ✅ Color name — completely separate input, never auto-filled */}
          <input type="text" placeholder="Color name (e.g. Navy Blue) — type freely"
            value={bVariantInput.colorName}
            onChange={e => setBVariantInput(p => ({ ...p, colorName: e.target.value }))}
            style={{ marginTop: 6, padding: "7px 10px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, width: "100%", boxSizing: "border-box" }} />

          <input type="number" placeholder="Stock" value={bVariantInput.stock}
            onChange={e => setBVariantInput(p => ({ ...p, stock: e.target.value }))}
            style={{ marginTop: 6, padding: "7px 10px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, width: "100%", boxSizing: "border-box" }} />
          <input type="text" placeholder="SKU (optional)" value={bVariantInput.sku}
            onChange={e => setBVariantInput(p => ({ ...p, sku: e.target.value }))}
            style={{ marginTop: 6, padding: "7px 10px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, width: "100%", boxSizing: "border-box" }} />

          {/* ✅ Color picker — only sets hex, never touches colorName */}
          <ColorPicker
            selectedHex={bVariantInput.color}
            onSelect={hex => setBVariantInput(p => ({ ...p, color: hex, colorHex: hex }))}
            colorSearch={bColorSearch}
            setColorSearch={setBColorSearch}
            selectedTab={bTab}
            setSelectedTab={setBTab}
          />

          <MeasurementInputs
            values={bVariantInput.measurements}
            onChange={(field, val) => setBVariantInput(p => ({ ...p, measurements: { ...p.measurements, [field]: val } }))}
          />

          <button type="button" onClick={bAddVariant} className={styles.addBtn} style={{ marginTop: 10 }}>
            ➕ Add Variant
          </button>

          {product.variants.map((v, i) => (
            <div key={i} className={styles.variantItem}>
              {bSupportsSize() && <span>Size: <strong>{v.size}</strong> | </span>}
              <span style={{ display: "inline-block", width: 16, height: 16, borderRadius: "50%",
                background: v.color, border: "1px solid #ccc", margin: "0 4px", verticalAlign: "middle" }} />
              <span><strong>{v.colorName || v.color}</strong></span>
              <span> | Stock: <strong>{v.stock}</strong></span>
              {v.sku && <span> | SKU: <strong>{v.sku}</strong></span>}
              {v.measurements && Object.values(v.measurements).some(Boolean) && (
                <span style={{ fontSize: 11, color: "#16a34a", marginLeft: 6 }}>
                  📐 {Object.entries(v.measurements).filter(([,val]) => val).map(([k,val]) => `${k}:${val}`).join(", ")}
                </span>
              )}
              <button type="button" onClick={() => bRemoveVariant(i)}>❌</button>
            </div>
          ))}
        </div>

        {/* Images */}
        <div className={styles.formGroup}>
          <label>Product Images</label>
          <input type="file" multiple onChange={handleImageChange} />
          <div className={styles.previewRow}>
            {bPreviews.map((src, i) => (
              <div key={i} style={{ position: "relative", display: "inline-block" }}>
                <img src={src} alt="preview" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 6 }} />
                <button type="button" onClick={() => removeImage(i)}
                  style={{ position: "absolute", top: -6, right: -6, background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>❌</button>
              </div>
            ))}
          </div>
        </div>

        {/* Specifications */}
        <div className={styles.formGroup}>
          <label>Specifications</label>
          {product.specifications.map((spec, i) => (
            <div key={i} className={styles.specRow}>
              <input placeholder="Label" value={spec.label} onChange={e => bSpecChange(i, "label", e.target.value)} />
              <input placeholder="Value" value={spec.value} onChange={e => bSpecChange(i, "value", e.target.value)} />
              {product.specifications.length > 1 && <button type="button" onClick={() => bRemoveSpec(i)}>❌</button>}
            </div>
          ))}
          <button type="button" onClick={bAddSpec}>➕ Add Specification</button>
        </div>

        {/* Pairs With */}
        <div className={styles.formGroup}>
          <label>Pairs With (Product IDs)</label>
          <div className={styles.pairInputRow}>
            <input type="text" placeholder="Enter product ID"
              value={product.pairs_with_input || ""}
              onChange={e => updateProduct({ ...product, pairs_with_input: e.target.value })} />
            <button type="button" className={styles.addBtn}
              onClick={() => {
                const id = (product.pairs_with_input || "").trim();
                if (id && !(product.pairs_with || []).includes(id))
                  updateProduct({ ...product, pairs_with: [...(product.pairs_with || []), id], pairs_with_input: "" });
              }}>➕ Add</button>
          </div>
          <div className={styles.pairList}>
            {(product.pairs_with || []).map((id, i) => (
              <div key={i} className={styles.pairItem}>
                <span>{id}</span>
                <button type="button"
                  onClick={() => updateProduct({ ...product, pairs_with: product.pairs_with.filter((_, j) => j !== i) })}>❌</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Add Product</h1>

      <div className={styles.toggleBulk}>
        <label>
          <input type="checkbox" checked={bulkMode} onChange={() => { setBulkMode(p => !p); setBulkResults([]); }} />
          &nbsp;Bulk Mode
        </label>
      </div>

      {loadingCategories ? <p>Loading categories…</p> : !bulkMode ? (
        <>
          <SubmitResultCard result={submitResult} />

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label>Product Name</label>
              <input name="name" value={form.name} onChange={handleChange} />
              {errors.name && <span className={styles.error}>{errors.name}</span>}
            </div>
            <div className={styles.formGroup}>
              <label>Brand</label>
              <input name="brand" value={form.brand} onChange={handleChange} />
              {errors.brand && <span className={styles.error}>{errors.brand}</span>}
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Price</label>
                <input type="number" name="price" value={form.price} onChange={handleChange} />
                {errors.price && <span className={styles.error}>{errors.price}</span>}
              </div>
              <div className={styles.formGroup}>
                <label>Discount (%)</label>
                <input type="number" name="discount" value={form.discount} onChange={handleChange} />
              </div>
            </div>

            {/* ── Variants ── */}
            <div className={styles.formGroup}>
              <label>Variants</label>
              <div className={styles.variantRow}>
                {supportsSize() && (
                  <select name="size" value={variantInput.size}
                    onChange={e => setVariantInput(p => ({ ...p, size: e.target.value }))}>
                    <option value="">Size</option>
                    {SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                )}
                <input type="number" name="stock" placeholder="Stock"
                  value={variantInput.stock}
                  onChange={e => setVariantInput(p => ({ ...p, stock: e.target.value }))} />
                <input type="text" name="sku" placeholder="SKU (optional)"
                  value={variantInput.sku}
                  onChange={e => setVariantInput(p => ({ ...p, sku: e.target.value }))} />
              </div>

              {/* ✅ Color name — standalone, never touched by color picker */}
              <input type="text" placeholder="Color name (e.g. Navy Blue) — type freely"
                value={variantInput.colorName}
                onChange={e => setVariantInput(p => ({ ...p, colorName: e.target.value }))}
                className={styles.colorSearch} style={{ marginTop: 8 }} />

              {/* ✅ Color picker — only sets hex */}
              <ColorPicker
                selectedHex={variantInput.color}
                onSelect={hex => setVariantInput(p => ({ ...p, color: hex, colorHex: hex }))}
                colorSearch={colorSearch}
                setColorSearch={setColorSearch}
                selectedTab={selectedTab}
                setSelectedTab={setSelectedTab}
              />

              <MeasurementInputs
                values={variantInput.measurements}
                onChange={handleVariantMeasurementChange}
              />

              <button type="button" onClick={addVariant} className={styles.addBtn} style={{ marginTop: 10 }}>
                ➕ Add Variant
              </button>

              <div>
                {form.variants.map((v, i) => (
                  <div key={i} className={styles.variantItem}>
                    {supportsSize() && <span>Size: <strong>{v.size}</strong> | </span>}
                    Color: <span style={{ display: "inline-block", width: 16, height: 16, borderRadius: "50%",
                      background: v.color, border: "1px solid #ccc", margin: "0 4px", verticalAlign: "middle" }} />
                    <strong>{v.colorName || v.color}</strong>
                    {" | "} Stock: <strong>{v.stock}</strong>
                    {v.sku && <> | SKU: <strong>{v.sku}</strong></>}
                    {v.measurements && Object.values(v.measurements).some(Boolean) && (
                      <span style={{ fontSize: 11, color: "#16a34a", marginLeft: 6 }}>
                        📐 {Object.entries(v.measurements).filter(([,val]) => val).map(([k,val]) => `${k}:${val}`).join(", ")}
                      </span>
                    )}
                    <button type="button" onClick={() => removeVariant(i)}>❌</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Category */}
            <div className={styles.formGroup}>
              <label>Category</label>
              <div className={styles.flexRow}>
                <select value={form.category} onChange={handleCategoryChange}>
                  <option value="">Select Category</option>
                  {approvedCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button type="button" onClick={() => setShowModal(true)} className={styles.requestBtn}>
                  Request Category
                </button>
              </div>
              {errors.category && <span className={styles.error}>{errors.category}</span>}
            </div>
            <div className={styles.formGroup}>
              <label>Subcategory</label>
              <select value={form.subCategory} onChange={handleSubCategoryChange} disabled={!form.category}>
                <option value="">Select Subcategory</option>
                {(approvedSubcategories[form.category] || []).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.subCategory && <span className={styles.error}>{errors.subCategory}</span>}
            </div>
            <div className={styles.formGroup}>
              <label>Child Category</label>
              <select value={form.childCategory} onChange={handleChildCategoryChange} disabled={!form.subCategory}>
                <option value="">Select Child Category</option>
                {(approvedChildcategories[form.subCategory] || []).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.childCategory && <span className={styles.error}>{errors.childCategory}</span>}
            </div>

            {/* Category Request Modal */}
            {showModal && (
              <div className={styles.modalOverlay}>
                <div className={styles.modal}>
                  <h2>Request Category</h2>
                  <div className={styles.formGroup}>
                    <label>Category</label>
                    <select value={reqCategory} onChange={e => { setReqCategory(e.target.value); setReqSubCategory(""); setReqChildCategory(""); }}>
                      <option value="">Select Category</option>
                      {Object.keys(fetchedCategories).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  {reqCategory && (
                    <div className={styles.formGroup}>
                      <label>Subcategory</label>
                      <select value={reqSubCategory} onChange={e => { setReqSubCategory(e.target.value); setReqChildCategory(""); }}>
                        <option value="">Select Subcategory</option>
                        {Object.keys(fetchedCategories[reqCategory] || {}).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  )}
                  {reqSubCategory && (
                    <div className={styles.formGroup}>
                      <label>Child Category</label>
                      <select value={reqChildCategory} onChange={e => setReqChildCategory(e.target.value)}>
                        <option value="">Select Child Category</option>
                        {(fetchedCategories[reqCategory]?.[reqSubCategory] || []).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  )}
                  <button type="button" onClick={handleAddSelection} className={styles.addBtn}>➕ Add Selection</button>
                  <div className={styles.selectionList}>
                    {requestSelections.map((sel, i) => (
                      <div key={i} className={styles.selectionItem}>
                        <span>{sel.category}{sel.subCategory && ` > ${sel.subCategory}`}{sel.childCategory && ` > ${sel.childCategory}`}</span>
                        <button type="button" onClick={() => setRequestSelections(p => p.filter((_, j) => j !== i))}>❌</button>
                      </div>
                    ))}
                  </div>
                  <textarea placeholder="Your request..." value={requestInput}
                    onChange={e => setRequestInput(e.target.value)} className={styles.textArea} />
                  <div className={styles.actions}>
                    <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                    <button type="button" onClick={handleRequestSubmit}>Send Request</button>
                  </div>
                </div>
              </div>
            )}

            {/* Images */}
            <div className={styles.formGroup}>
              <label>Product Images</label>
              <input type="file" multiple accept="image/*" onChange={handleImageChange} />
              {errors.images && <span className={styles.error}>{errors.images}</span>}
              <div className={styles.previewRow}>
                {imagePreviews.map((src, i) => <img key={i} src={src} alt="preview" />)}
              </div>
            </div>

            {/* Specifications */}
            <div className={styles.formGroup}>
              <label>Specifications</label>
              {form.specifications.map((spec, i) => (
                <div key={i} className={styles.specRow}>
                  <input placeholder="Label" value={spec.label} onChange={e => handleSpecChange(i, "label", e.target.value)} />
                  <input placeholder="Value" value={spec.value} onChange={e => handleSpecChange(i, "value", e.target.value)} />
                  {form.specifications.length > 1 && <button type="button" onClick={() => removeSpecification(i)}>❌</button>}
                </div>
              ))}
              <button type="button" onClick={addSpecification} className={styles.addBtn}>➕ Add Specification</button>
            </div>

            {/* Description */}
            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} />
            </div>

            {/* Pairs With */}
            <div className={styles.formGroup}>
              <label>Pairs With (Product IDs)</label>
              <div className={styles.pairInputRow}>
                <input type="text" placeholder="Enter product ID"
                  value={form.pairs_with_input || ""}
                  onChange={e => setForm(p => ({ ...p, pairs_with_input: e.target.value }))} />
                <button type="button" className={styles.addBtn}
                  onClick={() => {
                    const id = (form.pairs_with_input || "").trim();
                    if (id && !form.pairs_with.includes(id))
                      setForm(p => ({ ...p, pairs_with: [...p.pairs_with, id], pairs_with_input: "" }));
                  }}>➕ Add</button>
              </div>
              <div className={styles.pairList}>
                {form.pairs_with.map((id, i) => (
                  <div key={i} className={styles.pairItem}>
                    <span>{id}</span>
                    <button type="button" onClick={() => setForm(p => ({ ...p, pairs_with: p.pairs_with.filter((_, j) => j !== i) }))}>❌</button>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.actions}>
              <button type="submit" className={styles.submitBtn}>Submit</button>
              <button type="button" onClick={handleReset} className={styles.resetBtn}>Reset</button>
            </div>
          </form>
        </>
      ) : (
        <div>
          <BulkResultCards results={bulkResults} onClear={() => setBulkResults([])} />
          {bulkProducts.map((product, idx) => (
            <BulkProductRow key={idx} index={idx} product={product}
              updateProduct={newData => { const t = [...bulkProducts]; t[idx] = newData; setBulkProducts(t); }}
              removeProduct={() => setBulkProducts(p => p.filter((_, i) => i !== idx))}
            />
          ))}
          <button type="button" className={styles.addBtn}
            onClick={() => setBulkProducts(p => [...p, {
              name: "", brand: "", price: "", discount: "", description: "",
              specifications: [{ label: "", value: "" }],
              images: [], category: "", subCategory: "", childCategory: "",
              variants: [], pairs_with: [], pairs_with_input: "",
            }])}>
            ➕ Add Another Product
          </button>
          {bulkProducts.length > 0 && (
            <button type="button" className={styles.submitBtn} disabled={bulkSubmitting}
              onClick={handleBulkSubmit} style={{ marginLeft: 12 }}>
              {bulkSubmitting ? "Submitting…" : `Submit ${bulkProducts.length} Product${bulkProducts.length > 1 ? "s" : ""}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AddProduct;