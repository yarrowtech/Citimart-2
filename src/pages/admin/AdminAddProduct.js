// import React, { useState, useEffect } from "react";
// import styles from "./AdminAddProduct.module.css";
// import axios from "axios";


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

// const SIZE_OPTIONS = ["S", "M", "L", "XL", "XXL"];
// const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dfvrobw6x/image/upload";
// const CLOUDINARY_UPLOAD_PRESET = "Citimart";

// const AddProduct = () => {
//   // --- Existing Single Product State ---
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

//   const [imagePreviews, setImagePreviews] = useState([]);
//   const [errors, setErrors] = useState({});
//   const [variantInput, setVariantInput] = useState({ size: "", color: "", stock: "" , sku: ""});
//   const [colorSearch, setColorSearch] = useState("");
//   const [selectedTab, setSelectedTab] = useState("All");
//   const [categories, setCategories] = useState([]);

//   // --- Bulk Upload State ---
//   const [bulkMode, setBulkMode] = useState(false);
//   const [bulkImages, setBulkImages] = useState([]); // { file, preview, name, size, color }
//   const [bulkCategory, setBulkCategory] = useState("");
//   const [bulkSubCategory, setBulkSubCategory] = useState("");
//   const [bulkChildCategory, setBulkChildCategory] = useState("");
//   const [bulkSize, setBulkSize] = useState("");
//   const [bulkColor, setBulkColor] = useState("#FFFFFF");
//   const [uploading, setUploading] = useState(false);
  

//  useEffect(() => {
//   const fetchCategories = async () => {
//     try {
//       const res = await axios.get("http://localhost:5000/api/categories");
//       if (res.data.categories) {
//         setCategories(res.data.categories);
//       }
//     } catch (err) {
//       console.error("Failed to fetch categories:", err);
//     }
//   };

//   fetchCategories();
// }, []);

//   // --- Color Filtering ---
//   const filterByTab = (color) => {
//     if (selectedTab === "All") return true;
//     if (selectedTab === "Red") return color.hex.includes("FF0000") || color.hex.startsWith("#FF");
//     if (selectedTab === "Green") return color.hex.includes("00FF00") || color.hex.startsWith("#0F");
//     if (selectedTab === "Blue") return color.hex.includes("0000FF") || color.hex.startsWith("#00");
//     if (selectedTab === "Gray") return color.hex[1] === color.hex[3] && color.hex[3] === color.hex[5];
//     return true;
//   };

//   const filteredColors = WEB_SAFE_COLORS.filter(
//     (c) => c.name.toLowerCase().includes(colorSearch.toLowerCase()) && filterByTab(c)
//   );

//   // --- Input Handlers for Single Product ---
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setForm((prev) => ({ ...prev, [name]: value }));
//   };
//   const handleCategoryChange = (e) =>
//     setForm((prev) => ({ ...prev, category: e.target.value, subCategory: "", childCategory: "" }));
//   const handleSubCategoryChange = (e) =>
//     setForm((prev) => ({ ...prev, subCategory: e.target.value, childCategory: "" }));
//   const handleChildCategoryChange = (e) => setForm((prev) => ({ ...prev, childCategory: e.target.value }));

//   // --- Specifications ---
//   const handleSpecChange = (idx, field, value) => {
//     const specs = [...form.specifications];
//     specs[idx][field] = value;
//     setForm((prev) => ({ ...prev, specifications: specs }));
//   };
//   const addSpecification = () =>
//     setForm((prev) => ({ ...prev, specifications: [...prev.specifications, { label: "", value: "" }] }));
//   const removeSpecification = (idx) =>
//     setForm((prev) => ({ ...prev, specifications: prev.specifications.filter((_, i) => i !== idx) }));

//   // --- Images ---
//   const handleImageChange = (e) => {
//     const files = Array.from(e.target.files);
//     setForm((prev) => ({ ...prev, images: files }));
//     setImagePreviews(files.map((file) => URL.createObjectURL(file)));
//   };

//   // --- Variants ---
//   const handleVariantInputChange = (e) => {
//     const { name, value } = e.target;
//     setVariantInput((prev) => ({ ...prev, [name]: value }));
//   };
//   const addVariant = () => {
//     if (
//       ((form.category === "Clothing" || (form.category === "Handmade" && form.subCategory === "Jewelry")) &&
//         !variantInput.size) ||
//       !variantInput.color ||
//       !variantInput.stock
//     )
//       return;
//     setForm((prev) => ({ ...prev, variants: [...prev.variants, variantInput] }));
//     setVariantInput({ size: "", color: "", stock: "" });
//   };
//   const removeVariant = (idx) => setForm((prev) => ({ ...prev, variants: prev.variants.filter((_, i) => i !== idx) }));

//   // --- Reset ---
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
//   };

//   // --- Validation ---
//   const validate = () => {
//     const newErrors = {};
//     if (!form.name) newErrors.name = "Product name is required";
//     if (!form.brand) newErrors.brand = "Brand is required";
//     if (!form.price) newErrors.price = "Price is required";
//     if (!form.category) newErrors.category = "Category is required";
//     if (!form.subCategory) newErrors.subCategory = "Subcategory is required";
//     if (!form.childCategory) newErrors.childCategory = "Child category is required";
//     if (form.images.length === 0) newErrors.images = "At least one image is required";
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };
  
//   // --- Submit Single Product ---
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!validate()) return;
//     try {
//       const uploadedImageUrls = [];
//       for (let img of form.images) {
//         const formData = new FormData();
//         formData.append("file", img);
//         formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
//         const res = await axios.post(CLOUDINARY_URL, formData);
//         uploadedImageUrls.push(res.data.secure_url);
//       }

//       const backendFormData = new FormData();
//       backendFormData.append("name", form.name);
//       backendFormData.append("brand", form.brand);
//       backendFormData.append("price", form.price);
//       backendFormData.append("discount", form.discount || 0);
//       backendFormData.append("description", form.description);
//       backendFormData.append("category", form.category);
//       backendFormData.append("subCategory", form.subCategory);
//       backendFormData.append("childCategory", form.childCategory);
//       backendFormData.append("specifications", JSON.stringify(form.specifications));
//       backendFormData.append(
//         "variants",
//         JSON.stringify(form.variants.map((v) => ({ ...v, stock: Number(v.stock) })))
//       );
//       backendFormData.append("pairs_with", JSON.stringify(form.pairs_with));
//       backendFormData.append("added_by", "admin");
//       backendFormData.append("status", "active");
//       backendFormData.append("images", JSON.stringify(uploadedImageUrls));

//       const response = await axios.post("http://localhost:5000/api/products/add", backendFormData);
//       if (response.data.product_id) {
//         alert("✅ Product added successfully!");
//         handleReset();
//       } else {
//         alert("❌ Failed to add product: " + response.data.error);
//       }
//     } catch (err) {
//       console.error(err);
//       alert("⚠️ Failed to upload images or add product.");
//     }
//   };

//   // --- Bulk Upload Handlers ---
//   // Bulk image upload handler (always start with 1 variant)
// const handleBulkImageChange = (e) => {
//   const files = Array.from(e.target.files);
//   const newBulk = files.map((file) => ({
//     file,
//     preview: URL.createObjectURL(file),
//     name: "",
//     price: 100,
//     sku: "",
//     stock: 10,
//     colorSearch: "",
//     selectedTab: "All",
//     variants: [
//       {
//         size: "M",
//         color: "#FFFFFF",
//         stock: 10,
//         sku: "",
//       },
//     ],
//   }));

//   setBulkImages((prev) => [...prev, ...newBulk]);
// };


// const addVariantToImage = (imageIdx) => {
//   setBulkImages((prev) =>
//     prev.map((img, i) =>
//       i === imageIdx
//         ? {
//             ...img,
//             variants: [
//               ...(img.variants || []),
//               { size: "", color: img.color || "#FFFFFF", stock: 10, sku: "" },
//             ],
//           }
//         : img
//     )
//   );
// };

// const updateVariantField = (imageIdx, variantIdx, field, value) => {
//   setBulkImages((prev) =>
//     prev.map((img, i) =>
//       i === imageIdx
//         ? {
//             ...img,
//             variants: img.variants.map((v, vi) =>
//               vi === variantIdx ? { ...v, [field]: value } : v
//             ),
//           }
//         : img
//     )
//   );
// };

// const removeVariantFromImage = (imageIdx, variantIdx) => {
//   setBulkImages((prev) =>
//     prev.map((img, i) =>
//       i === imageIdx
//         ? { ...img, variants: img.variants.filter((_, vi) => vi !== variantIdx) }
//         : img
//     )
//   );
// };

 

   
//   // Utility: Split array into chunks
//   const chunkArray = (arr, size) =>
//   arr.reduce((acc, _, i) => (i % size ? acc : [...acc, arr.slice(i, i + size)]), []);


//   const handleBulkSubmit = async () => {
//   if (!bulkImages.length) return alert("⚠️ Please select images");

//   try {
//     setUploading(true);

//     // --- 1️⃣ Upload all images to Cloudinary in chunks of 5 ---
//     const chunkArray = (arr, size) =>
//       arr.reduce((acc, _, i) => (i % size ? acc : [...acc, arr.slice(i, i + size)]), []);

//     const imageChunks = chunkArray(bulkImages, 5);
//     let uploadedUrls = [];

//     for (const chunk of imageChunks) {
//       const results = await Promise.allSettled(
//         chunk.map((img) => {
//           const fd = new FormData();
//           fd.append("file", img.file);
//           fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
//           return axios.post(CLOUDINARY_URL, fd);
//         })
//       );

//       uploadedUrls.push(
//         ...results.map((r) => (r.status === "fulfilled" ? r.value.data.secure_url : null))
//       );
//     }

//     // --- 2️⃣ Send products to backend ---
//     for (let i = 0; i < bulkImages.length; i++) {
//       const img = bulkImages[i];
//       const imageUrl = uploadedUrls[i];

//       if (!imageUrl) continue;

//       // Use all variants added per image
//       // Always ensure at least 1 variant
// const variantsToSend =
//   img.variants && img.variants.length > 0
//     ? img.variants.map((v) => ({
//         size: v.size || "M",
//         color: v.color || "#FFFFFF",
//         stock: Number(v.stock || 10),
//         sku: v.sku || "",
//       }))
//     : [
//         {
//           size: "M",
//           color: "#FFFFFF",
//           stock: 10,
//           sku: "",
//         },
//       ];


