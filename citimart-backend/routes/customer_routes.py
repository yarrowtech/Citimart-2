import base64
import cloudinary
import cloudinary.uploader
from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime  
import logging
from utils.auth_utils import token_required
from utils.pricing_utils import calculate_quote
from database import (
    users_collection,
    cart_collection,
    wishlist_collection,
    orders_collection,
    offers_collection,
    products_collection,
    reviews_collection,
    checkout_sessions_collection
)

customer_bp = Blueprint("customer", __name__)

# --------------------- CART ---------------------

def normalize_product_id(pid):
    """Convert product_id (str, dict with $oid, or ObjectId) into ObjectId"""
    if isinstance(pid, dict) and "$oid" in pid:
        return ObjectId(pid["$oid"])
    if isinstance(pid, str) and ObjectId.is_valid(pid):
        return ObjectId(pid)
    if isinstance(pid, ObjectId):
        return pid
    return None


# ======= GET CART =======

@customer_bp.route("/cart/<customer_id>", methods=["GET"])
@token_required
def get_cart(current_user, customer_id):
    if customer_id != str(current_user["_id"]):
        return jsonify({"error": "Unauthorized access"}), 403

    cart = cart_collection.find_one({"customer_id": customer_id})
    if not cart or "items" not in cart:
        return jsonify({"items": []})

    enriched_items = []

    for item in cart["items"]:
        product_id = item.get("product_id")
        if not product_id:
            continue

        product_id_obj = normalize_product_id(product_id)
        if not product_id_obj:
            continue

        product = products_collection.find_one({"_id": product_id_obj})
        if not product:
            continue

        # ===== Variant & Stock logic =====
        variant = None
        variants = product.get("variants", [])
        size_val = (item.get("size") or "").strip().lower()
        color_val = (item.get("color") or "").strip().lower()

        if variants:
            # Match size + color strictly first
            variant = next(
                (v for v in variants
                 if (v.get("size") or "").strip().lower() == size_val
                 and (v.get("color") or "").strip().lower() == color_val),
                None
            )
            # If size is empty, match color only
            if not variant and color_val:
                variant = next(
                    (v for v in variants
                     if (v.get("color") or "").strip().lower() == color_val),
                    None
                )
            # If color is empty, match size only
            if not variant and size_val:
                variant = next(
                    (v for v in variants
                     if (v.get("size") or "").strip().lower() == size_val),
                    None
                )
        # Stock determination
        if variant:
           item_stock = get_stock_value(variant)

        else:
            # fallback: no matching variant → use product stock only
            item_stock = int(product.get("stock", 0))

        # ===== Pairs_with logic =====
        pairs_with_ids = [str(pid) for pid in product.get("pairs_with", [])]
        pairs_with_products = []

        for pid in pairs_with_ids:
            try:
                pid_obj = ObjectId(pid)
                paired_product = products_collection.find_one(
                    {"_id": pid_obj, "status": "active"},
                    {"name": 1, "price": 1, "discount": 1, "images": 1,
                     "category": 1, "subcategory": 1, "sizes": 1, "colors": 1}
                )
                if paired_product:
                    original_price = float(paired_product.get("price", 0))
                    discount = float(paired_product.get("discount", 0))
                    final_price = round(original_price * (1 - discount / 100), 2)
                    pairs_with_products.append({
                        "_id": str(paired_product["_id"]),
                        "name": paired_product["name"],
                        "price": original_price,
                        "discount": discount,
                        "final_price": final_price,
                        "image": paired_product.get("images", [None])[0],
                        "category": paired_product.get("category"),
                        "subcategory": paired_product.get("subcategory"),
                        "sizes": paired_product.get("sizes", []),
                        "colors": paired_product.get("colors", [])
                    })
            except Exception:
                continue

        enriched_items.append({
            "product": {
                "_id": str(product["_id"]),
                "name": product.get("name"),
                "price": product.get("price"),
                "images": product.get("images", []),
                "category": product.get("category"),
                "subcategory": product.get("subcategory"),
                "pairs_with": pairs_with_ids,
                "pairs_with_products": pairs_with_products
            },
            "size": item.get("size"),
            "color": item.get("color"),
            "quantity": item.get("quantity", 1),
            "gift_option": item.get("gift_option", False),
            "gift_message": item.get("gift_message", ""),
            "stock": item_stock
        })

    return jsonify({"items": enriched_items})


'''
# ======= ADD TO CART =======
@customer_bp.route("/cart/add", methods=["POST"])
@token_required
def add_to_cart(current_user):
    data = request.json
    customer_id = data["customer_id"]

    if customer_id != str(current_user["_id"]):
        return jsonify({"error": "Unauthorized access"}), 403

    product_id = data["product_id"]
    size = data.get("size")
    color = data.get("color")        
    quantity = data.get("quantity", 1)
       # 🎁 Gift fields
    gift_option = data.get("gift_option", False)
    gift_message = data.get("gift_message", "")

    existing_cart = cart_collection.find_one({"customer_id": customer_id})
    if not existing_cart:
        cart_collection.insert_one({
            "customer_id": customer_id,
            "items": [{"product_id": product_id, "size": size, "color": color, "quantity": quantity, "gift_option": gift_option,
                "gift_message": gift_message}]
        })
    else:
        items = existing_cart["items"]
        for item in items:
            if item["product_id"] == product_id and item.get("size") == size and item.get("color") == color:
                item["quantity"] += quantity
                item["gift_option"] = gift_option
                item["gift_message"] = gift_message
                break
        else:
            items.append({"product_id": product_id, "size": size, "color": color, "quantity": quantity, "gift_option": gift_option,
                "gift_message": gift_message})
        cart_collection.update_one({"customer_id": customer_id}, {"$set": {"items": items}})

    return jsonify({"message": "Added to cart"})
'''

'''
@customer_bp.route("/cart/add", methods=["POST"])
@token_required
def add_to_cart(current_user):
    data = request.json
    customer_id = data["customer_id"]

    if customer_id != str(current_user["_id"]):
        return jsonify({"error": "Unauthorized access"}), 403

    product_id = data["product_id"]
    size = data.get("size")
    color = data.get("color")
    quantity = int(data.get("quantity", 1))

    # 🎁 Gift fields
    gift_option = data.get("gift_option", False)
    gift_message = data.get("gift_message", "")

    # ✅ Check product & stock
    product = products_collection.find_one({"_id": ObjectId(product_id)})
    if not product:
        return jsonify({"error": "Product not found"}), 404

    matched_variant = None
    if "variants" in product and product["variants"]:
        for v in product["variants"]:
            size_match = (not size) or (v.get("size") == size)
            color_match = (not color) or (v.get("color") == color)
            if size_match and color_match:
                matched_variant = v
                break

    if matched_variant:
        if quantity > matched_variant.get("stock", 0):
            return jsonify({"error": f"Only {matched_variant.get('stock', 0)} left in stock"}), 400

    # ✅ Add to cart collection
    existing_cart = cart_collection.find_one({"customer_id": customer_id})
    if not existing_cart:
        cart_collection.insert_one({
            "customer_id": customer_id,
            "items": [{
                "product_id": product_id,
                "size": size,
                "color": color,
                "quantity": quantity,
                "gift_option": gift_option,
                "gift_message": gift_message
            }]
        })
    else:
        items = existing_cart["items"]
        found = False
        for item in items:
            if item["product_id"] == product_id and item.get("size") == size and item.get("color") == color:
                new_quantity = item["quantity"] + quantity
                if matched_variant and new_quantity > matched_variant.get("stock", 0):
                    return jsonify({"error": f"Only {matched_variant.get('stock', 0)} left in stock"}), 400
                item["quantity"] = new_quantity
                item["gift_option"] = gift_option
                item["gift_message"] = gift_message
                found = True
                break
        if not found:
            items.append({
                "product_id": product_id,
                "size": size,
                "color": color,
                "quantity": quantity,
                "gift_option": gift_option,
                "gift_message": gift_message
            })
        cart_collection.update_one({"customer_id": customer_id}, {"$set": {"items": items}})

    return jsonify({"message": "Added to cart"})
'''

