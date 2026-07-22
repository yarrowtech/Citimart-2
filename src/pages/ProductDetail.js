// import React, { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import styles from "./ProductDetail.module.css";
// import {
//   FaHeart,
//   FaShoppingCart,
//   FaShareAlt,
//   FaStar,
//   FaTag,
//   FaPercent,
//   FaCreditCard,
// } from "react-icons/fa";

// const ProductDetail = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [product, setProduct] = useState(null);
//   const [mainImage, setMainImage] = useState("");
//   const [selectedColor, setSelectedColor] = useState("");
//   const [selectedSize, setSelectedSize] = useState("");
//   const [pincode, setPincode] = useState("");
//   const [deliveryMsg, setDeliveryMsg] = useState("");
//   const [quantity, setQuantity] = useState(1);
//   const [similarProducts, setSimilarProducts] = useState([]);
//   const [frequentlyBought, setFrequentlyBought] = useState([]);
//   const [variantPopup, setVariantPopup] = useState(null); 
//   const [fbtQueue, setFbtQueue] = useState([]); 
//   const [offers, setOffers] = useState([]);
//   // For popup variant selections (do NOT touch main product selection)
//   const [popupSelectedColor, setPopupSelectedColor] = useState("");
//   const [popupSelectedSize, setPopupSelectedSize] = useState("");
//   const [activeTab, setActiveTab] = useState("details"); // "details" | "reviews"
//   const [reviews, setReviews] = useState([]);
//   const [giftOption, setGiftOption] = useState(false);
//   const [giftMessage, setGiftMessage] = useState("");



  
//   const customer = JSON.parse(localStorage.getItem("customer"));

//   useEffect(() => {
//     fetch(`http://localhost:5000/api/products/${id}`)
//       .then((res) => res.json())
//       .then((data) => {
//         if (data.product) {
//           setProduct(data.product);
//           const firstImage = data.product.images?.[0];
//           setMainImage(
//             firstImage?.startsWith("http")
//               ? firstImage
//               : `http://localhost:5000/${firstImage}`
//           );
         
//          /*Similar Products*/
//           fetch("http://localhost:5000/api/products")
//             .then((res) => res.json())
//             .then((all) => {
//               if (all.products) {
//                 const filtered = all.products
//                   .filter(
//                     (p) =>
//                       p._id !== data.product._id &&
//                       p.category === data.product.category
//                   )
//                   .slice(0, 4);
//                 setSimilarProducts(filtered);
//               }
//             });

//           // Fetch Frequently Bought Together products
//           fetch(
//             `http://localhost:5000/api/products/frequently-bought/${id}`
//           )
//             .then((res) => res.json())
//             .then((fbData) => {
//               if (fbData.relatedProducts) {
//                 setFrequentlyBought(fbData.relatedProducts);
//               }
//             })
//             .catch((err) =>
//               console.error("Error fetching frequently bought products:", err)
//             );
//         }
//       });
//   }, [id]);
    
// // 🏷️ Fetch offers for this product
// // 🏷️ Fetch offers for this product (with auth header)
// useEffect(() => {
//   const fetchProductOffers = async () => {
//     const token = localStorage.getItem("token"); // ✅ must match your login token key
//     const headers = token ? { Authorization: `Bearer ${token}` } : {};

//     try {
//       const res = await fetch(`http://localhost:5000/api/products/${id}/offers`, { headers });
//       const data = await res.json();
//       if (data.offers) {
//         setOffers(data.offers);
//       } else {
//         setOffers([]);
//       }
//     } catch (err) {
//       console.error("Error fetching offers:", err);
//       setOffers([]);
//     }
//   };

//   fetchProductOffers();
// }, [id]);


//      useEffect(() => {
//   fetch(`http://localhost:5000/customer/reviews/${id}`)
//     .then((res) => res.json())
//     .then((data) => {
//       if (data.reviews) setReviews(data.reviews);
//     })
//     .catch((err) => console.error("Error fetching reviews:", err));
// }, [id]);


//   const formatOfferText = (offer) => {
//     if (offer.type === "bogo") return "Buy 1 Get 1 Free 🎉";
//     if (offer.type === "discount") return `${offer.discount}% Off`;
//     return offer.title || "Special Offer";
//   };

  
//    // ✅ Add to Cart API
// const addToCartAPI = async (productId, size, color) => {
//   if (!customer) {
//     navigate("/login");
//     return false;
//   }

//   // Validation: only check size if the product requires it
//   const productToCheck = productId === product._id ? product : variantPopup?.product;
//   if (isSizeCategory(productToCheck) && !size) {
//     alert("Please select a size");
//     return false;
//   }

//   try {
//     const res = await fetch("http://localhost:5000/customer/cart/add", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${customer.token}`,
//       },
//       body: JSON.stringify({
//         customer_id: customer.id,
//         product_id: productId,
//         size: isSizeCategory(productToCheck) ? size : "N/A",
//         color: color || "N/A",
//         quantity,
//           // 🎁 Gift fields
//         gift_option: giftOption,
//         gift_message: giftMessage.trim() || null,
//       }),
//     });

//     const data = await res.json();
//     if (data.message === "Added to cart") {
//       alert("✅ Added to Cart!");
//        fetchProductDetails(); 
//       return true;
//     } else {
//       alert(`❌ ${data.error || "Failed to add to cart"}`);
//       return false;
//     }
//   } catch {
//     alert("Error adding to cart");
//     return false;
//   }
// };




//   // ✅ Add to Wishlist API
  
//   const addToWishlistAPI = async (productId, size, color) => {
//   if (!customer) {
//     navigate("/login");
//     return false;
//   }

//   const productToCheck = productId === product._id ? product : variantPopup?.product;

//   // Validation
//   if (
//     (isSizeCategory(productToCheck) && !size) || 
//     (!isSizeCategory(productToCheck) && !color)
//   ) {
//     alert("Please select required options");
//     return false;
//   }

//   try {
//     const res = await fetch("http://localhost:5000/customer/wishlist/add", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${customer.token}`,
//       },
//       body: JSON.stringify({
//         customer_id: customer.id,
//         product_id: productId,
//         size: isSizeCategory(productToCheck) ? size : "N/A",
//         color: color || "N/A",
//       }),
//     });

//     const data = await res.json();
//     if (data.message === "Added to wishlist") {
//       alert("✅ Added to Wishlist!");
//       return true;
//     } else {
//       alert(`❌ ${data.error || "Failed to add to wishlist"}`);
//       return false;
//     }
//   } catch {
//     alert("Error adding to wishlist");
//     return false;
//   }
// };




//   const isSizeCategory = (product) => {
//   if (!product) return false;
//   if (product.category === "Clothing") return true;
//   if (product.category === "Handmade" && product.subcategory === "Jewelry") return true;
//   return false;
// };

