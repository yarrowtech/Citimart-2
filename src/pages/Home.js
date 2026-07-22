// // src/pages/Home.js
// import React, { useEffect, useRef, useState } from "react";
// import { Link } from "react-router-dom";
// import { FaHeart, FaChevronLeft, FaChevronRight } from "react-icons/fa";
// import styles from "./Home.module.css";

// const API_BASE = "http://localhost:5000";
// const PLACEHOLDER_IMG = "https://via.placeholder.com/500x500?text=Image+Unavailable";

// // Static fallback data
// const STATIC_HOME = {
//   heroBanners: [
//     "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=1600&auto=format",
//     "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1600&auto=format",
//     "https://images.unsplash.com/photo-1544717302-de2939b7ef71?q=80&w=1600&auto=format",
//   ],
//   categories: [
//     { name: "Clothing" },
//     { name: "Accessories" },
//     { name: "Home Decor" },
//   ],
//   trendingNow: [
//     {
//       id: 201,
//       name: "Floral Dress",
//       price: 899,
//       img: "https://images.unsplash.com/photo-1514996937319-344454492b37",
//     },
//   ],
//   featuredProducts: [
//     {
//       id: 101,
//       name: "Printed T-Shirt",
//       price: 599,
//       rating: 4.5,
//       img: "https://images.unsplash.com/photo-1520975860004-2c1d0d4b8a26",
//     },
//   ],
//   brands: [
//     {
//       name: "Nike",
//       image: "https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg",
//     },
//     {
//       name: "Adidas",
//       image: "https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg",
//     },
//     {
//       name: "Puma",
//       image: "https://upload.wikimedia.org/wikipedia/en/f/fd/Puma_logo.svg",
//     },
//   ],
//   reviews: [
//     {
//       name: "Priya",
//       text: "Great!",
//       image: "https://randomuser.me/api/portraits/women/44.jpg",
//     },
//   ],
// };

// const Home = () => {
//   const [homeData, setHomeData] = useState(null);
//   const [offers, setOffers] = useState([]);
//   const [newArrivals, setNewArrivals] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [index, setIndex] = useState(0);
//   const autoplayRef = useRef(null);
//   const AUTOPLAY_MS = 4000;

//   // Fetch homepage config
//   useEffect(() => {
//   const loadHomepage = async () => {
//     try {
//       const res = await fetch(`${API_BASE}/api/homepage?_=${Date.now()}`); // 👈 cache-busting param
//       const data = await res.json();
//       console.log("🏠 Homepage data fetched:", data);
//       setHomeData(data || STATIC_HOME);
//     } catch (err) {
//       console.error("❌ Error loading homepage:", err);
//       setHomeData(STATIC_HOME);
//     }
//   };

//   loadHomepage();
// }, []);


//   // Fetch offers
//  // Fetch offers (show only eligible ones if logged in)
// useEffect(() => {
//   const fetchOffers = async () => {
//     const token = localStorage.getItem("token");
//     try {
//       const endpoint = token
//         ? `${API_BASE}/api/offers/eligible` // for logged-in users
//         : `${API_BASE}/api/offers`; // for public users (only "all" offers)
        
//       const res = await fetch(endpoint, {
//         headers: token ? { Authorization: `Bearer ${token}` } : {},
//       });

//       const data = await res.json();
//       setOffers(Array.isArray(data) ? data : data.offers || []);
//     } catch (err) {
//       console.error("❌ Error fetching offers:", err);
//       setOffers([]);
//     }
//   };

//   fetchOffers();
// }, []);


//   // Fetch categories
//   useEffect(() => {
//     fetch(`${API_BASE}/api/categories`)
//       .then((r) => r.json())
//       .then((d) => setCategories(d.categories || d || []))
//       .catch(() => setCategories([]));
//   }, []);

//   // // Fetch new arrivals

//  useEffect(() => {
//   fetch(`${API_BASE}/products/new-arrivals`)
//     .then((r) => r.json())
//     .then((data) => {
//       setNewArrivals(Array.isArray(data) ? data : []);
//     })
//     .catch((err) => {
//       console.error(err);
//       setNewArrivals([]);
//     });
// }, []);
//   // Hero banners setup
//   const banners =
//     (homeData && homeData.heroBanners?.length > 0
//       ? homeData.heroBanners
//       : STATIC_HOME.heroBanners) || [];

//   // Carousel autoplay
//   useEffect(() => {
//     if (banners.length > 1) {
//       autoplayRef.current = setInterval(
//         () => setIndex((prev) => (prev + 1) % banners.length),
//         AUTOPLAY_MS
//       );
//     }
//     return () => clearInterval(autoplayRef.current);
//   }, [banners.length]);

//   // Manual controls
//   const prev = () => setIndex((i) => (i - 1 + banners.length) % banners.length);
//   const next = () => setIndex((i) => (i + 1) % banners.length);

//   const safeImg = (url) => (url ? url : PLACEHOLDER_IMG);

//   return (
//     <div className={styles.home}>
//       {/* 🏠 HERO BANNER (carousel) */}
//       <section className={styles.heroBanner}>
//         {banners.length > 0 ? (
//           <>
//             <div className={styles.carouselInner}>
//               {banners.map((url, i) => (
//                 <div
//                   key={i}
//                   className={`${styles.carouselSlide} ${i === index ? styles.active : ""}`}
//                   style={{
//                     backgroundImage: `url(${safeImg(url)})`,
//                     opacity: i === index ? 1 : 0,
//                     transition: "opacity 0.8s ease-in-out",
//                   }}
//                 />
//               ))}
//             </div>
//             {banners.length > 1 && (
//               <>
//                 <button className={`${styles.carouselNav} ${styles.left}`} onClick={prev}>
//                   <FaChevronLeft />
//                 </button>
//                 <button className={`${styles.carouselNav} ${styles.right}`} onClick={next}>
//                   <FaChevronRight />
//                 </button>
//               </>
//             )}
//           </>
//         ) : (
//           <div className={styles.fallbackBanner}>
//             <h2>
//               Welcome to{" "}
//               <span className={styles.brandName}>
//                 <span style={{ color: "#ff0000ff" }}>Citi</span>
//                 <span style={{ color: "#2f00ffff" }}>Mart</span>
//               </span>
//             </h2>
//             <p>Shop the latest fashion trends at the best prices!</p>
//           </div>
//         )}

