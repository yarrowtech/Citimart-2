import React, { useState, useEffect, useCallback, useMemo } from "react";
import { API_BASE } from "../../config";
import s from "../subuser/SubuserShared.module.css";

const SUB_TABS = [
  { key: "overview", label: "Overview" },
  { key: "payouts", label: "Vendor Payouts" },
  { key: "expenses", label: "Expenses" },
  { key: "subscriptions", label: "Vendor Subscriptions" },
];

const AdminFinance = () => {
  const [subTab, setSubTab] = useState("overview");
  const headers = useMemo(
    () => ({ Authorization: `Bearer ${localStorage.getItem("adminToken")}` }),
    []
  );

  return (
    <div className={s.panel}>
      <div className={s.panelHeader}>
        <div>
          <h2 className={s.panelTitle}>Finance</h2>
          <p className={s.panelSubtitle}>
            Real commission revenue, vendor payout ledger, and platform expenses.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, borderBottom: "1px solid #f1f2f6", paddingBottom: 10 }}>
        {SUB_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setSubTab(t.key)}
            className={subTab === t.key ? s.btnPrimary : s.btnSecondary}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === "overview" && <OverviewTab headers={headers} />}
      {subTab === "payouts" && <PayoutsTab headers={headers} />}
      {subTab === "expenses" && <ExpensesTab headers={headers} />}
      {subTab === "subscriptions" && <SubscriptionsTab headers={headers} />}
    </div>
  );
};

const tierBadge = (tier) => {
  if (tier === "premium") return `${s.badge} ${s.badgeGreen}`;
  if (tier === "pro") return `${s.badge} ${s.badgeBlue}`;
  return `${s.badge} ${s.badgeGray}`;
};

