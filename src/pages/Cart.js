import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './Cart.module.css';
import { FaHeart, FaRegHeart } from 'react-icons/fa';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [coupon, setCoupon] = useState('');
  const [total, setTotal] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [offers, setOffers] = useState([]);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [removeModal, setRemoveModal] = useState({ visible: false, product: null, size: null, color: null });
  
  const [variantPopup, setVariantPopup] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [isGift, setIsGift] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  // or whatever you want






  const customerId = localStorage.getItem('customer_id');
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  //  FETCH CART ========
  const fetchCart = async () => {
  try {
    const res = await fetch(`http://localhost:5000/customer/cart/${customerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) navigate("/login");
      throw new Error(data.error || "Unable to load cart");
    }
    setCartItems(data.items || []);
    calculateTotal(data.items || []);
    window.dispatchEvent(new Event("citimart:counts-changed"));
  } catch (err) {
    console.error("Error fetching cart:", err);
  }
};


  const fetchOffersOrSimilar = async () => {
  try {
    // Fetch offers
    const res = await fetch(`http://localhost:5000/customer/cart/offers/${customerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setOffers(data.offers || []);

    // Always fetch similar (don’t depend on offers)
    const simRes = await fetch(`http://localhost:5000/customer/cart/similar/${customerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const simData = await simRes.json();
    setSimilarProducts(simData.similar_products || []);

  } catch (err) {
    console.error("Error fetching offers/similar products:", err);
  }
};

  const fetchWishlist = async () => {
    try {
      const res = await fetch(`http://localhost:5000/customer/wishlist/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to load wishlist");
      setWishlist((data.items || []).map(item => item.product?._id).filter(Boolean));
      window.dispatchEvent(new Event("citimart:counts-changed"));
    } catch (err) {
      console.error("Error fetching wishlist:", err);
    }
  };

  const calculateTotal = (items) => {
    let t = 0, count = 0;
    for (const item of items) {
      const price = item.product?.price || 0;
      t += price * item.quantity;
      count += item.quantity;
    }
    setTotal(t);
    setTotalItems(count);
  };

  // ======== CART ACTIONS ========
  const updateQuantity = async (productId, size, color, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      const res = await fetch('http://localhost:5000/customer/cart/update_quantity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ customer_id: customerId, product_id: productId, size, color, quantity: newQuantity }),
      });
      if (res.ok) { await fetchCart(); return true; }
      alert((await res.json()).error);
      return false;
    } catch (err) {
      console.error("Error updating quantity:", err);
    }
  };

  const removeFromCart = async (productId, size, color) => {
    try {
      const res = await fetch('http://localhost:5000/customer/cart/remove_item', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ customer_id: customerId, product_id: productId, size, color }),
      });
      if (res.ok) { await fetchCart(); return true; }
      alert((await res.json()).error);
      return false;
    } catch (err) {
      console.error("Error removing item:", err);
      return false;
    }
  };

  const clearCart = async () => {
    try {
      const res = await fetch(`http://localhost:5000/customer/cart/clear/${customerId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to clear cart');
      setCartItems([]);
      setTotal(0);
      setTotalItems(0);
      window.dispatchEvent(new Event('citimart:counts-changed'));
    } catch (err) {
      alert(err.message || 'Failed to clear cart');
    }
  };

  const addToCart = async (productId, size = null, color = null) => {
    try {
      const res = await fetch(`http://localhost:5000/customer/cart/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ customer_id: customerId, product_id: productId, quantity: 1, size, color }),
      });
      if (res.ok) { await fetchCart(); return true; }
      alert((await res.json()).error);
      return false;
    } catch (err) {
      console.error("Error adding item to cart:", err);
    }
  };

  const addToWishlist = async (productId, size = null, color = null) => {
  try {
    const res = await fetch('http://localhost:5000/customer/wishlist/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ customer_id: customerId, product_id: productId, size, color }),
    });
    if (res.ok) setWishlist(prev => [...prev, productId]);
    else alert((await res.json()).error);
  } catch (err) {
    console.error("Error adding to wishlist:", err);
  }
};


  const removeFromWishlist = async (productId) => {
  try {
    const res = await fetch('http://localhost:5000/customer/wishlist/remove', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ customer_id: customerId, product_id: productId }),
    });
    if (res.ok) {
      setWishlist(prev => prev.filter(id => id !== productId));
    } else {
      const errData = await res.json();
      alert(errData.error || "Failed to remove from wishlist");
    }
  } catch (err) {
    console.error("Error removing from wishlist:", err);
  }
};


  useEffect(() => {
    if (!customerId || !token) { navigate("/login"); return; }
    fetchCart();
    fetchOffersOrSimilar();
    fetchWishlist();
  }, []);

  const getImage = (item) => {
    const img = item.product?.images?.[0];
    return img ? (img.startsWith('http') ? img : `http://localhost:5000${img}`) : '/images/logo.png';
  };

 const handleBuy = () => {
  const cartWithGiftInfo = cartItems.map(item => ({
    ...item,
    isGift: item.isGift || false,
    giftMessage: item.giftMessage || ""
  }));

  navigate('/checkout', {
    state: {
      cartItems: cartWithGiftInfo,
      checkoutMode: 'cart',
      isGift,        // the checkbox at bottom of cart for entire order
      giftMessage,
      totals: {
      subtotal,
      discount,
      deliveryFee,
      giftWrapFee,
      finalTotal,
    }       // message for the entire order
    }
  });
};




  const showSize = (product) => {
    const category = product.category?.toLowerCase();
    const subcategory = product.subcategory?.toLowerCase();
    return category === 'clothing' || (category === 'handmade' && subcategory === 'jewelry');
  };

  const subtotal = total;  // your raw total before any discounts
