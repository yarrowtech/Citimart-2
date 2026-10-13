import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { HiOutlineChartBar, HiOutlineClipboardCheck, HiOutlineCreditCard, HiOutlineOfficeBuilding } from "react-icons/hi";
import styles from "./VendorLogin.module.css";
import { toast } from "react-toastify";
import { API_BASE } from "../config";

const VendorLogin = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/auth/login/vendor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, role: "vendor" }),
      });

      const data = await response.json();

      if (response.ok) {
        const user = data.user;

        localStorage.setItem("token", data.token);
        localStorage.setItem("role", "vendor");
        localStorage.setItem("name", user.fullName || user.name);
        localStorage.setItem("vendor_id", user.id);

        toast.success("Vendor logged in successfully!");
        navigate("/vendor");
      } else {
        toast.error(data.error || "Login failed!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong!");
    }
  };

  return (
    <div className={styles.container}>
      <section className={styles.intro} aria-label="Citimart partner benefits">
        <span className={styles.eyebrow}>Citimart for business</span>
        <h2>Everything you need to grow your store.</h2>
        <p>One simple workspace to manage your catalogue, fulfil orders, and keep track of every payout.</p>
        <div className={styles.benefits}>
          <div><HiOutlineClipboardCheck /><span><strong>Manage orders</strong><small>Track and fulfil orders with ease</small></span></div>
          <div><HiOutlineChartBar /><span><strong>Understand performance</strong><small>See the numbers that move your business</small></span></div>
          <div><HiOutlineCreditCard /><span><strong>Reliable payouts</strong><small>Clear, transparent payment tracking</small></span></div>
        </div>
      </section>
      <div className={styles.formCard}>
        <span className={styles.badge}><HiOutlineOfficeBuilding /> Vendor Partner</span>
        <h1>Welcome back, partner</h1>
        <p className={styles.subtitle}>Sign in to manage your store, orders, and payouts.</p>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="you@business.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label>Password</label>
            <div className={styles.passwordField}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          <button type="submit" className={styles.submitBtn}>Sign in</button>
        </form>

        <div className={styles.links}>
          <Link to="/vendor/forgot-password">Forgot password?</Link>
          <Link to="/register-vendor">Apply to sell <span aria-hidden="true">→</span></Link>
        </div>

        <p className={styles.footnote}>
          Are you a shopper? <Link to="/login">Log in as a customer</Link> instead.
        </p>
      </div>
    </div>
  );
};

export default VendorLogin;
