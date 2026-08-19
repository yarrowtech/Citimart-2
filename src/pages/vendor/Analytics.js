import React, { useState, useEffect } from 'react';
import { FaRupeeSign, FaShoppingBag, FaChartLine, FaBox, FaArrowUp, FaArrowDown, FaUserPlus, FaUserCheck, FaStar, FaMapMarkerAlt, FaClipboardList, FaCheckCircle, FaTimesCircle, FaMoneyCheckAlt, FaWallet, FaUndo, FaExclamationTriangle, FaHistory, FaBullhorn, FaHeart, FaFilter } from 'react-icons/fa';
import styles from './Analytics.module.css';

import { API_BASE } from "../../config";
const dateRanges = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
];

const categories = ['All', 'Clothing', 'Footwear', 'Accessories'];
const regions = ['All', 'Mumbai', 'Delhi', 'Bangalore', 'Chennai'];

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [selectedDate, setSelectedDate] = useState('month');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedRegion, setSelectedRegion] = useState('All');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/vendor/analytics`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to fetch analytics', err);
    }
  };

  if (!analytics) {
    return <p>Loading analytics...</p>;
  }

  const { salesOverview, productPerformance, customerInsights, orderAnalytics, earningsOverview, returnsComplaints, stockInsights, marketingEngagement } = analytics;

  const returnRate = productPerformance.totalSold
    ? ((productPerformance.totalReturned / productPerformance.totalSold) * 100).toFixed(1)
    : 0;


const getBarColor = (sales, maxSales) => {
  if (sales === 0) return '#ddd';          // zero sales → grey
  if (sales / maxSales > 0.7) return '#17c5bcff'; // high → green
  if (sales / maxSales > 0.3) return '#ff5816ff'; // medium → orange
  return '#f44336';                         // low → red
};



const renderTrendChart = () => {
  const trendData = salesOverview.trendData || [];
  if (!trendData.length) return <p>No trend data available.</p>;

  const maxSales = Math.max(...trendData.map(t => t.sales), 1);
  const chartMaxHeight = 150; // max bar height in px

  return (
    <div className={styles.trendChartContainer}>
      {trendData.map((t, idx) => {
        const barHeight = t.sales > 0 ? (t.sales / maxSales) * chartMaxHeight : 10;

        return (
          <div key={idx} className={styles.trendBar}>
            <div
              className={styles.trendBarFill}
              style={{
                height: `${barHeight}px`,
                backgroundColor: getBarColor(t.sales, maxSales)
              }}
              title={`₹${t.sales}`}
            />
            <div className={styles.trendLabel}>{t.day}</div>
          </div>
        );
      })}
    </div>
  );
};


console.log('Trend Data:', salesOverview.trendData);




  const renderFilters = () => (
    <div className={styles.filters}>
      <FaFilter />
      <select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}>
        {dateRanges.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
        {categories.map((cat) => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
      <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)}>
        {regions.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className={styles.dashboard}>
      <h1>Vendor Analytics</h1>
      {renderFilters()}

      {/* Sales Overview */}
      <section>
        <h2>Sales Overview</h2>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <FaRupeeSign />
            <p>Total Sales: ₹{salesOverview.totalSales}</p>
          </div>
          <div className={styles.statCard}>
            <FaShoppingBag />
            <p>Units Sold: {salesOverview.unitsSold}</p>
          </div>
        </div>
        <h4>Sales Trend</h4>
        {renderTrendChart()}
        <h4>Top Days</h4>
        <ul>
          {salesOverview.topDays.map((d) => (
            <li key={d.day}><FaArrowUp /> {d.day}: ₹{d.sales}</li>
          ))}
        </ul>
      </section>

      {/* Product Performance */}
      <section>
        <h2>Product Performance</h2>
        <h3>Top Selling</h3>
        <ul>
          {productPerformance.topSelling.map((p) => (
            <li key={p.name}>{p.name}: {p.qty} units - ₹{p.revenue}</li>
          ))}
        </ul>
        <h3>Low Performing</h3>
        <ul>
          {productPerformance.lowPerforming.map((p) => (
            <li key={p.name}><FaArrowDown /> {p.name}: {p.qty} units - ₹{p.revenue}</li>
          ))}
        </ul>
        <h3>Out of Stock</h3>
        <ul>
          {productPerformance.outOfStock.map((p) => (
            <li key={p.name}><FaBox /> {p.name}</li>
          ))}
        </ul>
        <p>Return Rate: {returnRate}%</p>
      </section>

      {/* Customer Insights */}
      <section>
        <h2>Customer Insights</h2>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <FaUserPlus />
            <p>New Customers: {customerInsights.new}</p>
          </div>
          <div className={styles.statCard}>
            <FaUserCheck />
            <p>Returning Customers: {customerInsights.returning}</p>
          </div>
          <div className={styles.statCard}>
            <FaStar />
            <p>Ratings: {customerInsights.ratings} / 5</p>
          </div>
        </div>
        <h3>Top Locations</h3>
        <ul>
          {customerInsights.topLocations.map((loc) => (
            <li key={loc.city}><FaMapMarkerAlt /> {loc.city}: {loc.count}</li>
          ))}
        </ul>
      </section>

      {/* Order Analytics */}
      <section>
        <h2>Order Analytics</h2>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <FaClipboardList />
            <p>Total Orders: {orderAnalytics.total}</p>
          </div>
          <div className={styles.statCard}>
            <FaCheckCircle />
            <p>Fulfillment Rate: {orderAnalytics.fulfillmentRate}%</p>
          </div>
          <div className={styles.statCard}>
            <FaChartLine />
            <p>Avg Delivery: {orderAnalytics.avgDelivery} days</p>
          </div>
        </div>
      </section>

      {/* Earnings Overview */}
      <section>
        <h2>Earnings Overview</h2>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <FaMoneyCheckAlt />
            <p>Total: ₹{earningsOverview.total}</p>
          </div>
          <div className={styles.statCard}>
            <FaWallet />
            <p>Net Payout: ₹{earningsOverview.netPayout}</p>
          </div>
        </div>
        <h3>Payout History</h3>
        <ul>
          {earningsOverview.payoutHistory.map((p, idx) => (
            <li key={idx}>{p.date}: ₹{p.amount} - {p.status}</li>
          ))}
        </ul>
      </section>

      {/* Returns & Complaints */}
      <section>
        <h2>Returns & Complaints</h2>
        <h4>Return Reasons</h4>
        <ul>
          {returnsComplaints.reasons.map((r) => (
            <li key={r.reason}><FaUndo /> {r.reason}: {r.count}</li>
          ))}
        </ul>
        <h4>Complaints</h4>
        <ul>
          {returnsComplaints.complaints.map((c) => (
            <li key={c.category}><FaExclamationTriangle /> {c.category}: {c.count}</li>
          ))}
        </ul>
      </section>

      {/* Stock Insights */}
      <section>
        <h2>Stock Insights</h2>
        <p>Total SKUs: {stockInsights.totalSKUs}</p>
        <p>Low Stock: {stockInsights.lowStock}</p>
        <p>Out of Stock: {stockInsights.outOfStock}</p>
        <h4>Restock Suggestions</h4>
        <ul>
          {stockInsights.restockSuggestions.map((s) => (
            <li key={s.name}><FaHistory /> {s.name}: {s.suggestion}</li>
          ))}
        </ul>
      </section>

      {/* Marketing & Engagement */}
      <section>
        <h2>Marketing & Engagement</h2>
        <p>Ad ROI: {marketingEngagement.adROI}x</p>
        <h4>Promotions</h4>
        <ul>
          {marketingEngagement.promotions.map((p) => (
            <li key={p.name}><FaBullhorn /> {p.name}: {p.performance}</li>
          ))}
        </ul>
        <h4>Wishlist Products</h4>
        <ul>
          {marketingEngagement.wishlist.map((w) => (
            <li key={w.name}><FaHeart /> {w.name}: {w.count}</li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default Analytics;
