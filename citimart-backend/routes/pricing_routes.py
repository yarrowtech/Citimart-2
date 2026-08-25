# routes/pricing_routes.py
# Vendor Price Advisor — suggests price adjustments from real demand signals
# (order count, cart adds, wishlist adds, stock on hand). Deliberately a
# transparent scoring formula, not a trained model: with only a few dozen
# orders across the catalog, a trained regressor would fit noise, not signal.
# Advisory only — nothing here writes a price. The vendor applies (or
# ignores) each suggestion explicitly via the existing edit-product flow.
from flask import Blueprint, jsonify

from database import products_collection, orders_collection, cart_collection, wishlist_collection
from utils.auth_utils import token_required

pricing_bp = Blueprint("pricing_bp", __name__)

ORDER_WEIGHT = 3
CART_WEIGHT = 2
WISHLIST_WEIGHT = 1
MAX_ADJUSTMENT_PCT = 15


def _safe_float(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _total_stock(product):
    return sum(int(v.get("stock") or 0) for v in (product.get("variants") or []))


def _suggest(price, stock, order_count, cart_count, wishlist_count):
    demand_signal = order_count * ORDER_WEIGHT + cart_count * CART_WEIGHT + wishlist_count * WISHLIST_WEIGHT

    if demand_signal == 0:
        return {
            "suggestion": "insufficient_data",
            "suggested_price": None,
            "adjustment_pct": 0,
            "reason": "No orders, cart adds, or wishlist activity recorded yet for this product.",
        }

    ratio = demand_signal / max(stock, 1)

    if ratio > 2:
        adjustment_pct = MAX_ADJUSTMENT_PCT
        reason = f"High demand ({order_count} orders, {cart_count} in carts, {wishlist_count} wishlisted) against low stock ({stock} left)."
    elif ratio > 1:
        adjustment_pct = 5
        reason = f"Demand is outpacing stock on hand ({stock} left)."
    elif ratio > 0.3:
        adjustment_pct = 0
        reason = "Demand and stock levels are roughly balanced."
    else:
        adjustment_pct = -10
        reason = f"Low demand relative to stock on hand ({stock} units) — a discount could help move inventory."

    suggested_price = round(price * (1 + adjustment_pct / 100), 2) if price else None

    return {
        "suggestion": "increase" if adjustment_pct > 0 else "decrease" if adjustment_pct < 0 else "hold",
        "suggested_price": suggested_price,
        "adjustment_pct": adjustment_pct,
        "reason": reason,
    }


@pricing_bp.route("/vendor/pricing-suggestions", methods=["GET"])
@token_required
def get_pricing_suggestions(current_vendor):
    if current_vendor.get("role") != "vendor":
        return jsonify({"error": "Vendor access only"}), 403

    vendor_id = str(current_vendor["_id"])
    products = list(products_collection.find(
        {"vendor_id": vendor_id, "status": {"$in": ["active", "approved"]}}
    ))

    results = []
    for p in products:
        pid = str(p["_id"])
        price = _safe_float(p.get("price"))
        stock = _total_stock(p)

        order_count = orders_collection.count_documents({"order_items.product_id": pid})
        cart_count = cart_collection.count_documents({"items.product_id": pid})
        wishlist_count = wishlist_collection.count_documents({"items.product_id": pid})

        verdict = _suggest(price, stock, order_count, cart_count, wishlist_count)

        results.append({
            "product_id": pid,
            "name": p.get("name"),
            "current_price": price,
            "stock": stock,
            "order_count": order_count,
            "cart_count": cart_count,
            "wishlist_count": wishlist_count,
            **verdict,
        })

    return jsonify({"suggestions": results}), 200