//   const handleAddToCart = () => 
//   addToCartAPI(product._id, selectedSize, selectedColor);
   
  

// const handleBuyNow = async () => {
//   const added = await addToCartAPI(product._id, selectedSize, selectedColor);
//   if (added) {
//     fetchProductDetails(); 
//     // Calculate totals for this single product
//     const subtotal = product.price * quantity;
//     const discount = offers.find(o => o.type === 'discount') 
//                        ? (subtotal * offers.find(o => o.type === 'discount').discount / 100) 
//                        : 0;
//     const deliveryFee = 50; // or your logic
//     const giftWrapFee = giftOption ? 50 : 0; // example
//     const finalTotal = subtotal - discount + deliveryFee + giftWrapFee;

//     navigate("/checkout", {
//       state: {
//         cartItems: [
//           {
//             product,
//             quantity,
//             size: selectedSize,
//             color: selectedColor,
//             giftMessage,
//             isGift: giftOption,
//           },
//         ],
//         isGift: giftOption,
//         giftMessage,
//         totals: { subtotal, discount, deliveryFee, giftWrapFee, finalTotal },
//       },
//     });
//   }
// };
// const fetchProductDetails = async () => {
//   try {
//     const res = await fetch(`http://localhost:5000/api/products/${id}`);
//     const data = await res.json();
//     if (data.product) {
//       setProduct(data.product);
//       const firstImage = data.product.images?.[0];
//       setMainImage(firstImage?.startsWith("http") ? firstImage : `http://localhost:5000/${firstImage}`);
//     }
//   } catch (err) {
//     console.error("Error fetching product:", err);
//   }
// };

// // Call it periodically to update stock (optional)
// useEffect(() => {
//   fetchProductDetails();
//   const interval = setInterval(fetchProductDetails, 30000); // refresh every 30 sec
//   return () => clearInterval(interval);
// }, [id]);



// const handleWishlist = async () => {
//   const added = await addToWishlistAPI(product._id, selectedSize, selectedColor);
//   if (added) {
//     console.log("Wishlist updated!"); 
//   }
// };



//   const checkDelivery = () => {
//     if (pincode.length !== 6) {
//       setDeliveryMsg("Enter a valid pincode");
//     } else {
//       setDeliveryMsg("Delivery available in 3-5 days 🚚");
//     }
//   };
//   // Add this helper inside your component, before return:
//   const addBothToCart = async () => {
//   if (!customer) return navigate("/login");

//   // ✅ Validation logic based on category
//   const requiresSize = 
//     product.category?.toLowerCase() === "clothing" ||
//     (product.category?.toLowerCase() === "handmade" && 
//      product.subcategory?.toLowerCase() === "jewelry");

//   if (requiresSize) {
//     if (!selectedSize || !selectedColor) {
//       alert("Please select both size and color before adding to cart.");
//       return;
//     }
//   } else {
//     if (!selectedColor) {
//       alert("Please select a color before adding to cart.");
//       return;
//     }
//   }

//   try {
//     // Add main product first
//     await addToCartAPI(product._id, selectedSize, selectedColor);

//     // If there are FBT products → open popup flow
//     if (frequentlyBought.length > 0) {
//       setVariantPopup({ product: frequentlyBought[0], action: "cart" });
//     } else {
//       alert("Product added to cart successfully!");
//     }
//   } catch (error) {
//     console.error("Error adding both to cart:", error);
//   }
// };

// const handleNotifyMe = async () => {
//   if (!customer) {
//     navigate("/login");
//     return;
//   }

//   try {
//     const res = await fetch("http://localhost:5000/customer/notify-me", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         customer_id: customer.id,
//         product_id: product._id,
//         customer_email: customer.email, // make sure your `customer` object has email
//       }),
//     });

//     const data = await res.json();
//     if (data.message) {
//       alert("📩 " + data.message);
//     } else {
//       alert("❌ Failed to subscribe for notification");
//     }
//   } catch (err) {
//     console.error("Notify Me error:", err);
//     alert("Error subscribing for notification");
//   }
// };

//  const disableButtons = () => {
//   if (!product) return true;

//   // If this category needs size → lock until BOTH size & color chosen
//   if (isSizeCategory(product)) {
//     return !selectedSize || !selectedColor;
//   }

//   // If size is NOT required → lock until color chosen (if product has colors)
//   return product.variants?.some(v => v.color) ? !selectedColor : false;
// };

// const disablePopupButtons = (p) => {
//   if (!p) return true;

//   if (isSizeCategory(p)) {
//     return !popupSelectedSize || !popupSelectedColor;
//   }

//   return p.variants?.some(v => v.color) ? !popupSelectedColor : false;
// };

// const getPopupSelectionMessage = (p) => {
//   if (!p) return "";

//   if (isSizeCategory(p)) {
//     if (!popupSelectedSize && !popupSelectedColor) return "Please select size and color";
//     if (!popupSelectedSize) return "Please select a size";
//     if (!popupSelectedColor) return "Please select a color";
//   } else {
//     if (p.variants?.some(v => v.color) && !popupSelectedColor) return "Please select a color";
//   }
//   return "";
// };


// const getSelectionMessage = () => {
//   if (!product) return "";

//   if (isSizeCategory(product)) {
//     if (!selectedSize && !selectedColor) return "Please select size and color to continue";
//     if (!selectedSize) return "Please select a size to continue";
//     if (!selectedColor) return "Please select a color to continue";
//   } else {
//     if (product.variants?.some(v => v.color) && !selectedColor) {
//       return "Please select a color to continue";
//     }
//   }
//   return "";
// };

// const getFinalPrice = () => {
//   if (!product) return 0;

//   let price = product.price;

//   // Example: if offers contain a discount type
//   const discountOffer = offers.find(o => o.type === "discount");
//   if (discountOffer) {
//     price = price - (price * discountOffer.discount / 100);
//   }

//   return Math.round(price);
// };

//   // Calculate average rating and review count
// const reviewCount = reviews.length;
// const averageRating =
//   reviewCount > 0
//     ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1)
//     : 0;


//   if (!product) return <div className={styles.loading}>Loading...</div>;

//   return (
//     <div className={styles.amazonLayout}>
//       {/* LEFT SECTION */}
//       <div className={styles.leftSection}>
//         <div className={styles.imageGallery}>
//           <div className={styles.thumbnails}>
//             {product.images?.map((img, i) => {
//               const url = img.startsWith("http")
//                 ? img
//                 : `http://localhost:5000/${img}`;
//               return (
//                 <img
//                   key={i}
//                   src={url}
//                   onClick={() => setMainImage(url)}
//                   className={mainImage === url ? styles.activeThumb : ""}
//                   alt=""
//                 />
//               );
//             })}
//           </div>
//           <div className={styles.mainImage}>
//             <img src={mainImage} alt={product.name} />
//             <button
//               className={styles.shareIcon}
//               onClick={() => {
//                 navigator.clipboard.writeText(window.location.href);
//                 alert("Product link copied!");
//               }}
//             >
//               <FaShareAlt />
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* MIDDLE SECTION */}
//       <div className={styles.middleSection}>
//         <h2 className={styles.title}>{product.name}</h2>
//         <div className={styles.vendor}>
//           <h3>Brand: {product.brand}</h3>
//         </div>