def get_stock_value(variant):
    stock_val = variant.get("stock", 0)
    if isinstance(stock_val, dict):  
        stock_val = int(stock_val.get("$numberInt", 0))
    return int(stock_val)

@customer_bp.route("/cart/add", methods=["POST"])
@token_required
def add_to_cart(current_user):
    data = request.json
    customer_id = data["customer_id"]

    if customer_id != str(current_user["_id"]):
        return jsonify({"error": "Unauthorized access"}), 403

    product_id = data["product_id"]

    # ✅ If product_id comes as {"$oid": "..."} convert it
    if isinstance(product_id, dict) and "$oid" in product_id:
        product_id = product_id["$oid"]

    size = data.get("size")
    color = data.get("color")
    quantity = int(data.get("quantity", 1))

    # 🎁 Gift fields
    gift_option = data.get("gift_option", False)
    gift_message = data.get("gift_message", "")

    # ✅ Check product & stock
    try:
        product = products_collection.find_one({"_id": ObjectId(str(product_id))})
    except Exception as e:
        return jsonify({"error": f"Invalid product_id: {e}"}), 400

    if not product:
        return jsonify({"error": "Product not found"}), 404

    matched_variant = None
    if "variants" in product and product["variants"]:
        for v in product["variants"]:
            size_match = (not size) or (v.get("size") == size)
            color_match = (not color) or (v.get("color") == color)
            if size_match and color_match:
                matched_variant = v
                break

    if matched_variant:
        if quantity > get_stock_value(matched_variant):
            return jsonify({"error": f"Only {get_stock_value(matched_variant)} left in stock"}), 400

    # ✅ Add to cart collection
    existing_cart = cart_collection.find_one({"customer_id": customer_id})
    if not existing_cart:
        cart_collection.insert_one({
            "customer_id": customer_id,
            "items": [{
                "product_id": str(product_id),  
                "size": size,
                "color": color,
                "quantity": quantity,
                "gift_option": gift_option,
                "gift_message": gift_message
            }]
        })
    else:
        items = existing_cart["items"]
        found = False
        for item in items:
            if (
                item["product_id"] == str(product_id) and
                item.get("size") == size and
                item.get("color") == color
            ):
                new_quantity = item["quantity"] + quantity
                if matched_variant and new_quantity > get_stock_value(matched_variant):
                    return jsonify({"error": f"Only {get_stock_value(matched_variant)} left in stock"}), 400
                item["quantity"] = new_quantity
                item["gift_option"] = gift_option
                item["gift_message"] = gift_message
                found = True
                break
        if not found:
            items.append({
                "product_id": str(product_id),  
                "size": size,
                "color": color,
                "quantity": quantity,
                "gift_option": gift_option,
                "gift_message": gift_message
            })
        cart_collection.update_one({"customer_id": customer_id}, {"$set": {"items": items}})

    return jsonify({"message": "Added to cart"})

# ======= CLEAR CART =======
@customer_bp.route("/cart/clear/<customer_id>", methods=["DELETE"])
@token_required
def clear_cart(current_user, customer_id):
    if customer_id != str(current_user["_id"]):
        return jsonify({"error": "Unauthorized access"}), 403

    cart_collection.delete_one({"customer_id": customer_id})
    return jsonify({"message": "Cart cleared"})


# ======= UPDATE QUANTITY =======


@customer_bp.route("/cart/update_quantity", methods=["POST"])
@token_required
def update_cart_quantity(current_user):
    data = request.json
    customer_id = data["customer_id"]

    if customer_id != str(current_user["_id"]):
        return jsonify({"error": "Unauthorized access"}), 403

    product_id = data["product_id"]
    size = data.get("size")
    color = data.get("color")
    new_quantity = int(data.get("quantity", 1))

    if new_quantity < 1:
        return jsonify({"error": "Quantity must be at least 1"}), 400

    # Check product & stock
    product = products_collection.find_one({"_id": ObjectId(product_id)})
    if not product:
        return jsonify({"error": "Product not found"}), 404

    matched_variant = None
    if "variants" in product and product["variants"]:
        for v in product["variants"]:
            size_match = (not size) or (v.get("size") == size)
            color_match = (not color) or (v.get("color") == color)
            if size_match and color_match:
                matched_variant = v
                break

    if matched_variant:
        # Normalize stock in case it's stored as {"$numberInt": "10"}
        stock_val = matched_variant.get("stock", 0)
        if isinstance(stock_val, dict) and "$numberInt" in stock_val:
            stock_val = int(stock_val["$numberInt"])
        else:
            stock_val = int(stock_val)

        if new_quantity > stock_val:
            return jsonify({"error": f"Only {stock_val} left in stock"}), 400

    cart = cart_collection.find_one({"customer_id": customer_id})
    if not cart:
        return jsonify({"error": "Cart not found"}), 404

    updated = False
    for item in cart["items"]:
        if item["product_id"] == product_id and item.get("size") == size and item.get("color") == color:
            item["quantity"] = new_quantity
            updated = True
            break

    if updated:
        cart_collection.update_one({"customer_id": customer_id}, {"$set": {"items": cart["items"]}})
        return jsonify({"message": "Quantity updated"})
    else:
        return jsonify({"error": "Item not found in cart"}), 404
# ======= REMOVE ITEM =======
@customer_bp.route("/cart/remove_item", methods=["DELETE"])
@token_required
def remove_item_from_cart(current_user):
    data = request.json
    customer_id = data["customer_id"]

    if customer_id != str(current_user["_id"]):
        return jsonify({"error": "Unauthorized access"}), 403

    product_id = data["product_id"]
    size = data.get("size")
    color = data.get("color")      

    cart = cart_collection.find_one({"customer_id": customer_id})
    if not cart:
        return jsonify({"error": "Cart not found"}), 404

    new_items = [
        item for item in cart["items"]
        if not (item["product_id"] == product_id and item.get("size") == size and item.get("color") == color)
    ]

    if len(new_items) == len(cart["items"]):
        return jsonify({"error": "Item not found in cart"}), 404

    cart_collection.update_one({"customer_id": customer_id}, {"$set": {"items": new_items}})
    return jsonify({"message": "Item removed from cart"})


