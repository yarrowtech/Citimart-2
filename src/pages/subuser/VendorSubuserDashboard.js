import React, { useState, useEffect } from "react";
import styles from "./VendorSubuserDashboard.module.css";
import { API_BASE } from "../../config";

const BACKEND_URL = API_BASE;

const TABS = [
  "Vendor Registration",
  "Compliance Check",
  "Approval Reports",
  "Category Requests",
  "Complaints & Issues",
  "Onboarding Reports",
  "Flagged Vendors",
  "Stock Monitoring",
  "Pending Approvals",
];

const VendorSubuserDashboard = () => {
  const [activeTab, setActiveTab] = useState("Vendor Registration");
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedApp, setSelectedApp] = useState(null);
  const [vendorDetails, setVendorDetails] = useState({});
  const [categoriesData, setCategoriesData] = useState({});
  const [approvedCategories, setApprovedCategories] = useState([]);
  const [approvedSubcategories, setApprovedSubcategories] = useState({});
  const [approvedChildCategories, setApprovedChildCategories] = useState({});

  const subuserId = localStorage.getItem("userId");

  // ---------- Fetch Categories ----------
  const fetchCategories = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/categories`);
      const data = await res.json();
      const formatted = {};
      data.categories.forEach((cat) => {
        formatted[cat.name] = {};
        cat.subCategories.forEach((sub) => {
          formatted[cat.name][sub.name] = sub.childCategories || [];
        });
      });
      setCategoriesData(formatted);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // ---------- Fetch Vendors ----------
  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/subuser/vendors`);
      const data = await res.json();
      setVendors(data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load vendors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "Vendor Registration") fetchVendors();
  }, [activeTab]);

  // ---------- Approve / Reject ----------
  const handleDecision = async (vendorId, approve) => {
    try {
      const res = await fetch(`${API_BASE}/subuser/vendor/${vendorId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approve, subuserId }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchVendors();
        handleCloseModal();
      } else {
        alert(data.error || "Action failed");
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
    }
  };

  // ---------- Modal Handlers ----------
  const handleOpenModal = (vendor) => {
    setSelectedApp(vendor);
    setVendorDetails(vendor);

    // Initialize approved categories, subcategories, child categories from vendor data
    const mainCats = vendor.productCategories || [];
    const subs = {};
    const childCats = {};

    if (vendor.selectedSubcategories) {
      Object.entries(vendor.selectedSubcategories).forEach(([cat, subObj]) => {
        subs[cat] = Object.keys(subObj); // subcategories
        Object.entries(subObj).forEach(([sub, children]) => {
          childCats[sub] = children; // child categories
        });
      });
    }

    setApprovedCategories(mainCats);
    setApprovedSubcategories(subs);
    setApprovedChildCategories(childCats);
  };

  const handleCloseModal = () => {
    setSelectedApp(null);
    setVendorDetails({});
    setApprovedCategories([]);
    setApprovedSubcategories({});
    setApprovedChildCategories({});
  };

  // ---------- Category Selection ----------
  const toggleCategory = (cat) => {
    setApprovedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleSubcategory = (cat, sub) => {
    setApprovedSubcategories((prev) => ({
      ...prev,
      [cat]: prev[cat]?.includes(sub)
        ? prev[cat].filter((s) => s !== sub)
        : [...(prev[cat] || []), sub],
    }));
  };

  const toggleChildCategory = (sub, child) => {
    setApprovedChildCategories((prev) => ({
      ...prev,
      [sub]: prev[sub]?.includes(child)
        ? prev[sub].filter((c) => c !== child)
        : [...(prev[sub] || []), child],
    }));
  };

  // ---------- Content ----------
  const renderContent = () => {
    switch (activeTab) {
      case "Vendor Registration":
        return (
          <div>
            <h3>📝 Vendor Registration</h3>
            <p>Review new vendor registration forms and approve/reject them.</p>

            {loading ? (
              <p>Loading vendors...</p>
            ) : error ? (
              <p className={styles.error}>{error}</p>
            ) : vendors.length === 0 ? (
              <p>No pending vendors for review.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Vendor Name</th>
                    <th>Business Name</th>
                    <th>Email</th>
                    <th>Type</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map((v) => (
                    <tr key={v._id}>
                      <td>{v.fullName}</td>
                      <td>{v.businessName}</td>
                      <td>{v.email}</td>
                      <td>{v.businessType}</td>
                      <td>
                        <button
                          className={styles.viewBtn}
                          onClick={() => handleOpenModal(v)}
                        >
                          👁️ Review
                        </button>
                        <button
                          className={styles.rejectBtn}
                          onClick={() => handleDecision(v._id, false)}
                        >
                          ❌ Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      // ---- rest of your existing cases unchanged ----
      case "Compliance Check":
        return (
          <div>
            <h3>✅ Compliance Check</h3>
            <p>Verify GST and document compliance of vendors.</p>
            <ul>
              <li>Vendor: Elite Traders – GST Verified ✅</li>
              <li>Vendor: FreshMart Foods – PAN Missing ⚠️</li>
              <li>Vendor: Craftsy India – Pending KYC Upload ⏳</li>
            </ul>
          </div>
        );

      case "Approval Reports":
        return (
          <div>
            <h3>📊 Approval Reports</h3>
            <p>Maintain reports of pending, rejected, and approved vendors.</p>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Urban Supplies</td>
                  <td>Approved</td>
                  <td>2025-10-20</td>
                </tr>
                <tr>
                  <td>Craftsy India</td>
                  <td>Rejected</td>
                  <td>2025-10-18</td>
                </tr>
              </tbody>
            </table>
          </div>
        );

      case "Category Requests":
        return (
          <div>
            <h3>📂 Category Requests</h3>
            <p>Review vendor category approval requests and forward to Admin.</p>
            <ul>
              <li>Elite Traders – Wants to add “Home Decor” category</li>
              <li>FreshMart Foods – Requests “Organic” category access</li>
            </ul>
          </div>
        );

      case "Complaints & Issues":
        return (
          <div>
            <h3>⚠️ Complaints & Issues</h3>
            <p>Monitor complaints, offer submissions, and inventory-related issues.</p>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Complaint ID</th>
                  <th>Vendor</th>
                  <th>Issue</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>CMP-2025-001</td>
                  <td>FreshMart Foods</td>
                  <td>Delayed stock delivery</td>
                  <td>In Progress</td>
                </tr>
                <tr>
                  <td>CMP-2025-002</td>
                  <td>Craftsy India</td>
                  <td>Pricing dispute</td>
                  <td>Resolved</td>
                </tr>
              </tbody>
            </table>
          </div>
        );

      case "Onboarding Reports":
        return (
          <div>
            <h3>📑 Onboarding Reports</h3>
            <p>Maintain detailed onboarding dashboards for Admin review.</p>
            <ul>
              <li>Total Vendors Onboarded: 120</li>
              <li>Pending Approvals: 15</li>
              <li>Avg. Onboarding Time: 2.3 days</li>
            </ul>
          </div>
        );

      case "Flagged Vendors":
        return (
          <div>
            <h3>🚩 Flagged Vendors</h3>
            <p>Track vendors with repeated complaints or discrepancies.</p>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Reason</th>
                  <th>Action Taken</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Urban Supplies</td>
                  <td>3 delayed shipments</td>
                  <td>Under Review</td>
                </tr>
                <tr>
                  <td>Craftsy India</td>
                  <td>Repeated pricing issues</td>
                  <td>Temporarily Suspended</td>
                </tr>
              </tbody>
            </table>
          </div>
        );

      case "Stock Monitoring":
        return (
          <div>
            <h3>📦 Stock Monitoring</h3>
            <p>Monitor vendor inventory levels and alert Admin of stock issues.</p>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Product</th>
                  <th>Stock Left</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>FreshMart Foods</td>
                  <td>Organic Honey</td>
                  <td>5 units</td>
                  <td>Low Stock ⚠️</td>
                </tr>
                <tr>
                  <td>Elite Traders</td>
                  <td>LED Lamps</td>
                  <td>120 units</td>
                  <td>Healthy ✅</td>
                </tr>
              </tbody>
            </table>
          </div>
        );

      case "Pending Approvals":
        return (
          <div>
            <h3>⏳ Pending Approvals</h3>
            <p>Track pending category and offer approvals for vendors.</p>
            <ul>
              <li>Elite Traders – Offer: “Diwali Discount 20%” (Awaiting Review)</li>
              <li>FreshMart Foods – Category: “Beverages” (Under Process)</li>
            </ul>
          </div>
        );

      default:
        return <p>Select a module from the sidebar.</p>;
    }
  };

  
   
  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <h3>Vendor Subuser</h3>
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
        <button
          className={styles.logoutBtn}
          onClick={() => {
            localStorage.clear();
            window.location.href = "/login";
          }}
        >
          🚪 Logout
        </button>
      </aside>

      {/* Main */}
      <main className={styles.content}>
        <h2>{activeTab}</h2>
        {renderContent()}
      </main>

      {/* Modal */}
      {selectedApp && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeModal} onClick={handleCloseModal}>
              ×
            </button>
            <h3>Review Vendor Application</h3>

            <div className={styles.modalContent}>
              <h4>Personal Details</h4>
              <p><strong>Name:</strong> {vendorDetails.fullName}</p>
              <p><strong>Email:</strong> {vendorDetails.email}</p>
              <p><strong>Phone:</strong> {vendorDetails.phone}</p>

              <h4>Business Info</h4>
              <p><strong>Business Name:</strong> {vendorDetails.businessName}</p>
              <p><strong>Type:</strong> {vendorDetails.businessType}</p>
              <p><strong>GST:</strong> {vendorDetails.gstNo}</p>
              <p><strong>Reg No:</strong> {vendorDetails.businessRegNo}</p>
              <p><strong>Address:</strong> {vendorDetails.businessAddress}</p>
              <p><strong>Description:</strong> {vendorDetails.productDesc}</p>

              {vendorDetails.documents?.length > 0 && (
                <>
                  <h4>Uploaded Documents</h4>
                  {vendorDetails.documents.map((doc, i) => (
                    <a key={i} href={doc} target="_blank" rel="noreferrer">
                      Document {i + 1}
                    </a>
                  ))}
                </>
              )}

              {vendorDetails.productImages?.length > 0 && (
                <>
                  <h4>Product Images</h4>
                  <div className={styles.imageGrid}>
                    {vendorDetails.productImages.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={`Product ${i}`}
                        className={styles.productImage}
                      />
                    ))}
                  </div>
                </>
              )}

              <h4>Select Categories</h4>
              {Object.keys(categoriesData).map((cat) => (
                <div key={cat}>
                  <label>
                    <input
                      type="checkbox"
                      checked={approvedCategories.includes(cat)}
                      onChange={() => toggleCategory(cat)}
                    />
                    {cat}
                  </label>

                  {approvedCategories.includes(cat) && (
                    <div style={{ marginLeft: "15px" }}>
                      {Object.keys(categoriesData[cat]).map((sub) => (
                        <div key={sub}>
                          <label>
                            <input
                              type="checkbox"
                              checked={approvedSubcategories[cat]?.includes(sub) || false}
                              onChange={() => toggleSubcategory(cat, sub)}
                            />
                            {sub}
                          </label>

                          {approvedSubcategories[cat]?.includes(sub) && (
                            <div style={{ marginLeft: "15px" }}>
                              {categoriesData[cat][sub].map((child) => (
                                <label key={child} style={{ marginRight: "8px" }}>
                                  <input
                                    type="checkbox"
                                    checked={approvedChildCategories[sub]?.includes(child) || false}
                                    onChange={() => toggleChildCategory(sub, child)}
                                  />
                                  {child}
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className={styles.modalButtons}>
              <button
                className={styles.approveBtn}
                onClick={() => handleDecision(vendorDetails._id, true)}
              >
                ✅ Approve
              </button>
              <button
                className={styles.rejectBtn}
                onClick={() => handleDecision(vendorDetails._id, false)}
              >
                ❌ Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorSubuserDashboard;
