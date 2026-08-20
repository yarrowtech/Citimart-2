print("offers_routes.py started")

import os
import uuid
from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime
from database import offers_collection, users_collection, products_collection
from utils.auth_utils import token_required
import cloudinary
import cloudinary.uploader

offers_bp = Blueprint("offers", __name__)


# -------------------- Helpers --------------------

# Serialize offer with product details
def serialize_offer(offer):
    offer["_id"] = str(offer["_id"])

    if "products" not in offer or not isinstance(offer["products"], list):
        offer["products"] = []

    product_details = []
    for pid in offer.get("products", []):
        try:
            product = products_collection.find_one({"_id": ObjectId(pid)})
            if product:
                product_details.append({
                    "id": str(product["_id"]),
                    "name": product.get("name"),
                    "price": product.get("price"),
                    "image": product.get("images", [None])[0]
                })
        except Exception as e:
            print("Product fetch error:", e)

    offer["products"] = product_details
    return offer


def update_offer_status():
    now = datetime.utcnow()
    offers_collection.update_many({"end_date": {"$lt": now}}, {"$set": {"status": "expired"}})
    offers_collection.update_many({"start_date": {"$gt": now}}, {"$set": {"status": "upcoming"}})
    offers_collection.update_many(
        {"start_date": {"$lte": now}, "end_date": {"$gte": now}},
        {"$set": {"status": "active"}}
    )


# -------------------- CRUD APIs --------------------

#  Get Active Offers
@offers_bp.route("/offers", methods=["GET"])
def get_active_offers():
    update_offer_status()
    offers = list(offers_collection.find({
    "status": "active",
    "eligible_users": "all"  # 🧩 only public offers
}))

    return jsonify([serialize_offer(o) for o in offers]), 200


#  Get All Offers (Admin/Subuser)
@offers_bp.route("/offers/all", methods=["GET"])
@token_required
def get_all_offers(current_user):
    if current_user["role"] not in ["admin", "subuser"]:
        return jsonify({"error": "Access denied"}), 403

    update_offer_status()
    offers = list(offers_collection.find())
    return jsonify([serialize_offer(o) for o in offers]), 200


# 🔹 Extract form/json data
def extract_offer_data():
    if request.form:  # FormData
        data = {key: request.form.get(key) for key in request.form}
        products = request.form.getlist("products[]")
    else:  # JSON
        data = request.json or {}
        products = data.get("products", [])

    # Convert products to ObjectId
    product_ids = []
    for pid in products:
        try:
            product_ids.append(ObjectId(pid))
        except Exception as e:
            print("Invalid product id:", e)

    #  Handle image (JSON or File)
    image_url = data.get("image")  # <-- fallback if JSON already has a URL

    if "image" in request.files:  # only if uploading a new file
     file = request.files["image"]
     if file and file.filename:
        try:
            upload_result = cloudinary.uploader.upload(file, folder="offers")
            image_url = upload_result.get("secure_url")
        except Exception as e:
            print("Cloudinary upload failed:", e)


    # Convert dates safely
    try:
        start_date = datetime.fromisoformat(data.get("start_date"))
    except:
        return {"error": "Invalid start_date"}, None

    try:
        end_date = datetime.fromisoformat(data.get("end_date"))
    except:
        return {"error": "Invalid end_date"}, None

    return None, {
        "title": data.get("title", ""),
        "description": data.get("description", ""),
        "discount": float(data.get("discount") or 0),
        "code": str(data.get("code") or "").strip().upper(),
        "apply_mode": data.get("apply_mode", "automatic"),
        "max_discount": float(data.get("max_discount") or 0),
        "priority": int(data.get("priority") or 0),
        "stackable": str(data.get("stackable", "false")).lower() in ("true", "1", "yes"),
        "type": data.get("type", "popup"),
        "min_purchase": float(data.get("min_purchase") or 0),
        "eligible_users": data.get("eligible_users", "all"),
        "personalized_for": data.get("personalized_for", []),  
        "start_date": start_date,
        "end_date": end_date,
        "products": product_ids,
        "image": image_url,
        "status": "upcoming",
        "created_at": datetime.utcnow(),
        "created_by": str(data.get("created_by") or ""),  
    }


#  Create Offer
@offers_bp.route("/offers", methods=["POST"])
@token_required
def create_offer(current_user):
    if current_user["role"] not in ["admin", "subuser"]:
        return jsonify({"error": "Access denied"}), 403

    err, offer_data = extract_offer_data()
    if err:
        return jsonify(err), 400

    try:
        result = offers_collection.insert_one(offer_data)
        offer_data["_id"] = str(result.inserted_id)
        return jsonify(serialize_offer(offer_data)), 201
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400