# --------------------- WISHLIST ---------------------
@customer_bp.route("/wishlist/<customer_id>", methods=["GET"])
@token_required
def get_wishlist(current_user, customer_id):
    if customer_id != str(current_user["_id"]):
        return jsonify({"error": "Unauthorized access"}), 403

    wishlist = wishlist_collection.find_one({"customer_id": customer_id})
    if not wishlist:
        return jsonify({"items": []})

    enriched_items = []

    for item in wishlist.get("items", []):
        product_id = item.get("product_id")
        if not product_id:
            continue

        # Convert to ObjectId if needed
        if isinstance(product_id, str):
            product_id_obj = ObjectId(product_id)
        else:
            product_id_obj = product_id

        product = products_collection.find_one({"_id": product_id_obj})
        if not product:
            continue

        enriched_items.append({
            "product": {
                "_id": str(product["_id"]),
                "name": product.get("name"),
                "price": product.get("price"),
                "images": product.get("images", []),
                "category": product.get("category"),       
                "subcategory": product.get("subcategory")  
            },
            "size": item.get("size", None),
            "color": item.get("color", None)  
        })

    return jsonify({"items": enriched_items})


@customer_bp.route("/wishlist/add", methods=["POST"])
@token_required
def add_to_wishlist(current_user):
    data = request.json
    customer_id = data["customer_id"]
    product_id = data["product_id"]
    size = data.get("size")
    color = data.get("color")  

    if customer_id != str(current_user["_id"]):
        return jsonify({"error": "Unauthorized access"}), 403

    wishlist = wishlist_collection.find_one({"customer_id": customer_id})

    if not wishlist:
        wishlist_collection.insert_one({
            "customer_id": customer_id,
            "items": [{"product_id": product_id, "size": size, "color": color}]
        })
    else:
        items = wishlist["items"]
        if not any(i["product_id"] == product_id and i.get("size") == size and i.get("color") == color for i in items):
            items.append({"product_id": product_id, "size": size, "color": color})
            wishlist_collection.update_one({"customer_id": customer_id}, {"$set": {"items": items}})

    return jsonify({"message": "Added to wishlist"})


@customer_bp.route("/wishlist/move_to_cart", methods=["POST"])
@token_required
def move_wishlist_to_cart(current_user):
    data = request.json
    customer_id = data["customer_id"]
    product_id = data["product_id"]
    size = data.get("size")
    color = data.get("color")  
    quantity = data.get("quantity", 1)

    if customer_id != str(current_user["_id"]):
        return jsonify({"error": "Unauthorized access"}), 403

    # Add to cart
    cart = cart_collection.find_one({"customer_id": customer_id})
    if not cart:
        cart_collection.insert_one({
            "customer_id": customer_id,
            "items": [{"product_id": product_id, "size": size, "color": color, "quantity": quantity}]
        })
    else:
        items = cart["items"]
        for item in items:
            if item["product_id"] == product_id and item.get("size") == size and item.get("color") == color:
                item["quantity"] += quantity
                break
        else:
            items.append({"product_id": product_id, "size": size, "color": color, "quantity": quantity})
        cart_collection.update_one({"customer_id": customer_id}, {"$set": {"items": items}})

    #  also remove from wishlist after moving
    wishlist = wishlist_collection.find_one({"customer_id": customer_id})
    if wishlist:
        updated_items = [i for i in wishlist["items"] if not (i["product_id"] == product_id and i.get("size") == size and i.get("color") == color)]
        wishlist_collection.update_one({"customer_id": customer_id}, {"$set": {"items": updated_items}})

    return jsonify({"message": "Moved to cart"})


@customer_bp.route("/wishlist/remove", methods=["DELETE","POST"])
@token_required
def remove_from_wishlist(current_user):
    data = request.json
    customer_id = data["customer_id"]
    product_id = data["product_id"]
    size = data.get("size")
    color = data.get("color")  

    if customer_id != str(current_user["_id"]):
        return jsonify({"error": "Unauthorized access"}), 403

    wishlist = wishlist_collection.find_one({"customer_id": customer_id})
    if not wishlist:
        return jsonify({"error": "Wishlist not found"}), 404

    updated_items = [
        item for item in wishlist["items"]
        if not (item["product_id"] == product_id and item.get("size") == size and item.get("color") == color)
    ]
    wishlist_collection.update_one({"customer_id": customer_id}, {"$set": {"items": updated_items}})
    return jsonify({"message": "Removed from wishlist"})


# --------------------- CHECKOUT ---------------------

@customer_bp.route("/checkout", methods=["POST"])
@token_required
def checkout(current_user):
    data = request.json
    customer_id = data.get("customer_id")
    if customer_id != str(current_user["_id"]):
        return jsonify({"error": "Unauthorized access"}), 403

    coupon_code = data.get("coupon_code")
    phone = data.get("phone", "")
    address = data.get("address", "")
    payment_method = data.get("payment_method", "cod")
    checkout_mode = data.get("checkout_mode", "cart")
    direct_items = data.get("items", [])

    # Gift info
    order_gift = {
        "isGift": data.get("isGift", False),
        "giftMessage": data.get("giftMessage", "")
    }

    # --- SELECT CART OR BUY-NOW ITEMS ---
    cart = cart_collection.find_one({"customer_id": customer_id})
    if checkout_mode == "buyNow":
        source_items = direct_items
    else:
        source_items = cart.get("items", []) if cart else []

    if not source_items:
        return jsonify({"message": "No items to checkout"}), 400

    total = 0
    enriched_items = []

    # Enrich cart items & subtotal
    for item in source_items:
        product = products_collection.find_one({"_id": ObjectId(item["product_id"])})
        if not product:
            continue

        price = float(product.get("price", 0))
        quantity = int(item.get("quantity", 0))
        total += price * quantity

        images = product.get("images", [])
        image = images[0] if images else "https://via.placeholder.com/100"

        enriched_items.append({
            "product_id": item["product_id"],
            "name": product.get("name", "Product"),
            "image": image,
            "size": item.get("size", "N/A"),
            "quantity": quantity,
            "price": price,
            "added_by": product.get("added_by", "admin"),
            "vendor_id": product.get("vendor_id") if product.get("added_by") == "vendor" else None,
            "category": product.get("category", ""),
            "subcategory": product.get("subcategory", ""),
            "color": item.get("color", ""),
            "isGift": item.get("isGift", item.get("gift_option", False)),
            "giftMessage": item.get("giftMessage", item.get("gift_message", ""))
        })

    # The server is the only authority for discounts and fees.
    quote = calculate_quote(
        raw_items=source_items,
        products_collection=products_collection,
        offers_collection=offers_collection,
        customer=current_user,
        coupon_code=coupon_code,
        is_gift=order_gift["isGift"],
    )
    total = quote["subtotal"]
    discount = quote["discount"]
    delivery_fee = quote["delivery_fee"]
    gift_wrap_fee = quote["gift_wrap_fee"]
    final_total = quote["final_total"]
    applied_offers = quote["applied_offers"]
    applied_offer = applied_offers[0]["title"] if applied_offers else None

    # --- CREATE ORDER ---
    order_id = orders_collection.insert_one({
        "customer_id": customer_id,
        "order_items": enriched_items,
        "total_amount": total,
        "discount_applied": discount,
        "delivery_fee": delivery_fee,
        "gift_wrap_fee": gift_wrap_fee,
        "final_amount": final_total,
        "applied_offer": applied_offer,
        "applied_offers": applied_offers,
        "phone": phone,
        "address": address,
        "payment_method": payment_method,
        "status": "Placed",
        "order_gift": order_gift,
        "created_at": datetime.utcnow()
    }).inserted_id

    # --- REDUCE STOCK ---
    for item in enriched_items:
        product = products_collection.find_one({"_id": ObjectId(item["product_id"])})
        if not product:
            continue

        item_size = (item.get("size") or "N/A").upper()
        item_color = (item.get("color") or "N/A")

        updated_variants = []
        for v in product.get("variants", []):
            v_size = (v.get("size") or "").upper()
            v_color = v.get("color", "")

            if (v_size == item_size or item_size in ["", "N/A"]) and \
               (v_color == item_color or item_color in ["", "N/A"]):

                stock_val = v.get("stock", 0)
                current_stock = int(stock_val.get("$numberInt", stock_val)) if isinstance(stock_val, dict) else int(stock_val)

                new_stock = max(0, current_stock - int(item.get("quantity", 1)))
                v["stock"] = {"$numberInt": str(new_stock)}

                print(f"✅ Updated {product['name']} {v_size}/{v_color} stock {current_stock} → {new_stock}")

            updated_variants.append(v)

        products_collection.update_one(
            {"_id": product["_id"]},
            {"$set": {"variants": updated_variants}}
        )

    # --- CLEAR CART ---
    if checkout_mode == "cart":
        cart_collection.delete_one({"customer_id": customer_id})

    return jsonify({
        "message": "Order placed successfully",
        "total": total,
        "discount": discount,
        "delivery_fee": delivery_fee,
        "gift_wrap_fee": gift_wrap_fee,
        "final_amount": final_total,
        "applied_offer": applied_offer,
        "applied_offers": applied_offers,
        "order_gift": order_gift,
        "order_id": str(order_id)
    })


