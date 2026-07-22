import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './Dashboard.module.css';
import {
  FaBox,
  FaShoppingBag,
  FaChartLine,
  FaRupeeSign,
  FaArrowUp,
  FaArrowDown,
} from 'react-icons/fa';

const iconMap = {
  'box': <FaBox />,
  'shopping-bag': <FaShoppingBag />,
  'rupee-sign': <FaRupeeSign />,
  'chart-line': <FaChartLine />,
};

const Dashboard = () => {
  const [stats, setStats] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('token');

        const res = await axios.get('http://localhost:5000/vendor/dashboard', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setStats(res.data.stats || []);
        setRecentOrders(res.data.recentOrders || []);
      } catch (err) {
        console.error('Error fetching dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.dashboard}>
      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        {stats.length === 0 ? (
          <p>No stats available</p>
        ) : (
          stats.map((stat, index) => (
            <div key={index} className={styles.statCard}>
              <div className={styles.statIcon}>
                {iconMap[stat.icon]}
              </div>
              <div className={styles.statInfo}>
                <h3>{stat.title}</h3>
                <p className={styles.statValue}>{stat.value}</p>
                <span
                  className={`${styles.statChange} ${
                    stat.isPositive ? styles.positive : styles.negative
                  }`}
                >
                  {stat.isPositive ? <FaArrowUp /> : <FaArrowDown />}
                  {stat.change}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Recent Orders */}
      <div className={styles.recentOrders}>
        <div className={styles.sectionHeader}>
          <h2>Recent Orders</h2>
          <button className={styles.viewAll}>View All</button>
        </div>

        {recentOrders.length === 0 ? (
          <p>No recent orders available</p>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Products</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.customer}</td>
                    <td>
                      <div className={styles.productCell}>
                        {order.products.map((prod, idx) => (
                          <div key={idx} className={styles.productItem}>
                            {prod.image ? (
                              <img
                                src={prod.image}
                                alt={prod.name}
                                className={styles.productImage}
                              />
                            ) : (
                              <span className={styles.noImage}>No Image</span>
                            )}
                            <div className={styles.productDetails}>
                              <span className={styles.productName}>{prod.name}</span>
                              <span className={styles.productMeta}>Size: {prod.size}</span>
                              <span className={styles.productMeta}>Qty: {prod.quantity}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td>{order.amount}</td>
                    <td>
                      <span
                        className={`${styles.status} ${
                          styles[order.status.toLowerCase()]
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td>{order.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