//         {/* Hero Text Overlay */}
//         <div className={styles.heroContent}>
//           <h1>
//             Welcome to{" "}
//             <span className={styles.brandName}>
//               <span style={{ color: "#ff0000ff" }}>Citi</span>
//               <span style={{ color: "#2f00ffff" }}>Mart</span>
//             </span>
//           </h1>
//           <p>Shop the latest fashion trends at the best prices!</p>
//           <div className={styles.heroButtons}>
//             <Link to="/products" className={styles.shopBtn}>
//               Shop Now
//             </Link>
//             <Link to="/offers" className={styles.offerBtn}>
//               View Offers
//             </Link>
//           </div>
//         </div>
//       </section>

//       {/* 💥 OFFERS */}
//       {offers.length > 0 && (
//         <section className={styles.offers}>
//           <h2>💥 Exclusive Offers</h2>
//           <div className={styles.offerGrid}>
//             {offers.map((offer, i) => (
//               <Link key={offer._id || i} to={`/offers/${offer._id}`} className={styles.offerCard}>
//                 <img src={safeImg(offer.image)} alt={offer.title} />
//                 <div className={styles.offerText}>
//                   <h3>{offer.title}</h3>
//                   <p>{offer.description}</p>
//                 </div>
//               </Link>
//             ))}
//           </div>
//         </section>
//       )}

//       {/* 🆕 NEW ARRIVALS */}
//       {newArrivals.length > 0 && (
//         <section className={styles.newArrivals}>
//           <h2>🆕 New Arrivals</h2>
//           <div className={styles.carouselContainerHorizontal}>
//             {newArrivals.map((p, i) => (
//               <div key={p._id || i} className={styles.arrivalCard}>
//                 <img src={safeImg(p.images?.[0])} alt={p.name} />
//                 <h3>{p.name}</h3>
//                 <p>₹{p.price}</p>
//                 <div className={styles.productActions}>
//                   <button className={styles.addCartBtn}>Add to Cart</button>
//                   <FaHeart
//                     className={styles.wishlistIcon}
//                     onClick={() => alert(`${p.name} added to wishlist ❤️`)}
//                   />
//                 </div>
//               </div>
//             ))}
//           </div>
//         </section>
//       )}

// {/* 🛍️ SHOP BY CATEGORY */}
// {homeData?.categories?.length > 0 && (
//   <section className={styles.categories}>
//     <h2>🛍️ Shop by Category</h2>
//     <div className={styles.categoryGrid}>
//       {homeData.categories.map((cat, i) => (
//         <Link
//           key={i}
//           to={`/products?category=${encodeURIComponent(cat.name)}`}
//           className={styles.categoryCard}
//         >
//           <img src={cat.image || PLACEHOLDER_IMG} alt={cat.name} />
//           <h3>{cat.name}</h3>
//         </Link>
//       ))}
//     </div>
//   </section>
// )}



//      {/* 🔥 TRENDING NOW */}
// <section className={styles.trendingNow}>
//   <h2>Trending Now 🔥</h2>
//   <div className={styles.trendingSlider}>
//     {(homeData?.trendingNow || STATIC_HOME.trendingNow).map((item, i) => (
//       <Link
//         key={item._id || item.id || i}
//         to={`/products/${item._id || item.id}`}  // 👈 match your route
//         className={styles.trendingCard}
//       >
//         <img src={safeImg(item.img || item.image)} alt={item.name} />
//         <p>{item.name}</p>
//         <span>₹{item.price}</span>
//       </Link>
//     ))}
//   </div>
// </section>


//      {/* 🏷️ BRANDS */}
// <section className={styles.brands}>
//   <h2>🔥 Trending Brands</h2>
//   <div className={styles.brandSlider}>
//     {(homeData?.brands || STATIC_HOME.brands).map((b, i) => (
//       <Link
//         key={i}
//         to={`/products?brand=${encodeURIComponent(b.name)}`}  // ✅ link to products filtered by brand
//         className={styles.brandCard}
//       >
//         <img src={safeImg(b.image || b.img)} alt={b.name} />
//         <p>{b.name}</p>
//       </Link>
//     ))}
//   </div>
// </section>


//    {/* ⭐ FEATURED */}
// <section className={styles.featured}>
//   <h2>⭐ Featured Products</h2>
//   <div className={styles.productGrid}>
//     {(homeData?.featuredProducts || STATIC_HOME.featuredProducts).map((p, i) => (
//       <Link
//         key={p._id || i}
//         to={`/products/${p._id}`}  // ✅ Go to Product Detail Page
//         className={styles.productCard}
//       >
//         <img src={safeImg(p.img || p.image)} alt={p.name} />
//         <div className={styles.cardBody}>
//           <h3>{p.name}</h3>
//           <p className={styles.price}>₹{p.price}</p>
//           {p.discount && (
//             <p className={styles.discount}>-{p.discount}% OFF</p>
//           )}
//           {p.rating && (
//             <p className={styles.rating}>⭐ {p.rating}</p>
//           )}
//         </div>
//       </Link>
//     ))}
//   </div>
// </section>




//       {/* 💬 REVIEWS */}
//       <section className={styles.reviews}>
//         <h2>💬 What Our Customers Say</h2>
//         <div className={styles.reviewSlider}>
//           {(homeData?.reviews || STATIC_HOME.reviews).map((r, i) => (
//             <div key={i} className={styles.reviewCard}>
//               <img src={safeImg(r.image || r.img)} alt={r.name} />
//               <p>"{r.text}"</p>
//               <h4>- {r.name}</h4>
//             </div>
//           ))}
//         </div>
//       </section>
//     </div>
//   );
// };

// export default Home;

// import React, { useEffect, useRef, useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { FaHeart, FaShoppingCart, FaChevronLeft, FaChevronRight, FaStar, FaTag } from "react-icons/fa";
// import styles from "./Home.module.css";

// const API_BASE = "http://localhost:5000";
// const PLACEHOLDER_IMG = "https://via.placeholder.com/500x500?text=No+Image";

