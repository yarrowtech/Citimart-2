from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime
from database import collections_collection, products_collection  

collection_bp = Blueprint("collections", __name__)

# ------------------ Helper: Safe Stock ------------------
def safe_stock(value):
    """Convert any stock value to integer"""
    if isinstance(value, (int, float, str)):
        try:
            return int(value)
        except:
            return 0
    if isinstance(value, dict):
        if "$numberInt" in value:
            return int(value["$numberInt"])
        if "$numberDouble" in value:
            return int(float(value["$numberDouble"]))
        if "$numberLong" in value:
            return int(value["$numberLong"])
    return 0

# ------------------ Helper: Normalize Product ------------------
def normalize_product(p):
    """Return a fully normalized product dict"""
    p["_id"] = str(p["_id"])
    p["images"] = p.get("images", [])
    p["image"] = p["images"][0] if p["images"] else None
    p["brand"] = p.get("brand", "")
    p["price"] = float(p.get("price", 0) or 0)
    p["discount"] = float(p.get("discount", 0) or 0)
    p["discountedPrice"] = (
        round(p["price"] * (1 - p["discount"] / 100), 2) if p["discount"] > 0 else p["price"]
    )
    # Normalize variants
    variants = p.get("variants", [])
    p["variants"] = [
        {
            "size": v.get("size", ""),
            "color": v.get("color", ""),
            "stock": safe_stock(v.get("stock", 0)),
        }
        for v in variants
    ]
    # Product stock = sum of variant stocks
    p["stock"] = sum(v["stock"] for v in p["variants"])
    return p

# ------------------ Get All Collections ------------------
@collection_bp.route("/api/products/collections", methods=["GET"])
def get_all_collections():
    try:
        collections = list(collections_collection.find().sort("created_at", -1))
        for c in collections:
            c["_id"] = str(c["_id"])
            product_ids = []
            for pid in c.get("products", []):
                try:
                    if isinstance(pid, ObjectId):
                        product_ids.append(pid)
                    elif isinstance(pid, str) and ObjectId.is_valid(pid):
                        product_ids.append(ObjectId(pid))
                except:
                    continue
            product_objs = list(
                products_collection.find(
                    {"_id": {"$in": product_ids}},
                    {"name": 1, "price": 1, "images": 1, "discount": 1, "variants": 1, "brand": 1},
                )
            )
            c["products"] = [normalize_product(p) for p in product_objs]
        return jsonify({"collections": collections}), 200
    except Exception as e:
        print("ERROR in get_all_collections:", e)
        return jsonify({"error": str(e)}), 500

# ------------------ Get Collection By Slug ------------------
@collection_bp.route("/api/collections/<slug>", methods=["GET"])
def get_collection_by_slug(slug):
    try:
        collection = collections_collection.find_one({"slug": slug})
        if not collection:
            return jsonify({"error": "Collection not found"}), 404

        collection["_id"] = str(collection["_id"])

        # Populate full product details
        product_ids = []
        for pid in collection.get("products", []):
            if isinstance(pid, ObjectId):
                product_ids.append(pid)
            elif isinstance(pid, str) and ObjectId.is_valid(pid):
                product_ids.append(ObjectId(pid))

        product_objs = list(
            products_collection.find(
                {"_id": {"$in": product_ids}},
                {"name": 1, "price": 1, "images": 1, "discount": 1, "variants": 1, "brand": 1},
            )
        )
        collection["products"] = [normalize_product(p) for p in product_objs]

        return jsonify({"collection": collection}), 200

    except Exception as e:
        print("ERROR in get_collection_by_slug:", e)
        return jsonify({"error": str(e)}), 500





# ------------------ Add Collection ------------------
@collection_bp.route("/api/products/collections", methods=["POST"])
def add_collection():
    try:
        data = request.json
        role = data.get("role", "customer")
        if role not in ["admin", "merchandise"]:
            return jsonify({"error": "Access denied"}), 403

        # Extract valid ObjectIds from full product objects
        product_ids = []
        for p in data.get("products", []):
            if isinstance(p, dict) and "_id" in p and ObjectId.is_valid(p["_id"]):
                product_ids.append(ObjectId(p["_id"]))
            elif isinstance(p, str) and ObjectId.is_valid(p):
                product_ids.append(ObjectId(p))

        collection_data = {
            "name": data.get("name"),
            "slug": data.get("slug"),
            "description": data.get("description", ""),
            "products": product_ids,
            "created_at": datetime.utcnow(),
            "created_by": role,
        }

        result = collections_collection.insert_one(collection_data)
        collection_data["_id"] = str(result.inserted_id)

        # Populate full product details for response
        product_objs = list(
            products_collection.find(
                {"_id": {"$in": product_ids}},
                {"name": 1, "price": 1, "images": 1, "discount": 1, "variants": 1, "brand": 1},
            )
        )
        collection_data["products"] = [normalize_product(p) for p in product_objs]

        return jsonify({"message": "Collection added", "collection": collection_data}), 201

    except Exception as e:
        print("ERROR in add_collection:", e)
        return jsonify({"error": str(e)}), 500

# ------------------ Update Collection ------------------
@collection_bp.route("/api/products/collections/<collection_id>", methods=["PUT"])
def update_collection(collection_id):
    try:
        data = request.json
        role = data.get("role", "customer")
        if role not in ["admin", "merchandise"]:
            return jsonify({"error": "Access denied"}), 403

        update_fields = {}
        if "name" in data:
            update_fields["name"] = data["name"]
        if "slug" in data:
            update_fields["slug"] = data["slug"]
        if "description" in data:
            update_fields["description"] = data["description"]

        # Extract valid ObjectIds from full product objects
        if "products" in data:
            product_ids = []
            for p in data["products"]:
                if isinstance(p, dict) and "_id" in p and ObjectId.is_valid(p["_id"]):
                    product_ids.append(ObjectId(p["_id"]))
                elif isinstance(p, str) and ObjectId.is_valid(p):
                    product_ids.append(ObjectId(p))
            update_fields["products"] = product_ids

        update_fields["updated_at"] = datetime.utcnow()
        update_fields["updated_by"] = role

        result = collections_collection.update_one(
            {"_id": ObjectId(collection_id)}, {"$set": update_fields}
        )
        if result.matched_count == 0:
            return jsonify({"error": "Collection not found"}), 404

        # Fetch updated collection with normalized products
        collection = collections_collection.find_one({"_id": ObjectId(collection_id)})
        product_objs = list(
            products_collection.find(
                {"_id": {"$in": collection.get("products", [])}},
                {"name": 1, "price": 1, "images": 1, "discount": 1, "variants": 1, "brand": 1},
            )
        )
        collection["_id"] = str(collection["_id"])
        collection["products"] = [normalize_product(p) for p in product_objs]

        return jsonify({"message": "Collection updated", "collection": collection}), 200

    except Exception as e:
        print("ERROR in update_collection:", e)
        return jsonify({"error": str(e)}), 500


# ------------------ Delete Collection ------------------
@collection_bp.route("/api/products/collections/<collection_id>", methods=["DELETE"])
def delete_collection(collection_id):
    try:
        role = request.args.get("role", "customer")
        if role not in ["admin", "merchandise"]:
            return jsonify({"error": "Access denied"}), 403

        result = collections_collection.delete_one({"_id": ObjectId(collection_id)})
        if result.deleted_count == 0:
            return jsonify({"error": "Collection not found"}), 404

        return jsonify({"message": "Collection deleted"}), 200
    except Exception as e:
        print("ERROR in delete_collection:", e)
        return jsonify({"error": str(e)}), 500