//       const fd = new FormData();
//       fd.append("name", img.name || "Unnamed Product");
//       fd.append("brand", "Generic");
//       fd.append("price", img.price || 100);
//       fd.append("discount", 0);
//       fd.append("description", "Bulk uploaded product");
//       fd.append("category", bulkCategory);
//       fd.append("subCategory", bulkSubCategory);
//       fd.append("childCategory", bulkChildCategory);
//       fd.append("specifications", JSON.stringify([]));
//       fd.append("pairs_with", JSON.stringify([]));
//       fd.append("variants", JSON.stringify(variantsToSend));
//       fd.append("images", JSON.stringify([imageUrl]));
//       fd.append("added_by", "admin");
//       fd.append("status", "active");

//       await axios.post("http://localhost:5000/api/products/add", fd);
//     }

//     alert("✅ Bulk upload completed successfully!");
//     // Reset
//     setBulkImages([]);
//     setBulkCategory("");
//     setBulkSubCategory("");
//     setBulkChildCategory("");
//   } catch (error) {
//     console.error("❌ Bulk upload error:", error);
//     alert("⚠️ Failed to upload bulk images");
//   } finally {
//     setUploading(false);
//   }
// };


//   // --- Conditional Rendering Logic ---
//   const showSize = (form.category === "Clothing") || (form.category === "Handmade" && form.subCategory === "Jewelry");

//   return (
//     <div className={styles.container}>
//       <h1 className={styles.title}>Add Product</h1>

//       <label className={styles.bulkToggle}>
//         <input type="checkbox" checked={bulkMode} onChange={() => setBulkMode((prev) => !prev)} />
//         Bulk Upload Mode
//       </label>

//       {bulkMode ? (
//         <div className={styles.bulkContainer}>
//           {/* Bulk Category Selection */}
//           {/* Bulk Category */}
// <select value={bulkCategory} onChange={(e) => setBulkCategory(e.target.value)}>
//   <option value="">Select Category</option>
//   {categories.map((cat) => (
//     <option key={cat._id} value={cat.name}>
//       {cat.name}
//     </option>
//   ))}
// </select>

// {/* Bulk Subcategory */}
// <select value={bulkSubCategory} onChange={(e) => setBulkSubCategory(e.target.value)} disabled={!bulkCategory}>
//   <option value="">Select Subcategory</option>
//   {bulkCategory &&
//     categories
//       .find((c) => c.name === bulkCategory)
//       ?.subCategories.map((sub) => (
//         <option key={sub.name} value={sub.name}>
//           {sub.name}
//         </option>
//       ))}
// </select>

// {/* Bulk Child Category */}
// <select value={bulkChildCategory} onChange={(e) => setBulkChildCategory(e.target.value)} disabled={!bulkSubCategory}>
//   <option value="">Select Child Category</option>
//   {bulkSubCategory &&
//     categories
//       .find((c) => c.name === bulkCategory)
//       ?.subCategories.find((s) => s.name === bulkSubCategory)
//       ?.childCategories.map((child) => (
//         <option key={child} value={child}>
//           {child}
//         </option>
//       ))}
// </select>


//           {/* Bulk Image Upload */}
//           <div className={styles.formGroup}>
//             <label>Upload Images</label>
//             <input type="file" multiple onChange={handleBulkImageChange} />
//           </div>

//           {/* Bulk Images List */}
//           <div className={styles.bulkImageList}>
//           {bulkImages.map((img, idx) => (
//   <div key={idx} className={styles.bulkImageRow}>
//     {/* Image Preview */}
//     <img src={img.preview} alt="preview" width={100} />

//     {/* Image Details */}
//     <input
//       type="text"
//       placeholder="Image Name"
//       value={img.name}
//       onChange={(e) => {
//         const updated = [...bulkImages];
//         updated[idx].name = e.target.value;
//         setBulkImages(updated);
//       }}
//     />
//     <input
//       type="text"
//       placeholder="SKU"
//       value={img.sku}
//       onChange={(e) => {
//         const updated = [...bulkImages];
//         updated[idx].sku = e.target.value;
//         setBulkImages(updated);
//       }}
//     />
//     <input
//       type="number"
//       placeholder="Price"
//       value={img.price}
//       onChange={(e) => {
//         const updated = [...bulkImages];
//         updated[idx].price = Number(e.target.value);
//         setBulkImages(updated);
//       }}
//     />
//     <input
//       type="number"
//       placeholder="Stock"
//       value={img.stock}
//       onChange={(e) => {
//         const updated = [...bulkImages];
//         updated[idx].stock = Number(e.target.value);
//         setBulkImages(updated);
//       }}
//     />

//     {/* Size Dropdown (only for Clothing/Jewelry) */}
//     {((bulkCategory === "Clothing") ||
//       (bulkCategory === "Handmade" && bulkSubCategory === "Jewelry")) && (
//       <select
//         value={img.size}
//         onChange={(e) => {
//           const updated = [...bulkImages];
//           updated[idx].size = e.target.value;
//           setBulkImages(updated);
//         }}
//       >
//         <option value="">Size</option>
//         {SIZE_OPTIONS.map((s) => (
//           <option key={s} value={s}>
//             {s}
//           </option>
//         ))}
//       </select>
//     )}

//     {/* Color Picker for Main Image */}
//     <div className={styles.colorPickerSection}>
//       <input
//         type="text"
//         placeholder="Search color..."
//         value={img.colorSearch}
//         onChange={(e) => {
//           const updated = [...bulkImages];
//           updated[idx].colorSearch = e.target.value;
//           setBulkImages(updated);
//         }}
//         className={styles.colorSearch}
//       />

//       <div className={styles.colorTabs}>
//         {["All", "Red", "Green", "Blue", "Gray"].map((tab) => (
//           <button
//             key={tab}
//             type="button"
//             className={`${styles.colorTab} ${img.selectedTab === tab ? styles.activeTab : ""}`}
//             onClick={() => {
//               const updated = [...bulkImages];
//               updated[idx].selectedTab = tab;
//               setBulkImages(updated);
//             }}
//           >
//             {tab}
//           </button>
//         ))}
//       </div>

//       <div className={styles.colorPalette}>
//         {WEB_SAFE_COLORS.filter((c) => {
//           const searchMatch = c.name.toLowerCase().includes(img.colorSearch.toLowerCase());
//           const tabMatch =
//             img.selectedTab === "All" ||
//             (img.selectedTab === "Red" && c.hex.startsWith("#FF")) ||
//             (img.selectedTab === "Green" && c.hex.startsWith("#0F")) ||
//             (img.selectedTab === "Blue" && c.hex.startsWith("#00")) ||
//             (img.selectedTab === "Gray" &&
//               c.hex[1] === c.hex[3] &&
//               c.hex[3] === c.hex[5]);
//           return searchMatch && tabMatch;
//         }).map(({ hex }) => (
//           <div
//             key={hex}
//             className={`${styles.colorCircle} ${img.color === hex ? styles.selected : ""}`}
//             style={{ backgroundColor: hex }}
//             onClick={() => {
//               const updated = [...bulkImages];
//               updated[idx].color = hex;
//               setBulkImages(updated);
//             }}
//           />
//         ))}
//       </div>
//     </div>

//     {/* Delete Image */}
//     <button
//       type="button"
//       className={styles.deleteBtn}
//       onClick={() => {
//         setBulkImages((prev) => prev.filter((_, i) => i !== idx));
//       }}
//     >
//       ❌
//     </button>

//     {/* ➕ Add Variant */}
//     <button type="button" onClick={() => addVariantToImage(idx)}>
//       ➕ Add Variant
//     </button>

//     {/* Render Variants */}
//     {img.variants.map((v, vi) => (
//       <div key={vi} className={styles.bulkVariantRow}>
//         <input
//           type="text"
//           placeholder="SKU"
//           value={v.sku}
//           onChange={(e) => updateVariantField(idx, vi, "sku", e.target.value)}
//         />
//         <input
//           type="number"
//           placeholder="Stock"
//           value={v.stock}
//           onChange={(e) => updateVariantField(idx, vi, "stock", Number(e.target.value))}
//         />

//         {/* Size */}
//         {((bulkCategory === "Clothing") ||
//           (bulkCategory === "Handmade" && bulkSubCategory === "Jewelry")) && (
//           <select
//             value={v.size}
//             onChange={(e) => updateVariantField(idx, vi, "size", e.target.value)}
//           >
//             <option value="">Size</option>
//             {SIZE_OPTIONS.map((s) => (
//               <option key={s} value={s}>
//                 {s}
//               </option>
//             ))}
//           </select>
//         )}

//         {/* Color Picker */}
//         <div className={styles.colorPalette}>
//           {WEB_SAFE_COLORS.filter((c) => {
//             const searchMatch = c.name.toLowerCase().includes(img.colorSearch.toLowerCase());
//             const tabMatch =
//               img.selectedTab === "All" ||
//               (img.selectedTab === "Red" && c.hex.startsWith("#FF")) ||
//               (img.selectedTab === "Green" && c.hex.startsWith("#0F")) ||
//               (img.selectedTab === "Blue" && c.hex.startsWith("#00")) ||
//               (img.selectedTab === "Gray" &&
//                 c.hex[1] === c.hex[3] &&
//                 c.hex[3] === c.hex[5]);
//             return searchMatch && tabMatch;
//           }).map(({ hex }) => (
//             <div
//               key={hex}
//               className={`${styles.colorCircle} ${v.color === hex ? styles.selected : ""}`}
//               style={{ backgroundColor: hex }}
//               onClick={() => updateVariantField(idx, vi, "color", hex)}
//             />
//           ))}
//         </div>

//         {/* Remove Variant */}
//         <button type="button" onClick={() => removeVariantFromImage(idx, vi)}>
//           ❌
//         </button>
//       </div>
//     ))}
//   </div>
// ))}


  

 

//           </div>

//           <button type="button" onClick={handleBulkSubmit} className={styles.submitBtn}>
//             Submit Bulk
//           </button>
//         </div>
//       ) : (
//         <form className={styles.form} onSubmit={handleSubmit}>
//           {/* Existing Add Product Form */}
//           {/* Name */}
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
//               <input type="number" name="price" value={form.price} onChange={handleChange} />
//               {errors.price && <span className={styles.error}>{errors.price}</span>}
//             </div>
//             <div className={styles.formGroup}>
//               <label>Discount (%)</label>
//               <input type="number" name="discount" value={form.discount} onChange={handleChange} />
//             </div>
//           </div>