const discount = total > 2000 ? 100 : 0; // ₹100 off rule

const discountedTotal = subtotal - discount;
const deliveryFee = discountedTotal > 500 ? 0 : 50;

const hasAnyGift = isGift || cartItems.some(item => item.isGift);
const GIFT_WRAP_FEE = 50;
const giftWrapFee = hasAnyGift ? GIFT_WRAP_FEE : 0;




const finalTotal = discountedTotal + deliveryFee + giftWrapFee;

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className={styles.emptyCartContainer}>
        <img src="https://cdn-icons-png.flaticon.com/512/2038/2038854.png" alt="Empty Cart" className={styles.emptyCartImg} />
        <h2>Your cart is empty</h2>
        <Link to="/products" className={styles.shopLink}>Go Shopping</Link>
      </div>
    );
  }
  const confirmRemove = (product, size, color) => {
  setRemoveModal({ visible: true, product, size, color });
};

const handleRemoveItem = async () => {
  if (!removeModal.product) return;
  await removeFromCart(removeModal.product, removeModal.size, removeModal.color);
  setRemoveModal({ visible: false, product: null, size: null, color: null });
};


const handleMoveToWishlist = async () => {
  if (!removeModal.product) return;
  try {
    const addResponse = await fetch('http://localhost:5000/customer/wishlist/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        customer_id: customerId,
        product_id: removeModal.product,
        size: removeModal.size,
        color: removeModal.color
      }),
    });
    const addData = await addResponse.json();
    if (!addResponse.ok) throw new Error(addData.error || 'Unable to add item to wishlist');

    const removed = await removeFromCart(removeModal.product, removeModal.size, removeModal.color);
    if (!removed) throw new Error('Item was wishlisted, but could not be removed from cart');
    window.dispatchEvent(new Event('citimart:counts-changed'));
    setRemoveModal({ visible: false, product: null, size: null, color: null });
  } catch (error) {
    alert(error.message || 'Unable to move item to wishlist');
  }
};


const handleCancel = () => {
  setRemoveModal({ visible: false, product: null, size: null });
};
const isSizeCategory = (product) => {
  if (!product) return false;
  return product.category === 'Clothing' || (product.category === 'Handmade' && product.subcategory === 'Jewelry');
};

const disableButtons = (product) => {
  if (!product) return true;
  if (isSizeCategory(product)) return !selectedSize || !selectedColor;
  return !selectedColor; // color required for other categories
};
const openVariantModal = async (productId) => {
  try {
    const res = await fetch(`http://localhost:5000/api/products/${productId}`);
    const data = await res.json();
    if (data.product) {
      setVariantPopup({ product: data.product });
      setSelectedSize('');
      setSelectedColor('');
    } else {
      alert("Product data not found!");
    }
  } catch (err) {
    console.error("Error fetching product:", err);
  }
};

const openWishlistVariantModal = async (productId) => {
  try {
    const res = await fetch(`http://localhost:5000/api/products/${productId}`);
    const data = await res.json();
    if (data.product) {
      setVariantPopup({ product: data.product, mode: "wishlist" }); // 👈 mark mode
      setSelectedSize('');
      setSelectedColor('');
    } else {
      alert("Product data not found!");
    }
  } catch (err) {
    console.error("Error fetching product:", err);
  }
};




