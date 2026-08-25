from flask import Blueprint, request, jsonify
from bson import ObjectId
from database import vendors_collection, products_collection, users_collection, orders_collection,subusers_collection
from utils.email_utils import send_email
import random, string
from config import FRONTEND_URL
from datetime import datetime, timedelta

admin_bp = Blueprint("admin", __name__)

# -------- Cloudinary config --------
CLOUDINARY_BASE_URL = "https://res.cloudinary.com/dfvrobw6x/image/upload/"

def get_cloudinary_image(image_path):
    if not image_path:
        return "https://via.placeholder.com/100"
    if image_path.startswith("http"):
        return image_path
    return CLOUDINARY_BASE_URL + image_path

'''
#  Helper function to send approval email with tree structure
def send_vendor_approval_email(vendor_email, vendor_name, reset_token,
                               approved_categories, approved_subcategories, approved_childcategories):
    categories_text = ""

    for cat in approved_categories:
        categories_text += f"\n{cat}"
        subcats = approved_subcategories.get(cat, [])

        for sub in subcats:
            children = approved_childcategories.get(sub, [])
            if children:
                categories_text += f"\n ├── {sub} → {', '.join(children)}"
            else:
                categories_text += f"\n ├── {sub}"

    link = f"{FRONTEND_URL}/set-password/{reset_token}"
    email_body = f"""
Hi {vendor_name},

🎉 Congratulations! Your vendor account has been APPROVED ✅

✅ Approved Categories:
{categories_text}

👉 Set your password here: {link}

Welcome to Citimart Vendor Panel 🚀
"""

    send_email(vendor_email, "Vendor Account Approved - Set Your Password", email_body)

#  Get pending vendor applications
@admin_bp.route("/vendor-applications", methods=["GET"])
def get_pending_vendors():
    pending = list(vendors_collection.find({"status": "pending"}))
    for v in pending:
        v["_id"] = str(v["_id"])
    return jsonify(pending), 200

#  Approve vendor with categories + email
@admin_bp.route("/approve-vendor/<vendor_id>", methods=["POST"])
def approve_vendor(vendor_id):
    data = request.get_json() or {}
    approved_categories = data.get("approvedCategories", [])
    approved_subcategories = data.get("approvedSubcategories", {})
    approved_childcategories = data.get("approvedChildcategories", {})

    vendor = vendors_collection.find_one({"_id": ObjectId(vendor_id)})
    if not vendor:
        return jsonify({"error": "Vendor not found"}), 404

    reset_token = "".join(random.choices(string.ascii_letters + string.digits, k=32))
    expiry_time = datetime.utcnow() + timedelta(days=7)

    vendors_collection.update_one(
        {"_id": ObjectId(vendor_id)},
        {"$set": {
            "status": "approved",
            "reset_token": reset_token,
            "reset_token_expiry": expiry_time,
            "approved_categories": approved_categories,
            "approved_subcategories": approved_subcategories,
            "approved_childcategories": approved_childcategories
        }}
    )

    send_vendor_approval_email(
        vendor_email=vendor["email"],
        vendor_name=vendor.get("fullName", "Vendor"),
        reset_token=reset_token,
        approved_categories=approved_categories,
        approved_subcategories=approved_subcategories,
        approved_childcategories=approved_childcategories
    )

    return jsonify({"message": "Vendor approved and email sent"}), 200

#  Reject vendor
@admin_bp.route("/reject-vendor/<vendor_id>", methods=["POST"])
def reject_vendor(vendor_id):
    result = vendors_collection.update_one(
        {"_id": ObjectId(vendor_id)}, {"$set": {"status": "rejected"}}
    )
    if result.matched_count == 0:
        return jsonify({"error": "Vendor not found"}), 404
    return jsonify({"message": "Vendor rejected"}), 200

'''
def send_vendor_approval_email(vendor_email, vendor_name, reset_token,
                               approved_categories, approved_subcategories, approved_childcategories):
    categories_text = ""

    for cat in approved_categories:
        categories_text += f"\n{cat}"
        subcats = approved_subcategories.get(cat, [])
        for sub in subcats:
            children = approved_childcategories.get(sub, [])
            if children:
                categories_text += f"\n ├── {sub} → {', '.join(children)}"
            else:
                categories_text += f"\n ├── {sub}"

    link = f"{FRONTEND_URL}/set-password/{reset_token}"
    email_body = f"""
Hi {vendor_name},

🎉 Congratulations! Your vendor account has been APPROVED ✅

✅ Approved Categories:
{categories_text}

👉 Set your password here: {link}

Welcome to Citimart Vendor Panel 🚀
"""
    send_email(vendor_email, "Vendor Account Approved - Set Your Password", email_body)


