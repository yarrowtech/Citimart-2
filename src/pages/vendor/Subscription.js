import React, { useState, useEffect, useCallback } from "react";
import { API_BASE } from "../../config";
import s from "../subuser/SubuserShared.module.css";

const TIER_LABELS = { standard: "Standard", pro: "Pro", premium: "Premium" };

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) return resolve(true);
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const VendorSubscription = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [upgrading, setUpgrading] = useState(null);

  const fetchSubscription = useCallback(async () => {
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/vendor/subscription`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load subscription");
      setData(json);
    } catch (err) {
      setError(err.message || "Failed to load subscription");
    }
  }, []);

  useEffect(() => { fetchSubscription(); }, [fetchSubscription]);

  const upgrade = async (tier) => {
    setUpgrading(tier);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Failed to load payment SDK. Please refresh and try again.");

      const orderRes = await fetch(`${API_BASE}/vendor/subscription/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tier }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || "Failed to start payment");

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Citimart",
        description: `${TIER_LABELS[tier]} vendor subscription — 30 days`,
        order_id: orderData.id,
        handler: async (response) => {
          try {
            const verifyRes = await fetch(`${API_BASE}/vendor/subscription/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                tier,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error || "Payment verification failed");
            alert(`Upgraded to ${TIER_LABELS[tier]}!`);
            await fetchSubscription();
          } catch (err) {
            setError(err.message || "Payment verification failed");
          } finally {
            setUpgrading(null);
          }
        },
        modal: { ondismiss: () => setUpgrading(null) },
        theme: { color: "#6366f1" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(err.message || "Failed to start upgrade");
      setUpgrading(null);
    }
  };

  if (error && !data) return <div className={s.errorState}>{error}</div>;
  if (!data) return <div className={s.loadingState}>Loading subscription…</div>;

  const { catalog, current_tier, expires_at } = data;

  return (
    <div className={s.panel}>
      <div className={s.panelHeader}>
        <div>
          <h2 className={s.panelTitle}>Subscription</h2>
          <p className={s.panelSubtitle}>
            Lower your commission rate by upgrading — you keep a larger share of every sale.
          </p>
        </div>
      </div>

      {error && <div className={s.errorState}>{error}</div>}

      <div className={s.card}>
        <span className={`${s.badge} ${s.badgeGreen}`}>
          Current plan: {TIER_LABELS[current_tier]}
        </span>
        {expires_at && (
          <p style={{ marginTop: 8, fontSize: 13, color: "#6b7280" }}>
            Renews/expires on {new Date(expires_at).toLocaleDateString()}
          </p>
        )}
      </div>

      <div className={s.statGrid}>
        {["standard", "pro", "premium"].map((tier) => {
          const info = catalog[tier];
          const isCurrent = current_tier === tier;
          return (
            <div key={tier} className={s.statCard} style={{ alignItems: "flex-start", gap: 8 }}>
              <div className={s.statLabel}>{TIER_LABELS[tier]}</div>
              <div className={s.statValue}>{info.rate}% commission</div>
              <div style={{ fontSize: 13, color: "#6b7280" }}>
                {info.fee > 0 ? `₹${info.fee}/month` : "Free"}
              </div>
              {isCurrent ? (
                <span className={`${s.badge} ${s.badgeBlue}`}>Current plan</span>
              ) : tier !== "standard" ? (
                <button
                  className={s.btnPrimary}
                  disabled={upgrading === tier}
                  onClick={() => upgrade(tier)}
                >
                  {upgrading === tier ? "Processing…" : `Upgrade to ${TIER_LABELS[tier]}`}
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VendorSubscription;
