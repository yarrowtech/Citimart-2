// import React, { useState } from 'react';
// import { Link } from 'react-router-dom';
// import { FaEye, FaEyeSlash } from 'react-icons/fa'; // ✅ import icons
// import styles from './Register.module.css';

// const Register = () => {
//   const [formData, setFormData] = useState({
//     name: '', 
//     email: '', 
//     password: '', 
//     confirmPassword: '', 
//   });

//   // State for password visibility
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirm, setShowConfirm] = useState(false);

//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value,
//     });
//   };
  
//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (formData.password !== formData.confirmPassword) {
//       alert('Passwords do not match!');
//       return;
//     }

//     try {
//       const response = await fetch(`${API_BASE}/auth/register`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           name: formData.name,
//           email: formData.email,
//           password: formData.password,
//           role: 'customer', // ✅ keep existing role
//         }),
//       });

//       const data = await response.json();

//       if (response.ok) {
//         alert(data.message || 'Registration successful!');
//         window.location.href = '/login';
//       } else {
//         alert(data.error || 'Registration failed!');
//       }
//     } catch (error) {
//       console.error(error);
//       alert('An error occurred. Please try again later!');
//     }
//   };
  
//   return (
//     <div className={styles.register}>
//       <div className={styles.container}>
//         <div className={styles.formCard}>
//           <h1>Create Account</h1>
          
//           <form onSubmit={handleSubmit}>
//             <div className={styles.formGroup}>
//               <label htmlFor="name">Full Name</label>
//               <input
//                 type="text"
//                 id="name"
//                 name="name"
//                 value={formData.name}
//                 onChange={handleChange}
//                 required
//               />
//             </div>

//             <div className={styles.formGroup}>
//               <label htmlFor="email">Email</label>
//               <input
//                 type="email"
//                 id="email"
//                 name="email"
//                 value={formData.email}
//                 onChange={handleChange}
//                 required
//               />
//             </div>

//             {/* Password */}
//             <div className={styles.formGroup}>
//               <label htmlFor="password">Password</label>
//               <div className={styles.passwordWrapper}>
//                 <input
//                   type={showPassword ? 'text' : 'password'}
//                   id="password"
//                   name="password"
//                   value={formData.password}
//                   onChange={handleChange}
//                   required
//                 />
//                 <button
//                   type="button"
//                   className={styles.toggleBtn}
//                   onClick={() => setShowPassword(!showPassword)}
//                 >
//                   {showPassword ? <FaEyeSlash /> : <FaEye />}
//                 </button>
//               </div>
//             </div>

//             {/* Confirm Password */}
//             <div className={styles.formGroup}>
//               <label htmlFor="confirmPassword">Confirm Password</label>
//               <div className={styles.passwordWrapper}>
//                 <input
//                   type={showConfirm ? 'text' : 'password'}
//                   id="confirmPassword"
//                   name="confirmPassword"
//                   value={formData.confirmPassword}
//                   onChange={handleChange}
//                   required
//                 />
//                 <button
//                   type="button"
//                   className={styles.toggleBtn}
//                   onClick={() => setShowConfirm(!showConfirm)}
//                 >
//                   {showConfirm ? <FaEyeSlash /> : <FaEye />}
//                 </button>
//               </div>
//             </div>

//             <button type="submit" className={styles.submitBtn}>
//               Register
//             </button>
//           </form>

//           <div className={styles.links}>
//             <p>
//               Already have an account? <Link to="/login">Login</Link>
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Register;

import React, { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import styles from './Register.module.css';
import { API_BASE } from "../config";
import { mergeGuestCommerce } from "../utils/guestCommerce";

const Register = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const requestedReturnTo = searchParams.get("returnTo") || location.state?.returnTo || "/";
  const returnTo = requestedReturnTo.startsWith("/") && !requestedReturnTo.startsWith("//") ? requestedReturnTo : "/";

  const [formData, setFormData] = useState({
    name: '',
    email: searchParams.get('email') || '',   // ✅ prefilled from guest invite link
    phone: '',           // ✅ new optional field
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    // ✅ Phone validation — only if provided
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      alert('Phone number must be 10 digits');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,   // ✅ null if not provided
          password: formData.password,
          role: 'customer',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        try {
          const loginRes = await fetch(`${API_BASE}/auth/login/customer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: formData.email, password: formData.password, role: 'customer' }),
          });
          const loginData = await loginRes.json();
          if (!loginRes.ok) throw new Error(loginData.error || 'Auto-login failed');
          const user = loginData.user;
          const customer = {
            name: user.fullName || user.name,
            email: user.email,
            token: loginData.token,
            id: user.id,
          };
          localStorage.setItem('customer', JSON.stringify(customer));
          localStorage.setItem('token', loginData.token);
          localStorage.setItem('customer_id', user.id);
          localStorage.setItem('role', 'customer');
          await mergeGuestCommerce(customer).catch(error => console.error("Guest basket merge failed:", error));
          window.dispatchEvent(new Event("citimart:auth-changed"));
          navigate(returnTo, { replace: true });
        } catch {
          alert(data.message || 'Registration successful! Please log in.');
          navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`, { replace: true, state: { returnTo } });
        }
      } else {
        alert(data.error || 'Registration failed!');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred. Please try again later!');
    }
  };

  return (
    <div className={styles.register}>
      <div className={styles.container}>
        <div className={styles.formCard}>
          <h1>Create Account</h1>

          <form onSubmit={handleSubmit}>

            {/* Full Name */}
            <div className={styles.formGroup}>
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            {/* Email */}
            <div className={styles.formGroup}>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* Phone — optional */}
            <div className={styles.formGroup}>
              <label htmlFor="phone">
                Phone Number
                <span className={styles.optionalTag}> (optional)</span>
              </label>
              <div className={styles.phoneWrapper}>
                <span className={styles.phonePrefix}>+91</span>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  placeholder="10-digit mobile number"
                  value={formData.phone}
                  onChange={handleChange}
                  maxLength={10}
                  pattern="\d{10}"
                  inputMode="numeric"
                />
              </div>
              <p className={styles.hint}>
                Saves time at checkout — we'll pre-fill this for you
              </p>
            </div>

            {/* Password */}
            <div className={styles.formGroup}>
              <label htmlFor="password">Set Password</label>
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className={styles.toggleBtn}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className={styles.passwordWrapper}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className={styles.toggleBtn}
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirm ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button type="submit" className={styles.submitBtn}>
              Create Account
            </button>
          </form>

          <div className={styles.links}>
            <p>
              Already have an account? <Link to={`/login?returnTo=${encodeURIComponent(returnTo)}`} state={{ returnTo }}>Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;