# routes/finance_routes.py
# Real commission engine + payout ledger + admin finance dashboard.
#
# A payout ledger entry is created once per vendor per order, the moment an
# order's status is set to "delivered" (see the hook in admin_routes.py and
# vendor_routes.py update_order handlers) — mirrors how real marketplaces
# defer commission recognition to after fulfillment, not at payment time.
# Idempotent: re-marking an order "delivered" never double-counts it.
from datetime import datetime

from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, request, jsonify

from database import (
    orders_collection, payouts_collection, expenses_collection,
    platform_settings_collection, vendors_collection,
)
from utils.auth_utils import admin_token_required, token_required

finance_bp = Blueprint("finance_bp", __name__)

DEFAULT_COMMISSION_RATE = 10.0  # percent, used only if no platform setting exists yet
_SETTINGS_DOC_ID = "platform"


def get_commission_rate():
    doc = platform_settings_collection.find_one({"_id": _SETTINGS_DOC_ID})
    try:
        return float(doc.get("commissionRate")) if doc and doc.get("commissionRate") is not None else DEFAULT_COMMISSION_RATE
    except (TypeError, ValueError):
        return DEFAULT_COMMISSION_RATE


def settle_order_commission(order_id):
    """Best-effort — a ledger bug must never break order fulfillment, so
    this never raises out to the caller."""
    try:
        if payouts_collection.count_documents({"order_id": order_id}) > 0:
            return  # already settled for this order

        order = orders_collection.find_one({"_id": ObjectId(order_id)})
        if not order:
            return

        from routes.subscription_routes import get_vendor_commission_rate

        by_vendor = {}
        for item in order.get("order_items") or []:
            vendor_id = item.get("vendor_id")  # None for admin-added products
            line_total = float(item.get("price") or 0) * int(item.get("quantity") or 1)
            by_vendor[vendor_id] = by_vendor.get(vendor_id, 0) + line_total

        now = datetime.utcnow()
        entries = []
        for vendor_id, gross in by_vendor.items():
            # Each vendor's own subscription tier decides their rate — a
            # Pro/Premium vendor keeps more of their own sale than the
            # platform default, which still applies to admin-sold items.
            rate = get_vendor_commission_rate(vendor_id) if vendor_id else get_commission_rate()
            commission_amount = round(gross * rate / 100, 2)
            net_payout = round(gross - commission_amount, 2) if vendor_id else 0.0
            entries.append({
                "order_id": order_id,
                "vendor_id": vendor_id,
                "gross_amount": round(gross, 2),
                "commission_rate": rate,
                "commission_amount": commission_amount,
                "net_payout": net_payout,
                # Admin-sold items (no vendor) have nothing to pay out.
                "status": "pending" if vendor_id else "not_applicable",
                "created_at": now,
            })

        if entries:
            payouts_collection.insert_many(entries)
    except Exception:
        pass


# ── Admin finance dashboard ─────────────────────────────────────────────────
@finance_bp.route("/admin/finance/overview", methods=["GET"])
@admin_token_required
def finance_overview(current_admin):
    entries = list(payouts_collection.find({}))
    gross_settled_sales = sum(e.get("gross_amount", 0) for e in entries)
    commission_revenue = sum(e.get("commission_amount", 0) for e in entries)
    pending_payouts = sum(e.get("net_payout", 0) for e in entries if e.get("status") == "pending")
    paid_payouts = sum(e.get("net_payout", 0) for e in entries if e.get("status") == "paid")
    total_expenses = sum(float(x.get("amount") or 0) for x in expenses_collection.find({}))

    return jsonify({
        "commission_rate": get_commission_rate(),
        "gross_settled_sales": round(gross_settled_sales, 2),
        "commission_revenue": round(commission_revenue, 2),
        "pending_vendor_payouts": round(pending_payouts, 2),
        "paid_vendor_payouts": round(paid_payouts, 2),
        "total_expenses": round(total_expenses, 2),
        "net_profit": round(commission_revenue - total_expenses, 2),
        "settled_order_count": len({e["order_id"] for e in entries}),
    }), 200


@finance_bp.route("/admin/finance/payouts", methods=["GET"])
@admin_token_required
def list_payouts(current_admin):
    status_filter = request.args.get("status")
    query = {"vendor_id": {"$ne": None}}
    if status_filter:
        query["status"] = status_filter

    docs = list(payouts_collection.find(query).sort("created_at", -1))
    for d in docs:
        d["_id"] = str(d["_id"])
        d["created_at"] = d["created_at"].isoformat() if d.get("created_at") else None
    return jsonify({"payouts": docs}), 200


@finance_bp.route("/admin/finance/payouts/<payout_id>", methods=["PUT"])
@admin_token_required
def update_payout_status(current_admin, payout_id):
    data = request.get_json(silent=True) or {}
    new_status = data.get("status")
    if new_status not in ("pending", "paid"):
        return jsonify({"error": "status must be 'pending' or 'paid'"}), 400

    try:
        oid = ObjectId(payout_id)
    except InvalidId:
        return jsonify({"error": "Invalid payout ID"}), 400

    payout = payouts_collection.find_one({"_id": oid})
    if not payout:
        return jsonify({"error": "Payout not found"}), 404

    # Option B: vendor can sell before verification, but earnings stay
    # held until their business (PAN/GST) documents are verified.
    if new_status == "paid" and payout.get("vendor_id"):
        vendor = vendors_collection.find_one({"_id": ObjectId(payout["vendor_id"])})
        if not vendor or vendor.get("kybStatus") != "verified":
            return jsonify({
                "error": "This vendor's business verification (KYB) is not yet complete — payout is held until it's verified."
            }), 400

    payouts_collection.update_one({"_id": oid}, {"$set": {"status": new_status}})
    return jsonify({"message": "Payout updated"}), 200


# ── Expenses (real ledger — no more empty/unused collection) ────────────────
@finance_bp.route("/admin/finance/expenses", methods=["GET"])
@admin_token_required
def list_expenses(current_admin):
    docs = list(expenses_collection.find({}).sort("created_at", -1))
    for d in docs:
        d["_id"] = str(d["_id"])
        d["created_at"] = d["created_at"].isoformat() if d.get("created_at") else None
    return jsonify({"expenses": docs}), 200


@finance_bp.route("/admin/finance/expenses", methods=["POST"])
@admin_token_required
def add_expense(current_admin):
    data = request.get_json(silent=True) or {}
    label = (data.get("label") or "").strip()
    amount = data.get("amount")

    if not label or amount is None:
        return jsonify({"error": "label and amount are required"}), 400
    try:
        amount = float(amount)
    except (TypeError, ValueError):
        return jsonify({"error": "amount must be a number"}), 400

    doc = {
        "label": label,
        "amount": amount,
        "category": data.get("category") or "other",
        "date": data.get("date") or datetime.utcnow().strftime("%Y-%m-%d"),
        "created_at": datetime.utcnow(),
    }
    result = expenses_collection.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    doc["created_at"] = doc["created_at"].isoformat()
    return jsonify({"expense": doc}), 201


@finance_bp.route("/admin/finance/expenses/<expense_id>", methods=["DELETE"])
@admin_token_required
def delete_expense(current_admin, expense_id):
    try:
        oid = ObjectId(expense_id)
    except InvalidId:
        return jsonify({"error": "Invalid expense ID"}), 400

    result = expenses_collection.delete_one({"_id": oid})
    if result.deleted_count == 0:
        return jsonify({"error": "Expense not found"}), 404
    return jsonify({"message": "Expense deleted"}), 200


# ── Vendor-facing payout ledger (real, replaces the hardcoded sample rows
#    shown in the vendor analytics dashboard) ────────────────────────────────
@finance_bp.route("/vendor/payouts", methods=["GET"])
@token_required
def vendor_payouts(current_vendor):
    if current_vendor.get("role") != "vendor":
        return jsonify({"error": "Vendor access only"}), 403

    vendor_id = str(current_vendor["_id"])
    docs = list(payouts_collection.find({"vendor_id": vendor_id}).sort("created_at", -1))
    total_pending = sum(d.get("net_payout", 0) for d in docs if d.get("status") == "pending")
    total_paid = sum(d.get("net_payout", 0) for d in docs if d.get("status") == "paid")

    for d in docs:
        d["_id"] = str(d["_id"])
        d["created_at"] = d["created_at"].isoformat() if d.get("created_at") else None

    return jsonify({
        "payouts": docs,
        "total_pending": round(total_pending, 2),
        "total_paid": round(total_paid, 2),
    }), 200
