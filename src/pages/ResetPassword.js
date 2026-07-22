/*import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./ResetPassword.module.css";

const ResetPassword = () => {
  const { token } = useParams(); // token comes from verify-otp response or reset-password link
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post("http://localhost:5000/auth/set-password", {
        token,
        password,
      });

      const data = res.data;
      setMessage(data.message || "Password reset successful!");

      // Redirect based on role (backend sends "role": "vendor" or "customer")
      setTimeout(() => {
        if (data.role === "vendor") {
          navigate("/vendor/login");
        } else {
          navigate("/login");
        }
      }, 2000);
    } catch (err) {
      console.error(err.response);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Something went wrong. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const clearFields = () => {
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className={styles.resetContainer}>
      <form onSubmit={handleSubmit} className={styles.resetForm}>
        <h2>Set New Password</h2>

        {error && <p className={styles.error}>{error}</p>}
        {message && <p className={styles.success}>{message}</p>}

        <input
          type={showPassword ? "text" : "password"}
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className={styles.input}
        />

        <input
          type={showPassword ? "text" : "password"}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className={styles.input}
        />

        <div className={styles.options}>
          <label>
            <input
              type="checkbox"
              checked={showPassword}
              onChange={() => setShowPassword(!showPassword)}
            />
            Show Password
          </label>

          <button
            type="button"
            onClick={clearFields}
            className={styles.clearBtn}
          >
            Clear
          </button>
        </div>

        <button
          type="submit"
          className={styles.submitBtn}
          disabled={loading}
        >
          {loading ? "Processing..." : "Set New Password"}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
*/

// src/pages/ResetPassword.jsx
import React, { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import styles from "./ResetPassword.module.css";

const ResetPassword = () => {
  const { token } = useParams(); // token from verify-otp response
  const navigate = useNavigate();
  const location = useLocation();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔍 Auto-detect role from localStorage or URL
  const isVendorPage = location.pathname.includes("/vendor");
  const role = localStorage.getItem("resetRole") || (isVendorPage ? "vendor" : "customer");

  // 🧭 Select correct endpoint
  const endpoint =
    role === "vendor"
      ? "http://127.0.0.1:5000/auth/vendor/set-password"
      : "http://127.0.0.1:5000/auth/customer/set-password";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(endpoint, {
        token,
        password,
      });

      const data = res.data;
      setMessage(data.message || "Password reset successful!");

      // 🧭 Redirect based on detected role
      setTimeout(() => {
        if (role === "vendor") {
          navigate("/vendor/login");
        } else {
          navigate("/login");
        }
      }, 2000);
    } catch (err) {
      console.error(err.response);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Something went wrong. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const clearFields = () => {
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className={styles.resetContainer}>
      <form onSubmit={handleSubmit} className={styles.resetForm}>
        <h2>Set New Password</h2>

        {error && <p className={styles.error}>{error}</p>}
        {message && <p className={styles.success}>{message}</p>}

        <input
          type={showPassword ? "text" : "password"}
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className={styles.input}
        />

        <input
          type={showPassword ? "text" : "password"}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className={styles.input}
        />

        <div className={styles.options}>
          <label>
            <input
              type="checkbox"
              checked={showPassword}
              onChange={() => setShowPassword(!showPassword)}
            />
            Show Password
          </label>

          <button type="button" onClick={clearFields} className={styles.clearBtn}>
            Clear
          </button>
        </div>

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? "Processing..." : "Set New Password"}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
