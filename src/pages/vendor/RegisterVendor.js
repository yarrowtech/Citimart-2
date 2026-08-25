import React, { useState, useEffect } from "react";
import styles from "./RegisterVendor.module.css";
import logo from "../../assets/logo.jpeg";

import { API_BASE } from "../../config";

// Kept intentionally minimal — just enough to create the account and get
// into the approval queue fast. PAN/GST/business-registration details and
// their certificates are collected afterward through the "Verify Your
// Business" step in the vendor dashboard, not here.
const initialState = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  businessName: "",
  businessType: "",
  businessAddress: "",
  productCategories: [],
  selectedSubcategories: {},
  termsAgreed: false,
};

const businessTypes = ["Proprietor", "LLP", "Pvt. Ltd.", "Partnership", "Other"];

export default function RegisterVendor() {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [categoriesData, setCategoriesData] = useState([]);

  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/categories`);
        const data = await res.json();
        if (Array.isArray(data.categories)) setCategoriesData(data.categories);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") setForm({ ...form, [name]: checked });
    else setForm({ ...form, [name]: value });
  };

  // CATEGORY SELECTION
  const handleCategoryChange = (category) => {
    setForm((prev) => {
      const updated = prev.productCategories.includes(category)
        ? prev.productCategories.filter((c) => c !== category)
        : [...prev.productCategories, category];

      const updatedSubs = { ...prev.selectedSubcategories };
      if (!updated.includes(category)) delete updatedSubs[category];

      return { ...prev, productCategories: updated, selectedSubcategories: updatedSubs };
    });
  };

  const handleSubcategoryChange = (category, subcategory) => {
    setForm((prev) => {
      const subs = prev.selectedSubcategories[category] || {};
      const updatedSubs = { ...subs };
      if (updatedSubs[subcategory]) delete updatedSubs[subcategory];
      else updatedSubs[subcategory] = [];
      return { ...prev, selectedSubcategories: { ...prev.selectedSubcategories, [category]: updatedSubs } };
    });
  };

  const handleChildCategoryChange = (category, subcategory, child) => {
    setForm((prev) => {
      const subs = prev.selectedSubcategories[category] || {};
      const childs = subs[subcategory] || [];
      const updatedChilds = childs.includes(child)
        ? childs.filter((c) => c !== child)
        : [...childs, child];

      return {
        ...prev,
        selectedSubcategories: {
          ...prev.selectedSubcategories,
          [category]: { ...subs, [subcategory]: updatedChilds }
        }
      };
    });
  };

  // VALIDATION
  const validate = () => {
    const err = {};
    if (!form.fullName) err.fullName = "Required";
    if (!form.email) err.email = "Required";
    if (!form.phone) err.phone = "Required";
    if (!form.password) err.password = "Required";
    if (!form.businessName) err.businessName = "Required";
    if (!form.businessType) err.businessType = "Required";
    if (!form.businessAddress) err.businessAddress = "Required";
    if (!form.productCategories.length) err.productCategories = "Select at least one category";
    if (!form.termsAgreed) err.termsAgreed = "You must agree to the terms";
    return err;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      for (const key in form) {
        if (typeof form[key] === "object") formData.append(key, JSON.stringify(form[key]));
        else formData.append(key, form[key]);
      }

      const res = await fetch(`${API_BASE}/auth/register-vendor`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setForm(initialState);
      } else alert(data.error || "Something went wrong.");
    } catch (err) {
      alert("Server error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className={styles.citiMartForm}>
      <div className={styles.successMessage}>
        <h1>🎉</h1>
        <h2>Application Submitted Successfully!</h2>
        <p>Thank you for registering 🛍️</p>
        <p>We will review and contact you soon. Once you're logged in, complete the
          "Verify Your Business" step in your dashboard to submit your PAN, GST,
          and business registration documents.</p>
      </div>
      </div>
    );
  }

  return (
      <div className={styles.vendorPageBackground}>
    <form onSubmit={handleSubmit} className={styles.citiMartForm}>
      <div className={styles.formHeader}>
  <img src={logo} alt="Logo" className={styles.formLogo} />
  <h2>Vendor Registration</h2>
</div>

      {/* PERSONAL DETAILS */}
      <fieldset className={styles.fieldset}>
        <legend>Personal Details</legend>
        <label>Full Name* <input name="fullName" value={form.fullName} onChange={handleChange} /></label>
        {errors.fullName && <span className={styles.error}>{errors.fullName}</span>}

        <label>Email* <input type="email" name="email" value={form.email} onChange={handleChange} /></label>
        {errors.email && <span className={styles.error}>{errors.email}</span>}

        <label>Phone* <input type="tel" name="phone" value={form.phone} onChange={handleChange} /></label>
        {errors.phone && <span className={styles.error}>{errors.phone}</span>}

        <label>Password* <input type="password" name="password" value={form.password} onChange={handleChange} /></label>
        {errors.password && <span className={styles.error}>{errors.password}</span>}
      </fieldset>

      {/* BUSINESS INFORMATION */}
      <fieldset className={styles.fieldset}>
        <legend>Business Information</legend>
        <label>Business Name* <input name="businessName" value={form.businessName} onChange={handleChange} /></label>
        {errors.businessName && <span className={styles.error}>{errors.businessName}</span>}

        <label>
          Business Type*
          <select name="businessType" value={form.businessType} onChange={handleChange}>
            <option value="">Select</option>
            {businessTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        {errors.businessType && <span className={styles.error}>{errors.businessType}</span>}

        <label>Business Address* <textarea name="businessAddress" value={form.businessAddress} onChange={handleChange} /></label>
        {errors.businessAddress && <span className={styles.error}>{errors.businessAddress}</span>}

        <p className={styles.note}>
          You'll submit your PAN, GST, and business registration documents for
          verification after your account is created.
        </p>
      </fieldset>

      {/* PRODUCT CATEGORIES */}
      <fieldset className={styles.fieldset}>
        <legend>Product Categories</legend>
        {categoriesData.map((cat) => (
          <div key={cat.name}>
            <label>
              <input
                type="checkbox"
                checked={form.productCategories.includes(cat.name)}
                onChange={() => handleCategoryChange(cat.name)}
              /> {cat.name}
            </label>

            {form.productCategories.includes(cat.name) && (
              <div style={{ marginLeft: 20 }}>
                {cat.subCategories?.map((sub) => (
                  <div key={sub.name}>
                    <label>
                      <input
                        type="checkbox"
                        checked={form.selectedSubcategories[cat.name]?.[sub.name] !== undefined}
                        onChange={() => handleSubcategoryChange(cat.name, sub.name)}
                      /> {sub.name}
                    </label>

                    {form.selectedSubcategories[cat.name]?.[sub.name] !== undefined && (
                      <div style={{ marginLeft: 20 }}>
                        {sub.childCategories?.map((child) => (
                          <label key={child} style={{ marginRight: 10 }}>
                            <input
                              type="checkbox"
                              checked={form.selectedSubcategories[cat.name]?.[sub.name]?.includes(child) || false}
                              onChange={() => handleChildCategoryChange(cat.name, sub.name, child)}
                            /> {child}
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
        {errors.productCategories && <span className={styles.error}>{errors.productCategories}</span>}
      </fieldset>

      <div>
        <label><input type="checkbox" name="termsAgreed" checked={form.termsAgreed} onChange={handleChange} /> I agree to terms*</label>
        {errors.termsAgreed && <span className={styles.error}>{errors.termsAgreed}</span>}
      </div>

      <button type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Submit"}</button>
    </form>
     </div>
  );
}
