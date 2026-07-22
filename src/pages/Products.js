// import React, { useState, useEffect } from "react";
// import { Link, useLocation } from "react-router-dom";
// import styles from "./Products.module.css";
// import { FaTags, FaRupeeSign, FaShoppingBag, FaSort, FaListUl, FaClock } from "react-icons/fa";


// function useQuery() {
//   return new URLSearchParams(useLocation().search);
// }

// const Products = () => {
//   const location = useLocation();
//   const query = useQuery();

//   const [products, setProducts] = useState([]);
//   const [filtered, setFiltered] = useState([]);

//   const [categories, setCategories] = useState([]);
//   const [category, setCategory] = useState("");
//   const [subCategory, setSubCategory] = useState("");
//   const [childCategory, setChildCategory] = useState("");

//   const [selectedPrice, setSelectedPrice] = useState("");
//   const [selectedBrand, setSelectedBrand] = useState("");
//   const [sortOption, setSortOption] = useState("");
//   const [newArrival, setNewArrival] = useState(false);

//   const [popupType, setPopupType] = useState("");

//   const priceRanges = [
//     { label: "Under ₹500", value: "0-500" },
//     { label: "₹500 - ₹1000", value: "500-1000" },
//     { label: "₹1000 - ₹2000", value: "1000-2000" },
//     { label: "Above ₹2000", value: "2000-above" },
//   ];

//   const sortOptions = [
//     { label: "Newest First", value: "newest" },
//     { label: "Price: Low to High", value: "price_asc" },
//     { label: "Price: High to Low", value: "price_desc" },
//   ];

//   const getImageUrl = (image) => {
//     if (!image) return "/images/default-placeholder.png";
//     if (image.startsWith("http")) return image;
//     return `http://localhost:5000${image}`;
//   };

//   // Fetch products
//  useEffect(() => {
//   fetch("http://localhost:5000/api/products/all")
//     .then((res) => res.json())
//     .then((data) => {
//       const normalized = (data.products || []).map((p) => ({
//         ...p,
//         subCategory: p.subCategory || p.subcategory || "",
//         childCategory: p.childCategory || p.childcategory || "",
//       }));
//       setProducts(normalized);
//     })
//     .catch((err) => console.error("Error loading products:", err));
// }, []);

//   // Fetch categories from backend
//   useEffect(() => {
//     const fetchCategories = async () => {
//       try {
//         const res = await fetch("http://localhost:5000/api/categories");
//         const data = await res.json();

//         if (Array.isArray(data.categories)) {
//           // Add "All" category at start
//           setCategories([{ name: "All", subCategories: [] }, ...data.categories]);
//         } else {
//           setCategories([{ name: "All", subCategories: [] }]);
//         }
//       } catch (err) {
//         console.error("Error fetching categories:", err);
//         setCategories([{ name: "All", subCategories: [] }]);
//       }
//     };
//     fetchCategories();
//   }, []);

//   // Sync state with URL query params
//   useEffect(() => {
//     const cat = query.get("category") || "";
//     const subCat = query.get("subcategory") || "";
//     const childCat = query.get("childcategory") || "";
    

//     setCategory(cat.replace(/-/g, " "));
//     setSubCategory(subCat.replace(/-/g, " "));
//     setChildCategory(childCat.replace(/-/g, " "));
//   }, [location.search]);

//   // Filter products based on category, price, brand, etc.
//   useEffect(() => {
//     let filteredList = [...products];

//     if (category && category !== "All")
//       filteredList = filteredList.filter(
//         (p) => p.category?.toLowerCase() === category.toLowerCase()
//       );

//     if (subCategory)
//       filteredList = filteredList.filter(
//         (p) => p.subCategory?.toLowerCase() === subCategory.toLowerCase()
//       );

//     if (childCategory)
//       filteredList = filteredList.filter(
//         (p) => p.childCategory?.toLowerCase() === childCategory.toLowerCase()
//       );

//     if (selectedPrice) {
//       const [min, max] = selectedPrice.split("-");
//       filteredList = filteredList.filter((p) =>
//         max === "above"
//           ? p.price > parseInt(min)
//           : p.price >= parseInt(min) && p.price <= parseInt(max)
//       );
//     }

