import React from "react";
import styles from "./OrderIssuesModal.module.css";

const ICONS = {
  out_of_stock: "📦",
  not_deliverable: "🚚",
  bad_pincode: "📍",
  unavailable: "❓",
};

// Shown when the server blocks "Place Order" because something about the
// cart can't actually be fulfilled right now — out of stock, or the
// delivery pincode isn't served yet. Real, specific reasons from the
// backend's pre-order check, not a generic "something went wrong" alert.
const OrderIssuesModal = ({ issues, onClose }) => {
  if (!issues || issues.length === 0) return null;
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <div className={styles.icon}>😕</div>
        <h3>Oops, we can't place this order yet</h3>
        <ul className={styles.list}>
          {issues.map((issue, i) => (
            <li key={i}>
              <span className={styles.itemIcon}>{ICONS[issue.type] || "⚠️"}</span>
              <span>{issue.message}</span>
            </li>
          ))}
        </ul>
        <button className={styles.closeBtn} onClick={onClose}>Got it, let me fix it</button>
      </div>
    </div>
  );
};

export default OrderIssuesModal;