def _public_quote(quote):
    """Return quote data without internal Mongo product documents."""
    return {key: value for key, value in quote.items() if key != "items"}


@customer_bp.route("/checkout-quote", methods=["POST"])
@token_required
def checkout_quote(current_user):
    data = request.get_json(silent=True) or {}
    customer_id = str(current_user["_id"])
    if data.get("customer_id") and data["customer_id"] != customer_id:
        return jsonify({"error": "Unauthorized access"}), 403

    checkout_mode = data.get("checkout_mode", "cart")
    if checkout_mode == "buyNow":
        source_items = data.get("items", [])
    else:
        cart = cart_collection.find_one({"customer_id": customer_id})
        source_items = cart.get("items", []) if cart else []
    if not source_items:
        return jsonify({"error": "No items to checkout"}), 400

    quote = calculate_quote(
        raw_items=source_items,
        products_collection=products_collection,
        offers_collection=offers_collection,
        customer=current_user,
        coupon_code=data.get("coupon_code"),
        is_gift=bool(data.get("isGift")),
    )
    return jsonify(_public_quote(quote))

@customer_bp.route("/cart-totals/<customer_id>", methods=["GET"])
@token_required
def cart_totals(current_user, customer_id):
    if customer_id != str(current_user["_id"]):
        return jsonify({"error": "Unauthorized access"}), 403

    cart = cart_collection.find_one({"customer_id": customer_id})
    if not cart or not cart.get("items"):
        return jsonify({
            "subtotal": 0,
            "discount": 0,
            "delivery_fee": 0,
            "gift_wrap_fee": 0,
            "final_total": 0
        })

    total = 0
    enriched_items = []

    for item in cart["items"]:
        product = products_collection.find_one({"_id": ObjectId(item["product_id"])})
        if not product:
            continue
        price = float(product.get("price", 0))
        quantity = int(item.get("quantity", 0))
        total += price * quantity
        enriched_items.append({
            "product_id": item["product_id"],
            "quantity": quantity,
            "price": price,
            "isGift": item.get("isGift", False)
        })

    # Apply discount logic
    discount = 100 if total > 2000 else 0
    discounted_total = total - discount

    # Delivery fee logic
    delivery_fee = 0 if discounted_total > 500 else 50

    # Gift wrap fee
    gift_wrap_fee = 50 if any(i.get("isGift") for i in enriched_items) else 0

    final_total = discounted_total + delivery_fee + gift_wrap_fee

    return jsonify({
        "subtotal": total,
        "discount": discount,
        "delivery_fee": delivery_fee,
        "gift_wrap_fee": gift_wrap_fee,
        "final_total": final_total
    })




# --------------------- OFFERS ---------------------

@customer_bp.route("/offers", methods=["GET"])
def get_offers():
    now = datetime.utcnow()
    offers = list(offers_collection.find({"valid_till": {"$gte": now}}))
    for o in offers:
        o["_id"] = str(o["_id"])
    return jsonify(offers)


from flask import jsonify
from bson import ObjectId

def normalize_product_id(pid):
    """Convert product_id (str, dict with $oid, or ObjectId) into ObjectId"""
    if isinstance(pid, dict) and "$oid" in pid:
        return ObjectId(pid["$oid"])
    if isinstance(pid, str) and ObjectId.is_valid(pid):
        return ObjectId(pid)
    if isinstance(pid, ObjectId):
        return pid
    return None

def normalize_number(val):
    """Convert extended JSON numbers to proper int/float"""
    if isinstance(val, dict):
        if "$numberInt" in val:
            return int(val["$numberInt"])
        if "$numberDouble" in val:
            return float(val["$numberDouble"])
    return val if val is not None else 0


@customer_bp.route("/orders/<customer_id>", methods=["GET"])
@token_required
def get_orders(current_user, customer_id):
    if str(current_user["_id"]) != customer_id:
        return jsonify({"error": "Unauthorized"}), 403

    orders = list(orders_collection.find({"customer_id": customer_id}).sort("created_at", -1))
    enriched_orders = []

    for order in orders:
        if "order_items" not in order:
            continue  

        enriched_items = []
        for item in order["order_items"]:
            product_id = item.get("product_id")
            if isinstance(product_id, str):
                product_id = ObjectId(product_id)

            product = products_collection.find_one({"_id": product_id})
            if not product:
                continue  

            enriched_items.append({
                "product": {
                    "_id": str(product["_id"]),
                    "name": product.get("name"),
                    "price": product.get("price"),
                    "images": product.get("images", [])
                },
                "size": item.get("size"),
                "quantity": item.get("quantity"),
                "color": item.get("color", ""),        
            })

        enriched_orders.append({
            "_id": str(order["_id"]),
            "products": enriched_items,
            "total": order.get("total_amount"),
            "discount": order.get("discount_applied", 0),
            "final": order.get("final_amount"),
            "address": order.get("address", ""),
            "payment_method": order.get("payment_method", ""),
            "status": order.get("status"),
            "created_at": order.get("created_at")
        })

    return jsonify(enriched_orders)\
 
