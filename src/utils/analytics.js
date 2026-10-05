// src/utils/analytics.js
// Lightweight, fire-and-forget page-view logging. Never blocks rendering,
// never throws — a failed/slow analytics call must not affect the actual
// page. Powers the admin Analytics dashboard (most-viewed pages, unique
// visitors, "last seen" live activity).
import { API_BASE } from "../config";

const VISITOR_KEY = "citimart_visitor_id";

export function getVisitorId() {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = (crypto.randomUUID ? crypto.randomUUID() : `v-${Date.now()}-${Math.random().toString(36).slice(2)}`);
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    // localStorage unavailable (private mode, etc.) — fall back to a
    // per-load id; visitor just won't be recognized across page loads.
    return `v-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

function getAuthToken() {
  try {
    const adminToken = localStorage.getItem("adminToken");
    if (adminToken) return adminToken;

    const subuserToken = localStorage.getItem("subuserToken");
    if (subuserToken) return subuserToken;

    const plainToken = localStorage.getItem("token");
    if (plainToken) return plainToken;

    const customer = JSON.parse(localStorage.getItem("customer") || "null");
    if (customer?.token) return customer.token;
  } catch {
    // ignore malformed storage
  }
  return null;
}

export function trackPageview(path) {
  try {
    const token = getAuthToken();
    fetch(`${API_BASE}/analytics/pageview`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ path, visitorId: getVisitorId() }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // never let analytics break navigation
  }
}

function describeClickTarget(el) {
  const target = el.closest("button, a, [role='tab']");
  if (!target) return null;
  const label = (target.getAttribute("aria-label") || target.innerText || target.textContent || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  if (!label) return null;
  const kind = target.tagName === "A" ? "link" : target.getAttribute("role") === "tab" ? "tab" : "button";
  return { label, kind };
}

export function trackClick(label, kind, path) {
  try {
    const token = getAuthToken();
    fetch(`${API_BASE}/analytics/click`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ label, kind, path, visitorId: getVisitorId() }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // never let analytics break the click
  }
}

export function initClickTracking() {
  if (window.__citimartClickTracking) return;
  window.__citimartClickTracking = true;
  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? describeClickTarget(event.target) : null;
    if (target) trackClick(target.label, target.kind, window.location.pathname);
  }, true);
}
