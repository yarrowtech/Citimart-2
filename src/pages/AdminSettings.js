import React, { useState, useEffect } from "react";
import styles from "./AdminSettings.module.css";

import { API_BASE } from "../config";
const tabs = [
  "Platform",
  "Subusers",
  "Users",
  "Vendors",
  "Products",
  "Payments",
  "Shipping",
  "Notifications",
  "Orders",
  "Security",
  "Integrations",
];

// Role → Default Permissions
const rolePermissions = {
  Viewer: ["content", "reports", "faq"],
  "Order Manager": ["promotions", "complaints", "campaigns", "reports"],
  "Inventory Manager": ["merchandise", "analytics", "reports"],
  "Merchandise Manager": ["merchandise", "promotions", "segmentation", "reports", "analytics"],
  "Marketing Manager": ["media", "promotions", "campaigns"],
  "Support Staff": ["complaints", "faq", "content", "reports"],
  Moderator: ["segmentation", "promotions", "content", "campaigns", "reports", "analytics"],
};

// Role → Dashboard Redirect
const roleRedirects = {
  Viewer: "/customer-subuser-dashboard",
  "Order Manager": "/vendor-subuser-dashboard",
  "Inventory Manager": "/vendor-subuser-dashboard",
  "Merchandise Manager": "/merchandise-dashboard",
  "Marketing Manager": "/marketing-dashboard",
  "Support Staff": "/head-office-subuser",
  Moderator: "/head-office-subuser",
};

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState("Platform"); 

// --- Platform state ---
const [platformSettings, setPlatformSettings] = useState({
  platformName: "",
  supportEmail: "",
  contactNumber: "",
  currency: "INR",
  timeZone: "Asia/Kolkata",
  logo: null,
  defaultLanguage: "English",
  maintenanceMode: false,
});

// Fetch saved platform settings from backend
useEffect(() => {
  fetch(`${API_BASE}/admin/platform-settings`)
    .then((res) => res.json())
    .then((data) => setPlatformSettings(data))
    .catch((err) => console.error("Error fetching platform settings:", err));
}, []);

// Handle form changes
const handlePlatformChange = (e) => {
  const { name, type, value, checked, files } = e.target;
  if (type === "checkbox") {
    setPlatformSettings({ ...platformSettings, [name]: checked });
  } else if (type === "file") {
    setPlatformSettings({ ...platformSettings, [name]: files[0] });
  } else {
    setPlatformSettings({ ...platformSettings, [name]: value });
  }
};

