from datetime import datetime
from bson import ObjectId


def _variant_stock(variant):
    """Variant stock is sometimes a plain int, sometimes legacy Mongo extended
    JSON ({"$numberInt": "5"}) left over from an old import — normalize both."""
    raw = variant.get("stock", 0)
    try:
        return int(raw.get("$numberInt", 0)) if isinstance(raw, dict) else int(raw)
    except (TypeError, ValueError):
        return 0


def validate_order_feasibility(*, raw_items, products_collection, pincode=None):
    """Real pre-order checks, run right before an order is created (and again
    right before a Razorpay payment is finalized, in case stock changed in
    between): can every line item actually be fulfilled, and is the delivery
    pincode one we serve? Returns a list of human-readable issue dicts —
    empty means the order can proceed. Never raises; a lookup failure here
    must not be the reason an order silently goes through unchecked, so
    callers should treat a thrown error as "block the order", not ignore it.
    """
    issues = []

    for raw in raw_items or []:
        try:
            product = products_collection.find_one({"_id": ObjectId(raw.get("product_id"))})
        except Exception:
            product = None
        if not product:
            issues.append({"type": "unavailable", "message": "One of the items in your cart is no longer available."})
            continue

        variants = product.get("variants") or []
        if not variants:
            continue  # Stock isn't tracked per-unit for this product — nothing to check.

        requested_size = (raw.get("size") or "N/A").upper()
        requested_color = raw.get("color") or "N/A"
        requested_qty = int(raw.get("quantity") or 1)

        matched = None
        for variant in variants:
            v_size = (variant.get("size") or "").upper()
            v_color = variant.get("color", "")
            size_ok = v_size == requested_size or requested_size in ("", "N/A")
            color_ok = v_color == requested_color or requested_color in ("", "N/A")
            if size_ok and color_ok:
                matched = variant
                break

        if matched is None:
            continue  # No matching variant row — same as the existing stock-reduction logic, silently skip.

        available = _variant_stock(matched)
        if available < requested_qty:
            label = product.get("name", "This item")
            detail_bits = [b for b in [requested_size if requested_size != "N/A" else None,
                                       requested_color if requested_color != "N/A" else None] if b]
            detail = f" ({', '.join(detail_bits)})" if detail_bits else ""
            issues.append({
                "type": "out_of_stock",
                "product_id": str(product["_id"]),
                "message": (
                    f"{label}{detail} is out of stock." if available == 0
                    else f"Only {available} left of {label}{detail} — you asked for {requested_qty}."
                ),
            })

    from routes.delivery_routes import SERVICEABLE_PREFIXES
    clean = str(pincode or "").strip()
    if not (clean.isdigit() and len(clean) == 6 and clean[0] != "0"):
        issues.append({"type": "bad_pincode", "message": "Enter a valid 6-digit delivery pincode."})
    elif clean[:3] not in SERVICEABLE_PREFIXES:
        issues.append({"type": "not_deliverable", "message": f"Sorry, we don't deliver to {clean} yet."})

    return issues


def _number(value, default=0):
    try:
        return float(value if value not in (None, "") else default)
    except (TypeError, ValueError):
        return float(default)


def _eligible(offer, customer):
    target = offer.get("eligible_users", "all")
    if target == "all":
        return True
    if not customer:
        return False
    if target == "personalized":
        return customer.get("email") in (offer.get("personalized_for") or [])
    return customer.get("segment", "all") == target


def _offer_product_ids(offer):
    return {str(value) for value in (offer.get("products") or [])}