//         <div className={styles.rating}>
//          <span className={styles.star}>
//          <FaStar /> {averageRating}
//          </span>
//          <span className={styles.reviewCount}>
//          {reviewCount} {reviewCount === 1 ? "rating" : "ratings"}
//         </span>
//         </div>


//         <div className={styles.priceBlock}>
//           <span className={styles.currentPrice}>₹{getFinalPrice()}</span>

//           {product.discount > 0 && (
//             <>
//               <span className={styles.originalPrice}>
//                 ₹{(product.price / (1 - product.discount / 100)).toFixed(0)}
//               </span>
//               <span className={styles.discount}>{product.discount}% OFF</span>
//             </>
//           )}
//         </div>

//         <div className={styles.couponBox}>
//           <FaTag /> Apply ₹50 coupon & save extra!
//         </div>

//         <div className={styles.offersBox}>
//         <h4>Available Offers:</h4>
//         <ul>
//         {offers.length > 0 ? (
//         offers.map((offer) => (
//         <li key={offer._id}>
//           <FaPercent /> {offer.title || `${offer.discount}% Off`}
//         </li>
//          ))
//         ) : (
//         <>
//         <li><FaPercent /> Get 10% cashback on UPI payments</li>
//         <li><FaPercent /> Flat ₹100 OFF on your first order</li>
//         <li><FaPercent /> Buy 2 get 5% OFF, Buy 3 get 10% OFF</li>
//         </>
//         )}
//        </ul>
//       </div>


//        {/* ===== VARIANTS SECTION ===== */}
//   {product.variants?.length > 0 && (
//   <div className={styles.variantSection}>
//     {/* Sizes Row */}
//     {isSizeCategory(product) && (
//       <div className={styles.sizeSection}>
//         <h4>Select Size:</h4>
//         <div className={styles.sizeList}>
//           {[...new Set(product.variants.map((v) => v.size).filter(Boolean))].map(
//             (size, i) => (
//               <button
//                 key={i}
//                 className={`${styles.sizeBtn} ${
//                   selectedSize === size ? styles.selected : ""
//                 }`}
//                onClick={() => setSelectedSize(selectedSize === size ? "" : size)}

//               >
//                 {size}
//               </button>
//             )
//           )}
//         </div>
//       </div>
//     )}

//     {/* Colors Row */}
//     <div className={styles.colorSection}>
//       <h4>Select Color:</h4>
//       <div className={styles.colorList}>
//         {[...new Set(product.variants.map((v) => v.color).filter(Boolean))].map(
//           (color, i) => (
//             <button
//               key={i}
//               style={{ backgroundColor: color }}
//               className={`${styles.colorBtn} ${
//                 selectedColor === color ? styles.selectedColor : ""
//               }`}
//              onClick={() => setSelectedColor(selectedColor === color ? "" : color)}

//             ></button>
//           )
//         )}
//       </div>
//     </div>

//     {/* Stock Info */}
//     {(() => {
//       const selectedVariant = product.variants.find(
//         (v) =>
//           (!isSizeCategory(product) || v.size === selectedSize) &&
//           (!selectedColor || v.color === selectedColor)
//       );
//       return (
//         selectedVariant && (
//           <p className={styles.stockText}>
//             Stock: {selectedVariant.stock}
//           </p>
//         )
//       );
//     })()}
//   </div>
// )}


//       <div className={styles.tabs}>
//   <div
//     className={`${styles.tabItem} ${activeTab === "details" ? styles.activeTab : ""}`}
//     onClick={() => setActiveTab("details")}
//   >
//     Details
//   </div>
//   <div
//     className={`${styles.tabItem} ${activeTab === "reviews" ? styles.activeTab : ""}`}
//     onClick={() => setActiveTab("reviews")}
//   >
//     Reviews ({reviews.length})
//   </div>
// </div>


// <div className={styles.tabContent}>
//   {activeTab === "details" && (
//     <div>
//       <p>{product.description}</p>
//       <ul>
//         {product.specifications?.map((spec, i) => (
//           <li key={i}>
//             <strong>{spec.label}:</strong> {spec.value}
//           </li>
//         ))}
//       </ul>
//     </div>
//   )}

// {/* ===== Reviews Tab ===== */}
// {activeTab === "reviews" && (
//   <div className={styles.reviewsContainer}>
//     {/* ⭐ Rating Summary Section */}
//     <div className={styles.ratingSummary}>
//       <div className={styles.avgRating}>
//         <h2>{(reviews.reduce((sum, r) => sum + r.rating, 0) / (reviews.length || 1)).toFixed(1)}</h2>
//         <p>out of 5</p>
//         <span>{reviews.length} Ratings</span>
//       </div>
//       <div className={styles.ratingBars}>
//         {[5, 4, 3, 2, 1].map((star) => {
//           const count = reviews.filter((r) => r.rating === star).length;
//           const percent = (count / (reviews.length || 1)) * 100;
//           return (
//             <div key={star} className={styles.ratingRow}>
//               <span>{star}★</span>
//               <div className={styles.progressBar}>
//                 <div style={{ width: `${percent}%` }}></div>
//               </div>
//               <span>{count}</span>
//             </div>
//           );
//         })}
//       </div>
//     </div>

//     {/* 📝 Reviews List */}
//     <div className={styles.reviewList}>
//       {reviews.length === 0 ? (
//         <p className={styles.noReviews}>No reviews yet. Be the first to review!</p>
//       ) : (
//         reviews.map((rev) => (
//           <div key={rev._id} className={styles.reviewCard}>
//             {/* Header with avatar + name */}
//             <div className={styles.reviewHeader}>
//               <div className={styles.avatar}>
//                 {rev.customer_name ? rev.customer_name[0].toUpperCase() : "A"}
//               </div>
//               <div>
//                 <strong>{rev.customer_name || "Anonymous"}</strong>
//                 <div className={styles.reviewRating}>
//                   {Array.from({ length: rev.rating || 0 }).map((_, i) => (
//                     <FaStar key={i} color="#f5c518" />
//                   ))}
//                 </div>
//               </div>
//               <small className={styles.reviewDate}>
//                 {rev.created_at &&
//                   new Date(rev.created_at).toLocaleDateString("en-IN", {
//                     day: "numeric",
//                     month: "short",
//                     year: "numeric",
//                   })}
//               </small>
//             </div>

//             {/* Review text */}
//             {rev.review && <p className={styles.reviewText}>{rev.review}</p>}

