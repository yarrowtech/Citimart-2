import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import styles from "./SubuserSetup.module.css";

const SubuserSetup = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const navigate = useNavigate();

  // 🔹 Get token and log it
  useEffect(() => {
    const token = searchParams.get("token"); // token from email
    console.log("Token from URL:", token); // Debug: check if token is correct
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = searchParams.get("token"); // token again here for submission
    if (!password || !confirm) return alert("Enter both fields");
    if (password !== confirm) return alert("Passwords do not match");

    try {
      const res = await fetch("http://localhost:5000/subuser/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Password set successfully! You can now log in.");
        navigate(data.redirectUrl ||"/subuser/login");
      } else {
        alert(data.error || "Failed to set password");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h2>Set Your Password</h2>
        <label>New Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <label>Confirm Password</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        <button type="submit">Set Password</button>
      </form>
    </div>
  );
};

export default SubuserSetup;
