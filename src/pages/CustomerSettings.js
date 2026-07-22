import { Link } from "react-router-dom";
import React, { useEffect, useState } from "react";
import styles from "./CustomerSettings.module.css";
import Complaints from "./Complaints"; 


const CustomerSettings = () => {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    address: "",
    image: null,
    segment: "all",
    segment_status: "",
  });
  const [proofFile, setProofFile] = useState(null);
  const [passwords, setPasswords] = useState({ current: "", new: "" });
  const [orders, setOrders] = useState([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [eligibleOffers, setEligibleOffers] = useState([]);

  const [token, setToken] = useState(null);
  const [customerId, setCustomerId] = useState(null);

  const segments = [
    { value: "all", label: "All", requiresProof: false },
    { value: "army", label: "Army", requiresProof: true, proofLabel: "Army ID / Service Card" },
    { value: "navy", label: "Navy", requiresProof: true, proofLabel: "Navy ID / Service Card" },
    { value: "airforce", label: "Airforce", requiresProof: true, proofLabel: "Airforce ID / Service Card" },
    { value: "student", label: "Student", requiresProof: true, proofLabel: "College ID / Enrollment Letter" },
    { value: "loyal", label: "Loyal Customer", requiresProof: false },
    { value: "vip", label: "VIP", requiresProof: false },
  ];

  useEffect(() => {
    try {
      const customer = JSON.parse(localStorage.getItem("customer"));
      if (customer?.id && customer?.token) {
        setProfile({
          name: customer.name,
          email: customer.email,
          address: customer.address || "",
          image: customer.image || null,
          segment: customer.segment || "all",
          segment_status: customer.segment_status || "",
        });
        setToken(customer.token);
        setCustomerId(customer.id);

        fetchOrders(customer.token, customer.id);
        fetchWishlist(customer.token, customer.id);
        fetchEligibleOffers(customer.token);
      }
    } catch (err) {
      console.error("Invalid customer data in localStorage:", err);
    }
  }, []);
  
  const fetchProfile = async () => {
  if (!customerId || !token) return;
  try {
    const res = await fetch(`http://127.0.0.1:5000/customer/${customerId}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    if (res.ok) {
      setProfile((prev) => ({
        ...prev,
        segment: data.segment,
        segment_status: data.segment_request?.status || "",
      }));
      localStorage.setItem("customer", JSON.stringify({ ...data, token, id: customerId }));
    }
  } catch (err) {
    console.error("Polling error:", err);
  }
};

const fetchEligibleOffers = async (token) => {
  try {
    const res = await fetch("http://127.0.0.1:5000/api/offers/eligible", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) setEligibleOffers(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("Failed to load offers:", err);
  }
};


// Polling for updated segment status
useEffect(() => {
  if (!customerId || !token) return;

  fetchProfile(); // fetch once immediately
  const interval = setInterval(fetchProfile, 300000); // every 5 minutes
  return () => clearInterval(interval);
}, [customerId, token]);


  const fetchOrders = async (token, id) => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/customer/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setOrders(data || []);
      else console.error("Failed to load orders:", data);
    } catch (err) {
      console.error("Failed to load orders:", err);
    }
  };

  const fetchWishlist = async (token, id) => {
  try {
    const res = await fetch(`http://127.0.0.1:5000/customer/wishlist/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) {
      setWishlistCount(data.items?.length ?? 0);
    } else {
      console.error("Failed to load wishlist:", data);
    }
  } catch (err) {
    console.error("Failed to load wishlist:", err);
  }
};


  const handleProfileUpdate = async () => {
    try {
      const formData = new FormData();
      formData.append("name", profile.name);
      formData.append("email", profile.email);
      formData.append("address", profile.address);
      if (profile.image instanceof File) formData.append("image", profile.image);

      const res = await fetch("http://127.0.0.1:5000/customer/update-profile", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        alert("Profile updated successfully");
        localStorage.setItem("customer", JSON.stringify({ ...data, token, id: customerId }));
      } else {
        alert(data.error || "Update failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating profile");
    }
  };

  const handleChangePassword = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/customer/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(passwords),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Password changed successfully");
        setPasswords({ current: "", new: "" });
      } else {
        alert(data.error || "Password update failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error changing password");
    }
  };

  const handleSegmentUpdate = async () => {
  const selectedSegment = segments.find((s) => s.value === profile.segment);
  if (selectedSegment.requiresProof && !proofFile) {
    alert(`Please upload proof for the segment: ${selectedSegment.label}`);
    return;
  }

  try {
    const formData = new FormData();
    formData.append("user_id", customerId);  //  add user_id
    formData.append("requested_segment", profile.segment);
    if (proofFile) formData.append("proof_image", proofFile);

    const res = await fetch("http://127.0.0.1:5000/customer/request-segment", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await res.json();
    if (res.ok) {
      alert(`Segment updated successfully! Request Status: ${data.segment_status || "pending"}`);
      setProfile((prev) => ({ ...prev, segment_status: "pending" }));
      setProofFile(null);
    } else {
      alert(data.error || "Failed to update segment");
    }
  } catch (err) {
    console.error(err);
    alert("Error updating segment");
  }
};


  const handleReorder = async (item) => {
    if (!token) return alert("You must be logged in to reorder.");
    if (!item.product?._id) return alert("Invalid product for reorder.");

    try {
      const res = await fetch(`http://127.0.0.1:5000/customer/reorder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: item.product._id,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Product added to cart for reorder!");
      } else {
        alert(data.error || "Failed to reorder");
      }
    } catch (err) {
      console.error(err);
      alert("Error reordering product");
    }
  };

  const handleReturn = async (item, orderId) => {
    if (!token) return alert("You must be logged in to request a return.");
    if (!item.product?._id) return alert("Invalid product for return.");

    try {
      const res = await fetch(`http://127.0.0.1:5000/customer/return`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: item.product._id,
          order_id: orderId,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Return request submitted successfully!");
      } else {
        alert(data.error || "Failed to request return");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting return request");
    }
  };

  const currentSegment = segments.find((s) => s.value === profile.segment);

  return (
    <div className={styles.settings}>
      <h2>My Dashboard</h2>

      {/* Stats */}
      <div className={styles.statsBox}>
        <div className={styles.statCard}>
          <h4>
            <Link to="/orders" className={styles.orderLink}>
              Total Orders
            </Link>
          </h4>
          <p>{orders.length}</p>
        </div>
        <div className={styles.statCard}>
          <h4>
            <Link to="/wishlist" className={styles.orderLink}>
              Wishlist Items
            </Link>
          </h4>
          <p>{wishlistCount}</p>
        </div>
      </div>

      {/* Profile */}
      <div className={styles.profile}>
        <h3>Update Profile</h3>
        <label>Name</label>
        <input
          type="text"
          value={profile.name}
          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
        />
        <label>Email</label>
        <input
          type="email"
          value={profile.email}
          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
        />
        <label>Address</label>
        <textarea
          value={profile.address}
          onChange={(e) => setProfile({ ...profile, address: e.target.value })}
        />
        <label>Profile Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setProfile({ ...profile, image: e.target.files[0] })}
        />
        {profile.image && (
          <div className={styles.imagePreview}>
            <img
              src={
                profile.image instanceof File
                  ? URL.createObjectURL(profile.image)
                  : profile.image
              }
              alt="Profile Preview"
              height="100"
            />
          </div>
        )}
        <button onClick={handleProfileUpdate}>Update Profile</button>
      </div>

      {/* Segment */}
      <div className={styles.segment}>
        <h3>My Segment</h3>
        <select
          value={profile.segment}
          onChange={(e) => setProfile({ ...profile, segment: e.target.value })}
        >
          {segments.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        {currentSegment?.requiresProof && (
          <div className={styles.inputGroup}>
            <label>{currentSegment.proofLabel}:</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setProofFile(e.target.files[0])}
            />
            {proofFile && <p>Selected file: {proofFile.name}</p>}
          </div>
        )}

        {profile.segment_status && (
  <p className={styles.segmentStatus}>
    Request Status:{" "}
    <span
      className={
        profile.segment_status === "approved"
          ? styles.approved
          : profile.segment_status === "pending"
          ? styles.pending
          : styles.rejected
      }
    >
      {profile.segment_status}
    </span>
  </p>
)}
<div style={{ display: "flex", flexDirection: "row", gap: "10px", marginTop: "10px" }}>
  <button 
    onClick={fetchProfile} 
    className={styles.button}
    style={{ padding: "4px 10px", fontSize: "13px" }}
  >
    Refresh Status
  </button>

  <button 
    onClick={handleSegmentUpdate} 
    className={styles.button}
    style={{ padding: "4px 10px", fontSize: "13px" }}
  >
    Update Segment
  </button>
</div>

      </div>


    {/* Personalized Offers Section */}
{eligibleOffers.length > 0 && (
  <div className={styles.offersSection}>
    <h3>🎁 Exclusive Offers for You</h3>
    <div className={styles.offerGrid}>
      {eligibleOffers.map((offer) => (
        <div key={offer._id} className={styles.offerCard}>
          <img
            src={offer.image || "/images/offer-placeholder.png"}
            alt={offer.title}
            className={styles.offerImage}
          />
          <h4>{offer.title}</h4>
          <p>{offer.description}</p>
          <p>
            <strong>{offer.discount}% off</strong>
          </p>
          <p>
            Valid:{" "}
            {offer.start_date?.slice(0, 10)} →{" "}
            {offer.end_date?.slice(0, 10)}
          </p>
        </div>
      ))}
    </div>
  </div>
)}



      {/* Password */}
      <div className={styles.password}>
        <h3>Change Password</h3>
        <label>Current Password</label>
        <input
          type="password"
          value={passwords.current}
          onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
        />
        <label>New Password</label>
        <input
          type="password"
          value={passwords.new}
          onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
        />
        <button onClick={handleChangePassword}>Change Password</button>
      </div>

      {/* Orders */}
      <div className={styles.orders}>
        <h3>Order History</h3>
        {orders.length === 0 ? (
          <p>No orders found.</p>
        ) : (
          orders.map((order, idx) => (
            <div className={styles.orderCard} key={idx}>
              <div className={styles.orderHeader}>
                <span>
                  <strong>Order ID:</strong> {order._id}
                </span>
                <span>
                  <strong>Date:</strong>{" "}
                  {order.created_at ? new Date(order.created_at).toLocaleDateString() : "N/A"}
                </span>
              </div>

              {(order.products || []).map((item, i) => (
                <div
                  className={styles.item}
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  {/* Product */}
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <img
                      src={item.product?.images?.[0] || "/images/logo.png"}
                      alt={item.product?.name || "Product"}
                      height={80}
                    />
                    <div style={{ marginLeft: 10 }}>
                      <p>
                        <strong>{item.product?.name}</strong>
                      </p>

                      {item.size && item.size !== "N/A" && <p>Size: {item.size}</p>}

                      {item.color && (
                        <p>
                          Color:{" "}
                          <span
                            style={{
                              display: "inline-block",
                              width: "16px",
                              height: "16px",
                              backgroundColor: item.color || "#ccc",
                              border: "1px solid #ccc",
                              borderRadius: "4px",
                              verticalAlign: "middle",
                              marginRight: "6px",
                            }}
                          ></span>
                        </p>
                      )}

                      <p>Quantity: {item.quantity}</p>
                      <p>Price: ₹{item.product?.price}</p>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {["placed", "shipped","paid"].includes(order.status?.toLowerCase()) && (
                   <button
                   onClick={() => alert(`Tracking order ${order._id}`)}
                   style={{
                    padding: "6px 12px",
                    backgroundColor: "#009688",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                     }}
                   >
                   Track Order
                  </button>
                   )}

                    

                    {order.status?.toLowerCase().trim() === "delivered" &&  (
                      <>
                        <button
                          onClick={() => handleReorder(item)}
                          style={{
                            padding: "6px 12px",
                            backgroundColor: "#3f51b5",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          Reorder
                        </button>
                        <button
                          onClick={() => handleReturn(item, order._id)}
                          style={{
                            padding: "6px 12px",
                            backgroundColor: "#f44336",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          Return
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}

              <div className={styles.orderFooter}>
                <p>
                  <strong>Payment Method:</strong> {order.payment_method || "N/A"}
                </p>
                <p>
                  <strong>Total:</strong> ₹{order.total}
                </p>
                {order.discount > 0 && (
                  <p>
                    <strong>Discount:</strong> −₹{order.discount}
                  </p>
                )}
                <p>
                  <strong>Final Paid:</strong> ₹{order.final}
                </p>
                <p>
                  <strong>Status:</strong> {order.status}
                </p>
              </div>
            </div>
            
          ))
        )}
        
      </div>
      {/* Complaints Section */}
<div className={styles.complaintsSection}>
  <h3>My Complaints</h3>
  <Complaints />
</div>

    </div>
  );
};

export default CustomerSettings;
