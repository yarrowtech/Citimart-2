import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import styles from './VendorLayout.module.css';
import {
  FaHome,
  FaBox,
  FaShoppingBag,
  FaChartLine,
  FaCog,
  FaSignOutAlt,
  FaBars,
  FaTags,
} from 'react-icons/fa';

const VendorLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [vendorName, setVendorName] = useState('');

  useEffect(() => {
    const storedName = localStorage.getItem('name');
    if (storedName) setVendorName(storedName);

    // Prevent back-button caching issue
    window.history.replaceState(null, null, window.location.href);
    window.onpageshow = (event) => {
      if (event.persisted) window.location.reload();
    };
  }, []);

  const navItems = [
    { path: '/vendor', icon: <FaHome />, label: 'Dashboard' },
    { path: '/vendor/products', icon: <FaBox />, label: 'My Products' },
    { path: '/vendor/orders', icon: <FaShoppingBag />, label: 'Orders' },
    { path: '/vendor/analytics', icon: <FaChartLine />, label: 'Analytics' },
    { path: '/vendor/pricing', icon: <FaTags />, label: 'Pricing Advisor' },
    { path: '/vendor/payouts', icon: <FaTags />, label: 'Payouts' },
    { path: '/vendor/subscription', icon: <FaTags />, label: 'Subscription' },
    { path: '/vendor/verify-business', icon: <FaTags />, label: 'Verify Your Business' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    navigate('/vendor/login', { replace: true });
  };

  return (
    <div className={styles.layout}>
      <aside className={`${styles.sidebar} ${isSidebarOpen ? '' : styles.collapsed}`}>
        <div className={styles.sidebarHeader}>
          <h1 className={styles.logo}>VENDOR</h1>
          <button
            className={styles.toggleBtn}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <FaBars />
          </button>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`${styles.navItem} ${
                location.pathname === item.path ? styles.active : ''
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}

          {/* Updated Logout Button */}
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <h2>Vendor Panel</h2>
            <div className={styles.userInfo}>
              <span>{vendorName || 'Vendor'}</span>
              <Link to="/vendor-settings" className={styles.settingsIcon}>
                <FaCog />
              </Link>
            </div>
          </div>
        </header>

        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default VendorLayout;
