import React, { useState, useEffect } from "react";
import styles from "./VendorSettings.module.css";

const tabs = [
  "Profile",
  "Account",
  "Payments",
  "Shipping",
  "Catalog",
  "Notifications",
  "Compliance",
  "Reports",
  "Support",
];

const VendorSettings = () => {
  const [activeTab, setActiveTab] = useState("Profile");
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [token] = useState(localStorage.getItem("vendorToken")); // Auth token

  // ---------------- FETCH DATA ----------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/vendor/settings/${activeTab.toLowerCase()}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await res.json();
        setFormData(data || {});
      } catch (err) {
        console.error("Error fetching:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab, token]);

  // ---------------- HANDLE INPUT CHANGE ----------------
  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // ---------------- HANDLE SUBMIT ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let url = `/api/vendor/settings/${activeTab.toLowerCase()}`;
      let options = {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      };

      if (activeTab === "Compliance") {
        // FormData for file uploads
        const form = new FormData();
        Object.keys(formData).forEach((key) => form.append(key, formData[key]));
        options.body = form;
      } else {
        options.headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(formData);
      }

      const res = await fetch(url, options);
      const data = await res.json();

      alert(data.message || "Saved successfully!");
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save data");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- RENDER FIELD ----------------
  const renderInput = (label, name, type = "text", placeholder = "") => (
    <>
      <label>{label}</label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={formData[name] || ""}
        onChange={handleChange}
      />
    </>
  );

  // ---------------- TAB CONTENT ----------------
  const renderContent = () => {
    if (loading) return <p>Loading...</p>;

    switch (activeTab) {
      // 🏢 PROFILE
      case "Profile":
        return (
          <div className={styles.tabContent}>
            <h2>Business Profile</h2>
            <form className={styles.form} onSubmit={handleSubmit}>
              {renderInput("Business Name", "business_name")}
              {renderInput("Contact Person", "contact_person")}
              {renderInput("Email", "email", "email")}
              {renderInput("Phone Number", "phone", "tel")}
              <label>Business Type</label>
              <select
                name="business_type"
                value={formData.business_type || ""}
                onChange={handleChange}
              >
                <option>Individual</option>
                <option>Company</option>
              </select>

              {renderInput("GST/VAT Number", "gst_number")}
              <label>Business Logo</label>
              <input
                type="file"
                name="logo"
                accept="image/*"
                onChange={handleChange}
              />

              <label>Store Description</label>
              <textarea
                name="description"
                placeholder="Tell customers about your store"
                value={formData.description || ""}
                onChange={handleChange}
              />

              <label>Business Address</label>
              <textarea
                name="address"
                placeholder="Enter full business address"
                value={formData.address || ""}
                onChange={handleChange}
              />

              {renderInput("Social Links", "social_link", "url")}

              <button type="submit">Save Profile</button>
            </form>
          </div>
        );

      // 🔐 ACCOUNT
      case "Account":
        return (
          <div className={styles.tabContent}>
            <h2>Account & Security</h2>
            <form className={styles.form} onSubmit={handleSubmit}>
              {renderInput("Username", "username")}
              {renderInput("Change Email", "new_email", "email")}
              {renderInput("Change Password", "password", "password")}

              <label>Two-Factor Authentication</label>
              <select
                name="two_factor"
                value={formData.two_factor || ""}
                onChange={handleChange}
              >
                <option>Enabled</option>
                <option>Disabled</option>
              </select>

              <label>Account Status</label>
              <select
                name="status"
                value={formData.status || ""}
                onChange={handleChange}
              >
                <option>Active</option>
                <option>Deactivated</option>
              </select>

              <button type="submit">Update Account</button>
            </form>
          </div>
        );

      // 💳 PAYMENTS
      case "Payments":
        return (
          <div className={styles.tabContent}>
            <h2>Bank & Payment Info</h2>
            <form className={styles.form} onSubmit={handleSubmit}>
              {renderInput("Account Holder Name", "holder_name")}
              {renderInput("Bank Name", "bank_name")}
              {renderInput("Bank Account Number", "account_number")}
              {renderInput("IFSC/SWIFT Code", "ifsc")}
              {renderInput("PAN / Tax ID", "tax_id")}
              {renderInput("UPI ID", "upi")}
              <label>Settlement Cycle</label>
              <select
                name="settlement_cycle"
                value={formData.settlement_cycle || ""}
                onChange={handleChange}
              >
                <option>Weekly</option>
                <option>Bi-weekly</option>
                <option>Monthly</option>
              </select>

              <button type="submit">Save Payment Info</button>
            </form>
          </div>
        );

      // 🚚 SHIPPING
      case "Shipping":
        return (
          <div className={styles.tabContent}>
            <h2>Shipping & Logistics</h2>
            <form className={styles.form} onSubmit={handleSubmit}>
              <label>Default Warehouse Address</label>
              <textarea
                name="warehouse_address"
                value={formData.warehouse_address || ""}
                onChange={handleChange}
              />

              {renderInput("Preferred Courier", "courier")}
              {renderInput("Pickup Time Slot", "pickup_slot")}
              <label>Return Pickup Address</label>
              <textarea
                name="return_address"
                value={formData.return_address || ""}
                onChange={handleChange}
              />
              {renderInput("Handling Time (Days)", "handling_time", "number")}
              <label>Shipping Responsibility</label>
              <select
                name="responsibility"
                value={formData.responsibility || ""}
                onChange={handleChange}
              >
                <option>Vendor</option>
                <option>Platform</option>
              </select>
              {renderInput("Supported Regions", "regions")}
              <button type="submit">Update Shipping Info</button>
            </form>
          </div>
        );

      // 🏷️ CATALOG
      case "Catalog":
        return (
          <div className={styles.tabContent}>
            <h2>Catalog Settings</h2>
            <form className={styles.form} onSubmit={handleSubmit}>
              {renderInput("Brand Name", "brand")}
              {renderInput("Default Category", "category")}
              <label>Enable Auto SKU Generation</label>
              <select
                name="auto_sku"
                value={formData.auto_sku || ""}
                onChange={handleChange}
              >
                <option>Yes</option>
                <option>No</option>
              </select>

              <label>Allow Auto Listing Approval</label>
              <select
                name="auto_approval"
                value={formData.auto_approval || ""}
                onChange={handleChange}
              >
                <option>Yes</option>
                <option>No</option>
              </select>

              <label>Enable Inventory Integration</label>
              <select
                name="inventory_mode"
                value={formData.inventory_mode || ""}
                onChange={handleChange}
              >
                <option>Manual</option>
                <option>API</option>
              </select>

              {renderInput("Default Tax Rate (%)", "tax_rate", "number")}
              <button type="submit">Save Catalog Settings</button>
            </form>
          </div>
        );

      // 🔔 NOTIFICATIONS
      case "Notifications":
        return (
          <div className={styles.tabContent}>
            <h2>Notifications & Alerts</h2>
            <form className={styles.form} onSubmit={handleSubmit}>
              <label>Order Alerts</label>
              <select
                name="order_alert"
                value={formData.order_alert || ""}
                onChange={handleChange}
              >
                <option>Email</option>
                <option>SMS</option>
                <option>In-App</option>
              </select>

              <label>Low Stock Alert</label>
              <select
                name="low_stock"
                value={formData.low_stock || ""}
                onChange={handleChange}
              >
                <option>Enabled</option>
                <option>Disabled</option>
              </select>

              <label>Payment Notifications</label>
              <select
                name="payment_notify"
                value={formData.payment_notify || ""}
                onChange={handleChange}
              >
                <option>Email</option>
                <option>In-App</option>
              </select>

              <label>Notification Frequency</label>
              <select
                name="frequency"
                value={formData.frequency || ""}
                onChange={handleChange}
              >
                <option>Immediate</option>
                <option>Daily Digest</option>
              </select>

              <button type="submit">Update Notifications</button>
            </form>
          </div>
        );

      // 📄 COMPLIANCE
      case "Compliance":
        return (
          <div className={styles.tabContent}>
            <h2>Compliance Documents</h2>
            <form className={styles.form} onSubmit={handleSubmit}>
              <label>Upload GST Certificate</label>
              <input
                type="file"
                name="gst_cert"
                onChange={handleChange}
              />

              <label>Upload Trade License</label>
              <input
                type="file"
                name="trade_license"
                onChange={handleChange}
              />

              <label>Upload Business Registration Certificate</label>
              <input
                type="file"
                name="registration_cert"
                onChange={handleChange}
              />

              <label>Document Status</label>
              <select
                name="status"
                value={formData.status || ""}
                onChange={handleChange}
              >
                <option>Pending Verification</option>
                <option>Verified</option>
              </select>

              <label>Accept Terms</label>
              <select
                name="terms"
                value={formData.terms || ""}
                onChange={handleChange}
              >
                <option>Accepted</option>
                <option>Not Accepted</option>
              </select>

              <button type="submit">Save Compliance Info</button>
            </form>
          </div>
        );

      // 📊 REPORTS
      case "Reports":
        return (
          <div className={styles.tabContent}>
            <h2>Reports & Analytics</h2>
            <form className={styles.form} onSubmit={handleSubmit}>
              <label>Report Type</label>
              <select
                name="report_type"
                value={formData.report_type || ""}
                onChange={handleChange}
              >
                <option>Sales</option>
                <option>Orders</option>
                <option>Inventory</option>
                <option>Returns</option>
              </select>

              <label>Report Frequency</label>
              <select
                name="report_frequency"
                value={formData.report_frequency || ""}
                onChange={handleChange}
              >
                <option>Daily</option>
                <option>Weekly</option>
                <option>Monthly</option>
              </select>

              <label>Report Format</label>
              <select
                name="report_format"
                value={formData.report_format || ""}
                onChange={handleChange}
              >
                <option>PDF</option>
                <option>XLS</option>
                <option>CSV</option>
              </select>

              {renderInput("Email for Report Delivery", "report_email", "email")}
              <button type="submit">Save Report Settings</button>
            </form>
          </div>
        );

      // 🆘 SUPPORT
      case "Support":
        return (
          <div className={styles.tabContent}>
            <h2>Support Preferences</h2>
            <form className={styles.form} onSubmit={handleSubmit}>
              {renderInput("Support Email", "support_email", "email")}
              {renderInput("Escalation Contact", "escalation_contact")}
              <label>Preferred Support Language</label>
              <select
                name="language"
                value={formData.language || ""}
                onChange={handleChange}
              >
                <option>English</option>
                <option>Hindi</option>
              </select>

              <label>Enable WhatsApp Support</label>
              <select
                name="whatsapp_support"
                value={formData.whatsapp_support || ""}
                onChange={handleChange}
              >
                <option>Yes</option>
                <option>No</option>
              </select>

              <button type="submit">Update Support Info</button>
            </form>
          </div>
        );

      default:
        return null;
    }
  };

  // ---------------- LAYOUT ----------------
  return (
    <div className={styles.settingsContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h1>SETTINGS</h1>
        </div>
        <div className={styles.nav}>
          <ul>
            {tabs.map((tab) => (
              <li
                key={tab}
                className={activeTab === tab ? styles.active : ""}
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

export default VendorSettings;
