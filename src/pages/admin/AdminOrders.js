import React, { useEffect, useState } from 'react';
import styles from './AdminOrders.module.css';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const backendURL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
   
  // Helper: fetch vendor's business name by ID
const fetchVendorName = async (vendorId) => {
  if (!vendorId) return "Vendor";
  try {
    const res = await fetch(`${backendURL}/vendor/${vendorId}`);
    const data = await res.json();
    return data.business_name || "Vendor";
  } catch (err) {
    console.error("Vendor fetch error:", err);
    return "Vendor";
  }
};

  useEffect(() => {
    fetchOrders();
  }, [backendURL]);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${backendURL}/admin/orders`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await res.json();

     const mappedOrders = await Promise.all(
  data.map(async (order) => {
    const items = order.products || order.order_items || [];

    // Fetch vendor names dynamically if missing
    const uniqueVendors = await Promise.all(
      items.map(async (p) => {
        if (p.added_by === "vendor") {
          const vendorName =
            p.vendor_business_name || (await fetchVendorName(p.vendor_id));
          return `${vendorName} (${p.vendor_id})`;
        }
        return "Admin";
      })
    );

    return {
      _id: order._id,
      order_id: order.order_id || order._id.substring(0, 8),
      customer_name: order.customer_name,
      phone: order.phone,
      address: order.address,
      date: order.date,
      vendors: [...new Set(uniqueVendors)].join(", "),
      products: await Promise.all(
        items.map(async (p) => ({
          name: p.name,
          price: p.price?.$numberDouble || p.price || 0,
          images: p.images || (p.image ? [p.image] : []),
          color: p.color || "",
          size: p.size || "",
          qty: p.qty || p.quantity?.$numberInt || p.quantity || 1,
          category: p.category || "",
          subcategory: p.subcategory || "",
          gift_option: p.gift_option ?? p.isGift ?? false,
          gift_message: p.gift_message ?? p.giftMessage ?? "",
          added_by: p.added_by,
          vendor_id: p.vendor_id,
          vendor_business_name:
            p.vendor_business_name || (await fetchVendorName(p.vendor_id)),
        }))
      ),
      total: order.final_amount?.$numberDouble || order.total || 0,
      payment: order.payment_method || order.payment || "",
      status: order.status,
    };
  })
);



      setOrders(mappedOrders);
      setFilteredOrders(mappedOrders);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  };

  useEffect(() => {
    const filtered = orders.filter((order) => {
      const matchSearch =
        search.trim() === '' ||
        order.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        order.phone.includes(search);

      const matchStatus =
        statusFilter === 'all' || order.status.toLowerCase() === statusFilter;

      return matchSearch && matchStatus;
    });

    setFilteredOrders(filtered);
  }, [search, statusFilter, orders]);

  const maskPhone = (phone) => {
    if (!phone || typeof phone !== 'string') {
      return 'xxxxxx';
    }
    return phone.substring(0, 4) + 'xxxxxx';
  };

  const getImageUrl = (imgPath) => {
    if (!imgPath) return "https://via.placeholder.com/100";
    return imgPath.replace(/\\/g, '/');
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;

    try {
      const res = await fetch(`${backendURL}/admin/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message);
        setOrders(prev => prev.filter(order => order._id !== orderId));
        setFilteredOrders(prev => prev.filter(order => order._id !== orderId));
      } else {
        alert(data.error || "Delete failed");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Something went wrong");
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${backendURL}/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message);
        fetchOrders(); 
      } else {
        alert(data.error || "Update failed");
      }
    } catch (err) {
      console.error("Update error:", err);
      alert("Something went wrong");
    }
  };
   const showSize = (product) => {
  const category = product.category?.toLowerCase();
  const subcategory = product.subcategory?.toLowerCase();
  return category === 'clothing' || (category === 'handmade' && subcategory === 'jewelry');
};