//     if (selectedBrand)
//       filteredList = filteredList.filter(
//         (p) => p.brand?.toLowerCase() === selectedBrand.toLowerCase()
//       );

//     if (newArrival) filteredList = filteredList.filter((p) => p.isNewArrival);

//     if (sortOption === "price_asc")
//       filteredList.sort((a, b) => a.price - b.price);
//     if (sortOption === "price_desc")
//       filteredList.sort((a, b) => b.price - a.price);
//     if (sortOption === "newest")
//       filteredList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

//     setFiltered(filteredList);
//   }, [
//     category,
//     subCategory,
//     childCategory,
//     selectedPrice,
//     selectedBrand,
//     newArrival,
//     sortOption,
//     products,
//   ]);

//   const uniqueBrands = [...new Set(products.map((p) => p.brand && p.brand.trim()))].filter(Boolean);

//   return (
//     <div className={styles.products}>
//       <div className={styles.container}>
//         <h2 className={styles.pageTitle}>
//           {childCategory || subCategory || category || "All Products"}
//         </h2>

//         <div className={styles.topbar}>
//           {(category || subCategory) && (
//             <button
//               className={styles.circleButton}
//               onClick={() => {
//                 if (subCategory) {
//                   setSubCategory("");
//                   setChildCategory("");
//                 } else if (category) {
//                   setCategory("");
//                   setSubCategory("");
//                   setChildCategory("");
//                 }
//               }}
//             >
//               ← Back
//             </button>
//           )}

//           {/* MAIN CATEGORIES */}
//           {!category &&
//             categories.map((cat) => (
//               <button
//                 key={cat.name}
//                 className={`${styles.circleButton} ${category === cat.name ? styles.active : ""}`}
//                 onClick={() => {
//                   setCategory(cat.name);
//                   setSubCategory("");
//                   setChildCategory("");
//                 }}
//               >
//                 {cat.name}
//               </button>
//             ))}

//           {/* SUBCATEGORIES */}
//           {category &&
//             !subCategory &&
//             categories
//               .find((c) => c.name === category)
//               ?.subCategories?.map((sub) => (
//                 <button
//                   key={sub.name}
//                   className={`${styles.circleButton} ${subCategory === sub.name ? styles.active : ""}`}
//                   onClick={() => {
//                     setSubCategory(sub.name);
//                     setChildCategory("");
//                   }}
//                 >
//                   {sub.name}
//                 </button>
//               ))}

//           {/* CHILD CATEGORIES */}
//           {category &&
//             subCategory &&
//             categories
//               .find((c) => c.name === category)
//               ?.subCategories?.find((s) => s.name === subCategory)
//               ?.childCategories?.map((child) => (
//                 <button
//                   key={child}
//                   className={`${styles.circleButton} ${childCategory === child ? styles.active : ""}`}
//                   onClick={() => setChildCategory(child)}
//                 >
//                   {child}
//                 </button>
//               ))}

//           {/* STATIC FILTERS */}
//           <button className={styles.circleButton} onClick={() => setPopupType("price")}>
//             <FaRupeeSign /> Price
//           </button>
//           <button className={styles.circleButton} onClick={() => setPopupType("brand")}>
//             <FaShoppingBag /> Brand
//           </button>
//           <button className={styles.circleButton} onClick={() => setPopupType("sort")}>
//             <FaSort /> Sort
//           </button>
//           <button className={styles.circleButton} onClick={() => setPopupType("newArrival")}>
//             <FaClock /> New Arrivals
//           </button>
//         </div>

//         {/* POPUP FILTERS */}
//         {popupType && (
//           <div className={styles.popupOverlay} onClick={() => setPopupType("")}>
//             <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
//               <h3>Select {popupType}</h3>
//               <div className={styles.popupOptions}>
//                 {popupType === "price" &&
//                   priceRanges.map((range) => (
//                     <div
//                       key={range.value}
//                       onClick={() => {
//                         setSelectedPrice(range.value);
//                         setPopupType("");
//                       }}
//                     >
//                       {range.label}
//                     </div>
//                   ))}

