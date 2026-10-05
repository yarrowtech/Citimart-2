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
  FaChartLine,
  FaBug,
  FaHeadset,
} from 'react-icons/fa';

import logo from '../assets/logo.jpeg';

import { API_BASE } from "../config";
const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(() => window.innerWidth > 900);
  const [openSections, setOpenSections] = React.useState({});
  const [notifications, setNotifications] = React.useState([]);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const [chatUnread, setChatUnread] = React.useState(0);
  const notificationRef = React.useRef(null);

  
  const navSections = [
    {
      label: 'Dashboard',
      items: [
        { path: '/admin/dashboard', icon: <FaHome />, label: 'Dashboard' },
        { path: '/admin/analytics', icon: <FaChartLine />, label: 'Analytics' },
        { path: '/admin/errors', icon: <FaBug />, label: 'Error Center' },
      ],
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
        { path: '/admin/crm', icon: <FaUsers />, label: 'CRM' },
        { path: '/admin/finance', icon: <FaTags />, label: 'Finance' },
        { path: '/admin/vendor-kyb', icon: <FaUsers />, label: 'Vendor Verification' },
        { path: '/admin/subusers', icon: <FaUsers />, label: 'Subusers' },
      ],
    },
    {
  label: 'Support',
  items: [
    { path: '/admin/complaints', icon: <FaBox />, label: 'Complaints' },
    { path: '/admin/support', icon: <FaHeadset />, label: 'Support Center' },
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
      const headers = { Authorization: `Bearer ${token}` };
      try {
        const [feedRes, dashRes] = await Promise.all([
          fetch(`${API_BASE}/admin/notifications`, { headers }),
          fetch(`${API_BASE}/api/dashboard/overview?period=daily`, { headers }),
        ]);
        const feed = feedRes.ok ? await feedRes.json() : { items: [] };
        fetch(`${API_BASE}/chat/unread-summary`, { headers })
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => { if (d) setChatUnread(d.total); })
          .catch(() => {});
        const dash = dashRes.ok ? await dashRes.json() : { alerts: [] };
        const stockAndQueue = (dash.alerts || []).map((alert) => ({
          id: `alert-${alert.text}`,
          severity: alert.type,
          title: alert.text,
          detail: '',
          path: alert.path,
        }));
        const merged = [...(feed.items || []), ...stockAndQueue].map((item) => ({
          ...item,
          type: item.severity,
          text: item.title,
        }));
        setNotifications(merged);
      } catch (error) {
        console.error('Unable to load admin notifications:', error);
      }
    };
    loadNotifications();
    const interval = window.setInterval(loadNotifications, 30000);
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
                    {item.path === '/admin/support' && chatUnread > 0 && (
                      <span className={styles.navBadge}>{chatUnread > 9 ? '9+' : chatUnread}</span>
                    )}
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
                      <div><strong>Notifications</strong><small>Live alerts · refreshes every 30s</small></div><span>{notifications.length}</span>
                    </div>
                    <div className={styles.notificationList}>
                      {notifications.length ? notifications.map((notice, index) => (
                        <Link key={`${notice.id || notice.text}-${index}`} to={notice.path || '/admin/dashboard'} onClick={() => setNotificationsOpen(false)} className={styles.notificationItem}>
                          <span className={`${styles.notificationDot} ${styles[notice.type]}`} />
                          <span>{notice.text}{notice.detail && <small style={{ display: 'block', color: '#86798f' }}>{notice.detail}</small>}</span><b>→</b>
                        </Link>
                      )) : <div className={styles.noNotifications}>✓ No alerts right now</div>}
                    </div>
                    <Link to="/admin/errors" onClick={() => setNotificationsOpen(false)} className={styles.notificationFooter}>Open Error Center</Link>
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