//             {/* Review image */}
//             {rev.image && (
//               <div className={styles.reviewImageWrapper}>
//                 <img src={rev.image} alt="Review" className={styles.reviewImage} />
//               </div>
//             )}
//           </div>
//         ))
//       )}
//     </div>
//   </div>
// )}


// </div>

//          {variantPopup && (
//   <div className={styles.variantPopup}>
//     <div className={styles.popupContent}>
//       <h3>Select Options for {variantPopup.product.name}</h3>

//       {/* Sizes */}
//       {isSizeCategory(variantPopup.product) && (
//         <div className={styles.sizeList}>
//           {[...new Set(variantPopup.product.variants.map(v => v.size).filter(Boolean))].map(size => (
//             <button
//               key={size}
//               className={popupSelectedSize === size ? styles.selected : ""}
//               onClick={() => setPopupSelectedSize(popupSelectedSize === size ? "" : size)}


//             >
//               {size}
//             </button>
//           ))}
//         </div>
//       )}

//       {/* Colors */}
//       <div className={styles.colorList}>
//         {[...new Set(variantPopup.product.variants.map(v => v.color).filter(Boolean))].map(color => (
//           <button
//             key={color}
//             style={{ backgroundColor: color }}
//            className={popupSelectedColor === color ? styles.selectedColor : ""}
//            onClick={() => setPopupSelectedColor(popupSelectedColor === color ? "" : color)}


//           />
//         ))}
//       </div>

//       <div className={styles.popupActions}>
//          <button
//   onClick={async () => {
//     if (variantPopup.action === "cart") {
//       await addToCartAPI(variantPopup.product._id, popupSelectedSize, popupSelectedColor);

//     } else {
//      await addToWishlistAPI(variantPopup.product._id, popupSelectedSize, popupSelectedColor);

//     }

//     // 🔄 If it’s part of FBT queue → move to next product
//     if (variantPopup.from === "fbt") {
//       const nextQueue = fbtQueue.slice(1);
//       setFbtQueue(nextQueue);

//       if (nextQueue.length > 0) {
//         setVariantPopup({
//           product: nextQueue[0],
//           action: "cart",
//           from: "fbt"
//         });
//         return; // stay open for next product
//       }
//     }

//     //  Close popup when finished
//    // Reset popup selections
// setPopupSelectedSize("");
// setPopupSelectedColor("");
// setVariantPopup(null);

//   }}
//   disabled={disablePopupButtons(variantPopup.product)}
 
// >
//   Confirm
// </button>

//         <button onClick={() => setVariantPopup(null)}>Cancel</button>
//       </div>
//     </div>
//   </div>
// )}

//         {/*  Frequently Bought Together */}
//         <div className={styles.fbt}>
//           <h3>Frequently Bought Together</h3>
//           <div className={styles.fbtItems}>
//             <div>
//               <img src={mainImage} alt={product.name} />
//               <p>₹{product.price}</p>
//             </div>

//             {frequentlyBought.length > 0 &&
//               frequentlyBought.map((fbProduct, i) => (
//                 <React.Fragment key={fbProduct._id}>
//                   <span>+</span>
//                   <div
//                     style={{ cursor: "pointer" }}
//                     onClick={() => navigate(`/product/${fbProduct._id}`)}
//                   >
//                     <img
//                       src={
//                         fbProduct.images?.[0]?.startsWith("http")
//                           ? fbProduct.images[0]
//                           : `http://localhost:5000/${fbProduct.images?.[0]}`
//                       }
//                       alt={fbProduct.name}
//                     />
//                     <p>₹{fbProduct.price}</p>
//                   </div>
//                 </React.Fragment>
//               ))}
//           </div>
//           <button className={styles.addBothBtn} onClick={addBothToCart}>
//            Add Both to Cart
//           </button>

//         </div>

//         {/*  Similar Products */}
//         <div className={styles.similarProducts}>
//           <h3>Similar Products</h3>
//           <div className={styles.similarGrid}>
//             {similarProducts.map((sp) => (
//               <div key={sp._id} className={styles.similarCard}>
//                 <img
//                   src={
//                     sp.images?.[0]?.startsWith("http")
//                       ? sp.images[0]
//                       : `http://localhost:5000/${sp.images?.[0]}`
//                   }
//                   alt={sp.name}
//                   onClick={() => navigate(`/products/${sp._id}`)}
//                   style={{ cursor: "pointer" }}
//                 />
//                 <p>{sp.name}</p>
//                 <strong>₹{sp.price}</strong>

//                 <div className={styles.similarActions}>
//   <button
//     className={styles.wishlistIcon}
//     onClick={() => setVariantPopup({ product: sp, action: "wishlist" })}
//   >
//     <FaHeart />
//   </button>

//   <button
//     className={styles.cartBtn}
//     onClick={() => setVariantPopup({ product: sp, action: "cart" })}
//   >
//     <FaShoppingCart /> Cart
//   </button>

//   <button
//     className={styles.buyBtn}
//     onClick={() => setVariantPopup({ product: sp, action: "cart" })}
//   >
//     Buy Now
//   </button>
// </div>

//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* RIGHT SECTION */}
//       <div className={styles.rightSection}>
//         <div className={styles.priceRight}>₹{product.price}</div>
//         <h4 className={styles.deliveryHeading}>Delivery Options</h4>
//         <div className={styles.deliveryCheck}>
//           <input
//             type="text"
//             placeholder="Enter pincode"
//             value={pincode}
//             onChange={(e) => setPincode(e.target.value)}
//           />
//           <button onClick={checkDelivery}>Check</button>
//         </div>
//         {deliveryMsg && <p className={styles.deliveryMsg}>{deliveryMsg}</p>}
//         <p>
//   Ships from: <strong>Citimart</strong>
// </p>
// <p>
//   Sold by: <strong>{product.vendor_name || "Vendor"}</strong>
// </p>
// <p>
//   Payment: <strong>Secure transaction</strong>
// </p>

// {/* Inline message when buttons are disabled */}
// {disableButtons() && (
//   <p className={styles.selectionMessage}>{getSelectionMessage()}</p>
// )}

// {/* Stock Info & Actions */}
// {(() => {
//   const selectedVariant = product.variants?.find(
//     (v) =>
//       (!isSizeCategory(product) || v.size === selectedSize) &&
//       (!selectedColor || v.color === selectedColor)
//   );

//   if (selectedVariant) {
//     if (selectedVariant.stock > 0) {
//       return (
//         <>
//           <p style={{ color: "green", fontWeight: "bold" }}>In Stock</p>
//           <button
//             className={styles.addToCart}
//             onClick={handleAddToCart}
//             disabled={disableButtons()}
//           >
//             <FaShoppingCart /> Add to Cart
//           </button>
//           <button
//             className={styles.buyNow}
//             onClick={handleBuyNow}
//             disabled={disableButtons()}
//           >
//             Buy Now
//           </button>
//         </>
//       );
//     } else {
//       return (
//         <>
//           <p style={{ color: "red", fontWeight: "bold" }}>Out of Stock</p>
//           <button
//               className={styles.notifyBtn}
//               onClick={handleNotifyMe}
//              >
//              Notify Me
//            </button>

