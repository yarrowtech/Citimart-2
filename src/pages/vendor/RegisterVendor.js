import React, { useState, useEffect } from "react";
import styles from "./RegisterVendor.module.css";
import logo from "../../assets/logo.jpeg";


const initialState = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  businessName: "",
  businessType: "",
  businessRegNo: "",
  gstNo: "",
  businessAddress: "",
  productCategories: [],
  selectedSubcategories: {},
  skuCount: "",
  priceRange: "",
  productType: "",
  website: "",
  socialLinks: "",
  inventoryReady: "",
  shipping: "",
  appeal: "",
  productDesc: "",
  documents: null,
  productImages: null,
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
        const res = await fetch("http://localhost:5000/api/categories");
        const data = await res.json();
        // Expected format: [{ name: "Clothing", subCategories: [{ name: "Men", childCategories: ["Shirts", "Jeans"] }] }]
        if (Array.isArray(data.categories)) setCategoriesData(data.categories);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "checkbox") setForm({ ...form, [name]: checked });
    else if (type === "file") setForm({ ...form, [name]: files });
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
    if (!form.businessRegNo) err.businessRegNo = "Required";
    if (!form.businessAddress) err.businessAddress = "Required";
    if (!form.productCategories.length) err.productCategories = "Select at least one category";
    if (!form.skuCount) err.skuCount = "Required";
    if (!form.priceRange) err.priceRange = "Required";
    if (!form.productType) err.productType = "Required";
    if (!form.inventoryReady) err.inventoryReady = "Required";
    if (!form.shipping) err.shipping = "Required";
    if (!form.appeal) err.appeal = "Required";
    if (!form.productDesc) err.productDesc = "Required";
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
        if (key === "documents" || key === "productImages") {
          if (form[key]) for (let f of form[key]) formData.append(key, f);
        } else if (typeof form[key] === "object") {
          formData.append(key, JSON.stringify(form[key]));
        } else formData.append(key, form[key]);
      }

      const res = await fetch("http://localhost:5000/auth/register-vendor", {
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
        <p>We will review and contact you soon.</p>
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

        <label>Business Reg. No* <input name="businessRegNo" value={form.businessRegNo} onChange={handleChange} /></label>
        {errors.businessRegNo && <span className={styles.error}>{errors.businessRegNo}</span>}

        <label>GST No <input name="gstNo" value={form.gstNo} onChange={handleChange} /></label>

        <label>Business Address* <textarea name="businessAddress" value={form.businessAddress} onChange={handleChange} /></label>
        {errors.businessAddress && <span className={styles.error}>{errors.businessAddress}</span>}
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

      {/* SKU, PRICE, PRODUCT INFO */}
      <label>SKU Count* <input type="number" name="skuCount" value={form.skuCount} onChange={handleChange} /></label>
      {errors.skuCount && <span className={styles.error}>{errors.skuCount}</span>}

      <label>Price Range* <input name="priceRange" value={form.priceRange} onChange={handleChange} placeholder="e.g. 200-2000 INR" /></label>
      {errors.priceRange && <span className={styles.error}>{errors.priceRange}</span>}

      <div>
        <p>Product Type*</p>
        {["Branded", "Handmade", "Both"].map((t) => (
          <label key={t}><input type="radio" name="productType" value={t} checked={form.productType === t} onChange={handleChange} /> {t}</label>
        ))}
        {errors.productType && <span className={styles.error}>{errors.productType}</span>}
      </div>

      {/* INVENTORY, SHIPPING, APPEAL, DESC */}
      <div>
        <p>Inventory Ready?*</p>
        {["Yes", "No"].map((t) => (
          <label key={t}><input type="radio" name="inventoryReady" value={t} checked={form.inventoryReady === t} onChange={handleChange} /> {t}</label>
        ))}
        {errors.inventoryReady && <span className={styles.error}>{errors.inventoryReady}</span>}
      </div>

      <div>
        <p>Shipping*</p>
        {["Own", "Support"].map((t) => (
          <label key={t}><input type="radio" name="shipping" value={t} checked={form.shipping === t} onChange={handleChange} /> {t}</label>
        ))}
        {errors.shipping && <span className={styles.error}>{errors.shipping}</span>}
      </div>

      <label>Why do you want to sell?* <textarea name="appeal" value={form.appeal} onChange={handleChange} /></label>
      {errors.appeal && <span className={styles.error}>{errors.appeal}</span>}

      <label>Describe Products* <textarea name="productDesc" value={form.productDesc} onChange={handleChange} /></label>
      {errors.productDesc && <span className={styles.error}>{errors.productDesc}</span>}

      <label>Website <input name="website" value={form.website} onChange={handleChange} /></label>
      <label>Social Links <input name="socialLinks" value={form.socialLinks} onChange={handleChange} /></label>

      {/* FILE UPLOADS */}
      <fieldset>
        <legend>Upload Product Images*</legend>
        <input type="file" name="productImages" multiple accept="image/*" onChange={handleChange} />
      </fieldset>

      <fieldset>
        <legend>Upload Business Documents (Optional)</legend>
        <input type="file" name="documents" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={handleChange} />
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