//                 {popupType === "brand" &&
//                   uniqueBrands.map((brand) => (
//                     <div
//                       key={brand}
//                       onClick={() => {
//                         setSelectedBrand(brand);
//                         setPopupType("");
//                       }}
//                     >
//                       {brand}
//                     </div>
//                   ))}

//                 {popupType === "sort" &&
//                   sortOptions.map((option) => (
//                     <div
//                       key={option.value}
//                       onClick={() => {
//                         setSortOption(option.value);
//                         setPopupType("");
//                       }}
//                     >
//                       {option.label}
//                     </div>
//                   ))}

//                 {popupType === "newArrival" && (
//                   <>
//                     <div
//                       onClick={() => {
//                         setNewArrival(true);
//                         setPopupType("");
//                       }}
//                     >
//                       Show New Arrivals
//                     </div>
//                     <div
//                       onClick={() => {
//                         setNewArrival(false);
//                         setPopupType("");
//                       }}
//                     >
//                       Hide New Arrivals
//                     </div>
//                   </>
//                 )}
//               </div>
//               <button className={styles.closeBtn} onClick={() => setPopupType("")}>
//                 Close
//               </button>
//             </div>
//           </div>
//         )}

//         {/* PRODUCT GRID */}
//         <div className={styles.productGrid}>
//           {filtered.length > 0 ? (
//             filtered.map((product) => (
//               <div key={product._id} className={styles.productCard}>
//                 <Link to={`/products/${product._id}`}>
//                   <img src={getImageUrl(product.images?.[0])} alt={product.name} />
//                   <div className={styles.productInfo}>
//                     <h3>{product.name}</h3>
//                     <p className={styles.brand}>{product.brand}</p>
//                     <p className={styles.price}>₹{product.price}</p>
//                   </div>
//                 </Link>
//               </div>
//             ))
//           ) : (
//             <p style={{ marginTop: 40 }}>No products found.</p>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Products;


import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaRupeeSign, FaShoppingBag, FaSort, FaClock, FaHeart, FaShoppingCart, FaFilter, FaTimes } from "react-icons/fa";
import styles from "./Products.module.css";

const API_BASE = "http://localhost:5000";
const PLACEHOLDER = "/images/default-placeholder.png";

function useQuery() { return new URLSearchParams(useLocation().search); }

const getImageUrl = (img) => {
  if (!img) return PLACEHOLDER;
  return img.startsWith("http") ? img : `${API_BASE}${img}`;
};

