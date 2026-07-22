import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FaShoppingCart, FaHeart } from "react-icons/fa";

const CollectionPage = () => {
  const { collectionSlug } = useParams();
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`http://localhost:5000/api/collections/${collectionSlug}`) 
      .then((res) => res.json())
      .then((data) => {
        setCollection(data.collection || null);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching collection:", err);
        setLoading(false);
      });
  }, [collectionSlug]);

  const handleAddToCart = (product) => {
    const customer = localStorage.getItem("customer");
    if (!customer) {
      navigate("/login");
      return;
    }
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart.push(product);
    localStorage.setItem("cart", JSON.stringify(cart));
    alert("Added to cart!");
  };

  const handleAddToWishlist = (product) => {
    const customer = localStorage.getItem("customer");
    if (!customer) {
      navigate("/login");
      return;
    }
    let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
    wishlist.push(product);
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
    alert("Added to wishlist!");
  };

  if (loading) return <p style={{ padding: "2rem" }}>Loading collection...</p>;
  if (!collection) return <p style={{ padding: "2rem" }}>Collection not found.</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h2 style={{ marginBottom: "1rem" }}>{collection.name}</h2>
      <p style={{ marginBottom: "1rem", color: "#555" }}>{collection.description}</p>

      {collection.products?.length === 0 ? (
        <p>No products found in this collection.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "1rem",
          }}
        >
          {collection.products.map((p) => (
            <div
              key={p._id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "1rem",
                background: "#fff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Link to={`/products/${p._id}`} style={{ textDecoration: "none", color: "inherit" }}>
                <img
                  src={p.image || "/placeholder.png"}
                  alt={p.name}
                  style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: "6px" }}
                />
                <h4 style={{ margin: "0.5rem 0" }}>{p.name}</h4>
              </Link>
              <p style={{ margin: "0.25rem 0" }}>₹{p.discountedPrice}</p>
              {p.discount > 0 && <p style={{ color: "red", margin: "0" }}>-{p.discount}%</p>}
              <p style={{ fontSize: "12px", color: "#777", marginBottom: "0.5rem" }}>
                Stock: {p.stock} | Brand: {p.brand || "-"}
              </p>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() => handleAddToCart(p)}
                  style={{ padding: "6px 10px", borderRadius: "5px", border: "none", background: "#2563eb", color: "#fff", cursor: "pointer" }}
                >
                  <FaShoppingCart /> Cart
                </button>
                <button
                  onClick={() => handleAddToWishlist(p)}
                  style={{ padding: "6px 10px", borderRadius: "5px", border: "none", background: "#ef4444", color: "#fff", cursor: "pointer" }}
                >
                  <FaHeart /> Wishlist
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CollectionPage;
