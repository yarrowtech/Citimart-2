import React, { useEffect, useState } from 'react';
import styles from './Products.module.css';
import { useNavigate } from 'react-router-dom';

const VendorProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);

  const fetchProducts = () => {
    fetch('http://localhost:5000/vendor/my-products', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        setProducts(data.products || []);
      })
      .catch(err => console.error('Failed to fetch products', err));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

 const handleDelete = async (productId) => {
  const confirmDelete = window.confirm("Are you sure you want to delete this product?");
  if (!confirmDelete) return;

  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`http://localhost:5000/vendor/delete-product/${productId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await res.json();

    if (res.ok) {
      alert("Product deleted successfully!");
      fetchProducts(); // refresh product list
    } else {
      alert(result.error || "Failed to delete product");
    }
  } catch (err) {
    console.error("Error deleting product:", err);
    alert("An error occurred while deleting the product.");
  }
};


  const getImageUrl = (image) => {
    if (!image) return '/images/default-placeholder.png';
    if (image.startsWith('/uploads/')) return `http://localhost:5000${image}`;
    if (image.startsWith('http')) return image;
    return `http://localhost:5000${image}`;
  };

  return (
    <div className={styles.products}>
      <div className={styles.header}>
        <h1>My Products (Vendor)</h1>
        <button
          className={styles.addButton}
          onClick={() => navigate('/vendor/add-product')}
        >
          + Add Product
        </button>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
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
                <td>
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={getImageUrl(product.images[0])}
                      alt={product.name}
                      className={styles.thumbnail}
                    />
                  ) : (
                    <span>No Image</span>
                  )}
                </td>
               <td>
                {product.category} / {product.subcategory || "-"} / {product.childcategory || "-"}
               </td>

                <td>₹{product.price}</td>
                <td>
                  {product.variants?.reduce(
                    (total, v) => total + parseInt(v.stock || 0), 0
                  )}
                </td>
                <td>
                  <span
                    className={`${styles.status} ${
                      styles[product.status?.toLowerCase()] || styles.inactive
                    }`}
                  >
                    {product.status || 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button
                      className={styles.editButton}
                      onClick={() => navigate(`/vendor/edit-product/${product._id}`)}
                    >
                      Edit
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={() => handleDelete(product._id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center' }}>
                  No vendor products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VendorProducts;

