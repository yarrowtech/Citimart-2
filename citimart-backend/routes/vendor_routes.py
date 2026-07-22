from datetime import datetime
from flask import Blueprint, request, jsonify
from bson import ObjectId
from werkzeug.security import generate_password_hash
from database import vendors_collection ,products_collection,orders_collection,users_collection
from utils.email_utils import send_email
from config import FRONTEND_URL
from utils.auth_utils import token_required
from database import reviews_collection
from werkzeug.utils import secure_filename
import os, json, uuid
import cloudinary
import cloudinary.uploader
from .product_routes import generate_sku


vendor_bp = Blueprint('vendor', __name__)

# Vendor Registration (pending approval)
@vendor_bp.route('/register', methods=['POST'])
def register_vendor():
    data = request.json
    if vendors_collection.find_one({"email": data["email"]}):
        return jsonify({"error": "Email already exists"}), 400

    vendor = {
        "name": data["name"],
        "email": data["email"],
        "phone": data["phone"],
        "business_name": data["business_name"],
        "status": "pending",
        "created_at": data.get("created_at"),
        "password": None,
        "reset_token": None
    }
    vendors_collection.insert_one(vendor)
    return jsonify({"message": "Application submitted, awaiting approval"}), 201

# Password Setup after Approval (link from email)
@vendor_bp.route('/set-password/<token>', methods=['POST'])
def set_password(token):
    data = request.json
    password = data["password"]

    vendor = vendors_collection.find_one({"reset_token": token, "status": "approved"})
    if not vendor:
        return jsonify({"error": "Invalid or expired link"}), 400

    hashed_password = generate_password_hash(password)
    vendors_collection.update_one(
        {"_id": vendor["_id"]},
        {"$set": {"password": hashed_password}, "$unset": {"reset_token": ""}}
    )
    return jsonify({"message": "Password set successfully. You can now login."}), 200


#------ Vendor added Products ---------


ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
'''
@vendor_bp.route("/add-product", methods=["POST"])
@token_required
def add_product(current_vendor):
    if current_vendor["role"] != "vendor":
        return jsonify({"error": "Unauthorized"}), 403

   

    # Get form fields
    name = request.form.get("name")
    brand = request.form.get("brand")
    price = request.form.get("price")
    discount = request.form.get("discount", 0)
    description = request.form.get("description", "")
    category = request.form.get("category")
    subcategory = request.form.get("subcategory")
    childcategory = request.form.get("childcategory")  # New field

    specifications = json.loads(request.form.get("specifications", "[]"))
    variants = json.loads(request.form.get("variants", "[]"))
    

        #  Add this block right below
    import re
    hex_pattern = re.compile(r"^#(?:[0-9a-fA-F]{3}){1,2}$")
    cleaned_variants = []
    for v in variants:
            color = v.get("color")
            size = v.get("size")
            stock = int(v.get("stock", 0))
            manual_sku = v.get("sku")

            if not color or not hex_pattern.match(color):
                continue  
            sku = manual_sku or generate_sku(name, color, size)

            cleaned_variants.append({
                "color": color,  
                "size": size,
                "stock": stock,
                "sku": sku
            })

            variants = cleaned_variants


    # Check vendor permissions
    vendor = vendors_collection.find_one({"_id": ObjectId(current_vendor["_id"])})
    if not vendor:
        return jsonify({"error": "Vendor not found"}), 404

    approved_categories = vendor.get("approved_categories", [])
    approved_subcategories = vendor.get("approved_subcategories", {})
    approved_childcategories = vendor.get("approved_childcategories", {})

    if category not in approved_categories:
        return jsonify({"error": "Not allowed in this category"}), 403
    if subcategory and subcategory not in approved_subcategories.get(category, []):
        return jsonify({"error": "Not allowed in this subcategory"}), 403
    if childcategory:
        allowed_childcats = approved_childcategories.get(subcategory, [])
        if childcategory not in allowed_childcats:
            return jsonify({"error": "Not allowed in this childcategory"}), 403

    # -------- Parse pairs_with JSON string and validate --------
    pairs_with_json = request.form.get("pairs_with", "[]")
    try:
        pairs_with = json.loads(pairs_with_json)
    except Exception:
        pairs_with = []

    valid_pairs_with = []
    for pid in pairs_with:
        try:
            prod = products_collection.find_one({"_id": ObjectId(pid)})
        except Exception:
            continue
        if not prod:
            continue
        # Check if pair product is in allowed categories/subcategories/childcategories
        prod_cat = prod.get("category")
        prod_subcat = prod.get("subcategory")
        prod_childcat = prod.get("childcategory")

        if prod_cat in approved_categories:
            if prod_subcat in approved_subcategories.get(prod_cat, []):
                allowed_childcats = approved_childcategories.get(prod_subcat, [])
                if not prod_childcat or prod_childcat in allowed_childcats:
                    valid_pairs_with.append(pid)

    pairs_with = valid_pairs_with
    

    # Upload images
    image_urls = []
    if "images" in request.files:
        files = request.files.getlist("images")
        for file in files:
            if file and allowed_file(file.filename):
             upload_result = cloudinary.uploader.upload(
                file,
                folder=f"citimart/vendors/{current_vendor['_id']}/products"
            )
            image_urls.append(upload_result["secure_url"])

    # Save product
    product = {
        "name": name,
        "brand": brand,
        "price": price,
        "discount": discount,
        "description": description,
        "category": category,
        "subcategory": subcategory,
        "childcategory": childcategory,
        "approved_categories": approved_categories,
        "approved_subcategories": approved_subcategories.get(category, []),
        "approved_childcategories": approved_childcategories.get(subcategory, []),

        "specifications": specifications,
        "variants": variants,
        "images": image_urls,
        "pairs_with": pairs_with,   
        "added_by": "vendor",
        "vendor_id": str(current_vendor["_id"]),
        "status": "pending", 
        "created_at": datetime.utcnow(),
    }

    products_collection.insert_one(product)

    return jsonify({"success": True, "message": "Product submitted successfully"}), 201
'''