'''
@customer_bp.route("/orders", methods=["POST"])
@token_required
def place_order(current_user):
    data = request.get_json()
    order_items = data.get("order_items", [])
    total_amount = float(data.get("total_amount", 0))
    discount_applied = float(data.get("discount_applied", 0))
    final_amount = float(data.get("final_amount", total_amount - discount_applied))
    address = data.get("address", "")
    phone = data.get("phone", "")
    payment_method = data.get("payment_method", "cod")

    # 1️⃣ Validate stock before placing the order
    for item in order_items:
        product = products_collection.find_one({"_id": ObjectId(item["product_id"])})
        if not product:
            return jsonify({"success": False, "error": "Product not found"}), 404

        item_size = item.get("size", "N/A").upper()
        item_color = item.get("color", "N/A")

        matched_variant = next(
            (
                v for v in product.get("variants", [])
                if (v.get("size", "").upper() == item_size or item_size in ["", "N/A"])
                and (v.get("color", "") == item_color or item_color in ["", "N/A"])
            ),
            None
        )

        if not matched_variant:
            return jsonify({"success": False, "error": "Variant not found"}), 400

        stock_val = matched_variant.get("stock", {"$numberInt": "0"})
        current_stock = int(stock_val.get("$numberInt", 0))

        if current_stock < item.get("quantity", 1):
            return jsonify({"success": False, "error": f"Insufficient stock for {product['name']}"}), 400
    
    # 2️⃣ Insert the order
    order_data = {
        "customer_id": str(current_user["_id"]),
        "order_items": order_items,
        "total_amount": total_amount,
        "discount_applied": discount_applied,
        "final_amount": final_amount,
        "address": address,
        "phone": phone,
        "payment_method": payment_method,
        "status": "Placed",
        "created_at": datetime.utcnow()
    }

    result = orders_collection.insert_one(order_data)

    # 3️⃣ Reduce stock (keep $numberInt format)
    for item in order_items:
        product = products_collection.find_one({"_id": ObjectId(item["product_id"])})
        if not product:
            continue

        item_size = item.get("size", "N/A").upper()
        item_color = item.get("color", "N/A")

        updated_variants = []
        for v in product.get("variants", []):
            v_size = v.get("size", "").upper()
            v_color = v.get("color", "")

            if (v_size == item_size or item_size in ["", "N/A"]) and \
               (v_color == item_color or item_color in ["", "N/A"]):
                stock_val = v.get("stock", {"$numberInt": "0"})
                current_stock = int(stock_val.get("$numberInt", 0))
                new_stock = max(0, current_stock - int(item.get("quantity", 1)))
                v["stock"] = {"$numberInt": str(new_stock)}  # 👈 keep same format
                print(f"✅ Updated {product['name']} {v_size}/{v_color} stock {current_stock} → {new_stock}")

            updated_variants.append(v)

        products_collection.update_one(
            {"_id": product["_id"]},
            {"$set": {"variants": updated_variants}}
        )

    return jsonify({"success": True, "order_id": str(result.inserted_id)}), 201
'''
@customer_bp.route("/orders", methods=["POST"])
@token_required
def place_order(current_user):
    data = request.get_json()
    order_items = data.get("order_items", [])
    total_amount = float(data.get("total_amount", 0))
    discount_applied = float(data.get("discount_applied", 0))
    final_amount = float(data.get("final_amount", total_amount - discount_applied))
    address = data.get("address", "")
    phone = data.get("phone", "")
    payment_method = data.get("payment_method", "cod")

    # 1️⃣ Validate stock before placing the order
    for item in order_items:
        product = products_collection.find_one({"_id": ObjectId(item["product_id"])})
        if not product:
            return jsonify({"success": False, "error": "Product not found"}), 404

        item_size = item.get("size", "N/A").upper()
        item_color = item.get("color", "N/A")

        matched_variant = next(
            (
                v for v in product.get("variants", [])
                if (v.get("size", "").upper() == item_size or item_size in ["", "N/A"])
                and (v.get("color", "") == item_color or item_color in ["", "N/A"])
            ),
            None
        )

        if not matched_variant:
            return jsonify({"success": False, "error": "Variant not found"}), 400

        stock_val = matched_variant.get("stock", {"$numberInt": "0"})
        current_stock = int(stock_val.get("$numberInt", 0))

        if current_stock < item.get("quantity", 1):
            return jsonify({"success": False, "error": f"Insufficient stock for {product['name']}"}), 400

    # 2️⃣ Enrich each order item with vendor/admin info
    enriched_items = []
    for item in order_items:
        product = products_collection.find_one({"_id": ObjectId(item["product_id"])})
        if not product:
            continue

        # Detect vendor info safely
        added_by = product.get("added_by", "admin")
        vendor_id = None
        vendor_name = None

        if added_by == "vendor":
            vendor_id = product.get("vendor_id") or product.get("vendorId")
            vendor_name = product.get("vendor_business_name") or product.get("vendorBusinessName") or product.get("business_name")

        enriched_items.append({
            "product_id": str(product["_id"]),
            "name": product.get("name"),
            "price": product.get("price"),
            "quantity": item.get("quantity", 1),
            "size": item.get("size", "N/A"),
            "color": item.get("color", ""),
            "added_by": added_by,
            "vendor_id": vendor_id,
            "vendor_business_name": vendor_name
        })

    # 3️⃣ Prepare order data
    order_data = {
        "customer_id": str(current_user["_id"]),
        "order_items": enriched_items,
        "total_amount": total_amount,
        "discount_applied": discount_applied,
        "final_amount": final_amount,
        "address": address,
        "phone": phone,
        "payment_method": payment_method,
        "status": "Placed",
        "created_at": datetime.utcnow()
    }

    result = orders_collection.insert_one(order_data)

    # 4️⃣ Reduce stock (keep $numberInt format)
    for item in order_items:
        product = products_collection.find_one({"_id": ObjectId(item["product_id"])})
        if not product:
            continue

        item_size = item.get("size", "N/A").upper()
        item_color = item.get("color", "N/A")

        updated_variants = []
        for v in product.get("variants", []):
            v_size = v.get("size", "").upper()
            v_color = v.get("color", "")

            if (v_size == item_size or item_size in ["", "N/A"]) and \
               (v_color == item_color or item_color in ["", "N/A"]):
                stock_val = v.get("stock", {"$numberInt": "0"})
                current_stock = int(stock_val.get("$numberInt", 0))
                new_stock = max(0, current_stock - int(item.get("quantity", 1)))
                v["stock"] = {"$numberInt": str(new_stock)}  # 👈 keep same format
                print(f"✅ Updated {product['name']} {v_size}/{v_color} stock {current_stock} → {new_stock}")

            updated_variants.append(v)

        products_collection.update_one(
            {"_id": product["_id"]},
            {"$set": {"variants": updated_variants}}
        )

    return jsonify({"success": True, "order_id": str(result.inserted_id)}), 201



#======== Customer Profile ======

@customer_bp.route("/<customer_id>/profile", methods=["GET"])
@token_required
def get_customer_profile(current_user, customer_id):
    customer = users_collection.find_one({"_id": ObjectId(customer_id)})
    if not customer:
        return jsonify({"error": "Customer not found"}), 404

    response = {
        "id": str(customer["_id"]),
        "name": customer.get("name"),
        "email": customer.get("email"),
        "phone": customer.get("phone") or "",   
        "segment": customer.get("segment", "all"),
        "segment_request": customer.get("segment_request", None)
    }

    return jsonify(response), 200
#====== Similar Products ========


