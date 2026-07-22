import React, { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer
} from "recharts";
import { CSVLink } from "react-csv";
import styles from "./Dashboard.module.css";

const COLORS = ["#4f46e5", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b"];

const Dashboard = () => {
  const [filter, setFilter] = useState("Yearly");

  // Dynamic state from backend
  const [newUsers, setNewUsers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [bestItems, setBestItems] = useState([]);
  const [latestOrders, setLatestOrders] = useState([]);
  const [userRolesData, setUserRolesData] = useState([]);
  const [vendorStatusData, setVendorStatusData] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [subusers, setSubusers] = useState([]);
  const [revenueData, setRevenueData] = useState([]);


  // Static placeholder data for now (replace with backend revenue/vendor stats later if needed)
 

  
  // UI toggles
  const [showNewUsers, setShowNewUsers] = useState(false);
  const [showVendors, setShowVendors] = useState(false);
  const [showSubusers, setShowSubusers] = useState(false);

  // Stock analysis placeholder data
  const [stockItems, setStockItems] = useState([]);


  const [visibleStatus, setVisibleStatus] = useState(null);
  const toggleVisibility = (status) => {
    setVisibleStatus((prev) => (prev === status ? null : status));
  };
  const filteredItems = (status) => stockItems.filter((item) => item.status === status);

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  // Fetch data from backend
  useEffect(() => {
    const fetchNewUsers = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/users/new?limit=10");
        const data = await res.json();
        setNewUsers(data.data || []);
      } catch (err) {
        console.error("Error fetching new users:", err);
      }
    };

    const fetchVendors = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/vendors/active?limit=10");
        const data = await res.json();
        setVendors(data.data || []);
      } catch (err) {
        console.error("Error fetching vendors:", err);
      }
    };

    const fetchBestItems = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/dashboard/best-items?limit=5");
        const data = await res.json();
        setBestItems(data.data || []);
      } catch (err) {
        console.error("Error fetching best items:", err);
      }
    };
    const fetchUserRoles = async () => {
  try {
    const res = await fetch("http://localhost:5000/api/users/roles");
    const data = await res.json();
    // Backend returns: { data: [ { name: "admin", count: 5 }, ... ] }
    const formatted = data.data.map(role => ({
      name: role.name,
      value: role.count
    }));
    setUserRolesData(formatted);
  } catch (err) {
    console.error("Error fetching user roles:", err);
  }
};

const fetchVendorStatus = async () => {
  try {
    const res = await fetch("http://localhost:5000/api/vendors/status");
    const data = await res.json();
    const formatted = data.data.map(status => ({
      name: status.name,
      value: status.count
    }));
    setVendorStatusData(formatted);
  } catch (err) {
    console.error("Error fetching vendor status:", err);
  }
};
 
const fetchStockAnalysis = async () => {
  try {
    const res = await fetch("http://localhost:5000/api/dashboard/stock-analysis");
    const data = await res.json();
    if (data && data.data) {
      setStockItems(data.data);
    } else {
      setStockItems([]);
    }
  } catch (err) {
    console.error("Error fetching stock analysis:", err);
  }
};


fetchUserRoles();
fetchVendorStatus();
fetchStockAnalysis(); 

    const fetchLatestOrders = async () => {
  try {
    const res = await fetch("http://localhost:5000/api/admin/latest-orders?limit=10");
    const data = await res.json();
    setLatestOrders(data); // ✅ backend already returns a list
  } catch (err) {
    console.error("Error fetching latest orders:", err);
  }
};

     
    fetchNewUsers();
    fetchVendors();
    fetchBestItems();
    fetchLatestOrders();
  }, []);
     
