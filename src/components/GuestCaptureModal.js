// src/components/GuestCaptureModal.js
// Shown instead of a blind redirect when a guest tries to add to cart/wishlist.
// Lets them request a registration link by email, or fall back to the normal login page.
import React, { useState } from "react";

const API_BASE = "http://localhost:5000";

const GuestCaptureModal = ({ productName, onClose, onLoginInstead }) => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    setError("");
    try {
      const res = await fetch(`${API_BASE}/guest/capture-lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, product_name: productName || null }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("sent");
      } else {
        setStatus("error");
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setError("Network error. Please try again.");
    }
  };

  return (
    <>
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9998,
      }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        zIndex: 9999, background: "#fff", borderRadius: 16,
        width: "min(92vw, 420px)", overflow: "hidden",
        boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
      }}>
        <div style={{
          padding: "20px 22px", background: "linear-gradient(135deg,#ff3f6c,#ff8c42)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <h3 style={{ margin: 0, color: "#fff", fontSize: 17, fontWeight: 700 }}>
            Join Citimart
          </h3>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.2)", border: "none", color: "#fff",
            width: 30, height: 30, borderRadius: "50%", cursor: "pointer",
            fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700,
          }} aria-label="Close">×</button>
        </div>

        <div style={{ padding: 22 }}>
          {status === "sent" ? (
            <>
              <p style={{ fontSize: 14, color: "#111", lineHeight: 1.5, margin: "0 0 6px" }}>
                ✅ Invite sent to <strong>{email}</strong>.
              </p>
              <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 18px" }}>
                Check your inbox for the signup link.
              </p>
              <button onClick={onClose} style={{
                width: "100%", padding: "11px 12px", background: "#f3f4f6", color: "#111",
                border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer",
              }}>
                Continue Browsing
              </button>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <p style={{ fontSize: 13.5, color: "#374151", lineHeight: 1.5, margin: "0 0 16px" }}>
                {productName
                  ? <>You need an account to add <strong>{productName}</strong> to your cart or wishlist. Enter your email and we'll send you a link to register.</>
                  : "You need an account to do that. Enter your email and we'll send you a link to register."}
              </p>
              <input
                type="email"
                required
                autoFocus
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%", boxSizing: "border-box", padding: "11px 14px",
                  border: "1px solid #d1d5db", borderRadius: 10, fontSize: 14, marginBottom: 10,
                }}
              />
              {status === "error" && (
                <p style={{ color: "#ef4444", fontSize: 12.5, margin: "0 0 10px" }}>{error}</p>
              )}
              <button type="submit" disabled={status === "sending"} style={{
                width: "100%", padding: "11px 12px",
                background: "linear-gradient(135deg,#ff3f6c,#ff6b35)", color: "#fff",
                border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13,
                cursor: status === "sending" ? "not-allowed" : "pointer",
                opacity: status === "sending" ? 0.7 : 1,
              }}>
                {status === "sending" ? "Sending…" : "Email Me a Signup Link"}
              </button>
              <button type="button" onClick={onLoginInstead} style={{
                width: "100%", marginTop: 10, padding: "9px 12px",
                background: "none", border: "none", color: "#3c82f6",
                fontWeight: 600, fontSize: 12.5, cursor: "pointer", textDecoration: "underline",
              }}>
                Already have an account? Log in
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default GuestCaptureModal;
