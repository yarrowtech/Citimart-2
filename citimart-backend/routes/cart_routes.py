from flask import Blueprint, request, jsonify
from bson import ObjectId
from database import products_collection, cart_collection, users_collection
import logging

cart_bp = Blueprint("cart", __name__)

# 🛒 Get user cart
@cart_bp.route("/cart", methods=["GET"])
def get_cart():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id required"}), 400

    cart = cart_collection.find_one({"user_id": user_id})
    if not cart:
        return jsonify({"items": [], "total": 0})

    items = []
    total = 0
    for item in cart["items"]:
        
        product = products_collection.find_one({"_id": ObjectId(item["product_id"])})
    if product:
        quantity = item.get("quantity", 1)
        item_total = product["price"] * quantity
        total += item_total

        # ✅ Get list of product IDs from 'pairs_with' (stored as strings)
        pairs_with_ids = product.get("pairs_with", [])
        pairs_with_images = []

        if pairs_with_ids:
            try:
                # Convert to ObjectId and query the product images
                object_ids = [ObjectId(pid) for pid in pairs_with_ids if ObjectId.is_valid(pid)]
                paired_products = products_collection.find({"_id": {"$in": object_ids}})

                # Extract the first image of each paired product
                pairs_with_images = [
               p.get("images", [""])[0].replace("\\", "/") for p in paired_products if p.get("images")
                ]

            except Exception as e:
                print("Error fetching paired products:", e)

        items.append({
            "product": {
                "id": str(product["_id"]),
                "name": product["name"],
                "image": product.get("images", [""])[0],
                "price": product["price"],
                "pairs_with": pairs_with_images  
            },
            "quantity": quantity
        })


    return jsonify({"items": items, "total": total})


#  Add to cart
@cart_bp.route("/cart", methods=["POST"])
def add_to_cart():
    data = request.json
    user_id = data.get("user_id")
    product_id = data.get("product_id")
    quantity = data.get("quantity", 1)

    if not user_id or not product_id:
        return jsonify({"error": "Missing user_id or product_id"}), 400

    cart = cart_collection.find_one({"user_id": user_id})
    if not cart:
        cart_collection.insert_one({
            "user_id": user_id,
            "items": [{"product_id": product_id, "quantity": quantity}]
        })
    else:
        updated = False
        for item in cart["items"]:
            if item["product_id"] == product_id:
                item["quantity"] += quantity
                updated = True
                break
        if not updated:
            cart["items"].append({"product_id": product_id, "quantity": quantity})
        cart_collection.update_one({"user_id": user_id}, {"$set": {"items": cart["items"]}})

    return jsonify({"message": "Added to cart"})


#  Remove from cart
@cart_bp.route("/cart/remove", methods=["POST"])
def remove_from_cart():
    data = request.json
    user_id = data.get("user_id")
    product_id = data.get("product_id")

    cart = cart_collection.find_one({"user_id": user_id})
    if cart:
        cart["items"] = [item for item in cart["items"] if item["product_id"] != product_id]
        cart_collection.update_one({"user_id": user_id}, {"$set": {"items": cart["items"]}})
    return jsonify({"message": "Removed"})


#  Frequently Bought Together Recommendations
@cart_bp.route("/cart/bought-together", methods=["POST"])
def bought_together():
    try:
        data = request.json
        cart_product_ids = data.get("product_ids", [])

        all_suggestions = set()
        cart_products = list(products_collection.find({"_id": {"$in": [ObjectId(pid) for pid in cart_product_ids]}}))

        logging.info(f"[CART] Processing bought-together for {len(cart_products)} items.")

        for product in cart_products:
            pairs_with = product.get("pairs_with", [])
            category = product.get("category", "")
            subcategory = product.get("subcategory", "")
            gender = product.get("gender", "").lower()

            logging.info(f"[CART] Looking for matches for: {product['name']} ({category} > {subcategory})")

            matched = products_collection.find({
                "_id": {"$in": [ObjectId(pid) for pid in pairs_with]},
                "status": "active",
                "stock": {"$gt": 0},
                "category": {"$in": [category, "Accessories"]},
                "$or": [
                    {"subcategory": subcategory},
                    {"gender": gender},
                    {"tags": {"$in": [subcategory, gender]}},
                ]
            })

            for m in matched:
                if str(m["_id"]) not in cart_product_ids:
                    all_suggestions.add(str(m["_id"]))

        # 🔍 Fetch full product details
        suggestions = products_collection.find({
            "_id": {"$in": [ObjectId(pid) for pid in all_suggestions]},
            "status": "active",
            "stock": {"$gt": 0}
        })

        # 💰 Sort by discount first
        sorted_suggestions = sorted(
            suggestions,
            key=lambda x: x.get("discount", 0),
            reverse=True
        )

        response = []
        for s in sorted_suggestions[:8]:  # Max 8 suggestions
            response.append({
                "id": str(s["_id"]),
                "name": s["name"],
                "price": s["price"],
                "image": s.get("images", [""])[0],
                "discount": s.get("discount", 0)
            })

        return jsonify({"suggestions": response})

    except Exception as e:
        logging.exception("Error in bought-together route")
        return jsonify({"error": str(e)}), 500


@cart_bp.route('/cart/suggestions/<product_id>', methods=['GET'])
def get_suggestions(product_id):
    try:
        main_product = products_collection.find_one({"_id": ObjectId(product_id), "is_active": True, "stock": {"$gt": 0}})
        if not main_product:
            return jsonify({"error": "Product not found"}), 404

        main_category = main_product.get("category")
        sub_category = main_product.get("sub_category")
        gender = main_product.get("gender", "Unisex")

        # Basic category pairing map (can expand later)
        pair_map = {
            "Shirts": ["Jeans", "Belts", "Shoes", "Watches"],
            "T-Shirts": ["Sneakers", "Caps", "Shorts"],
            "Dresses": ["Handbags", "Heels", "Jewelry"],
            "Tops": ["Skirts", "Heels", "Bags"],
        }

        pair_with = pair_map.get(sub_category, [])

        # Match discounted, in-stock, active, same-gender
        query = {
            "sub_category": {"$in": pair_with},
            "gender": {"$in": [gender, "Unisex"]},
            "is_active": True,
            "stock": {"$gt": 0},
        }

        suggested_products = list(products_collection.find(query).sort("discount", -1).limit(10))
        for product in suggested_products:
            product["_id"] = str(product["_id"])

        return jsonify(suggested_products)

    except Exception as e:
        return jsonify({"error": str(e)}), 500