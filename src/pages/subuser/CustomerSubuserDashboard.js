import React, { useState, useEffect } from "react";
import styles from "./CustomerSubuserDashboard.module.css";

// 🧩 Cloudinary config (replace with your own)
const CLOUDINARY_CLOUD_NAME = "your_cloud_name";
const CLOUDINARY_UPLOAD_PRESET = "your_upload_preset";

const TABS = [
  { key: "Segmentation", label: "Segmentation" },
  { key: "Promotions", label: "Promotions" },
  { key: "ProductTrends", label: "Product Trends" },
  { key: "ContentCuration", label: "Content Curation" },
  { key: "Reports", label: "Reports" },
  { key: "Personalization", label: "Personalization" },
  { key: "CartAnalysis", label: "Cart Analysis" },
  { key: "Campaigns", label: "Campaigns" },
  { key: "FAQ", label: "FAQ" },
];

const CustomerDashboard = () => {
  const [activeTab, setActiveTab] = useState("Segmentation");
  const [segmentRequests, setSegmentRequests] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [token, setToken] = useState(null);
  const [newOffer, setNewOffer] = useState({
    title: "",
    description: "",
    discount: "",
    type: "offer",
    image: "",
  });
  const [uploading, setUploading] = useState(false);

  // ✅ Load token
  useEffect(() => {
    const subuser = JSON.parse(localStorage.getItem("subuser"));
    if (subuser?.token) {
      console.log("✅ Loaded subuser token");
      setToken(subuser.token);
    } else {
      console.warn("⚠️ No token found, using dummy");
      setToken("test-token");
    }
  }, []);

  // ✅ Fetch segmentation requests
  const fetchSegmentRequests = async () => {
    if (!token) return;
    try {
      const res = await fetch("http://127.0.0.1:5000/subuser/segment-requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setSegmentRequests(data.requests || []);
    } catch (err) {
      console.error("Error fetching segmentation:", err);
    }
  };

  // ✅ Fetch promotions/offers
  const fetchPromotions = async () => {
    if (!token) return;
    try {
      const res = await fetch("http://127.0.0.1:5000/subuser/promotions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setPromotions(data.promotions || []);
    } catch (err) {
      console.error("Error fetching promotions:", err);
    }
  };

  // ✅ Fetch data depending on tab
  useEffect(() => {
    if (!token) return;
    if (activeTab === "Segmentation") fetchSegmentRequests();
    if (activeTab === "Promotions") fetchPromotions();
  }, [token, activeTab]);

  // ✅ Approve/Reject Segmentation
  const handleApprove = async (userId) => {
    try {
      const res = await fetch(
        `http://127.0.0.1:5000/subuser/segment-requests/${userId}/approve`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchSegmentRequests();
      } else alert(data.error);
    } catch (err) {
      alert("Error approving");
    }
  };

  const handleReject = async (userId) => {
    try {
      const res = await fetch(
        `http://127.0.0.1:5000/subuser/segment-requests/${userId}/reject`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchSegmentRequests();
      } else alert(data.error);
    } catch (err) {
      alert("Error rejecting");
    }
  };

  // ✅ Upload image to Cloudinary
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );
      const data = await res.json();
      setNewOffer((prev) => ({ ...prev, image: data.secure_url }));
    } catch (err) {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // ✅ Submit new offer
  const handleProposeOffer = async (e) => {
    e.preventDefault();
    if (!newOffer.title || !newOffer.image) {
      alert("Please fill all required fields");
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:5000/subuser/promotions/propose", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newOffer),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Offer proposed successfully!");
        setNewOffer({
          title: "",
          description: "",
          discount: "",
          type: "offer",
          image: "",
        });
        fetchPromotions();
      } else alert(data.error || "Failed");
    } catch (err) {
      alert("Error proposing offer");
    }
  };

  // ✅ Render Segmentation
  const renderSegmentationRequests = () => (
    <div>
      {segmentRequests.length === 0 ? (
        <p>No pending segmentation requests.</p>
      ) : (
        segmentRequests.map((req) => (
          <div
            key={req._id}
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              marginBottom: "10px",
              borderRadius: "5px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <p><strong>Name:</strong> {req.name}</p>
              <p><strong>Email:</strong> {req.email}</p>
              <p>
                <strong>Requested Segment:</strong>{" "}
                {req.segment_request?.requested_segment}
              </p>
              {req.segment_request?.proof_image && (
                <p>
                  <a
                    href={req.segment_request.proof_image}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Proof
                  </a>
                </p>
              )}
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => handleApprove(req._id)}
                style={{
                  background: "#4caf50",
                  color: "white",
                  border: "none",
                  padding: "6px 10px",
                  borderRadius: "4px",
                }}
              >
                Approve
              </button>
              <button
                onClick={() => handleReject(req._id)}
                style={{
                  background: "#f44336",
                  color: "white",
                  border: "none",
                  padding: "6px 10px",
                  borderRadius: "4px",
                }}
              >
                Reject
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  // ✅ Render Promotions
  const renderPromotions = () => (
    <div>
      <h3>🎯 Promotions & Offers</h3>
      <form onSubmit={handleProposeOffer} style={{ background: "#fff", padding: "1rem", borderRadius: "8px" }}>
        <h4>Propose New Offer</h4>
        <input
          type="text"
          placeholder="Title"
          value={newOffer.title}
          onChange={(e) => setNewOffer({ ...newOffer, title: e.target.value })}
          style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
        />
        <textarea
          placeholder="Description"
          value={newOffer.description}
          onChange={(e) => setNewOffer({ ...newOffer, description: e.target.value })}
          style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
        />
        <input
          type="number"
          placeholder="Discount %"
          value={newOffer.discount}
          onChange={(e) => setNewOffer({ ...newOffer, discount: e.target.value })}
          style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
        />
        <select
          value={newOffer.type}
          onChange={(e) => setNewOffer({ ...newOffer, type: e.target.value })}
          style={{ padding: "8px", width: "100%", marginBottom: "10px" }}
        >
          <option value="offer">Offer</option>
          <option value="banner">Banner</option>
          <option value="promotion">Promotion</option>
        </select>
        <input type="file" onChange={handleImageUpload} accept="image/*" />
        {uploading && <p>Uploading...</p>}
        {newOffer.image && <img src={newOffer.image} alt="preview" width="200" style={{ marginTop: "10px" }} />}
        <button
          type="submit"
          style={{
            marginTop: "10px",
            background: "#007bff",
            color: "#fff",
            border: "none",
            padding: "8px 12px",
            borderRadius: "4px",
          }}
        >
          Submit
        </button>
      </form>

      <h4 style={{ marginTop: "2rem" }}>Existing Offers</h4>
      <div style={{ display: "grid", gap: "1rem" }}>
        {promotions.length ? (
          promotions.map((offer) => (
            <div key={offer._id} style={{ background: "#fafafa", padding: "1rem", borderRadius: "8px" }}>
              <img src={offer.image} alt={offer.title} width="120" style={{ borderRadius: "6px" }} />
              <h4>{offer.title}</h4>
              <p>{offer.description}</p>
              <p>Discount: {offer.discount}%</p>
              <p>Status: {offer.status || "Pending Approval"}</p>
            </div>
          ))
        ) : (
          <p>No offers yet.</p>
        )}
      </div>
    </div>
  );

  // ✅ Tab Switch
  const renderContent = () => {
    switch (activeTab) {
      case "Segmentation":
        return renderSegmentationRequests();
      case "Promotions":
        return renderPromotions();
      default:
        return <p>Select a module.</p>;
    }
  };

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <h3>Customer Subuser</h3>
        <ul>
          {TABS.map((tab) => (
            <li
              key={tab.key}
              className={activeTab === tab.key ? styles.active : ""}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </li>
          ))}
        </ul>
      </aside>
      <main className={styles.content}>
        <h2>{activeTab}</h2>
        {renderContent()}
      </main>
    </div>
  );
};

export default CustomerDashboard;