#  Update Offer
@offers_bp.route("/offers/<offer_id>", methods=["PUT"])
@token_required
def update_offer(current_user, offer_id):
    if current_user["role"] not in ["admin", "subuser"]:
        return jsonify({"error": "Access denied"}), 403

    err, offer_data = extract_offer_data()
    if err:
        return jsonify(err), 400

    offer_data.pop("created_at", None)

    try:
        offers_collection.update_one({"_id": ObjectId(offer_id)}, {"$set": offer_data})
        updated_offer = offers_collection.find_one({"_id": ObjectId(offer_id)})
        return jsonify(serialize_offer(updated_offer)), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400


# ✅ Delete Offer
@offers_bp.route("/offers/<offer_id>", methods=["DELETE"])
@token_required
def delete_offer(current_user, offer_id):
    if current_user["role"] not in ["admin", "subuser"]:
        return jsonify({"error": "Access denied"}), 403

    offers_collection.delete_one({"_id": ObjectId(offer_id)})
    return jsonify({"success": True, "message": "Offer deleted"}), 200


# -------------------- Extra Functionality --------------------

# ✅ Apply Offer at Checkout
@offers_bp.route("/offers/checkout-apply", methods=["POST"])
def apply_offer_checkout():
    data = request.json or {}
    total_amount = data.get("total_amount", 0)
    now = datetime.utcnow()

    offers = list(offers_collection.find({
        "status": "active",
        "start_date": {"$lte": now},
        "end_date": {"$gte": now}
    }))

    applicable_offers = [serialize_offer(o) for o in offers if total_amount >= o.get("min_purchase", 0)]
    return jsonify({"applicable_offers": applicable_offers}), 200


# ✅ Notify Users Before Big Sale
@offers_bp.route("/offers/notify", methods=["POST"])
@token_required
def notify_users(current_user):
    if current_user["role"] not in ["admin", "subuser"]:
        return jsonify({"error": "Access denied"}), 403

    now = datetime.utcnow()
    upcoming_offers = list(offers_collection.find({
        "start_date": {"$gte": now},
        "status": "upcoming"
    }))

    for offer in upcoming_offers:
        users = list(users_collection.find({"role": "customer"}))
        for user in users:
            # TODO: Replace with real email service
            print(f"Email to {user['email']} -> Big Sale: {offer['title']}")

    return jsonify({"message": "Users notified about upcoming sales"}), 200


# ✅ Wishlist Price Drop Notification
@offers_bp.route("/offers/wishlist-drop", methods=["POST"])
def wishlist_price_drop():
    product_id = request.json.get("product_id")
    new_price = request.json.get("new_price")

    # Adjust depending on how wishlist is stored
    wishlists = list(users_collection.find({"wishlist": product_id}))
    for user in wishlists:
        print(f"Notify {user['email']} -> Wishlist item price dropped to Rs.{new_price}")

    return jsonify({"message": "Wishlist users notified"}), 200


# ✅ Referral Reward
@offers_bp.route("/offers/referral", methods=["POST"])
def referral_reward():
    data = request.json
    referrer = users_collection.find_one({"_id": ObjectId(data["referrer_id"])})
    referred = users_collection.find_one({"email": data["referred_email"]})

    if referrer and referred:
        print(f"{referrer['name']} and {referred['name']} earned 200 super coins!")
        return jsonify({"message": "Referral reward granted"}), 200
    return jsonify({"error": "Invalid referral"}), 400

'''
# ✅ Get Products of an Offer
@offers_bp.route("/offers/<offer_id>/products", methods=["GET"])
def get_offer_products(offer_id):
    try:
        offer = offers_collection.find_one({"_id": ObjectId(offer_id)})
        if not offer:
            return jsonify([]), 200

        product_ids = offer.get("products", [])
        products = list(products_collection.find({"_id": {"$in": product_ids}}))

        serialized_products = []
        for p in products:
            serialized_products.append({
                "id": str(p["_id"]),
                "name": p.get("name"),
                "price": p.get("price"),
                "images": p.get("images", [])
            })

        return jsonify(serialized_products), 200
    except Exception as e:
        print("Error fetching offer products:", e)
        return jsonify({"error": str(e)}), 400
'''
@offers_bp.route("/offers/<offer_id>/products", methods=["GET"])
def get_offer_products(offer_id):
    try:
        offer = offers_collection.find_one({"_id": ObjectId(offer_id)})
        if not offer:
            return jsonify({"error": "Offer not found"}), 404

        # ✅ Convert product IDs to ObjectIds
        product_ids = [ObjectId(pid) for pid in offer.get("products", [])]
        products = list(products_collection.find({"_id": {"$in": product_ids}}))

        # ✅ Serialize products
        serialized_products = []
        for p in products:
            serialized_products.append({
                "id": str(p["_id"]),
                "name": p.get("name"),
                "price": p.get("price"),
                "images": p.get("images", [])
            })

        # ✅ Serialize offer
        serialized_offer = {
            "id": str(offer["_id"]),
            "title": offer.get("title"),
            "description": offer.get("description"),
            "discount": offer.get("discount"),
            "type": offer.get("type"),
            "min_purchase": offer.get("min_purchase"),
            "eligible_users": offer.get("eligible_users"),
            "image": offer.get("image"),
            "status": offer.get("status"),
            "start_date": offer.get("start_date"),
            "end_date": offer.get("end_date"),
        }

        return jsonify({
            "offer": serialized_offer,
            "products": serialized_products
        }), 200

    except Exception as e:
        print("Error fetching offer products:", e)
        return jsonify({"error": str(e)}), 400