def _discount_for_offer(offer, items, subtotal):
    product_ids = _offer_product_ids(offer)
    eligible_items = [item for item in items if not product_ids or str(item["product_id"]) in product_ids]
    eligible_subtotal = sum(item["price"] * item["quantity"] for item in eligible_items)
    if subtotal < _number(offer.get("min_purchase")) or eligible_subtotal <= 0:
        return 0

    offer_type = offer.get("type", "percent")
    value = _number(offer.get("discount"))
    if offer_type == "free_shipping":
        return 0
    if offer_type == "bogo":
        discount = sum((item["quantity"] // 2) * item["price"] for item in eligible_items)
    elif offer_type == "flat":
        discount = min(value, eligible_subtotal)
    else:
        # Existing popup/deal/predefined/personalized offers remain percentage offers.
        discount = eligible_subtotal * value / 100

    max_discount = _number(offer.get("max_discount"))
    if max_discount > 0:
        discount = min(discount, max_discount)
    return round(max(0, discount), 2)


def calculate_quote(*, raw_items, products_collection, offers_collection, customer=None,
                    coupon_code=None, is_gift=False):
    items = []
    for raw in raw_items or []:
        product_id = str(raw.get("product_id") or "")
        try:
            product = products_collection.find_one({"_id": ObjectId(product_id)})
        except Exception:
            product = None
        if not product:
            continue
        items.append({
            "product_id": product_id,
            "product": product,
            "price": _number(product.get("price")),
            "quantity": max(1, int(raw.get("quantity", 1))),
            "size": raw.get("size") or "N/A",
            "color": raw.get("color") or "N/A",
            "isGift": bool(raw.get("isGift", raw.get("gift_option", False))),
            "giftMessage": raw.get("giftMessage", raw.get("gift_message", "")),
        })

    subtotal = round(sum(item["price"] * item["quantity"] for item in items), 2)
    now = datetime.utcnow()
    offers = list(offers_collection.find({
        "status": "active",
        "start_date": {"$lte": now},
        "end_date": {"$gte": now},
    }))
    eligible = [offer for offer in offers if _eligible(offer, customer)]

    automatic = []
    coupon_matches = []
    shipping = []
    normalized_coupon = (coupon_code or "").strip().upper()
    for offer in eligible:
        if subtotal < _number(offer.get("min_purchase")):
            continue
        if offer.get("type") == "free_shipping":
            if offer.get("apply_mode", "automatic") == "automatic" or offer.get("code", "").upper() == normalized_coupon:
                shipping.append(offer)
            continue
        candidate = (offer, _discount_for_offer(offer, items, subtotal))
        if candidate[1] <= 0:
            continue
        if normalized_coupon and offer.get("code", "").upper() == normalized_coupon:
            coupon_matches.append(candidate)
        elif offer.get("apply_mode", "automatic") == "automatic":
            automatic.append(candidate)

    best_auto = max(automatic, key=lambda value: (value[1], _number(value[0].get("priority"))), default=None)
    best_coupon = max(coupon_matches, key=lambda value: (value[1], _number(value[0].get("priority"))), default=None)
    best = max([value for value in (best_auto, best_coupon) if value], key=lambda value: value[1], default=None)

    discount = best[1] if best else 0
    applied = []
    if best:
        applied.append({"id": str(best[0]["_id"]), "title": best[0].get("title"), "discount": discount, "type": best[0].get("type")})

    discounted_total = max(0, subtotal - discount)
    delivery_fee = 0 if discounted_total > 500 or shipping else 50
    if shipping:
        selected_shipping = max(shipping, key=lambda offer: _number(offer.get("priority")))
        applied.append({"id": str(selected_shipping["_id"]), "title": selected_shipping.get("title"), "discount": delivery_fee, "type": "free_shipping"})
        delivery_fee = 0
    gift_wrap_fee = 50 if is_gift or any(item["isGift"] or item["giftMessage"] for item in items) else 0
    final_total = round(discounted_total + delivery_fee + gift_wrap_fee, 2)

    return {
        "items": items,
        "subtotal": subtotal,
        "discount": round(discount, 2),
        "delivery_fee": delivery_fee,
        "gift_wrap_fee": gift_wrap_fee,
        "final_total": final_total,
        "applied_offers": applied,
        "eligible_offers": [{
            "id": str(offer["_id"]), "title": offer.get("title"), "code": offer.get("code", ""),
            "type": offer.get("type"), "apply_mode": offer.get("apply_mode", "automatic"),
            "eligible_users": offer.get("eligible_users", "all"),
        } for offer in eligible],
    }