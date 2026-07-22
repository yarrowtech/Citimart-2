import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Login.module.css";
import { toast } from "react-toastify";

const AdminLogin = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  // ✅ Run check before showing the form
  const role = localStorage.getItem("role");
  const customerToken = localStorage.getItem("token");
  const vendorToken = localStorage.getItem("vendorToken");
  const adminToken = localStorage.getItem("adminToken");
  const subuserToken = localStorage.getItem("subuserToken");

  if (adminToken && role === "admin") {
    navigate("/admin/dashboard", { replace: true });
    return null;
  }

  if (
    (customerToken && role === "customer") ||
    (vendorToken && role === "vendor") ||
    (subuserToken && role === "subuser")
  ) {
    toast.warn("Access denied — Admin area only.");
    navigate("/", { replace: true });
    return null;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://127.0.0.1:5000/auth/login/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, role: "admin" }),
      });

      const data = await response.json();

      if (response.ok) {
        const user = data.user;

        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("role", "admin");
        localStorage.setItem("name", user.fullName || user.name);
        localStorage.setItem("userId", user.id);

        toast.success("Admin logged in successfully!");
        navigate("/admin/dashboard");
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
          <h1>Admin Login</h1>
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
            <button type="submit" className={styles.submitBtn}>
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;






// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import styles from "./Login.module.css";
// import { toast } from "react-toastify";

// const AdminLogin = () => {
//   const [formData, setFormData] = useState({ email: "", password: "" });
//   const [isChecking, setIsChecking] = useState(true); // prevent premature render
//   const navigate = useNavigate();

//   // ✅ Check login status safely in useEffect
//   useEffect(() => {
//     const role = localStorage.getItem("role");
//     const customerToken = localStorage.getItem("token");
//     const vendorToken = localStorage.getItem("vendorToken");
//     const adminToken = localStorage.getItem("adminToken");
//     const subuserToken = localStorage.getItem("subuserToken");

//     // ✅ Already logged in as admin → go to dashboard
//     if (adminToken && role === "admin") {
//       navigate("/admin/dashboard", { replace: true });
//       return;
//     }

//     // 🚫 Logged in as customer/vendor/subuser → block access
//     if (
//       (customerToken && role === "customer") ||
//       (vendorToken && role === "vendor") ||
//       (subuserToken && role === "subuser")
//     ) {
//       toast.warn("Access denied — Admins only!");
//       navigate("/", { replace: true });
//       return;
//     }

//     setIsChecking(false); // ✅ allow rendering
//   }, [navigate]);

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const response = await fetch("http://127.0.0.1:5000/auth/login/admin", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ ...formData, role: "admin" }),
//       });

//       const data = await response.json();

//       if (response.ok) {
//         const user = data.user;

//         // 🧹 Remove other tokens to avoid conflicts
//         localStorage.removeItem("token");
//         localStorage.removeItem("vendorToken");
//         localStorage.removeItem("subuserToken");

//         // 🧠 Store admin info
//         localStorage.setItem("adminToken", data.token);
//         localStorage.setItem("role", "admin");
//         localStorage.setItem("name", user.fullName || user.name);
//         localStorage.setItem("userId", user.id);

//         toast.success("Admin logged in successfully!");
//         navigate("/admin/dashboard");
//       } else {
//         toast.error(data.error || "Login failed!");
//       }
//     } catch (error) {
//       console.error(error);
//       toast.error("Something went wrong!");
//     }
//   };

//   // ⏳ Prevent flicker while checking tokens
//   if (isChecking) return null;

//   return (
//     <div className={styles.login}>
//       <div className={styles.container}>
//         <div className={styles.formCard}>
//           <h1>Admin Login</h1>
//           <form onSubmit={handleSubmit}>
//             <div className={styles.formGroup}>
//               <label>Email</label>
//               <input
//                 type="email"
//                 name="email"
//                 value={formData.email}
//                 onChange={handleChange}
//                 required
//               />
//             </div>
//             <div className={styles.formGroup}>
//               <label>Password</label>
//               <input
//                 type="password"
//                 name="password"
//                 value={formData.password}
//                 onChange={handleChange}
//                 required
//               />
//             </div>
//             <button type="submit" className={styles.submitBtn}>
//               Login
//             </button>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AdminLogin;