// const STATIC_HOME = {
//   heroBanners: [
//     "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=1600&auto=format",
//     "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1600&auto=format",
//     "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1600&auto=format",
//   ],
//   trendingNow: [],
//   featuredProducts: [],
//   brands: [
//     { name: "Nike",   image: "https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg" },
//     { name: "Adidas", image: "https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg" },
//     { name: "Puma",   image: "https://upload.wikimedia.org/wikipedia/en/f/fd/Puma_logo.svg" },
//   ],
//   reviews: [
//     { name: "Priya S.",  text: "Amazing quality! The fabric feels premium and stitching is perfect.", rating: 5, image: "https://randomuser.me/api/portraits/women/44.jpg" },
//     { name: "Rahul M.",  text: "Fast delivery and exactly as described. Will buy again!",             rating: 5, image: "https://randomuser.me/api/portraits/men/32.jpg" },
//     { name: "Ananya K.", text: "Great prices and genuine products. Highly recommended.",              rating: 4, image: "https://randomuser.me/api/portraits/women/68.jpg" },
//   ],
// };

// const HERO_SLIDES = [
//   { tag: "New Season", headline: "Style That Speaks", sub: "Fresh arrivals for every occasion" },
//   { tag: "Best Sellers", headline: "Loved by Thousands", sub: "Shop what everyone's wearing" },
//   { tag: "Exclusive Deals", headline: "Up to 50% Off", sub: "Limited time offers on top brands" },
// ];

// const safeImg = (url) => (url && url.startsWith("http") ? url : url ? `${API_BASE}/${url}` : PLACEHOLDER_IMG);

// // ── Product Card ─────────────────────────────────────────────────────────────
// const ProductCard = ({ product, onAddToCart, onWishlist }) => {
//   const discountedPrice = product.discount
//     ? Math.round(product.price * (1 - product.discount / 100))
//     : product.price;

//   return (
//     <div className={styles.productCard}>
//       <Link to={`/products/${product._id}`} className={styles.cardLink}>
//         <div className={styles.cardImageWrap}>
//           <img src={safeImg(product.images?.[0])} alt={product.name} className={styles.cardImg} />
//           {product.discount > 0 && (
//             <span className={styles.discountBadge}>{product.discount}% OFF</span>
//           )}
//         </div>
//         <div className={styles.cardBody}>
//           <p className={styles.cardBrand}>{product.brand}</p>
//           <h3 className={styles.cardName}>{product.name}</h3>
//           <div className={styles.cardPricing}>
//             <span className={styles.cardPrice}>₹{discountedPrice}</span>
//             {product.discount > 0 && (
//               <span className={styles.cardMrp}>₹{product.price}</span>
//             )}
//           </div>
//         </div>
//       </Link>
//       <div className={styles.cardActions}>
//         <button className={styles.cartActionBtn}
//           onClick={() => onAddToCart(product)}>
//           <FaShoppingCart /> Add to Cart
//         </button>
//         <button className={styles.wishlistActionBtn}
//           onClick={() => onWishlist(product)}>
//           <FaHeart />
//         </button>
//       </div>
//     </div>
//   );
// };

// // ── Variant Popup ─────────────────────────────────────────────────────────────
// const VariantPopup = ({ product, mode, onClose, onConfirm }) => {
//   const [selSize,  setSelSize]  = useState("");
//   const [selColor, setSelColor] = useState("");

//   const isSizeCat = product?.category === "Clothing" ||
//     (product?.category === "Handmade" && product?.subcategory === "Jewelry");

//   const sizes  = [...new Set((product?.variants || []).map(v => v.size).filter(Boolean))];
//   const colors = [];
//   const seenC  = new Set();
//   for (const v of product?.variants || []) {
//     const name = (v.colorName || v.color || "").trim();
//     if (name && !seenC.has(name)) { seenC.add(name); colors.push({ name, hex: v.colorHex || v.color || name }); }
//   }

//   const disabled = isSizeCat ? (!selSize || !selColor) : (colors.length > 0 && !selColor);

//   return (
//     <div className={styles.popupOverlayDark} onClick={onClose}>
//       <div className={styles.variantModal} onClick={e => e.stopPropagation()}>
//         <button className={styles.modalClose} onClick={onClose}>×</button>
//         <div className={styles.modalProduct}>
//           <img src={safeImg(product?.images?.[0])} alt={product?.name} />
//           <div>
//             <h4>{product?.name}</h4>
//             <p>₹{product?.price}</p>
//           </div>
//         </div>

//         {isSizeCat && sizes.length > 0 && (
//           <div className={styles.modalSection}>
//             <label>Select Size</label>
//             <div className={styles.sizeGrid}>
//               {sizes.map(s => (
//                 <button key={s} className={`${styles.sizeBtn} ${selSize === s ? styles.sizeBtnActive : ""}`}
//                   onClick={() => setSelSize(s)}>{s}</button>
//               ))}
//             </div>
//           </div>
//         )}

//         {colors.length > 0 && (
//           <div className={styles.modalSection}>
//             <label>Select Color {selColor && <span>— {selColor}</span>}</label>
//             <div className={styles.colorSwatches}>
//               {colors.map(({ name, hex }) => (
//                 <button key={name} title={name}
//                   className={`${styles.colorSwatch} ${selColor === name ? styles.colorSwatchActive : ""}`}
//                   style={{ background: hex.startsWith("#") ? hex : name }}
//                   onClick={() => setSelColor(name)} />
//               ))}
//             </div>
//           </div>
//         )}

//         <button className={styles.modalConfirm} disabled={disabled}
//           onClick={() => !disabled && onConfirm(product, selSize, selColor)}>
//           {mode === "wishlist" ? "♥ Add to Wishlist" : "🛒 Add to Cart"}
//         </button>
//       </div>
//     </div>
//   );
// };

// // ── Main Component ────────────────────────────────────────────────────────────
// const Home = () => {
//   const navigate   = useNavigate();
//   const [homeData,     setHomeData]     = useState(null);
//   const [offers,       setOffers]       = useState([]);
//   const [newArrivals,  setNewArrivals]  = useState([]);
//   const [categories,   setCategories]   = useState([]);
//   const [index,        setIndex]        = useState(0);
//   const [popup,        setPopup]        = useState(null); // { product, mode }
//   const [toast,        setToast]        = useState("");
//   const autoplayRef = useRef(null);
//   const AUTOPLAY_MS = 5000;

//   const customer = (() => { try { return JSON.parse(localStorage.getItem("customer")); } catch { return null; } })();
//   const token    = localStorage.getItem("token");

