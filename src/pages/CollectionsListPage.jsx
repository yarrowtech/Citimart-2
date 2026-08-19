import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE as BACKEND_BASE } from "../config";

const API_BASE = `${BACKEND_BASE}/api/products/collections`; // Flask endpoint

const CollectionsListPage = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_BASE)
      .then((res) => res.json())
      .then((data) => {
        setCollections(data.collections || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Error fetching collections:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p style={{ padding: "2rem" }}>Loading collections...</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h2 style={{ marginBottom: "1rem" }}>🗂️ All Collections</h2>

      {collections.length === 0 ? (
        <p>No collections available.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {collections.map((col) => (
            <div
              key={col._id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "10px",
                padding: "1rem",
                background: "#fff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              {/* Collection Header */}
              <h3 style={{ marginBottom: "0.5rem" }}>{col.name}</h3>
              <p style={{ fontSize: "14px", color: "#555" }}>{col.description}</p>
              <p style={{ fontSize: "13px", color: "#777", marginBottom: "0.5rem" }}>
                Slug: {col.slug}
              </p>

              {/* Products inside collection */}
              {col.products?.length > 0 && (
                <div style={{ marginTop: "1rem" }}>
                  <strong>Products:</strong>
                  <div style={{ marginTop: "0.5rem", display: "grid", gap: "0.5rem" }}>
                    {col.products.map((p) => (
                      <Link
                        key={p._id}
                        to={`/products/${p._id}`} // ✅ ProductDetail route
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          border: "1px solid #eee",
                          borderRadius: "8px",
                          padding: "6px",
                          textDecoration: "none",
                          color: "inherit",
                        }}
                      >
                        <img
                          src={p.image || "/placeholder.png"}
                          alt={p.name}
                          style={{
                            width: "50px",
                            height: "50px",
                            objectFit: "cover",
                            borderRadius: "6px",
                          }}
                        />
                        <div style={{ fontSize: "13px" }}>
                          <strong>{p.name}</strong> <br />
                          ₹{p.discountedPrice}{" "}
                          {p.discount > 0 && (
                            <span style={{ color: "red" }}>(-{p.discount}%)</span>
                          )}
                          <br />
                          Stock: {p.stock} | Brand: {p.brand || "-"}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Link to collection page */}
              <Link
                to={`/collections/${col.slug}`}
                style={{
                  display: "inline-block",
                  marginTop: "1rem",
                  background: "#2563eb",
                  color: "#fff",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  textDecoration: "none",
                  fontSize: "14px",
                }}
              >
                View Collection →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CollectionsListPage;
