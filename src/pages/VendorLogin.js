import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import styles from "./Login.module.css";
import { toast } from "react-toastify";

const VendorLogin = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://127.0.0.1:5000/auth/login/vendor", {
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
    <div className={styles.login}>
      <div className={styles.container}>
        <div className={styles.formCard}>
          <h1>Vendor Login</h1>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <button type="submit" className={styles.submitBtn}>Login</button>
          </form>

          {/*  Forgot Password link */}
          <div className={styles.links}>
            <Link to="/vendor/forgot-password">Forgot Password?</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorLogin;
