import React, { useEffect, useState, useRef } from 'react';
import styles from './Orders.module.css';
import jsPDF from "jspdf";


import { API_BASE } from "../config";
const Modal = ({ title, children, onClose }) => {
  return (
    <div
      className={styles.modalBackdrop}
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: 8,
          width: '90%',
          maxWidth: 500,
          padding: 20,
          boxShadow: '0 0 15px rgba(0,0,0,0.3)',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 24,
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [reviewOrder, setReviewOrder] = useState(null);
  const [reviewText, setReviewText] = useState('');
  const token = localStorage.getItem('token');
  const customerId = localStorage.getItem('customer_id');
  const intervalRef = useRef(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE}/customer/orders/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setOrders(data || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Poll every 10 seconds for updates
    intervalRef.current = setInterval(fetchOrders, 10000);

    return () => clearInterval(intervalRef.current);
  }, [customerId, token]);

  
const downloadInvoice = (order) => {
  const doc = new jsPDF();
  const date = new Date(order.created_at).toLocaleString();

  // HEADER
  doc.setFontSize(22);
  doc.setTextColor(30, 60, 90);
  doc.text("CITIMART INVOICE", 105, 20, { align: "center" });

  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(`Order ID: ${order._id}`, 14, 35);
  doc.text(`Date: ${date}`, 14, 42);

  // LINE
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(14, 45, 196, 45);

  // TABLE HEADER
  const startX = 14;
  let y = 52;
  const rowHeight = 10;

  const headers = ["No", "Product", "Size", "Qty", "Price", "Color"];
  const colX = [startX, 24, 100, 120, 135, 155];

  // Header background
  doc.setFillColor(63, 81, 181); // Indigo
  doc.rect(startX - 1, y - 8, 182, rowHeight, "F");

  // Header text
  doc.setFontSize(12);
  doc.setTextColor(255);
  doc.setFont(undefined, "bold");
  headers.forEach((header, i) => doc.text(header, colX[i], y));
  doc.setFont(undefined, "normal");
  doc.setTextColor(0);

  // LINE UNDER HEADER
  y += 2;
  doc.line(startX, y, 196, y);
  y += 8;

  // TABLE ROWS
  order.products.forEach((item, idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(240, 240, 240); // light gray
      doc.rect(startX - 1, y - 7, 182, rowHeight, "F");
    }

    doc.setTextColor(0);
    doc.text(String(idx + 1), colX[0], y);
    doc.text(item.product?.name || "Product", colX[1], y);
    if (item.size) {
  doc.text(item.size, colX[2], y);
}

    doc.text(String(item.quantity), colX[3], y);
    doc.text(`INR.${item.product?.price * item.quantity}`, colX[4], y);

    // Color box
    if (item.color) {
      doc.setFillColor(item.color);
      doc.rect(colX[5], y - 6, 6, 6, "F");
    }

    y += rowHeight;
  });

  y += 5;

 // SUMMARY
doc.setFont(undefined, "bold");
doc.setTextColor(0);
doc.setFontSize(12);
doc.text(`Subtotal: INR.${order.total}`, startX, y);
y += 7;

if (order.discount > 0) {
  doc.text(`Discount: -INR.${order.discount}`, startX, y);
  y += 7;
}

if (order.delivery_fee > 0) {
  doc.text(`Delivery Fee: +INR.${order.delivery_fee}`, startX, y);
  y += 7;
}

if (order.gift_wrap_fee > 0) {
  doc.text(`Gift Wrap Fee: +INR.${order.gift_wrap_fee}`, startX, y);
  y += 7;
}

doc.setFontSize(14);
doc.text(`Total Paid: INR.${order.final}`, startX, y);
y += 10;
doc.setFontSize(12);
doc.text(`Status: ${order.status}`, startX, y);


  // SAVE PDF
  doc.save(`Invoice_${order._id}.pdf`);
};