//   // ── Fetches ──
//   useEffect(() => {
//     fetch(`${API_BASE}/api/homepage?_=${Date.now()}`)
//       .then(r => r.json()).then(d => setHomeData(d || STATIC_HOME))
//       .catch(() => setHomeData(STATIC_HOME));
//   }, []);

//   useEffect(() => {
//     const ep = token ? `${API_BASE}/api/offers/eligible` : `${API_BASE}/api/offers`;
//     fetch(ep, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
//       .then(r => r.json()).then(d => setOffers(Array.isArray(d) ? d : d.offers || []))
//       .catch(() => setOffers([]));
//   }, []);

//   useEffect(() => {
//     fetch(`${API_BASE}/api/categories`)
//       .then(r => r.json()).then(d => setCategories(d.categories || []))
//       .catch(() => setCategories([]));
//   }, []);

//  useEffect(() => {
//   fetch(`${API_BASE}/products/new-arrivals`)
//     .then(r => r.json())
//     .then(d => {
//       console.log("NEW ARRIVALS RESPONSE:", d); // ← add this
//       setNewArrivals(Array.isArray(d) ? d : d.products || []);
//     })
//     .catch(err => {
//       console.error("NEW ARRIVALS ERROR:", err);
//       setNewArrivals([]);
//     });
// }, []);

//   // ── Hero autoplay ──
//   const banners = homeData?.heroBanners?.length ? homeData.heroBanners : STATIC_HOME.heroBanners;
//   useEffect(() => {
//     autoplayRef.current = setInterval(() => setIndex(p => (p + 1) % banners.length), AUTOPLAY_MS);
//     return () => clearInterval(autoplayRef.current);
//   }, [banners.length]);

//   const prev = () => setIndex(i => (i - 1 + banners.length) % banners.length);
//   const next = () => setIndex(i => (i + 1) % banners.length);

//   // ── Toast ──
//   const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

//   // ── Cart / Wishlist ──
//   const requireLogin = () => { navigate("/login"); return false; };

//   const addToCart = async (product, size, color) => {
//     if (!customer) return requireLogin();
//     try {
//       const res = await fetch(`${API_BASE}/customer/cart/add`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json", Authorization: `Bearer ${customer.token}` },
//         body: JSON.stringify({ customer_id: customer.id, product_id: product._id, size: size || "N/A", color: color || "N/A", quantity: 1 }),
//       });
//       const data = await res.json();
//       if (data.message === "Added to cart") showToast("✅ Added to Cart!");
//       else showToast(`❌ ${data.error || "Failed"}`);
//     } catch { showToast("❌ Error adding to cart"); }
//     setPopup(null);
//   };

//   const addToWishlist = async (product, size, color) => {
//     if (!customer) return requireLogin();
//     try {
//       const res = await fetch(`${API_BASE}/customer/wishlist/add`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json", Authorization: `Bearer ${customer.token}` },
//         body: JSON.stringify({ customer_id: customer.id, product_id: product._id, size: size || "N/A", color: color || "N/A" }),
//       });
//       const data = await res.json();
//       if (data.message === "Added to wishlist") showToast("❤️ Added to Wishlist!");
//       else showToast(`❌ ${data.error || "Failed"}`);
//     } catch { showToast("❌ Error"); }
//     setPopup(null);
//   };

//   const handleAddToCart   = (product) => setPopup({ product, mode: "cart" });
//   const handleWishlist    = (product) => setPopup({ product, mode: "wishlist" });
//   const handlePopupConfirm = (product, size, color) =>
//     popup?.mode === "wishlist" ? addToWishlist(product, size, color) : addToCart(product, size, color);

//   const trending  = homeData?.trendingNow     || [];
//   const featured  = homeData?.featuredProducts || [];
//   const brands    = homeData?.brands           || STATIC_HOME.brands;
//   const reviews   = homeData?.reviews          || STATIC_HOME.reviews;
//   const slide     = HERO_SLIDES[index % HERO_SLIDES.length];

//   return (
//     <div className={styles.home}>

//       {/* ── TOAST ── */}
//       {toast && <div className={styles.toast}>{toast}</div>}

//       {/* ── POPUP ── */}
//       {popup && (
//         <VariantPopup
//           product={popup.product}
//           mode={popup.mode}
//           onClose={() => setPopup(null)}
//           onConfirm={handlePopupConfirm}
//         />
//       )}

//       {/* ════════════════════════════════════════
//           HERO BANNER
//       ════════════════════════════════════════ */}
//       <section className={styles.hero}>
//         <div className={styles.heroSlides}>
//           {banners.map((url, i) => (
//             <div key={i} className={`${styles.heroSlide} ${i === index ? styles.heroSlideActive : ""}`}
//               style={{ backgroundImage: `url(${url})` }} />
//           ))}
//         </div>
//         <div className={styles.heroGradient} />
//         <div className={styles.heroContent}>
//           <span className={styles.heroTag}>{slide.tag}</span>
//           <h1 className={styles.heroHeadline}>{slide.headline}</h1>
//           <p className={styles.heroSub}>{slide.sub}</p>
//           <div className={styles.heroBtns}>
//             <Link to="/products" className={styles.heroBtnPrimary}>Shop Now</Link>
//             <Link to="/offers"   className={styles.heroBtnSecondary}>View Offers</Link>
//           </div>
//         </div>
//         <button className={`${styles.heroNav} ${styles.heroNavLeft}`}  onClick={prev}><FaChevronLeft /></button>
//         <button className={`${styles.heroNav} ${styles.heroNavRight}`} onClick={next}><FaChevronRight /></button>
//         <div className={styles.heroDots}>
//           {banners.map((_, i) => (
//             <button key={i} className={`${styles.heroDot} ${i === index ? styles.heroDotActive : ""}`}
//               onClick={() => setIndex(i)} />
//           ))}
//         </div>
//       </section>

//       {/* ════════════════════════════════════════
//           TRUST STRIP
//       ════════════════════════════════════════ */}
//       <section className={styles.trustStrip}>
//         {[
//           { icon: "🚚", title: "Free Delivery",   sub: "On orders above ₹500" },
//           { icon: "🔒", title: "Secure Payments", sub: "100% safe & encrypted" },
//           { icon: "🎧", title: "24/7 Support",    sub: "We're always here" },
//           { icon: <FaTag />, title: "Best Prices", sub: "Guaranteed lowest" },
//         ].map((t, i) => (
//           <div key={i} className={styles.trustItem}>
//             <span className={styles.trustIcon}>{t.icon}</span>
//             <div>
//               <strong>{t.title}</strong>
//               <p>{t.sub}</p>
//             </div>
//           </div>
//         ))}
//       </section>