//           {/* Variants */}
//           <div className={styles.formGroup}>
//             <label>Variants</label>
//             {showSize && (
//               <select name="size" value={variantInput.size} onChange={handleVariantInputChange}>
//                 <option value="">Size</option>
//                 {SIZE_OPTIONS.map((s) => (
//                   <option key={s} value={s}>
//                     {s}
//                   </option>
//                 ))}
//               </select>
//             )}
//             <input
//               type="number"
//               name="stock"
//               placeholder="Stock"
//               value={variantInput.stock}
//               onChange={handleVariantInputChange}
//               min={0}
//             />
//             <input
//              type="text"
//              name="sku"
//              placeholder="SKU (optional)"
//              value={variantInput.sku}
//              onChange={handleVariantInputChange}
//             />

//             <input
//               type="text"
//               placeholder="Search color..."
//               value={colorSearch}
//               onChange={(e) => setColorSearch(e.target.value)}
//               className={styles.colorSearch}
//             />
//             <div className={styles.colorTabs}>
//               {["All", "Red", "Green", "Blue", "Gray"].map((tab) => (
//                 <button
//                   key={tab}
//                   type="button"
//                   className={`${styles.colorTab} ${selectedTab === tab ? styles.activeTab : ""}`}
//                   onClick={() => setSelectedTab(tab)}
//                 >
//                   {tab}
//                 </button>
//               ))}
//             </div>
//             <div className={styles.colorPalette}>
//               {filteredColors.map(({ name, hex }) => (
//                 <div
//                   key={hex}
//                   className={`${styles.colorCircle} ${variantInput.color === hex ? styles.selected : ""}`}
//                   style={{ backgroundColor: hex }}
//                   onClick={() => setVariantInput((prev) => ({ ...prev, color: hex }))}
//                 />
//               ))}
//             </div>
//             <button type="button" onClick={addVariant} className={styles.addBtn}>
//               ➕ Add Variant
//             </button>
//             <div className={styles.variantList}>
//               {form.variants.map((v, i) => (
//                 <div key={i} className={styles.variantItem}>
//                   {showSize ? (
//                     <span>
//                       Size: {v.size} | Color:{" "}
//                       <span
//                         style={{
//                           display: "inline-block",
//                           width: 20,
//                           height: 20,
//                           backgroundColor: v.color,
//                           borderRadius: "50%",
//                           border: "1px solid #000",
//                           margin: "0 5px",
//                         }}
//                       ></span>{" "}
//                       | Stock: {v.stock}| SKU: {v.sku || "Auto"}
//                     </span>
//                   ) : (
//                     <span>
//                       Color:{" "}
//                       <span
//                         style={{
//                           display: "inline-block",
//                           width: 20,
//                           height: 20,
//                           backgroundColor: v.color,
//                           borderRadius: "50%",
//                           border: "1px solid #000",
//                           margin: "0 5px",
//                         }}
//                       ></span>{" "}
//                       | Stock: {v.stock}| SKU: {v.sku || "Auto"}
//                     </span>
//                   )}
//                   <button type="button" onClick={() => removeVariant(i)}>
//                     ❌
//                   </button>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* Category & Subcategories */}
//          {/* Category */}
// <select value={form.category} onChange={handleCategoryChange}>
//   <option value="">Select Category</option>
//   {categories.map((cat) => (
//     <option key={cat._id} value={cat.name}>
//       {cat.name}
//     </option>
//   ))}
// </select>

// {/* Subcategory */}
// <select value={form.subCategory} onChange={handleSubCategoryChange} disabled={!form.category}>
//   <option value="">Select Subcategory</option>
//   {form.category &&
//     categories
//       .find((c) => c.name === form.category)
//       ?.subCategories.map((sub) => (
//         <option key={sub.name} value={sub.name}>
//           {sub.name}
//         </option>
//       ))}
// </select>

// {/* Child Category */}
// <select value={form.childCategory} onChange={handleChildCategoryChange} disabled={!form.subCategory}>
//   <option value="">Select Child Category</option>
//   {form.subCategory &&
//     categories
//       .find((c) => c.name === form.category)
//       ?.subCategories.find((s) => s.name === form.subCategory)
//       ?.childCategories.map((child) => (
//         <option key={child} value={child}>
//           {child}
//         </option>
//       ))}
// </select>


//           {/* Images */}
//           <div className={styles.formGroup}>
//             <label>Images</label>
//             <input type="file" multiple onChange={handleImageChange} />
//             {errors.images && <span className={styles.error}>{errors.images}</span>}
//             <div className={styles.imagePreview}>{imagePreviews.map((src, i) => <img key={i} src={src} alt="preview" />)}</div>
//           </div>

//           {/* Specifications */}
//           <div className={styles.formGroup}>
//             <label>Specifications</label>
//             {form.specifications.map((spec, idx) => (
//               <div key={idx} className={styles.specRow}>
//                 <input placeholder="Label" value={spec.label} onChange={(e) => handleSpecChange(idx, "label", e.target.value)} />
//                 <input placeholder="Value" value={spec.value} onChange={(e) => handleSpecChange(idx, "value", e.target.value)} />
//                 <button type="button" onClick={() => removeSpecification(idx)}>
//                   ❌
//                 </button>
//               </div>
//             ))}
//             <button type="button" onClick={addSpecification}>
//               ➕ Add Specification
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
//                 ➕ Add
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
//       )}
//     </div>
//   );
// };

// export default AddProduct;

// import React, { useState, useEffect } from "react";
// import styles from "./AdminAddProduct.module.css";
// import axios from "axios";

// const hexValues = ["00", "33", "66", "99", "CC", "FF"];
// const WEB_SAFE_COLORS = [];
// for (let r of hexValues)
//   for (let g of hexValues)
//     for (let b of hexValues)
//       WEB_SAFE_COLORS.push({ name: `#${r}${g}${b}`, hex: `#${r}${g}${b}` });

// const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL"];
// const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dfvrobw6x/image/upload";
// const CLOUDINARY_UPLOAD_PRESET = "Citimart";

// // Measurement fields shown for clothing/jewelry
// const MEASUREMENT_FIELDS = ["chest", "waist", "hips", "shoulder", "length"];

// // ── Reusable measurement input block ────────────────────────────────────────
// const MeasurementInputs = ({ values = {}, onChange }) => (
//   <div style={{
//     marginTop: 8,
//     padding: "10px 12px",
//     background: "#f0fdf4",
//     border: "1px solid #bbf7d0",
//     borderRadius: 10,
//     display: "flex",
//     flexWrap: "wrap",
//     gap: 8,
//   }}>
//     <div style={{ width: "100%", fontSize: 12, fontWeight: 600, color: "#166534", marginBottom: 2 }}>
//       📐 Measurements (inches) — optional
//     </div>
//     {MEASUREMENT_FIELDS.map(field => (
//       <label key={field} style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 11, color: "#374151" }}>
//         <span style={{ textTransform: "capitalize", fontWeight: 600 }}>{field}</span>
//         <input
//           type="text"
//           placeholder="e.g. 38"
//           value={values[field] || ""}
//           onChange={e => onChange(field, e.target.value)}
//           style={{
//             width: 68, padding: "5px 8px",
//             borderRadius: 7, border: "1px solid #d1d5db",
//             fontSize: 13, outline: "none",
//           }}
//         />
//       </label>
//     ))}
//   </div>
// );

// // ── Main component ───────────────────────────────────────────────────────────
// const AddProduct = () => {

//   // ── Single product state ──
//   const [form, setForm] = useState({
//     name: "", brand: "", price: "", discount: "", description: "",
//     specifications: [{ label: "", value: "" }],
//     images: [], category: "", subCategory: "", childCategory: "",
//     variants: [], pairs_with: [], pairs_with_input: "",
//   });
//   const [imagePreviews, setImagePreviews] = useState([]);
//   const [errors,        setErrors]        = useState({});
//   const [variantInput,  setVariantInput]  = useState({
//     size: "", color: "", colorName: "", colorHex: "", stock: "", sku: "",
//     measurements: { chest: "", waist: "", hips: "", shoulder: "", length: "" },
//   });
//   const [colorSearch,  setColorSearch]  = useState("");
//   const [selectedTab,  setSelectedTab]  = useState("All");
//   const [categories,   setCategories]   = useState([]);

//   // ── Bulk state ──
//   const [bulkMode,          setBulkMode]          = useState(false);
//   const [bulkImages,        setBulkImages]        = useState([]);
//   const [bulkCategory,      setBulkCategory]      = useState("");
//   const [bulkSubCategory,   setBulkSubCategory]   = useState("");
//   const [bulkChildCategory, setBulkChildCategory] = useState("");
//   const [uploading,         setUploading]         = useState(false);

//   useEffect(() => {
//     axios.get("http://localhost:5000/api/categories")
//       .then(r => { if (r.data.categories) setCategories(r.data.categories); })
//       .catch(e => console.error("Failed to fetch categories:", e));
//   }, []);

//   // ── Color filtering for single product ──
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

//   // ── Single product handlers (ALL ORIGINAL — unchanged) ──
//   const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

//   const handleCategoryChange    = e =>
//     setForm(p => ({ ...p, category: e.target.value, subCategory: "", childCategory: "" }));
//   const handleSubCategoryChange = e =>
//     setForm(p => ({ ...p, subCategory: e.target.value, childCategory: "" }));
//   const handleChildCategoryChange = e => setForm(p => ({ ...p, childCategory: e.target.value }));

//   const handleSpecChange = (idx, field, val) => {
//     const s = [...form.specifications];
//     s[idx][field] = val;
//     setForm(p => ({ ...p, specifications: s }));
//   };
//   const addSpecification    = () =>
//     setForm(p => ({ ...p, specifications: [...p.specifications, { label: "", value: "" }] }));
//   const removeSpecification = idx =>
//     setForm(p => ({ ...p, specifications: p.specifications.filter((_, i) => i !== idx) }));

//   const handleImageChange = e => {
//     const files = Array.from(e.target.files);
//     setForm(p => ({ ...p, images: files }));
//     setImagePreviews(files.map(f => URL.createObjectURL(f)));
//   };

//   const handleVariantInputChange = e => {
//     const { name, value } = e.target;
//     setVariantInput(p => ({ ...p, [name]: value }));
//   };

//   // ── measurement change for single product variant input ──
//   const handleVariantMeasurementChange = (field, value) => {
//     setVariantInput(p => ({
//       ...p,
//       measurements: { ...p.measurements, [field]: value },
//     }));
//   };

