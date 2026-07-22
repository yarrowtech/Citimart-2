// src/pages/VerifyOtp.jsx
/*import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./VerifyOtp.module.css";

const VerifyOtp = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const res = await axios.post("http://127.0.0.1:5000/auth/verify-otp", {
        email,
        otp,
      });

      setMessage("OTP verified successfully!");
      const token = res.data.reset_token;

      // Redirect to reset password page with token
      setTimeout(() => navigate(`/reset-password/${token}`), 1500);
    } catch (err) {
      setError(err.response?.data?.error || "Invalid or expired OTP");
    }
  };

  return (
    <div className={styles.verifyContainer}>
      <form onSubmit={handleSubmit} className={styles.verifyForm}>
        <h2>Verify OTP</h2>

        {error && <p className={styles.error}>{error}</p>}
        {message && <p className={styles.success}>{message}</p>}

        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label>OTP</label>
        <input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
        />

        <button type="submit" className={styles.submitBtn}>
          Verify OTP
        </button>
      </form>
    </div>
  );
};

export default VerifyOtp;
*/
// src/pages/VerifyOtp.jsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import styles from "./VerifyOtp.module.css";

const VerifyOtp = () => {
  const [email, setEmail] = useState(localStorage.getItem("resetEmail") || "");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // 👇 Auto-detect role from URL or use saved value
  const isVendorPage = location.pathname.includes("/vendor");
  const role = localStorage.getItem("resetRole") || (isVendorPage ? "vendor" : "customer");

  // 👇 Select correct endpoint
  const endpoint =
    role === "vendor"
      ? "http://127.0.0.1:5000/auth/vendor/verify-otp"
      : "http://127.0.0.1:5000/auth/customer/verify-otp";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const res = await axios.post(endpoint, { email, otp });
      setMessage("OTP verified successfully!");

      const token = res.data.reset_token;
      localStorage.setItem("resetToken", token);

      // Redirect to reset password page
      setTimeout(() => navigate(`/reset-password/${token}`), 1200);
    } catch (err) {
      setError(err.response?.data?.error || "Invalid or expired OTP");
    }
  };

  return (
    <div className={styles.verifyContainer}>
      <form onSubmit={handleSubmit} className={styles.verifyForm}>
        <h2>Verify OTP</h2>

        {error && <p className={styles.error}>{error}</p>}
        {message && <p className={styles.success}>{message}</p>}

        <label>Email</label>
        <input
          type="email"
          value={email}
          readOnly // ✅ Prevent editing — it's already saved from ForgotPassword
        />

        <label>OTP</label>
        <input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
        />

        <button type="submit" className={styles.submitBtn}>
          Verify OTP
        </button>
      </form>
    </div>
  );
};

export default VerifyOtp;
