import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import styles from './AdminLayout.module.css';
import {
  FaHome,
  FaBox,
  FaUsers,
  FaStore,
  FaSignOutAlt,
  FaShoppingBag,
  FaBars,
  FaCog,
  FaTags,
  FaChevronDown,
  FaChevronRight,
} from 'react-icons/fa';

import logo from '../assets/logo.jpeg';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [openSections, setOpenSections] = React.useState({}); 

  
  const navSections = [
    {
      label: 'Dashboard',
      items: [{ path: '/admin/dashboard', icon: <FaHome />, label: 'Dashboard' }],
    },
    {
      label: 'Catalog',
      items: [
        { path: '/admin/products', icon: <FaBox />, label: 'Products' },
        { path: '/admin/categories', icon: <FaBox />, label: 'Categories' },
        { path: '/admin/collections', icon: <FaBox />, label: 'Collections' },
        { path: '/admin/inventory', icon: <FaBox />, label: 'Inventory' },
        { path: '/admin/homepage', icon: <FaHome />, label: 'Homepage' },
       
      ],
    },
    {
      label: 'Sales',
      items: [
        { path: '/admin/orders', icon: <FaShoppingBag />, label: 'Orders' },
        { path: '/admin/offers', icon: <FaTags />, label: 'Offers' },
      ],
    },
    {
      label: 'Management',
      items: [
        { path: '/admin/vendors', icon: <FaStore />, label: 'Vendors' },
        { path: '/admin/users', icon: <FaUsers />, label: 'Users' },
        { path: '/admin/subusers', icon: <FaUsers />, label: 'Subusers' },
      ],
    },
    {
  label: 'Support',
  items: [
    { path: '/admin/complaints', icon: <FaBox />, label: 'Complaints' },
    { path: '/admin/feedback', icon: <FaTags />, label: 'Feedback' },
  ],
},

  ];

  const toggleSection = (label) => {
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  React.useEffect(() => {
    window.history.replaceState(null, null, window.location.href);
    window.onpageshow = (event) => {
      if (event.persisted) window.location.reload();
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className={styles.layout}>
      <aside className={`${styles.sidebar} ${isSidebarOpen ? '' : styles.collapsed}`}>
        <div className={styles.sidebarHeader}>
          <h1>
            <Link to="/" className={styles.logo}>
              <img src={logo} alt="CitiMart Logo" className={styles.logoImage} />
            </Link>
          </h1>

          <button
            className={styles.toggleBtn}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <FaBars />
          </button>
        </div>

        <nav className={styles.nav}>
          {navSections.map((section) => (
            <div key={section.label}>
              {/* Section header for collapsible groups */}
              {section.items.length > 1 ? (
                <div
                  className={`${styles.navItem} ${
                    openSections[section.label] ? styles.active : ''
                  }`}
                  onClick={() => toggleSection(section.label)}
                  style={{ cursor: 'pointer' }}
                >
                  {section.items[0].icon}
                  <span>{section.label}</span>
                  <span style={{ marginLeft: 'auto' }}>
                    {openSections[section.label] ? <FaChevronDown /> : <FaChevronRight />}
                  </span>
                </div>
              ) : null}

              {/* Section items */}
              <div
                style={{
                  display:
                    section.items.length > 1
                      ? openSections[section.label]
                        ? 'block'
                        : 'none'
                      : 'block',
                }}
              >
                {section.items.map((item) => (
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
              </div>
            </div>
          ))}

          {/* Logout */}
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div></div>
            <div className={styles.userInfo}>
              <Link to="/admin-settings">
                <FaCog className={styles.settingsIcon} />
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

export default AdminLayout;