@customer_bp.route("/cart/similar/<customer_id>", methods=["GET"])
def get_similar_products(customer_id):
    try:
        cart_doc = cart_collection.find_one({"customer_id": customer_id})
        if not cart_doc or not cart_doc.get("items"):
            return jsonify({"similar_products": []})

        cart_items = cart_doc["items"]

        # Normalize product_ids safely
        product_ids = [
            normalize_product_id(item.get("product_id"))
            for item in cart_items if "product_id" in item
        ]
        product_ids = [pid for pid in product_ids if pid]  

        # Get all product documents in the cart
        cart_products = list(products_collection.find({"_id": {"$in": product_ids}}))

        # Collect unique categories or brands
        categories, brands = set(), set()
        for product in cart_products:
            if "category" in product:
                categories.add(product["category"])
            if "brand" in product:
                brands.add(product["brand"])

        # Find similar products by category or brand, excluding the ones already in cart
        similar_query = {
            "$and": [
                {"_id": {"$nin": product_ids}},
                {"$or": [
                    {"category": {"$in": list(categories)}} if categories else {},
                    {"brand": {"$in": list(brands)}} if brands else {}
                ]},
                {"status": "active"}
            ]
        }

        # Clean empty $or if needed
        similar_query["$and"] = [q for q in similar_query["$and"] if q]

        similar_products = list(products_collection.find(similar_query).limit(10))

        # Format the output
        formatted = []
        for product in similar_products:
            original_price = float(product.get("price", 0))
            discount = float(product.get("discount", 0))
            final_price = round(original_price * (1 - discount / 100), 2)

            formatted.append({
                "product_id": str(product["_id"]),
                "name": product.get("name"),
                "brand": product.get("brand"),
                "price": original_price,
                "discount": discount,
                "final_price": final_price,
                "images": product.get("images", []),
                "category": product.get("category"),
                "subcategory": product.get("subcategory"),
                "sizes": product.get("sizes", []),
                "colors": product.get("colors", [])
            })

        return jsonify({"similar_products": formatted})

    except Exception as e:
        print("🔥 Similar products route error:", repr(e))
        return jsonify({"error": "Internal server error"}), 500




@customer_bp.route("/cart/paired-with/<customer_id>", methods=["GET"])
def get_paired_with_products(customer_id):
    try:
        cart_doc = cart_collection.find_one({"customer_id": customer_id})
        if not cart_doc or not cart_doc.get("items"):
            return jsonify({"paired_products": []})

        # Extract product_ids from cart
        cart_product_ids = [ObjectId(item["product_id"]) for item in cart_doc["items"] if "product_id" in item]

        # Get cart product documents
        cart_products = list(products_collection.find({"_id": {"$in": cart_product_ids}}))

        # Collect all paired_with product IDs
        paired_ids = set()
        for product in cart_products:
            if "paired_with" in product and isinstance(product["paired_with"], list):
                paired_ids.update(ObjectId(pid) for pid in product["paired_with"])

        # Remove items already in cart
        paired_ids -= set(cart_product_ids)

        if not paired_ids:
            return jsonify({"paired_products": []})

        # Fetch paired products from DB
        paired_products = list(products_collection.find({
            "_id": {"$in": list(paired_ids)},
            "status": "active"
        }))

        # Format response
        
        formatted = []
        for product in paired_products:
            formatted.append({
                "product_id": str(product["_id"]),
                "name": product.get("name"),
                "brand": product.get("brand"),
                "price": product.get("price"),
                "discount": product.get("discount", 0),
                "images": product.get("images", []),
                "category": product.get("category"),
            })

        return jsonify({"paired_products": formatted})

    except Exception as e:
        print("🔥 Paired-with route error:", repr(e))
        return jsonify({"error": "Internal server error"}), 500





@customer_bp.route("/cart/offers/<customer_id>", methods=["GET"])
def get_cart_offers(customer_id):
    try:
        #  Fetch the user's cart document
        cart_doc = cart_collection.find_one({"customer_id": customer_id})
        if not cart_doc or not cart_doc.get("items"):
            return jsonify({"offers": []}), 200

        cart_items = cart_doc["items"]

        #  Collect product IDs from cart
        product_ids = [ObjectId(item["product_id"]) for item in cart_items if "product_id" in item]
        products = list(products_collection.find({"_id": {"$in": product_ids}}))

        #  Calculate cart total
        total = 0
        for item in cart_items:
            for p in products:
                if str(p["_id"]) == item["product_id"]:
                    total += float(p.get("price", 0)) * int(item.get("quantity", 1))

        #  Check for active offers matching this cart
        now = datetime.utcnow()
        active_offers = list(offers_collection.find({
            "status": "active",
            "start_date": {"$lte": now},
            "end_date": {"$gte": now}
        }))

        matched_offers = []
        for offer in active_offers:
            # Check min purchase
            if total < offer.get("min_purchase", 0):
                continue

            # If offer is product-specific
            if offer.get("products"):
                offer_products = [str(pid) for pid in offer["products"]]
                if not any(str(item["product_id"]) in offer_products for item in cart_items):
                    continue

            matched_offers.append({
                "id": str(offer["_id"]),
                "title": offer.get("title"),
                "description": offer.get("description"),
                "discount": offer.get("discount"),
                "type": offer.get("type"),
                "image": offer.get("image"),
                "status": offer.get("status"),
                "start_date": offer.get("start_date"),
                "end_date": offer.get("end_date"),
            })

        return jsonify({"offers": matched_offers}), 200

    except Exception as e:
        print("🔥 Error fetching cart offers:", e)
        return jsonify({"error": "Internal server error"}), 500





@customer_bp.route('/cart/bought_together/<customer_id>', methods=['GET'])
@token_required
def bought_together(customer_id):
    try:
        cart_items = cart_collection.find({"customer_id": customer_id})
        cart_product_ids = [item["product_id"] for item in cart_items]

        suggestions = []

        for pid in cart_product_ids:
            product = products_collection.find_one({"_id": ObjectId(pid)})
            if not product:
                continue

            gender = product.get("gender", "").lower()
            category = product.get("category", "").lower()
            subcategory = product.get("subcategory", "").lower()

            # Use `pairs_with` array if present
            if "pairs_with" in product and isinstance(product["pairs_with"], list):
                logging.info(f"Found pairs_with for {product['name']}: {product['pairs_with']}")
                for pair_id in product["pairs_with"]:
                    match = products_collection.find_one({"_id": ObjectId(pair_id)})
                    if match and match.get("gender", "").lower() == gender:
                        suggestions.append({
                            "product_id": str(match["_id"]),
                            "name": match["name"],
                            "price": match["price"],
                            "brand": match.get("brand", ""),
                            "image": match.get("images", [""])[0]
                        })
            else:
                # fallback based on matching gender/category/subcategory
                match_cursor = products_collection.find({
                    "_id": {"$ne": product["_id"]},
                    "gender": gender,
                    "category": category,
                    "subcategory": {"$ne": subcategory}
                }).limit(3)

                for match in match_cursor:
                    logging.info(f"Suggested for {product['name']}: {match['name']}")
                    suggestions.append({
                        "product_id": str(match["_id"]),
                        "name": match["name"],
                        "price": match["price"],
                        "brand": match.get("brand", ""),
                        "image": match.get("images", [""])[0]
                    })

        return jsonify({"bought_together": suggestions})

    except Exception as e:
        logging.error(f"Error in bought_together: {str(e)}")
        return jsonify({"error": "Failed to get bought together items"}), 500

