# routes/analytics_routes.py
# Real site analytics: page views (newly instrumented — see the frontend
# pageview hook), unique visitors, signups over time, guest-lead conversion,
# and vendor/subuser login activity. No live push/websockets — "live
# activity" is recency-based ("last seen on X, 8s ago"), derived from the
# same page-view log, which is honest and buildable; true real-time
# presence would be a separate, bigger piece of infrastructure.
from collections import Counter, defaultdict
from datetime import datetime, timedelta

from flask import Blueprint, request, jsonify

from database import (
    views_collection, users_collection, vendors_collection,
    subusers_collection, guest_leads_collection, orders_collection,
)
from utils.auth_utils import admin_token_required, verify_token

analytics_bp = Blueprint("analytics_bp", __name__)


def _identify_viewer():
    """Best-effort: if a valid token was sent, attach who it is. Guests
    (and any failure here) just stay anonymous — never blocks the log."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None, None
    data = verify_token(auth.split(" ", 1)[1])
    if not data:
        return None, None
    user_id = data.get("user_id") or data.get("sub")
    role = data.get("role")
    return user_id, role


@analytics_bp.route("/analytics/pageview", methods=["POST"])
def log_pageview():
    # Fire-and-forget from the frontend on every route change — must never
    # error out in a way that could surface to a real visitor.
    try:
        data = request.get_json(silent=True) or {}
        path = (data.get("path") or "").strip()
        visitor_id = (data.get("visitorId") or "").strip()
        if not path or not visitor_id:
            return jsonify({"ok": False}), 200

        user_id, role = _identify_viewer()
        views_collection.insert_one({
            "path": path[:300],
            "visitorId": visitor_id[:100],
            "userId": user_id,
            "role": role or "guest",
            "timestamp": datetime.utcnow(),
        })
        return jsonify({"ok": True}), 200
    except Exception:
        return jsonify({"ok": False}), 200


@analytics_bp.route("/admin/analytics/overview", methods=["GET"])
@admin_token_required
def analytics_overview(current_admin):
    days = min(int(request.args.get("days", 7)), 90)
    cutoff = datetime.utcnow() - timedelta(days=days)

    views = list(views_collection.find({"timestamp": {"$gte": cutoff}}))
    unique_visitors = len({v["visitorId"] for v in views})
    total_pageviews = len(views)

    page_counts = Counter(v["path"] for v in views)
    top_pages = [{"path": p, "views": c} for p, c in page_counts.most_common(10)]

    # Signups per day — derived from each account's ObjectId creation time,
    # since not every account doc has a consistent createdAt field.
    signups_by_day = defaultdict(lambda: {"customers": 0, "vendors": 0})
    for u in users_collection.find({"role": "customer"}, {"_id": 1}):
        created = u["_id"].generation_time.replace(tzinfo=None)
        if created >= cutoff:
            signups_by_day[created.strftime("%Y-%m-%d")]["customers"] += 1
    for v in vendors_collection.find({}, {"_id": 1}):
        created = v["_id"].generation_time.replace(tzinfo=None)
        if created >= cutoff:
            signups_by_day[created.strftime("%Y-%m-%d")]["vendors"] += 1
    signup_trend = [
        {"date": d, "customers": c["customers"], "vendors": c["vendors"]}
        for d, c in sorted(signups_by_day.items())
    ]

    guest_leads_total = guest_leads_collection.count_documents({})
    guest_leads_converted = guest_leads_collection.count_documents({"converted": True})

    orders_in_window = orders_collection.count_documents({"created_at": {"$gte": cutoff}})
    vendor_login_total = sum(v.get("login_count", 0) for v in vendors_collection.find({}, {"login_count": 1}))
    subuser_login_total = sum(s.get("login_count", 0) for s in subusers_collection.find({}, {"login_count": 1}))

    return jsonify({
        "window_days": days,
        "unique_visitors": unique_visitors,
        "total_pageviews": total_pageviews,
        "top_pages": top_pages,
        "signup_trend": signup_trend,
        "guest_leads_total": guest_leads_total,
        "guest_leads_converted": guest_leads_converted,
        "orders_total": orders_in_window,
        "vendor_login_total": vendor_login_total,
        "subuser_login_total": subuser_login_total,
        "total_customers": users_collection.count_documents({"role": "customer"}),
        "total_vendors": vendors_collection.count_documents({}),
        "total_subusers": subusers_collection.count_documents({}),
    }), 200


@analytics_bp.route("/admin/analytics/live", methods=["GET"])
@admin_token_required
def analytics_live(current_admin):
    minutes = min(int(request.args.get("minutes", 5)), 60)
    cutoff = datetime.utcnow() - timedelta(minutes=minutes)

    recent = list(views_collection.find({"timestamp": {"$gte": cutoff}}).sort("timestamp", -1))

    latest_by_visitor = {}
    for v in recent:
        vid = v["visitorId"]
        if vid not in latest_by_visitor:  # already sorted newest-first
            latest_by_visitor[vid] = v

    now = datetime.utcnow()
    live = []
    for vid, v in latest_by_visitor.items():
        label = vid[:8]
        if v.get("userId"):
            if v.get("role") == "vendor":
                vendor = vendors_collection.find_one({"_id": _safe_oid(v["userId"])}, {"businessName": 1, "fullName": 1})
                label = (vendor.get("businessName") or vendor.get("fullName")) if vendor else label
            elif v.get("role") == "customer":
                user = users_collection.find_one({"_id": _safe_oid(v["userId"])}, {"name": 1})
                label = user.get("name") if user else label
        live.append({
            "label": label,
            "role": v.get("role", "guest"),
            "path": v["path"],
            "seconds_ago": int((now - v["timestamp"]).total_seconds()),
        })

    live.sort(key=lambda r: r["seconds_ago"])
    return jsonify({"live": live, "count": len(live)}), 200


def _safe_oid(value):
    from bson import ObjectId
    from bson.errors import InvalidId
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        return None