//         </>
//       );
//     }
//   } else {
//     // No variant selected yet → show nothing
//     return (
//       <p style={{ color: "gray", fontWeight: "bold" }}>
//         Select options to see stock
//       </p>
//     );
//   }
// })()}



//        <label className={styles.giftOption}>
//        <input
//         type="checkbox"
//         checked={giftOption}
//         onChange={(e) => setGiftOption(e.target.checked)}
//        />
//        {giftOption ? "Remove gift options" : "Add gift options"}
//        </label>

//       {giftOption && (
//       <div className={styles.giftBox}>
//       <textarea
//       placeholder="Enter a gift message (optional)"
//       value={giftMessage}
//       onChange={(e) => setGiftMessage(e.target.value)}
//       />
//       <p>🎁 Gift wrap will be applied at checkout</p>
//      </div>
//      )}
 


//         <button className={styles.wishlistBtn} onClick={handleWishlist}>
//           <FaHeart /> Wishlist
//         </button>
//       </div>
//     </div>
//   );
// };

// export default ProductDetail;


import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import VariantSelector from "../pages/Variantselector"; 
import styles from "./ProductDetail.module.css";
import {
  FaHeart,
  FaShoppingCart,
  FaShareAlt,
  FaStar,
  FaTag,
  FaPercent,
  FaCreditCard,
} from "react-icons/fa";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [mainImage, setMainImage] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [pincode, setPincode] = useState("");
  const [deliveryMsg, setDeliveryMsg] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [frequentlyBought, setFrequentlyBought] = useState([]);
  const [variantPopup, setVariantPopup] = useState(null); 
  const [fbtQueue, setFbtQueue] = useState([]); 
  const [offers, setOffers] = useState([]);
  // For popup variant selections (do NOT touch main product selection)
  const [popupSelectedColor, setPopupSelectedColor] = useState("");
  const [popupSelectedSize, setPopupSelectedSize] = useState("");
  const [activeTab, setActiveTab] = useState("details"); // "details" | "reviews"
  const [reviews, setReviews] = useState([]);
  const [giftOption, setGiftOption] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");

  const customer = JSON.parse(localStorage.getItem("customer"));

  useEffect(() => {
    fetch(`http://localhost:5000/api/products/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.product) {
          setProduct(data.product);
          const firstImage = data.product.images?.[0];
          setMainImage(
            firstImage?.startsWith("http")
              ? firstImage
              : `http://localhost:5000/${firstImage}`
          );
         
          /*Similar Products*/
          fetch("http://localhost:5000/api/products")
            .then((res) => res.json())
            .then((all) => {
              if (all.products) {
                const filtered = all.products
                  .filter(
                    (p) =>
                      p._id !== data.product._id &&
                      p.category === data.product.category
                  )
                  .slice(0, 4);
                setSimilarProducts(filtered);
              }
            });

          // Fetch Frequently Bought Together products
          fetch(
            `http://localhost:5000/api/products/frequently-bought/${id}`
          )
            .then((res) => res.json())
            .then((fbData) => {
              if (fbData.relatedProducts) {
                setFrequentlyBought(fbData.relatedProducts);
              }
            })
            .catch((err) =>
              console.error("Error fetching frequently bought products:", err)
            );
        }
      });
  }, [id]);
    
  // 🏷️ Fetch offers for this product (with auth header)
  useEffect(() => {
    const fetchProductOffers = async () => {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      try {
        const res = await fetch(`http://localhost:5000/api/products/${id}/offers`, { headers });
        const data = await res.json();
        if (data.offers) {
          setOffers(data.offers);
        } else {
          setOffers([]);
        }
      } catch (err) {
        console.error("Error fetching offers:", err);
        setOffers([]);
      }
    };

    fetchProductOffers();
  }, [id]);

  useEffect(() => {
    fetch(`http://localhost:5000/customer/reviews/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.reviews) setReviews(data.reviews);
      })
      .catch((err) => console.error("Error fetching reviews:", err));
  }, [id]);

  const formatOfferText = (offer) => {
    if (offer.type === "bogo") return "Buy 1 Get 1 Free 🎉";
    if (offer.type === "discount") return `${offer.discount}% Off`;
    return offer.title || "Special Offer";
  };

  // ✅ Add to Cart API
  const addToCartAPI = async (productId, size, color) => {
    if (!customer) {
      navigate("/login");
      return false;
    }

    // CHANGE 6 — addToCartAPI validation
    const productToCheck = productId === product._id ? product : variantPopup?.product;

    if (isSizeCategory(productToCheck)) {
      if (!size || !color) {
        alert("Please select both size and color");
        return false;
      }
      // Verify the exact combo exists
     const comboExists = productToCheck?.variants?.find(
        v => v.size === size && 
             ((v.colorName || v.color) === color || v.color === color)
      );
      if (!comboExists) {
        alert("This size and color combination is not available");
        return false;
      }
    }

    try {
      const res = await fetch("http://localhost:5000/customer/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${customer.token}`,
        },
        body: JSON.stringify({
          customer_id: customer.id,
          product_id: productId,
          size: isSizeCategory(productToCheck) ? size : "N/A",
          color: color || "N/A",
          quantity,
          // 🎁 Gift fields
          gift_option: giftOption,
          gift_message: giftMessage.trim() || null,
        }),
      });

      const data = await res.json();
      if (data.message === "Added to cart") {
        window.dispatchEvent(new Event("citimart:counts-changed"));
        alert("✅ Added to Cart!");
        fetchProductDetails(); 
        return true;
      } else {
        alert(`❌ ${data.error || "Failed to add to cart"}`);
        return false;
      }
    } catch {
      alert("Error adding to cart");
      return false;
    }
  };

  // ✅ Add to Wishlist API
  const addToWishlistAPI = async (productId, size, color) => {
    if (!customer) {
      navigate("/login");
      return false;
    }

    const productToCheck = productId === product._id ? product : variantPopup?.product;

    // Validation
    if (
      (isSizeCategory(productToCheck) && !size) || 
      (!isSizeCategory(productToCheck) && !color)
    ) {
      alert("Please select required options");
      return false;
    }

    try {
      const res = await fetch("http://localhost:5000/customer/wishlist/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${customer.token}`,
        },
        body: JSON.stringify({
          customer_id: customer.id,
          product_id: productId,
          size: isSizeCategory(productToCheck) ? size : "N/A",
          color: color || "N/A",
        }),
      });

      const data = await res.json();
      if (data.message === "Added to wishlist") {
        window.dispatchEvent(new Event("citimart:counts-changed"));
        alert("✅ Added to Wishlist!");
        return true;
      } else {
        alert(`❌ ${data.error || "Failed to add to wishlist"}`);
        return false;
      }
    } catch {
      alert("Error adding to wishlist");
      return false;
    }
  };

  const isSizeCategory = (product) => {
    if (!product) return false;
    if (product.category === "Clothing") return true;
    if (product.category === "Handmade" && product.subcategory === "Jewelry") return true;
    return false;
  };

  const handleAddToCart = () => 
    addToCartAPI(product._id, selectedSize, selectedColor);

  const handleBuyNow = () => {
    if (disableButtons()) {
      alert("Please select an available size and color combination");
      return;
    }

    const selectedVariant = getSelectedVariant();
    const availableStock = selectedVariant
      ? Number(selectedVariant.stock?.$numberInt ?? selectedVariant.stock ?? 0)
      : null;
    if (availableStock !== null && availableStock < quantity) {
      alert(`Only ${availableStock} item(s) available`);
      return;
    }

    const subtotal = product.price * quantity;
    const discountOffer = offers.find(o => o.type === 'discount');
    const discount = discountOffer ? (subtotal * discountOffer.discount / 100) : 0;
    const discountedTotal = subtotal - discount;
    const deliveryFee = discountedTotal > 500 ? 0 : 50;
    const giftWrapFee = giftOption ? 50 : 0;
    const finalTotal = discountedTotal + deliveryFee + giftWrapFee;

    navigate("/checkout", {
      state: {
        checkoutMode: "buyNow",
        cartItems: [{
          product,
          quantity,
          size: selectedSize || "N/A",
          color: selectedColor || "N/A",
          giftMessage,
          isGift: giftOption,
        }],
        isGift: giftOption,
        giftMessage,
        totals: { subtotal, discount, deliveryFee, giftWrapFee, finalTotal },
      },
    });
  };

  const fetchProductDetails = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/products/${id}`);
      const data = await res.json();
      if (data.product) {
        setProduct(data.product);
        const firstImage = data.product.images?.[0];
        setMainImage(firstImage?.startsWith("http") ? firstImage : `http://localhost:5000/${firstImage}`);
      }
    } catch (err) {
      console.error("Error fetching product:", err);
    }
  };

  useEffect(() => {
    fetchProductDetails();
    const interval = setInterval(fetchProductDetails, 30000);
    return () => clearInterval(interval);
  }, [id]);

  const handleWishlist = async () => {
    const added = await addToWishlistAPI(product._id, selectedSize, selectedColor);
    if (added) {
      console.log("Wishlist updated!"); 
    }
  };

  const checkDelivery = () => {
    if (pincode.length !== 6) {
      setDeliveryMsg("Enter a valid pincode");
    } else {
      setDeliveryMsg("Delivery available in 3-5 days 🚚");
    }
  };

  const addBothToCart = async () => {
    if (!customer) return navigate("/login");

    const requiresSize = 
      product.category?.toLowerCase() === "clothing" ||
      (product.category?.toLowerCase() === "handmade" && 
       product.subcategory?.toLowerCase() === "jewelry");

    if (requiresSize) {
      if (!selectedSize || !selectedColor) {
        alert("Please select both size and color before adding to cart.");
        return;
      }
    } else {
      if (!selectedColor) {
        alert("Please select a color before adding to cart.");
        return;
      }
    }

    try {
      await addToCartAPI(product._id, selectedSize, selectedColor);

      if (frequentlyBought.length > 0) {
        setVariantPopup({ product: frequentlyBought[0], action: "cart" });
      } else {
        alert("Product added to cart successfully!");
      }
    } catch (error) {
      console.error("Error adding both to cart:", error);
    }
  };

  const handleNotifyMe = async () => {
    if (!customer) {
      navigate("/login");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/customer/notify-me", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_id: customer.id,
          product_id: product._id,
          customer_email: customer.email,
        }),
      });

      const data = await res.json();
      if (data.message) {
        alert("📩 " + data.message);
      } else {
        alert("❌ Failed to subscribe for notification");
      }
    } catch (err) {
      console.error("Notify Me error:", err);
      alert("Error subscribing for notification");
    }
  };

  // CHANGE 2 — getSelectedVariant helper (exact match only)
  // const getSelectedVariant = () => {
  //   if (!product?.variants) return null;
  //   return product.variants.find(v => {
  //     const sizeMatch  = !isSizeCategory(product) || v.size  === selectedSize;
  //     const colorMatch = !selectedColor || v.color === selectedColor;
  //     return sizeMatch && colorMatch;
  //   }) || null;
  // };


  const getSelectedVariant = () => {
    if (!product?.variants) return null;
    return product.variants.find(v => {
      const sizeMatch = !isSizeCategory(product) || v.size === selectedSize;
      // Match against colorName OR color field (handles old + new products)
      const colorMatch = !selectedColor || 
        (v.colorName || v.color || "") === selectedColor ||
        v.color === selectedColor;
      return sizeMatch && colorMatch;
    }) || null;
  };

  // CHANGE 1 — disableButtons uses getSelectedVariant
  const disableButtons = () => {
    if (!product) return true;

    const match = getSelectedVariant();

    if (isSizeCategory(product)) {
      if (!selectedSize || !selectedColor) return true;
      return !match; // combo doesn't exist in variants
    }

    const hasColors = product.variants?.some(v => v.color);
    if (hasColors && !selectedColor) return true;
    return false;
  };

  // CHANGE 5 — disablePopupButtons with exact-match check
  const disablePopupButtons = (p) => {
    if (!p) return true;

    if (isSizeCategory(p)) {
      if (!popupSelectedSize || !popupSelectedColor) return true;
      // Check that the exact combo exists in this product's variants
      const match = p.variants?.find(
        v => v.size === popupSelectedSize && 
             ((v.colorName || v.color) === popupSelectedColor || v.color === popupSelectedColor)
      );
      return !match;
    }

    return p.variants?.some(v => v.color) ? !popupSelectedColor : false;
  };

  const getPopupSelectionMessage = (p) => {
    if (!p) return "";

    if (isSizeCategory(p)) {
      if (!popupSelectedSize && !popupSelectedColor) return "Please select size and color";
      if (!popupSelectedSize) return "Please select a size";
      if (!popupSelectedColor) return "Please select a color";
    } else {
      if (p.variants?.some(v => v.color) && !popupSelectedColor) return "Please select a color";
    }
    return "";
  };

  // CHANGE 3 — getSelectionMessage with invalid combo message
  const getSelectionMessage = () => {
    if (!product) return "";

    if (isSizeCategory(product)) {
      if (!selectedSize && !selectedColor) return "Please select size and color to continue";
      if (!selectedSize) return "Please select a size to continue";
      if (!selectedColor) return "Please select a color to continue";
      // Both selected but no matching variant
      if (!getSelectedVariant()) return "This size & color combination is not available";
    } else {
      if (product.variants?.some(v => v.color) && !selectedColor) {
        return "Please select a color to continue";
      }
    }
    return "";
  };

  const getFinalPrice = () => {
    if (!product) return 0;

    let price = product.price;

    const discountOffer = offers.find(o => o.type === "discount");
    if (discountOffer) {
      price = price - (price * discountOffer.discount / 100);
    }

    return Math.round(price);
  };

  const reviewCount = reviews.length;
  const averageRating =
    reviewCount > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1)
      : 0;

  if (!product) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.amazonLayout}>
      {/* LEFT SECTION */}
      <div className={styles.leftSection}>
        <div className={styles.imageGallery}>
          <div className={styles.thumbnails}>
            {product.images?.map((img, i) => {
              const url = img.startsWith("http")
                ? img
                : `http://localhost:5000/${img}`;
              return (
                <img
                  key={i}
                  src={url}
                  onClick={() => setMainImage(url)}
                  className={mainImage === url ? styles.activeThumb : ""}
                  alt=""
                />
              );
            })}
          </div>
          <div className={styles.mainImage}>
            <img src={mainImage} alt={product.name} />
            <button
              className={styles.shareIcon}
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert("Product link copied!");
              }}
            >
              <FaShareAlt />
            </button>
          </div>
        </div>
      </div>

      {/* MIDDLE SECTION */}
      <div className={styles.middleSection}>
        <h2 className={styles.title}>{product.name}</h2>
        <div className={styles.vendor}>
          <h3>Brand: {product.brand}</h3>
        </div>

        <div className={styles.rating}>
          <span className={styles.star}>
            <FaStar /> {averageRating}
          </span>
          <span className={styles.reviewCount}>
            {reviewCount} {reviewCount === 1 ? "rating" : "ratings"}
          </span>
        </div>

        <div className={styles.priceBlock}>
          <span className={styles.currentPrice}>₹{getFinalPrice()}</span>

          {product.discount > 0 && (
            <>
              <span className={styles.originalPrice}>
                ₹{(product.price / (1 - product.discount / 100)).toFixed(0)}
              </span>
              <span className={styles.discount}>{product.discount}% OFF</span>
            </>
          )}
        </div>

        <div className={styles.couponBox}>
          <FaTag /> Apply ₹50 coupon & save extra!
        </div>

        <div className={styles.offersBox}>
          <h4>Available Offers:</h4>
          <ul>
            {offers.length > 0 ? (
              offers.map((offer) => (
                <li key={offer._id}>
                  <FaPercent /> {offer.title || `${offer.discount}% Off`}
                </li>
              ))
            ) : (
              <>
                <li><FaPercent /> Get 10% cashback on UPI payments</li>
                <li><FaPercent /> Flat ₹100 OFF on your first order</li>
                <li><FaPercent /> Buy 2 get 5% OFF, Buy 3 get 10% OFF</li>
              </>
            )}
          </ul>
        </div>

        {/* VARIANTS SECTION*/} 
        <VariantSelector
  product={product}
  selectedSize={selectedSize}
  setSelectedSize={setSelectedSize}
  selectedColor={selectedColor}
  setSelectedColor={setSelectedColor}
  isSizeCategory={isSizeCategory(product)}