@vendor_bp.route("/add-product", methods=["POST"])
@token_required
def add_product(current_vendor):
    if current_vendor["role"] != "vendor":
        return jsonify({"error": "Unauthorized"}), 403

    name = request.form.get("name")
    brand = request.form.get("brand")
    price = request.form.get("price")
    discount = request.form.get("discount", 0)
    description = request.form.get("description", "")
    category = request.form.get("category")
    subcategory = request.form.get("subcategory")
    childcategory = request.form.get("childcategory")

    specifications = json.loads(request.form.get("specifications", "[]"))
    variants = json.loads(request.form.get("variants", "[]"))

    import re
    hex_pattern = re.compile(r"^#(?:[0-9a-fA-F]{3}){1,2}$")
    cleaned_variants = []
    for v in variants:
        color_hex = v.get("colorHex", v.get("color", ""))
        color_name = v.get("colorName", v.get("color", ""))
        size = v.get("size")
        stock = int(v.get("stock", 0))
        manual_sku = v.get("sku")

        if not color_hex or not hex_pattern.match(color_hex):
            continue

        sku = manual_sku or generate_sku(name, color_name, size)

        variant = {
            "color": color_name,              # backward compat
            "colorName": color_name,          # "Navy Blue"
            "colorHex": color_hex,            # "#1a237e"
            "size": size,
            "stock": stock,
            "sku": sku,
        }
        m = v.get("measurements", {})  # ← read the nested object
        measurements = {
    "chest":    str(m.get("chest",    "")),
    "waist":    str(m.get("waist",    "")),
    "hips":     str(m.get("hips",     "")),
    "shoulder": str(m.get("shoulder", "")),
    "length":   str(m.get("length",   "")),
         }
        if any(measurements.values()):
            variant["measurements"] = measurements
        cleaned_variants.append(variant)

    variants = cleaned_variants

    vendor = vendors_collection.find_one({"_id": ObjectId(current_vendor["_id"])})
    if not vendor:
        return jsonify({"error": "Vendor not found"}), 404

    approved_categories = vendor.get("approved_categories", [])
    approved_subcategories = vendor.get("approved_subcategories", {})
    approved_childcategories = vendor.get("approved_childcategories", {})

    if category not in approved_categories:
        return jsonify({"error": "Not allowed in this category"}), 403
    if subcategory and subcategory not in approved_subcategories.get(category, []):
        return jsonify({"error": "Not allowed in this subcategory"}), 403
    if childcategory:
        allowed_childcats = approved_childcategories.get(subcategory, [])
        if childcategory not in allowed_childcats:
            return jsonify({"error": "Not allowed in this childcategory"}), 403

    pairs_with_json = request.form.get("pairs_with", "[]")
    try:
        pairs_with = json.loads(pairs_with_json)
    except Exception:
        pairs_with = []

    valid_pairs_with = []
    for pid in pairs_with:
        try:
            prod = products_collection.find_one({"_id": ObjectId(pid)})
        except Exception:
            continue
        if not prod:
            continue
        prod_cat = prod.get("category")
        prod_subcat = prod.get("subcategory")
        prod_childcat = prod.get("childcategory")

        if prod_cat in approved_categories:
            if prod_subcat in approved_subcategories.get(prod_cat, []):
                allowed_childcats = approved_childcategories.get(prod_subcat, [])
                if not prod_childcat or prod_childcat in allowed_childcats:
                    valid_pairs_with.append(pid)

    pairs_with = valid_pairs_with

    image_urls = []
    if "images" in request.files:
        files = request.files.getlist("images")
        for file in files:
            if file and allowed_file(file.filename):
                upload_result = cloudinary.uploader.upload(
                    file,
                    folder=f"citimart/vendors/{current_vendor['_id']}/products"
                )
                image_urls.append(upload_result["secure_url"])

    product = {
        "name": name,
        "brand": brand,
        "price": price,
        "discount": discount,
        "description": description,
        "category": category,
        "subcategory": subcategory,
        "childcategory": childcategory,
        "approved_categories": approved_categories,
        "approved_subcategories": approved_subcategories.get(category, []),
        "approved_childcategories": approved_childcategories.get(subcategory, []),
        "specifications": specifications,
        "variants": variants,
        "images": image_urls,
        "pairs_with": pairs_with,
        "added_by": "vendor",
        "vendor_id": str(current_vendor["_id"]),
        "status": "pending",
        "created_at": datetime.utcnow(),
    }

    result = products_collection.insert_one(product)

    return jsonify({"success": True, "message": "Product submitted successfully", "product_id": str(result.inserted_id)}), 201




# Request New Category