# ✅ Get Eligible Offers (for logged-in user)
'''
@offers_bp.route("/offers/eligible", methods=["GET"])
@token_required
def get_eligible_offers(current_user):
    update_offer_status()
    now = datetime.utcnow()

    offers = list(offers_collection.find({
        "status": "active",
        "start_date": {"$lte": now},
        "end_date": {"$gte": now}
    }))

    eligible_offers = []
    for offer in offers:
        if offer.get("eligible_users", "all") == "all":
            eligible_offers.append(serialize_offer(offer))
            continue

        if offer.get("eligible_users") == current_user["role"]:
            eligible_offers.append(serialize_offer(offer))
            continue

        if offer.get("eligible_users") == "personalized":
            pf = offer.get("personalized_for", [])
            if isinstance(pf, list) and current_user.get("email") in pf:
                eligible_offers.append(serialize_offer(offer))

    return jsonify(eligible_offers), 200

@offers_bp.route("/products/<product_id>/offers", methods=["GET"])
def get_product_offers(product_id):
    try:
        offers = list(offers_collection.find({
            "products": {"$in": [ObjectId(product_id)]},
            "status": "active"
        }))

        serialized_offers = []
        for offer in offers:
            serialized_offers.append({
                "id": str(offer["_id"]),
                "title": offer.get("title"),
                "description": offer.get("description"),
                "discount": offer.get("discount"),
                "type": offer.get("type"),
                "min_purchase": offer.get("min_purchase"),
                "eligible_users": offer.get("eligible_users"),
                "start_date": offer.get("start_date"),
                "end_date": offer.get("end_date"),
                "image": offer.get("image"),
                "status": offer.get("status"),
            })

        return jsonify({"offers": serialized_offers}), 200
    except Exception as e:
        print("Error fetching product offers:", e)
        return jsonify({"error": str(e)}), 400



@offers_bp.route("/offers/eligible", methods=["GET"])
@token_required
def get_eligible_offers(current_user):
    update_offer_status()
    now = datetime.utcnow()
    
    offers = list(offers_collection.find({
        "status": "active",
        "start_date": {"$lte": now},
        "end_date": {"$gte": now}
    }))
    
    eligible_offers = []
    for offer in offers:
        eligible = offer.get("eligible_users", "all")

        if eligible == "all":
            eligible_offers.append(serialize_offer(offer))
        elif eligible == "personalized":
            pf = offer.get("personalized_for", [])
            if current_user.get("email") in pf:
                eligible_offers.append(serialize_offer(offer))
        else:
            # segment-based logic
            if current_user.get("segment") == eligible:  # <--- use segment field
                eligible_offers.append(serialize_offer(offer))

    return jsonify(eligible_offers), 200
'''
'''
@offers_bp.route("/products/<product_id>/offers", methods=["GET"])
def get_product_offers(product_id):
    from utils.auth_utils import verify_token  # reuse your existing helper
    from config import JWT_SECRET_KEY
    from database import users_collection
    import jwt

    current_user = None

    # ✅ Try to read token manually
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            # Decode the token properly
            data = jwt.decode(token, JWT_SECRET_KEY, algorithms=["HS256"])

            # Note: token payload has 'user_id', not 'id'
            user_id = data.get("user_id")
            if user_id:
                current_user = users_collection.find_one({"_id": ObjectId(user_id)})
        except Exception as e:
            print("Token decode failed:", e)

    # ✅ Continue logic (same as before)
    now = datetime.utcnow()
    offers = list(offers_collection.find({
        "products": {"$in": [ObjectId(product_id)]},
        "status": "active",
        "start_date": {"$lte": now},
        "end_date": {"$gte": now}
    }))

    visible_offers = []
    for o in offers:
        # 🟢 Public offers
        if o.get("eligible_users", "all") == "all":
            visible_offers.append(serialize_offer(o))
            continue

        # 🧍‍♂️ Logged-in user offers
        if current_user:
            # Match by user segment
            if o.get("eligible_users") == current_user.get("segment"):
                visible_offers.append(serialize_offer(o))
                continue

            # Match personalized email offers
            if o.get("eligible_users") == "personalized":
                pf = o.get("personalized_for", [])
                if isinstance(pf, list) and current_user.get("email") in pf:
                    visible_offers.append(serialize_offer(o))

    return jsonify({"offers": visible_offers}), 200
'''

