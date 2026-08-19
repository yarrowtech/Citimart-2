import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import { CSVLink } from "react-csv";
import {
  FaArrowDown, FaArrowUp, FaBoxOpen, FaChartLine, FaClipboardList,
  FaExclamationTriangle, FaGift, FaPercent, FaRedoAlt, FaRupeeSign,
  FaShoppingBag, FaShoppingCart, FaStore, FaTags, FaTicketAlt,
  FaUndoAlt, FaUsers
} from "react-icons/fa";
import styles from "./Dashboard.module.css";
import { API_BASE } from "../../config";

const API = `${API_BASE}/api`;
const PIE_COLORS = ["#6d28d9", "#8b5cf6", "#a78bfa", "#ec4899", "#f59e0b", "#14b8a6"];
const EMPTY = { kpis: {}, revenue_trend: [], order_status: [], payment_methods: [], top_products: [], low_stock: [], recent_orders: [], alerts: [] };

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const compact = (value) => Number(value || 0).toLocaleString("en-IN");

const Dashboard = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("monthly");
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);

  const loadDashboard = useCallback(async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login", { replace: true });
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API}/dashboard/overview?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const payload = await response.json();
      if (response.status === 401 || response.status === 403) {
        navigate("/admin/login", { replace: true });
        return;
      }
      if (!response.ok) throw new Error(payload.error || "Unable to load dashboard");
      setData({ ...EMPTY, ...payload });
      setUpdatedAt(new Date());
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [navigate, period]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const k = data.kpis || {};
  const statCards = [
    { label: "Gross sales", value: money(k.gross_sales), note: `${k.sales_growth >= 0 ? "+" : ""}${k.sales_growth || 0}% vs previous`, trend: k.sales_growth, icon: <FaRupeeSign /> },
    { label: "Realized revenue", value: money(k.realized_revenue), note: "Paid, completed and delivered", icon: <FaChartLine /> },
    { label: "Orders", value: compact(k.orders), note: `${k.orders_growth >= 0 ? "+" : ""}${k.orders_growth || 0}% vs previous`, trend: k.orders_growth, icon: <FaShoppingBag /> },
    { label: "Average order value", value: money(k.average_order_value), note: "Revenue per order", icon: <FaClipboardList /> },
    { label: "Customers", value: compact(k.customers), note: `${compact(k.active_carts)} active carts`, icon: <FaUsers />, path: "/admin/users" },
    { label: "Active vendors", value: compact(k.active_vendors), note: `${compact(k.products)} products listed`, icon: <FaStore />, path: "/admin/vendors" },
  ];

  const operationCards = [
    { label: "Active carts", value: k.active_carts, icon: <FaShoppingCart />, path: "/admin/orders" },
    { label: "Customer wishlists", value: k.wishlists, icon: <FaGift />, path: "/admin/users" },
    { label: "Active offers", value: k.active_offers, icon: <FaTags />, path: "/admin/offers" },
    { label: "Gift orders", value: k.gift_orders, icon: <FaGift />, path: "/admin/orders" },
    { label: "Open complaints", value: k.open_complaints, icon: <FaTicketAlt />, path: "/admin/complaints", attention: k.open_complaints > 0 },
    { label: "Pending returns", value: k.pending_returns, icon: <FaUndoAlt />, path: "/admin/orders", attention: k.pending_returns > 0 },
    { label: "Out of stock", value: k.out_of_stock, icon: <FaExclamationTriangle />, path: "/admin/inventory", attention: k.out_of_stock > 0 },
    { label: "Discounts given", value: money(k.discounts), icon: <FaPercent />, path: "/admin/offers" },
  ];

  const csvRows = useMemo(() => data.recent_orders.map(order => ({
    order_id: order.order_id, customer: order.customer_name, status: order.status,
    payment: order.payment_method, amount: order.final_amount, created_at: order.created_at
  })), [data.recent_orders]);

  const chartTrend = data.revenue_trend.length ? data.revenue_trend : [{ name: "No sales", revenue: 0, orders: 0 }];

  const currentPeriodLabel = { daily: "Last 24 hours", weekly: "Last 7 days", monthly: "Last 30 days", yearly: "Last 12 months" }[period];

  return (
    <section className={styles.dashboard}>
      <header className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Commerce overview</span>
          <h1>Admin Dashboard</h1>
          <p>Monitor sales, customers, fulfilment and inventory from one workspace.</p>
        </div>
        <div className={styles.headerActions}>
          <label className={styles.periodSelect}>
            <span>Reporting period</span>
            <select value={period} onChange={(event) => setPeriod(event.target.value)}>
              <option value="daily">Today</option><option value="weekly">7 days</option>
              <option value="monthly">30 days</option><option value="yearly">12 months</option>
            </select>
          </label>
          <button className={styles.refreshBtn} onClick={loadDashboard} disabled={loading}><FaRedoAlt /> Refresh</button>
        </div>
      </header>

      <div className={styles.dataMeta}>
        <span>{currentPeriodLabel}</span>
        <span>{updatedAt ? `Updated ${updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Loading live data"}</span>
      </div>

      {error && <div className={styles.errorBanner}><span>{error}</span><button onClick={loadDashboard}>Try again</button></div>}
      {loading && !updatedAt ? <div className={styles.loading}>Loading your commerce analytics…</div> : (
        <>
          <div className={styles.kpiGrid}>
            {statCards.map(card => (
              <article key={card.label} className={styles.kpiCard} onClick={() => card.path && navigate(card.path)} role={card.path ? "link" : undefined}>
                <div className={styles.cardTop}><span className={styles.cardIcon}>{card.icon}</span><span className={styles.cardLabel}>{card.label}</span></div>
                <strong>{card.value}</strong>
                <small className={card.trend < 0 ? styles.negative : card.trend > 0 ? styles.positive : ""}>
                  {card.trend !== undefined && (card.trend >= 0 ? <FaArrowUp /> : <FaArrowDown />)} {card.note}
                </small>
              </article>
            ))}
          </div>

          <div className={styles.operationsGrid}>
            {operationCards.map(card => (
              <Link to={card.path} key={card.label} className={`${styles.operationCard} ${card.attention ? styles.attention : ""}`}>
                <span>{card.icon}</span><div><strong>{compact(card.value)}</strong><small>{card.label}</small></div>
              </Link>
            ))}
          </div>

          <div className={styles.analyticsGrid}>
            <article className={`${styles.panel} ${styles.revenuePanel}`}>
              <div className={styles.panelHeader}><div><span>Performance</span><h2>Revenue and orders</h2></div><strong>{money(k.gross_sales)}</strong></div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartTrend} margin={{ left: -18, right: 8, top: 10 }}>
                  <defs><linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7c3aed" stopOpacity={0.35}/><stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid stroke="#ede9f6" vertical={false}/><XAxis dataKey="name" tick={{ fill: "#716882", fontSize: 12 }} axisLine={false}/><YAxis tick={{ fill: "#716882", fontSize: 12 }} axisLine={false}/>
                  <Tooltip formatter={(value, name) => name === "revenue" ? money(value) : value}/><Legend />
                  <Area type="monotone" dataKey="revenue" stroke="#6d28d9" fill="url(#revenueFill)" strokeWidth={3}/>
                  <Area type="monotone" dataKey="orders" stroke="#ec4899" fill="transparent" strokeWidth={2}/>
                </AreaChart>
              </ResponsiveContainer>
              {!data.revenue_trend.length && <small className={styles.chartNote}>No sales recorded in this period yet.</small>}
            </article>

            <ChartPanel title="Order status" data={data.order_status} />
            <ChartPanel title="Payment mix" data={data.payment_methods} />
          </div>

          <div className={styles.detailGrid}>
            <article className={styles.panel}>
              <div className={styles.panelHeader}><div><span>Merchandising</span><h2>Top-selling products</h2></div><Link to="/admin/products">View products</Link></div>
              {data.top_products.length ? (
                <ResponsiveContainer width="100%" height={285}>
                  <BarChart data={data.top_products} layout="vertical" margin={{ left: 10, right: 16 }}>
                    <CartesianGrid stroke="#ede9f6" horizontal={false}/><XAxis type="number" axisLine={false}/><YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} axisLine={false}/>
                    <Tooltip formatter={(value, name) => name === "revenue" ? money(value) : value}/><Bar dataKey="quantity" fill="#7c3aed" radius={[0, 6, 6, 0]}/>
                  </BarChart>
                </ResponsiveContainer>
              ) : <Empty text="Product sales will appear here" />}
            </article>

            <article className={styles.panel}>
              <div className={styles.panelHeader}><div><span>Action centre</span><h2>Needs attention</h2></div><Link to="/admin/inventory">Inventory</Link></div>
              <div className={styles.alertList}>
                {data.alerts.length ? data.alerts.map((alert, index) => <Link key={`${alert.text}-${index}`} to={alert.path} className={`${styles.alert} ${styles[alert.type]}`}><FaExclamationTriangle /><span>{alert.text}</span><b>→</b></Link>) : <div className={styles.allClear}>✓ Everything looks under control.</div>}
              </div>
              <h3 className={styles.subheading}>Low-stock variants</h3>
              <div className={styles.stockList}>
                {data.low_stock.slice(0, 5).map((item, index) => <div className={styles.stockRow} key={`${item.id}-${index}`}><div><strong>{item.name}</strong><small>{[item.size, item.color].filter(Boolean).join(" · ")}</small></div><span className={item.stock === 0 ? styles.stockZero : ""}>{item.stock} left</span></div>)}
                {!data.low_stock.length && <Empty text="No low-stock products" />}
              </div>
            </article>
          </div>

          <article className={styles.panel}>
            <div className={styles.panelHeader}><div><span>Fulfilment</span><h2>Recent orders</h2></div><div className={styles.tableActions}><CSVLink data={csvRows} filename="citimart-orders.csv" className={styles.exportBtn}>Export CSV</CSVLink><Link to="/admin/orders">All orders</Link></div></div>
            <div className={styles.tableWrap}>
              <table><thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Payment</th><th>Status</th><th>Total</th><th>Date</th></tr></thead>
                <tbody>{data.recent_orders.map(order => <tr key={order.order_id}><td><b>#{order.order_id.slice(-8).toUpperCase()}</b></td><td>{order.customer_name || "Unknown"}</td><td>{order.order_items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0}</td><td>{String(order.payment_method || "—").toUpperCase()}</td><td><span className={styles.statusPill}>{order.status || "Unknown"}</span></td><td><b>{money(order.final_amount)}</b></td><td>{order.created_at ? new Date(order.created_at).toLocaleDateString("en-IN") : "—"}</td></tr>)}</tbody>
              </table>
              {!data.recent_orders.length && <Empty text="No recent orders in this period" />}
            </div>
          </article>
        </>
      )}
    </section>
  );
};

const ChartPanel = ({ title, data }) => {
  const chartData = data.length ? data : [{ name: "No data", value: 1 }];
  return (
    <article className={styles.panel}>
      <div className={styles.panelHeader}><div><span>Distribution</span><h2>{title}</h2></div></div>
      <ResponsiveContainer width="100%" height={220}><PieChart><Pie data={chartData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={data.length ? 3 : 0}>{chartData.map((entry, index) => <Cell key={entry.name} fill={data.length ? PIE_COLORS[index % PIE_COLORS.length] : "#ddd6e8"}/>)}</Pie>{data.length && <Tooltip/>}<Legend iconType="circle"/></PieChart></ResponsiveContainer>
      {!data.length && <small className={styles.chartNote}>No records in this period yet.</small>}
    </article>
  );
};

const Empty = ({ text }) => <div className={styles.empty}><FaBoxOpen /><span>{text}</span></div>;
export default Dashboard;