// Save platform settings
const handlePlatformSave = async (e) => {
  e.preventDefault();
  try {
    const formData = new FormData();
    Object.keys(platformSettings).forEach((key) => {
      formData.append(key, platformSettings[key]);
    });

    const res = await fetch(`${API_BASE}/admin/platform-settings`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (res.ok) alert("Platform settings saved successfully!");
    else alert(data.error || "Failed to save platform settings");
  } catch (err) {
    console.error(err);
    alert("Error saving platform settings");
  }
};

// Render Platform tab
const renderPlatformTab = () => (
  <div className={styles.tabContent}>
    <h2>Platform Settings</h2>
    <form className={styles.form} onSubmit={handlePlatformSave}>
      <label>
        Platform Name
        <input
          type="text"
          name="platformName"
          value={platformSettings.platformName}
          placeholder="e.g., Citimart"
          onChange={handlePlatformChange}
        />
      </label>

      <label>
        Support Email
        <input
          type="email"
          name="supportEmail"
          value={platformSettings.supportEmail}
          placeholder="support@citimart.com"
          onChange={handlePlatformChange}
        />
      </label>

      <label>
        Contact Number
        <input
          type="tel"
          name="contactNumber"
          value={platformSettings.contactNumber}
          placeholder="+91 98765 43210"
          onChange={handlePlatformChange}
        />
      </label>

      <label>
        Currency
        <select
          name="currency"
          value={platformSettings.currency}
          onChange={handlePlatformChange}
        >
          <option value="INR">INR</option>
          <option value="USD">USD</option>
        </select>
      </label>

      <label>
        Time Zone
        <input
          type="text"
          name="timeZone"
          value={platformSettings.timeZone}
          placeholder="Asia/Kolkata"
          onChange={handlePlatformChange}
        />
      </label>

      <label>
        Default Language
        <select
          name="defaultLanguage"
          value={platformSettings.defaultLanguage}
          onChange={handlePlatformChange}
        >
          <option>English</option>
          <option>Hindi</option>
        </select>
      </label>

      <label className={styles.checkboxLabel}>
  <input
    type="checkbox"
    name="maintenanceMode"
    checked={platformSettings.maintenanceMode}
    onChange={handlePlatformChange}
  />
  <span className={styles.checkboxText}>
    Maintenance Mode {platformSettings.maintenanceMode ? "(ON)" : "(OFF)"}
  </span>
</label>


      <label>
        Logo
        <input type="file" name="logo" onChange={handlePlatformChange} />
      </label>

      <button type="submit">Save</button>
    </form>
  </div>
);

  // ---- Subuser state ----
  const [subusers, setSubusers] = useState([]);
  const [parentAccounts, setParentAccounts] = useState([]);

  const [form, setForm] = useState({
    email: "",
    parentType: "Customer",
    parentId: "",
    role: "Viewer",
    permissions: {
      segmentation: false,
      promotions: false,
      content: false,
      reports: false,
      merchandise: false,
      complaints: false,
      analytics: false,
      campaigns: false,
      faq: false,
      media: false, 
    },
  });

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);

  // Fetch subusers from backend
  useEffect(() => {
    fetch(`${API_BASE}/admin/subusers`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => setSubusers(data))
      .catch((err) => console.error("Fetch error:", err));
  }, []);

  // Fetch parent accounts when parentType changes (Add Form)
// ---- Fetch parent accounts safely (Add Form) ----
useEffect(() => {
  const pt = (form.parentType || "").toLowerCase(); // safe fallback

  if (pt && pt !== "admin" && pt !== "merchandise",pt !== "marketing") {
    fetch(`${API_BASE}/admin/parent-accounts/${pt}`)
      .then((res) => res.json())
      .then((data) => setParentAccounts(data))
      .catch((err) => {
        console.error("Error fetching parent accounts:", err);
        setParentAccounts([]); // fallback to empty
      });
  } else {
    setParentAccounts([]);
  }
}, [form.parentType]);

// ---- Fetch parent accounts safely (Edit Form) ----
useEffect(() => {
  if (!editForm) return;
  const pt = (editForm.parentType || "").toLowerCase(); // safe fallback

  if (pt && pt !== "admin" && pt !== "merchandise" && pt !== "marketing") {
    fetch(`${API_BASE}/admin/parent-accounts/${pt}`)
      .then((res) => res.json())
      .then((data) => setParentAccounts(data))
      .catch((err) => {
        console.error("Error fetching parent accounts:", err);
        setParentAccounts([]); // fallback to empty
      });
  } else {
    setParentAccounts([]);
  }
}, [editForm?.parentType]);


  // ---- Add Subuser ----
  const handleFormChange = (e) => {
  const { name, value } = e.target;

  if (name === "role") {
    const newPerms = {};
    const currentPerms = form.permissions || {}; // fallback
    Object.keys(currentPerms).forEach((p) => {
      newPerms[p] = rolePermissions[value]?.includes(p) || false;
    });
    setForm({ ...form, role: value, permissions: newPerms });
  } else {
    setForm({ ...form, [name]: value });
  }
};


  const handlePermissionChange = (e) => {
    setForm({
      ...form,
      permissions: { ...form.permissions, [e.target.name]: e.target.checked },
    });
  };

