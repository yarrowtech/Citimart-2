import React, { useState, useEffect, useCallback } from "react";
import { API_BASE } from "../../config";
import s from "../subuser/SubuserShared.module.css";

const suggestionBadge = (suggestion) => {
  if (suggestion === "increase") return `${s.badge} ${s.badgeGreen}`;
  if (suggestion === "decrease") return `${s.badge} ${s.badgeAmber}`;
  if (suggestion === "hold") return `${s.badge} ${s.badgeBlue}`;
  return `${s.badge} ${s.badgeGray}`;
};

const suggestionLabel = (suggestion) => {
  if (suggestion === "increase") return "Raise price";
  if (suggestion === "decrease") return "Lower price";
  if (suggestion === "hold") return "Hold steady";
  return "Not enough data";
};

const PricingAdvisor = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/vendor/pricing-suggestions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load pricing suggestions");
      setSuggestions(data.suggestions || []);
    } catch (err) {
      setError(err.message || "Failed to load pricing suggestions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSuggestions(); }, [fetchSuggestions]);

  return (
    <div className={s.panel}>
      <div className={s.panelHeader}>
        <div>
          <h2 className={s.panelTitle}>Pricing Advisor</h2>
          <p className={s.panelSubtitle}>
            Suggested price moves based on real order, cart, and wishlist activity
            against your current stock — advisory only, nothing changes automatically.
          </p>
        </div>
      </div>

      {error && <div className={s.errorState}>{error}</div>}

      {loading ? (
        <div className={s.loadingState}>Analyzing demand…</div>
      ) : suggestions.length === 0 ? (
        <div className={s.emptyState}>
          <span className={s.emptyIcon}>📈</span>
          No approved products to analyze yet.
        </div>
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Current Price</th>
                <th>Stock</th>
                <th>Orders</th>
                <th>In Carts</th>
                <th>Wishlisted</th>
                <th>Suggestion</th>
                <th>Why</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.map((row) => (
                <tr key={row.product_id}>
                  <td>{row.name}</td>
                  <td>₹{row.current_price}</td>
                  <td>{row.stock}</td>
                  <td>{row.order_count}</td>
                  <td>{row.cart_count}</td>
                  <td>{row.wishlist_count}</td>
                  <td>
                    <span className={suggestionBadge(row.suggestion)}>
                      {suggestionLabel(row.suggestion)}
                    </span>
                    {row.suggested_price != null && (
                      <div style={{ marginTop: 4, fontSize: 12.5, fontWeight: 700 }}>
                        ₹{row.current_price} → ₹{row.suggested_price}
                        {" "}({row.adjustment_pct > 0 ? "+" : ""}{row.adjustment_pct}%)
                      </div>
                    )}
                  </td>
                  <td style={{ maxWidth: 280, fontSize: 12.5, color: "#6b7280" }}>{row.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PricingAdvisor;