/>

        <div className={styles.tabs}>
          <div
            className={`${styles.tabItem} ${activeTab === "details" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("details")}
          >
            Details
          </div>
          <div
            className={`${styles.tabItem} ${activeTab === "reviews" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("reviews")}
          >
            Reviews ({reviews.length})
          </div>
        </div>

        <div className={styles.tabContent}>
          {activeTab === "details" && (
            <div>
              <p>{product.description}</p>
              <ul>
                {product.specifications?.map((spec, i) => (
                  <li key={i}>
                    <strong>{spec.label}:</strong> {spec.value}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ===== Reviews Tab ===== */}
          {activeTab === "reviews" && (
            <div className={styles.reviewsContainer}>
              {/* ⭐ Rating Summary Section */}
              <div className={styles.ratingSummary}>
                <div className={styles.avgRating}>
                  <h2>{(reviews.reduce((sum, r) => sum + r.rating, 0) / (reviews.length || 1)).toFixed(1)}</h2>
                  <p>out of 5</p>
                  <span>{reviews.length} Ratings</span>
                </div>
                <div className={styles.ratingBars}>
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = reviews.filter((r) => r.rating === star).length;
                    const percent = (count / (reviews.length || 1)) * 100;
                    return (
                      <div key={star} className={styles.ratingRow}>
                        <span>{star}★</span>
                        <div className={styles.progressBar}>
                          <div style={{ width: `${percent}%` }}></div>
                        </div>
                        <span>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 📝 Reviews List */}
              <div className={styles.reviewList}>
                {reviews.length === 0 ? (
                  <p className={styles.noReviews}>No reviews yet. Be the first to review!</p>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev._id} className={styles.reviewCard}>
                      <div className={styles.reviewHeader}>
                        <div className={styles.avatar}>
                          {rev.customer_name ? rev.customer_name[0].toUpperCase() : "A"}
                        </div>
                        <div>
                          <strong>{rev.customer_name || "Anonymous"}</strong>
                          <div className={styles.reviewRating}>
                            {Array.from({ length: rev.rating || 0 }).map((_, i) => (
                              <FaStar key={i} color="#f5c518" />
                            ))}
                          </div>
                        </div>
                        <small className={styles.reviewDate}>
                          {rev.created_at &&
                            new Date(rev.created_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                        </small>
                      </div>

                      {rev.review && <p className={styles.reviewText}>{rev.review}</p>}

                      {rev.image && (
                        <div className={styles.reviewImageWrapper}>
                          <img src={rev.image} alt="Review" className={styles.reviewImage} />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {variantPopup && (
          <div className={styles.variantPopup}>
            <div className={styles.popupContent}>
              <h3>Select Options for {variantPopup.product.name}</h3>

              {/* Sizes */}
              {isSizeCategory(variantPopup.product) && (
                <div className={styles.sizeList}>
                  {[...new Set(variantPopup.product.variants.map(v => v.size).filter(Boolean))].map(size => (
                    <button
                      key={size}
                      className={popupSelectedSize === size ? styles.selected : ""}
                      onClick={() => setPopupSelectedSize(popupSelectedSize === size ? "" : size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              )}

              {/* Colors */}
              <div className={styles.colorList}>
                {[...new Set(variantPopup.product.variants.map(v => v.color).filter(Boolean))].map(color => (
                  <button
                    key={color}
                    style={{ backgroundColor: color }}
                    className={popupSelectedColor === color ? styles.selectedColor : ""}
                    onClick={() => setPopupSelectedColor(popupSelectedColor === color ? "" : color)}
                  />
                ))}
              </div>

              <div className={styles.popupActions}>
                <button
                  onClick={async () => {
                    if (variantPopup.action === "cart") {
                      await addToCartAPI(variantPopup.product._id, popupSelectedSize, popupSelectedColor);
                    } else {
                      await addToWishlistAPI(variantPopup.product._id, popupSelectedSize, popupSelectedColor);
                    }

                    // 🔄 If it's part of FBT queue → move to next product
                    if (variantPopup.from === "fbt") {
                      const nextQueue = fbtQueue.slice(1);
                      setFbtQueue(nextQueue);

                      if (nextQueue.length > 0) {
                        setVariantPopup({
                          product: nextQueue[0],
                          action: "cart",
                          from: "fbt"
                        });
                        return;
                      }
                    }

                    // Close popup when finished
                    setPopupSelectedSize("");
                    setPopupSelectedColor("");
                    setVariantPopup(null);
                  }}
                  disabled={disablePopupButtons(variantPopup.product)}
                >
                  Confirm
                </button>

                <button onClick={() => setVariantPopup(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Frequently Bought Together */}
        <div className={styles.fbt}>
          <h3>Frequently Bought Together</h3>
          <div className={styles.fbtItems}>
            <div>
              <img src={mainImage} alt={product.name} />
              <p>₹{product.price}</p>
            </div>

            {frequentlyBought.length > 0 &&
              frequentlyBought.map((fbProduct, i) => (
                <React.Fragment key={fbProduct._id}>
                  <span>+</span>
                  <div
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(`/product/${fbProduct._id}`)}
                  >
                    <img
                      src={
                        fbProduct.images?.[0]?.startsWith("http")
                          ? fbProduct.images[0]
                          : `http://localhost:5000/${fbProduct.images?.[0]}`
                      }
                      alt={fbProduct.name}
                    />
                    <p>₹{fbProduct.price}</p>
                  </div>
                </React.Fragment>
              ))}
          </div>
          <button className={styles.addBothBtn} onClick={addBothToCart}>
            Add Both to Cart
          </button>
        </div>

        {/* Similar Products */}
        <div className={styles.similarProducts}>
          <h3>Similar Products</h3>
          <div className={styles.similarGrid}>
            {similarProducts.map((sp) => (
              <div key={sp._id} className={styles.similarCard}>
                <img
                  src={
                    sp.images?.[0]?.startsWith("http")
                      ? sp.images[0]
                      : `http://localhost:5000/${sp.images?.[0]}`
                  }
                  alt={sp.name}
                  onClick={() => navigate(`/products/${sp._id}`)}
                  style={{ cursor: "pointer" }}
                />
                <p>{sp.name}</p>
                <strong>₹{sp.price}</strong>

                <div className={styles.similarActions}>
                  <button
                    className={styles.wishlistIcon}
                    onClick={() => setVariantPopup({ product: sp, action: "wishlist" })}
                  >
                    <FaHeart />
                  </button>

                  <button
                    className={styles.cartBtn}
                    onClick={() => setVariantPopup({ product: sp, action: "cart" })}
                  >
                    <FaShoppingCart /> Cart
                  </button>

                  <button
                    className={styles.buyBtn}
                    onClick={() => setVariantPopup({ product: sp, action: "cart" })}
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className={styles.rightSection}>
        <div className={styles.priceRight}>₹{product.price}</div>
        <h4 className={styles.deliveryHeading}>Delivery Options</h4>
        <div className={styles.deliveryCheck}>
          <input
            type="text"
            placeholder="Enter pincode"
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
          />
          <button onClick={checkDelivery}>Check</button>
        </div>
        {deliveryMsg && <p className={styles.deliveryMsg}>{deliveryMsg}</p>}
        <p>
          Ships from: <strong>Citimart</strong>
        </p>
        <p>
          Sold by: <strong>{product.vendor_name || "Vendor"}</strong>
        </p>
        <p>
          Payment: <strong>Secure transaction</strong>
        </p>

        {/* Inline message when buttons are disabled */}
        {(disableButtons() || !getSelectedVariant()) && (
          <p className={styles.selectionMessage}>{getSelectionMessage()}</p>
        )}

        {/* CHANGE 4 — Stock Info & Actions (exact match, $numberInt safe, combo check) */}
        {(() => {
          // Use getSelectedVariant() — exact match only
          const selectedVariant = getSelectedVariant();

          // Nothing selected yet
          const selectionNeeded = isSizeCategory(product)
            ? (!selectedSize || !selectedColor)
            : (product.variants?.some(v => v.color) ? !selectedColor : false);

          if (selectionNeeded) {
            return (
              <p style={{ color: "gray", fontWeight: "bold" }}>
                Select options to see stock
              </p>
            );
          }

          // Selection made but no matching variant (invalid combo)
          if (!selectedVariant) {
            return (
              <p style={{ color: "#ef4444", fontWeight: "bold" }}>
                ⚠️ This combination is not available
              </p>
            );
          }

          // Get stock safely (handles $numberInt format)
          let stockVal = selectedVariant.stock;
          if (typeof stockVal === "object" && stockVal.$numberInt) {
            stockVal = parseInt(stockVal.$numberInt);
          }
          stockVal = parseInt(stockVal || 0);

          if (stockVal > 0) {
            return (
              <>
                <p style={{ color: "green", fontWeight: "bold" }}>
                  ✅ In Stock {stockVal <= 5 ? `— Only ${stockVal} left!` : ""}
                </p>
                <button
                  className={styles.addToCart}
                  onClick={handleAddToCart}
                  disabled={disableButtons()}
                >
                  <FaShoppingCart /> Add to Cart
                </button>
                <button
                  className={styles.buyNow}
                  onClick={handleBuyNow}
                  disabled={disableButtons()}
                >
                  Buy Now
                </button>
              </>
            );
          } else {
            return (
              <>
                <p style={{ color: "red", fontWeight: "bold" }}>❌ Out of Stock</p>
                <button className={styles.notifyBtn} onClick={handleNotifyMe}>
                  Notify Me
                </button>
              </>
            );
          }
        })()}

        <label className={styles.giftOption}>
          <input
            type="checkbox"
            checked={giftOption}
            onChange={(e) => setGiftOption(e.target.checked)}
          />
          {giftOption ? "Remove gift options" : "Add gift options"}
        </label>

        {giftOption && (
          <div className={styles.giftBox}>
            <textarea
              placeholder="Enter a gift message (optional)"
              value={giftMessage}
              onChange={(e) => setGiftMessage(e.target.value)}
            />
            <p>🎁 Gift wrap will be applied at checkout</p>
          </div>
        )}

        <button className={styles.wishlistBtn} onClick={handleWishlist}>
          <FaHeart /> Wishlist
        </button>
      </div>
    </div>
  );
};

export default ProductDetail;