// Inside handleAddSubuser
const handleAddSubuser = async (e) => {
  e.preventDefault();
  try {
    const res = await fetch(`${API_BASE}/admin/subusers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, redirectUrl: roleRedirects[form.role] }),
    });
    const data = await res.json();
    if (res.ok) {
      alert("Subuser added! An email has been sent for password setup.");
      setSubusers([...subusers, data.subuser]);
      setForm({ /* reset form */ });
    } else {
      alert(data.error || "Failed to add subuser");
    }
  } catch (err) {
    console.error(err);
    alert("Something went wrong while adding subuser.");
  }
};


  // ---- Delete Subuser ----
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this subuser?")) return;
    try {
      const res = await fetch(`${API_BASE}/admin/subusers/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSubusers(subusers.filter((su) => su._id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ---- Edit Subuser ----
  const handleEdit = (subuser) => {
    setEditingId(subuser._id);
    setEditForm({ ...subuser });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

 const handleEditFormChange = (e) => {
  if (!editForm) return; // safety check

  const { name, value } = e.target;

  if (name === "role") {
    const newPerms = {};
    const currentPerms = editForm.permissions || {}; // fallback
    Object.keys(currentPerms).forEach((p) => {
      newPerms[p] = rolePermissions[value]?.includes(p) || false;
    });
    setEditForm({ ...editForm, role: value, permissions: newPerms });
  } else {
    setEditForm({ ...editForm, [name]: value });
  }
};

  const handleEditPermissionChange = (e) => {
    setEditForm({
      ...editForm,
      permissions: {
        ...editForm.permissions,
        [e.target.name]: e.target.checked,
      },
    });
  };

  const handleSaveEdit = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/admin/subusers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editForm, redirectUrl: roleRedirects[editForm.role] }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubusers(subusers.map((su) => (su._id === id ? data.subuser : su)));
        setEditingId(null);
        setEditForm(null);
      } else {
        alert(data.error || "Update failed");
      }
    } catch (err) {
      console.error(err);
    }
  };
// ---- Reset Password ----
const handleResetPassword = async (id) => {
  if (!window.confirm("Reset this subuser’s password? They will get a new setup link.")) return;
  try {
    const res = await fetch(`${API_BASE}/admin/subusers/${id}/reset-password`, {
      method: "POST",
    });
    const data = await res.json();
    if (res.ok) {
      alert("Password reset email sent to subuser.");
    } else {
      alert(data.error || "Failed to reset password");
    }
  } catch (err) {
    console.error(err);
    alert("Something went wrong while resetting the password.");
  }
};

  // Tabs rendering
   const renderContent = () => {
    switch (activeTab) {
      case "Platform":
       return renderPlatformTab();


      case "Subusers":
        return (
          <div className={styles.tabContent}>
            <h2>Manage Subusers</h2>
            <form className={styles.form} onSubmit={handleAddSubuser}>
              <label>Subuser Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleFormChange}
                placeholder="subuser@citimart.com"
                required
              />

              <label>Assign To</label>
              <select
                name="parentType"
                value={form.parentType}
                onChange={handleFormChange}
              >
                <option value="Customer">Customer</option>
                <option value="Vendor">Vendor</option>
                <option value="Admin">Admin</option>
                <option value="Merchandise">Merchandise</option>
                <option value="Marketing">Marketing</option>
                <option value="HeadOffice">Head Office</option>
              </select>

              <label>Parent Account</label>
              {form.parentType === "Admin" || form.parentType === "Merchandise" || form.parentType === "Marketing"|| form.parentType === "HeadOffice" ? (
                <p>No parent account required</p>
              ) : (
                <select
                  name="parentId"
                  value={form.parentId}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">-- Select Parent --</option>
                  {parentAccounts.map((acc) => (
                    <option key={acc._id} value={acc._id}>
                      {acc.email}
                    </option>
                  ))}
                </select>
              )}

              <label>Role</label>
              <select
  name="role"
  value={form.role}
  onChange={handleFormChange}
>
  {Object.keys(rolePermissions).map((role) => (
    <option key={role} value={role}>
      {role}
    </option>
  ))}
</select>


              <label>Permissions</label>
              <div className={styles.checkboxGroup}>
                {Object.keys(form.permissions || {}).map((perm) => (
  <label key={perm}>
    <input
      type="checkbox"
      name={perm}
      checked={form.permissions[perm]}
      onChange={handlePermissionChange}
    />
    {perm.charAt(0).toUpperCase() + perm.slice(1)}
  </label>
))}

                
              </div>

              <button type="submit">Add Subuser</button>
            </form>

            <h3>Existing Subusers</h3>
            {subusers.length === 0 ? (
              <p>No subusers added yet.</p>
            ) : (
              <table className={styles.subuserTable}>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Type</th>
                    <th>Parent</th>
                    <th>Role</th>
                    <th>Permissions</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subusers.map((su) => (
                    <tr key={su._id}>
                      <td>
                        {editingId === su._id ? (
                          <input
                            type="email"
                            name="email"
                            value={editForm?.email || ""}
                            onChange={handleEditFormChange}
                          />
                        ) : (
                          su.email
                        )}
                      </td>

                      <td>
                        {editingId === su._id ? (
                          <select
                            name="parentType"
                            value={editForm.parentType}
                            onChange={handleEditFormChange}
                          >
                            <option value="Customer">Customer</option>
                            <option value="Vendor">Vendor</option>
                            <option value="Admin">Admin</option>
                            <option value="Merchandise">Merchandise</option>
                          </select>
                        ) : (
                          su.parentType
                        )}
                      </td>

                      <td>
                        {editingId === su._id ? (
                          editForm.parentType === "Admin" || editForm.parentType === "Merchandise" || editForm.parentType === "Marketing" || editForm.parentType === "HeadOffice"  ? (
                            <p>No parent account required</p>
                          ) : (
                            <select
                              name="parentId"
                              value={editForm.parentId}
                              onChange={handleEditFormChange}
                              required
                            >
                              <option value="">-- Select Parent --</option>
                              {parentAccounts.map((acc) => (
                                <option key={acc._id} value={acc._id}>
                                  {acc.email}
                                </option>
                              ))}
                            </select>
                          )
                        ) : (
                          su.parentId || "N/A"
                        )}
                      </td>

                      <td>
                        {editingId === su._id ? (
                         <select
  name="role"
  value={editForm.role}
  onChange={handleEditFormChange}
>
  {Object.keys(rolePermissions).map((role) => (
    <option key={role} value={role}>
      {role}
    </option>
  ))}
</select>

                        ) : (
                          su.role
                        )}
                      </td>

                      <td>
                        {editingId === su._id ? (
                          <div className={styles.checkboxGroup}>
                           {Object.keys(editForm?.permissions || {}).map((perm) => (
  <label key={perm}>
    <input
      type="checkbox"
      name={perm}
      checked={editForm.permissions[perm]}
      onChange={handleEditPermissionChange}
    />
    {perm.charAt(0).toUpperCase() + perm.slice(1)}
  </label>
))}

                          </div>
                        ) : (
                          Object.keys(su.permissions)
                            .filter((p) => su.permissions[p])
                            .join(", ") || "None"
                        )}
                      </td>

                      <td>
                        {editingId === su._id ? (
                          <>
                            <button onClick={() => handleSaveEdit(su._id)}>Save</button>
                            <button onClick={handleCancelEdit}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleEdit(su)}>Edit</button>
                            <button onClick={() => handleDelete(su._id)}>Delete</button>
                            <button onClick={() => handleResetPassword(su._id)}>Reset Password</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );




      case 'Users':
        return (
          <div className={styles.tabContent}>
            <h2>Admin Users</h2>
            <form className={styles.form}>
              <label>Add Admin Email</label>
              <input type="email" placeholder="admin@citimart.com" />

              <label>Assign Role</label>
              <select>
                <option>Super Admin</option>
                <option>Support</option>
                <option>Moderator</option>
              </select>

              <button type="submit">Add Admin</button>
            </form>
          </div>
        );

      case 'Vendors':
        return (
          <div className={styles.tabContent}>
            <h2>Vendor Settings</h2>
            <form className={styles.form}>
              <label>Vendor Approval Mode</label>
              <select>
                <option>Manual</option>
                <option>Auto</option>
              </select>

              <label>Default Commission (%)</label>
              <input type="number" placeholder="e.g., 10" />

              <label>Enable Vendor Tiers</label>
              <select>
                <option>No</option>
                <option>Yes</option>
              </select>

              <button type="submit">Save</button>
            </form>
          </div>
        );

      case 'Products':
        return (
          <div className={styles.tabContent}>
            <h2>Product Settings</h2>
            <form className={styles.form}>
              <label>Listing Approval</label>
              <select>
                <option>Manual</option>
                <option>Auto</option>
              </select>

              <label>Moderation Required</label>
              <select>
                <option>Yes</option>
                <option>No</option>
              </select>

              <label>Banned Keywords</label>
              <textarea placeholder="e.g., fake, replica"></textarea>

              <button type="submit">Save</button>
            </form>
          </div>
        );

      case 'Payments':
        return (
          <div className={styles.tabContent}>
            <h2>Payment Settings</h2>
            <form className={styles.form}>
              <label>Commission Rate (%)</label>
              <input type="number" placeholder="e.g., 5" />

              <label>Payment Gateway</label>
              <select>
                <option>Razorpay</option>
                <option>Cashfree</option>
                <option>PayPal</option>
              </select>

              <label>Payout Cycle</label>
              <select>
                <option>Weekly</option>
                <option>Bi-weekly</option>
              </select>

              <button type="submit">Save</button>
            </form>
          </div>
        );

      case 'Shipping':
        return (
          <div className={styles.tabContent}>
            <h2>Shipping Info</h2>
            <form className={styles.form}>
              <label>Default Courier</label>
              <input type="text" placeholder="e.g., Delhivery, Bluedart" />

              <label>Return Address</label>
              <textarea placeholder="Return center full address"></textarea>

              <label>Shipping Zones</label>
              <textarea placeholder="e.g., North, South, East, West"></textarea>

              <button type="submit">Update Shipping</button>
            </form>
          </div>
        );

      case 'Notifications':
        return (
          <div className={styles.tabContent}>
            <h2>Notification Preferences</h2>
            <form className={styles.form}>
              <label>Email Provider</label>
              <select>
                <option>SMTP</option>
                <option>Mailgun</option>
                <option>Amazon SES</option>
              </select>

              <label>Enable SMS Alerts</label>
              <select>
                <option>No</option>
                <option>Yes</option>
              </select>

              <label>Order Email Template</label>
              <textarea placeholder="HTML content or message"></textarea>

              <button type="submit">Save</button>
            </form>
          </div>
        );

      case 'Orders':
        return (
          <div className={styles.tabContent}>
            <h2>Order Management</h2>
            <form className={styles.form}>
              <label>Auto-Cancel (days)</label>
              <input type="number" placeholder="e.g., 7" />

              <label>Return Window (days)</label>
              <input type="number" placeholder="e.g., 15" />

              <label>Allow Exchange</label>
              <select>
                <option>Allowed</option>
                <option>Not Allowed</option>
              </select>

              <button type="submit">Save</button>
            </form>
          </div>
        );

      case 'Security':
        return (
          <div className={styles.tabContent}>
            <h2>Security Settings</h2>
            <form className={styles.form}>
              <label>Enable 2FA</label>
              <select>
                <option>Enabled</option>
                <option>Disabled</option>
              </select>

              <label>Password Expiry (days)</label>
              <input type="number" placeholder="e.g., 90" />

              <label>Login Attempt Limit</label>
              <input type="number" placeholder="e.g., 5" />

              <button type="submit">Save</button>
            </form>
          </div>
        );

      case 'Integrations':
        return (
          <div className={styles.tabContent}>
            <h2>API & Integrations</h2>
            <form className={styles.form}>
              <label>Google Analytics ID</label>
              <input type="text" placeholder="e.g., UA-12345678" />

              <label>Cashfree API Key</label>
              <input type="text" placeholder="Cashfree key" />

              <label>Razorpay Key</label>
              <input type="text" placeholder="Razorpay key" />

              <button type="submit">Save</button>
            </form>
          </div>
        );

      default:
       return <div className={styles.tabContent}><h2>{activeTab}</h2></div>;
    }
  };

  return (
      <div className={styles.settingsContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h1>SETTINGS</h1>
        </div>
        <div className={styles.nav}>
          <ul>
            {tabs.map(tab => (
              <li
                key={tab}
                className={activeTab === tab ? styles.active : ''}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </li>
            ))}
          </ul>
        </div>
      </aside>
      <main className={styles.mainContent}>{renderContent()}</main>
    </div>
  );
};

export default AdminSettings;