//       {/* ════════════════════════════════════════
//           OFFERS BANNER STRIP
//       ════════════════════════════════════════ */}
//       {offers.length > 0 && (
//         <section className={styles.section}>
//           <div className={styles.sectionHeader}>
//             <h2 className={styles.sectionTitle}>💥 Exclusive Offers</h2>
//             <Link to="/offers" className={styles.seeAll}>See All →</Link>
//           </div>
//           <div className={styles.offerStrip}>
//             {offers.slice(0, 4).map((offer, i) => (
//               <Link key={offer._id || i} to={`/offers/${offer._id}`} className={styles.offerCard}>
//                 <img src={safeImg(offer.image)} alt={offer.title} />
//                 <div className={styles.offerOverlay}>
//                   <h3>{offer.title}</h3>
//                   <p>{offer.description}</p>
//                   <span>Grab Now →</span>
//                 </div>
//               </Link>
//             ))}
//           </div>
//         </section>
//       )}

//       {/* ════════════════════════════════════════
//           SHOP BY CATEGORY
//       ════════════════════════════════════════ */}
//       {(homeData?.categories?.length > 0 || categories.length > 0) && (
//         <section className={styles.section}>
//           <div className={styles.sectionHeader}>
//             <h2 className={styles.sectionTitle}>🛍️ Shop by Category</h2>
//             <Link to="/products" className={styles.seeAll}>All Categories →</Link>
//           </div>
//           <div className={styles.categoryRow}>
//             {(homeData?.categories || categories).slice(0, 8).map((cat, i) => (
//               <Link key={i} to={`/products?category=${encodeURIComponent(cat.name)}`}
//                 className={styles.categoryPill}>
//                 {cat.image && <img src={safeImg(cat.image)} alt={cat.name} />}
//                 <span>{cat.name}</span>
//               </Link>
//             ))}
//           </div>
//         </section>
//       )}

//       {/* ════════════════════════════════════════
//           NEW ARRIVALS
//       ════════════════════════════════════════ */}
//       {newArrivals.length > 0 && (
//         <section className={styles.section}>
//           <div className={styles.sectionHeader}>
//             <h2 className={styles.sectionTitle}>🆕 New Arrivals</h2>
//             <Link to="/products" className={styles.seeAll}>View All →</Link>
//           </div>
//           <div className={styles.productRow}>
//             {newArrivals.map((p, i) => (
//               <ProductCard key={p._id || i} product={p}
//                 onAddToCart={handleAddToCart} onWishlist={handleWishlist} />
//             ))}
//           </div>
//         </section>
//       )}

//       {/* ════════════════════════════════════════
//           TRENDING NOW
//       ════════════════════════════════════════ */}
//       {trending.length > 0 && (
//         <section className={`${styles.section} ${styles.sectionDark}`}>
//           <div className={styles.sectionHeader}>
//             <h2 className={styles.sectionTitle} style={{ color: "#fff" }}>
//               🔥 Trending Now
//             </h2>
//             <Link to="/products" className={styles.seeAllLight}>View All →</Link>
//           </div>
//           <div className={styles.productRow}>
//             {trending.map((item, i) => (
//               <ProductCard key={item._id || i}
//                 product={{ ...item, images: [item.img || item.image], _id: item._id || item.id }}
//                 onAddToCart={handleAddToCart} onWishlist={handleWishlist} />
//             ))}
//           </div>
//         </section>
//       )}

//       {/* ════════════════════════════════════════
//           FEATURED PRODUCTS
//       ════════════════════════════════════════ */}
//       {featured.length > 0 && (
//         <section className={styles.section}>
//           <div className={styles.sectionHeader}>
//             <h2 className={styles.sectionTitle}>⭐ Featured Products</h2>
//             <Link to="/products" className={styles.seeAll}>View All →</Link>
//           </div>
//           <div className={styles.productGrid4}>
//             {featured.map((p, i) => (
//               <ProductCard key={p._id || i}
//                 product={{ ...p, images: [p.img || p.image] }}
//                 onAddToCart={handleAddToCart} onWishlist={handleWishlist} />
//             ))}
//           </div>
//         </section>
//       )}

//       {/* ════════════════════════════════════════
//           BRANDS
//       ════════════════════════════════════════ */}
//       <section className={styles.section}>
//         <div className={styles.sectionHeader}>
//           <h2 className={styles.sectionTitle}>🏷️ Top Brands</h2>
//         </div>
//         <div className={styles.brandRow}>
//           {brands.map((b, i) => (
//             <Link key={i} to={`/products?brand=${encodeURIComponent(b.name)}`}
//               className={styles.brandCard}>
//               <img src={safeImg(b.image || b.img)} alt={b.name} />
//               <p>{b.name}</p>
//             </Link>
//           ))}
//         </div>
//       </section>

//       {/* ════════════════════════════════════════
//           REVIEWS
//       ════════════════════════════════════════ */}
//       <section className={`${styles.section} ${styles.sectionGray}`}>
//         <div className={styles.sectionHeader}>
//           <h2 className={styles.sectionTitle}>💬 Customer Reviews</h2>
//         </div>
//         <div className={styles.reviewRow}>
//           {reviews.map((r, i) => (
//             <div key={i} className={styles.reviewCard}>
//               <div className={styles.reviewTop}>
//                 <img src={safeImg(r.image || r.img)} alt={r.name} className={styles.reviewAvatar} />
//                 <div>
//                   <strong>{r.name}</strong>
//                   <div className={styles.stars}>
//                     {Array.from({ length: r.rating || 5 }).map((_, j) => (
//                       <FaStar key={j} color="#f5a623" size={12} />
//                     ))}
//                   </div>
//                 </div>
//               </div>
//               <p className={styles.reviewText}>"{r.text}"</p>
//             </div>
//           ))}
//         </div>
//       </section>

//     </div>
//   );
// };

// export default Home;
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaHeart, FaShoppingCart, FaStar, FaTag } from "react-icons/fa";
import styles from "./Home.module.css";

const API_BASE = "http://localhost:5000";
const PLACEHOLDER_IMG = "https://via.placeholder.com/500x500?text=No+Image";

