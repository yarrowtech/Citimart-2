import React, { useState, useEffect } from "react";
import styles from "./Vendors.module.css";



const Vendors = () => {
  const [applications, setApplications] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [approvedCategories, setApprovedCategories] = useState([]);
  const [approvedSubcategories, setApprovedSubcategories] = useState({});
  const [approvedChildCategories, setApprovedChildCategories] = useState({});
  const [vendorProducts, setVendorProducts] = useState([]);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [currentVendorForRequests, setCurrentVendorForRequests] = useState(null);

  const [editMode, setEditMode] = useState(false);
  const [vendorDetails, setVendorDetails] = useState({});
  const [restrictionDate, setRestrictionDate] = useState("");
  const [categoriesData, setCategoriesData] = useState({});


  //  New states for popup
  const [hoveredVendor, setHoveredVendor] = useState(null);
  const [pendingRequests, setPendingRequests] = useState({});

  const BACKEND_URL = "http://localhost:5000";

  useEffect(() => {
    fetchPendingApplications();
    fetchApprovedVendors();
  }, []);

  const fetchPendingApplications = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/admin/vendor-applications`);
      const data = await res.json();
      setApplications(data);
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    }
  };
 useEffect(() => {
  fetchCategories();
}, []);

const fetchCategories = async () => {
  try {
    const res = await fetch(`${BACKEND_URL}/api/categories`);
    const data = await res.json();
    // transform into easier structure: { "Clothing": { "Men": [...], "Women": [...] }, ... }
    const formatted = {};
    data.categories.forEach(cat => {
      formatted[cat.name] = {};
      cat.subCategories.forEach(sub => {
        formatted[cat.name][sub.name] = sub.childCategories || [];
      });
    });
    setCategoriesData(formatted);
  } catch (err) {
    console.error("Failed to fetch categories:", err);
  }
};


  const fetchApprovedVendors = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/admin/approved-vendors`);
      const data = await res.json();
      const vendorsWithPerformance = data.map((v) => ({
        ...v,
        performance: Math.floor(Math.random() * 40) + 60,
      }));
      setVendors(vendorsWithPerformance);
    } catch (err) {
      console.error("Failed to fetch vendors:", err);
    }
  };

  const fetchVendorProducts = async (vendorId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/admin/vendor-products/${vendorId}`);
      const data = await res.json();
      setVendorProducts(data);
      setShowProductsModal(true);
    } catch (err) {
      console.error("Failed to fetch vendor products:", err);
    }
  };

  //  Fetch Category Requests for a Vendor
  const fetchCategoryRequests = async (vendorId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/admin/vendor-category-requests/${vendorId}`);
      const data = await res.json();
      setPendingRequests((prev) => ({ ...prev, [vendorId]: data }));
    } catch (err) {
      console.error("Failed to fetch category requests:", err);
    }
  };

  //  Approve a Category Request
  const approveCategoryRequest = async (vendorId, request) => {
    try {
      const res = await fetch(`${BACKEND_URL}/admin/approve-category-request/${vendorId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (res.ok) {
        fetchApprovedVendors(); 
        fetchCategoryRequests(vendorId); 
      }
    } catch (err) {
      console.error("Error approving category request:", err);
    }
  };
   

    const rejectCategoryRequest = async (vendorId, request) => {
  try {
    await fetch(`${BACKEND_URL}/admin/reject-category-requests/${vendorId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requests: [request] }),
    });
    fetchCategoryRequests(vendorId); // Refresh requests
  } catch (err) {
    console.error("Error rejecting category request:", err);
  }
};


  const handleApprove = async (id) => {
    try {
      const res = await fetch(`${BACKEND_URL}/admin/approve-vendor/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approvedCategories,
          approvedSubcategories,
          approvedChildcategories: approvedChildCategories,
        }),
      });
      if (res.ok) {
        setSelectedApp(null);
        fetchPendingApplications();
        fetchApprovedVendors();
      }
    } catch (err) {
      console.error("Approval failed:", err);
    }
  };

  const handleUpdateVendor = async (id) => {
    try {
      const res = await fetch(`${BACKEND_URL}/admin/update-vendor/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approvedCategories,
          approvedSubcategories,
          approvedChildcategories: approvedChildCategories,
          restrictedUntil: restrictionDate || null,
        }),
      });
      if (res.ok) {
        setSelectedApp(null);
        fetchApprovedVendors();
      }
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  const handleReject = async (id) => {
    try {
      const res = await fetch(`${BACKEND_URL}/admin/reject-vendor/${id}`, {
        method: "POST",
      });
      if (res.ok) fetchPendingApplications();
    } catch (err) {
      console.error("Rejection failed:", err);
    }
  };

  const handleDeleteVendor = async (id) => {
    if (!window.confirm("Are you sure you want to delete this vendor?")) return;
    try {
      const res = await fetch(`${BACKEND_URL}/admin/delete-vendor/${id}`, {
        method: "DELETE",
      });
      if (res.ok) fetchApprovedVendors();
    } catch (err) {
      console.error("Error deleting vendor:", err);
    }
  };

  const toggleCategory = (cat) => {
    setApprovedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleSubcategory = (cat, sub) => {
    setApprovedSubcategories((prev) => {
      const updated = { ...prev };
      updated[cat] = updated[cat]?.includes(sub)
        ? updated[cat].filter((s) => s !== sub)
        : [...(updated[cat] || []), sub];
      return updated;
    });
  };

  const toggleChildCategory = (sub, child) => {
    setApprovedChildCategories((prev) => {
      const updated = { ...prev };
      updated[sub] = updated[sub]?.includes(child)
        ? updated[sub].filter((c) => c !== child)
        : [...(updated[sub] || []), child];
      return updated;
    });
  };

  const handleReview = (app, isEdit = false) => {
    setSelectedApp(app);
    setApprovedCategories(app.approved_categories || app.productCategories || []);
    setApprovedSubcategories(app.approved_subcategories || {});
    setApprovedChildCategories(app.approved_childcategories || {});
    setRestrictionDate(app.restrictedUntil || "");
    setEditMode(isEdit);

    setVendorDetails({
  fullName: app.fullName || "",
  email: app.email || "",
  phone: app.phone || "",
  businessName: app.businessName || "",
  businessType: app.businessType || "",
  gstNo: app.gstNo || "-",                       
  businessRegNo: app.businessRegNo || "-",      
  businessAddress: app.businessAddress || "-",   
  skuCount: app.skuCount || "-",
  priceRange: app.priceRange || "-",
  productType: app.productType || "-",
  inventoryReady: app.inventoryReady || "-",    
  shipping: app.shipping || "-",                 
  appeal: app.appeal || "-",
  productDesc: app.productDesc || "-",           
  website: app.website || "-",
  socialLinks: app.socialLinks || "-",
  documents: app.documents || [],               
  productImages: app.productImages || [],
  selectedSubcategories: app.selectedSubcategories || {}, 
});




  };

  const handleCloseModal = () => {
    setSelectedApp(null);
    setApprovedCategories([]);
    setApprovedSubcategories({});
    setApprovedChildCategories({});
    setEditMode(false);
    setRestrictionDate("");
  };
  const toNumber = (value) => {
  if (typeof value === "object" && value !== null && "$numberInt" in value) {
    return parseInt(value.$numberInt, 10);
  }
  return value ?? 0;
};

  return (
    <div className={styles.vendors}>
      <div className={styles.header}>
        <h1>Vendor Management</h1>
      </div>

      {/*  Vendor Applications Table */}
      <div className={styles.applicationsSection}>
        <h2>Vendor Applications</h2>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Business Name</th>
                <th>Categories</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app, index) => (
                <tr key={app._id}>
                  <td>{index + 1}</td>
                  <td>{app.fullName}</td>
                  <td>{app.email}</td>
                  <td>{app.businessName}</td>
                  <td>{app.productCategories?.join(", ")}</td>
                  <td>
                    <span className={`${styles.status} ${styles.pending}`}>
                      {app.status}
                    </span>
                  </td>
                  <td>
                    <button className={styles.viewButton} onClick={() => handleReview(app)}>Review</button>
                    <button className={styles.deleteButton} onClick={() => handleReject(app._id)}>Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/*  Approved Vendors Table */}
      <div className={styles.approveVendors}>
        <h2>Approved Vendors</h2>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Store Name</th>
                <th>Owner</th>
                <th>Email</th>
                <th>Approved Categories</th>
                <th>Vendor Category Requests</th> 
                <th>Products</th>
                <th>Performance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor, index) => (
                <tr key={vendor._id}>
                  <td>{index + 1}</td>
                  <td>{vendor.businessName}</td>
                  <td>{vendor.fullName}</td>
                  <td>{vendor.email}</td>
                  <td>
                    {vendor.approved_categories
                      ?.map(
                        (c) =>
                          `${c} ${
                            vendor.approved_subcategories?.[c]?.length
                              ? `(${vendor.approved_subcategories[c].join(", ")})`
                              : ""
                          }`
                      )
                      .join(", ") || "-"}
                  </td>

                  {/*  Hover popup */}
                 <td>
  <button
    className={styles.viewRequestsButton}
    onClick={() => {
      fetchCategoryRequests(vendor._id);
      setCurrentVendorForRequests(vendor._id);
      setShowRequestsModal(true);
    }}
  >
    View Requests
  </button>
</td>


                  <td>
                    <span
                      style={{ color: "#2563eb", fontWeight: "bold", cursor: "pointer" }}
                      onClick={() => fetchVendorProducts(vendor._id)}
                    >
                      {vendor.product_count || 0}
                    </span>
                  </td>
                  <td>
                    <div className={styles.performanceBar}>
                      <div
                        className={styles.performanceFill}
                        style={{ width: `${vendor.performance}%` }}
                      >
                        {vendor.performance}%
                      </div>
                    </div>
                  </td>
                  <td>
                    <button
                      className={styles.editButton}
                      onClick={() => handleReview(vendor, true)}
                    >
                      Edit
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={() => handleDeleteVendor(vendor._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/*  Review & Edit Modal */}
      {selectedApp && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeModal} onClick={handleCloseModal}>×</button>
            <h3>{editMode ? "Edit Approved Vendor" : "Review Vendor Application"}</h3>

            <div className={styles.vendorDetails}>
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


              <h4>Other Info</h4>
              <p><strong>SKU Count:</strong> {vendorDetails.skuCount}</p>
              <p><strong>Price Range:</strong> {vendorDetails.priceRange}</p>
              <p><strong>Product Type:</strong> {vendorDetails.productType}</p>
              <p><strong>Inventory Ready:</strong> {vendorDetails.inventoryReady ? "Yes" : "No"}</p>
              <p><strong>Shipping:</strong> {vendorDetails.shipping}</p>
              <p><strong>Appeal:</strong> {vendorDetails.appeal}</p>
              <p><strong>Online Description:</strong> {vendorDetails.productDescription}</p>
              <p><strong>Website:</strong> {vendorDetails.website}</p>
              <p><strong>Social Links:</strong> {vendorDetails.socialLinks}</p>

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
                  <div style={{ display: "flex", gap: "10px" }}>
                    {vendorDetails.productImages.map((img, i) => (
                      <img key={i} src={img} alt={`Product ${i}`} style={{ width: "80px", height: "80px" }} />
                    ))}
                  </div>
                </>
              )}

            </div>

            {editMode && (
              <div style={{ marginBottom: "10px" }}>
                <label><strong>Restrict Until:</strong></label>
                <input
                  type="date"
                  value={restrictionDate}
                  onChange={(e) => setRestrictionDate(e.target.value)}
                  style={{ marginLeft: "10px" }}
                />
              </div>
            )}
              {vendorDetails.selectedSubcategories &&
  Object.entries(vendorDetails.selectedSubcategories).map(([cat, subs]) => (
    <div key={cat} style={{ marginTop: "10px" }}>
      <strong>{cat}</strong>
      {Object.entries(subs).map(([sub, children]) => (
        <div key={sub} style={{ marginLeft: "15px" }}>
          {sub}: {children.join(", ")}
        </div>
      ))}
    </div>
  ))}

            <h4>Select Categories, Subcategories & Child Categories</h4>
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
      <div style={{ marginLeft: "20px" }}>
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
              <div style={{ marginLeft: "20px" }}>
                {categoriesData[cat][sub].map((child) => (
                  <label key={child} style={{ marginRight: "10px" }}>
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


            <div className={styles.modalActions}>
              {editMode ? (
                <button onClick={() => handleUpdateVendor(selectedApp._id)}>Update Vendor</button>
              ) : (
                <button onClick={() => handleApprove(selectedApp._id)}>Approve Vendor</button>
              )}
              <button onClick={handleCloseModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}
 
  
      {/* Vendor Products Modal */}
{showProductsModal && (
  <div
    className={styles.modalOverlay}
    onClick={() => setShowProductsModal(false)}
  >
    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
      <button
        className={styles.closeModal}
        onClick={() => setShowProductsModal(false)}
      >
        ×
      </button>
      <h3>Vendor Products</h3>

      {vendorProducts.length === 0 ? (
        <p>No products found for this vendor.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Image</th>
              <th>Name</th>
              <th>Price</th>
              <th>Discount</th>
              <th>SKU</th>
              <th>Stock</th>
            </tr>
          </thead>
          <tbody>
            {vendorProducts.map((p, i) => (
              <tr key={p._id}>
                <td>{i + 1}</td>
                <td>
                  <img
                    src={
                      p.images?.[0]?.startsWith("http")
                        ? p.images[0]
                        : `http://localhost:5000${p.images?.[0]}`
                    }
                    alt={p.name}
                    style={{
                      width: "60px",
                      height: "60px",
                      objectFit: "cover",
                      borderRadius: "6px",
                    }}
                  />
                </td>
                <td>{p.name}</td>
                <td>₹{toNumber(p.price)}</td>
                <td>{toNumber(p.discount)}%</td>
                <td>{p.variants?.[0]?.sku || "-"}</td>
                <td>{toNumber(p.variants?.[0]?.stock)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  </div>
)}

{/* Vendor Requests Modal */}
{showRequestsModal && currentVendorForRequests && (
  <div
    className={styles.modalOverlay}
    onClick={() => setShowRequestsModal(false)}
  >
    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
      <button
        className={styles.closeModal}
        onClick={() => setShowRequestsModal(false)}
      >
        ×
      </button>
      <h3>Pending Category Requests</h3>

      {pendingRequests[currentVendorForRequests]?.length > 0 ? (
        pendingRequests[currentVendorForRequests].map((req, i) => (
          <div key={i} className={styles.requestCard}>
            <div className={styles.requestDetails}>
              <p>
                <strong>Category:</strong> {req.category}
              </p>
              <p>
                <strong>Subcategory:</strong> {req.subcategory || "-"}
              </p>
              <p>
                <strong>Child Category:</strong> {req.child_category || "-"}
              </p>
            </div>
            <div className={styles.requestActions}>
              <button
                className={styles.approveButton}
                onClick={() =>
                  approveCategoryRequest(currentVendorForRequests, req)
                }
              >
                ✅ Approve
              </button>
              <button
                className={styles.rejectButton}
                onClick={() =>
                  rejectCategoryRequest(currentVendorForRequests, req)
                }
              >
                ❌ Reject
              </button>
            </div>
          </div>
        ))
      ) : (
        <p>No pending requests.</p>
      )}
    </div>
  </div>
)}


    </div>
  );
};

export default Vendors;
