import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import styles from "./AdminOffers.module.css";

const CLOUDINARY_UPLOAD_PRESET = "Citimart"; 
const CLOUDINARY_CLOUD_NAME = "dfvrobw6x"; 
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

const AdminOffers = () => {
  const [offers, setOffers] = useState([]);
  const [products, setProducts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    discount: "",
    type: "popup",
    min_purchase: "",
    eligible_users: "all",
    personalized_for: "",
    start_date: "",
    end_date: "",
    products: [],
    image: "",
    code: "",
    apply_mode: "automatic",
    max_discount: "",
    priority: 0,
    stackable: false,
  });
  const [uploading, setUploading] = useState(false);

  // Fetch offers
  const fetchOffers = () => {
    fetch("http://localhost:5000/api/offers/all", {
      headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
    })
      .then((res) => res.json())
      .then((data) => setOffers(Array.isArray(data) ? data : []))
      .catch(() => setOffers([]));
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  // Fetch products
  useEffect(() => {
    fetch("http://localhost:5000/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
        else if (Array.isArray(data.products)) setProducts(data.products);
        else setProducts([]);
      })
      .catch(() => setProducts([]));
  }, []);

  const openModal = (offer = null) => {
    if (offer) {
      setEditingOffer(offer);
      setFormData({
        title: offer.title,
        description: offer.description,
        discount: offer.discount,
        type: offer.type,
        min_purchase: offer.min_purchase || "",
        eligible_users: offer.eligible_users || "all",
        personalized_for: offer.personalized_for || "",
        start_date: offer.start_date?.slice(0, 10),
        end_date: offer.end_date?.slice(0, 10),
        products: offer.products?.map((p) => p._id) || [],
        image: offer.image || "",
        code: offer.code || "",
        apply_mode: offer.apply_mode || "automatic",
        max_discount: offer.max_discount || "",
        priority: offer.priority || 0,
        stackable: Boolean(offer.stackable),
      });
    } else {
      setEditingOffer(null);
      setFormData({
        title: "",
        description: "",
        discount: "",
        type: "popup",
        min_purchase: "",
        eligible_users: "all",
        personalized_for: "",
        start_date: "",
        end_date: "",
        products: [],
        image: "",
    code: "",
    apply_mode: "automatic",
    max_discount: "",
    priority: 0,
    stackable: false,
      });
    }
    setModalOpen(true);
  };

  // Upload to Cloudinary
  const handleImageUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      const res = await fetch(CLOUDINARY_URL, { method: "POST", body: data });
      const json = await res.json();
      if (json.secure_url) {
        setFormData((prev) => ({ ...prev, image: json.secure_url }));
      } else {
        alert("❌ Failed to upload image to Cloudinary");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Cloudinary upload failed");
    } finally {
      setUploading(false);
    }
  };

  // Save offer
 /*
  const handleSave = async () => {
    try {
      const method = editingOffer ? "PUT" : "POST";
      const url = editingOffer
        ? `http://localhost:5000/api/offers/${editingOffer._id}`
        : "http://localhost:5000/api/offers";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        alert(`❌ Failed to save offer: ${data.message || "Unknown error"}`);
        return;
      }

      alert("✅ Offer saved successfully!");
      setModalOpen(false);
      fetchOffers();
    } catch (err) {
      alert("❌ Something went wrong while saving offer");
      console.error(err);
    }
  };
*/

