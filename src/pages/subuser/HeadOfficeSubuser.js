import React, { useState } from "react";
import styles from "./HeadOfficeSubuser.module.css";
import { useNavigate } from "react-router-dom";

const TABS = [
  "Vendor Review",
  "Segmentation Requests",
  "Trends & Monitoring",
  "Pending Approvals",
  "Reports",
  "Flagged Accounts",
  "Content & Campaigns",
  "Complaints",
  "Logistics Support",
];

const HeadOfficeSubuserDashboard = () => {
  const [activeTab, setActiveTab] = useState("Vendor Review");
  const navigate = useNavigate();

  // Dummy data sets
  const vendors = [
    { name: "GreenMart Pvt Ltd", category: "Groceries", documents: "Verified", status: "Approved" },
    { name: "ElectroWorld", category: "Electronics", documents: "Pending", status: "Under Review" },
    { name: "FreshThreads", category: "Apparel", documents: "Verified", status: "Rejected" },
  ];

  const segmentationRequests = [
    { name: "Student Discount", requestedBy: "Marketing Team", status: "Pending" },
    { name: "Loyal Customers Tier", requestedBy: "CRM Team", status: "Approved" },
  ];

  const pendingApprovals = [
    { type: "Offer", name: "Diwali Sale 2025", requestedBy: "Merchandiser A", status: "Pending" },
    { type: "Category", name: "Eco-friendly Products", requestedBy: "Vendor B", status: "Pending" },
    { type: "Segmentation", name: "VIP Members", requestedBy: "CRM", status: "Approved" },
  ];

  const flaggedAccounts = [
    { name: "TechDealers", reason: "Duplicate Listings", flaggedBy: "System" },
    { name: "SmartBuy", reason: "Unverified GST", flaggedBy: "Audit Team" },
  ];

  const complaints = [
    { id: 1, user: "Rahul Mehta", type: "Delivery Delay", status: "Resolved" },
    { id: 2, user: "Priya Singh", type: "Damaged Product", status: "Pending" },
    { id: 3, user: "Ankit Sharma", type: "Refund Not Received", status: "In Progress" },
  ];

  const trends = [
    { metric: "Top Category", value: "Electronics" },
    { metric: "Fastest-Growing Segment", value: "Organic Food" },
    { metric: "Complaint Rate", value: "2.1%" },
  ];

  const campaigns = [
    { title: "Summer Bonanza", status: "Live", reach: "25K+" },
    { title: "Festive Flash Sale", status: "Draft", reach: "-" },
    { title: "Loyalty Boost", status: "Completed", reach: "40K+" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login"); // Redirect to login or homepage
  };

  const renderContent = () => {
    switch (activeTab) {
      case "Vendor Review":
        return (
          <div className={styles.section}>
            <h3>📝 Vendor Review</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Documents</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((v, i) => (
                  <tr key={i}>
                    <td>{v.name}</td>
                    <td>{v.category}</td>
                    <td>{v.documents}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${
                          v.status === "Approved"
                            ? styles.success
                            : v.status === "Rejected"
                            ? styles.error
                            : styles.warning
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "Segmentation Requests":
        return (
          <div className={styles.section}>
            <h3>👥 Segmentation Requests</h3>
            <ul className={styles.list}>
              {segmentationRequests.map((r, i) => (
                <li key={i}>
                  <strong>{r.name}</strong> — Requested by {r.requestedBy}{" "}
                  <span
                    className={`${styles.badge} ${
                      r.status === "Approved" ? styles.success : styles.warning
                    }`}
                  >
                    {r.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );

      case "Trends & Monitoring":
        return (
          <div className={styles.section}>
            <h3>📊 Trends & Monitoring</h3>
            <div className={styles.cards}>
              {trends.map((t, i) => (
                <div key={i} className={styles.card}>
                  <h4>{t.metric}</h4>
                  <p>{t.value}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case "Pending Approvals":
        return (
          <div className={styles.section}>
            <h3>⏳ Pending Approvals</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Name</th>
                  <th>Requested By</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pendingApprovals.map((p, i) => (
                  <tr key={i}>
                    <td>{p.type}</td>
                    <td>{p.name}</td>
                    <td>{p.requestedBy}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${
                          p.status === "Approved" ? styles.success : styles.warning
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "Reports":
        return (
          <div className={styles.section}>
            <h3>📑 Reports Summary</h3>
            <ul className={styles.list}>
              <li>🧾 152 Vendors Onboarded in October</li>
              <li>💰 Total Sales Volume: ₹1.8 Cr</li>
              <li>🎯 Top Campaign ROI: 142%</li>
              <li>📦 Avg Order Value: ₹1,250</li>
            </ul>
          </div>
        );

      case "Flagged Accounts":
        return (
          <div className={styles.section}>
            <h3>🚩 Flagged Accounts</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Reason</th>
                  <th>Flagged By</th>
                </tr>
              </thead>
              <tbody>
                {flaggedAccounts.map((a, i) => (
                  <tr key={i}>
                    <td>{a.name}</td>
                    <td>{a.reason}</td>
                    <td>{a.flaggedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "Content & Campaigns":
        return (
          <div className={styles.section}>
            <h3>🎨 Content & Campaigns</h3>
            <div className={styles.cards}>
              {campaigns.map((c, i) => (
                <div key={i} className={styles.card}>
                  <h4>{c.title}</h4>
                  <p>Reach: {c.reach}</p>
                  <span
                    className={`${styles.badge} ${
                      c.status === "Live"
                        ? styles.success
                        : c.status === "Draft"
                        ? styles.warning
                        : styles.neutral
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );

      case "Complaints":
        return (
          <div className={styles.section}>
            <h3>⚠️ Complaints Management</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td>{c.user}</td>
                    <td>{c.type}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${
                          c.status === "Resolved"
                            ? styles.success
                            : c.status === "Pending"
                            ? styles.warning
                            : styles.info
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "Logistics Support":
        return (
          <div className={styles.section}>
            <h3>🚚 Logistics Support</h3>
            <ul className={styles.list}>
              <li>📦 Order #A123 - Dispatched via BlueDart</li>
              <li>📦 Order #B562 - Out for delivery</li>
              <li>📦 Order #C778 - Delivered successfully</li>
            </ul>
          </div>
        );

      default:
        return <p>Select a module from the sidebar.</p>;
    }
  };

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <h3>🏢 Head Office Subuser</h3>
        <ul>
          {TABS.map((tab) => (
            <li
              key={tab}
              className={activeTab === tab ? styles.active : ""}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </li>
          ))}
        </ul>

        <button className={styles.logoutBtn} onClick={handleLogout}>
          🚪 Logout
        </button>
      </aside>

      <main className={styles.content}>{renderContent()}</main>
    </div>
  );
};

export default HeadOfficeSubuserDashboard;