//   const addVariant = () => {
//     if (
//       ((form.category === "Clothing" ||
//         (form.category === "Handmade" && form.subCategory === "Jewelry")) &&
//         !variantInput.size) ||
//       !variantInput.color ||
//       !variantInput.stock
//     ) return;
//     setForm(p => ({ ...p, variants: [...p.variants, { ...variantInput }] }));
//     setVariantInput({
//       size: "", color: "", colorName: "", colorHex: "", stock: "", sku: "",
//       measurements: { chest: "", waist: "", hips: "", shoulder: "", length: "" },
//     });
//   };

//   const removeVariant = idx =>
//     setForm(p => ({ ...p, variants: p.variants.filter((_, i) => i !== idx) }));

//   const handleReset = () => {
//     setForm({
//       name: "", brand: "", price: "", discount: "", description: "",
//       specifications: [{ label: "", value: "" }],
//       images: [], category: "", subCategory: "", childCategory: "",
//       variants: [], pairs_with: [], pairs_with_input: "",
//     });
//     setImagePreviews([]); setErrors({});
//     setVariantInput({
//       size: "", color: "", colorName: "", colorHex: "", stock: "", sku: "",
//       measurements: { chest: "", waist: "", hips: "", shoulder: "", length: "" },
//     });
//   };

//   const validate = () => {
//     const e = {};
//     if (!form.name)          e.name          = "Product name is required";
//     if (!form.brand)         e.brand         = "Brand is required";
//     if (!form.price)         e.price         = "Price is required";
//     if (!form.category)      e.category      = "Category is required";
//     if (!form.subCategory)   e.subCategory   = "Subcategory is required";
//     if (!form.childCategory) e.childCategory = "Child category is required";
//     if (!form.images.length) e.images        = "At least one image is required";
//     setErrors(e);
//     return !Object.keys(e).length;
//   };

//   // ── Submit single product (original logic + measurements) ──
//   const handleSubmit = async e => {
//     e.preventDefault();
//     if (!validate()) return;
//     try {
//       const uploadedImageUrls = [];
//       for (const img of form.images) {
//         const fd = new FormData();
//         fd.append("file", img);
//         fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
//         const res = await axios.post(CLOUDINARY_URL, fd);
//         uploadedImageUrls.push(res.data.secure_url);
//       }

//       const backendFormData = new FormData();
//       backendFormData.append("name",           form.name);
//       backendFormData.append("brand",          form.brand);
//       backendFormData.append("price",          form.price);
//       backendFormData.append("discount",       form.discount || 0);
//       backendFormData.append("description",    form.description);
//       backendFormData.append("category",       form.category);
//       backendFormData.append("subCategory",    form.subCategory);
//       backendFormData.append("childCategory",  form.childCategory);
//       backendFormData.append("specifications", JSON.stringify(form.specifications));
//       backendFormData.append("variants", JSON.stringify(
//         form.variants.map(v => ({
//           ...v,
//           stock:     Number(v.stock),
//           colorName: v.colorName || v.color,
//           colorHex:  v.colorHex  || v.color,
//           // measurements included as-is — backend saves only if any field filled
//         }))
//       ));
//       backendFormData.append("pairs_with", JSON.stringify(form.pairs_with));
//       backendFormData.append("added_by",   "admin");
//       backendFormData.append("status",     "active");
//       backendFormData.append("images",     JSON.stringify(uploadedImageUrls));

//       const response = await axios.post("http://localhost:5000/api/products/add", backendFormData);
//       if (response.data.product_id) {
//         alert("✅ Product added successfully!");
//         handleReset();
//       } else {
//         alert("❌ Failed to add product: " + response.data.error);
//       }
//     } catch (err) {
//       console.error(err);
//       alert("⚠️ Failed to upload images or add product.");
//     }
//   };

//   // ── Bulk helpers (ALL ORIGINAL — unchanged) ──
//   const handleBulkImageChange = e => {
//     const files = Array.from(e.target.files);
//     setBulkImages(prev => [
//       ...prev,
//       ...files.map(file => ({
//         file,
//         preview: URL.createObjectURL(file),
//         name: "", price: 100, sku: "",
//         colorSearch: "", selectedTab: "All",
//         variants: [{
//           size: "M", color: "#FFFFFF", colorName: "", colorHex: "#FFFFFF",
//           stock: 10, sku: "",
//           measurements: { chest: "", waist: "", hips: "", shoulder: "", length: "" },
//           _colorSearch: "", _colorTab: "All",
//         }],
//       })),
//     ]);
//   };

//   const addVariantToImage = imgIdx =>
//     setBulkImages(prev => prev.map((img, i) =>
//       i === imgIdx
//         ? {
//             ...img,
//             variants: [...img.variants, {
//               size: "", color: "#FFFFFF", colorName: "", colorHex: "#FFFFFF",
//               stock: 10, sku: "",
//               measurements: { chest: "", waist: "", hips: "", shoulder: "", length: "" },
//               _colorSearch: "", _colorTab: "All",
//             }],
//           }
//         : img
//     ));

//   const updateVariantField = (imgIdx, varIdx, field, val) =>
//     setBulkImages(prev => prev.map((img, i) =>
//       i === imgIdx
//         ? { ...img, variants: img.variants.map((v, vi) => vi === varIdx ? { ...v, [field]: val } : v) }
//         : img
//     ));

//   // ── measurement change for bulk variant ──
//   const updateVariantMeasurement = (imgIdx, varIdx, field, val) =>
//     setBulkImages(prev => prev.map((img, i) =>
//       i === imgIdx
//         ? {
//             ...img,
//             variants: img.variants.map((v, vi) =>
//               vi === varIdx
//                 ? { ...v, measurements: { ...v.measurements, [field]: val } }
//                 : v
//             ),
//           }
//         : img
//     ));

//   const removeVariantFromImage = (imgIdx, varIdx) =>
//     setBulkImages(prev => prev.map((img, i) =>
//       i === imgIdx
//         ? { ...img, variants: img.variants.filter((_, vi) => vi !== varIdx) }
//         : img
//     ));

//   const isSizeNeeded = bulkCategory === "Clothing" ||
//     (bulkCategory === "Handmade" && bulkSubCategory === "Jewelry");

//   const handleBulkSubmit = async () => {
//     if (!bulkImages.length) return alert("⚠️ Please select images");
//     setUploading(true);
//     try {
//       const chunkArray = (arr, size) =>
//         arr.reduce((acc, _, i) => (i % size ? acc : [...acc, arr.slice(i, i + size)]), []);

//       const imageChunks = chunkArray(bulkImages, 5);
//       let uploadedUrls  = [];
//       for (const chunk of imageChunks) {
//         const results = await Promise.allSettled(
//           chunk.map(img => {
//             const fd = new FormData();
//             fd.append("file", img.file);
//             fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
//             return axios.post(CLOUDINARY_URL, fd);
//           })
//         );
//         uploadedUrls.push(
//           ...results.map(r => r.status === "fulfilled" ? r.value.data.secure_url : null)
//         );
//       }

//       for (let i = 0; i < bulkImages.length; i++) {
//         const img = bulkImages[i];
//         const url = uploadedUrls[i];
//         if (!url) continue;

//         const variantsToSend = (img.variants?.length
//           ? img.variants
//           : [{ size: "M", color: "#FFFFFF", stock: 10, sku: "" }]
//         ).map(v => ({
//           size:      v.size      || "M",
//           color:     v.colorName || v.color || "#FFFFFF",
//           colorName: v.colorName || v.color || "#FFFFFF",
//           colorHex:  v.colorHex  || v.color || "#FFFFFF",
//           stock:     Number(v.stock || 10),
//           sku:       v.sku || "",
//           measurements: v.measurements || {},
//           // strip UI-only _colorSearch / _colorTab
//         }));

//         const fd = new FormData();
//         fd.append("name",          img.name  || "Unnamed Product");
//         fd.append("brand",         "Generic");
//         fd.append("price",         img.price || 100);
//         fd.append("discount",      0);
//         fd.append("description",   "Bulk uploaded product");
//         fd.append("category",      bulkCategory);
//         fd.append("subCategory",   bulkSubCategory);
//         fd.append("childCategory", bulkChildCategory);
//         fd.append("specifications",JSON.stringify([]));
//         fd.append("pairs_with",    JSON.stringify([]));
//         fd.append("variants",      JSON.stringify(variantsToSend));
//         fd.append("images",        JSON.stringify([url]));
//         fd.append("added_by",      "admin");
//         fd.append("status",        "active");

//         await axios.post("http://localhost:5000/api/products/add", fd);
//       }

//       alert("✅ Bulk upload completed successfully!");
//       setBulkImages([]);
//       setBulkCategory(""); setBulkSubCategory(""); setBulkChildCategory("");
//     } catch (err) {
//       console.error("❌ Bulk upload error:", err);
//       alert("⚠️ Failed to upload bulk images");
//     } finally {
//       setUploading(false);
//     }
//   };

//   const showSize = form.category === "Clothing" ||
//     (form.category === "Handmade" && form.subCategory === "Jewelry");

//   // ── RENDER ───────────────────────────────────────────────────────────────
//   return (
//     <div className={styles.container}>
//       <h1 className={styles.title}>Add Product</h1>

//       <label className={styles.bulkToggle}>
//         <input type="checkbox" checked={bulkMode} onChange={() => setBulkMode(p => !p)} />
//         &nbsp;Bulk Upload Mode
//       </label>

//       {/* ══════════════════════════════════════════
//           BULK MODE
//       ══════════════════════════════════════════ */}
//       {bulkMode ? (
//         <div className={styles.bulkContainer}>

//           {/* Category selectors */}
//           <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
//             <select value={bulkCategory} onChange={e => {
//               setBulkCategory(e.target.value); setBulkSubCategory(""); setBulkChildCategory("");
//             }}>
//               <option value="">Select Category</option>
//               {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
//             </select>

//             <select value={bulkSubCategory} onChange={e => {
//               setBulkSubCategory(e.target.value); setBulkChildCategory("");
//             }} disabled={!bulkCategory}>
//               <option value="">Select Subcategory</option>
//               {categories.find(c => c.name === bulkCategory)?.subCategories.map(s =>
//                 <option key={s.name} value={s.name}>{s.name}</option>
//               )}
//             </select>

//             <select value={bulkChildCategory} onChange={e => setBulkChildCategory(e.target.value)}
//               disabled={!bulkSubCategory}>
//               <option value="">Select Child Category</option>
//               {categories.find(c => c.name === bulkCategory)
//                 ?.subCategories.find(s => s.name === bulkSubCategory)
//                 ?.childCategories.map(ch => <option key={ch} value={ch}>{ch}</option>)}
//             </select>
//           </div>

