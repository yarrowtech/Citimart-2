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
  FaBell,
  FaTags,
  FaChevronDown,
  FaChevronRight,
} from 'react-icons/fa';

import logo from '../assets/logo.jpeg';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(() => window.innerWidth > 900);
  const [openSections, setOpenSections] = React.useState({});
  const [notifications, setNotifications] = React.useState([]);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const notificationRef = React.useRef(null);

  
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

  const closeMobileSidebar = () => {
    if (window.innerWidth <= 900) setIsSidebarOpen(false);
  };

  const toggleSection = (label) => {
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) setIsSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    window.history.replaceState(null, null, window.location.href);
    window.onpageshow = (event) => {
      if (event.persisted) window.location.reload();
    };
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  React.useEffect(() => {
    const loadNotifications = async () => {
      const token = localStorage.getItem('adminToken');
      if (!token) return;
      try {
        const response = await fetch('http://localhost:5000/api/dashboard/overview?period=daily', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const payload = await response.json();
        if (response.ok) setNotifications(payload.alerts || []);
      } catch (error) {
        console.error('Unable to load admin notifications:', error);
      }
    };
    loadNotifications();
    const interval = window.setInterval(loadNotifications, 60000);
    return () => window.clearInterval(interval);
  }, []);

  React.useEffect(() => {
    const closeDropdown = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', closeDropdown);
    return () => document.removeEventListener('mousedown', closeDropdown);
  }, []);
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className={styles.layout}>
      {isSidebarOpen && (
        <button className={styles.backdrop} aria-label="Close navigation" onClick={() => setIsSidebarOpen(false)} />
      )}
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
            aria-label={isSidebarOpen ? 'Collapse navigation' : 'Open navigation'}
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
                    onClick={closeMobileSidebar}
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
            <button className={styles.mobileMenuBtn} onClick={() => setIsSidebarOpen(true)} aria-label="Open navigation">
              <FaBars />
            </button>
            <div className={styles.pageIdentity}>Admin workspace</div>
            <div className={styles.userInfo}>
              <div className={styles.notificationWrap} ref={notificationRef}>
                <button className={styles.notificationBtn} onClick={() => setNotificationsOpen((open) => !open)}
                  aria-label={`Notifications${notifications.length ? `, ${notifications.length} unread` : ''}`} aria-expanded={notificationsOpen}>
                  <FaBell />
                  {notifications.length > 0 && <span className={styles.notificationBadge}>{notifications.length > 9 ? '9+' : notifications.length}</span>}
                </button>
                {notificationsOpen && (
                  <div className={styles.notificationPanel}>
                    <div className={styles.notificationHeader}>
                      <div><strong>Notifications</strong><small>Live operations alerts</small></div><span>{notifications.length}</span>
                    </div>
                    <div className={styles.notificationList}>
                      {notifications.length ? notifications.map((notice, index) => (
                        <Link key={`${notice.text}-${index}`} to={notice.path || '/admin/dashboard'} onClick={() => setNotificationsOpen(false)} className={styles.notificationItem}>
                          <span className={`${styles.notificationDot} ${styles[notice.type]}`} /><span>{notice.text}</span><b>→</b>
                        </Link>
                      )) : <div className={styles.noNotifications}>✓ No alerts right now</div>}
                    </div>
                    <Link to="/admin/dashboard" onClick={() => setNotificationsOpen(false)} className={styles.notificationFooter}>Open dashboard</Link>
                  </div>
                )}
              </div>
              <Link to="/admin-settings" aria-label="Admin settings"><FaCog className={styles.settingsIcon} /></Link>
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