const groupOffersById = (offers) => {
  const grouped = {};
  offers.forEach(item => {
    const offerId = item.offer_id || 'no_offer';
    if (!grouped[offerId]) grouped[offerId] = { 
      offer_name: item.offer_title, 
      offer_type: item.offer_type, // attach type
      products: [] 
    };
    grouped[offerId].products.push({ ...item, offer_type: item.offer_type, offer_name: item.offer_title });
  });
  return Object.values(grouped);
};
const getOfferLabel = (type, discount) => {
  switch (type) {
    case "bogo": return "Buy 1 Get 1 Free";
    case "free_shipping": return "Free Shipping";
    case "flat": return `Flat ₹${discount} Off`;
    case "percent": return `${discount}% Off`;
    case "deal": return "🔥 Deal of the Day";
    case "popup": return "✨ Special Popup Offer";
    case "predefined": return "🎉 Festival/Seasonal Sale";
    case "referral": return "🤝 Refer & Earn";
    case "personalized": return "🎯 Personalized Offer";
    default: return discount ? `${discount}% Off` : "Special Offer";
  }
};

const groupedOffers = groupOffersById(offers);
  return (
    <>
      <div className={styles.cartPage}>
        <div className={styles.cartMain}>
          <h2 className={styles.cartTitle}>🛒 Shopping Cart</h2>
          <div className={styles.cartList}>
            {cartItems.map((item, idx) => (
              <div className={styles.cartItem} key={idx}>
                <Link to={`/products/${item.product?._id}`}>
                  <img src={getImage(item)} alt={item.product?.name} className={styles.productImg} />
                </Link>
                <div className={styles.itemDetails}>
                  <Link to={`/products/${item.product?._id}`} className={styles.itemName}>
                    {item.product?.name}
                  </Link>
                  {showSize(item.product) && <div className={styles.itemSize}>Size: {item.size}</div>}
                  {item.color && (
                  <div className={styles.itemColor}>
                   Color: <span 
                   className={styles.colorBox} 
                   style={{ backgroundColor: item.color }}
                   />
                  </div>
                   )}

                  <div className={styles.itemPrice}>Price: ₹{item.product?.price}</div>
                 <div className={styles.quantityControls}>
  <button 
    onClick={() => updateQuantity(item.product?._id, item.size, item.color, item.quantity - 1)} 
    className={styles.qtyBtn}
    disabled={item.quantity <= 1}
  >
    −
  </button>

  <span className={styles.qtyValue}>{item.quantity}</span>

  <button 
    onClick={() => updateQuantity(item.product?._id, item.size, item.color, item.quantity + 1)} 
    disabled={item.quantity >= item.stock}
    className={styles.qtyBtn}
      // 🚀 Disable when stock reached
  >
    +
  </button>
</div>

                   <button onClick={() => confirmRemove(item.product?._id, item.size, item.color)} className={styles.removeBtn}>
                       Remove
                  </button>
                  {item.stock !== undefined && (
  <div className={styles.stockMsg}>
    {item.stock > 0 
      ? `Only ${item.stock} left in stock` 
      : "Out of stock"}
  </div>
)}

                  <div className={styles.giftSection}>
  <label>
    <input
      type="checkbox"
      className={styles.giftCheckbox} 
      checked={item.isGift || false}
      onChange={(e) => {
        const updated = cartItems.map((ci, i) =>
          i === idx ? { ...ci, isGift: e.target.checked } : ci
        );
        setCartItems(updated);
      }}
    />
    🎁 Mark this item as a gift
  </label>

  {item.isGift && (
    <textarea
      placeholder="Enter gift message"
      value={item.giftMessage || ""}
      onChange={(e) => {
        const updated = cartItems.map((ci, i) =>
          i === idx ? { ...ci, giftMessage: e.target.value } : ci
        );
        setCartItems(updated);
      }}
      className={styles.giftInput}
    />
  )}
</div>


                    {removeModal.visible &&
                    removeModal.product === item.product?._id &&
                    removeModal.size === item.size && (
                    <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                    <h3>What would you like to do?</h3>
                    <div className={styles.modalActions}>
                    <button onClick={handleRemoveItem} className={styles.modalBtnRemove}>Remove Item</button>
                    <button onClick={handleMoveToWishlist} className={styles.modalBtnWishlist}>Move to Wishlist</button>
                    <button onClick={handleCancel} className={styles.modalBtnCancel}>Cancel</button>
                  </div>
                </div>
             </div>
            )}


                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.cartSummary}>
          <div className={styles.summaryBox}>
            <h3 className={styles.summaryTitle}>🧾 Order Summary</h3>
            {cartItems.map((item, idx) => (
              <div key={idx} className={styles.summaryProductRow}>
                <div className={styles.summaryProductInfo}>
                  {item.product?.name} × {item.quantity}
                </div>
                <div className={styles.summaryProductTotal}>₹{item.product?.price * item.quantity}</div>
              </div>
            ))}
            <hr className={styles.divider} />
            <div className={styles.summaryRow}>
              <span>Subtotal ({totalItems} items)</span>
              <span>₹{total}</span>
            </div>
            {total > 2000 && (
              <div className={styles.summaryRow}>
                <span>🎉 ₹100 OFF on big order</span>
                <span className={styles.discount}>− ₹100</span>
              </div>
            )}
            <div className={styles.couponSection}>
              <input type="text" value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="🎁 Enter coupon code (e.g. NEW100)" className={styles.couponInput} />
              <button className={styles.applyBtn}>Apply</button>
            </div>
            <div className={styles.summaryRow}>
              <span>🛵 Delivery</span>
              <span className={deliveryFee === 0 ? styles.freeDelivery : styles.deliveryFee}>
                {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
              </span>
            </div>
            {hasAnyGift && (
  <div className={styles.summaryRow}>
    <span>🎁 Gift Wrap</span>
    <span>₹{giftWrapFee}</span>
  </div>
)}

            <hr className={styles.divider} />
            <div className={styles.summaryTotal}>
              <span className={styles.totalLabel}>💰 Total</span>
              <span className={styles.totalValue}>₹{finalTotal}</span>
            </div>
            <div className={styles.giftSection}>
  <label>
    <input
      type="checkbox"
      className={styles.giftCheckbox} 
      checked={isGift}
      onChange={(e) => setIsGift(e.target.checked)}
    />
    🎁 Mark entire order as a gift
  </label>

  {isGift && (
    <textarea
      placeholder="Enter a message for the recipient"
      value={giftMessage}
      onChange={(e) => setGiftMessage(e.target.value)}
      className={styles.giftInput}
    />
  )}
</div>

            <div className={styles.actions}>
              <button onClick={handleBuy} className={styles.checkoutBtn}> Place Order</button>
              <button onClick={clearCart} className={styles.clearBtn}> Clear Cart</button>
            </div>
            <div className={styles.offerNote}>✨ Use coupon <strong>NEW100</strong> to get extra ₹50 OFF on ₹999+</div>
          </div>
        </div>
      </div>

      {/* Pairs With */}
      {cartItems.some(item => item.product?.pairs_with?.length > 0) && (
        <div className={styles.similarFullWidth}>
         <h3 className={styles.similarSectionTitle}> Pair It Up With</h3>

          <div className={styles.productGrid}>
            {cartItems.flatMap(item =>
              (item.product?.pairs_with_products || []).map(pair => {
                const productId = pair._id;
                const isInWishlist = wishlist.includes(productId);
                return (
                  <div key={productId} className={styles.similarCard}>
                    <Link to={`/products/${productId}`}>
                      <img src={pair.image || '/images/logo.png'} alt={pair.name} className={styles.pairsWithImg} />
                    </Link>
                    <Link to={`/products/${productId}`}>
                      <h4>{pair.name}</h4>
                    </Link>
                    {pair.discount > 0 ? (
                      <p><del>₹{pair.price}</del> <strong>₹{pair.final_price}</strong></p>
                    ) : <p>₹{pair.price}</p>}
                    <div className={styles.similarActions}>
                     <button onClick={() => openVariantModal(pair._id)}>Add to Cart</button>


                    <button
  className={styles.wishlistBtn}
  onClick={() => {
    if (isInWishlist) {
      removeFromWishlist(productId);
    } else {
      openWishlistVariantModal(productId);
    }
  }}
>
  {isInWishlist ? <FaHeart color="red" /> : <FaRegHeart />}
</button>


                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

    {/* 🔥 Offers Section */}
{groupedOffers.length > 0 && (
  <div className={styles.similarFullWidth}>
    <h3>🔥 Offers Just for You</h3>
    {groupedOffers.map((group, idx) => (
      <div key={idx} className={styles.offerGroup}>
        <h4 className={styles.offerTitle}>{group.offer_name}</h4>
        <div className={styles.productGrid}>
          {group.products.map((item) => {
            const productId = item._id || item.product_id;
            const isInWishlist = wishlist.includes(productId);
            return (
              <div key={productId} className={styles.similarCard}>
                <Link to={`/products/${productId}`}>
                  <img src={item.image || item.images?.[0] || '/images/logo.png'} alt={item.name} />
                </Link>
                <div className={styles.cardContent}>
                  <Link to={`/products/${productId}`}><h4>{item.name}</h4></Link>
                  <p>
                    {item.original_price ? (
                      <>
                        <del>₹{item.original_price}</del> <strong>₹{item.discounted_price}</strong>
                      </>
                    ) : (
                      <>₹{item.price}</>
                    )}
                  </p>
                  <p className={styles.brand}>{item.brand}</p>
                </div>

                {/* 🏷️ Show offer type */}
                <div className={styles.offerType}>
                  {getOfferLabel(item.offer_type, item.discount)}
                </div>

                <div className={styles.similarActions}>
                  <button onClick={() => openVariantModal(productId)}>Add to Cart</button>
                  <button
  className={styles.wishlistBtn}
  onClick={() => {
    if (isInWishlist) {
      removeFromWishlist(productId);
    } else {
      openWishlistVariantModal(productId);
    }
  }}
>
  {isInWishlist ? <FaHeart color="red" /> : <FaRegHeart />}
</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    ))}
  </div>
)}


{/* 🛍️ Similar Products Section */}
{similarProducts.length > 0 && (
  <div className={styles.similarFullWidth}>
    <h3>🛍️ You May Also Like</h3>
    <div className={styles.productGrid}>
      {similarProducts.map((item) => {
        const productId = item._id || item.product_id;
        const isInWishlist = wishlist.includes(productId);
        return (
          <div key={productId} className={styles.similarCard}>
            <Link to={`/products/${productId}`}>
              <img src={item.image || item.images?.[0] || '/images/logo.png'} alt={item.name} />
            </Link>
            <Link to={`/products/${productId}`}><h4>{item.name}</h4></Link>
            <p>
              {item.original_price ? (
                <>
                  <del>₹{item.original_price}</del> <strong>₹{item.discounted_price}</strong>
                </>
              ) : (
                <>₹{item.price}</>
              )}
            </p>
            <p className={styles.brand}>{item.brand}</p>
            <div className={styles.similarActions}>
              <button onClick={() => openVariantModal(productId)}>Add to Cart</button>
              <button
  className={styles.wishlistBtn}
  onClick={() => {
    if (isInWishlist) {
      removeFromWishlist(productId);
    } else {
      openWishlistVariantModal(productId);
    }
  }}
>
  {isInWishlist ? <FaHeart color="red" /> : <FaRegHeart />}
</button>

            </div>
          </div>
        );
      })}
    </div>
  </div>
)}

      {variantPopup && (
  <div className={styles.modalOverlay}>
    <div className={styles.variantPopup}>
      <h3>Select Options for {variantPopup.product.name}</h3>

      {/* Sizes */}
      {isSizeCategory(variantPopup.product) && (
        <div className={styles.sizeList}>
          {[...new Set(variantPopup.product.variants.map(v => v.size).filter(Boolean))].map(size => (
            <button
              key={size}
              className={selectedSize === size ? styles.selected : ''}
              onClick={() => setSelectedSize(size)}
            >{size}</button>
          ))}
        </div>
      )}

      {/* Colors */}
      {variantPopup.product.variants?.some(v => v.color) && (
        <div className={styles.colorList}>
          {[...new Set(variantPopup.product.variants.map(v => v.color).filter(Boolean))].map(color => (
            <button
              key={color}
              style={{ backgroundColor: color }}
              className={selectedColor === color ? styles.selectedColor : ''}
              onClick={() => setSelectedColor(color)}
            />
          ))}
        </div>
      )}

      <div className={styles.popupActions}>
        <button
          onClick={async () => {
            if (disableButtons(variantPopup.product)) {
              alert(isSizeCategory(variantPopup.product) ? 'Select size and color' : 'Select color');
              return;
            }
            if (variantPopup.mode === "wishlist") {
  await addToWishlist(variantPopup.product._id, selectedSize, selectedColor);
} else {
  await addToCart(variantPopup.product._id, selectedSize, selectedColor);
}
setVariantPopup(null);

          }}
          disabled={disableButtons(variantPopup.product)}
        >
          Confirm
        </button>
        <button onClick={() => setVariantPopup(null)}>Cancel</button>
      </div>
    </div>
  </div>
)}

    </>
  );
};

export default Cart;