#---- Customer Segmentation----------
@customer_bp.route("/update-segment", methods=["PUT"])
@token_required
def update_segment(current_user):
    customer_id = str(current_user["_id"])
    customer = users_collection.find_one({"_id": ObjectId(customer_id)})
    if not customer:
        return jsonify({"error": "Customer not found"}), 404

    segment = request.form.get("segment")
    if not segment:
        return jsonify({"error": "Segment is required"}), 400

    sensitive_segments = ["army", "navy", "airforce", "student"]

    proof_url = None
    if segment in sensitive_segments:
        if "proof" not in request.files:
            return jsonify({"error": f"Proof is required for {segment} segment"}), 400

        file = request.files["proof"]
        if file.filename == "":
            return jsonify({"error": "Empty proof file"}), 400

        # Upload to Cloudinary
        try:
            upload_result = cloudinary.uploader.upload(file, folder=f"segment_proofs/{customer_id}")
            proof_url = upload_result.get("secure_url")
        except Exception as e:
            return jsonify({"error": "Failed to upload proof", "details": str(e)}), 500

        users_collection.update_one(
            {"_id": ObjectId(customer_id)},
            {"$set": {
                "segment_request": {
                    "requested_segment": segment,
                    "status": "pending",
                    "proof_image": proof_url
                }
            }}
        )
    else:
        # Non-sensitive segments auto-approved
        users_collection.update_one(
            {"_id": ObjectId(customer_id)},
            {"$set": {
                "segment": segment,
                "segment_request": {
                    "requested_segment": segment,
                    "status": "approved",
                    "proof_image": None
                }
            }}
        )

    return jsonify({
        "message": "Segment updated successfully",
        "segment": segment,
        "segment_status": "pending" if segment in sensitive_segments else "approved",
        "proof_url": proof_url
    }), 200


@customer_bp.route("/request-segment", methods=["POST"])
def request_segment():
    user_id = request.form.get("user_id")  
    requested_segment = request.form.get("requested_segment")
    proof_image = request.files.get("proof_image")

    if not requested_segment or not proof_image:
        return jsonify({"error": "Segment and proof image required"}), 400

    try:
        # Upload image to Cloudinary
        upload_result = cloudinary.uploader.upload(
            proof_image,
            folder="segment_proofs", 
            use_filename=True,
            unique_filename=True
        )
        proof_image_url = upload_result.get("secure_url")

        # Update user with segment request
        users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {
                "segment_request": {
                    "requested_segment": requested_segment,
                    "proof_image": proof_image_url,
                    "status": "pending_subuser",
                    "requested_at": datetime.utcnow(),
                    "approved_by_subuser": None,
                    "forwarded_to_admin": False
                }
            }}
        )

        return jsonify({
            "message": "Segment request submitted",
            "proof_image": proof_image_url
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500




from bson import ObjectId

@customer_bp.route("/review/<order_id>/<product_id>", methods=["POST"])
@token_required
def submit_review(current_user, order_id, product_id):
    # Fetch full user details
    user = users_collection.find_one({"_id": ObjectId(current_user["_id"])})
    if not user:
        return jsonify({"error": "User not found"}), 404

    review_text = request.form.get("review", "").strip()
    rating = int(request.form.get("rating", 0))
    image = request.files.get("image")

    if not review_text or rating < 1 or rating > 5:
        return jsonify({"error": "Invalid review"}), 400

    order = orders_collection.find_one({"_id": ObjectId(order_id), "customer_id": str(current_user["_id"])})
    if not order or order.get("status").lower() != "delivered":
        return jsonify({"error": "Cannot review before delivery"}), 403

    image_url = None
    if image:
        upload_result = cloudinary.uploader.upload(image)
        image_url = upload_result.get("secure_url")

    review_doc = {
        "product_id": ObjectId(product_id),
        "customer_id": current_user["_id"],
        "customer_name": user.get("name") or user.get("username") or "Anonymous",
        "order_id": ObjectId(order_id),
        "rating": rating,
        "review": review_text,
        "image": image_url,
        "created_at": datetime.utcnow()
    }

    reviews_collection.insert_one(review_doc)
    return jsonify({"message": "Review submitted successfully"})



@customer_bp.route("/reviews/<product_id>", methods=["GET"])
def get_reviews(product_id):
    try:
        prod_id = ObjectId(product_id)
    except Exception:
        return jsonify({"error": "Invalid product ID"}), 400

    review_docs = list(reviews_collection.find({"product_id": prod_id}).sort("created_at", -1))
    
    reviews_list = []
    for r in review_docs:
        reviews_list.append({
            "_id": str(r.get("_id")),
            "product_id": str(r.get("product_id")),
            "customer_id": str(r.get("customer_id")),
            "customer_name": r.get("customer_name", "Anonymous"),  # optional field
            "order_id": str(r.get("order_id")),
            "rating": r.get("rating", 0),
            "review": r.get("review", ""),
            "image": r.get("image"),
            "created_at": r.get("created_at").isoformat() if r.get("created_at") else None
        })

    return jsonify({"reviews": reviews_list})



@customer_bp.route("/return", methods=["POST"])
@token_required
def return_order(current_user):
    data = request.json
    customer_id = str(current_user["_id"])
    order_id = data.get("order_id")
    product_id = data.get("product_id")
    size = data.get("size")
    color = data.get("color")
    quantity = data.get("quantity", 1)

    if not order_id or not product_id:
        return jsonify({"error": "Order ID and Product ID are required"}), 400

    # Check if the order belongs to this customer
    order = orders_collection.find_one({"_id": ObjectId(order_id), "customer_id": customer_id})
    if not order:
        return jsonify({"error": "Order not found"}), 404

    # Insert return request
    return_doc = {
        "customer_id": customer_id,
        "order_id": order_id,
        "product_id": product_id,
        "size": size,
        "color": color,
        "quantity": quantity,
        "status": "pending",
        "requested_at": datetime.utcnow()
    }

   
    orders_collection.update_one(
        {"_id": ObjectId(order_id)},
        {"$push": {"returns": return_doc}}
    )

    return jsonify({"message": "Return request submitted successfully"})

@customer_bp.route("/reorder", methods=["POST"])
@token_required
def reorder_product(current_user):
    data = request.json
    customer_id = str(current_user["_id"])
    product_id = data.get("product_id")
    size = data.get("size")
    color = data.get("color")
    quantity = data.get("quantity", 1)

    if not product_id:
        return jsonify({"error": "Product ID is required"}), 400

    # Add to cart
    cart = cart_collection.find_one({"customer_id": customer_id})
    if not cart:
        cart_collection.insert_one({
            "customer_id": customer_id,
            "items": [{"product_id": product_id, "size": size, "color": color, "quantity": quantity}]
        })
    else:
        items = cart["items"]
        for item in items:
            if item["product_id"] == product_id and item.get("size") == size and item.get("color") == color:
                item["quantity"] += quantity
                break
        else:
            items.append({"product_id": product_id, "size": size, "color": color, "quantity": quantity})
        cart_collection.update_one({"customer_id": customer_id}, {"$set": {"items": items}})

    return jsonify({"message": "Product added to cart for reorder"})


# customer_routes.py
import razorpay
import hmac
import hashlib
import os


# Razorpay client initialization
RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "YOUR_KEY_ID")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "YOUR_KEY_SECRET")
client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))


# -------------------------------
# Create Razorpay Order
# -------------------------------

