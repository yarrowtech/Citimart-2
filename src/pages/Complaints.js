import React, { useState, useEffect } from "react";
import styles from "./Complaints.module.css";

const API_BASE = "http://localhost:5000"; // ✅ your backend base URL

const complaintCategories = [
  { value: "product", label: "🛍️ Product Issue" },
  { value: "refund", label: "💰 Refund/Return" },
  { value: "delivery", label: "🚚 Delivery Issue" },
  { value: "payment", label: "💳 Payment Problem" },
  { value: "tracking", label: "🧾 Order Tracking" },
  { value: "service", label: "📞 Customer Service" },
  { value: "vendor", label: "📦 Vendor Complaint" },
  { value: "general", label: "📢 General Feedback" },
];

const Complaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [formData, setFormData] = useState({
    category: "",
    orderId: "",
    description: "",
    image: null,
  });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ Get logged-in customer from localStorage
  const customerData = JSON.parse(localStorage.getItem("customer"));
  const userId = customerData?.id;
  const token = customerData?.token;

  // 🔒 Redirect if not logged in
  useEffect(() => {
    if (!userId || !token) {
      window.location.href = "/login";
    }
  }, [userId, token]);

  // ✅ Fetch complaints for this customer
  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const res = await fetch(`${API_BASE}/customer/${userId}/complaints`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (Array.isArray(data)) setComplaints(data);
      } catch (err) {
        console.error("Error fetching complaints:", err);
      }
    };
    if (userId && token) fetchComplaints();
  }, [userId, token]);

  // 📝 Handle form input change
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  // 🚀 Submit complaint to backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const form = new FormData();
      form.append("user_id", userId);
      form.append("category", formData.category);
      form.append("order_id", formData.orderId);
      form.append("description", formData.description);
      if (formData.image) form.append("image", formData.image);

      const res = await fetch(`${API_BASE}/customer/complaints`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      const data = await res.json();
      if (res.ok) {
        alert("Complaint submitted successfully!");
        setFormData({ category: "", orderId: "", description: "", image: null });
        setShowForm(false);

        // Refresh complaint list
        const refresh = await fetch(`${API_BASE}/customer/${userId}/complaints`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const newData = await refresh.json();
        setComplaints(newData);
      } else {
        alert(data.error || "Failed to file complaint");
      }
    } catch (err) {
      console.error("Error submitting complaint:", err);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.complaintsPage}>
      <h2>🧾 Complaints</h2>

      {!showForm ? (
        <>
          <button
            className={styles.fileButton}
            onClick={() => setShowForm(true)}
          >
            + File a Complaint
          </button>

          {complaints.length === 0 ? (
            <p className={styles.emptyText}>No complaints filed yet.</p>
          ) : (
            <table className={styles.complaintTable}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Image</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td>{c.category}</td>
                    <td
                      className={
                        c.status === "Resolved"
                          ? styles.resolved
                          : styles.pending
                      }
                    >
                      {c.status}
                    </td>
                    <td>{c.date}</td>
                    <td>
                      {c.image ? (
                        <a
                          href={c.image}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Image
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit}>
          <h3>File a Complaint</h3>

          <label>Complaint Type</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="">Select Type</option>
            {complaintCategories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          <label>Order ID (optional)</label>
          <input
            type="text"
            name="orderId"
            value={formData.orderId}
            onChange={handleChange}
            placeholder="Enter order ID if applicable"
          />

          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the issue"
            required
          />

          <label>Upload Image (optional)</label>
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={handleChange}
          />

          <div className={styles.formButtons}>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Complaint"}
            </button>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Complaints;