//           {/* File picker */}
//           <div className={styles.formGroup}>
//             <label>Upload Images</label>
//             <input type="file" multiple accept="image/*" onChange={handleBulkImageChange} />
//           </div>

//           {/* Per-image cards */}
//           <div className={styles.bulkImageList}>
//             {bulkImages.map((img, imgIdx) => (
//               <div key={imgIdx} className={styles.bulkImageCard}>

//                 {/* Top row: preview + basic fields */}
//                 <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
//                   <img src={img.preview} alt="preview"
//                     style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 10, flexShrink: 0 }} />

//                   <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 180 }}>
//                     <input type="text" placeholder="Product name" value={img.name}
//                       onChange={e => setBulkImages(prev => prev.map((x, i) =>
//                         i === imgIdx ? { ...x, name: e.target.value } : x))}
//                       style={inp} />
//                     <input type="number" placeholder="Price" value={img.price}
//                       onChange={e => setBulkImages(prev => prev.map((x, i) =>
//                         i === imgIdx ? { ...x, price: Number(e.target.value) } : x))}
//                       style={inp} />
//                     <input type="text" placeholder="SKU (optional)" value={img.sku}
//                       onChange={e => setBulkImages(prev => prev.map((x, i) =>
//                         i === imgIdx ? { ...x, sku: e.target.value } : x))}
//                       style={inp} />
//                   </div>

//                   <button type="button"
//                     onClick={() => setBulkImages(p => p.filter((_, i) => i !== imgIdx))}
//                     style={{ background: "#fee2e2", border: "none", borderRadius: 8,
//                       padding: "4px 10px", cursor: "pointer", color: "#dc2626", fontWeight: 700 }}>
//                     ✕ Remove Image
//                   </button>
//                 </div>

//                 {/* Variant rows */}
//                 <div style={{ marginTop: 14 }}>
//                   <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
//                     <strong style={{ fontSize: 13, color: "#374151" }}>Variants</strong>
//                     <button type="button" onClick={() => addVariantToImage(imgIdx)}
//                       style={{ background: "#f0fdf4", border: "1px solid #bbf7d0",
//                         borderRadius: 8, padding: "4px 12px", cursor: "pointer",
//                         color: "#16a34a", fontSize: 12, fontWeight: 600 }}>
//                       ➕ Add Variant
//                     </button>
//                   </div>

//                   {img.variants.map((v, varIdx) => (
//                     <div key={varIdx} style={{
//                       background: varIdx % 2 === 0 ? "#f9fafb" : "#fff",
//                       border: "1px solid #f3f4f6",
//                       borderRadius: 10, padding: 12, marginBottom: 10,
//                     }}>

//                       {/* Row 1 — Size / Color name / Stock / SKU / preview / remove */}
//                       <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
//                         {isSizeNeeded && (
//                           <select value={v.size}
//                             onChange={e => updateVariantField(imgIdx, varIdx, "size", e.target.value)}
//                             style={{ ...inp, width: 80 }}>
//                             <option value="">Size</option>
//                             {SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
//                           </select>
//                         )}

//                         <input type="text" placeholder="Color name (e.g. Navy Blue)"
//                           value={v.colorName || ""}
//                           onChange={e => updateVariantField(imgIdx, varIdx, "colorName", e.target.value)}
//                           style={{ ...inp, width: 160 }} />

//                         <input type="number" placeholder="Stock" min={0}
//                           value={v.stock}
//                           onChange={e => updateVariantField(imgIdx, varIdx, "stock", Number(e.target.value))}
//                           style={{ ...inp, width: 80 }} />

//                         <input type="text" placeholder="SKU (auto)"
//                           value={v.sku || ""}
//                           onChange={e => updateVariantField(imgIdx, varIdx, "sku", e.target.value)}
//                           style={{ ...inp, width: 110 }} />

//                         {v.color && (
//                           <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
//                             <div style={{
//                               width: 28, height: 28, borderRadius: "50%",
//                               background: v.color, border: "2px solid #d1d5db",
//                               boxShadow: "0 1px 4px rgba(0,0,0,0.2)", flexShrink: 0,
//                             }} />
//                             <span style={{ fontSize: 11, color: "#6b7280" }}>{v.color}</span>
//                           </div>
//                         )}

//                         <button type="button"
//                           disabled={img.variants.length === 1}
//                           onClick={() => removeVariantFromImage(imgIdx, varIdx)}
//                           style={{
//                             marginLeft: "auto",
//                             background: img.variants.length === 1 ? "#f3f4f6" : "#fee2e2",
//                             border: "none", borderRadius: 8, padding: "5px 12px",
//                             cursor: img.variants.length === 1 ? "not-allowed" : "pointer",
//                             color: img.variants.length === 1 ? "#9ca3af" : "#dc2626",
//                             fontWeight: 600, fontSize: 12,
//                           }}>
//                           ✕ Remove
//                         </button>
//                       </div>

//                       {/* Row 2 — Full color palette */}
//                       <div>
//                         <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
//                           Pick Color:
//                         </div>
//                         <input type="text" placeholder="Search color hex..."
//                           value={v._colorSearch || ""}
//                           onChange={e => updateVariantField(imgIdx, varIdx, "_colorSearch", e.target.value)}
//                           style={{ ...inp, marginBottom: 8 }} />

//                         <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
//                           {["All", "Red", "Green", "Blue", "Gray", "Black/White"].map(tab => (
//                             <button key={tab} type="button"
//                               onClick={() => updateVariantField(imgIdx, varIdx, "_colorTab", tab)}
//                               style={{
//                                 padding: "3px 12px", borderRadius: 20, fontSize: 11,
//                                 border: "none", cursor: "pointer",
//                                 background: (v._colorTab || "All") === tab ? "#ff3f6c" : "#f3f4f6",
//                                 color:      (v._colorTab || "All") === tab ? "#fff"     : "#374151",
//                                 fontWeight: (v._colorTab || "All") === tab ? 700 : 400,
//                               }}>
//                               {tab}
//                             </button>
//                           ))}
//                         </div>

//                         <div style={{
//                           display: "grid", gridTemplateColumns: "repeat(auto-fill, 28px)",
//                           gap: 5, maxHeight: 180, overflowY: "auto", padding: "4px 2px",
//                         }}>
//                           {WEB_SAFE_COLORS.filter(({ hex }) => {
//                             const s   = (v._colorSearch || "").toLowerCase();
//                             const tab = v._colorTab || "All";
//                             const m   = hex.toLowerCase().includes(s);
//                             if (!m) return false;
//                             if (tab === "All")         return true;
//                             if (tab === "Red")         return hex.startsWith("#FF") && hex !== "#FFFFFF";
//                             if (tab === "Green")       return /^#..(FF|CC|99|66)/.test(hex) && hex[3] > "3";
//                             if (tab === "Blue")        return hex.endsWith("FF") && !hex.startsWith("#FF");
//                             if (tab === "Gray")        return hex[1]===hex[3] && hex[3]===hex[5] && hex !== "#000000" && hex !== "#FFFFFF";
//                             if (tab === "Black/White") return ["#000000","#FFFFFF","#333333","#CCCCCC","#999999"].includes(hex);
//                             return true;
//                           }).map(({ hex }) => (
//                             <div key={hex} title={hex}
//                               onClick={() => {
//                                 updateVariantField(imgIdx, varIdx, "color",    hex);
//                                 updateVariantField(imgIdx, varIdx, "colorHex", hex);
//                                 if (!v.colorName)
//                                   updateVariantField(imgIdx, varIdx, "colorName", hex);
//                               }}
//                               style={{
//                                 width: 28, height: 28, borderRadius: "50%",
//                                 background: hex, cursor: "pointer",
//                                 border: v.color === hex ? "3px solid #ff9800" : "1px solid #d1d5db",
//                                 transform: v.color === hex ? "scale(1.25)" : "scale(1)",
//                                 transition: "transform 0.15s",
//                               }} />
//                           ))}
//                         </div>

//                         <input type="text" placeholder="#RRGGBB — type any hex"
//                           value={v.color || ""}
//                           onChange={e => {
//                             updateVariantField(imgIdx, varIdx, "color",    e.target.value);
//                             updateVariantField(imgIdx, varIdx, "colorHex", e.target.value);
//                           }}
//                           style={{ ...inp, marginTop: 8 }} />
//                       </div>

//                       {/* Row 3 — Measurements (only for size categories) */}
//                       {isSizeNeeded && (
//                         <MeasurementInputs
//                           values={v.measurements || {}}
//                           onChange={(field, val) => updateVariantMeasurement(imgIdx, varIdx, field, val)}
//                         />
//                       )}

//                     </div>
//                   ))}
//                 </div>
//               </div>
//             ))}
//           </div>

//           {bulkImages.length > 0 && (
//             <button type="button" onClick={handleBulkSubmit}
//               className={styles.submitBtn} disabled={uploading}>
//               {uploading ? "⏳ Uploading..." : "💾 Submit Bulk"}
//             </button>
//           )}
//         </div>

//       ) : (
//         /* ══════════════════════════════════════════
//            SINGLE PRODUCT FORM
//         ══════════════════════════════════════════ */
//         <form className={styles.form} onSubmit={handleSubmit}>

//           {/* Name */}
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
//               <input type="number" name="price" value={form.price} onChange={handleChange} />
//               {errors.price && <span className={styles.error}>{errors.price}</span>}
//             </div>
//             <div className={styles.formGroup}>
//               <label>Discount (%)</label>
//               <input type="number" name="discount" value={form.discount} onChange={handleChange} />
//             </div>
//           </div>

//           {/* Variants */}
//           <div className={styles.formGroup}>
//             <label>Variants</label>

//             {showSize && (
//               <select name="size" value={variantInput.size} onChange={handleVariantInputChange}>
//                 <option value="">Size</option>
//                 {SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
//               </select>
//             )}

//             <input type="number" name="stock" placeholder="Stock"
//               value={variantInput.stock} onChange={handleVariantInputChange} min={0} />

//             <input type="text" name="sku" placeholder="SKU (optional)"
//               value={variantInput.sku} onChange={handleVariantInputChange} />

//             {/* Color name — user types freely, not overwritten by picker */}
//             <input
//               type="text"
//               name="colorName"
//               placeholder="Color name (e.g. Navy Blue)"
//               value={variantInput.colorName}
//               onChange={e => setVariantInput(p => ({ ...p, colorName: e.target.value }))}
//               className={styles.colorSearch}
//             />

