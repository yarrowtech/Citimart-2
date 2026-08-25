# routes/crm_routes.py
# Customer 360 view for admin — aggregates data that already exists across
# users/orders/complaints/carts/wishlists into one per-customer read view.
# Read-only: does not touch segmentation approval, complaint handling, or
# order processing logic, all of which keep working exactly as before.
import re

from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, request, jsonify

from database import (
    users_collection, orders_collection, complaints_collection,
    cart_collection, wishlist_collection,
)
from utils.auth_utils import admin_token_required

crm_bp = Blueprint("crm_bp", __name__, url_prefix="/admin/crm")


@crm_bp.route("/customers", methods=["GET"])
@admin_token_required
def list_customers(current_admin):
    search = (request.args.get("search") or "").strip()
    query = {"role": "customer"}
    if search:
        pattern = re.compile(re.escape(search), re.IGNORECASE)
        query["$or"] = [{"name": pattern}, {"email": pattern}]

    customers = list(users_collection.find(
        query, {"name": 1, "email": 1, "segment": 1}
    ).limit(100))

    results = []
    for c in customers:
        cid = str(c["_id"])
        order_count = orders_collection.count_documents({"customer_id": cid})
        results.append({
            "_id": cid,
            "name": c.get("name"),
            "email": c.get("email"),
            "segment": c.get("segment", "all"),
            "order_count": order_count,
        })

    return jsonify({"customers": results}), 200


@crm_bp.route("/customers/<customer_id>", methods=["GET"])
@admin_token_required
def get_customer_profile(current_admin, customer_id):
    try:
        oid = ObjectId(customer_id)
    except InvalidId:
        return jsonify({"error": "Invalid customer ID"}), 400

    customer = users_collection.find_one({"_id": oid, "role": "customer"})
    if not customer:
        return jsonify({"error": "Customer not found"}), 404

    orders = list(orders_collection.find({"customer_id": customer_id}).sort("created_at", -1))
    order_count = len(orders)
    lifetime_spent = sum(float(o.get("final_amount") or 0) for o in orders)
    order_summaries = []
    for o in orders:
        order_summaries.append({
            "_id": str(o["_id"]),
            "item_count": len(o.get("order_items") or []),
            "final_amount": o.get("final_amount"),
            "status": o.get("status"),
            "created_at": o.get("created_at").isoformat() if o.get("created_at") else None,
        })

    complaints = list(complaints_collection.find({"user_id": oid}).sort("date", -1))
    for cpl in complaints:
        cpl["_id"] = str(cpl["_id"])
        cpl["user_id"] = str(cpl["user_id"])

    cart = cart_collection.find_one({"customer_id": customer_id})
    wishlist = wishlist_collection.find_one({"customer_id": customer_id})

    profile = {
        "_id": str(customer["_id"]),
        "name": customer.get("name"),
        "email": customer.get("email"),
        "segment": customer.get("segment", "all"),
        "segment_request": customer.get("segment_request"),
        "joined": customer["_id"].generation_time.isoformat(),
        "last_login": customer["last_login"].isoformat() if customer.get("last_login") else None,
        "login_count": customer.get("login_count", 0),
    }

    return jsonify({
        "profile": profile,
        "orders": order_summaries,
        "order_count": order_count,
        "lifetime_spent": lifetime_spent,
        "complaints": complaints,
        "cart_item_count": len(cart.get("items") or []) if cart else 0,
        "wishlist_item_count": len(wishlist.get("items") or []) if wishlist else 0,
    }), 200