const STATIC_HOME = {
  heroBanners: [
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1600&auto=format",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1600&auto=format",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=1600&auto=format",
  ],
  trendingNow: [],
  featuredProducts: [],
  brands: [
    { name: "Nike",   image: "https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg" },
    { name: "Adidas", image: "https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg" },
    { name: "Puma",   image: "https://upload.wikimedia.org/wikipedia/en/f/fd/Puma_logo.svg" },
  ],
  reviews: [
    { name: "Priya S.",  text: "Amazing quality! The fabric feels premium and stitching is perfect.", rating: 5, image: "https://randomuser.me/api/portraits/women/44.jpg" },
    { name: "Rahul M.",  text: "Fast delivery and exactly as described. Will buy again!",             rating: 5, image: "https://randomuser.me/api/portraits/men/32.jpg" },
    { name: "Ananya K.", text: "Great prices and genuine products. Highly recommended.",              rating: 4, image: "https://randomuser.me/api/portraits/women/68.jpg" },
  ],
};

const HERO_SLIDES = [
  { tag: "New Season", headline: "Style That Speaks", sub: "Fresh arrivals for every occasion" },
  { tag: "Best Sellers", headline: "Loved by Thousands", sub: "Shop what everyone's wearing" },
  { tag: "Exclusive Deals", headline: "Up to 50% Off", sub: "Limited time offers on top brands" },
];

const safeImg = (url) => (url && url.startsWith("http") ? url : url ? `${API_BASE}/${url}` : PLACEHOLDER_IMG);

// ── Product Card ─────────────────────────────────────────────────────────────
const ProductCard = ({ product, onAddToCart, onWishlist }) => {
  const discountedPrice = product.discount
    ? Math.round(product.price * (1 - product.discount / 100))
    : product.price;

  return (
    <div className={styles.productCard}>
      <Link to={`/products/${product._id}`} className={styles.cardLink}>
        <div className={styles.cardImageWrap}>
          <img src={safeImg(product.images?.[0])} alt={product.name} className={styles.cardImg} />
          {product.discount > 0 && (
            <span className={styles.discountBadge}>{product.discount}% OFF</span>
          )}
        </div>
        <div className={styles.cardBody}>
          <p className={styles.cardBrand}>{product.brand}</p>
          <h3 className={styles.cardName}>{product.name}</h3>
          <div className={styles.cardPricing}>
            <span className={styles.cardPrice}>₹{discountedPrice}</span>
            {product.discount > 0 && (
              <span className={styles.cardMrp}>₹{product.price}</span>
            )}
          </div>
        </div>
      </Link>
      <div className={styles.cardActions}>
        <button className={styles.cartActionBtn}
          onClick={() => onAddToCart(product)}>
          <FaShoppingCart /> Add to Cart
        </button>
        <button className={styles.wishlistActionBtn}
          onClick={() => onWishlist(product)}
          title="Add to Wishlist">
          <FaHeart className={styles.heartIcon} />
        </button>
      </div>
    </div>
  );
};