@customer_bp.route("/create-order", methods=["POST"])
@token_required
def create_order(current_user):
    try:
        data = request.get_json(silent=True) or {}
        customer_id = str(current_user["_id"])
        if data.get("customer_id") and data["customer_id"] != customer_id:
            return jsonify({"success": False, "message": "Unauthorized access"}), 403

        checkout_mode = data.get("checkout_mode", "cart")
        if checkout_mode == "buyNow":
            source_items = data.get("items", [])
        else:
            cart = cart_collection.find_one({"customer_id": customer_id})
            source_items = cart.get("items", []) if cart else []
        if not source_items:
            return jsonify({"success": False, "message": "No items to checkout"}), 400

        quote = calculate_quote(
            raw_items=source_items,
            products_collection=products_collection,
            offers_collection=offers_collection,
            customer=current_user,
            coupon_code=data.get("coupon_code"),
            is_gift=bool(data.get("isGift")),
        )
        amount_paise = int(round(quote["final_total"] * 100))
        if amount_paise <= 0:
            return jsonify({"success": False, "message": "Invalid order total"}), 400

        razorpay_order = client.order.create({
            "amount": amount_paise,
            "currency": "INR",
            "receipt": f"receipt_{int(os.urandom(4).hex(), 16)}",
            "payment_capture": 1,
        })
        return jsonify({
            "success": True,
            "id": razorpay_order["id"],
            "amount": razorpay_order["amount"],
            "currency": razorpay_order["currency"],
            "key": RAZORPAY_KEY_ID,
            "quote": _public_quote(quote),
        })
    except Exception as e:
        print("Razorpay order creation failed:", e)
        return jsonify({"success": False, "message": "Failed to create Razorpay order"}), 500

# -------------------------------
# Verify Razorpay Payment
# -------------------------------
import hmac
import hashlib
from flask import request, jsonify
import os

RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "YOUR_KEY_SECRET")

@customer_bp.route("/verify-payment", methods=["POST"])
@token_required
def verify_payment(current_user):
    try:
        data = request.get_json()

        # Razorpay fields
        razorpay_order_id = data.get("razorpay_order_id")
        razorpay_payment_id = data.get("razorpay_payment_id")
        razorpay_signature = data.get("razorpay_signature")

        if not (razorpay_order_id and razorpay_payment_id and razorpay_signature):
            return jsonify({"success": False, "message": "Payment details missing"}), 400

        # 🔐 Verify Razorpay signature
        import hmac, hashlib, os
        secret = os.getenv("RAZORPAY_KEY_SECRET")
        if not secret:
            return jsonify({"success": False, "error": "Razorpay secret not set"}), 500

        body = f"{razorpay_order_id}|{razorpay_payment_id}"
        generated_signature = hmac.new(
            secret.encode(),
            body.encode(),
            hashlib.sha256
        ).hexdigest()

        if generated_signature != razorpay_signature:
            return jsonify({"success": False, "message": "Invalid payment signature"}), 400

        # --- SELECT CART OR BUY-NOW ITEMS ---
        checkout_mode = data.get("checkout_mode", "cart")
        direct_items = data.get("items", [])
        cart = cart_collection.find_one({"customer_id": str(current_user["_id"])})
        source_items = direct_items if checkout_mode == "buyNow" else (cart.get("items", []) if cart else [])
        if not source_items:
            return jsonify({"success": False, "message": "No items to checkout"}), 400

        coupon_code = data.get("coupon_code")
        phone = data.get("phone", "")
        address = data.get("address", "")
        order_gift = {
            "isGift": data.get("isGift", False),
            "giftMessage": data.get("giftMessage", "")
        }

        total = 0
        enriched_items = []

        # --- Enrich items & subtotal ---
        for item in source_items:
            product = products_collection.find_one({"_id": ObjectId(item["product_id"])})
            if not product:
                continue

            price = float(product.get("price", 0))
            quantity = int(item.get("quantity", 0))
            total += price * quantity

            images = product.get("images", [])
            image = images[0] if images else "https://via.placeholder.com/100"

            enriched_items.append({
                "product_id": item["product_id"],
                "name": product.get("name", "Product"),
                "image": image,
                "size": item.get("size", "N/A"),
                "quantity": quantity,
                "price": price,
                "added_by": product.get("added_by", "admin"),
                "vendor_id": product.get("vendor_id") if product.get("added_by") == "vendor" else None,
                "category": product.get("category", ""),
                "subcategory": product.get("subcategory", ""),
                "color": item.get("color", ""),
                "isGift": item.get("isGift", item.get("gift_option", False)),
                "giftMessage": item.get("giftMessage", item.get("gift_message", ""))
            })

        quote = calculate_quote(
            raw_items=source_items,
            products_collection=products_collection,
            offers_collection=offers_collection,
            customer=current_user,
            coupon_code=coupon_code,
            is_gift=order_gift["isGift"],
        )
        total = quote["subtotal"]
        discount = quote["discount"]
        delivery_fee = quote["delivery_fee"]
        gift_wrap_fee = quote["gift_wrap_fee"]
        final_total = quote["final_total"]
        applied_offers = quote["applied_offers"]
        applied_offer = applied_offers[0]["title"] if applied_offers else None

        razorpay_order = client.order.fetch(razorpay_order_id)
        expected_paise = int(round(final_total * 100))
        if int(razorpay_order.get("amount", -1)) != expected_paise:
            return jsonify({"success": False, "message": "Payment amount does not match current order total"}), 400

        # --- SAVE ORDER ---
        order_data = {
            "customer_id": str(current_user["_id"]),
            "order_items": enriched_items,
            "total_amount": total,
            "discount_applied": discount,
            "delivery_fee": delivery_fee,
            "gift_wrap_fee": gift_wrap_fee,
            "final_amount": final_total,
            "applied_offer": applied_offer,
        "applied_offers": applied_offers,
            "address": address,
            "phone": phone,
            "payment_method": "razorpay",
            "razorpay_order_id": razorpay_order_id,
            "razorpay_payment_id": razorpay_payment_id,
            "order_gift": order_gift,
            "status": "Paid",
            "created_at": datetime.utcnow()
        }
        result = orders_collection.insert_one(order_data)

        # --- REDUCE STOCK (same as checkout) ---
        for item in enriched_items:
            product = products_collection.find_one({"_id": ObjectId(item["product_id"])})
            if not product:
                continue

            item_size = (item.get("size") or "N/A").upper()
            item_color = (item.get("color") or "N/A")

            updated_variants = []
            for v in product.get("variants", []):
                v_size = (v.get("size") or "").upper()
                v_color = v.get("color", "")

                if (v_size == item_size or item_size in ["", "N/A"]) and \
                   (v_color == item_color or item_color in ["", "N/A"]):

                    stock_val = v.get("stock", 0)
                    current_stock = int(stock_val.get("$numberInt", stock_val)) if isinstance(stock_val, dict) else int(stock_val)
                    new_stock = max(0, current_stock - int(item.get("quantity", 1)))
                    v["stock"] = {"$numberInt": str(new_stock)}
                    print(f"✅ Updated {product['name']} {v_size}/{v_color} stock {current_stock} → {new_stock}")

                updated_variants.append(v)

            products_collection.update_one(
                {"_id": product["_id"]},
                {"$set": {"variants": updated_variants}}
            )

        # --- CLEAR CART ---
        if checkout_mode == "cart":
            cart_collection.delete_one({"customer_id": str(current_user["_id"])})

        return jsonify({
            "success": True,
            "message": "Payment verified and order placed successfully",
            "order_id": str(result.inserted_id),
            "total": total,
            "discount": discount,
            "delivery_fee": delivery_fee,
            "gift_wrap_fee": gift_wrap_fee,
            "final_amount": final_total,
            "applied_offer": applied_offer,
        "applied_offers": applied_offers,
            "order_gift": order_gift,
            "enriched_items": enriched_items
        }), 201

    except Exception as e:
        print("❌ Payment verification failed:", e)
        return jsonify({"success": False, "error": str(e)}), 500

