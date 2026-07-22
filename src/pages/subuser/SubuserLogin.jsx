// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import styles from "./SubuserLogin.module.css";


// const SubuserLogin = () => {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const navigate = useNavigate();

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     try {
//       // ✅ FIX: Correct endpoint
//      const res = await fetch("http://localhost:5000/subuser/login/subuser"
// , {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email, password }),
//       });

//       const data = await res.json();
//       if (res.ok) {
//         localStorage.setItem("token", data.token);
//         localStorage.setItem("permissions", JSON.stringify(data.user.permissions));

//         alert("Login successful!");

//         // ✅ Use backend-provided redirectUrl
//         navigate(data.redirectUrl || "/subuser-dashboard");
//       } else {
//         alert(data.error || "Login failed");
//       }
//     } catch (err) {
//       console.error(err);
//       alert("Something went wrong");
//     }
//   };

//   return (
//     <form onSubmit={handleLogin} className={styles.loginContainer}>
//   <h2>Subuser Login</h2>
//   <input
//     type="email"
//     placeholder="Email"
//     value={email}
//     onChange={(e) => setEmail(e.target.value)}
//     required
//   />
//   <input
//     type="password"
//     placeholder="Password"
//     value={password}
//     onChange={(e) => setPassword(e.target.value)}
//     required
//   />
//   <button type="submit">Login</button>
// </form>

//   );
// };

// export default SubuserLogin;


// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import styles from "./SubuserLogin.module.css";

// const SubuserLogin = () => {
//   const [email, setEmail]               = useState("");
//   const [password, setPassword]         = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const navigate = useNavigate();

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     try {
//       const res = await fetch("http://localhost:5000/subuser/login/subuser", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email, password }),
//       });
//       const data = await res.json();
//       if (res.ok) {
//         localStorage.setItem("token", data.token);
//         localStorage.setItem("permissions", JSON.stringify(data.user.permissions));
//         navigate(data.redirectUrl || "/subuser-dashboard");
//       } else {
//         alert(data.error || "Login failed");
//       }
//     } catch (err) {
//       console.error(err);
//       alert("Something went wrong");
//     }
//   };

//   return (
//     <div className={styles.wrapper}>
//       <div className={styles.glow1} aria-hidden="true" />
//       <div className={styles.glow2} aria-hidden="true" />

//       <form onSubmit={handleLogin} className={styles.loginCard}>

//         {/* Header */}
//         <div className={styles.header}>
//           <div className={styles.iconCircle}>🛡️</div>
//           <h2>Subuser Login</h2>
//           <p>Sign in to your account</p>
//         </div>

//         {/* Email */}
//         <div className={styles.field}>
//           <label htmlFor="su-email">Email address</label>
//           <div className={styles.inputRow}>
//             <span className={styles.inputIcon} aria-hidden="true">✉</span>
//             <input
//               id="su-email"
//               type="email"
//               placeholder="you@company.com"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               className={styles.textInput}
//               required
//             />
//           </div>
//         </div>

//         {/* Password */}
//         <div className={styles.field}>
//           <label htmlFor="su-password">Password</label>
//           <div className={styles.inputRow}>
//             <span className={styles.inputIcon} aria-hidden="true">🔒</span>
//             <input
//               id="su-password"
//               type={showPassword ? "text" : "password"}
//               placeholder="Enter your password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               className={`${styles.textInput} ${styles.textInputPw}`}
//               required
//             />
//             {/* eye button: sibling inside the flex row — no absolute positioning */}
//             <button
//               type="button"
//               className={styles.eyeBtn}
//               onClick={() => setShowPassword((v) => !v)}
//               aria-label={showPassword ? "Hide password" : "Show password"}
//             >
//               {showPassword ? "🙈" : "👁️"}
//             </button>
//           </div>

//           <div className={styles.forgotRow}>
//             <button
//               type="button"
//               className={styles.forgotBtn}
//               onClick={() => navigate("/forgot-password")}
//             >
//               Forgot password?
//             </button>
//           </div>
//         </div>

//         {/* Submit */}
//         <button type="submit" className={styles.submitBtn}>Sign in →</button>

//         <div className={styles.divider}>
//           <span /><small>secured access</small><span />
//         </div>
//         <p className={styles.footerNote}>Having trouble? Contact your admin</p>
//       </form>
//     </div>
//   );
// };

// export default SubuserLogin;

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const SubuserLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/subuser/login/subuser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("permissions", JSON.stringify(data.user.permissions));
        navigate(data.redirectUrl || "/subuser-dashboard");
      } else {
        alert(data.error || "Login failed");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .su-page {
          min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
          font-family: 'Sora', sans-serif;
          padding: 2rem;
        }
        .su-card {
          width: 100%; max-width: 400px;
          background: rgba(255,255,255,0.07);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 22px;
          border: 1px solid rgba(255,255,255,0.13);
          padding: 2.5rem 2rem;
          display: flex; flex-direction: column; gap: 16px;
        }
        .su-badge {
          width: 60px; height: 60px; border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #ec4899);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 14px; font-size: 26px;
          box-shadow: 0 6px 28px rgba(99,102,241,0.5);
        }
        .su-header { text-align: center; margin-bottom: 4px; }
        .su-header h2 { font-size: 22px; font-weight: 700; color: #fff; margin-bottom: 6px; }
        .su-header p { font-size: 13px; color: rgba(255,255,255,0.4); font-weight: 300; }

        .su-field { display: flex; flex-direction: column; gap: 6px; }
        .su-label {
          font-size: 11px; font-weight: 600; letter-spacing: 0.7px;
          text-transform: uppercase; color: rgba(255,255,255,0.5);
        }
        .su-row {
          height: 48px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.07);
          display: flex; align-items: stretch;
          overflow: hidden;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .su-row:focus-within {
          border-color: rgba(99,102,241,0.8);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.2);
        }
        .su-ico {
          flex-shrink: 0; width: 42px;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; color: rgba(255,255,255,0.3);
          pointer-events: none;
        }
        .su-input {
          flex: 1; min-width: 0; height: 100%;
          background: transparent; border: none; outline: none;
          box-shadow: none; color: #fff;
          font-size: 14px; font-family: 'Sora', sans-serif;
          padding: 0; margin: 0;
          -webkit-appearance: none; appearance: none;
        }
        .su-input::placeholder { color: rgba(255,255,255,0.25); opacity: 1; }
        .su-input:-webkit-autofill,
        .su-input:-webkit-autofill:hover,
        .su-input:-webkit-autofill:focus {
          transition: background-color 9999s 0s, color 9999s 0s;
          -webkit-text-fill-color: #fff !important;
          caret-color: #fff;
        }

        /* span instead of button — zero browser chrome, no white box ever */
        .su-eye {
          flex-shrink: 0;
          width: 46px;
          display: flex; align-items: center; justify-content: center;
          border-left: 1px solid rgba(255,255,255,0.1);
          cursor: pointer;
          font-size: 16px;
          color: rgba(255,255,255,0.5);
          user-select: none;
          transition: background 0.18s, color 0.18s;
        }
        .su-eye:hover { background: rgba(255,255,255,0.1); color: #fff; }

        .su-forgot-row { text-align: right; margin-top: 2px; }
        .su-forgot {
          background: none; border: none; cursor: pointer; padding: 0;
          font-size: 12px; font-family: 'Sora', sans-serif;
          font-weight: 600; color: #a78bfa;
        }
        .su-forgot:hover { opacity: 0.7; }

        .su-submit {
          margin-top: 4px; padding: 14px; width: 100%;
          background: linear-gradient(135deg, #6366f1, #ec4899);
          color: #fff; border: none; border-radius: 12px;
          font-size: 15px; font-weight: 700;
          font-family: 'Sora', sans-serif; cursor: pointer;
          box-shadow: 0 4px 22px rgba(99,102,241,0.45);
          -webkit-appearance: none; appearance: none;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .su-submit:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(99,102,241,0.55); }
        .su-submit:active { transform: translateY(0); }

        .su-divider { display: flex; align-items: center; gap: 12px; }
        .su-divider span { flex: 1; height: 1px; background: rgba(255,255,255,0.07); }
        .su-divider small { font-size: 11px; color: rgba(255,255,255,0.22); }
        .su-footer { text-align: center; font-size: 12px; color: rgba(255,255,255,0.22); font-weight: 300; }
      `}</style>

      <div className="su-page">
        <form onSubmit={handleLogin} className="su-card" autoComplete="on">

          <div className="su-header">
            <div className="su-badge">🛡️</div>
            <h2>Subuser Login</h2>
            <p>Sign in to your account</p>
          </div>

          {/* Email */}
          <div className="su-field">
            <span className="su-label">Email address</span>
            <div className="su-row">
              <span className="su-ico" aria-hidden="true">✉</span>
              <input
                className="su-input"
                type="email"
                placeholder="you@company.com"
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="su-field">
            <span className="su-label">Password</span>
            <div className="su-row">
              <span className="su-ico" aria-hidden="true">🔒</span>
              <input
                className="su-input"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {/* span — not a button, so zero browser default styles, no white box */}
              <span
                className="su-eye"
                role="button"
                tabIndex={0}
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((v) => !v)}
                onKeyDown={(e) => e.key === "Enter" && setShowPassword((v) => !v)}
              >
                {showPassword ? "🙈" : "👁️"}
              </span>
            </div>
            <div className="su-forgot-row">
              <button type="button" className="su-forgot" onClick={() => navigate("/forgot-password")}>
                Forgot password?
              </button>
            </div>
          </div>

          <button type="submit" className="su-submit">Sign in →</button>

          <div className="su-divider">
            <span /><small>secured access</small><span />
          </div>
          <p className="su-footer">Having trouble? Contact your admin</p>
        </form>
      </div>
    </>
  );
};

export default SubuserLogin;