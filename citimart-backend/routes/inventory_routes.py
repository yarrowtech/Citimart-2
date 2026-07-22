# inventory_routes.py
from flask import Blueprint, request, jsonify
from bson import ObjectId
from database import products_collection,orders_collection
from datetime import datetime

inventory_bp = Blueprint("inventory", __name__, url_prefix="/api/inventory")


# ------------------ GET Full Inventory ------------------
@inventory_bp.route("/", methods=["GET"])
def get_inventory():
    try:
        products = list(products_collection.find().sort("created_at", -1))
        inventory_list = []

        for p in products:
            product_id = str(p["_id"])
            vendor = p.get("vendor_id", "Admin")
            category = p.get("category", "")
            subCategory = p.get("subCategory", "")
            childCategory = p.get("childCategory", "")
            price = float(p.get("price", 0))
            status = p.get("status", "active")
            created_at = p.get("created_at")
            main_image = p.get("images")[0] if p.get("images") else None

            for v in p.get("variants", []):
                # Normalize stock safely
                stock_val = v.get("stock", 0)
                if isinstance(stock_val, dict):
                    if "$numberInt" in stock_val:
                        stock = int(stock_val["$numberInt"])
                    elif "$numberDouble" in stock_val:
                        stock = int(float(stock_val["$numberDouble"]))
                    else:
                        stock = int(stock_val.get("value", 0))
                else:
                    stock = int(stock_val or 0)

                sku = v.get("sku") or str(ObjectId())
                variant_name = f"{v.get('color','')} / {v.get('size','')}".strip(" /")

                # Format date safely without dateutil
                last_restock = created_at.strftime("%Y-%m-%d") if isinstance(created_at, datetime) else None

                inventory_list.append({
                    "_id": str(ObjectId()),
                    "productId": product_id,
                    "productName": p.get("name"),
                    "sku": sku,
                    "variant": variant_name,
                    "category": category,
                    "subCategory": subCategory,
                    "childCategory": childCategory,
                    "vendor": vendor,
                    "stock": stock,
                    "minStock": 5,
                    "price": price,
                    "status": "In Stock" if stock > 0 else "Out of Stock",
                    "lastRestock": last_restock,
                    "image": main_image
                })

        return jsonify(inventory_list), 200

    except Exception as e:
        print("Inventory fetch error:", e)
        return jsonify({"error": str(e)}), 500


# ------------------ UPDATE Stock ------------------
@inventory_bp.route("/<variant_id>", methods=["PUT"])
def update_stock(variant_id):
    """
    Update stock for a specific variant.
    Payload: { "stock": 10, "productId": "..." , "sku": "..." }
    """
    try:
        data = request.get_json()
        product_id = data.get("productId")
        sku = data.get("sku")
        new_stock = int(data.get("stock", 0))

        if not product_id or not sku:
            return jsonify({"error": "productId and sku are required"}), 400

        product = products_collection.find_one({"_id": ObjectId(product_id)})
        if not product:
            return jsonify({"error": "Product not found"}), 404

        updated = False
        variants = product.get("variants", [])
        for v in variants:
            if v.get("sku") == sku:
                v["stock"] = new_stock
                updated = True
                break

        if not updated:
            return jsonify({"error": "Variant not found"}), 404

        products_collection.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": {"variants": variants, "updated_at": datetime.utcnow()}}
        )

        return jsonify({"message": "Stock updated successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@inventory_bp.route("/top-ordered", methods=["GET"])
def get_top_ordered_items():
    try:
        top_products = list(orders_collection.aggregate([
            {"$unwind": "$items"},
            {"$group": {
                "_id": "$items.product_id",
                "totalOrdered": {"$sum": "$items.quantity"}
            }},
            {"$sort": {"totalOrdered": -1}},
            {"$limit": 10}
        ]))

        # Join with product info for display
        product_ids = [p["_id"] for p in top_products]
        products = products_collection.find({"_id": {"$in": product_ids}})

        product_map = {str(p["_id"]): p for p in products}

        result = []
        for p in top_products:
            pid = str(p["_id"])
            prod = product_map.get(pid)
            if prod:
                result.append({
                    "product_id": pid,
                    "name": prod["name"],
                    "sku": prod["sku"],
                    "image": prod.get("image"),
                    "totalOrdered": p["totalOrdered"],
                    "stock": prod.get("stock", 0)
                })

        return jsonify(result), 200
    except Exception as e:
        print("Error fetching top ordered items:", e)
        return jsonify({"error": str(e)}), 500
