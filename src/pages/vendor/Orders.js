import React, { useEffect, useState } from 'react';
import styles from './Orders.module.css';

const VendorOrders = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const backendURL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    fetch(`${backendURL}/vendor/my-orders`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.orders)) {
          setOrders(data.orders);
        } else if (Array.isArray(data)) {
          setOrders(data);
        } else {
          setOrders([]);
        }
      })
      .catch((err) => console.error('Failed to fetch vendor orders:', err));
  }, [backendURL]);

  const getImageUrl = (image) => {
    if (!image) return '/images/default-placeholder.png';
    if (typeof image !== 'string') return '/images/default-placeholder.png';
    if (image.startsWith('/uploads/') || image.startsWith('static/uploads')) {
      return `http://localhost:5000/${image.replace(/\\/g, '/')}`;
    }
    if (image.startsWith('http')) return image;
    return `http://localhost:5000/${image}`;
  };

  const handleView = (order) => {
    setSelectedOrder(order);
  };

  const handleUpdate = (orderId) => {
    const newStatus = prompt("Enter new status (Placed, Shipped, Delivered, Cancelled):");
    if (newStatus) {
      fetch(`${backendURL}/vendor/update-order/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })
        .then((res) => res.json())
        .then((data) => {
          alert(data.message || 'Order updated');
          // Refresh orders
          setOrders((prev) =>
            prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
          );
        })
        .catch((err) => console.error('Failed to update order:', err));
    }
  };

  const handleDelete = (orderId) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      fetch(`${backendURL}/vendor/delete-order/${orderId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          alert(data.message || 'Order deleted');
          setOrders((prev) => prev.filter((o) => o._id !== orderId));
        })
        .catch((err) => console.error('Failed to delete order:', err));
    }
  };

  return (
    <div className={styles.orders}>
      <div className={styles.header}>
        <h1>My Orders</h1>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Date</th>
              <th>Items</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length > 0 ? (
              orders.map((order) => (
                <tr key={order._id}>
                  <td>{order.order_id || order._id.substring(0, 8)}</td>
                  <td>{order.customer_name}</td>
                  <td>{order.customer_phone}</td>
                  <td>{order.customer_address}</td>
                  <td>{order.date}</td>
                  <td>
                    <ul className={styles.itemList}>
                      {order.products.map((item, idx) => (
                        <li key={idx} className={styles.item}>
                          <img
                            src={getImageUrl(item.image)}
                            alt={item.name}
                            className={styles.itemImage}
                          />
                          <div>
                            <p>{item.name}</p>
                            <small>Qty: {item.quantity} | Size: {item.size || 'N/A'}</small>
                            <p>₹{item.price}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td>₹{order.vendor_total}</td>
                  <td>
                    <span className={`${styles.payment} ${styles.paid}`}>
                      {order.payment}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.status} ${styles[order.status.toLowerCase()]}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>
  <button onClick={() => handleView(order)} className={`${styles.actionBtn} ${styles.viewBtn}`}>
    View
  </button>
  <button onClick={() => handleUpdate(order._id)} className={`${styles.actionBtn} ${styles.updateBtn}`}>
    Update
  </button>
  <button onClick={() => handleDelete(order._id)} className={styles.deleteBtn}>
    Delete
  </button>
</td>

                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center' }}>
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Order Details</h2>
            <p><strong>Order ID:</strong> {selectedOrder._id}</p>
            <p><strong>Customer:</strong> {selectedOrder.customer_name}</p>
            <p><strong>Phone:</strong> {selectedOrder.customer_phone}</p>
            <p><strong>Address:</strong> {selectedOrder.customer_address}</p>
            <p><strong>Status:</strong> {selectedOrder.status}</p>
            <h3>Items:</h3>
            <ul>
              {selectedOrder.products.map((item, idx) => (
                <li key={idx}>
                  {item.name} - Qty: {item.quantity}, ₹{item.price}
                </li>
              ))}
            </ul>
            <button onClick={() => setSelectedOrder(null)} className={styles.closeBtn}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorOrders;
