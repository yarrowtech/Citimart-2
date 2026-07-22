/*import React, { useState } from "react";
import styles from "./ForgotPassword.module.css";
import { Link, useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:5000/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        alert(data.message || "OTP sent to your email!");
        // Save info for the next step (verify-otp)
        localStorage.setItem("resetEmail", email);
        localStorage.setItem("resetRole", data.role);
        navigate("/verify-otp"); // redirect to OTP page
      } else {
        alert(data.error || "Email not found.");
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
      alert("An error occurred. Try again later.");
    }
  };

  return (
    <div className={styles.forgotPassword}>
      <div className={styles.container}>
        <div className={styles.formCard}>
          <h1>Forgot Password</h1>

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="email">Enter your registered email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>

          <div className={styles.links}>
            <Link to="/login">Back to Login</Link>
            <p>
              Don’t have an account? <Link to="/register">Register</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
*/


import React, { useState } from "react";
import styles from "./ForgotPassword.module.css";
import { Link, useNavigate, useLocation } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // 👇 Auto-detect role based on the current URL
  const isVendorPage = location.pathname.includes("/vendor");
  const endpoint = isVendorPage
    ? "http://127.0.0.1:5000/auth/vendor/forgot-password"
    : "http://127.0.0.1:5000/auth/customer/forgot-password";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        alert(data.message || "OTP sent to your email!");
        localStorage.setItem("resetEmail", email);
        localStorage.setItem("resetRole", isVendorPage ? "vendor" : "customer");
        navigate("/verify-otp");
      } else {
        alert(data.error || "Email not found.");
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
      alert("An error occurred. Try again later.");
    }
  };

  return (
    <div className={styles.forgotPassword}>
      <div className={styles.container}>
        <div className={styles.formCard}>
          <h1>Forgot Password</h1>

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="email">Enter your registered email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>

          <div className={styles.links}>
            <Link to="/login">Back to Login</Link>
            <p>
              Don’t have an account? <Link to="/register">Register</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
