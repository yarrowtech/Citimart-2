import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import styles from "./OfferProducts.module.css";

const OfferProducts = () => {
  const { offerId } = useParams();
  const [offer, setOffer] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:5000/api/offers/${offerId}/products`)
      .then((res) => res.json())
      .then((data) => {
        setOffer(data.offer || null);
        setProducts(data.products || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [offerId]);

  const getImageUrl = (image) => {
    if (!image) return "/images/default-placeholder.png";
    if (image.startsWith("http")) return image;
    return `http://localhost:5000${image}`;
  };

  // 🟢 Offer type label mapping
  const getOfferLabel = (offer) => {
    if (!offer) return "";
    switch (offer.type) {
      case "bogo":
        return "Buy 1 Get 1 Free";
      case "free_shipping":
        return "Free Shipping";
      case "flat":
        return `Flat ₹${offer.discount} Off`;
      case "percent":
        return `${offer.discount}% Off`;
      case "deal":
        return "🔥 Deal of the Day";
      case "popup":
        return "✨ Special Popup Offer";
      case "predefined":
        return "🎉 Festival/Seasonal Sale";
      case "referral":
        return "🤝 Refer & Earn";
      case "personalized":
        return "🎯 Personalized Offer";
      default:
        return offer.discount ? `${offer.discount}% Off` : "Special Offer";
    }
  };

  return (
    <div className={styles.offerProducts}>
      <div className={styles.container}>
        {loading ? (
          <p className={styles.loadingText}>Loading...</p>
        ) : !offer ? (
          <p className={styles.noProducts}>Offer not found.</p>
        ) : (
          <>
            {/* Offer Banner / Details */}
            <div className={styles.offerHeader}>
              {offer.image && (
                <img
                  src={getImageUrl(offer.image)}
                  alt={offer.title}
                  className={styles.offerBanner}
                />
              )}
              <div className={styles.offerInfo}>
                <h1 className={styles.pageTitle}>🎁 {offer.title}</h1>
                <p className={styles.offerDescription}>{offer.description}</p>
                <p className={styles.offerMeta}>
                  <strong>Offer Type:</strong> {getOfferLabel(offer)}
                </p>
                {offer.min_purchase && (
                  <p className={styles.offerMeta}>
                    <strong>Min Purchase:</strong> ₹{offer.min_purchase}
                  </p>
                )}
              </div>
            </div>

            {/* Products Grid */}
            {products.length === 0 ? (
              <p className={styles.noProducts}>
                No products found for this offer.
              </p>
            ) : (
              <div className={styles.productGrid}>
                {products.map((p) => (
                  <Link
                    key={p.id}
                    to={`/products/${p.id}`}
                    className={styles.productCard}
                  >
                    <div className={styles.imageWrapper}>
                      <img src={getImageUrl(p.images?.[0])} alt={p.name} />
                    </div>
                    <div className={styles.cardContent}>
                      <h3 className={styles.productName}>{p.name}</h3>
                      <p className={styles.productPrice}>₹{p.price}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OfferProducts;