//             <input type="text" placeholder="Search color hex..."
//               value={colorSearch}
//               onChange={e => setColorSearch(e.target.value)}
//               className={styles.colorSearch} />

//             <div className={styles.colorTabs}>
//               {["All", "Red", "Green", "Blue", "Gray"].map(tab => (
//                 <button key={tab} type="button"
//                   className={`${styles.colorTab} ${selectedTab === tab ? styles.activeTab : ""}`}
//                   onClick={() => setSelectedTab(tab)}>
//                   {tab}
//                 </button>
//               ))}
//             </div>

//             <div className={styles.colorPalette}>
//               {filteredColors.map(({ name, hex }) => (
//                 <div key={hex}
//                   className={`${styles.colorCircle} ${variantInput.color === hex ? styles.selected : ""}`}
//                   style={{ backgroundColor: hex }}
//                   onClick={() => setVariantInput(p => ({
//                     ...p,
//                     color:     hex,
//                     colorHex:  hex,
//                     // Only auto-fill colorName if user hasn't typed one yet
//                     colorName: p.colorName.trim() ? p.colorName : hex,
//                   }))}
//                 />
//               ))}
//             </div>

//             {/* ── Measurements — only for Clothing / Jewelry ── */}
//             {showSize && (
//               <MeasurementInputs
//                 values={variantInput.measurements}
//                 onChange={handleVariantMeasurementChange}
//               />
//             )}

//             <button type="button" onClick={addVariant} className={styles.addBtn}>
//               ➕ Add Variant
//             </button>

//             {/* Added variants list */}
//             <div className={styles.variantList}>
//               {form.variants.map((v, i) => (
//                 <div key={i} className={styles.variantItem}>
//                   {showSize ? (
//                     <span>
//                       Size: <strong>{v.size}</strong> |{" "}
//                       Color: <span style={{
//                         display: "inline-block", width: 16, height: 16,
//                         backgroundColor: v.color, borderRadius: "50%",
//                         border: "1px solid #ccc", margin: "0 4px", verticalAlign: "middle",
//                       }} />
//                       <strong>{v.colorName || v.color}</strong> |{" "}
//                       Stock: <strong>{v.stock}</strong> |{" "}
//                       SKU: <strong>{v.sku || "Auto"}</strong>
//                       {v.measurements && Object.values(v.measurements).some(Boolean) && (
//                         <span style={{ fontSize: 11, color: "#16a34a", marginLeft: 6 }}>
//                           📐 {Object.entries(v.measurements).filter(([,val]) => val).map(([k,val]) => `${k}: ${val}`).join(", ")}
//                         </span>
//                       )}
//                     </span>
//                   ) : (
//                     <span>
//                       Color: <span style={{
//                         display: "inline-block", width: 16, height: 16,
//                         backgroundColor: v.color, borderRadius: "50%",
//                         border: "1px solid #ccc", margin: "0 4px", verticalAlign: "middle",
//                       }} />
//                       <strong>{v.colorName || v.color}</strong> |{" "}
//                       Stock: <strong>{v.stock}</strong> |{" "}
//                       SKU: <strong>{v.sku || "Auto"}</strong>
//                     </span>
//                   )}
//                   <button type="button" onClick={() => removeVariant(i)}>❌</button>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* Category */}
//           <select value={form.category} onChange={handleCategoryChange}>
//             <option value="">Select Category</option>
//             {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
//           </select>
//           {errors.category && <span className={styles.error}>{errors.category}</span>}

//           {/* Subcategory */}
//           <select value={form.subCategory} onChange={handleSubCategoryChange} disabled={!form.category}>
//             <option value="">Select Subcategory</option>
//             {categories.find(c => c.name === form.category)?.subCategories.map(s =>
//               <option key={s.name} value={s.name}>{s.name}</option>
//             )}
//           </select>
//           {errors.subCategory && <span className={styles.error}>{errors.subCategory}</span>}

//           {/* Child Category */}
//           <select value={form.childCategory} onChange={handleChildCategoryChange} disabled={!form.subCategory}>
//             <option value="">Select Child Category</option>
//             {categories.find(c => c.name === form.category)
//               ?.subCategories.find(s => s.name === form.subCategory)
//               ?.childCategories.map(ch => <option key={ch} value={ch}>{ch}</option>)}
//           </select>
//           {errors.childCategory && <span className={styles.error}>{errors.childCategory}</span>}

//           {/* Images */}
//           <div className={styles.formGroup}>
//             <label>Images</label>
//             <input type="file" multiple onChange={handleImageChange} />
//             {errors.images && <span className={styles.error}>{errors.images}</span>}
//             <div className={styles.imagePreview}>
//               {imagePreviews.map((src, i) => <img key={i} src={src} alt="preview" />)}
//             </div>
//           </div>

//           {/* Specifications */}
//           <div className={styles.formGroup}>
//             <label>Specifications</label>
//             {form.specifications.map((spec, idx) => (
//               <div key={idx} className={styles.specRow}>
//                 <input placeholder="Label" value={spec.label}
//                   onChange={e => handleSpecChange(idx, "label", e.target.value)} />
//                 <input placeholder="Value" value={spec.value}
//                   onChange={e => handleSpecChange(idx, "value", e.target.value)} />
//                 <button type="button" onClick={() => removeSpecification(idx)}>❌</button>
//               </div>
//             ))}
//             <button type="button" onClick={addSpecification}>➕ Add Specification</button>
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
//               <input type="text" placeholder="Enter product ID"
//                 value={form.pairs_with_input || ""}
//                 onChange={e => setForm(p => ({ ...p, pairs_with_input: e.target.value }))} />
//               <button type="button" className={styles.addBtn}
//                 onClick={() => {
//                   const id = (form.pairs_with_input || "").trim();
//                   if (id && !form.pairs_with.includes(id))
//                     setForm(p => ({ ...p, pairs_with: [...p.pairs_with, id], pairs_with_input: "" }));
//                 }}>
//                 ➕ Add
//               </button>
//             </div>
//             <div className={styles.pairList}>
//               {form.pairs_with.map((id, i) => (
//                 <div key={i} className={styles.pairItem}>
//                   <span>{id}</span>
//                   <button type="button"
//                     onClick={() => setForm(p => ({
//                       ...p, pairs_with: p.pairs_with.filter((_, j) => j !== i)
//                     }))}>
//                     ❌
//                   </button>
//                 </div>
//               ))}
//             </div>
//           </div>

//           <div className={styles.actions}>
//             <button type="submit" className={styles.submitBtn}>Submit</button>
//             <button type="button" onClick={handleReset} className={styles.resetBtn}>Reset</button>
//           </div>
//         </form>
//       )}
//     </div>
//   );
// };

// // shared inline input style
// const inp = {
//   padding: "7px 10px", borderRadius: 8,
//   border: "1px solid #e5e7eb", fontSize: 13,
//   outline: "none", width: "100%", boxSizing: "border-box",
// };

// export default AddProduct;


import React, { useState, useEffect } from "react";
import styles from "./AdminAddProduct.module.css";
import axios from "axios";
import SizeChartUpload from "./SizeChartUpload";

const hexValues = ["00", "33", "66", "99", "CC", "FF"];
const WEB_SAFE_COLORS = [];
for (let r of hexValues)
  for (let g of hexValues)
    for (let b of hexValues)
      WEB_SAFE_COLORS.push({ name: `#${r}${g}${b}`, hex: `#${r}${g}${b}` });

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL"];
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dfvrobw6x/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "Citimart";
const MEASUREMENT_FIELDS = ["chest", "waist", "hips", "shoulder", "length"];

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

// ✅ Color picker — never touches colorName, only sets hex
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
      <input type="text" placeholder="Search hex e.g. #FF0000"
        value={colorSearch} onChange={e => setColorSearch(e.target.value)}
        className={styles.colorSearch} />
      <div className={styles.colorTabs}>
        {["All", "Red", "Green", "Blue", "Gray"].map(tab => (
          <button key={tab} type="button"
            className={`${styles.colorTab} ${selectedTab === tab ? styles.activeTab : ""}`}
            onClick={() => setSelectedTab(tab)}>{tab}</button>
        ))}
      </div>
      {selectedHex && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 0" }}>
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: selectedHex, border: "2px solid #ccc", flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: "#555" }}>{selectedHex}</span>
          <span style={{ fontSize: 11, color: "#9ca3af" }}>← hex picked</span>
        </div>
      )}
      <div className={styles.colorPalette}>
        {filtered.map(({ hex }) => (
          <div key={hex}
            className={`${styles.colorCircle} ${selectedHex === hex ? styles.selected : ""}`}
            style={{ backgroundColor: hex }}
            onClick={() => onSelect(hex)}
          />
        ))}
      </div>
    </div>
  );
};