// ── Variant Popup — smart size↔color mapping like ProductDetail ─────────────
const VariantPopup = ({ product, mode, onClose, onConfirm }) => {
  const [selSize,  setSelSize]  = useState("");
  const [selColor, setSelColor] = useState("");

  const variants = product?.variants || [];

  const isSizeCat = product?.category === "Clothing" ||
    (product?.category === "Handmade" && product?.subcategory === "Jewelry");

  // All unique sizes
  const allSizes = [...new Set(variants.map(v => v.size).filter(Boolean))];

  // size→colors map  { "S": [{name,hex,stock},...], "M": [...] }
  const sizeToColors = {};
  // color→sizes map
  const colorToSizes = {};
  for (const v of variants) {
    const s    = (v.size      || "").trim();
    const name = (v.colorName || v.color || "").trim();
    const hex  = v.colorHex  || v.color || name;
    const stk  = typeof v.stock === "object" ? parseInt(v.stock?.$numberInt || 0) : parseInt(v.stock || 0);
    if (s && name) {
      if (!sizeToColors[s]) sizeToColors[s] = [];
      if (!sizeToColors[s].find(c => c.name === name))
        sizeToColors[s].push({ name, hex, stock: stk });
      if (!colorToSizes[name]) colorToSizes[name] = [];
      if (!colorToSizes[name].find(x => x.size === s))
        colorToSizes[name].push({ size: s, stock: stk });
    }
  }

  // All unique colors
  const allColors = [];
  const seenC = new Set();
  for (const v of variants) {
    const name = (v.colorName || v.color || "").trim();
    const hex  = v.colorHex  || v.color || name;
    if (name && !seenC.has(name)) { seenC.add(name); allColors.push({ name, hex }); }
  }

  // When size selected → only show colors available for that size
  const availableColors = selSize
    ? (sizeToColors[selSize] || [])
    : allColors;

  // When color selected → only show sizes available for that color
  const availableSizes = selColor
    ? (colorToSizes[selColor] || []).map(x => x.size)
    : allSizes;

  // Get matching variant for stock display
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

  const handleSizeClick = (s) => {
    if (selSize === s) { setSelSize(""); return; }
    setSelSize(s);
    // reset color if not available for new size
    const colorsForSize = (sizeToColors[s] || []).map(c => c.name);
    if (selColor && !colorsForSize.includes(selColor)) setSelColor("");
  };

  const handleColorClick = (name) => {
    if (selColor === name) { setSelColor(""); return; }
    setSelColor(name);
    // reset size if not available for new color
    const sizesForColor = (colorToSizes[name] || []).map(x => x.size);
    if (selSize && !sizesForColor.includes(selSize)) setSelSize("");
  };

  return (
    <div className={styles.popupOverlayDark} onClick={onClose}>
      <div className={styles.variantModal} onClick={e => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose}>×</button>

        {/* Product info */}
        <div className={styles.modalProduct}>
          <img src={safeImg(product?.images?.[0])} alt={product?.name} />
          <div>
            <h4>{product?.name}</h4>
            <p className={styles.modalPrice}>₹{product?.discount
              ? Math.round(product.price * (1 - product.discount / 100))
              : product?.price}
              {product?.discount > 0 && (
                <span className={styles.modalMrp}>₹{product?.price}</span>
              )}
            </p>
          </div>
        </div>

        {/* Size selector */}
        {isSizeCat && allSizes.length > 0 && (
          <div className={styles.modalSection}>
            <label>SIZE {selSize && <span>— {selSize}</span>}</label>
            <div className={styles.sizeGrid}>
              {allSizes.map(s => {
                const avail = availableSizes.includes(s);
                const active = selSize === s;
                return (
                  <button key={s}
                    className={`${styles.sizeBtn} ${active ? styles.sizeBtnActive : ""} ${!avail ? styles.sizeBtnDisabled : ""}`}
                    onClick={() => avail && handleSizeClick(s)}
                    disabled={!avail}>
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Color selector */}
        {availableColors.length > 0 && (
          <div className={styles.modalSection}>
            <label>COLOR {selColor && <span>— {selColor}</span>}</label>
            <div className={styles.colorSwatches}>
              {(selSize ? availableColors : allColors).map(({ name, hex }) => {
                const sizesForThisColor = (colorToSizes[name] || []).map(x => x.size);
                const avail = !selSize || availableColors.find(c => c.name === name);
                const active = selColor === name;
                const bg = hex && hex.startsWith("#") ? hex : name;
                return (
                  <div key={name} className={styles.colorSwatchWrap}>
                    <button title={name}
                      className={`${styles.colorSwatch} ${active ? styles.colorSwatchActive : ""} ${!avail ? styles.colorSwatchDisabled : ""}`}
                      style={{ background: bg }}
                      onClick={() => handleColorClick(name)}
                      disabled={!avail} />
                    <span className={styles.colorLabel}>{name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stock indicator */}
        {(selSize || selColor) && (
          <div className={styles.stockIndicator}>
            {!matchedVariant ? (
              <span className={styles.stockNA}>⚠️ Combination not available</span>
            ) : stock === 0 ? (
              <span className={styles.stockOut}>❌ Out of stock</span>
            ) : stock <= 5 ? (
              <span className={styles.stockLow}>🔥 Only {stock} left!</span>
            ) : (
              <span className={styles.stockIn}>✅ In Stock</span>
            )}
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

// ── Main Component ────────────────────────────────────────────────────────────
const Home = () => {
  const navigate   = useNavigate();
  const [homeData,     setHomeData]     = useState(null);
  const [offers,       setOffers]       = useState([]);
  const [newArrivals,  setNewArrivals]  = useState([]);
  const [categories,   setCategories]   = useState([]);
  const [index,        setIndex]        = useState(0);
  const [popup,        setPopup]        = useState(null); // { product, mode }
  const [toast,        setToast]        = useState("");
  const autoplayRef = useRef(null);
  const AUTOPLAY_MS = 5000;

  const customer = (() => { try { return JSON.parse(localStorage.getItem("customer")); } catch { return null; } })();
  const token    = localStorage.getItem("token");

  // ── Fetches ──
  useEffect(() => {
    fetch(`${API_BASE}/api/homepage?_=${Date.now()}`)
      .then(r => r.json()).then(d => setHomeData(d || STATIC_HOME))
      .catch(() => setHomeData(STATIC_HOME));
  }, []);

  useEffect(() => {
    const ep = token ? `${API_BASE}/api/offers/eligible` : `${API_BASE}/api/offers`;
    fetch(ep, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json()).then(d => setOffers(Array.isArray(d) ? d : d.offers || []))
      .catch(() => setOffers([]));
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/api/categories`)
      .then(r => r.json()).then(d => setCategories(d.categories || []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/products/new-arrivals`)
      .then(r => r.json())
      .then(d => setNewArrivals(Array.isArray(d) ? d : d.products || []))
      .catch(() => setNewArrivals([]));
  }, []);

  // ── Hero autoplay ──
  const banners = homeData?.heroBanners?.length ? homeData.heroBanners : STATIC_HOME.heroBanners;
  useEffect(() => {
    autoplayRef.current = setInterval(() => setIndex(p => (p + 1) % banners.length), AUTOPLAY_MS);
    return () => clearInterval(autoplayRef.current);
  }, [banners.length]);

  const prev = () => setIndex(i => (i - 1 + banners.length) % banners.length);
  const next = () => setIndex(i => (i + 1) % banners.length);

  // ── Toast ──
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  // ── Cart / Wishlist ──
  const requireLogin = () => { navigate("/login"); return false; };

  const addToCart = async (product, size, color) => {
    if (!customer) return requireLogin();
    try {
      const res = await fetch(`${API_BASE}/customer/cart/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${customer.token}` },
        body: JSON.stringify({ customer_id: customer.id, product_id: product._id, size: size || "N/A", color: color || "N/A", quantity: 1 }),
      });
      const data = await res.json();
      if (data.message === "Added to cart") showToast("✅ Added to Cart!");
      else showToast(`❌ ${data.error || "Failed"}`);
    } catch { showToast("❌ Error adding to cart"); }
    setPopup(null);
  };

  const addToWishlist = async (product, size, color) => {
    if (!customer) return requireLogin();
    try {
      const res = await fetch(`${API_BASE}/customer/wishlist/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${customer.token}` },
        body: JSON.stringify({ customer_id: customer.id, product_id: product._id, size: size || "N/A", color: color || "N/A" }),
      });
      const data = await res.json();
      if (data.message === "Added to wishlist") showToast("❤️ Added to Wishlist!");
      else showToast(`❌ ${data.error || "Failed"}`);
    } catch { showToast("❌ Error"); }
    setPopup(null);
  };

  const handleAddToCart   = (product) => setPopup({ product, mode: "cart" });
  const handleWishlist    = (product) => setPopup({ product, mode: "wishlist" });
  const handlePopupConfirm = (product, size, color) =>
    popup?.mode === "wishlist" ? addToWishlist(product, size, color) : addToCart(product, size, color);

  const trending  = homeData?.trendingNow     || [];
  const featured  = homeData?.featuredProducts || [];
  const brands    = homeData?.brands           || STATIC_HOME.brands;
  const reviews   = homeData?.reviews          || STATIC_HOME.reviews;
  const slide     = HERO_SLIDES[index % HERO_SLIDES.length];

  return (
    <div className={styles.home}>

      {/* ── TOAST ── */}
      {toast && <div className={styles.toast}>{toast}</div>}

      {/* ── POPUP ── */}
      {popup && (
        <VariantPopup
          product={popup.product}
          mode={popup.mode}
          onClose={() => setPopup(null)}
          onConfirm={handlePopupConfirm}
        />
      )}

      {/* ════════════════════════════════════════
          HERO BANNER
      ════════════════════════════════════════ */}
      <section className={styles.hero}>
        <div className={styles.heroSlides}>
          {banners.map((url, i) => (
            <div key={i} className={`${styles.heroSlide} ${i === index ? styles.heroSlideActive : ""}`}
              style={{ backgroundImage: `url(${url})` }} />
          ))}
        </div>
        <div className={styles.heroGradient} />
        <div className={styles.heroContent}>
          <span className={styles.heroTag}>{slide.tag}</span>
          <h1 className={styles.heroHeadline}>{slide.headline}</h1>
          <p className={styles.heroSub}>{slide.sub}</p>
          <div className={styles.heroBtns}>
            <Link to="/products" className={styles.heroBtnPrimary}>Shop Now</Link>
            <Link to="/offers"   className={styles.heroBtnSecondary}>View Offers</Link>
          </div>
        </div>


      </section>

      {/* ════════════════════════════════════════
          TRUST STRIP
      ════════════════════════════════════════ */}
      <section className={styles.trustStrip}>
        {[
          { icon: "🚚", title: "Free Delivery",   sub: "On orders above ₹500" },
          { icon: "🔒", title: "Secure Payments", sub: "100% safe & encrypted" },
          { icon: "🎧", title: "24/7 Support",    sub: "We're always here" },
          { icon: <FaTag />, title: "Best Prices", sub: "Guaranteed lowest" },
        ].map((t, i) => (
          <div key={i} className={styles.trustItem}>
            <span className={styles.trustIcon}>{t.icon}</span>
            <div>
              <strong>{t.title}</strong>
              <p>{t.sub}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ════════════════════════════════════════
          OFFERS BANNER STRIP
      ════════════════════════════════════════ */}
      {offers.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>💥 Exclusive Offers</h2>
            <Link to="/offers" className={styles.seeAll}>See All →</Link>
          </div>
          <div className={styles.offerStrip}>
            {offers.slice(0, 4).map((offer, i) => (
              <Link key={offer._id || i} to={`/offers/${offer._id}`} className={styles.offerCard}>
                <img src={safeImg(offer.image)} alt={offer.title} />
                <div className={styles.offerOverlay}>
                  <h3>{offer.title}</h3>
                  <p>{offer.description}</p>
                  <span>Grab Now →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════
          SHOP BY CATEGORY
      ════════════════════════════════════════ */}
      {(homeData?.categories?.length > 0 || categories.length > 0) && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>🛍️ Shop by Category</h2>
            <Link to="/products" className={styles.seeAll}>All Categories →</Link>
          </div>
          <div className={styles.categoryRow}>
            {(homeData?.categories || categories).slice(0, 8).map((cat, i) => {
              const colors = ["#ff3f6c","#ff6b35","#6366f1","#0ea5e9","#10b981","#f59e0b","#ec4899","#8b5cf6"];
              return (
                <Link key={i} to={`/products?category=${encodeURIComponent(cat.name)}`}
                  className={styles.categoryPill}>
                  {cat.image
                    ? <img src={safeImg(cat.image)} alt={cat.name} />
                    : <div style={{
                        width: 80, height: 80, borderRadius: "50%",
                        background: colors[i % colors.length],
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 28, color: "#fff", fontWeight: 700,
                        boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
                        border: "3px solid #f0f0f0",
                        flexShrink: 0,
                      }}>
                        {cat.name?.[0]?.toUpperCase()}
                      </div>
                  }
                  <span>{cat.name}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════
          NEW ARRIVALS
      ════════════════════════════════════════ */}
      {newArrivals.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>🆕 New Arrivals</h2>
            <Link to="/products" className={styles.seeAll}>View All →</Link>
          </div>
          <div className={styles.productRow}>
            {newArrivals.map((p, i) => (
              <ProductCard key={p._id || i} product={p}
                onAddToCart={handleAddToCart} onWishlist={handleWishlist} />
            ))}
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════
          TRENDING NOW
      ════════════════════════════════════════ */}
      {trending.length > 0 && (
        <section className={`${styles.section} ${styles.sectionDark}`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle} style={{ color: "#fff" }}>
              🔥 Trending Now
            </h2>
            <Link to="/products" className={styles.seeAllLight}>View All →</Link>
          </div>
          <div className={styles.productRow}>
            {trending.map((item, i) => (
              <ProductCard key={item._id || i}
                product={{ ...item, images: [item.img || item.image], _id: item._id || item.id }}
                onAddToCart={handleAddToCart} onWishlist={handleWishlist} />
            ))}
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════
          FEATURED PRODUCTS
      ════════════════════════════════════════ */}
      {featured.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>⭐ Featured Products</h2>
            <Link to="/products" className={styles.seeAll}>View All →</Link>
          </div>
          <div className={styles.productGrid4}>
            {featured.map((p, i) => (
              <ProductCard key={p._id || i}
                product={{ ...p, images: [p.img || p.image] }}
                onAddToCart={handleAddToCart} onWishlist={handleWishlist} />
            ))}
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════
          BRANDS
      ════════════════════════════════════════ */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>🏷️ Top Brands</h2>
        </div>
        <div className={styles.brandRow}>
          {brands.map((b, i) => (
            <Link key={i} to={`/products?brand=${encodeURIComponent(b.name)}`}
              className={styles.brandCard}>
              <img src={safeImg(b.image || b.img)} alt={b.name} />
              <p>{b.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════
          REVIEWS
      ════════════════════════════════════════ */}
      <section className={`${styles.section} ${styles.sectionGray}`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>💬 Customer Reviews</h2>
        </div>
        <div className={styles.reviewRow}>
          {reviews.map((r, i) => (
            <div key={i} className={styles.reviewCard}>
              <div className={styles.reviewTop}>
                <img src={safeImg(r.image || r.img)} alt={r.name} className={styles.reviewAvatar} />
                <div>
                  <strong>{r.name}</strong>
                  <div className={styles.stars}>
                    {Array.from({ length: r.rating || 5 }).map((_, j) => (
                      <FaStar key={j} color="#f5a623" size={12} />
                    ))}
                  </div>
                </div>
              </div>
              <p className={styles.reviewText}>"{r.text}"</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

export default Home;