useEffect(() => {
 const fetchDashboardData = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/dashboard/summary?period=${filter.toLowerCase()}`);
      const data = await res.json();

      if (!data.error) {
        setTotalSales(data.total_sales || 0);
        setTotalRevenue(data.total_revenue || 0);
        setRevenueData(data.monthly_revenue || []);
        setSubusers(data.subusers || []);
        setStockItems(data.stock_analysis || []);
      }
    } catch (err) {
      console.error("Error fetching filtered dashboard data:", err);
    }
  };

  fetchDashboardData();
}, [filter]); 



  return (
    <div className={styles.dashboardContainer}>
      {/* Header */}
      <div className={styles.dashboardHeader}>
        <h2>Admin Dashboard</h2>
        <div className={styles.filterDropdown}>
          <label>Filter: </label>
          <select value={filter} onChange={handleFilterChange}>
            <option value="Yearly">Yearly</option>
            <option value="Monthly">Monthly</option>
            <option value="Weekly">Weekly</option>
            <option value="Daily">Daily</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsCards}>
       <div className={`${styles.card} ${styles.totalSales}`}>
  <h4>Total Sales</h4>
  <h2>₹{totalSales.toLocaleString()}</h2>
  <p>This year</p>
</div>


        <div className={`${styles.card} ${styles.totalRevenue}`}>
  <h4>Total Revenue</h4>
  <h2>₹{totalRevenue.toLocaleString()}</h2>
  <p>Available for payout</p>
</div>


        <div className={`${styles.card} ${styles.newUsers}`}>
          <h4 onClick={() => setShowNewUsers(!showNewUsers)} style={{ cursor: "pointer" }}>
            New Users ⌄
          </h4>
          <h2>{newUsers.length}</h2>
          <p>Customers & Vendors</p>
          {showNewUsers && (
            <ul className={styles.dropdownList}>
              {newUsers.map((user, idx) => (
                <li key={idx}>{user}</li>
              ))}
            </ul>
          )}
        </div>

        <div className={`${styles.card} ${styles.activeVendors}`}>
          <h4 onClick={() => setShowVendors(!showVendors)} style={{ cursor: "pointer" }}>
            Active Vendors ⌄
          </h4>
           {vendors.length > 0 ? vendors[0] : "No vendors"}
          <p>+5 today</p>
          {showVendors && (
            <ul className={styles.dropdownList}>
              {vendors.map((vendor, idx) => (
                <li key={idx}>{vendor}</li>
              ))}
            </ul>
          )}
        </div>

       <div className={`${styles.card} ${styles.subUsers}`}>
  <h4 onClick={() => setShowSubusers(!showSubusers)} style={{ cursor: "pointer" }}>
    Subusers ⌄
  </h4>
  <h2>{subusers.length}</h2>
  <p>With restricted access</p>
  {showSubusers && (
    <ul className={styles.dropdownList}>
      {subusers.map((sub, idx) => (
        <li key={idx}>{sub}</li>
      ))}
    </ul>
  )}
</div>


        <div className={`${styles.card} ${styles.reports}`}>
          <h4>Reports</h4>
          <CSVLink data={latestOrders} filename="orders.csv">
            <button className={styles.exportBtn}>Export CSV</button>
          </CSVLink>
        </div>
      </div>

      {/* Charts */}
      <div className={styles.chartSection}>
        <div className={styles.chartCard}>
          <h3>Monthly Revenue</h3>
         <ResponsiveContainer width="100%" height={250}>
  <BarChart data={revenueData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="name" stroke="#ccc" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Bar dataKey="revenue" fill="#6366f1" />
  </BarChart>
</ResponsiveContainer>

        </div>

        <div className={styles.chartCard}>
          <h3>Best Seller Items</h3>
         <PieChart width={400} height={250}>
          <Pie
           data={bestItems}
           cx={200}
           cy={125}
           innerRadius={50}
           outerRadius={100}
           fill="#8884d8"
           paddingAngle={5}
           dataKey="sold"   
           nameKey="name"  
           label
          >
            {bestItems.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
           </Pie>
           <Tooltip />
         </PieChart>

        </div>

        <div className={styles.chartCard}>
          <h3>User Roles</h3>
          <PieChart width={400} height={250}>
            <Pie
              data={userRolesData}
              cx={200}
              cy={125}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              label
            >
              {userRolesData.map((entry, index) => (
                <Cell key={`role-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>

        <div className={styles.chartCard}>
          <h3>Vendor Status</h3>
          <PieChart width={400} height={250}>
            <Pie
              data={vendorStatusData}
              cx={200}
              cy={125}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              label
            >
              {vendorStatusData.map((entry, index) => (
                <Cell key={`vendor-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>
      </div>

       {/* Latest Orders */}
<div className={styles.ordersSection}>
  <h3>Latest Orders</h3>
  <table className={styles.ordersTable}>
    <thead>
      <tr>
        <th>Product</th>
        <th>Order ID</th>
        <th>Customer</th>
        <th>Status</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      {latestOrders.map((order, idx) => (
        <tr key={idx}>
          {/* Product images + names */}
<td style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
  {order.order_items && order.order_items.length > 0 ? (
    order.order_items.map((item, i) => (
      <div key={i} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <img
          src={item.image}
          alt={item.name}
          style={{
            width: "40px",
            height: "40px",
            objectFit: "cover",
            borderRadius: "4px"
          }}
        />
        <span>{item.name}</span>
      </div>
    ))
  ) : (
    <span>No items</span>
  )}
</td>


          {/* Order ID */}
          <td>{order.order_id}</td>

          {/* Customer */}
          <td>{order.customer_name || "Unknown"}</td>

          {/* Status */}
          <td className={`${styles.status} ${styles[order.status?.toLowerCase()]}`}>
            {order.status}
          </td>

          {/* Amount */}
          <td>₹{order.final_amount}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

      {/* Stock Analysis */}
      <div className={styles.stockSection}>
        <h3>📈 Stock Analysis</h3>
        <div className={styles.stockCategories}>
          {["Low Stock", "Out of Stock", "High Stock"].map((status) => (
            <div key={status} className={styles.stockCard}>
              <div className={styles.stockHeader}>
                <span>{status}</span>
                <button onClick={() => toggleVisibility(status)}>
                  {visibleStatus === status ? "Hide" : "Show"}
                </button>
              </div>
              {visibleStatus === status && (
                <div className={styles.stockList}>
                  {filteredItems(status).map((item, idx) => (
                    <div key={idx} className={styles.stockItem}>
                      <img src={item.image} alt={item.name} className={styles.stockImage} />
                      <div>
                        <strong>{item.name}</strong>
                        <p>Product ID: {item.productId}</p>
                        <p>Qty: {item.quantity}</p>
                        <p>Size: {item.size}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className={styles.notifications}>
        <h3>🔔 Live Notifications</h3>
        <ul>
          <li>Order ORD1235 is pending delivery.</li>
          <li>New vendor "TechWear" signed up.</li>
          <li>Subuser "Raj" updated inventory.</li>
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