@vendor_bp.route("/request-category", methods=["POST"])
@token_required
def request_category(current_user):
    try:
        data = request.get_json()

        selections = data.get("selections", [])
        note = data.get("note", "")

        if not selections:
            return jsonify({"error": "At least one selection is required"}), 400

        request_entries = []
        for sel in selections:
            category_name = sel.get("category")
            subcategory_name = sel.get("subCategory")
            child_category_name = sel.get("childCategory")

            if not category_name:
                continue

            request_entries.append({
                "category": category_name,
                "subcategory": subcategory_name,
                "child_category": child_category_name,
                "note": note,
                "status": "pending",
                "requested_at": datetime.utcnow()
            })

        if not request_entries:
            return jsonify({"error": "No valid selections provided"}), 400

        # Push into vendor doc
        vendors_collection.update_one(
            {"_id": ObjectId(current_user["_id"])}, 
            {"$push": {"pending_category_requests": {"$each": request_entries}}}
        )

        return jsonify({"message": "Category requests sent to admin"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


#  Update own product
'''
@vendor_bp.route("/update-product/<product_id>", methods=["PUT"])
@token_required
def update_product(current_vendor, product_id):
    if current_vendor["role"] != "vendor":
        return jsonify({"error": "Unauthorized"}), 403

    vendor_id = str(current_vendor["_id"])

    product = products_collection.find_one(
        {"_id": ObjectId(product_id), "vendor_id": vendor_id}
    )
    if not product:
        return jsonify({"error": "Product not found or you don't have permission"}), 404

    data = request.form.to_dict()  # or request.json if sending JSON

    # Parse fields, fallback to existing if not provided
    name = data.get("name", product.get("name"))
    brand = data.get("brand", product.get("brand"))
    price = data.get("price", product.get("price"))
    discount = data.get("discount", product.get("discount"))
    description = data.get("description", product.get("description"))
    category = data.get("category", product.get("category"))
    subcategory = data.get("subcategory", product.get("subcategory"))
    childcategory = data.get("childcategory", product.get("childcategory"))

    # Parse JSON fields
    try:
        specifications = json.loads(
            data.get("specifications", json.dumps(product.get("specifications", [])))
        )
    except Exception:
        specifications = product.get("specifications", [])

    try:
        variants = json.loads(
            data.get("variants", json.dumps(product.get("variants", [])))
        )
    except Exception:
        variants = product.get("variants", [])

    # --- Safe int helper ---
    def safe_int(value, default=0):
        try:
            return int(value)
        except (TypeError, ValueError):
            return default

    # Clean variants
    import re
    hex_pattern = re.compile(r"^#(?:[0-9a-fA-F]{3}){1,2}$")
    cleaned_variants = []
    for v in variants:
        color = v.get("color")
        size = v.get("size")
        stock = safe_int(v.get("stock"), 0)   # ✅ safe conversion
        
        # Only keep if color is a valid hex code
        if not color or not hex_pattern.match(color):
            continue

        manual_sku = v.get("sku")  # vendor-typed SKU from frontend

# ✅ Generate or keep SKU
        existing_sku = v.get("sku") or generate_sku(name, color, size)

        cleaned_variants.append({
           "color": color,
           "size": size,
           "stock": stock,
           "sku": manual_sku or existing_sku
        })


    variants = cleaned_variants

    # Check vendor permissions
    vendor = vendors_collection.find_one({"_id": ObjectId(current_vendor["_id"])})
    if not vendor:
        return jsonify({"error": "Vendor not found"}), 404

    approved_categories = vendor.get("approved_categories", [])
    approved_subcategories = vendor.get("approved_subcategories", {})
    approved_childcategories = vendor.get("approved_childcategories", {})

    if category not in approved_categories:
        return jsonify({"error": "Not allowed in this category"}), 403
    if subcategory and subcategory not in approved_subcategories.get(category, []):
        return jsonify({"error": "Not allowed in this subcategory"}), 403
    if childcategory:
        allowed_childcats = approved_childcategories.get(subcategory, [])
        if childcategory not in allowed_childcats:
            return jsonify({"error": "Not allowed in this childcategory"}), 403

    # Parse and validate pairs_with
    pairs_with_json = data.get("pairs_with", None)
    if pairs_with_json is not None:
        try:
            pairs_with = json.loads(pairs_with_json)
        except Exception:
            pairs_with = []

        valid_pairs_with = []
        for pid in pairs_with:
            try:
                prod = products_collection.find_one({"_id": ObjectId(pid)})
            except Exception:
                continue
            if not prod:
                continue
            prod_cat = prod.get("category")
            prod_subcat = prod.get("subcategory")
            prod_childcat = prod.get("childcategory")

            if prod_cat in approved_categories:
                if prod_subcat in approved_subcategories.get(prod_cat, []):
                    allowed_childcats = approved_childcategories.get(prod_subcat, [])
                    if not prod_childcat or prod_childcat in allowed_childcats:
                        valid_pairs_with.append(pid)
    else:
        valid_pairs_with = product.get("pairs_with", [])

    # Handle images update
    image_urls = product.get("images", [])
    if "images" in request.files:
        files = request.files.getlist("images")
        for file in files:
            if file and allowed_file(file.filename):
                upload_result = cloudinary.uploader.upload(
                    file,
                    folder=f"citimart/vendors/{vendor_id}/products"
                )
                image_urls.append(upload_result["secure_url"])

    # Prepare update document
    updated_data = {
        "name": name,
        "brand": brand,
        "price": price,
        "discount": discount,
        "description": description,
        "category": category,
        "subcategory": subcategory,
        "childcategory": childcategory,
        "approved_categories": approved_categories,
        "approved_subcategories": approved_subcategories.get(category, []),
        "approved_childcategories": approved_childcategories.get(subcategory, []),

        "specifications": specifications,
        "variants": variants,
        "images": image_urls,
        "pairs_with": valid_pairs_with,
        "updated_at": datetime.utcnow(),
    }

    products_collection.update_one(
        {"_id": ObjectId(product_id)}, {"$set": updated_data}
    )

    return jsonify({"success": True, "message": "Product updated successfully"}), 200
'''

@vendor_bp.route("/update-product/<product_id>", methods=["PUT"])
@token_required
def update_product(current_vendor, product_id):
    if current_vendor["role"] != "vendor":
        return jsonify({"error": "Unauthorized"}), 403

    vendor_id = str(current_vendor["_id"])

    product = products_collection.find_one(
        {"_id": ObjectId(product_id), "vendor_id": vendor_id}
    )
    if not product:
        return jsonify({"error": "Product not found or you don't have permission"}), 404

    data = request.form.to_dict()

    name = data.get("name", product.get("name"))
    brand = data.get("brand", product.get("brand"))
    price = data.get("price", product.get("price"))
    discount = data.get("discount", product.get("discount"))
    description = data.get("description", product.get("description"))
    category = data.get("category", product.get("category"))
    subcategory = data.get("subcategory", product.get("subcategory"))
    childcategory = data.get("childcategory", product.get("childcategory"))

    try:
        specifications = json.loads(
            data.get("specifications", json.dumps(product.get("specifications", [])))
        )
    except Exception:
        specifications = product.get("specifications", [])

    try:
        variants = json.loads(
            data.get("variants", json.dumps(product.get("variants", [])))
        )
    except Exception:
        variants = product.get("variants", [])

    def safe_int(value, default=0):
        try:
            return int(value)
        except (TypeError, ValueError):
            return default

    import re
    hex_pattern = re.compile(r"^#(?:[0-9a-fA-F]{3}){1,2}$")
    cleaned_variants = []
    for v in variants:
        color_hex = v.get("colorHex", v.get("color", ""))
        color_name = v.get("colorName", v.get("color", ""))
        size = v.get("size")
        stock = safe_int(v.get("stock"), 0)

        if not color_hex or not hex_pattern.match(color_hex):
            continue

        manual_sku = v.get("sku")
        existing_sku = manual_sku or generate_sku(name, color_name, size)

        variant = {
            "color": color_name,              # backward compat
            "colorName": color_name,          # "Navy Blue"
            "colorHex": color_hex,            # "#1a237e"
            "size": size,
            "stock": stock,
            "sku": manual_sku or existing_sku,
        }
        m = v.get("measurements", {})  # ← read the nested object
        measurements = {
    "chest":    str(m.get("chest",    "")),
    "waist":    str(m.get("waist",    "")),
    "hips":     str(m.get("hips",     "")),
    "shoulder": str(m.get("shoulder", "")),
    "length":   str(m.get("length",   "")),
        }
        if any(measurements.values()):
            variant["measurements"] = measurements
        cleaned_variants.append(variant)

    variants = cleaned_variants

    vendor = vendors_collection.find_one({"_id": ObjectId(current_vendor["_id"])})
    if not vendor:
        return jsonify({"error": "Vendor not found"}), 404

    approved_categories = vendor.get("approved_categories", [])
    approved_subcategories = vendor.get("approved_subcategories", {})
    approved_childcategories = vendor.get("approved_childcategories", {})

    if category not in approved_categories:
        return jsonify({"error": "Not allowed in this category"}), 403
    if subcategory and subcategory not in approved_subcategories.get(category, []):
        return jsonify({"error": "Not allowed in this subcategory"}), 403
    if childcategory:
        allowed_childcats = approved_childcategories.get(subcategory, [])
        if childcategory not in allowed_childcats:
            return jsonify({"error": "Not allowed in this childcategory"}), 403

    pairs_with_json = data.get("pairs_with", None)
    if pairs_with_json is not None:
        try:
            pairs_with = json.loads(pairs_with_json)
        except Exception:
            pairs_with = []

        valid_pairs_with = []
        for pid in pairs_with:
            try:
                prod = products_collection.find_one({"_id": ObjectId(pid)})
            except Exception:
                continue
            if not prod:
                continue
            prod_cat = prod.get("category")
            prod_subcat = prod.get("subcategory")
            prod_childcat = prod.get("childcategory")

            if prod_cat in approved_categories:
                if prod_subcat in approved_subcategories.get(prod_cat, []):
                    allowed_childcats = approved_childcategories.get(prod_subcat, [])
                    if not prod_childcat or prod_childcat in allowed_childcats:
                        valid_pairs_with.append(pid)
    else:
        valid_pairs_with = product.get("pairs_with", [])

    image_urls = product.get("images", [])
    if "images" in request.files:
        files = request.files.getlist("images")
        for file in files:
            if file and allowed_file(file.filename):
                upload_result = cloudinary.uploader.upload(
                    file,
                    folder=f"citimart/vendors/{vendor_id}/products"
                )
                image_urls.append(upload_result["secure_url"])

    updated_data = {
        "name": name,
        "brand": brand,
        "price": price,
        "discount": discount,
        "description": description,
        "category": category,
        "subcategory": subcategory,
        "childcategory": childcategory,
        "approved_categories": approved_categories,
        "approved_subcategories": approved_subcategories.get(category, []),
        "approved_childcategories": approved_childcategories.get(subcategory, []),
        "specifications": specifications,
        "variants": variants,
        "images": image_urls,
        "pairs_with": valid_pairs_with,
        "updated_at": datetime.utcnow(),
    }

    products_collection.update_one(
        {"_id": ObjectId(product_id)}, {"$set": updated_data}
    )

    return jsonify({"success": True, "message": "Product updated successfully"}), 200

from bson.errors import InvalidId

#  Delete own product
@vendor_bp.route("/delete-product/<product_id>", methods=["DELETE"])
@token_required
def delete_product(current_user, product_id):
    if current_user["role"] != "vendor":
        return jsonify({"error": "Access denied"}), 403

    vendor_id = str(current_user["_id"])

    # ✅ Step 1: make sure product_id is valid
    try:
        obj_id = ObjectId(product_id)
    except InvalidId:
        return jsonify({"error": "Invalid product ID"}), 400

    # ✅ Step 2: check if product exists
    product = products_collection.find_one({"_id": obj_id})
    if not product:
        return jsonify({"error": "Product not found"}), 404

    # ✅ Step 3: check if vendor owns it
    if product.get("vendor_id") != vendor_id:
        return jsonify({"error": "You are not the owner of this product"}), 403

    # ✅ Step 4: perform delete
    result = products_collection.delete_one({"_id": obj_id, "vendor_id": vendor_id})

    if result.deleted_count == 0:
        return jsonify({"error": "Failed to delete product"}), 500

    return jsonify({"message": "Product deleted successfully"}), 200

#------- Vendor-Orders -------------------------

@vendor_bp.route('/my-orders', methods=['GET'])
@token_required
def get_vendor_orders(current_vendor):
    if current_vendor["role"] != "vendor":
        return jsonify({"error": "Unauthorized"}), 403

    vendor_id = current_vendor["_id"]

    orders = list(orders_collection.find({
        "order_items.vendor_id": vendor_id
    }).sort("created_at", -1))

    result = []
    for order in orders:
        vendor_products = [
            item for item in order["order_items"] 
            if item.get("vendor_id") == vendor_id
        ]

        # Get customer name (optional)
        customer = users_collection.find_one({"_id": ObjectId(order.get("customer_id"))})
        customer_name = customer.get("name") if customer else "Unknown"

        result.append({
            "_id": str(order["_id"]),
            "customer_id": order.get("customer_id"),
            "customer_name": customer_name,
            "customer_phone": order.get("phone"),
            "customer_address": order.get("address"),
            "products": vendor_products,
            "vendor_total": sum(item["price"] * item["quantity"] for item in vendor_products),
            "payment": order.get("payment_method", "COD"),
            "status": order.get("status"),
            "date": order.get("created_at").strftime("%Y-%m-%d %H:%M:%S") if order.get("created_at") else ""
        })

    return jsonify({"orders": result}), 200




@vendor_bp.route('/delete-order/<order_id>', methods=['DELETE'])
@token_required
def delete_order(current_vendor, order_id):
    order = orders_collection.find_one({"_id": ObjectId(order_id)})
    if not order:
        return jsonify({"error": "Order not found"}), 404

    # Allow deletion only if vendor's products exist in the order
    vendor_products = [p for p in order.get("order_items", []) if p.get("vendor_id") == str(current_vendor["_id"])]
    if not vendor_products:
        return jsonify({"error": "You are not authorized to delete this order."}), 403

    orders_collection.delete_one({"_id": ObjectId(order_id)})
    return jsonify({"message": "Order deleted successfully"})



@vendor_bp.route('/update-order/<order_id>', methods=['PUT'])
@token_required
def update_order(current_vendor, order_id):
    data = request.json
    new_status = data.get("status")

    if not new_status:
        return jsonify({"error": "Status is required"}), 400

    order = orders_collection.find_one({"_id": ObjectId(order_id)})
    if not order:
        return jsonify({"error": "Order not found"}), 404

    # Check if this vendor has products in this order
    vendor_products = [p for p in order.get("order_items", []) if p.get("vendor_id") == str(current_vendor["_id"])]
    if not vendor_products:
        return jsonify({"error": "Unauthorized"}), 403

    orders_collection.update_one({"_id": ObjectId(order_id)}, {"$set": {"status": new_status}})
    return jsonify({"message": "Order status updated to " + new_status})


'''
@vendor_bp.route('/analytics', methods=['GET'])
@token_required
def vendor_analytics(current_vendor):
    if current_vendor["role"] != "vendor":
        return jsonify({"error": "Unauthorized"}), 403

    vendor_id = current_vendor["_id"]

    products = list(products_collection.find({"vendor_id": vendor_id}))
    orders = list(orders_collection.find({
        "order_items": {"$elemMatch": {"vendor_id": vendor_id}}
    }))

    total_sales = 0
    units_sold = 0
    sales_trend = [0] * 7
    trend_labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

    for order in orders:
        order_day = order["created_at"].weekday()
        for item in order["order_items"]:
            if str(item["vendor_id"]) == str(vendor_id):
                price = item["price"]
                qty = item["quantity"]
                total_sales += price * qty
                units_sold += qty
                sales_trend[order_day] += price * qty

    top_days = [{"day": trend_labels[i], "sales": sales_trend[i]} for i in range(7) if sales_trend[i] > 0]

    # Product Performance
    top_selling, low_performing, out_of_stock = [], [], []
    total_sold, total_returned = 0, 5  

    for product in products:
        sold = sum(
            item["quantity"]
            for order in orders
            for item in order["order_items"]
            if str(item.get("_id")) == str(product["_id"])
        )
        total_sold += sold

        if sold > 10:
            top_selling.append({"name": product["name"], "qty": sold, "revenue": sold * product["price"]})
        elif sold < 3:
            low_performing.append({"name": product["name"], "qty": sold, "revenue": sold * product["price"]})

        stock = sum([v.get("stock", 0) for v in product.get("variants", [])])
        if stock == 0:
            out_of_stock.append({"name": product["name"], "stock": 0})

    deductions = total_sales * 0.05
    net_payout = total_sales - deductions

    analytics_data = {
        "salesOverview": {
            "totalSales": total_sales,
            "unitsSold": units_sold,
            "trend": sales_trend,
            "trendLabels": trend_labels,
            "topDays": top_days
        },
        "productPerformance": {
            "topSelling": top_selling,
            "lowPerforming": low_performing,
            "outOfStock": out_of_stock,
            "totalSold": total_sold,
            "totalReturned": total_returned
        },
        "customerInsights": {
            "new": 10,
            "returning": 20,
            "avgOrderValue": total_sales / len(orders) if orders else 0,
            "ratings": 4.5,
            "reviews": reviews_collection.count_documents({"vendor_id": vendor_id}),
            "topLocations": [{"city": "Mumbai", "count": 15}, {"city": "Delhi", "count": 10}]
        },
        "orderAnalytics": {
            "total": len(orders),
            "status": {"pending": 2, "delivered": 15, "canceled": 1, "returned": 1},
            "fulfillmentRate": 95,
            "avgDelivery": 3.2
        },
        "earningsOverview": {
            "total": total_sales,
            "deductions": deductions,
            "netPayout": net_payout,
            "payoutHistory": [
                {"date": "2025-06-01", "amount": 12000, "status": "Paid"},
                {"date": "2025-05-01", "amount": 11000, "status": "Paid"},
            ]
        },
        "returnsComplaints": {
            "reasons": [{"reason": "Size Issue", "count": 2}, {"reason": "Damaged Item", "count": 2}, {"reason": "Wrong Product", "count": 1}],
            "complaints": [{"category": "Late Delivery", "count": 1}, {"category": "Damaged Item", "count": 1}],
            "resolved": 4,
            "pending": 1
        },
        "stockInsights": {
            "totalSKUs": len(products),
            "lowStock": sum(1 for p in products if 0 < sum(v.get("stock", 0) for v in p.get("variants", [])) < 5),
            "outOfStock": len(out_of_stock),
            "restockSuggestions": [{"name": p["name"], "suggestion": "Restock soon"} for p in out_of_stock],
        },
        "marketingEngagement": {
            "adROI": 2.5,
            "promotions": [{"name": "Summer Sale", "performance": "High"}, {"name": "Clearance", "performance": "Medium"}],
            "wishlist": [{"name": "Sneakers", "count": 10}, {"name": "T-Shirt", "count": 10}]
        }
    }

    return jsonify(analytics_data), 200
'''
'''
@vendor_bp.route('/analytics', methods=['GET'])
@token_required
def vendor_analytics(current_vendor):
    if current_vendor["role"] != "vendor":
        return jsonify({"error": "Unauthorized"}), 403

    vendor_id = current_vendor["_id"]

    products = list(products_collection.find({"vendor_id": vendor_id}))
    orders = list(orders_collection.find({
        "order_items": {"$elemMatch": {"vendor_id": vendor_id}}
    }))

    total_sales = 0
    units_sold = 0
    sales_trend = [0] * 7
    trend_labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

    for order in orders:
        order_day = order["created_at"].weekday()
        for item in order["order_items"]:
            if str(item["vendor_id"]) == str(vendor_id):
                price = item["price"]
                qty = item["quantity"]
                total_sales += price * qty
                units_sold += qty
                sales_trend[order_day] += price * qty

    top_days = [{"day": trend_labels[i], "sales": sales_trend[i]} for i in range(7) if sales_trend[i] > 0]

    # Helper to safely calculate stock across various structures
    def safe_stock(product):
        total = 0
        for v in product.get("variants", []):
            if isinstance(v, dict):
                val = v.get("stock", 0)
                if isinstance(val, (int, float)):
                    total += val
                elif isinstance(val, dict):
                    for sub in val.values():
                        if isinstance(sub, dict) and isinstance(sub.get("stock", 0), (int, float)):
                            total += sub.get("stock", 0)
        return total

    # Product Performance
    top_selling, low_performing, out_of_stock = [], [], []
    total_sold, total_returned = 0, 5  

    for product in products:
        sold = sum(
            item["quantity"]
            for order in orders
            for item in order["order_items"]
            if str(item.get("_id")) == str(product["_id"])
        )
        total_sold += sold

        if sold > 10:
            top_selling.append({"name": product["name"], "qty": sold, "revenue": sold * product["price"]})
        elif sold < 3:
            low_performing.append({"name": product["name"], "qty": sold, "revenue": sold * product["price"]})

        # ✅ Fixed stock calculation
        stock = safe_stock(product)
        if stock == 0:
            out_of_stock.append({"name": product["name"], "stock": 0})

    deductions = total_sales * 0.05
    net_payout = total_sales - deductions

    analytics_data = {
        "salesOverview": {
            "totalSales": total_sales,
            "unitsSold": units_sold,
            "trend": sales_trend,
            "trendLabels": trend_labels,
            "topDays": top_days
        },
        "productPerformance": {
            "topSelling": top_selling,
            "lowPerforming": low_performing,
            "outOfStock": out_of_stock,
            "totalSold": total_sold,
            "totalReturned": total_returned
        },
        "customerInsights": {
            "new": 10,
            "returning": 20,
            "avgOrderValue": total_sales / len(orders) if orders else 0,
            "ratings": 4.5,
            "reviews": reviews_collection.count_documents({"vendor_id": vendor_id}),
            "topLocations": [{"city": "Mumbai", "count": 15}, {"city": "Delhi", "count": 10}]
        },
        "orderAnalytics": {
            "total": len(orders),
            "status": {"pending": 2, "delivered": 15, "canceled": 1, "returned": 1},
            "fulfillmentRate": 95,
            "avgDelivery": 3.2
        },
        "earningsOverview": {
            "total": total_sales,
            "deductions": deductions,
            "netPayout": net_payout,
            "payoutHistory": [
                {"date": "2025-06-01", "amount": 12000, "status": "Paid"},
                {"date": "2025-05-01", "amount": 11000, "status": "Paid"},
            ]
        },
        "returnsComplaints": {
            "reasons": [
                {"reason": "Size Issue", "count": 2},
                {"reason": "Damaged Item", "count": 2},
                {"reason": "Wrong Product", "count": 1}
            ],
            "complaints": [
                {"category": "Late Delivery", "count": 1},
                {"category": "Damaged Item", "count": 1}
            ],
            "resolved": 4,
            "pending": 1
        },
        "stockInsights": {
            "totalSKUs": len(products),
            "lowStock": sum(1 for p in products if 0 < safe_stock(p) < 5),
            "outOfStock": len(out_of_stock),
            "restockSuggestions": [
                {"name": p["name"], "suggestion": "Restock soon"} for p in out_of_stock
            ],
        },
        "marketingEngagement": {
            "adROI": 2.5,
            "promotions": [
                {"name": "Summer Sale", "performance": "High"},
                {"name": "Clearance", "performance": "Medium"}
            ],
            "wishlist": [
                {"name": "Sneakers", "count": 10},
                {"name": "T-Shirt", "count": 10}
            ]
        }
    }

    return jsonify(analytics_data), 200
'''

'''
@vendor_bp.route('/analytics', methods=['GET'])
@token_required
def vendor_analytics(current_vendor):
    if current_vendor["role"] != "vendor":
        return jsonify({"error": "Unauthorized"}), 403

    vendor_id = current_vendor["_id"]

    products = list(products_collection.find({"vendor_id": vendor_id}))
    orders = list(orders_collection.find({
        "order_items": {"$elemMatch": {"vendor_id": vendor_id}}
    }))

    total_sales = 0
    units_sold = 0
    sales_trend = [0] * 7
    trend_labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

    # --- Process orders and sales trend ---
    for order in orders:
        created_at = order.get("created_at")
        if isinstance(created_at, str):
            try:
                # Parse ISO date string from MongoDB
                created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            except Exception as e:
                print("Invalid date:", created_at, e)
                continue
        elif not isinstance(created_at, datetime):
            continue

        order_day = created_at.weekday()  # 0 = Monday
        for item in order.get("order_items", []):
            if str(item.get("vendor_id")) == str(vendor_id):
                price = item.get("price", 0)
                qty = item.get("quantity", 0)
                total_sales += price * qty
                units_sold += qty
                sales_trend[order_day] += price * qty

    top_days = [{"day": trend_labels[i], "sales": sales_trend[i]} for i in range(7) if sales_trend[i] > 0]

    # --- Helper function for safe stock calculation ---
    def safe_stock(product):
        total = 0
        for v in product.get("variants", []):
            if isinstance(v, dict):
                val = v.get("stock", 0)
                if isinstance(val, (int, float)):
                    total += val
                elif isinstance(val, dict):
                    for sub in val.values():
                        if isinstance(sub, dict) and isinstance(sub.get("stock", 0), (int, float)):
                            total += sub.get("stock", 0)
        return total

    # --- Product Performance ---
    top_selling, low_performing, out_of_stock = [], [], []
    total_sold, total_returned = 0, 5

    for product in products:
        sold = sum(
            item.get("quantity", 0)
            for order in orders
            for item in order.get("order_items", [])
            if str(item.get("_id")) == str(product["_id"])
        )
        total_sold += sold

        if sold > 10:
            top_selling.append({"name": product["name"], "qty": sold, "revenue": sold * product.get("price", 0)})
        elif sold < 3:
            low_performing.append({"name": product["name"], "qty": sold, "revenue": sold * product.get("price", 0)})

        stock = safe_stock(product)
        if stock == 0:
            out_of_stock.append({"name": product["name"], "stock": 0})

    deductions = total_sales * 0.05
    net_payout = total_sales - deductions

    analytics_data = {
        "salesOverview": {
            "totalSales": total_sales,
            "unitsSold": units_sold,
            "trend": sales_trend,
            "trendLabels": trend_labels,
            "topDays": top_days
        },
        "productPerformance": {
            "topSelling": top_selling,
            "lowPerforming": low_performing,
            "outOfStock": out_of_stock,
            "totalSold": total_sold,
            "totalReturned": total_returned
        },
        "customerInsights": {
            "new": 10,
            "returning": 20,
            "avgOrderValue": total_sales / len(orders) if orders else 0,
            "ratings": 4.5,
            "reviews": reviews_collection.count_documents({"vendor_id": vendor_id}),
            "topLocations": [{"city": "Mumbai", "count": 15}, {"city": "Delhi", "count": 10}]
        },
        "orderAnalytics": {
            "total": len(orders),
            "status": {"pending": 2, "delivered": 15, "canceled": 1, "returned": 1},
            "fulfillmentRate": 95,
            "avgDelivery": 3.2
        },
        "earningsOverview": {
            "total": total_sales,
            "deductions": deductions,
            "netPayout": net_payout,
            "payoutHistory": [
                {"date": "2025-06-01", "amount": 12000, "status": "Paid"},
                {"date": "2025-05-01", "amount": 11000, "status": "Paid"},
            ]
        },
        "returnsComplaints": {
            "reasons": [
                {"reason": "Size Issue", "count": 2},
                {"reason": "Damaged Item", "count": 2},
                {"reason": "Wrong Product", "count": 1}
            ],
            "complaints": [
                {"category": "Late Delivery", "count": 1},
                {"category": "Damaged Item", "count": 1}
            ],
            "resolved": 4,
            "pending": 1
        },
        "stockInsights": {
            "totalSKUs": len(products),
            "lowStock": sum(1 for p in products if 0 < safe_stock(p) < 5),
            "outOfStock": len(out_of_stock),
            "restockSuggestions": [
                {"name": p["name"], "suggestion": "Restock soon"} for p in out_of_stock
            ],
        },
        "marketingEngagement": {
            "adROI": 2.5,
            "promotions": [
                {"name": "Summer Sale", "performance": "High"},
                {"name": "Clearance", "performance": "Medium"}
            ],
            "wishlist": [
                {"name": "Sneakers", "count": 10},
                {"name": "T-Shirt", "count": 10}
            ]
        }
    }

    return jsonify(analytics_data), 200
'''
@vendor_bp.route('/analytics', methods=['GET'])
@token_required
def vendor_analytics(current_vendor):
    if current_vendor["role"] != "vendor":
        return jsonify({"error": "Unauthorized"}), 403

    vendor_id = current_vendor["_id"]

    products = list(products_collection.find({"vendor_id": vendor_id}))
    orders = list(orders_collection.find({
        "order_items": {"$elemMatch": {"vendor_id": vendor_id}}
    }))

    total_sales = 0
    units_sold = 0
    sales_trend = [0] * 7
    trend_labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

    for order in orders:
        created_at = order.get("created_at")
        if not created_at:
            continue
        if isinstance(created_at, str):
            try:
                created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            except Exception:
                continue
        elif not isinstance(created_at, datetime):
            continue

        order_day = created_at.weekday()
        for item in order.get("order_items", []):
            if str(item.get("vendor_id")) == str(vendor_id):
                price = item.get("price", 0)
                qty = item.get("quantity", 0)
                total_sales += price * qty
                units_sold += qty
                sales_trend[order_day] += price * qty

    top_days = [{"day": trend_labels[i], "sales": sales_trend[i]} for i in range(7) if sales_trend[i] > 0]

    # Chart-friendly trend data
    sales_trend_data = [
        {"day": trend_labels[i], "sales": sales_trend[i]}
        for i in range(7)
    ]

    # Helper to safely count stock
    def safe_stock(product):
        total = 0
        for v in product.get("variants", []):
            if isinstance(v, dict):
                val = v.get("stock", 0)
                if isinstance(val, (int, float)):
                    total += val
                elif isinstance(val, dict):
                    for sub in val.values():
                        if isinstance(sub, dict) and isinstance(sub.get("stock", 0), (int, float)):
                            total += sub.get("stock", 0)
        return total

    # Product stats
    top_selling, low_performing, out_of_stock = [], [], []
    total_sold, total_returned = 0, 5

    for product in products:
        sold = sum(
            item.get("quantity", 0)
            for order in orders
            for item in order.get("order_items", [])
            if str(item.get("_id")) == str(product["_id"])
        )
        total_sold += sold

        if sold > 10:
            top_selling.append({"name": product["name"], "qty": sold, "revenue": sold * product.get("price", 0)})
        elif sold < 3:
            low_performing.append({"name": product["name"], "qty": sold, "revenue": sold * product.get("price", 0)})

        stock = safe_stock(product)
        if stock == 0:
            out_of_stock.append({"name": product["name"], "stock": 0})

    deductions = total_sales * 0.05
    net_payout = total_sales - deductions

    analytics_data = {
        "salesOverview": {
            "totalSales": total_sales,
            "unitsSold": units_sold,
            "trend": sales_trend,               # ✅ keep for backward compatibility
            "trendLabels": trend_labels,        # ✅ used by your old frontend
            "trendData": sales_trend_data,      # ✅ new frontend-friendly version
            "topDays": top_days
        },
        "productPerformance": {
            "topSelling": top_selling,
            "lowPerforming": low_performing,
            "outOfStock": out_of_stock,
            "totalSold": total_sold,
            "totalReturned": total_returned
        },
        "customerInsights": {
            "new": 10,
            "returning": 20,
            "avgOrderValue": total_sales / len(orders) if orders else 0,
            "ratings": 4.5,
            "reviews": 12,
            "topLocations": [{"city": "Mumbai", "count": 15}, {"city": "Delhi", "count": 10}]
        },
        "orderAnalytics": {
            "total": len(orders),
            "status": {"pending": 2, "delivered": 15, "canceled": 1, "returned": 1},
            "fulfillmentRate": 95,
            "avgDelivery": 3.2
        },
        "earningsOverview": {
            "total": total_sales,
            "deductions": deductions,
            "netPayout": net_payout,
            "payoutHistory": [
                {"date": "2025-06-01", "amount": 12000, "status": "Paid"},
                {"date": "2025-05-01", "amount": 11000, "status": "Paid"},
            ]
        },
        "returnsComplaints": {
            "reasons": [
                {"reason": "Size Issue", "count": 2},
                {"reason": "Damaged Item", "count": 2},
                {"reason": "Wrong Product", "count": 1}
            ],
            "complaints": [
                {"category": "Late Delivery", "count": 1},
                {"category": "Damaged Item", "count": 1}
            ],
            "resolved": 4,
            "pending": 1
        },
        "stockInsights": {
            "totalSKUs": len(products),
            "lowStock": sum(1 for p in products if 0 < safe_stock(p) < 5),
            "outOfStock": len(out_of_stock),
            "restockSuggestions": [
                {"name": p["name"], "suggestion": "Restock soon"} for p in out_of_stock
            ],
        },
        "marketingEngagement": {
            "adROI": 2.5,
            "promotions": [
                {"name": "Summer Sale", "performance": "High"},
                {"name": "Clearance", "performance": "Medium"}
            ],
            "wishlist": [
                {"name": "Sneakers", "count": 10},
                {"name": "T-Shirt", "count": 10}
            ]
        }
    }

    return jsonify(analytics_data), 200



@vendor_bp.route("/set-password/<reset_token>", methods=["POST"])
def set_vendor_password(reset_token):
    data = request.get_json() or {}
    password = data.get("password")

    if not password:
        return jsonify({"success": False, "error": "Password is required"}), 400

    vendor = vendors_collection.find_one({"reset_token": reset_token})
    if not vendor:
        return jsonify({"success": False, "error": "Invalid or expired token"}), 400

    if vendor.get("reset_token_expiry") and datetime.utcnow() > vendor["reset_token_expiry"]:
        return jsonify({"success": False, "error": "Link expired. Request a new approval link."}), 400

    hashed_password = generate_password_hash(password)
    vendors_collection.update_one(
        {"_id": vendor["_id"]},
        {
            "$set": {"password": hashed_password},
            "$unset": {"reset_token": "", "reset_token_expiry": ""}
        }
    )

    return jsonify({"success": True, "message": "Password set successfully"}), 200

@vendor_bp.route("/profile", methods=["GET"])
@token_required
def get_vendor_profile(current_vendor):
    if current_vendor["role"] != "vendor":
        return jsonify({"error": "Unauthorized"}), 403

    vendor = vendors_collection.find_one({"_id": ObjectId(current_vendor["_id"])})
    if not vendor:
        return jsonify({"error": "Vendor not found"}), 404

    return jsonify({
        "success": True,
        "email": vendor.get("email"),
        "fullName": vendor.get("name") or vendor.get("fullName"),
        "approved_categories": vendor.get("approved_categories", []),
        "approved_subcategories": vendor.get("approved_subcategories", {}),
        "approved_childcategories": vendor.get("approved_childcategories", {}),
    }), 200

@vendor_bp.route("/my-products", methods=["GET"])
@token_required
def get_my_products(current_vendor):
    if current_vendor["role"] != "vendor":
        return jsonify({"error": "Unauthorized"}), 403

    products = list(products_collection.find({"vendor_id": str(current_vendor["_id"])}))

    for p in products:
        p["_id"] = str(p["_id"])

    return jsonify({"success": True, "products": products}), 200



@vendor_bp.route("/vendor/<vendor_id>", methods=["GET"])
def get_vendor(vendor_id):
    vendor = vendors_collection.find_one({"_id": ObjectId(vendor_id)})
    if not vendor:
        return jsonify({"error": "Vendor not found"}), 404
    vendor["_id"] = str(vendor["_id"])
    return jsonify(vendor), 200

@vendor_bp.route("/vendor/<vendor_id>/status", methods=["GET"])
def get_vendor_status(vendor_id):
    vendor = vendors_collection.find_one({"_id": ObjectId(vendor_id)}, {"status": 1, "_id": 0})
    if not vendor:
        return jsonify({"error": "Vendor not found"}), 404
    return jsonify(vendor), 200


