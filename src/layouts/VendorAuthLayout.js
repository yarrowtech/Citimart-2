import React from "react";
import { Link, Outlet } from "react-router-dom";
import logo from "../assets/log.JPG";
import styles from "./VendorAuthLayout.module.css";

// Minimal shell for vendor sign-in pages (login, forgot password). Deliberately
// has none of the shopper chrome (cart, wishlist, search, category menus, the
// customer support chat bubble) — this is a business sign-in, not a storefront
// page, so it shouldn't be wrapped in MainLayout.
const VendorAuthLayout = () => (
  <div className={styles.shell}>
    <header className={styles.header}>
      <Link to="/" className={styles.brand}>
        <img src={logo} alt="CitiMart" className={styles.logo} />
        <span>Citimart <strong>Partner Portal</strong></span>
      </Link>
      <Link to="/" className={styles.backLink}><span aria-hidden="true">←</span> Back to store</Link>
    </header>
    <main className={styles.main}>
      <Outlet />
    </main>
  </div>
);

export default VendorAuthLayout;
