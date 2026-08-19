import React, { useEffect, useState } from "react";
import { API_BASE } from "../../config";
import styles from "./AdminComplaints.module.css"; // optional, for styling

const AdminComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 🔹 Fetch all complaints
  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const response = await fetch(`${API_BASE}/admin/complaints`);
        if (!response.ok) throw new Error("Failed to fetch complaints");
        const data = await response.json();
        setComplaints(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchComplaints();
  }, []);

  // 🔹 Update status (Resolved, In Progress)
  const handleStatusChange = async (id, newStatus) => {
    try {
      const response = await fetch(
        `${API_BASE}/admin/complaints/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) throw new Error("Failed to update status");

      setComplaints((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, status: newStatus } : c
        )
      );
    } catch (err) {
      alert("Error updating complaint status");
      console.error(err);
    }
  };

  if (loading) return <p className={styles.info}>Loading complaints...</p>;
  if (error) return <p className={styles.error}>❌ {error}</p>;

  return (
    <div className={styles.container}>
      <h2>🧾 Customer Complaints</h2>

      {complaints.length === 0 ? (
        <p className={styles.info}>No complaints found.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>User ID</th>
              <th>Username</th> 
              <th>Category</th>
              <th>Order ID</th>
              <th>Description</th>
              <th>Image</th>
              <th>Status</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {complaints.map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{c.user_id}</td>
                <td>{c.username || "N/A"}</td>
                <td>{c.category}</td>
                <td>{c.order_id || "-"}</td>
                <td>{c.description}</td>
                <td>
                  {c.image ? (
                    <a
                      href={c.image}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
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
                  {c.status !== "Resolved" && (
                    <select
                      onChange={(e) =>
                        handleStatusChange(c.id, e.target.value)
                      }
                      value={c.status}
                      className={styles.statusSelect}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminComplaints;
