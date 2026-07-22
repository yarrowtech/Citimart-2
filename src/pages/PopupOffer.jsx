import React, { useEffect, useState } from "react";

const PopupOffer = () => {
  const [offer, setOffer] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("popupShown")) return; // avoid repeating in same session

    const fetchPopupOffer = async () => {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      try {
        const res = await fetch("http://localhost:5000/api/offers/eligible", { headers });
        const data = await res.json();

        // filter popup-type offer
        const popupOffer = Array.isArray(data)
          ? data.find((o) => o.type === "popup")
          : data.offers?.find((o) => o.type === "popup");

        if (popupOffer) {
          setOffer(popupOffer);
          setVisible(true);
          localStorage.setItem("popupShown", "true");
        }
      } catch (err) {
        console.error("Error fetching popup offer:", err);
      }
    };

    fetchPopupOffer();
  }, []);

  if (!visible || !offer) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
      onClick={() => setVisible(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "16px",
          padding: "25px",
          maxWidth: "400px",
          width: "90%",
          boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          textAlign: "center",
          animation: "fadeIn 0.4s ease-out",
        }}
      >
        {offer.image && (
          <img
            src={offer.image}
            alt={offer.title}
            style={{
              width: "100%",
              borderRadius: "10px",
              marginBottom: "15px",
            }}
          />
        )}
        <h2>{offer.title}</h2>
        {offer.description && <p>{offer.description}</p>}
        {offer.discount && (
          <p style={{ color: "green", fontWeight: "bold" }}>
            Save {offer.discount}% Now!
          </p>
        )}
        <button
          style={{
            marginTop: "15px",
            backgroundColor: "#ff6600",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            padding: "10px 20px",
            cursor: "pointer",
          }}
          onClick={() => setVisible(false)}
        >
          Claim Offer
        </button>
      </div>
    </div>
  );
};

export default PopupOffer;
