import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./AdminInventory.module.css";
import { API_BASE as BACKEND_BASE } from "../../config";

const API_BASE = `${BACKEND_BASE}/api`; // Backend

const AdminInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterVendor, setFilterVendor] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [topOrdered, setTopOrdered] = useState([]);
  
  // Fetch top ordered items (with avg orders/day and restock suggestion)
  useEffect(() => {
    axios
      .get(`${API_BASE}/inventory/top-ordered`)
      .then((res) => setTopOrdered(res.data))
      .catch((err) => console.error("Error fetching top ordered:", err));
  }, []);

  // Fetch full inventory
  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await axios.get(`${API_BASE}/inventory`);
      setInventory(res.data);
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
    }
  };

  const handleSearch = (item) => {
    return (
      item.productName.toLowerCase().includes(search.toLowerCase()) &&
      (filterCategory ? item.category === filterCategory : true) &&
      (filterVendor ? item.vendor === filterVendor : true) &&
      (filterStatus ? item.status === filterStatus : true)
    );
  };

  const updateStock = async (id, sku, productId, newStock) => {
    try {
      await axios.put(`${API_BASE}/inventory/${id}`, {
        stock: newStock,
        sku,
        productId,
      });
      fetchInventory(); // Refresh after update
    } catch (error) {
      console.error("Failed to update stock:", error);
    }
  };

  const handleSaveEdit = async (item) => {
    try {
      await axios.put(`${API_BASE}/inventory/${item._id}`, {
        productId: item.productId,
        sku: item.sku,
        stock: item.stock,
        price: item.price,
        minStock: item.minStock,
      });
      setShowEditModal(false);
      fetchInventory(); // Refresh data
    } catch (error) {
      console.error("Failed to update item:", error);
    }
  };

  // Helper for badges
  const getRestockBadge = (item) => {
    if (item.stock < item.minStock && item.totalOrdered > 50) {
      return <span className={styles.popularLowStock}>⚠️ Popular & Low Stock!</span>;
    } else if (item.totalOrdered > 100) {
      return <span className={styles.fastMoving}>🔥 Fast-moving</span>;
    }
    return null;
  };

  
  return (
    <div className={styles.container}>
      <h2>Inventory Management</h2>

      {/* Search & Filters */}
      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Search by product or SKU"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          <option value="Clothing">Clothing</option>
          <option value="Footwear">Footwear</option>
        </select>
        <select value={filterVendor} onChange={(e) => setFilterVendor(e.target.value)}>
          <option value="">All Vendors</option>
          <option value="Vendor A">Vendor A</option>
          <option value="Vendor B">Vendor B</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="In Stock">In Stock</option>
          <option value="Out of Stock">Out of Stock</option>
        </select>
      </div>

      {/* Inventory Table */}
      <table className={styles.inventoryTable}>
        <thead>
          <tr>
            <th>Image</th>
            <th>Product</th>
            <th>SKU</th>
            <th>Variant</th>
            <th>Category</th>
            <th>Vendor</th>
            <th>Stock</th>
            <th>Min Stock</th>
            <th>Price</th>
            <th>Status</th>
            <th>Last Restock</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {inventory.filter(handleSearch).map((item) => (
            <tr key={item._id}>
              <td>
                {item.image ? (
                  <img src={item.image} alt={item.productName} className={styles.productImage} />
                ) : (
                  <span>No Image</span>
                )}
              </td>
              <td>{item.productName}</td>
              <td>{item.sku}</td>
              <td>
  {item.variant ? (
    (() => {
      const [color, size] = item.variant.split("/").map((v) => v.trim());
      const isColorHex = /^#([0-9A-F]{3}){1,2}$/i.test(color);
      return (
        <div className={styles.variantBoxWrapper}>
          <div
            className={styles.colorBox}
            style={{ backgroundColor: isColorHex ? color : "#ccc" }}
          >
            {size && <span className={styles.sizeText}>{size}</span>}
          </div>
          {!isColorHex && <span>{color}</span>}
        </div>
      );
    })()
  ) : (
    "-"
  )}
</td>

              <td>{item.category}</td>
              <td>{item.vendor}</td>
              <td>
                <input
                  type="number"
                  value={item.stock}
                  onChange={(e) =>
                    updateStock(item._id, item.sku, item.productId, e.target.value)
                  }
                />
              </td>
              <td>{item.minStock}</td>
              <td>{item.price}</td>
              <td className={item.stock <= item.minStock ? styles.lowStock : ""}>
                {item.status}
              </td>
              <td>{item.lastRestock}</td>
              <td>
                <button
                  className={`${styles.tableButton} ${styles.editButton}`}
                  onClick={() => {
                    setEditingItem(item);
                    setShowEditModal(true);
                  }}
                >
                  Edit
                </button>
                <button className={`${styles.tableButton} ${styles.deleteButton}`}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button className={styles.addButton}>Add New Inventory Item</button>

      {/* Most Ordered Section */}
      <h3>🔥 Most Ordered Items</h3>
      <table className={styles.inventoryTable}>
        <thead>
          <tr>
            <th>Image</th>
            <th>Product</th>
            <th>SKU</th>
            <th>Ordered</th>
            <th>Stock Left</th>
            <th>Avg Orders/Day</th>
            <th>Restock Suggestion</th>
          </tr>
        </thead>
        <tbody>
          {topOrdered.map((item) => (
            <tr key={item.product_id}>
              <td>
                <img src={item.image} alt={item.name} className={styles.productImage} />
              </td>
              <td>
                {item.name}
                <div>{getRestockBadge(item)}</div>
              </td>
              <td>{item.sku}</td>
              <td>{item.totalOrdered}</td>
              <td className={item.stock < item.minStock ? styles.lowStock : ""}>{item.stock}</td>
              <td>{item.avgDailyOrders ? `${item.avgDailyOrders}/day` : "-"}</td>
              <td>
                {item.restockSuggestion > 0 ? (
                  <span className={styles.restockSuggest}>Suggest +{item.restockSuggestion}</span>
                ) : (
                  "-"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Edit Inventory Item</h3>

            <label>
              Product Name:
              <input type="text" value={editingItem.productName} readOnly />
            </label>

            <label>
              SKU:
              <input type="text" value={editingItem.sku} readOnly />
            </label>

            <label>
              Stock:
              <input
                type="number"
                value={editingItem.stock}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, stock: e.target.value })
                }
              />
            </label>

            <label>
              Min Stock:
              <input
                type="number"
                value={editingItem.minStock}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, minStock: e.target.value })
                }
              />
            </label>

            <label>
              Price:
              <input
                type="number"
                value={editingItem.price}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, price: e.target.value })
                }
              />
            </label>

            <div className={styles.modalActions}>
              <button
                className={styles.saveButton}
                onClick={() => handleSaveEdit(editingItem)}
              >
                Save
              </button>
              <button
                className={styles.cancelButton}
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInventory;