const AddProduct = () => {
  const [form, setForm] = useState({
    name: "", brand: "", price: "", discount: "", description: "",
    specifications: [{ label: "", value: "" }],
    images: [], category: "", subCategory: "", childCategory: "",
    variants: [], pairs_with: [], pairs_with_input: "",
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [errors,        setErrors]        = useState({});
  const [variantInput,  setVariantInput]  = useState({
    size: "", color: "", colorName: "", colorHex: "", stock: "", sku: "",
    measurements: { chest: "", waist: "", hips: "", shoulder: "", length: "" },
  });
  // ✅ color picker state separate
  const [colorSearch,  setColorSearch]  = useState("");
  const [selectedTab,  setSelectedTab]  = useState("All");
  const [categories,   setCategories]   = useState([]);

  // submit result for size chart upload
  const [submitResult, setSubmitResult] = useState(null); // { productId }

  const [bulkMode,          setBulkMode]          = useState(false);
  const [bulkImages,        setBulkImages]        = useState([]);
  const [bulkCategory,      setBulkCategory]      = useState("");
  const [bulkSubCategory,   setBulkSubCategory]   = useState("");
  const [bulkChildCategory, setBulkChildCategory] = useState("");
  const [uploading,         setUploading]         = useState(false);

  useEffect(() => {
    axios.get("http://localhost:5000/api/categories")
      .then(r => { if (r.data.categories) setCategories(r.data.categories); })
      .catch(e => console.error("Failed to fetch categories:", e));
  }, []);

  const handleChange              = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleCategoryChange      = e => setForm(p => ({ ...p, category: e.target.value, subCategory: "", childCategory: "" }));
  const handleSubCategoryChange   = e => setForm(p => ({ ...p, subCategory: e.target.value, childCategory: "" }));
  const handleChildCategoryChange = e => setForm(p => ({ ...p, childCategory: e.target.value }));

  const handleSpecChange    = (idx, field, val) => {
    const s = [...form.specifications]; s[idx][field] = val;
    setForm(p => ({ ...p, specifications: s }));
  };
  const addSpecification    = () => setForm(p => ({ ...p, specifications: [...p.specifications, { label: "", value: "" }] }));
  const removeSpecification = idx => setForm(p => ({ ...p, specifications: p.specifications.filter((_, i) => i !== idx) }));

  const handleImageChange = e => {
    const files = Array.from(e.target.files);
    setForm(p => ({ ...p, images: files }));
    setImagePreviews(files.map(f => URL.createObjectURL(f)));
  };

  const handleVariantMeasurementChange = (field, value) =>
    setVariantInput(p => ({ ...p, measurements: { ...p.measurements, [field]: value } }));

  const showSize = form.category === "Clothing" ||
    (form.category === "Handmade" && form.subCategory === "Jewelry");

  const addVariant = () => {
    if (
      ((form.category === "Clothing" || (form.category === "Handmade" && form.subCategory === "Jewelry")) && !variantInput.size) ||
      !variantInput.color || !variantInput.stock
    ) return;
    setForm(p => ({ ...p, variants: [...p.variants, { ...variantInput }] }));
    setVariantInput({ size: "", color: "", colorName: "", colorHex: "", stock: "", sku: "",
      measurements: { chest: "", waist: "", hips: "", shoulder: "", length: "" } });
    setColorSearch(""); setSelectedTab("All");
  };
  const removeVariant = idx => setForm(p => ({ ...p, variants: p.variants.filter((_, i) => i !== idx) }));

  const handleReset = () => {
    setForm({ name: "", brand: "", price: "", discount: "", description: "",
      specifications: [{ label: "", value: "" }], images: [],
      category: "", subCategory: "", childCategory: "", variants: [], pairs_with: [], pairs_with_input: "" });
    setImagePreviews([]); setErrors({});
    setVariantInput({ size: "", color: "", colorName: "", colorHex: "", stock: "", sku: "",
      measurements: { chest: "", waist: "", hips: "", shoulder: "", length: "" } });
    setSubmitResult(null);
  };

  const validate = () => {
    const e = {};
    if (!form.name)          e.name          = "Product name is required";
    if (!form.brand)         e.brand         = "Brand is required";
    if (!form.price)         e.price         = "Price is required";
    if (!form.category)      e.category      = "Category is required";
    if (!form.subCategory)   e.subCategory   = "Subcategory is required";
    if (!form.childCategory) e.childCategory = "Child category is required";
    if (!form.images.length) e.images        = "At least one image is required";
    setErrors(e); return !Object.keys(e).length;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const uploadedImageUrls = [];
      for (const img of form.images) {
        const fd = new FormData();
        fd.append("file", img); fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
        const res = await axios.post(CLOUDINARY_URL, fd);
        uploadedImageUrls.push(res.data.secure_url);
      }
      const fd = new FormData();
      fd.append("name",           form.name);
      fd.append("brand",          form.brand);
      fd.append("price",          form.price);
      fd.append("discount",       form.discount || 0);
      fd.append("description",    form.description);
      fd.append("category",       form.category);
      fd.append("subCategory",    form.subCategory);
      fd.append("childCategory",  form.childCategory);
      fd.append("specifications", JSON.stringify(form.specifications));
      fd.append("variants",       JSON.stringify(form.variants.map(v => ({
        ...v, stock: Number(v.stock),
        colorName: v.colorName || v.color,
        colorHex:  v.colorHex  || v.color,
      }))));
      fd.append("pairs_with", JSON.stringify(form.pairs_with));
      fd.append("added_by",   "admin");
      fd.append("status",     "active");
      fd.append("images",     JSON.stringify(uploadedImageUrls));

      const response = await axios.post("http://localhost:5000/api/products/add", fd);
      if (response.data.product_id) {
        setSubmitResult({ productId: response.data.product_id });
        alert("✅ Product added successfully!");
        handleReset();
      } else {
        alert("❌ Failed to add product: " + response.data.error);
      }
    } catch (err) { console.error(err); alert("⚠️ Failed to upload images or add product."); }
  };

  // ── Bulk helpers ──
  const handleBulkImageChange = e => {
    const files = Array.from(e.target.files);
    setBulkImages(prev => [
      ...prev,
      ...files.map(file => ({
        file, preview: URL.createObjectURL(file),
        name: "", price: 100, sku: "",
        variants: [{
          size: "M", color: "#FFFFFF", colorName: "", colorHex: "#FFFFFF",
          stock: 10, sku: "",
          measurements: { chest: "", waist: "", hips: "", shoulder: "", length: "" },
          _colorSearch: "", _colorTab: "All",
        }],
      })),
    ]);
  };

  const addVariantToImage = imgIdx =>
    setBulkImages(prev => prev.map((img, i) =>
      i === imgIdx ? { ...img, variants: [...img.variants, {
        size: "", color: "#FFFFFF", colorName: "", colorHex: "#FFFFFF",
        stock: 10, sku: "", measurements: { chest: "", waist: "", hips: "", shoulder: "", length: "" },
        _colorSearch: "", _colorTab: "All",
      }]} : img
    ));

  const updateVariantField = (imgIdx, varIdx, field, val) =>
    setBulkImages(prev => prev.map((img, i) =>
      i === imgIdx
        ? { ...img, variants: img.variants.map((v, vi) => vi === varIdx ? { ...v, [field]: val } : v) }
        : img
    ));

  const updateVariantMeasurement = (imgIdx, varIdx, field, val) =>
    setBulkImages(prev => prev.map((img, i) =>
      i === imgIdx
        ? { ...img, variants: img.variants.map((v, vi) =>
            vi === varIdx ? { ...v, measurements: { ...v.measurements, [field]: val } } : v) }
        : img
    ));

  const removeVariantFromImage = (imgIdx, varIdx) =>
    setBulkImages(prev => prev.map((img, i) =>
      i === imgIdx ? { ...img, variants: img.variants.filter((_, vi) => vi !== varIdx) } : img
    ));

  const isSizeNeeded = bulkCategory === "Clothing" ||
    (bulkCategory === "Handmade" && bulkSubCategory === "Jewelry");

  const handleBulkSubmit = async () => {
    if (!bulkImages.length) return alert("⚠️ Please select images");
    setUploading(true);
    try {
      const chunkArray = (arr, size) =>
        arr.reduce((acc, _, i) => (i % size ? acc : [...acc, arr.slice(i, i + size)]), []);
      const imageChunks = chunkArray(bulkImages, 5);
      let uploadedUrls = [];
      for (const chunk of imageChunks) {
        const results = await Promise.allSettled(chunk.map(img => {
          const fd = new FormData();
          fd.append("file", img.file); fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
          return axios.post(CLOUDINARY_URL, fd);
        }));
        uploadedUrls.push(...results.map(r => r.status === "fulfilled" ? r.value.data.secure_url : null));
      }
      for (let i = 0; i < bulkImages.length; i++) {
        const img = bulkImages[i]; const url = uploadedUrls[i];
        if (!url) continue;
        const variantsToSend = (img.variants?.length ? img.variants
          : [{ size: "M", color: "#FFFFFF", stock: 10, sku: "" }]
        ).map(v => ({
          size: v.size || "M", color: v.colorName || v.color || "#FFFFFF",
          colorName: v.colorName || v.color || "#FFFFFF",
          colorHex: v.colorHex || v.color || "#FFFFFF",
          stock: Number(v.stock || 10), sku: v.sku || "",
          measurements: v.measurements || {},
        }));
        const fd = new FormData();
        fd.append("name", img.name || "Unnamed Product"); fd.append("brand", "Generic");
        fd.append("price", img.price || 100); fd.append("discount", 0);
        fd.append("description", "Bulk uploaded product");
        fd.append("category", bulkCategory); fd.append("subCategory", bulkSubCategory);
        fd.append("childCategory", bulkChildCategory);
        fd.append("specifications", JSON.stringify([])); fd.append("pairs_with", JSON.stringify([]));
        fd.append("variants", JSON.stringify(variantsToSend));
        fd.append("images", JSON.stringify([url]));
        fd.append("added_by", "admin"); fd.append("status", "active");
        await axios.post("http://localhost:5000/api/products/add", fd);
      }
      alert("✅ Bulk upload completed!");
      setBulkImages([]); setBulkCategory(""); setBulkSubCategory(""); setBulkChildCategory("");
    } catch (err) { console.error(err); alert("⚠️ Failed to upload bulk images");
    } finally { setUploading(false); }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Add Product</h1>

      <label className={styles.bulkToggle}>
        <input type="checkbox" checked={bulkMode} onChange={() => setBulkMode(p => !p)} />
        &nbsp;Bulk Upload Mode
      </label>

      {/* ── Size chart upload after successful submit ── */}
      {submitResult?.productId && (
        <div style={{ margin: "12px 0", padding: "12px 16px", background: "#f0fdf4",
          border: "1.5px solid #86efac", borderRadius: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#15803d", marginBottom: 8 }}>
            ✅ Product added!
          </div>
          <SizeChartUpload productId={submitResult.productId} role="admin" />
        </div>
      )}

      {bulkMode ? (
        <div className={styles.bulkContainer}>
          {/* Category selectors */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
            <select value={bulkCategory} onChange={e => { setBulkCategory(e.target.value); setBulkSubCategory(""); setBulkChildCategory(""); }}>
              <option value="">Select Category</option>
              {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
            </select>
            <select value={bulkSubCategory} onChange={e => { setBulkSubCategory(e.target.value); setBulkChildCategory(""); }} disabled={!bulkCategory}>
              <option value="">Select Subcategory</option>
              {categories.find(c => c.name === bulkCategory)?.subCategories.map(s =>
                <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
            <select value={bulkChildCategory} onChange={e => setBulkChildCategory(e.target.value)} disabled={!bulkSubCategory}>
              <option value="">Select Child Category</option>
              {categories.find(c => c.name === bulkCategory)?.subCategories.find(s => s.name === bulkSubCategory)
                ?.childCategories.map(ch => <option key={ch} value={ch}>{ch}</option>)}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Upload Images</label>
            <input type="file" multiple accept="image/*" onChange={handleBulkImageChange} />
          </div>

          <div className={styles.bulkImageList}>
            {bulkImages.map((img, imgIdx) => (
              <div key={imgIdx} className={styles.bulkImageCard}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <img src={img.preview} alt="preview"
                    style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 10, flexShrink: 0 }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 180 }}>
                    <input type="text" placeholder="Product name" value={img.name}
                      onChange={e => setBulkImages(prev => prev.map((x, i) => i === imgIdx ? { ...x, name: e.target.value } : x))}
                      style={inp} />
                    <input type="number" placeholder="Price" value={img.price}
                      onChange={e => setBulkImages(prev => prev.map((x, i) => i === imgIdx ? { ...x, price: Number(e.target.value) } : x))}
                      style={inp} />
                    <input type="text" placeholder="SKU (optional)" value={img.sku}
                      onChange={e => setBulkImages(prev => prev.map((x, i) => i === imgIdx ? { ...x, sku: e.target.value } : x))}
                      style={inp} />
                  </div>
                  <button type="button" onClick={() => setBulkImages(p => p.filter((_, i) => i !== imgIdx))}
                    style={{ background: "#fee2e2", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", color: "#dc2626", fontWeight: 700 }}>
                    ✕ Remove Image
                  </button>
                </div>

                {/* Variant rows */}
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <strong style={{ fontSize: 13, color: "#374151" }}>Variants</strong>
                    <button type="button" onClick={() => addVariantToImage(imgIdx)}
                      style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8,
                        padding: "4px 12px", cursor: "pointer", color: "#16a34a", fontSize: 12, fontWeight: 600 }}>
                      ➕ Add Variant
                    </button>
                  </div>

                  {img.variants.map((v, varIdx) => (
                    <div key={varIdx} style={{ background: varIdx % 2 === 0 ? "#f9fafb" : "#fff",
                      border: "1px solid #f3f4f6", borderRadius: 10, padding: 12, marginBottom: 10 }}>

                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
                        {isSizeNeeded && (
                          <select value={v.size} onChange={e => updateVariantField(imgIdx, varIdx, "size", e.target.value)}
                            style={{ ...inp, width: 80 }}>
                            <option value="">Size</option>
                            {SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        )}
                        {/* ✅ Color name separate */}
                        <input type="text" placeholder="Color name (e.g. Navy Blue)"
                          value={v.colorName || ""}
                          onChange={e => updateVariantField(imgIdx, varIdx, "colorName", e.target.value)}
                          style={{ ...inp, width: 160 }} />
                        <input type="number" placeholder="Stock" min={0} value={v.stock}
                          onChange={e => updateVariantField(imgIdx, varIdx, "stock", Number(e.target.value))}
                          style={{ ...inp, width: 80 }} />
                        <input type="text" placeholder="SKU (auto)" value={v.sku || ""}
                          onChange={e => updateVariantField(imgIdx, varIdx, "sku", e.target.value)}
                          style={{ ...inp, width: 110 }} />
                        {v.color && (
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <div style={{ width: 28, height: 28, borderRadius: "50%", background: v.color,
                              border: "2px solid #d1d5db", flexShrink: 0 }} />
                            <span style={{ fontSize: 11, color: "#6b7280" }}>{v.color}</span>
                          </div>
                        )}
                        <button type="button" disabled={img.variants.length === 1}
                          onClick={() => removeVariantFromImage(imgIdx, varIdx)}
                          style={{ marginLeft: "auto",
                            background: img.variants.length === 1 ? "#f3f4f6" : "#fee2e2",
                            border: "none", borderRadius: 8, padding: "5px 12px",
                            cursor: img.variants.length === 1 ? "not-allowed" : "pointer",
                            color: img.variants.length === 1 ? "#9ca3af" : "#dc2626",
                            fontWeight: 600, fontSize: 12 }}>
                          ✕ Remove
                        </button>
                      </div>

                      {/* ✅ Color picker only sets hex */}
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Pick Color (hex):</div>
                        <input type="text" placeholder="Search color hex..."
                          value={v._colorSearch || ""}
                          onChange={e => updateVariantField(imgIdx, varIdx, "_colorSearch", e.target.value)}
                          style={{ ...inp, marginBottom: 8 }} />
                        <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
                          {["All", "Red", "Green", "Blue", "Gray", "Black/White"].map(tab => (
                            <button key={tab} type="button"
                              onClick={() => updateVariantField(imgIdx, varIdx, "_colorTab", tab)}
                              style={{ padding: "3px 12px", borderRadius: 20, fontSize: 11, border: "none", cursor: "pointer",
                                background: (v._colorTab || "All") === tab ? "#ff3f6c" : "#f3f4f6",
                                color: (v._colorTab || "All") === tab ? "#fff" : "#374151",
                                fontWeight: (v._colorTab || "All") === tab ? 700 : 400 }}>
                              {tab}
                            </button>
                          ))}
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 28px)",
                          gap: 5, maxHeight: 180, overflowY: "auto", padding: "4px 2px" }}>
                          {WEB_SAFE_COLORS.filter(({ hex }) => {
                            const s = (v._colorSearch || "").toLowerCase();
                            const tab = v._colorTab || "All";
                            const m = hex.toLowerCase().includes(s);
                            if (!m) return false;
                            if (tab === "All") return true;
                            if (tab === "Red")   return hex.startsWith("#FF") && hex !== "#FFFFFF";
                            if (tab === "Green") return /^#..(FF|CC|99|66)/.test(hex) && hex[3] > "3";
                            if (tab === "Blue")  return hex.endsWith("FF") && !hex.startsWith("#FF");
                            if (tab === "Gray")  return hex[1]===hex[3] && hex[3]===hex[5] && hex !== "#000000" && hex !== "#FFFFFF";
                            if (tab === "Black/White") return ["#000000","#FFFFFF","#333333","#CCCCCC","#999999"].includes(hex);
                            return true;
                          }).map(({ hex }) => (
                            <div key={hex} title={hex}
                              // ✅ ONLY sets color + colorHex, never colorName
                              onClick={() => {
                                updateVariantField(imgIdx, varIdx, "color",    hex);
                                updateVariantField(imgIdx, varIdx, "colorHex", hex);
                              }}
                              style={{ width: 28, height: 28, borderRadius: "50%", background: hex, cursor: "pointer",
                                border: v.color === hex ? "3px solid #ff9800" : "1px solid #d1d5db",
                                transform: v.color === hex ? "scale(1.25)" : "scale(1)", transition: "transform 0.15s" }} />
                          ))}
                        </div>
                        <input type="text" placeholder="#RRGGBB — type any hex" value={v.color || ""}
                          onChange={e => { updateVariantField(imgIdx, varIdx, "color", e.target.value); updateVariantField(imgIdx, varIdx, "colorHex", e.target.value); }}
                          style={{ ...inp, marginTop: 8 }} />
                      </div>

                      <MeasurementInputs
                        values={v.measurements || {}}
                        onChange={(field, val) => updateVariantMeasurement(imgIdx, varIdx, field, val)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {bulkImages.length > 0 && (
            <button type="button" onClick={handleBulkSubmit} className={styles.submitBtn} disabled={uploading}>
              {uploading ? "⏳ Uploading..." : "💾 Submit Bulk"}
            </button>
          )}
        </div>

      ) : (
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

          {/* Variants */}
          <div className={styles.formGroup}>
            <label>Variants</label>
            {showSize && (
              <select name="size" value={variantInput.size}
                onChange={e => setVariantInput(p => ({ ...p, size: e.target.value }))}>
                <option value="">Size</option>
                {SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
            <input type="number" name="stock" placeholder="Stock"
              value={variantInput.stock} onChange={e => setVariantInput(p => ({ ...p, stock: e.target.value }))} min={0} />
            <input type="text" name="sku" placeholder="SKU (optional)"
              value={variantInput.sku} onChange={e => setVariantInput(p => ({ ...p, sku: e.target.value }))} />

            {/* ✅ Color name — standalone */}
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

            {showSize && (
              <MeasurementInputs values={variantInput.measurements} onChange={handleVariantMeasurementChange} />
            )}

            <button type="button" onClick={addVariant} className={styles.addBtn}>➕ Add Variant</button>

            <div className={styles.variantList}>
              {form.variants.map((v, i) => (
                <div key={i} className={styles.variantItem}>
                  {showSize && <span>Size: <strong>{v.size}</strong> | </span>}
                  Color: <span style={{ display: "inline-block", width: 16, height: 16, borderRadius: "50%",
                    backgroundColor: v.color, border: "1px solid #ccc", margin: "0 4px", verticalAlign: "middle" }} />
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
          <select value={form.category} onChange={handleCategoryChange}>
            <option value="">Select Category</option>
            {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
          </select>
          {errors.category && <span className={styles.error}>{errors.category}</span>}
          <select value={form.subCategory} onChange={handleSubCategoryChange} disabled={!form.category}>
            <option value="">Select Subcategory</option>
            {categories.find(c => c.name === form.category)?.subCategories.map(s =>
              <option key={s.name} value={s.name}>{s.name}</option>)}
          </select>
          {errors.subCategory && <span className={styles.error}>{errors.subCategory}</span>}
          <select value={form.childCategory} onChange={handleChildCategoryChange} disabled={!form.subCategory}>
            <option value="">Select Child Category</option>
            {categories.find(c => c.name === form.category)?.subCategories.find(s => s.name === form.subCategory)
              ?.childCategories.map(ch => <option key={ch} value={ch}>{ch}</option>)}
          </select>
          {errors.childCategory && <span className={styles.error}>{errors.childCategory}</span>}

          {/* Images */}
          <div className={styles.formGroup}>
            <label>Images</label>
            <input type="file" multiple onChange={handleImageChange} />
            {errors.images && <span className={styles.error}>{errors.images}</span>}
            <div className={styles.imagePreview}>
              {imagePreviews.map((src, i) => <img key={i} src={src} alt="preview" />)}
            </div>
          </div>

          {/* Specifications */}
          <div className={styles.formGroup}>
            <label>Specifications</label>
            {form.specifications.map((spec, idx) => (
              <div key={idx} className={styles.specRow}>
                <input placeholder="Label" value={spec.label} onChange={e => handleSpecChange(idx, "label", e.target.value)} />
                <input placeholder="Value" value={spec.value} onChange={e => handleSpecChange(idx, "value", e.target.value)} />
                <button type="button" onClick={() => removeSpecification(idx)}>❌</button>
              </div>
            ))}
            <button type="button" onClick={addSpecification}>➕ Add Specification</button>
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
      )}
    </div>
  );
};

const inp = {
  padding: "7px 10px", borderRadius: 8,
  border: "1px solid #e5e7eb", fontSize: 13,
  outline: "none", width: "100%", boxSizing: "border-box",
};

export default AddProduct;