const StarRating = ({ rating, onChange }) => {
  return (
    <div style={{ display: 'flex', marginBottom: 4 }}>
      {[1,2,3,4,5].map(star => (
        <span
          key={star}
          style={{ cursor: 'pointer', color: star <= rating ? '#FFD700' : '#ccc', fontSize: 20 }}
          onClick={() => onChange(star)}
        >
          ★
        </span>
      ))}
    </div>
  );
};



  const submitReview = async () => {
    if (!reviewText.trim()) {
      alert('Please enter your review before submitting.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/customer/review/${reviewOrder._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ review: reviewText }),
      });

      const data = await res.json();
      if (res.ok) {
        alert('Review submitted successfully!');
        setReviewOrder(null);
        setReviewText('');
      } else {
        alert(data.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error(error);
      alert('Error submitting review');
    }
  };

  return (
    <div className={styles.ordersPage}>
      <h2>📦 My Orders</h2>
      <div className={styles.orderList}>
        {orders.length === 0 ? (
          <div className={styles.empty}>
            <img src="/images/empty-box.png" alt="No Orders" />
            <h2>No orders found</h2>
          </div>
        ) : (
          orders.map((order, idx) => (
            <div className={styles.orderCard} key={idx}>
              <div className={styles.orderHeader}>
                <span><strong>Order ID:</strong> {order._id}</span>
                <span><strong>Date:</strong> {new Date(order.created_at).toLocaleDateString()}</span>
              </div>
              <div className={styles.items}>
                {order.products.map((item, index) => (
                  <div className={styles.item} key={index}>
                    <img src={item.product?.images?.[0] || '/images/logo.png'} alt="Product" />
                    <div>
                      <p><strong>{item.product?.name}</strong></p>
                      <p>
                    {item.size && <>Size: {item.size} |</>}
                     {item.color && (
                     <> Color: <span style={{
                     display: 'inline-block',
                     width: '16px',
                     height: '16px',
                     backgroundColor: item.color,
                     border: '1px solid #ccc',
                     borderRadius: '4px',
                     verticalAlign: 'middle',
                     marginLeft: '4px'
                     }}></span>
                     </>
                     )}
                    </p>

                      <p>Qty: {item.quantity}</p>
                      <p>Price: ₹{item.product?.price}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.orderFooter}>
                <p><strong>Subtotal:</strong> ₹{order.total}</p>
              {order.discount > 0 && <p><strong>Discount:</strong> −₹{order.discount}</p>}
              {order.delivery_fee > 0 && <p><strong>Delivery Fee:</strong> +₹{order.delivery_fee}</p>}
              {order.gift_wrap_fee > 0 && <p><strong>Gift Wrap Fee:</strong> +₹{order.gift_wrap_fee}</p>}
                <p><strong>Final:</strong> ₹{order.final}</p>
                <p><strong>Status:</strong> {order.status}</p>
                <div className={styles.buttonsGroup}>
                  <button
                    className={styles.invoiceBtn}
                    onClick={() => downloadInvoice(order)}
                  >
                    🧾 Download Invoice
                  </button>
                  <button
                    className={styles.trackingBtn}
                    onClick={() => setTrackingOrder(order)}
                  >
                    🚚 Tracking
                  </button>
                  {order.status.toLowerCase() === 'delivered' && (
                  <button
                    className={styles.reviewBtn}
                    onClick={() => setReviewOrder(order)}
                  >
                    ⭐ Review
                  </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Tracking Modal */}
      {trackingOrder && (
        <Modal title={`Tracking Info for Order ${trackingOrder._id}`} onClose={() => setTrackingOrder(null)}>
          <p><strong>Status:</strong> {trackingOrder.status}</p>
          <p><strong>Expected Delivery:</strong> {trackingOrder.expected_delivery || 'N/A'}</p>
          <p><strong>Courier:</strong> {trackingOrder.courier || 'N/A'}</p>
          <button onClick={() => setTrackingOrder(null)} style={{ marginTop: 10 }}>Close</button>
        </Modal>
      )}

      {/* Review Modal */}
{reviewOrder && (
  <Modal title={`Write Reviews for Order ${reviewOrder._id}`} onClose={() => setReviewOrder(null)}>
    {reviewOrder.products.map((item, idx) => (
      <div key={idx} style={{ marginBottom: 16, borderBottom: '1px solid #eee', paddingBottom: 8 }}>
        <p><strong>{item.product?.name}</strong></p>

        {/* Star rating */}
        <StarRating
          rating={item.rating || 0}
          onChange={(r) => {
            const newProducts = [...reviewOrder.products];
            newProducts[idx].rating = r;
            setReviewOrder({ ...reviewOrder, products: newProducts });
          }}
        />

        {/* Review text */}
        <textarea
          rows="3"
          value={item.reviewText || ""}
          onChange={(e) => {
            const newProducts = [...reviewOrder.products];
            newProducts[idx].reviewText = e.target.value;
            setReviewOrder({ ...reviewOrder, products: newProducts });
          }}
          placeholder="Write your review here..."
          style={{ width: '100%', padding: 6, borderRadius: 4, border: '1px solid #ccc' }}
        />

        {/* Optional image upload */}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files[0];
            const newProducts = [...reviewOrder.products];
            newProducts[idx].imageFile = file; // store file temporarily
            setReviewOrder({ ...reviewOrder, products: newProducts });
          }}
          style={{ marginTop: 8 }}
        />
        {item.imageFile && <p>Selected: {item.imageFile.name}</p>}
      </div>
    ))}

    {/* Submit and cancel buttons */}
    <button
      onClick={async () => {
        for (const item of reviewOrder.products) {
          if ((item.reviewText && item.reviewText.trim() !== "") && item.rating) {
            const formData = new FormData();
            formData.append("review", item.reviewText);
            formData.append("rating", item.rating);
            if (item.imageFile) formData.append("image", item.imageFile);

            await fetch(`${API_BASE}/customer/review/${reviewOrder._id}/${item.product._id}`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
              },
              body: formData, // send as multipart/form-data
            });
          }
        }
        alert('Reviews submitted successfully!');
        setReviewOrder(null);
      }}
      style={{ marginRight: 10 }}
    >
      Submit Reviews
    </button>
    <button onClick={() => setReviewOrder(null)}>Cancel</button>
  </Modal>
)}


    
    </div>
  );
};

export default Orders;