@offers_bp.route("/products/<product_id>/offers", methods=["GET"])
def get_product_offers(product_id):
    from utils.auth_utils import verify_token
    from database import users_collection
    import jwt
    from config import JWT_SECRET_KEY

    current_user = None

    # 🧠 Try decoding JWT manually (optional login)
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        user_data = verify_token(token)
        if user_data:
            user_id = user_data.get("user_id")
            if user_id:
                current_user = users_collection.find_one({"_id": ObjectId(user_id)})
                if current_user:
                    current_user["_id"] = str(current_user["_id"])

    # ✅ Get all active offers for this product
    now = datetime.utcnow()
    offers = list(offers_collection.find({
        "products": {"$in": [ObjectId(product_id)]},
        "status": "active",
        "start_date": {"$lte": now},
        "end_date": {"$gte": now}
    }))

    visible_offers = []

    for offer in offers:
        target = offer.get("eligible_users", "all")

        # 🟢 Public offers — visible to everyone
        if target == "all":
            visible_offers.append(serialize_offer(offer))
            continue

        # 🟡 Segment-based offers
        if current_user and target == current_user.get("segment"):
            visible_offers.append(serialize_offer(offer))
            continue

        # 🔵 Personalized offers (specific email match)
        if current_user and target == "personalized":
            pf = offer.get("personalized_for", [])
            if isinstance(pf, list) and current_user.get("email") in pf:
                visible_offers.append(serialize_offer(offer))
                continue

    return jsonify({"offers": visible_offers}), 200

'''
@offers_bp.route("/offers/eligible", methods=["GET"])
@token_required
def get_eligible_offers(current_user):
    update_offer_status()
    now = datetime.utcnow()

    offers = list(offers_collection.find({
        "status": "active",
        "start_date": {"$lte": now},
        "end_date": {"$gte": now}
    }))

    eligible_offers = []
    for offer in offers:
        # Everyone
        if offer.get("eligible_users", "all") == "all":
            eligible_offers.append(serialize_offer(offer))
            continue

        # Segment-based (e.g., student, army)
        if offer.get("eligible_users") == current_user.get("segment"):
            eligible_offers.append(serialize_offer(offer))
            continue

        # Personalized by email
        if offer.get("eligible_users") == "personalized":
            pf = offer.get("personalized_for", [])
            if isinstance(pf, list) and current_user.get("email") in pf:
                eligible_offers.append(serialize_offer(offer))

    return jsonify(eligible_offers), 200
'''

@offers_bp.route("/offers/eligible", methods=["GET"])
def get_eligible_offers():
    from utils.auth_utils import verify_token
    current_user = None

    #  Try reading JWT token manually (optional)
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        user_data = verify_token(token)
        if user_data:
            from database import users_collection
            current_user = users_collection.find_one({"_id": ObjectId(user_data["user_id"])})
            if current_user:
                current_user["_id"] = str(current_user["_id"])

    #  Always update expired offers first
    update_offer_status()
    now = datetime.utcnow()

    #  Get all active offers
    offers = list(offers_collection.find({
        "status": "active",
        "start_date": {"$lte": now},
        "end_date": {"$gte": now}
    }))

    eligible_offers = []

    for offer in offers:
        target = offer.get("eligible_users", "all")

        #  Public (visible to all users)
        if target == "all":
            eligible_offers.append(serialize_offer(offer))
            continue

        #  Segment-based offers (e.g. student, army)
        if current_user and target == current_user.get("segment"):
            eligible_offers.append(serialize_offer(offer))
            continue

        #  Personalized (specific emails)
        if current_user and target == "personalized":
            pf = offer.get("personalized_for", [])
            if isinstance(pf, list) and current_user.get("email") in pf:
                eligible_offers.append(serialize_offer(offer))
                continue

    return jsonify(eligible_offers), 200