# -----------------------------
# GET: Pending or subuser-rejected vendors
# -----------------------------
@admin_bp.route("/vendor-applications", methods=["GET"])
def get_pending_vendors():
    # Show vendors needing admin action
    pending = list(vendors_collection.find({
        "$or": [
            {"status": "pending_admin"},
            {"status": "rejected", "rejectionSource": "subuser"}
        ]
    }))
    for v in pending:
        v["_id"] = str(v["_id"])
    return jsonify(pending), 200


# -----------------------------
# POST: Approve vendor (with categories + email)
# -----------------------------
@admin_bp.route("/approve-vendor/<vendor_id>", methods=["POST"])
def approve_vendor(vendor_id):
    try:
        data = request.get_json() or {}
        approved_categories = data.get("approvedCategories", [])
        approved_subcategories = data.get("approvedSubcategories", {})
        approved_childcategories = data.get("approvedChildcategories", {})
        admin_id = data.get("adminId")

        vendor = vendors_collection.find_one({"_id": ObjectId(vendor_id)})
        if not vendor:
            return jsonify({"error": "Vendor not found"}), 404

        # Generate password reset token
        reset_token = "".join(random.choices(string.ascii_letters + string.digits, k=32))
        expiry_time = datetime.utcnow() + timedelta(days=7)

        update_fields = {
            "status": "approved",
            "rejectionSource": None,
            "adminApprovedBy": admin_id,
            "approved_categories": approved_categories,
            "approved_subcategories": approved_subcategories,
            "approved_childcategories": approved_childcategories,
            "reset_token": reset_token,
            "reset_token_expiry": expiry_time,
            "updatedAt": datetime.utcnow()
        }

        vendors_collection.update_one({"_id": ObjectId(vendor_id)}, {"$set": update_fields})

        # Send approval email
        send_vendor_approval_email(
            vendor_email=vendor["email"],
            vendor_name=vendor.get("fullName", "Vendor"),
            reset_token=reset_token,
            approved_categories=approved_categories,
            approved_subcategories=approved_subcategories,
            approved_childcategories=approved_childcategories
        )

        return jsonify({"message": "Vendor approved and email sent"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -----------------------------
# POST: Reject vendor (with admin authority)
# -----------------------------
@admin_bp.route("/reject-vendor/<vendor_id>", methods=["POST"])
def reject_vendor(vendor_id):
    try:
        data = request.get_json() or {}
        admin_id = data.get("adminId")

        result = vendors_collection.update_one(
            {"_id": ObjectId(vendor_id)},
            {"$set": {
                "status": "rejected",
                "rejectionSource": "admin",
                "adminApprovedBy": admin_id,
                "updatedAt": datetime.utcnow()
            }}
        )

        if result.matched_count == 0:
            return jsonify({"error": "Vendor not found"}), 404

        return jsonify({"message": "Vendor rejected by admin"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


#  Get approved vendors (with product count)
@admin_bp.route("/approved-vendors", methods=["GET"])
def get_approved_vendors():
    approved = list(vendors_collection.find({"status": "approved"}))
    for v in approved:
        v["_id"] = str(v["_id"])
        v["product_count"] = products_collection.count_documents({"vendor_id": v["_id"]})
        v["approved_categories"] = v.get("approved_categories", [])
        v["approved_subcategories"] = v.get("approved_subcategories", {})
        v["approved_childcategories"] = v.get("approved_childcategories", {})
    return jsonify(approved), 200

#  Get products of a specific vendor
@admin_bp.route("/vendor-products/<vendor_id>", methods=["GET"])
def get_vendor_products(vendor_id):
    products = list(products_collection.find({"vendor_id": vendor_id}))
    for p in products:
        p["_id"] = str(p["_id"])
        p["images"] = [get_cloudinary_image(img) for img in p.get("images", [])]
    return jsonify(products), 200


@admin_bp.route("/vendor-orders/<vendor_id>", methods=["GET"])
def get_vendor_orders(vendor_id):
    orders = orders_collection.find({"vendor_id": vendor_id})
    result = []
    for o in orders:
        o["_id"] = str(o["_id"])
        result.append(o)
    return jsonify({"orders": result}), 200

#  Update vendor categories (for editing approved vendors)

@admin_bp.route("/update-vendor/<vendor_id>", methods=["PUT"])
def update_vendor(vendor_id):
    try:
        data = request.get_json() or {}

        approved_categories = data.get("approvedCategories", [])
        approved_subcategories = data.get("approvedSubcategories", {})
        approved_childcategories = data.get("approvedChildcategories", {})
        restricted_until = data.get("restrictedUntil")  # frontend sends camelCase

        update_data = {
            "approved_categories": approved_categories,
            "approved_subcategories": approved_subcategories,
            "approved_childcategories": approved_childcategories
        }

        #  Add restriction date handling
        if restricted_until:
            update_data["restricted_until"] = restricted_until
        else:
            update_data["restricted_until"] = None  # remove restriction if empty

        result = vendors_collection.update_one(
            {"_id": ObjectId(vendor_id)},
            {"$set": update_data}
        )

        if result.matched_count == 0:
            return jsonify({"error": "Vendor not found"}), 404

        return jsonify({"success": True, "message": "Vendor updated successfully"}), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

#  Restrict vendor until a specific date
@admin_bp.route("/restrict-vendor/<vendor_id>", methods=["PUT"])
def restrict_vendor(vendor_id):
    try:
        data = request.get_json() or {}
        restricted_until = data.get("restricted_until")  # Expecting "YYYY-MM-DD"

        if not restricted_until:
            return jsonify({"error": "restricted_until date is required"}), 400

        # Validate date format
        try:
            datetime.strptime(restricted_until, "%Y-%m-%d")
        except ValueError:
            return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

        result = vendors_collection.update_one(
            {"_id": ObjectId(vendor_id)},
            {"$set": {"restricted_until": restricted_until}}
        )

        if result.matched_count == 0:
            return jsonify({"error": "Vendor not found"}), 404

        return jsonify({"success": True, "message": "Vendor restriction updated successfully"}), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


#  Get rejected vendors
@admin_bp.route("/rejected-vendors", methods=["GET"])
def get_rejected_vendors():
    rejected = list(vendors_collection.find({"status": "rejected"}))
    for v in rejected:
        v["_id"] = str(v["_id"])
    return jsonify(rejected), 200

#  Delete vendor
@admin_bp.route("/delete-vendor/<vendor_id>", methods=["DELETE"])
def delete_vendor(vendor_id):
    result = vendors_collection.delete_one({"_id": ObjectId(vendor_id)})
    if result.deleted_count == 0:
        return jsonify({"error": "Vendor not found"}), 404
    return jsonify({"message": "Vendor deleted successfully"}), 200

#------ vendor-category request ---------

@admin_bp.route("/vendor-category-requests/<vendor_id>", methods=["GET"])
def get_vendor_category_requests(vendor_id):
    try:
        vendor = vendors_collection.find_one({"_id": ObjectId(vendor_id)})
        if not vendor:
            return jsonify({"error": "Vendor not found"}), 404

        requests = vendor.get("pending_category_requests", [])
        return jsonify(requests), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


#  Single approval
@admin_bp.route("/approve-category-request/<vendor_id>", methods=["POST"])
def approve_category_request(vendor_id):
    try:
        data = request.json
        category = data.get("category")
        subcategory = data.get("subcategory")
        child_category = data.get("child_category")

        vendor = vendors_collection.find_one({"_id": ObjectId(vendor_id)})
        if not vendor:
            return jsonify({"error": "Vendor not found"}), 404

        approved_categories = vendor.get("approved_categories", [])
        approved_subcategories = vendor.get("approved_subcategories", {})
        approved_childcategories = vendor.get("approved_childcategories", {})

        if category not in approved_categories:
            approved_categories.append(category)

        if subcategory:
            approved_subcategories.setdefault(category, [])
            if subcategory not in approved_subcategories[category]:
                approved_subcategories[category].append(subcategory)

        if child_category and subcategory:
            approved_childcategories.setdefault(subcategory, [])
            if child_category not in approved_childcategories[subcategory]:
                approved_childcategories[subcategory].append(child_category)

        updated_requests = [
            r for r in vendor.get("pending_category_requests", [])
            if not (r.get("category") == category and
                    r.get("subcategory") == subcategory and
                    r.get("child_category") == child_category)
        ]

        vendors_collection.update_one(
            {"_id": ObjectId(vendor_id)},
            {"$set": {
                "approved_categories": approved_categories,
                "approved_subcategories": approved_subcategories,
                "approved_childcategories": approved_childcategories,
                "pending_category_requests": updated_requests
            }}
        )

        return jsonify({"message": "Category approved successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


#  Bulk approval
@admin_bp.route("/approve-category-requests/<vendor_id>", methods=["POST"])
def approve_category_requests(vendor_id):
    try:
        data = request.get_json()
        requests_to_approve = data.get("requests", [])

        if not requests_to_approve:
            return jsonify({"error": "No requests provided"}), 400

        vendor = vendors_collection.find_one({"_id": ObjectId(vendor_id)})
        if not vendor:
            return jsonify({"error": "Vendor not found"}), 404

        approved_categories = vendor.get("approved_categories", [])
        approved_subcategories = vendor.get("approved_subcategories", {})
        approved_childcategories = vendor.get("approved_childcategories", {})
        pending_requests = vendor.get("pending_category_requests", [])

        updated_requests = pending_requests.copy()

        for req in requests_to_approve:
            category = req.get("category")
            subcategory = req.get("subcategory")
            child_category = req.get("child_category")

            if not category:
                continue

            # Approve category
            if category not in approved_categories:
                approved_categories.append(category)

            # Approve subcategory
            if subcategory:
                approved_subcategories.setdefault(category, [])
                if subcategory not in approved_subcategories[category]:
                    approved_subcategories[category].append(subcategory)

            # Approve child category
            if child_category and subcategory:
                approved_childcategories.setdefault(subcategory, [])
                if child_category not in approved_childcategories[subcategory]:
                    approved_childcategories[subcategory].append(child_category)

            # Remove from pending
            updated_requests = [
                r for r in updated_requests
                if not (
                    r.get("category") == category and
                    r.get("subcategory") == subcategory and
                    r.get("child_category") == child_category
                )
            ]

        vendors_collection.update_one(
            {"_id": ObjectId(vendor_id)},
            {"$set": {
                "approved_categories": approved_categories,
                "approved_subcategories": approved_subcategories,
                "approved_childcategories": approved_childcategories,
                "pending_category_requests": updated_requests
            }}
        )

        return jsonify({"message": "Requests approved successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


#  Bulk rejection
@admin_bp.route("/reject-category-requests/<vendor_id>", methods=["POST"])
def reject_category_requests(vendor_id):
    try:
        data = request.get_json()
        requests_to_reject = data.get("requests", [])

        if not requests_to_reject:
            return jsonify({"error": "No requests provided"}), 400

        vendor = vendors_collection.find_one({"_id": ObjectId(vendor_id)})
        if not vendor:
            return jsonify({"error": "Vendor not found"}), 404

        pending_requests = vendor.get("pending_category_requests", [])

        updated_requests = pending_requests.copy()

        for req in requests_to_reject:
            category = req.get("category")
            subcategory = req.get("subcategory")
            child_category = req.get("child_category")

            updated_requests = [
                r for r in updated_requests
                if not (
                    r.get("category") == category and
                    r.get("subcategory") == subcategory and
                    r.get("child_category") == child_category
                )
            ]

        vendors_collection.update_one(
            {"_id": ObjectId(vendor_id)},
            {"$set": {"pending_category_requests": updated_requests}}
        )

        return jsonify({"message": "Requests rejected successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


#  Get all users
'''
@admin_bp.route("/users", methods=["GET"])
def get_all_users():
    users_cursor = users_collection.find({"role": {"$in": ["customer", "vendor"]}})
    users_list = []

    for user in users_cursor:
        user_id = user["_id"]
        order_count = orders_collection.count_documents({"customer_id": str(user_id)})

        users_list.append({
            "id": str(user_id),
            "name": user.get("name", ""),
            "email": user.get("email", ""),
            "role": user.get("role", ""),
            "status": "Active" if user.get("is_active", True) else "Inactive",
            "joinDate": user_id.generation_time.strftime("%Y-%m-%d"),
            "orders": order_count
        })

    return jsonify({"users": users_list}), 200
'''
@admin_bp.route("/users", methods=["GET"])
def get_all_users():
    users_cursor = users_collection.find({"role": {"$in": ["customer", "vendor"]}})
    users_list = []

    for user in users_cursor:
        user_id = user["_id"]
        order_count = orders_collection.count_documents({"customer_id": str(user_id)})

        users_list.append({
            "id": str(user_id),
            "name": user.get("name", ""),
            "email": user.get("email", ""),
            "role": user.get("role", ""),
            "status": "Active" if user.get("is_active", True) else "Inactive",
            "joinDate": user_id.generation_time.strftime("%Y-%m-%d"),
            "orders": order_count,
            # 🔥 Add segment + request info
            "segment": user.get("segment", None),
            "segment_request": user.get("segment_request", None)
        })

    return jsonify({"users": users_list}), 200


#  Delete user
@admin_bp.route("/users/<user_id>", methods=["DELETE"])
def delete_user(user_id):
    result = users_collection.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 1:
        return jsonify({"message": "User deleted successfully"}), 200
    return jsonify({"message": "User not found"}), 404


#  Update user
@admin_bp.route("/users/<user_id>", methods=["PUT"])
def update_user(user_id):
    data = request.json
    update_fields = {}
    if "name" in data:
        update_fields["name"] = data["name"]
    if "email" in data:
        update_fields["email"] = data["email"]
    if "is_active" in data:
        update_fields["is_active"] = data["is_active"]

    result = users_collection.update_one({"_id": ObjectId(user_id)}, {"$set": update_fields})
    if result.matched_count == 1:
        return jsonify({"message": "User updated successfully"}), 200
    return jsonify({"message": "User not found"}), 404


#  Get all orders (admin only)
'''
@admin_bp.route("/orders", methods=["GET"])
def get_admin_orders():
    orders = list(orders_collection.find().sort("created_at", -1))
    result = []

    for order in orders:
        # Fetch customer name
        customer = users_collection.find_one({"_id": ObjectId(order["customer_id"])})
        customer_name = customer.get("name", "Unknown") if customer else "Unknown"

        products_list = []

        for item in order.get("order_items", []):
            added_by = item.get("added_by", "admin")

            # Normalize images
            images = item.get("images") or item.get("product", {}).get("images") or []
            if not images and item.get("image"):
                images = [get_cloudinary_image(item.get("image"))]

            # Determine category/subcategory
            category = (item.get("category") or item.get("product", {}).get("category") or "").lower()
            subcategory = (item.get("subcategory") or item.get("product", {}).get("subcategory") or "").lower()

            # Determine if size should be shown
            show_size = category in ["clothing", "handmade"] or subcategory == "jewelry"

            # Fetch size from item or nested product
            size = item.get("size") or item.get("product", {}).get("size") or ""
            if not show_size:
                size = None
            elif show_size and size.strip() == "":
                size = "N/A"

            # Fetch color
            color = item.get("color") or item.get("product", {}).get("color") or ""

            # Build product dict
            product_dict = {
                "name": item.get("name") or item.get("product", {}).get("name", "Product"),
                "qty": item.get("quantity", 1),
                "size": size,
                "price": float(item.get("price") or item.get("product", {}).get("price") or 0),
                "images": images,
                "category": category,
                "subcategory": subcategory,
                "added_by": added_by,
                "color": color
            }

            # Vendor-specific info
            if added_by == "vendor":
                vendor_id = item.get("vendor_id")
                vendor_name, vendor_status,vendor_business  = "Unknown Vendor", "unknown","N/A"
                if vendor_id:
                    vendor = users_collection.find_one({"_id": ObjectId(vendor_id)})
                    if vendor:
                        vendor_name = vendor.get("name", vendor_name)
                        vendor_status = vendor.get("status", vendor_status)
                        vendor_business = vendor.get("business_name", vendor.get("store_name", "N/A"))
                product_dict.update({
                    "vendor_id": str(vendor_id),
                    "vendor_name": vendor_name,
                    "vendor_status": vendor_status,
                    "vendor_business_name": vendor_business
                })

            products_list.append(product_dict)

        if not products_list:
            continue

        result.append({
            "_id": str(order["_id"]),
            "order_id": str(order["_id"])[:8],
            "customer_name": customer_name,
            "phone": order.get("phone", "N/A"),
            "address": order.get("address", "N/A"),
            "date": order.get("created_at", datetime.utcnow()).strftime("%Y-%m-%d %H:%M"),
            "products": products_list,
            "total": float(order.get("final_amount") or order.get("total_amount") or 0),
            "payment": order.get("payment_method", "N/A"),
            "status": order.get("status", "N/A")
        })

    return jsonify(result), 200
'''
@admin_bp.route("/orders", methods=["GET"])
def get_admin_orders():
    orders = list(orders_collection.find().sort("created_at", -1))
    result = []

    for order in orders:
        # Fetch customer name
        customer = users_collection.find_one({"_id": ObjectId(order["customer_id"])})
        customer_name = customer.get("name", "Unknown") if customer else "Unknown"

        products_list = []

        for item in order.get("order_items", []):
            added_by = item.get("added_by", "admin")

            # Normalize images
            images = item.get("images") or item.get("product", {}).get("images") or []
            if not images and item.get("image"):
                images = [get_cloudinary_image(item.get("image"))]

            # Determine category/subcategory
            category = (item.get("category") or item.get("product", {}).get("category") or "").lower()
            subcategory = (item.get("subcategory") or item.get("product", {}).get("subcategory") or "").lower()

            # Determine if size should be shown
            show_size = category in ["clothing", "handmade"] or subcategory == "jewelry"

            # Fetch size
            size = item.get("size") or item.get("product", {}).get("size") or ""
            if not show_size:
                size = None
            elif show_size and size.strip() == "":
                size = "N/A"

            # Fetch color
            color = item.get("color") or item.get("product", {}).get("color") or ""

            # Base product info
            product_dict = {
                "name": item.get("name") or item.get("product", {}).get("name", "Product"),
                "qty": item.get("quantity", 1),
                "size": size,
                "price": float(item.get("price") or item.get("product", {}).get("price") or 0),
                "images": images,
                "category": category,
                "subcategory": subcategory,
                "added_by": added_by,
                "color": color
            }

            # Vendor-specific info
            if added_by == "vendor":
                vendor_id = item.get("vendor_id")
                vendor_name, vendor_status, vendor_business = "Unknown Vendor", "unknown", "N/A"

                if vendor_id:
                    vendor = vendors_collection.find_one({"_id": ObjectId(vendor_id)})
                    if vendor:
                        vendor_name = vendor.get("fullName", vendor_name)
                        vendor_status = vendor.get("status", vendor_status)
                        vendor_business = vendor.get(
                            "businessName",
                            vendor.get("store_name", vendor.get("brandName", "N/A"))
                        )

                product_dict.update({
                    "vendor_id": str(vendor_id),
                    "vendor_name": vendor_name,
                    "vendor_status": vendor_status,
                    "vendor_business_name": vendor_business
                })

            else:
                # For admin-added products
                product_dict.update({
                    "vendor_id": None,
                    "vendor_name": "Admin",
                    "vendor_status": "active",
                    "vendor_business_name": "Admin"
                })

            products_list.append(product_dict)

        if not products_list:
            continue

        result.append({
            "_id": str(order["_id"]),
            "order_id": str(order["_id"])[:8],
            "customer_name": customer_name,
            "phone": order.get("phone", "N/A"),
            "address": order.get("address", "N/A"),
            "date": order.get("created_at", datetime.utcnow()).strftime("%Y-%m-%d %H:%M"),
            "products": products_list,
            "total": float(order.get("final_amount") or order.get("total_amount") or 0),
            "payment": order.get("payment_method", "N/A"),
            "status": order.get("status", "N/A")
        })

    return jsonify(result), 200



#  Delete order
@admin_bp.route("/orders/<order_id>", methods=["DELETE"])
def delete_order(order_id):
    result = orders_collection.delete_one({"_id": ObjectId(order_id)})
    if result.deleted_count == 0:
        return jsonify({"error": "Order not found"}), 404
    return jsonify({"message": "Order deleted successfully"}), 200


#  Update order
@admin_bp.route("/orders/<order_id>", methods=["PUT"])
def update_order(order_id):
    data = request.json
    new_status = data.get("status")
    if not new_status:
        return jsonify({"error": "Status is required"}), 400

    result = orders_collection.update_one({"_id": ObjectId(order_id)}, {"$set": {"status": new_status}})
    if result.matched_count == 0:
        return jsonify({"error": "Order not found"}), 404

    if new_status.strip().lower() == "delivered":
        from routes.finance_routes import settle_order_commission
        settle_order_commission(order_id)

    return jsonify({"message": f"Order status updated to {new_status}"}), 200



#  Get all products (admin view)
@admin_bp.route("/products/all", methods=["GET"])
def get_all_products():
    try:
        products_cursor = products_collection.find()
        products_list = []

        for product in products_cursor:
            prod = dict(product)
            prod["_id"] = str(prod["_id"])
            prod["images"] = [get_cloudinary_image(img) for img in prod.get("images", [])]
            prod["variants"] = prod.get("variants", [])
            prod["status"] = prod.get("status", "Inactive")


            # Handle vendor info
            if prod.get("added_by") == "vendor" and prod.get("vendor_id"):
                vendor = vendors_collection.find_one({"_id": ObjectId(prod["vendor_id"])})
                prod["brand"] = vendor.get("brandName", vendor.get("fullName", "Vendor")) if vendor else "Vendor"
                prod["vendor_status"] = vendor.get("status", "unknown") if vendor else "unknown"
            else:
                prod["brand"] = prod.get("brand", "Admin")
                prod["vendor_status"] = "approved"  

            # Ensure images list
            prod["images"] = prod.get("images", [])

            # Ensure variants array
            prod["variants"] = prod.get("variants", [])

            # Default values
            prod["status"] = prod.get("status", "Inactive")

            products_list.append(prod)

        return jsonify({"products": products_list}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Approve segment request
@admin_bp.route("/users/<user_id>/segment/approve", methods=["POST"])
def approve_segment_request(user_id):
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user or "segment_request" not in user:
        return jsonify({"error": "No segment request found"}), 404

    requested_segment = user["segment_request"]["requested_segment"]

    users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {
            "segment": requested_segment,
            "segment_request.status": "approved"
        }}
    )
    return jsonify({"message": "Segment request approved"}), 200


# Reject segment request
@admin_bp.route("/users/<user_id>/segment/reject", methods=["POST"])
def reject_segment_request(user_id):
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user or "segment_request" not in user:
        return jsonify({"error": "No segment request found"}), 404

    users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {
            "segment": "all",  # reset to default
            "segment_request.status": "rejected"
        }}
    )

    return jsonify({
        "message": "Segment request rejected",
        "segment": "all",
        "status": "rejected"
    }), 200


# ================== SUBUSER MANAGEMENT ==================

# Allowed parent types
ALLOWED_PARENT_TYPES = ["Customer", "Vendor", "Admin", "Merchandise", "HeadOffice", "Marketing"]

# Default permissions by role
ROLE_DEFAULT_PERMISSIONS = {
    "Viewer": ["content", "reports", "faq"],
    "Order Manager": ["promotions", "complaints", "campaigns", "reports"],
    "Inventory Manager": ["merchandise", "analytics", "reports"],
    "Merchandise Manager": ["merchandise", "promotions", "segmentation", "reports", "analytics"],
    "Marketing Manager": ["media", "promotions", "campaigns"],
    "Support Staff": ["complaints", "faq", "content", "reports"],
    "Moderator": ["segmentation", "promotions", "content", "campaigns", "reports", "analytics"],
}

ALL_PERMISSIONS = [
    "segmentation", "promotions", "content", "reports",
    "merchandise", "complaints", "analytics", "campaigns", "faq", "media"
]

import jwt
from datetime import datetime, timedelta
from flask import request, jsonify
from bson import ObjectId
from config import JWT_SECRET_KEY
from database import subusers_collection, users_collection, vendors_collection
from utils.email_utils import send_subuser_invitation_email

# ---------- Create Subuser ----------
@admin_bp.route("/subusers", methods=["POST"])
def create_subuser():
    try:
        data = request.get_json()
        parent_type = data.get("parentType")

        # Validate parent type
        if parent_type not in ALLOWED_PARENT_TYPES:
            return jsonify({"error": "Invalid parentType"}), 400

        # Require parentId for Customer/Vendor only
        if parent_type in ["Customer", "Vendor"] and not data.get("parentId"):
            return jsonify({"error": "parentId is required for Customers or Vendors"}), 400

        role = data.get("role")
        incoming_permissions = data.get("permissions")

        # Merge role defaults with any provided permissions
        default_perms = ROLE_DEFAULT_PERMISSIONS.get(role, [])
        permissions = {p: (p in default_perms) for p in ALL_PERMISSIONS}
        if incoming_permissions:
            permissions.update(incoming_permissions)

        # Generate setup token
        payload = {"email": data["email"], "exp": datetime.utcnow() + timedelta(hours=24)}
        token = jwt.encode(payload, JWT_SECRET_KEY, algorithm="HS256")
        if isinstance(token, bytes):
            token = token.decode("utf-8")

        subuser = {
            "email": data.get("email"),
            "parentType": parent_type,
            "parentId": data.get("parentId") if parent_type not in ["Admin", "Merchandise", "Marketing"] else None,
            "role": role,
            "permissions": permissions,
            "status": "pending",
            "setupToken": token,
            "otpHash": None,
            "passwordHash": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        result = subusers_collection.insert_one(subuser)
        subuser["_id"] = str(result.inserted_id)

        # Send invitation email
        send_subuser_invitation_email(data["email"], parent_type, role, permissions, token)

        return jsonify({"message": "Subuser invited successfully", "subuser": subuser}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------- Get All Subusers ----------
@admin_bp.route("/subusers", methods=["GET"])
def get_subusers():
    try:
        subusers = list(subusers_collection.find())
        for su in subusers:
            su["_id"] = str(su["_id"])
        return jsonify(subusers), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------- Update Subuser ----------
@admin_bp.route("/subusers/<subuser_id>", methods=["PUT"])
def update_subuser(subuser_id):
    try:
        data = request.get_json()
        update_fields = {}

        if "email" in data:
            update_fields["email"] = data["email"]

        if "parentType" in data:
            if data["parentType"] not in ALLOWED_PARENT_TYPES:
                return jsonify({"error": "Invalid parentType"}), 400
            update_fields["parentType"] = data["parentType"]

        if "parentId" in data:
            update_fields["parentId"] = data["parentId"] if data["parentType"] not in ["Admin", "Merchandise", "Marketing"] else None

        if "role" in data:
            update_fields["role"] = data["role"]
            # Reset permissions to role defaults if not explicitly provided
            if "permissions" not in data:
                default_perms = ROLE_DEFAULT_PERMISSIONS.get(data["role"], [])
                update_fields["permissions"] = {p: (p in default_perms) for p in ALL_PERMISSIONS}

        if "permissions" in data:
            existing = subusers_collection.find_one({"_id": ObjectId(subuser_id)}, {"permissions": 1})
            merged_permissions = data["permissions"]
            if existing and "permissions" in existing:
                merged_permissions = {**existing["permissions"], **data["permissions"]}
            update_fields["permissions"] = merged_permissions

        if "status" in data:
            update_fields["status"] = data["status"]

        update_fields["updated_at"] = datetime.utcnow()

        result = subusers_collection.update_one(
            {"_id": ObjectId(subuser_id)},
            {"$set": update_fields}
        )

        if result.matched_count == 0:
            return jsonify({"error": "Subuser not found"}), 404

        updated = subusers_collection.find_one({"_id": ObjectId(subuser_id)})
        updated["_id"] = str(updated["_id"])

        return jsonify({"message": "Subuser updated successfully", "subuser": updated}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------- Delete Subuser ----------
@admin_bp.route("/subusers/<subuser_id>", methods=["DELETE"])
def delete_subuser(subuser_id):
    try:
        result = subusers_collection.delete_one({"_id": ObjectId(subuser_id)})
        if result.deleted_count == 0:
            return jsonify({"error": "Subuser not found"}), 404
        return jsonify({"message": "Subuser deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------- Get Parent Accounts ----------
@admin_bp.route("/parent-accounts/<parent_type>", methods=["GET"])
def get_parent_accounts(parent_type):
    try:
        pt = parent_type.lower()
        accounts = []

        if pt == "customer":
            raw_accounts = list(users_collection.find({}, {"_id": 1, "email": 1, "name": 1}))
        elif pt == "vendor":
            raw_accounts = list(vendors_collection.find({}, {"_id": 1, "email": 1, "name": 1}))
        elif pt in ["admin", "merchandise", "marketing", "headoffice"]:
            raw_accounts = []
        else:
            return jsonify({"error": "Invalid parentType"}), 400

        for acc in raw_accounts:
            accounts.append({
                "_id": str(acc["_id"]),
                "email": acc.get("email", "No Email"),
                "name": acc.get("name", "Unnamed")
            })

        return jsonify(accounts), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------- Reset Subuser Password ----------
@admin_bp.route("/subusers/<subuser_id>/reset-password", methods=["POST"])
def reset_subuser_password(subuser_id):
    try:
        subuser = subusers_collection.find_one({"_id": ObjectId(subuser_id)})
        if not subuser:
            return jsonify({"error": "Subuser not found"}), 404

        # Generate new setup token
        payload = {
            "email": subuser["email"],
            "exp": datetime.utcnow() + timedelta(hours=24)
        }
        token = jwt.encode(payload, JWT_SECRET_KEY, algorithm="HS256")
        if isinstance(token, bytes):
            token = token.decode("utf-8")

        # Update subuser with new setup token and reset password fields
        subusers_collection.update_one(
            {"_id": ObjectId(subuser_id)},
            {"$set": {
                "setupToken": token,
                "otpHash": None,
                "passwordHash": None,
                "status": "pending",
                "updated_at": datetime.utcnow()
            }}
        )

        # Send the reset email
        send_subuser_invitation_email(
            subuser["email"],
            subuser.get("parentType", "Unknown"),
            subuser.get("role", "Viewer"),
            subuser.get("permissions", {}),
            token
        )

        return jsonify({"message": "Password reset email sent to subuser"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500



# ------------------ Get Pending Products ------------------
@admin_bp.route("/admin/products/pending", methods=["GET"])
def get_pending_products():
    try:
        products = list(products_collection.find({"status": "pending"}))
        for p in products:
            p["_id"] = str(p["_id"])
        return jsonify(products), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ------------------ Approve Product ------------------
@admin_bp.route("/admin/products/<product_id>/approve", methods=["PUT"])
def approve_product(product_id):
    try:
        result = products_collection.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": {"status": "approved"}}
        )

        if result.modified_count == 1:
            return jsonify({"message": "✅ Product approved successfully"}), 200
        return jsonify({"error": "Product not found or already approved"}), 404

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ------------------ Reject Product ------------------
@admin_bp.route("/admin/products/<product_id>/reject", methods=["PUT"])
def reject_product(product_id):
    try:
        result = products_collection.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": {"status": "rejected"}}
        )
        if result.modified_count == 1:
            return jsonify({"message": "🚫 Product rejected"}), 200
        return jsonify({"error": "Product not found or already processed"}), 404

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500