// Helper function to group items by vendor/admin
const groupByVendor = (items) => {
  const groups = {};

  items.forEach((item) => {
    const key =
      item.added_by === "vendor"
        ? `${item.vendor_business_name || "Vendor"} (${item.vendor_id})`
        : "Admin";

    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });

  return groups;
};



  return (
    <div className={styles.orders}>
      <div className={styles.header}>
        <h1>Orders</h1>
        <div className={styles.filters}>
          <input
            type="text"
            placeholder="Search by name or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="placed">Placed</option>
          </select>
        </div>
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
              <th>Vendor</th>
              <th>Vendor ID</th>
              <th>Items</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order._id}>
                <td>{order.order_id}</td>
                <td>{order.customer_name}</td>
                <td>{maskPhone(order.phone)}</td>
                <td>{order.address}</td>
                <td>{order.date}</td>
                <td colSpan="2">{order.vendors}</td>

                <td>
                  <ul className={styles.itemList}>
                    {order.products.map((item, idx) => (
                      <li key={idx} className={styles.item}>
                        <img
                          src={getImageUrl(item.images?.[0])}
                          alt={item.name}
                          className={styles.itemImage}
                        />
                        <div>
                          <p>{item.name}</p>
                          {/* In table */}
<small>
  Qty: {item.qty}
  {showSize(item) && <> | Size: {item.size || "N/A"}</>}
  {item.color && (
    <>
      | Color: <span
        style={{
          display: 'inline-block',
          width: '16px',
          height: '16px',
          backgroundColor: item.color,
          border: '1px solid #ccc',
          borderRadius: '4px',
          verticalAlign: 'middle',
          marginLeft: '4px'
        }}
      ></span>
    </>
  )}
</small>

                          <p>₹{item.price}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </td>
                <td>₹{order.total}</td>
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
                  <div className={styles.actions}>
                    <button
                      className={styles.viewButton}
                      onClick={() => setSelectedOrder(order)}
                    >
                      View
                    </button>
                    <select
  className={styles.statusSelect}
  value={order.status}
  onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
>
  <option value="pending">Pending</option>
  <option value="processing">Processing</option>
  <option value="shipped">Shipped</option>
  <option value="out for delivery">Out for Delivery</option>
  <option value="delivered">Delivered</option>
  <option value="cancelled">Cancelled</option>
</select>

                    <button
                      className={styles.deleteButton}
                      onClick={() => handleDelete(order._id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredOrders.length === 0 && (
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
        <div className={styles.modalOverlay} onClick={() => setSelectedOrder(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
             <h2
    style={{
      color: "#1e293b",
      marginBottom: "1rem",
      borderBottom: "2px solid #e2e8f0",
      paddingBottom: "6px",
    }}
  >
    Order Details — {selectedOrder.order_id}
  </h2>
            
            <p><strong>Customer:</strong> {selectedOrder.customer_name}</p>
            <p><strong>Phone:</strong> {selectedOrder.phone}</p>
            <p><strong>Address:</strong> {selectedOrder.address}</p>
            <p><strong>Status:</strong> {selectedOrder.status}</p>
            <p><strong>Total:</strong> ₹{selectedOrder.total}</p>
            <p><strong>Vendor:</strong> {selectedOrder.vendor_name || "Admin"}</p>
            
           <h3 style={{ marginBottom: "1rem", color: "#1e293b" }}>Products:</h3>

<div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
  {Object.entries(groupByVendor(selectedOrder.products)).map(([vendorName, items]) => (
    <div
      key={vendorName}
      style={{
        background: "#f9fafb",
        borderRadius: "12px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        padding: "1rem 1.2rem",
      }}
    >
      <h4
        style={{
          color: "#0f172a",
          fontSize: "1.05rem",
          fontWeight: 600,
          marginBottom: "0.8rem",
          borderBottom: "2px solid #e2e8f0",
          paddingBottom: "4px",
        }}
      >
        {vendorName === "Admin" ? "🏢 Admin’s Products" : `🏬 ${vendorName}`}
      </h4>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
        {items.map((item, index) => (
          <div
            key={index}
            style={{
              background: "white",
              borderRadius: "10px",
              padding: "0.8rem 1rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              border: "1px solid #e5e7eb",
              transition: "0.2s",
            }}
          >
            <div>
              <strong style={{ color: "#111827", fontSize: "0.95rem" }}>
                {item.name}
              </strong>
              <div style={{ color: "#555", fontSize: "0.85rem", marginTop: "4px" }}>
                ₹{item.price} | Qty: {item.qty} | Size: {item.size || "N/A"}
                {item.color && (
                  <>
                    {" | Color: "}
                    <span
                      style={{
                        display: "inline-block",
                        width: "14px",
                        height: "14px",
                        backgroundColor: item.color,
                        border: "1px solid #ccc",
                        borderRadius: "3px",
                        verticalAlign: "middle",
                        marginLeft: "4px",
                      }}
                    ></span>
                  </>
                )}
              </div>
              <div style={{ color: "#6b7280", fontSize: "0.8rem", marginTop: "4px" }}>
                Vendor:{" "}
                {item.vendor_business_name
                  ? `${item.vendor_business_name} (${item.vendor_name})`
                  : "Admin"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  ))}
</div>



            <button onClick={() => setSelectedOrder(null)} className={styles.closeButton}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
