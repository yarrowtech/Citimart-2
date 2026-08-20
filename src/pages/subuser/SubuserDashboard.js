import React, { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { API_BASE } from "../../config";
import styles from "./SubuserDashboard.module.css";

import SegmentationPanel from "./panels/SegmentationPanel";
import OffersPanel from "./panels/OffersPanel";
import ComplaintsPanel from "./panels/ComplaintsPanel";
import ReportsPanel from "./panels/ReportsPanel";
import MerchandisePanel from "./panels/MerchandisePanel";
import FaqPanel from "./panels/FaqPanel";
import ContentPanel from "./panels/ContentPanel";
import MediaPanel from "./panels/MediaPanel";
import VendorReviewPanel from "./panels/VendorReviewPanel";

// Role → color theme + icon. Purely cosmetic — actual access is always
// driven by the subuser's real granted permissions, not their role name.
const ROLE_THEMES = {
  "Viewer": { accent: "#6366f1", accent2: "#8b5cf6", icon: "👁️" },
  "Order Manager": { accent: "#f59e0b", accent2: "#f97316", icon: "📦" },
  "Inventory Manager": { accent: "#10b981", accent2: "#059669", icon: "📊" },
  "Merchandise Manager": { accent: "#ec4899", accent2: "#db2777", icon: "🛍️" },
  "Marketing Manager": { accent: "#8b5cf6", accent2: "#7c3aed", icon: "📣" },
  "Support Staff": { accent: "#0ea5e9", accent2: "#0284c7", icon: "🎧" },
  "Moderator": { accent: "#ef4444", accent2: "#dc2626", icon: "🛡️" },
};
const DEFAULT_THEME = { accent: "#6366f1", accent2: "#8b5cf6", icon: "🧑‍💼" };

// One panel per permission key. Only permissions the subuser actually holds
// render as tabs — no placeholder/dummy tabs for ungranted modules.
const TAB_DEFS = [
  { key: "segmentation", label: "Segmentation", icon: "🎯", Component: SegmentationPanel },
  { key: "promotions", label: "Promotions", icon: "🏷️", Component: OffersPanel, props: { label: "Promotions" } },
  { key: "campaigns", label: "Campaigns", icon: "📢", Component: OffersPanel, props: { label: "Campaigns" } },
  { key: "merchandise", label: "Merchandise", icon: "🧺", Component: MerchandisePanel },
  { key: "complaints", label: "Complaints", icon: "💬", Component: ComplaintsPanel },
  { key: "reports", label: "Reports", icon: "📈", Component: ReportsPanel },
  { key: "analytics", label: "Analytics", icon: "📊", Component: ReportsPanel },
  { key: "content", label: "Content", icon: "📝", Component: ContentPanel },
  { key: "faq", label: "FAQ", icon: "❓", Component: FaqPanel },
  { key: "media", label: "Media", icon: "🖼️", Component: MediaPanel },
];

const SubuserDashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("subuserToken");

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState(false);
  const [activeTab, setActiveTab] = useState(null);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch(`${API_BASE}/subuser/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error("session");
        return res.json();
      })
      .then((data) => {
        setProfile(data);
        const availableKeys = TAB_DEFS.filter((t) => data.permissions?.[t.key]).map((t) => t.key);
        setActiveTab(availableKeys[0] || "vendors");
      })
      .catch(() => setSessionError(true))
      .finally(() => setLoading(false));
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("subuserToken");
    navigate("/subuser/login");
  };

  if (!token) return <Navigate to="/subuser/login" replace />;

  if (loading) {
    return <div className={styles.loadingScreen}>Loading your dashboard…</div>;
  }

  if (sessionError || !profile) {
    return (
      <div className={styles.gateScreen}>
        <h2>Your session has expired</h2>
        <p>Please log in again to continue.</p>
        <button onClick={handleLogout}>Back to Login</button>
      </div>
    );
  }

  const theme = ROLE_THEMES[profile.role] || DEFAULT_THEME;
  const tabs = TAB_DEFS.filter((t) => profile.permissions?.[t.key]);
  const activeDef = tabs.find((t) => t.key === activeTab);
  const showVendorReview = activeTab === "vendors";

  return (
    <div
      className={styles.shell}
      style={{ "--accent": theme.accent, "--accent-2": theme.accent2 }}
    >
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>{theme.icon}</span>
          <div>
            <div className={styles.brandTitle}>Citimart</div>
            <div className={styles.brandSub}>SUBUSER CONSOLE</div>
          </div>
        </div>

        <div className={styles.profileCard}>
          <div className={styles.avatar}>{theme.icon}</div>
          <div>
            <div className={styles.profileRole}>{profile.role}</div>
            <div className={styles.profileEmail}>{profile.email}</div>
          </div>
        </div>

        <nav className={styles.nav}>
          <button
            className={`${styles.navItem} ${showVendorReview ? styles.navItemActive : ""}`}
            onClick={() => setActiveTab("vendors")}
          >
            <span className={styles.navIcon}>🏬</span> Vendor Approvals
          </button>

          {tabs.length === 0 && (
            <p className={styles.noTabs}>No additional modules granted yet. Contact your admin to request access.</p>
          )}
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`${styles.navItem} ${activeTab === t.key ? styles.navItemActive : ""}`}
              onClick={() => setActiveTab(t.key)}
            >
              <span className={styles.navIcon}>{t.icon}</span> {t.label}
            </button>
          ))}
        </nav>

        <button className={styles.logoutBtn} onClick={handleLogout}>🚪 Log out</button>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <h1>{showVendorReview ? "Vendor Approvals" : activeDef ? activeDef.label : "Dashboard"}</h1>
          <span className={styles.topbarBadge}>{theme.icon} {profile.role}</span>
        </header>
        <div className={styles.panelArea}>
          {showVendorReview ? (
            <VendorReviewPanel token={token} />
          ) : activeDef ? (
            <activeDef.Component token={token} profile={profile} {...(activeDef.props || {})} />
          ) : (
            <div style={{ color: "#9ca3af", textAlign: "center", padding: 60 }}>
              You haven't been granted access to any modules yet.
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SubuserDashboard;
