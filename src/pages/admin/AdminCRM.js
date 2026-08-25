import React, { useState, useEffect, useCallback, useMemo } from "react";
import { API_BASE } from "../../config";
import s from "../subuser/SubuserShared.module.css";

const segmentBadge = (segment) => {
  if (segment === "vip" || segment === "loyal") return `${s.badge} ${s.badgeGreen}`;
  if (segment === "new") return `${s.badge} ${s.badgeBlue}`;
  return `${s.badge} ${s.badgeGray}`;
};

const orderStatusBadge = (status) => {
  const norm = (status || "").trim().toLowerCase();
  if (norm === "delivered" || norm === "paid") return `${s.badge} ${s.badgeGreen}`;
  if (norm === "cancelled" || norm === "rejected") return `${s.badge} ${s.badgeRed}`;
  if (norm === "shipped") return `${s.badge} ${s.badgeBlue}`;
  return `${s.badge} ${s.badgeAmber}`;
};

const complaintStatusBadge = (status) => {
  if (status === "Resolved") return `${s.badge} ${s.badgeGreen}`;
  if (status === "Rejected") return `${s.badge} ${s.badgeRed}`;
  return `${s.badge} ${s.badgeAmber}`;
};

const AdminCRM = () => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedId, setSelectedId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${localStorage.getItem("adminToken")}` }),
    []
  );

  const fetchCustomers = useCallback(async (searchTerm) => {
    setLoading(true);
    setError("");
    try {
      const qs = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : "";
      const res = await fetch(`${API_BASE}/admin/crm/customers${qs}`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load customers");
      setCustomers(data.customers || []);
    } catch (err) {
      setError(err.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => {
    const t = setTimeout(() => fetchCustomers(search), 300);
    return () => clearTimeout(t);
  }, [search, fetchCustomers]);

  const openProfile = async (id) => {
    setSelectedId(id);
    setProfile(null);
    setProfileLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/crm/customers/${id}`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load profile");
      setProfile(data);
    } catch (err) {
      setError(err.message || "Failed to load customer profile");
    } finally {
      setProfileLoading(false);
    }
  };

  const backToList = () => {
    setSelectedId(null);
    setProfile(null);
  };

  if (selectedId) {
    return (
      <div className={s.panel}>
        <div className={s.panelHeader}>
          <div>
            <button className={s.btnSecondary} onClick={backToList}>← Back to Customers</button>
          </div>
        </div>

        {profileLoading || !profile ? (
          <div className={s.loadingState}>Loading customer profile…</div>
        ) : (
          <>
            <div className={s.card}>
              <h2 className={s.panelTitle}>{profile.profile.name}</h2>
              <p className={s.panelSubtitle}>{profile.profile.email}</p>
              <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span className={segmentBadge(profile.profile.segment)}>
                  Segment: {profile.profile.segment}
                </span>
                {profile.profile.segment_request && (
                  <span className={`${s.badge} ${s.badgeAmber}`}>
                    Requested: {profile.profile.segment_request.requested_segment} (
                    {profile.profile.segment_request.status})
                  </span>
                )}
                <span className={`${s.badge} ${s.badgeGray}`}>
                  Joined {new Date(profile.profile.joined).toLocaleDateString()}
                </span>
                <span className={`${s.badge} ${s.badgeGray}`}>
                  {profile.profile.login_count} logins
                  {profile.profile.last_login
                    ? ` · last ${new Date(profile.profile.last_login).toLocaleDateString()}`
                    : ""}
                </span>
              </div>
            </div>

            <div className={s.statGrid}>
              <div className={s.statCard}>
                <div className={s.statValue}>{profile.order_count}</div>
                <div className={s.statLabel}>Orders</div>
              </div>
              <div className={s.statCard}>
                <div className={s.statValue}>₹{profile.lifetime_spent.toLocaleString()}</div>
                <div className={s.statLabel}>Lifetime Spent</div>
              </div>
              <div className={s.statCard}>
                <div className={s.statValue}>{profile.cart_item_count}</div>
                <div className={s.statLabel}>Items in Cart</div>
              </div>
              <div className={s.statCard}>
                <div className={s.statValue}>{profile.wishlist_item_count}</div>
                <div className={s.statLabel}>Wishlisted</div>
              </div>
            </div>

            <div>
              <h3 className={s.panelTitle} style={{ fontSize: 16 }}>Order History</h3>
              {profile.orders.length === 0 ? (
                <div className={s.emptyState}>
                  <span className={s.emptyIcon}>📦</span>
                  No orders placed yet.
                </div>
              ) : (
                <div className={s.tableWrap}>
                  <table className={s.table}>
                    <thead>
                      <tr>
                        <th>Order ID</th><th>Items</th><th>Amount</th><th>Status</th><th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profile.orders.map((o) => (
                        <tr key={o._id}>
                          <td>{o._id}</td>
                          <td>{o.item_count}</td>
                          <td>₹{o.final_amount}</td>
                          <td><span className={orderStatusBadge(o.status)}>{o.status}</span></td>
                          <td>{o.created_at ? new Date(o.created_at).toLocaleDateString() : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <h3 className={s.panelTitle} style={{ fontSize: 16 }}>Complaints & Tickets</h3>
              {profile.complaints.length === 0 ? (
                <div className={s.emptyState}>
                  <span className={s.emptyIcon}>💬</span>
                  No complaints filed.
                </div>
              ) : (
                <div className={s.tableWrap}>
                  <table className={s.table}>
                    <thead>
                      <tr>
                        <th>Category</th><th>Description</th><th>Date</th><th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profile.complaints.map((c) => (
                        <tr key={c._id}>
                          <td>{c.category}</td>
                          <td style={{ maxWidth: 320 }}>{c.description}</td>
                          <td>{c.date}</td>
                          <td><span className={complaintStatusBadge(c.status)}>{c.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={s.panel}>
      <div className={s.panelHeader}>
        <div>
          <h2 className={s.panelTitle}>Customer Relationship (CRM)</h2>
          <p className={s.panelSubtitle}>
            One view per customer: profile, order history, spend, and support tickets.
          </p>
        </div>
      </div>

      <div className={s.formGroup} style={{ maxWidth: 340 }}>
        <label>Search by name or email</label>
        <input
          className={s.input}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customers…"
        />
      </div>

      {error && <div className={s.errorState}>{error}</div>}

      {loading ? (
        <div className={s.loadingState}>Loading customers…</div>
      ) : customers.length === 0 ? (
        <div className={s.emptyState}>
          <span className={s.emptyIcon}>🧑‍🤝‍🧑</span>
          No customers found.
        </div>
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Segment</th><th>Orders</th><th></th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c._id}>
                  <td>{c.name}</td>
                  <td>{c.email}</td>
                  <td><span className={segmentBadge(c.segment)}>{c.segment}</span></td>
                  <td>{c.order_count}</td>
                  <td>
                    <button className={s.btnSecondary} onClick={() => openProfile(c._id)}>
                      View Profile
                    </button>
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

export default AdminCRM;
