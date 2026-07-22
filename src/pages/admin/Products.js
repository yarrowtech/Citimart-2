import React, { useEffect, useState } from "react";
import styles from "./Products.module.css";
import { useNavigate } from "react-router-dom";

const Products = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [status, setStatus] = useState("");
  const [comment, setComment] = useState("");

  const fetchProducts = () => {
    fetch("http://localhost:5000/api/products/all?admin=true")
      .then((res) => res.json())
      .then((data) => {
        const adminProducts = data.products || [];
        setProducts(adminProducts);
      })
      .catch((err) => console.error("Failed to fetch products", err));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Delete / Moderate handler
  const handleAction = (product) => {
    if (product.added_by === "vendor") {
      setSelectedProduct(product);
      setShowModal(true);
      setStatus(product.status || "Under Review");
      setComment("");
    } else {
      const confirmDelete = window.confirm("Are you sure you want to delete this product?");
      if (!confirmDelete) return;

      fetch(`http://localhost:5000/api/products/${product._id}?is_admin=true`, {
        method: "DELETE",
      })
        .then((res) => res.json())
        .then((result) => {
          if (result.error) alert(result.error);
          else {
            alert("Product deleted successfully!");
            fetchProducts();
          }
        })
        .catch((err) => {
          console.error("Error deleting product:", err);
          alert("An error occurred while deleting the product.");
        });
    }
  };

  const handleStatusUpdate = async () => {
    if (!status) {
      alert("Please select a status.");
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/products/review/${selectedProduct._id}`, {

        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, admin_comment: comment }),
      });

      const result = await res.json();

      if (res.ok) {
        alert(result.message || "Product status updated!");
        setShowModal(false);
        setSelectedProduct(null);
        fetchProducts();
      } else {
        alert(result.error || "Failed to update status");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      alert("An error occurred while updating product status.");
    }
  };

  return (
    <div className={styles.products}>
      <div className={styles.header}>
        <h1>Products</h1>
        <button className={styles.addButton} onClick={() => navigate("/admin/add-product")}>
          + Add Product
        </button>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Brand</th>
              <th>Image</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <tr key={product._id}>
                <td>{index + 1}</td>
                <td>{product.name}</td>
                <td>{product.brand || "—"}</td>
                <td>
                  {product.images?.length > 0 ? (
                    <img src={product.images[0]} alt={product.name} className={styles.thumbnail} />
                  ) : (
                    <span>No Image</span>
                  )}
                </td>
                <td>
                  {product.category}
                  {product.subcategory ? ` / ${product.subcategory}` : ""}
                  {product.childcategory ? ` / ${product.childcategory}` : ""}
                </td>
                <td>₹{product.price}</td>
                <td>{product.variants?.reduce((t, v) => t + parseInt(v.stock || 0), 0)}</td>
                <td>
                  <span
                    className={`${styles.status} ${
                      styles[product.status?.toLowerCase()] || styles.inactive
                    }`}
                  >
                    {product.status || "Inactive"}
                  </span>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button
                      className={styles.editButton}
                      onClick={() => navigate(`/admin/edit-product/${product._id}`)}
                    >
                      Edit
                    </button>

                    <button
                      className={styles.deleteButton}
                      onClick={() => handleAction(product)}
                    >
                      {product.added_by === "vendor" ? "Moderate" : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {products.length === 0 && (
              <tr>
                <td colSpan="9" style={{ textAlign: "center" }}>
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Moderation Modal */}
      {showModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <h2>Moderate Vendor Product</h2>
            <p>
              <strong>{selectedProduct.name}</strong>
            </p>

            <label>Status:</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Select status</option>
              <option value="Suspended">Suspended</option>
              <option value="Rejected">Rejected</option>
              <option value="Hidden">Hidden</option>
              <option value="Under Review">Under Review</option>
              <option value="Approved">Approved</option>
            </select>

            <label>Comment (optional):</label>
            <textarea
              placeholder="Enter reason or notes..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            <div className={styles.modalActions}>
              <button onClick={() => setShowModal(false)} className={styles.cancelBtn}>
                Cancel
              </button>
              <button onClick={handleStatusUpdate} className={styles.confirmBtn}>
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
