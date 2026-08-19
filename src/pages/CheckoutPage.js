import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import styles from './CheckoutPage.module.css';

import { API_BASE } from "../config";
const CheckoutPage = () => {
  const location = useLocation();
  const { 
    cartItems: cartFromState = [], 
    isGift = false, 
    giftMessage = "",
    checkoutMode = "cart"
  } = location.state || {};

  const [cartItems, setCartItems] = useState(cartFromState);

  const [totals, setTotals] = useState({
    subtotal: 0,
    discount: 0,
    deliveryFee: 0,
    giftWrapFee: 0,
    finalTotal: 0
  });

  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [customerInfo, setCustomerInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [appliedOffers, setAppliedOffers] = useState([]);
  const [eligibleOffers, setEligibleOffers] = useState([]);
  const [phone, setPhone] = useState('');
  const navigate = useNavigate();

  const customerId = localStorage.getItem('customer_id');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!customerId || !token) {
      navigate('/login', { replace: true });
      return;
    }

    const loadCheckout = async () => {
      try {
        if (checkoutMode === 'buyNow' && cartFromState.length) {
          setCartItems(cartFromState);
          calculateTotals(cartFromState);
        } else {
          await fetchCart();
        }
        await fetchCustomerInfo();
      } finally {
        setLoading(false);
      }
    };

    loadCheckout();
  }, [customerId, token, checkoutMode, navigate]);

  const normalizedItems = (items) => items.map(item => ({
    product_id: item.product?._id || item.product_id,
    quantity: Number(item.quantity || 1),
    size: item.size || "N/A",
    color: item.color || "",
    isGift: Boolean(item.isGift || item.gift_option),
    giftMessage: item.giftMessage || item.gift_message || ""
  }));

  const calculateTotals = async (items, code = couponCode) => {
    if (!items.length) return;
    try {
      const res = await fetch(`${API_BASE}/customer/checkout-quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          customer_id: customerId,
          checkout_mode: checkoutMode,
          items: normalizedItems(items),
          coupon_code: code.trim(),
          isGift
        })
      });
      const quote = await res.json();
      if (!res.ok) throw new Error(quote.error || 'Unable to calculate total');
      setTotals({
        subtotal: quote.subtotal,
        discount: quote.discount,
        deliveryFee: quote.delivery_fee,
        giftWrapFee: quote.gift_wrap_fee,
        finalTotal: quote.final_total
      });
      setAppliedOffers(quote.applied_offers || []);
      setEligibleOffers(quote.eligible_offers || []);
      if (code.trim()) {
        const used = (quote.applied_offers || []).some(offer =>
          (quote.eligible_offers || []).some(candidate => candidate.code?.toUpperCase() === code.trim().toUpperCase() && candidate.id === offer.id)
        );
        setOfferMessage(used ? 'Offer applied.' : 'This code is invalid, ineligible, or another offer saves you more.');
      } else {
        setOfferMessage('');
      }
    } catch (error) {
      setOfferMessage(error.message);
    }
  };
  // Fetch cart and calculate totals
  const fetchCart = async () => {
  try {
    const res = await fetch(`${API_BASE}/customer/cart/${customerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || "Unable to load cart");
    // Merge gift info from cart state
    const mergedItems = (data.items || []).map(item => {
      const buyNowItem = cartFromState.find(ci => ci.product?._id === item.product?._id);
      return {
        ...item,
        giftMessage: buyNowItem?.giftMessage || item.gift_message || "",
        isGift: Boolean(buyNowItem?.giftMessage || item.gift_message || item.gift_option),
      };
    });

    setCartItems(mergedItems);

    calculateTotals(mergedItems);

  } catch (err) {
    console.error('Error fetching cart:', err);
  }
};


  // Fetch customer info
  const fetchCustomerInfo = async () => {
    try {
      const res = await fetch(`${API_BASE}/customer/${customerId}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok) {
        setCustomerInfo({
          fullName: data.name,
          email: data.email,
          phone: data.phone || '',
        });
        setPhone(data.phone || '');
      } else {
        console.error("Failed to fetch profile:", data.message);
      }
    } catch (err) {
      console.error('Error fetching customer info:', err);
    }
  };

  // Utility to dynamically load Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (document.getElementById("razorpay-script")) return resolve(true);

      const script = document.createElement("script");
      script.id = "razorpay-script";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Handle order placement
  const handlePlaceOrder = async () => {
    if (placingOrder) return;
    if (!address.trim()) return alert("Please enter delivery address");
    if (!phone.trim()) return alert("Please enter your phone number");
    if (!cartItems.length) return alert("Your cart is empty");
    if (!customerInfo) return alert("Customer info not loaded yet");

    setPlacingOrder(true);

    // COD flow
    if (paymentMethod === "cod") {
      try {
        const res = await fetch(`${API_BASE}/customer/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            customer_id: customerId,
            address,
            phone,
            payment_method: paymentMethod,
            items: cartItems.map(item => ({
  product_id: item.product?._id,
  quantity: Number(item.quantity),
  size: item.size || "N/A",
  color: item.color || "",
  isGift: item.isGift || false,        // ✅ use "isGift" not "gift_option"
  giftMessage: item.giftMessage || ""
})),

            checkout_mode: checkoutMode,
            isGift,
            giftMessage,
            coupon_code: couponCode.trim(),
            discount: totals.discount,
            deliveryFee: totals.deliveryFee,
            giftWrapFee: totals.giftWrapFee,
            amount: totals.subtotal - totals.discount
          }),
        });

        
      const data = await res.json();
      if (res.ok) {
        // Use backend final_amount for alert and navigation
        alert(`${data.message}\nFinal Amount: ₹${data.final_amount}`);

navigate('/order-success', {
  state: {
    total: data.total,
    discount: data.discount,
    deliveryFee: data.delivery_fee,
    giftWrapFee: data.gift_wrap_fee,
    final: data.final_amount, // ✅ match backend
    isGift: data.order_gift?.isGift || false,
    giftMessage: data.order_gift?.giftMessage || ""
  },
});
      } else {
        alert(data.error || data.message || "Checkout failed");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Something went wrong during COD checkout.");
    } finally {
      setPlacingOrder(false);
    }
    return;
  }

    // Razorpay flow
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) return alert("Failed to load Razorpay SDK. Please refresh the page.");

      const orderRes = await fetch(`${API_BASE}/customer/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          customer_id: customerId, checkout_mode: checkoutMode,
          items: normalizedItems(cartItems), coupon_code: couponCode.trim(), isGift
        })
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.id) return alert(orderData.message || "Order creation failed");

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Citimart',
        description: 'Order Payment',
        order_id: orderData.id,
        handler: async (response) => {
          try {
            const verifyRes = await fetch(`${API_BASE}/customer/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                address,
                phone,
                items: cartItems.map(item => ({
                  product_id: item.product?._id,
                  quantity: Number(item.quantity),
                  size: item.size || "N/A",
                  color: item.color || "N/A",
                  isGift: item.isGift || false,
                  giftMessage: item.giftMessage || ""
                })),
                customer_id: customerId,
                checkout_mode: checkoutMode,
                isGift,
                giftMessage,
                coupon_code: couponCode.trim(),
                discount: totals.discount,
                deliveryFee: totals.deliveryFee,
                giftWrapFee: totals.giftWrapFee
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok) {
              alert("Payment successful! Order placed.");
              navigate('/order-success', {
                state: {
                  total: verifyData.total,
                  discount: verifyData.discount,
                  final: verifyData.final_amount,
                },
              });
            } else {
              alert(verifyData.message || "Payment verification failed");
            }
          } catch (err) {
            console.error("Payment verification error:", err);
            alert("Payment verification failed");
          }
        },
        prefill: {
          name: customerInfo.fullName,
          email: customerInfo.email,
          contact: phone,
        },
        theme: { color: "#3399cc" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Razorpay error:", err);
      alert("Payment failed. Please try again.");
    } finally {
      setPlacingOrder(false);
    }
  };

  const showSize = (product) => {
    const category = product.category?.toLowerCase();
    const subcategory = product.subcategory?.toLowerCase();
    return category === 'clothing' || (category === 'handmade' && subcategory === 'jewelry');
  };

  if (loading) return <div className={styles.checkoutPage}>Loading checkout...</div>;

  return (
    <div className={styles.checkoutPage}>
      <h2 className={styles.title}>🛍️ Checkout</h2>

      <div className={styles.checkoutContainer}>
        <div className={styles.left}>
          <h3>Customer Info</h3>
          {customerInfo ? (
            <div className={styles.customerDetails}>
              <p><strong>Name:</strong> {customerInfo.fullName}</p>
              <p><strong>Email:</strong> {customerInfo.email}</p>
              <div className={styles.formGroup}>
                <label><strong><h3>Phone Number:</h3></strong></label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={styles.phoneInput}
                  placeholder="Enter your phone number"
                />
              </div>
            </div>
          ) : <p>Loading customer details...</p>}
          
          <h3>Shipping Address</h3>
          <textarea
            className={styles.addressInput}
            placeholder="Enter your delivery address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={4}
          />

          <h3>Payment Method</h3>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className={styles.paymentSelect}
          >
            <option value="cod">Cash on Delivery</option>
            <option value="upi">UPI</option>
            <option value="card">Credit/Debit Card</option>
          </select>

          <button className={styles.placeOrderBtn} onClick={handlePlaceOrder} disabled={placingOrder}>
            {placingOrder ? "Placing Order..." : "Place Order"}
          </button>
        </div>

        <div className={styles.right}>
          <h3>Order Summary</h3>
          <ul className={styles.itemList}>
            {cartItems.map((item, idx) => (
              <li key={idx} className={styles.summaryItem}>
                <Link to={`/products/${item.product?._id}`}>
                  <img
                    src={item.product?.images?.[0] 
                      ? item.product.images[0].startsWith('http') 
                        ? item.product.images[0] 
                        : `${API_BASE}/${item.product.images[0]}` 
                      : '/images/logo.png'}
                    alt={item.product?.name || ''}
                    className={styles.itemImage}
                  />
                </Link>

                <div className={styles.itemDetails}>
                  <Link to={`/products/${item.product?._id}`} className={styles.itemNameLink}>
                    <p>{item.product?.name}</p>
                  </Link>
                  <small>
                    Qty: {item.quantity}{" "}
                    {showSize(item.product) && item.size && <> | Size: {item.size}</>}
                    {item.color && (
                      <>
                        {" "} | Color:{" "}
                        <span
                          style={{
                            display: 'inline-block',
                            width: '16px',
                            height: '16px',
                            backgroundColor: item.color,
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            verticalAlign: 'middle',
                            marginLeft: '4px',
                          }}
                        ></span>
                      </>
                    )}
                  </small>

                  {item.giftMessage && item.giftMessage.trim() !== "" && (
                    <div className={styles.giftInfo}>
                      🎁 Gift Message: <em>{item.giftMessage}</em>
                    </div>
                  )}

                  <div>₹{item.product?.price} × {item.quantity}</div>
                </div>
              </li>
            ))}
          </ul>
          <div className={styles.offerBox}>
            <label htmlFor="checkout-coupon"><strong>Offer code</strong></label>
            <div className={styles.couponRow}>
              <input id="checkout-coupon" className={styles.couponInput} value={couponCode}
                onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                placeholder="Enter coupon code" />
              <button type="button" onClick={() => calculateTotals(cartItems, couponCode)}>Apply</button>
            </div>
            {offerMessage && <small>{offerMessage}</small>}
            {eligibleOffers.filter(offer => offer.code).length > 0 && (
              <small className={styles.availableOffers}>
                Available: {eligibleOffers.filter(offer => offer.code).map(offer => offer.code).join(', ')}
              </small>
            )}
            {appliedOffers.map(offer => <div key={offer.id} className={styles.appliedOffer}>✓ {offer.title}</div>)}
          </div>

          <hr />
          <div className={styles.totalRow}><span>Subtotal:</span><strong>₹{totals.subtotal}</strong></div>
          <div className={styles.totalRow}><span>Discount:</span><strong>-₹{totals.discount}</strong></div>
          <div className={styles.totalRow}><span>Delivery Fee:</span><strong>₹{totals.deliveryFee}</strong></div>
          {totals.giftWrapFee > 0 && (
            <div className={styles.totalRow}>
              <span>Gift Wrap Fee:</span>
              <strong>₹{totals.giftWrapFee}</strong>
            </div>
          )}
          <hr />
          <div className={styles.totalRow}><span><strong>Final Total:</strong></span><strong>₹{totals.finalTotal}</strong></div>

          {isGift && (
            <div className={styles.giftSummary}>
              <p>🎁 This order is marked as a gift</p>
              {giftMessage && <p><em>Message: {giftMessage}</em></p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
