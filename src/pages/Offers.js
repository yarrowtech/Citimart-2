import React from 'react';
import styles from './Offers.module.css';

const offers = [
  {
    title: 'Sale Offer',
    description: 'Up to 60% OFF on selected styles! Shop the latest trends at unbeatable prices.',
    details: 'Limited time only. Selected products and categories. While stocks last.'
  },
  {
    title: 'Promo',
    description: 'Use code FASHION10 for an extra 10% OFF on your order.',
    details: 'Applicable on minimum purchase of ₹999. One-time use per customer.'
  },
  {
    title: 'Pick Any at ₹99',
    description: 'Special collection: Pick any item at just ₹99! Dont miss out.',
    details: 'Valid on select products only. No coupon required.'
  },
  {
    title: 'Buy One Get One',
    description: 'BOGO on select T-Shirts and Accessories. Double the style, same price!',
    details: 'Add two eligible items to cart. Discount applied at checkout.'
  }
];

const Offers = () => (
  <div className={styles.offersPage}>
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Offers & Promotions</h1>
      <p className={styles.pageSubtitle}>Explore our latest deals and save big on your favorite styles!</p>
      <div className={styles.offersList}>
        {offers.map((offer, idx) => (
          <div className={styles.offerSection} key={idx}>
            <h2 className={styles.offerTitle}>{offer.title}</h2>
            <p className={styles.offerDescription}>{offer.description}</p>
            <p className={styles.offerDetails}>{offer.details}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Offers; 