const SubscriptionsTab = ({ headers }) => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}/admin/finance/vendor-subscriptions`, { headers });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load");
        setVendors(json.vendors || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [headers]);

  if (loading) return <div className={s.loadingState}>Loading vendor subscriptions…</div>;

  return (
    <div className={s.panel}>
      {error && <div className={s.errorState}>{error}</div>}
      {vendors.length === 0 ? (
        <div className={s.emptyState}>
          <span className={s.emptyIcon}>🏷️</span>
          No vendors found.
        </div>
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr><th>Vendor</th><th>Email</th><th>Tier</th><th>Expires</th></tr>
            </thead>
            <tbody>
              {vendors.map((v) => (
                <tr key={v._id}>
                  <td>{v.name || "—"}</td>
                  <td>{v.email}</td>
                  <td><span className={tierBadge(v.tier)}>{v.tier}</span></td>
                  <td>{v.expires_at ? new Date(v.expires_at).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const OverviewTab = ({ headers }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const fetchOverview = useCallback(async () => {
    setError("");
    try {
      const res = await fetch(`${API_BASE}/admin/finance/overview`, { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load");
      setData(json);
    } catch (err) {
      setError(err.message);
    }
  }, [headers]);

  useEffect(() => { fetchOverview(); }, [fetchOverview]);

  if (error) return <div className={s.errorState}>{error}</div>;
  if (!data) return <div className={s.loadingState}>Loading finance overview…</div>;

  return (
    <div className={s.panel}>
      <div className={s.statGrid}>
        <div className={s.statCard}>
          <div className={s.statValue}>₹{data.gross_settled_sales.toLocaleString()}</div>
          <div className={s.statLabel}>Gross Settled Sales</div>
        </div>
        <div className={s.statCard}>
          <div className={s.statValue}>₹{data.commission_revenue.toLocaleString()}</div>
          <div className={s.statLabel}>Commission Revenue ({data.commission_rate}%)</div>
        </div>
        <div className={s.statCard}>
          <div className={s.statValue}>₹{data.total_expenses.toLocaleString()}</div>
          <div className={s.statLabel}>Total Expenses</div>
        </div>
        <div className={s.statCard}>
          <div
            className={s.statValue}
            style={{ color: data.net_profit >= 0 ? "#16a34a" : "#dc2626" }}
          >
            ₹{data.net_profit.toLocaleString()}
          </div>
          <div className={s.statLabel}>Net Profit</div>
        </div>
        <div className={s.statCard}>
          <div className={s.statValue}>₹{data.pending_vendor_payouts.toLocaleString()}</div>
          <div className={s.statLabel}>Pending Vendor Payouts</div>
        </div>
        <div className={s.statCard}>
          <div className={s.statValue}>₹{data.paid_vendor_payouts.toLocaleString()}</div>
          <div className={s.statLabel}>Paid Vendor Payouts</div>
        </div>
        <div className={s.statCard}>
          <div className={s.statValue}>{data.settled_order_count}</div>
          <div className={s.statLabel}>Delivered Orders Settled</div>
        </div>
      </div>
      <p style={{ fontSize: 12.5, color: "#6b7280" }}>
        Commission is calculated once per order, the moment it's marked "delivered" —
        change the rate in Admin Settings → Platform.
      </p>
    </div>
  );
};

const payoutStatusBadge = (status) => {
  if (status === "paid") return `${s.badge} ${s.badgeGreen}`;
  return `${s.badge} ${s.badgeAmber}`;
};

const PayoutsTab = ({ headers }) => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/admin/finance/payouts`, { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load");
      setPayouts(json.payouts || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => { fetchPayouts(); }, [fetchPayouts]);

  const markPaid = async (id) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`${API_BASE}/admin/finance/payouts/${id}`, {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Update failed");
      await fetchPayouts();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <div className={s.loadingState}>Loading payouts…</div>;

  return (
    <div className={s.panel}>
      {error && <div className={s.errorState}>{error}</div>}
      {payouts.length === 0 ? (
        <div className={s.emptyState}>
          <span className={s.emptyIcon}>💰</span>
          No settled payouts yet — entries appear here once orders are marked delivered.
        </div>
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Order ID</th><th>Vendor ID</th><th>Gross</th><th>Commission</th>
                <th>Net Payout</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p._id}>
                  <td>{p.order_id}</td>
                  <td>{p.vendor_id}</td>
                  <td>₹{p.gross_amount}</td>
                  <td>₹{p.commission_amount} ({p.commission_rate}%)</td>
                  <td>₹{p.net_payout}</td>
                  <td><span className={payoutStatusBadge(p.status)}>{p.status}</span></td>
                  <td>
                    {p.status === "pending" && (
                      <button
                        className={s.btnSecondary}
                        disabled={updatingId === p._id}
                        onClick={() => markPaid(p._id)}
                      >
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const ExpensesTab = ({ headers }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ label: "", amount: "", category: "marketing" });
  const [saving, setSaving] = useState(false);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/admin/finance/expenses`, { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load");
      setExpenses(json.expenses || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.label.trim() || !form.amount) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/admin/finance/expenses`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to add expense");
      setForm({ label: "", amount: "", category: "marketing" });
      await fetchExpenses();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/admin/finance/expenses/${id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) throw new Error("Delete failed");
      await fetchExpenses();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={s.panel}>
      {error && <div className={s.errorState}>{error}</div>}

      <form onSubmit={submit} className={s.card}>
        <div className={s.formGrid}>
          <div className={s.formGroup}>
            <label>Label</label>
            <input className={s.input} value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="e.g. Google Ads campaign" />
          </div>
          <div className={s.formGroup}>
            <label>Amount (₹)</label>
            <input className={s.input} type="number" min="0" step="0.01" value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div className={s.formGroup}>
            <label>Category</label>
            <select className={s.select} value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="marketing">Marketing</option>
              <option value="logistics">Logistics</option>
              <option value="refunds">Refunds</option>
              <option value="operations">Operations</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <button className={s.btnPrimary} type="submit" disabled={saving} style={{ marginTop: 12, width: "fit-content" }}>
          {saving ? "Adding…" : "Add Expense"}
        </button>
      </form>

      {loading ? (
        <div className={s.loadingState}>Loading expenses…</div>
      ) : expenses.length === 0 ? (
        <div className={s.emptyState}>
          <span className={s.emptyIcon}>🧾</span>
          No expenses logged yet.
        </div>
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr><th>Label</th><th>Category</th><th>Amount</th><th>Date</th><th></th></tr>
            </thead>
            <tbody>
              {expenses.map((ex) => (
                <tr key={ex._id}>
                  <td>{ex.label}</td>
                  <td><span className={`${s.badge} ${s.badgeGray}`}>{ex.category}</span></td>
                  <td>₹{ex.amount}</td>
                  <td>{ex.date}</td>
                  <td>
                    <button className={s.btnDanger} onClick={() => remove(ex._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminFinance;
