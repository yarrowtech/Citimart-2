import React, { useState } from "react";
import { toast } from "react-toastify";
import styles from "./Login.module.css"; // reuse styles

const VendorForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Step 1: Send reset request
  const handleRequestReset = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://127.0.0.1:5000/forgot-password/vendor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("OTP sent to your registered phone & reset link to email");
        setStep(2);
      } else {
        toast.error(data.error || "Failed to send reset link");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong!");
    }
  };

  // Step 2: Verify OTP & reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://127.0.0.1:5000/reset-password/vendor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, new_password: newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Password reset successful! Please log in.");
        window.location.href = "/vendor/login"; // redirect
      } else {
        toast.error(data.error || "Reset failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong!");
    }
  };

  return (
    <div className={styles.login}>
      <div className={styles.container}>
        <div className={styles.formCard}>
          <h1>Vendor Forgot Password</h1>

          {step === 1 && (
            <form onSubmit={handleRequestReset}>
              <div className={styles.formGroup}>
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className={styles.submitBtn}>
                Send OTP
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleResetPassword}>
              <div className={styles.formGroup}>
                <label>OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className={styles.submitBtn}>
                Reset Password
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorForgotPassword;