// ── Variant Popup (same smart mapping as Home) ────────────────────────────────
const VariantPopup = ({ product, mode, onClose, onConfirm }) => {
  const [selSize,  setSelSize]  = useState("");
  const [selColor, setSelColor] = useState("");
  const variants = product?.variants || [];

  const isSizeCat = product?.category === "Clothing" ||
    (product?.category === "Handmade" && product?.subcategory === "Jewelry");

  const allSizes = [...new Set(variants.map(v => v.size).filter(Boolean))];

  const sizeToColors = {};
  const colorToSizes = {};
  for (const v of variants) {
    const s    = (v.size || "").trim();
    const name = (v.colorName || v.color || "").trim();
    const hex  = v.colorHex || v.color || name;
    const stk  = typeof v.stock === "object" ? parseInt(v.stock?.$numberInt || 0) : parseInt(v.stock || 0);
    if (s && name) {
      if (!sizeToColors[s]) sizeToColors[s] = [];
      if (!sizeToColors[s].find(c => c.name === name)) sizeToColors[s].push({ name, hex, stock: stk });
      if (!colorToSizes[name]) colorToSizes[name] = [];
      if (!colorToSizes[name].find(x => x.size === s)) colorToSizes[name].push({ size: s, stock: stk });
    }
  }

  const allColors = [];
  const seenC = new Set();
  for (const v of variants) {
    const name = (v.colorName || v.color || "").trim();
    const hex  = v.colorHex || v.color || name;
    if (name && !seenC.has(name)) { seenC.add(name); allColors.push({ name, hex }); }
  }

  const availableColors = selSize ? (sizeToColors[selSize] || []) : allColors;
  const availableSizes  = selColor ? (colorToSizes[selColor] || []).map(x => x.size) : allSizes;

  const matchedVariant = variants.find(v => {
    const sMatch = !isSizeCat || v.size === selSize;
    const cMatch = !selColor  || (v.colorName || v.color || "") === selColor;
    return sMatch && cMatch;
  });
  const stock = matchedVariant
    ? (typeof matchedVariant.stock === "object"
        ? parseInt(matchedVariant.stock?.$numberInt || 0)
        : parseInt(matchedVariant.stock || 0))
    : null;

  const disabled = isSizeCat
    ? (!selSize || !selColor || !matchedVariant)
    : (allColors.length > 0 && !selColor);

  const handleSizeClick  = (s) => {
    if (selSize === s) { setSelSize(""); return; }
    setSelSize(s);
    const colorsForSize = (sizeToColors[s] || []).map(c => c.name);
    if (selColor && !colorsForSize.includes(selColor)) setSelColor("");
  };
  const handleColorClick = (name) => {
    if (selColor === name) { setSelColor(""); return; }
    setSelColor(name);
    const sizesForColor = (colorToSizes[name] || []).map(x => x.size);
    if (selSize && !sizesForColor.includes(selSize)) setSelSize("");
  };

  return (
    <div className={styles.popupOverlayDark} onClick={onClose}>
      <div className={styles.variantModal} onClick={e => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose}>×</button>
        <div className={styles.modalProduct}>
          <img src={getImageUrl(product?.images?.[0])} alt={product?.name} />
          <div>
            <h4>{product?.name}</h4>
            <p className={styles.modalPrice}>
              ₹{product?.discount ? Math.round(product.price * (1 - product.discount / 100)) : product?.price}
              {product?.discount > 0 && <span className={styles.modalMrp}>₹{product?.price}</span>}
            </p>
          </div>
        </div>

        {isSizeCat && allSizes.length > 0 && (
          <div className={styles.modalSection}>
            <label>SIZE {selSize && <span>— {selSize}</span>}</label>
            <div className={styles.sizeGrid}>
              {allSizes.map(s => {
                const avail = availableSizes.includes(s);
                return (
                  <button key={s}
                    className={`${styles.sizeBtn} ${selSize === s ? styles.sizeBtnActive : ""} ${!avail ? styles.sizeBtnDisabled : ""}`}
                    onClick={() => avail && handleSizeClick(s)} disabled={!avail}>{s}</button>
                );
              })}
            </div>
          </div>
        )}

        {availableColors.length > 0 && (
          <div className={styles.modalSection}>
            <label>COLOR {selColor && <span>— {selColor}</span>}</label>
            <div className={styles.colorSwatches}>
              {(selSize ? availableColors : allColors).map(({ name, hex }) => {
                const avail = !selSize || !!availableColors.find(c => c.name === name);
                const bg = hex && hex.startsWith("#") ? hex : name;
                return (
                  <div key={name} className={styles.colorSwatchWrap}>
                    <button title={name}
                      className={`${styles.colorSwatch} ${selColor === name ? styles.colorSwatchActive : ""} ${!avail ? styles.colorSwatchDisabled : ""}`}
                      style={{ background: bg }}
                      onClick={() => handleColorClick(name)} disabled={!avail} />
                    <span className={styles.colorLabel}>{name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {(selSize || selColor) && (
          <div className={styles.stockIndicator}>
            {!matchedVariant ? <span className={styles.stockNA}>⚠️ Combination not available</span>
              : stock === 0 ? <span className={styles.stockOut}>❌ Out of stock</span>
              : stock <= 5 ? <span className={styles.stockLow}>🔥 Only {stock} left!</span>
              : <span className={styles.stockIn}>✅ In Stock</span>}
          </div>
        )}

        <button className={styles.modalConfirm}
          disabled={disabled || stock === 0}
          onClick={() => !disabled && stock !== 0 && onConfirm(product, selSize, selColor)}>
          {mode === "wishlist" ? "♥ Add to Wishlist" : "🛒 Add to Cart"}
        </button>
      </div>
    </div>
  );
};

// ── Product Card ──────────────────────────────────────────────────────────────
const ProductCard = ({ product, onCart, onWishlist }) => {
  const discounted = product.discount
    ? Math.round(product.price * (1 - product.discount / 100))
    : product.price;

  return (
    <div className={styles.productCard}>
      <Link to={`/products/${product._id}`} className={styles.cardLink}>
        <div className={styles.cardImgWrap}>
          <img src={getImageUrl(product.images?.[0])} alt={product.name} className={styles.cardImg} />
          {product.discount > 0 && <span className={styles.badge}>{product.discount}% OFF</span>}
        </div>
        <div className={styles.cardInfo}>
          <p className={styles.cardBrand}>{product.brand}</p>
          <h3 className={styles.cardName}>{product.name}</h3>
          <div className={styles.cardPricing}>
            <span className={styles.cardPrice}>₹{discounted}</span>
            {product.discount > 0 && <span className={styles.cardMrp}>₹{product.price}</span>}
          </div>
        </div>
      </Link>
      <div className={styles.cardActions}>
        <button className={styles.cartBtn} onClick={() => onCart(product)}>
          <FaShoppingCart /> Add to Cart
        </button>
        <button className={styles.wishBtn} onClick={() => onWishlist(product)} title="Wishlist">
          <FaHeart />
        </button>
      </div>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
const Products = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const query    = useQuery();

  const [products,      setProducts]      = useState([]);
  const [newArrivals,   setNewArrivals]   = useState([]);
  const [filtered,      setFiltered]      = useState([]);
  const [categories,    setCategories]    = useState([]);
  const [activeTab,     setActiveTab]     = useState("all"); // "all" | "new" | "trending"

  const [category,      setCategory]      = useState("");
  const [subCategory,   setSubCategory]   = useState("");
  const [childCategory, setChildCategory] = useState("");
  const [selectedPrice, setSelectedPrice] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [sortOption,    setSortOption]    = useState("");
  const [popupType,     setPopupType]     = useState("");

  const [popup,  setPopup]  = useState(null); // { product, mode }
  const [toast,  setToast]  = useState("");

  const customer = (() => { try { return JSON.parse(localStorage.getItem("customer")); } catch { return null; } })();

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  // ── Fetches ──
  useEffect(() => {
    fetch(`${API_BASE}/api/products/all`)
      .then(r => r.json())
      .then(d => {
        const normalized = (d.products || []).map(p => ({
          ...p,
          subCategory:   p.subCategory   || p.subcategory   || "",
          childCategory: p.childCategory || p.childcategory || "",
        }));
        setProducts(normalized);
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/products/new-arrivals`)
      .then(r => r.json())
      .then(d => setNewArrivals(Array.isArray(d) ? d : d.products || []))
      .catch(() => setNewArrivals([]));
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/api/categories`)
      .then(r => r.json())
      .then(d => {
        const cats = d.categories || [];
        setCategories([{ name: "All", subCategories: [] }, ...cats]);
      })
      .catch(() => setCategories([{ name: "All", subCategories: [] }]));
  }, []);

  // Sync URL params
  useEffect(() => {
    setCategory(     (query.get("category")     || "").replace(/-/g, " "));
    setSubCategory(  (query.get("subcategory")   || "").replace(/-/g, " "));
    setChildCategory((query.get("childcategory") || "").replace(/-/g, " "));
  }, [location.search]);

  // ── Filter logic ──
  useEffect(() => {
    let list = activeTab === "new"      ? [...newArrivals]
             : activeTab === "trending" ? [...products].sort(() => Math.random() - 0.5).slice(0, 20)
             : [...products];

    if (category && category !== "All")
      list = list.filter(p => p.category?.toLowerCase() === category.toLowerCase());
    if (subCategory)
      list = list.filter(p => p.subCategory?.toLowerCase() === subCategory.toLowerCase());
    if (childCategory)
      list = list.filter(p => p.childCategory?.toLowerCase() === childCategory.toLowerCase());

    if (selectedPrice) {
      const [min, max] = selectedPrice.split("-");
      list = list.filter(p =>
        max === "above" ? p.price > parseInt(min) : p.price >= parseInt(min) && p.price <= parseInt(max)
      );
    }
    if (selectedBrand)
      list = list.filter(p => p.brand?.toLowerCase() === selectedBrand.toLowerCase());

    if (sortOption === "price_asc")  list.sort((a, b) => a.price - b.price);
    if (sortOption === "price_desc") list.sort((a, b) => b.price - a.price);
    if (sortOption === "newest")
      list.sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));

    setFiltered(list);
  }, [category, subCategory, childCategory, selectedPrice, selectedBrand, sortOption, products, newArrivals, activeTab]);

  const uniqueBrands = [...new Set(products.map(p => p.brand?.trim()).filter(Boolean))];

  // ── Cart / Wishlist ──
  const addToCart = async (product, size, color) => {
    if (!customer) { navigate("/login"); return; }
    try {
      const res = await fetch(`${API_BASE}/customer/cart/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${customer.token}` },
        body: JSON.stringify({ customer_id: customer.id, product_id: product._id, size: size || "N/A", color: color || "N/A", quantity: 1 }),
      });
      const d = await res.json();
      showToast(d.message === "Added to cart" ? "✅ Added to Cart!" : `❌ ${d.error || "Failed"}`);
    } catch { showToast("❌ Error"); }
    setPopup(null);
  };

  const addToWishlist = async (product, size, color) => {
    if (!customer) { navigate("/login"); return; }
    try {
      const res = await fetch(`${API_BASE}/customer/wishlist/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${customer.token}` },
        body: JSON.stringify({ customer_id: customer.id, product_id: product._id, size: size || "N/A", color: color || "N/A" }),
      });
      const d = await res.json();
      showToast(d.message === "Added to wishlist" ? "❤️ Added to Wishlist!" : `❌ ${d.error || "Failed"}`);
    } catch { showToast("❌ Error"); }
    setPopup(null);
  };

  const handleCart     = (p) => setPopup({ product: p, mode: "cart" });
  const handleWishlist = (p) => setPopup({ product: p, mode: "wishlist" });
  const handleConfirm  = (p, size, color) =>
    popup?.mode === "wishlist" ? addToWishlist(p, size, color) : addToCart(p, size, color);

  const clearFilters = () => {
    setCategory(""); setSubCategory(""); setChildCategory("");
    setSelectedPrice(""); setSelectedBrand(""); setSortOption("");
    setActiveTab("all");
  };

  const hasFilters = category || subCategory || childCategory || selectedPrice || selectedBrand || sortOption;

  const priceRanges = [
    { label: "Under ₹500",       value: "0-500"      },
    { label: "₹500 - ₹1000",    value: "500-1000"   },
    { label: "₹1000 - ₹2000",   value: "1000-2000"  },
    { label: "Above ₹2000",      value: "2000-above" },
  ];
  const sortOptions = [
    { label: "Newest First",        value: "newest"     },
    { label: "Price: Low to High",  value: "price_asc"  },
    { label: "Price: High to Low",  value: "price_desc" },
  ];

  return (
    <div className={styles.products}>
      {toast && <div className={styles.toast}>{toast}</div>}
      {popup && (
        <VariantPopup product={popup.product} mode={popup.mode}
          onClose={() => setPopup(null)} onConfirm={handleConfirm} />
      )}

      <div className={styles.container}>
        {/* ── Page title ── */}
        <div className={styles.pageHeader}>
          <h2 className={styles.pageTitle}>
            {childCategory || subCategory || category || "All Products"}
          </h2>
          <span className={styles.resultCount}>{filtered.length} products</span>
        </div>

        {/* ── Tabs: All / New Arrivals / Trending ── */}
        <div className={styles.tabRow}>
          {[
            { key: "all",      label: "All" },
            { key: "new",      label: "🆕 New Arrivals" },
            { key: "trending", label: "🔥 Trending" },
          ].map(t => (
            <button key={t.key}
              className={`${styles.tab} ${activeTab === t.key ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Filter bar ── */}
        <div className={styles.filterBar}>
          {/* Back button */}
          {(category || subCategory) && (
            <button className={styles.filterChip} onClick={() => {
              if (subCategory) { setSubCategory(""); setChildCategory(""); }
              else { setCategory(""); setSubCategory(""); setChildCategory(""); }
            }}>← Back</button>
          )}

          {/* Categories */}
          {!category && categories.map(cat => (
            <button key={cat.name}
              className={`${styles.filterChip} ${category === cat.name ? styles.filterChipActive : ""}`}
              onClick={() => { setCategory(cat.name === "All" ? "" : cat.name); setSubCategory(""); setChildCategory(""); }}>
              {cat.name}
            </button>
          ))}

          {/* Subcategories */}
          {category && !subCategory &&
            categories.find(c => c.name === category)?.subCategories?.map(sub => (
              <button key={sub.name}
                className={`${styles.filterChip} ${subCategory === sub.name ? styles.filterChipActive : ""}`}
                onClick={() => { setSubCategory(sub.name); setChildCategory(""); }}>
                {sub.name}
              </button>
            ))}

          {/* Child categories */}
          {category && subCategory &&
            categories.find(c => c.name === category)?.subCategories
              ?.find(s => s.name === subCategory)?.childCategories?.map(child => (
                <button key={child}
                  className={`${styles.filterChip} ${childCategory === child ? styles.filterChipActive : ""}`}
                  onClick={() => setChildCategory(child)}>
                  {child}
                </button>
              ))}

          <div className={styles.filterDivider} />

          {/* Filter buttons */}
          <button className={`${styles.filterChip} ${selectedPrice ? styles.filterChipActive : ""}`}
            onClick={() => setPopupType("price")}>
            <FaRupeeSign /> Price {selectedPrice && "✓"}
          </button>
          <button className={`${styles.filterChip} ${selectedBrand ? styles.filterChipActive : ""}`}
            onClick={() => setPopupType("brand")}>
            <FaShoppingBag /> Brand {selectedBrand && `(${selectedBrand})`}
          </button>
          <button className={`${styles.filterChip} ${sortOption ? styles.filterChipActive : ""}`}
            onClick={() => setPopupType("sort")}>
            <FaSort /> Sort {sortOption && "✓"}
          </button>

          {/* Clear filters */}
          {hasFilters && (
            <button className={styles.clearBtn} onClick={clearFilters}>
              <FaTimes /> Clear
            </button>
          )}
        </div>

        {/* ── Filter Popup ── */}
        {popupType && (
          <div className={styles.filterOverlay} onClick={() => setPopupType("")}>
            <div className={styles.filterPopup} onClick={e => e.stopPropagation()}>
              <div className={styles.filterPopupHeader}>
                <h3>{popupType === "price" ? "Price Range" : popupType === "brand" ? "Brand" : "Sort By"}</h3>
                <button onClick={() => setPopupType("")}><FaTimes /></button>
              </div>
              <div className={styles.filterOptions}>
                {popupType === "price" && priceRanges.map(r => (
                  <div key={r.value}
                    className={`${styles.filterOption} ${selectedPrice === r.value ? styles.filterOptionActive : ""}`}
                    onClick={() => { setSelectedPrice(r.value); setPopupType(""); }}>
                    {r.label}
                  </div>
                ))}
                {popupType === "brand" && uniqueBrands.map(b => (
                  <div key={b}
                    className={`${styles.filterOption} ${selectedBrand === b ? styles.filterOptionActive : ""}`}
                    onClick={() => { setSelectedBrand(b); setPopupType(""); }}>
                    {b}
                  </div>
                ))}
                {popupType === "sort" && sortOptions.map(o => (
                  <div key={o.value}
                    className={`${styles.filterOption} ${sortOption === o.value ? styles.filterOptionActive : ""}`}
                    onClick={() => { setSortOption(o.value); setPopupType(""); }}>
                    {o.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Product Grid ── */}
        {filtered.length > 0 ? (
          <div className={styles.productGrid}>
            {filtered.map(p => (
              <ProductCard key={p._id} product={p} onCart={handleCart} onWishlist={handleWishlist} />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <p>No products found.</p>
            {hasFilters && <button className={styles.clearBtn} onClick={clearFilters}>Clear Filters</button>}
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;