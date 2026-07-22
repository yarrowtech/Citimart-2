import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './Login.module.css';
import { toast } from 'react-toastify';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '', role: 'customer' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://127.0.0.1:5000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        const user = data.user;

        //  Store customer data properly
        if (user.role === 'customer') {
          localStorage.setItem('customer', JSON.stringify({
            name: user.fullName || user.name,
            email: user.email,
            token: data.token,
            id: user.id,
          }));
          localStorage.setItem('token', data.token);
          localStorage.setItem('customer_id', user.id);
        } else {
          localStorage.setItem('token', data.token);
          localStorage.setItem('role', user.role);
          localStorage.setItem('name', user.fullName || user.name);
          localStorage.setItem('userId', user.id);

          if (user.role === 'vendor') {
            localStorage.setItem('vendor_id', user.id);
          }
        }

        toast.success(`${user.role} logged in successfully!`);

        //  Redirect by role
        if (user.role === 'admin') navigate('/admin/dashboard');
        else if (user.role === 'vendor') navigate('/vendor');
        else navigate('/');
      } else {
        alert(data.error || 'Login failed!');
      }
    } catch (error) {
      console.error(error);
      alert('Something went wrong, try again later!');
    }
  };

  return (
    <div className={styles.login}>
      <div className={styles.container}>
        <div className={styles.formCard}>
          <h1>Login</h1>

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="role">Role</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="customer">Customer</option>
                <option value="vendor">Vendor</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <button type="submit" className={styles.submitBtn}>
              Login
            </button>
          </form>

          <div className={styles.links}>
            <Link to="/forgotpassword">Forgot Password?</Link>
            <p>Don't have an account? <Link to="/register">Register</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