const handleSave = async () => {
  try {
    const payload = { ...formData };

    // Convert comma-separated emails to array if personalized
    if (payload.eligible_users === "personalized" && payload.personalized_for) {
      payload.personalized_for = payload.personalized_for
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);
    } else {
      payload.personalized_for = [];
    }

    const method = editingOffer ? "PUT" : "POST";
    const url = editingOffer
      ? `http://localhost:5000/api/offers/${editingOffer._id}`
      : "http://localhost:5000/api/offers";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || data.success === false) {
      alert(`❌ Failed to save offer: ${data.message || "Unknown error"}`);
      return;
    }

    alert("✅ Offer saved successfully!");
    setModalOpen(false);
    fetchOffers();
  } catch (err) {
    alert("❌ Something went wrong while saving offer");
    console.error(err);
  }
};

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this offer?")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/offers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        alert(`❌ Failed to delete offer: ${data.message || "Unknown error"}`);
        return;
      }

      alert("✅ Offer deleted successfully!");
      fetchOffers();
    } catch (err) {
      alert("❌ Error deleting offer");
      console.error(err);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>🎁 Manage Offers</h1>

      <button className={`${styles.btn} ${styles.btnAdd}`} onClick={() => openModal()}>
        ➕ Add Offer
      </button>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Title</th>
            <th>Discount</th>
            <th>Type</th>
            <th>Code / Mode</th>
            <th>Min Purchase</th>
            <th>Eligible Users</th>
            <th>Status</th>
            <th>Valid From</th>
            <th>Valid Till</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {offers.map((offer) => (
            <tr key={offer._id}>
              <td>{offer.title}</td>
              <td>{offer.type === 'flat' ? <>₹{offer.discount}</> : <>{offer.discount}%</>}</td>
              <td>{offer.type}</td>
              <td>{offer.code || 'Automatic'} / {offer.apply_mode || 'automatic'}</td>
              <td>{offer.min_purchase || "-"}</td>
              <td>{offer.eligible_users || "all"}</td>
              <td>{offer.status}</td>
              <td>{offer.start_date?.slice(0, 10)}</td>
              <td>{offer.end_date?.slice(0, 10)}</td>
              <td>
                <button className={`${styles.btn} ${styles.btnEdit}`} onClick={() => openModal(offer)}>
                  ✏ Edit
                </button>
                <button className={`${styles.btn} ${styles.btnDelete}`} onClick={() => handleDelete(offer._id)}>
                  🗑 Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal */}
      <Modal isOpen={modalOpen} onRequestClose={() => setModalOpen(false)}>
        <div className={styles.modalContent}>
          <h2>{editingOffer ? "Edit Offer" : "Add Offer"}</h2>

          {/* Title */}
          <div className={styles.inputGroup}>
            <label>Title:</label>
            <input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          {/* Description */}
          <div className={styles.inputGroup}>
            <label>Description:</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Image Upload */}
          <div className={styles.inputGroup}>
            <label>Offer Image:</label>
            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files[0])} />
            {uploading && <p>⏳ Uploading...</p>}
            {formData.image && <img src={formData.image} alt="offer" width="120" />}
          </div>

          {/* Product Selection */}
          <div className={styles.inputGroup}>
            <label>Select Products:</label>
            <select
              multiple
              value={formData.products}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  products: Array.from(e.target.selectedOptions, (opt) => opt.value),
                })
              }
            >
              {products.length > 0 ? (
                products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))
              ) : (
                <option disabled>No Products Available</option>
              )}
            </select>
          </div>

          {/* Discount */}
          <div className={styles.inputGroup}>
            <label>Discount value ({formData.type === 'flat' ? '₹' : '%'}):</label>
            <input
              type="number"
              value={formData.discount}
              onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
            />
          </div>

          {/* Offer Type */}
          <div className={styles.inputGroup}>
            <label>Offer Type:</label>
            <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
              <option value="popup">Popup</option>
              <option value="deal">Deal of the Day</option>
              <option value="bogo">Buy 1 Get 1</option>
              <option value="free_shipping">Free Shipping</option>
              <option value="flat">Flat Discount</option>
              <option value="percent">Percentage Discount</option>
              <option value="predefined">Festival/Seasonal Sale</option>
              <option value="referral">Referral Reward</option>
              <option value="personalized">Personalized Offer</option>
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label>How it applies:</label>
            <select value={formData.apply_mode} onChange={(e) => setFormData({ ...formData, apply_mode: e.target.value })}>
              <option value="automatic">Automatic (best eligible offer)</option>
              <option value="coupon">Customer enters a code</option>
            </select>
          </div>

          {formData.apply_mode === "coupon" && (
            <div className={styles.inputGroup}>
              <label>Coupon code:</label>
              <input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="e.g. SAVE20" />
            </div>
          )}

          <div className={styles.inputGroup}>
            <label>Maximum discount (₹, 0 = no cap):</label>
            <input type="number" min="0" value={formData.max_discount} onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })} />
          </div>

          <div className={styles.inputGroup}>
            <label>Priority (used when savings are equal):</label>
            <input type="number" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} />
          </div>

          <div className={styles.inputGroup}>
            <label>
              <input type="checkbox" checked={formData.stackable} onChange={(e) => setFormData({ ...formData, stackable: e.target.checked })} />
              Stackable (free-shipping offers can stack with the best discount)
            </label>
          </div>
          {/* Min Purchase */}
          <div className={styles.inputGroup}>
            <label>Min Purchase (₹):</label>
            <input
              type="number"
              value={formData.min_purchase}
              onChange={(e) => setFormData({ ...formData, min_purchase: e.target.value })}
            />
          </div>

          {/* Eligible Users */}
          <div className={styles.inputGroup}>
            <label>Eligible Users:</label>
            <select
              value={formData.eligible_users}
              onChange={(e) => setFormData({ ...formData, eligible_users: e.target.value })}
            >
              <option value="all">All</option>
              <option value="army">Army</option>
              <option value="navy">Navy</option>
              <option value="airforce">Airforce</option>
              <option value="loyal">Loyal Customers</option>
              <option value="student">Student</option>
              <option value="personalized">Specific customers</option>
            </select>
          </div>

         {/* Personalized For */}
{formData.eligible_users === "personalized" && (
  <div className={styles.inputGroup}>
    <label>Personalized For (Email):</label>
    <input
      type="email"
      value={formData.personalized_for}
      onChange={(e) => setFormData({ ...formData, personalized_for: e.target.value })}
      placeholder="Enter email(s) separated by comma"
    />
    <small>Optional: multiple emails separated by commas</small>
  </div>
)}


          {/* Dates */}
          <div className={styles.inputGroup}>
            <label>Valid From:</label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Valid Till:</label>
            <input
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            />
          </div>

          {/* Buttons */}
          <div className={styles.modalButtons}>
            <button className={`${styles.btn} ${styles.btnSave}`} onClick={handleSave}>
              💾 Save
            </button>
            <button className={`${styles.btn} ${styles.btnCancel}`} onClick={() => setModalOpen(false)}>
              ❌ Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminOffers;
