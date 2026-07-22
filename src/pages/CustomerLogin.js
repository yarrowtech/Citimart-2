// import React, { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import styles from "./Login.module.css";
// import { toast } from "react-toastify";

// const CustomerLogin = () => {
//   const [formData, setFormData] = useState({ email: "", password: "" });
//   const navigate = useNavigate();

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const response = await fetch("http://127.0.0.1:5000/auth/login/customer", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ ...formData, role: "customer" }),
//       });

//       const data = await response.json();

//       if (response.ok) {
//         const user = data.user;

//         localStorage.setItem(
//           "customer",
//           JSON.stringify({
//             name: user.fullName || user.name,
//             email: user.email,
//             token: data.token,
//             id: user.id,
//           })
//         );
//         localStorage.setItem("token", data.token);
//         localStorage.setItem("customer_id", user.id);
//          localStorage.setItem("role", "customer"); 

//         toast.success("Customer logged in successfully!");
//         navigate("/");
//       } else {
//         toast.error(data.error || "Login failed!");
//       }
//     } catch (error) {
//       console.error(error);
//       toast.error("Something went wrong!");
//     }
//   };

//   return (
//     <div className={styles.login}>
//       <div className={styles.container}>
//         <div className={styles.formCard}>
//           <h1>Login</h1>
//           <form onSubmit={handleSubmit}>
//             <div className={styles.formGroup}>
//               <label>Email</label>
//               <input type="email" name="email" value={formData.email} onChange={handleChange} required />
//             </div>
//             <div className={styles.formGroup}>
//               <label>Password</label>
//               <input type="password" name="password" value={formData.password} onChange={handleChange} required />
//             </div>
//             <button type="submit" className={styles.submitBtn}>Login</button>
//           </form>
//           <div className={styles.links}>
//             <Link to="/forgot-password">Forgot Password?</Link>
//             <p>Don't have an account? <Link to="/register">Register</Link></p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CustomerLogin;

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./Login.module.css";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const CustomerLogin = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://127.0.0.1:5000/auth/login/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, role: "customer" }),
      });

      const data = await response.json();

      if (response.ok) {
        const user = data.user;
        localStorage.setItem("customer", JSON.stringify({
          name: user.fullName || user.name,
          email: user.email,
          token: data.token,
          id: user.id,
        }));
        localStorage.setItem("token", data.token);
        localStorage.setItem("customer_id", user.id);
        localStorage.setItem("role", "customer");
        toast.success("Customer logged in successfully!");
        navigate("/");
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
          <div className={styles.formIcon} />
          <h1>Welcome Back</h1>
          <p className={styles.subtitle}>Sign in to your account</p>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className={styles.formGroup}>
              <label>Email</label>
              <div className={styles.inputWrapper}>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Password with eye toggle */}
            <div className={styles.formGroup}>
              <label>Password</label>
              <div className={styles.inputWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                {/* span — no browser button chrome */}
                <span
                  className={styles.passwordToggle}
                  role="button"
                  tabIndex={0}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                  onKeyDown={(e) => e.key === "Enter" && setShowPassword((v) => !v)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            <button type="submit" className={styles.submitBtn}>
              Sign In
            </button>
          </form>

          <div className={styles.links}>
            <Link to="/forgot-password">Forgot Password?</Link>
            <p>Don't have an account? <Link to="/register">Register</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerLogin;