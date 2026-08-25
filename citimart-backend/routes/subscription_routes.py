# routes/subscription_routes.py
# Vendor subscription tiers: Standard (free) / Pro / Premium — each tier
# buys a lower commission rate. Real Razorpay payment (same
# create-order + verify-signature pattern as customer checkout in
# customer_routes.py), a real 30-day expiry, and a real per-vendor rate
# read by finance_routes.py at settlement time — no dummy data.
import hashlib
import hmac
import os
from datetime import datetime, timedelta

import razorpay
from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, request, jsonify

from database import vendors_collection, platform_settings_collection
from utils.auth_utils import token_required, admin_token_required

subscription_bp = Blueprint("subscription_bp", __name__)

_SETTINGS_DOC_ID = "platform"
RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET")

PAID_TIERS = ("pro", "premium")


def get_tier_catalog():
    doc = platform_settings_collection.find_one({"_id": _SETTINGS_DOC_ID}) or {}
    return {
        "standard": {"rate": float(doc.get("commissionRate", 15.0)), "fee": 0.0},
        "pro": {"rate": float(doc.get("proCommissionRate", 10.0)), "fee": float(doc.get("proSubscriptionFee", 999.0))},
        "premium": {"rate": float(doc.get("premiumCommissionRate", 5.0)), "fee": float(doc.get("premiumSubscriptionFee", 2499.0))},
    }


def _active_tier(vendor):
    """A vendor's real, currently-in-effect tier — expired subscriptions
    silently fall back to Standard rather than needing a cron job to
    downgrade them."""
    tier = vendor.get("subscriptionTier", "standard")
    expires_at = vendor.get("subscriptionExpiresAt")
    if tier in PAID_TIERS and expires_at and expires_at > datetime.utcnow():
        return tier
    return "standard"


def get_vendor_commission_rate(vendor_id):
    """Called from finance_routes.py at order-settlement time."""
    try:
        vendor = vendors_collection.find_one({"_id": ObjectId(vendor_id)})
    except InvalidId:
        vendor = None
    catalog = get_tier_catalog()
    if not vendor:
        return catalog["standard"]["rate"]
    return catalog[_active_tier(vendor)]["rate"]


@subscription_bp.route("/vendor/subscription", methods=["GET"])
@token_required
def get_subscription(current_vendor):
    if current_vendor.get("role") != "vendor":
        return jsonify({"error": "Vendor access only"}), 403

    vendor = vendors_collection.find_one({"_id": ObjectId(current_vendor["_id"])})
    tier = _active_tier(vendor)
    expires_at = vendor.get("subscriptionExpiresAt")

    return jsonify({
        "current_tier": tier,
        "expires_at": expires_at.isoformat() if expires_at and tier != "standard" else None,
        "catalog": get_tier_catalog(),
    }), 200


@subscription_bp.route("/vendor/subscription/checkout", methods=["POST"])
@token_required
def create_subscription_order(current_vendor):
    if current_vendor.get("role") != "vendor":
        return jsonify({"error": "Vendor access only"}), 403
    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        return jsonify({"error": "Payments are not configured"}), 500

    data = request.get_json(silent=True) or {}
    tier = data.get("tier")
    catalog = get_tier_catalog()
    if tier not in PAID_TIERS:
        return jsonify({"error": "tier must be 'pro' or 'premium'"}), 400

    amount_paise = int(round(catalog[tier]["fee"] * 100))
    if amount_paise <= 0:
        return jsonify({"error": "Invalid subscription fee"}), 500

    client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
    try:
        order = client.order.create({
            "amount": amount_paise,
            "currency": "INR",
            "receipt": f"sub_{tier}_{current_vendor['_id']}",
            "payment_capture": 1,
        })
    except Exception:
        return jsonify({"error": "Failed to create payment order"}), 500

    return jsonify({
        "id": order["id"],
        "amount": order["amount"],
        "currency": order["currency"],
        "key": RAZORPAY_KEY_ID,
        "tier": tier,
    }), 200


@subscription_bp.route("/vendor/subscription/verify", methods=["POST"])
@token_required
def verify_subscription_payment(current_vendor):
    if current_vendor.get("role") != "vendor":
        return jsonify({"error": "Vendor access only"}), 403
    if not RAZORPAY_KEY_SECRET:
        return jsonify({"error": "Payments are not configured"}), 500

    data = request.get_json(silent=True) or {}
    tier = data.get("tier")
    order_id = data.get("razorpay_order_id")
    payment_id = data.get("razorpay_payment_id")
    signature = data.get("razorpay_signature")

    if tier not in PAID_TIERS or not (order_id and payment_id and signature):
        return jsonify({"error": "Missing payment details"}), 400

    body = f"{order_id}|{payment_id}"
    expected_signature = hmac.new(
        RAZORPAY_KEY_SECRET.encode(), body.encode(), hashlib.sha256
    ).hexdigest()
    if expected_signature != signature:
        return jsonify({"error": "Payment verification failed"}), 400

    new_expiry = datetime.utcnow() + timedelta(days=30)
    vendors_collection.update_one(
        {"_id": ObjectId(current_vendor["_id"])},
        {"$set": {
            "subscriptionTier": tier,
            "subscriptionExpiresAt": new_expiry,
            "subscriptionLastPaymentId": payment_id,
        }}
    )
    return jsonify({"message": f"Subscribed to {tier}", "expires_at": new_expiry.isoformat()}), 200


# ── Admin visibility ─────────────────────────────────────────────────────────
@subscription_bp.route("/admin/finance/vendor-subscriptions", methods=["GET"])
@admin_token_required
def list_vendor_subscriptions(current_admin):
    vendors = list(vendors_collection.find(
        {}, {"fullName": 1, "businessName": 1, "email": 1, "subscriptionTier": 1, "subscriptionExpiresAt": 1}
    ))
    results = []
    for v in vendors:
        expires_at = v.get("subscriptionExpiresAt")
        results.append({
            "_id": str(v["_id"]),
            "name": v.get("businessName") or v.get("fullName"),
            "email": v.get("email"),
            "tier": _active_tier(v),
            "expires_at": expires_at.isoformat() if expires_at else None,
        })
    return jsonify({"vendors": results}), 200
