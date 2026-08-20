import json
import cloudinary
import cloudinary.uploader
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from bson import ObjectId
from database import users_collection, vendors_collection,subusers_collection, guest_leads_collection
from utils.auth_utils import generate_token
from utils.email_utils import send_email
import random, string
import os
import uuid
from werkzeug.utils import secure_filename


auth_bp = Blueprint('auth', __name__)

# ------------------ REGISTER (Customer) ------------------
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json(silent=True) or {}

    if not data.get("email") or not data.get("password") or not data.get("name"):
        return jsonify({"error": "name, email, and password are required"}), 400

    if users_collection.find_one({"email": data["email"]}):
        return jsonify({"error": "Email already exists"}), 400

    hashed_password = generate_password_hash(data["password"])

    users_collection.insert_one({
        "name": data["name"],
        "email": data["email"],
        "phone": data.get("phone") or None,
        "password": hashed_password,
        "role": "customer"
    })

    # If this email was invited via the guest-capture flow, mark it converted
    from datetime import datetime as _dt
    guest_leads_collection.update_one(
        {"email": data["email"].strip().lower()},
        {"$set": {"converted": True, "converted_at": _dt.utcnow()}}
    )

    return jsonify({"message": "Registration successful!"}), 201


# ------------------ LOGIN (Customer) ------------------

@auth_bp.route('/login/customer', methods=['POST'])
def login_customer():
    data = request.get_json(silent=True) or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400

    user = users_collection.find_one({"email": email, "role": "customer"})
    if not user or not check_password_hash(user.get("password", ""), password):
        return jsonify({"error": "Invalid credentials"}), 401

    # ---------------- Track login ----------------
    users_collection.update_one(
        {"_id": user["_id"]},
        {
            "$inc": {"login_count": 1},                 
            "$set": {"last_login": datetime.utcnow()}   
        }
    )

    token = generate_token(user["_id"], "customer")

    return jsonify({
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "role": "customer",
            "email": user.get("email"),
            "fullName": user.get("name", ""),
            "login_count": user.get("login_count", 0) + 1,  
            "last_login": datetime.utcnow().isoformat()      
        }
    }), 200

# ------------------ LOGIN (Vendor) ------------------
@auth_bp.route('/login/vendor', methods=['POST'])
def login_vendor():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400

    user = vendors_collection.find_one({"email": email, "status": "approved"})
    if not user or not check_password_hash(user.get("password", ""), password):
        return jsonify({"error": "Invalid credentials"}), 401

    # Check vendor restrictions
    if user.get("restricted_until"):
        from datetime import datetime
        restricted_date = datetime.strptime(user["restricted_until"], "%Y-%m-%d")
        if datetime.utcnow() < restricted_date:
            return jsonify({
                "error": f"Your account is restricted until {user['restricted_until']}"
            }), 403

    token = generate_token(user["_id"], "vendor")

    return jsonify({
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "role": "vendor",
            "email": user.get("email"),
            "fullName": user.get("fullName", "")
        }
    }), 200


# ------------------ LOGIN (Admin) ------------------
@auth_bp.route('/login/admin', methods=['POST'])
def login_admin():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400

    user = users_collection.find_one({"email": email, "role": "admin"})
    if not user or not check_password_hash(user.get("password", ""), password):
        return jsonify({"error": "Invalid credentials"}), 401

    users_collection.update_one(
        {"_id": user["_id"]},
        {"$inc": {"login_count": 1}, "$set": {"last_login": datetime.utcnow()}}
    )

    token = generate_token(user["_id"], "admin")

    return jsonify({
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "role": "admin",
            "email": user.get("email"),
            "fullName": user.get("name", "")
        }
    }), 200

# ------------------ FORGOT PASSWORD (Vendor / Customer) ------------------


import secrets
from flask import request, jsonify
from datetime import datetime, timedelta  

@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json()
    email = data.get("email")

    if not email:
        return jsonify({"error": "Email is required"}), 400

    #  Try finding the user in both collections
    user = users_collection.find_one({"email": email})
    collection = users_collection
    role = "customer"

    if not user:
        user = vendors_collection.find_one({"email": email})
        collection = vendors_collection
        role = "vendor"

    if not user:
        return jsonify({"error": "Email not found"}), 404

    # 🔐 Generate OTP (6-digit)
    otp = str(secrets.randbelow(900000) + 100000)
    expiry = datetime.utcnow() + timedelta(minutes=10)  

    # 🧾 Save OTP and expiry in the user's record
    collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"reset_otp": otp, "reset_otp_expiry": expiry}}
    )

    # 📧 Send OTP to user’s email
    send_email(
        email,
        "CitiMart Password Reset OTP",
        f"Your OTP for resetting your password is: {otp}\n\nThis code is valid for 10 minutes."
    )

    return jsonify({
        "message": "OTP sent to your registered email.",
        "role": role
    }), 200


import secrets
from flask import request, jsonify
from datetime import datetime, timedelta  

@auth_bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    data = request.json
    email = data.get("email")
    otp = data.get("otp")

    if not email or not otp:
        return jsonify({"error": "Email and OTP are required"}), 400

    # Check both collections
    user = users_collection.find_one({"email": email})
    collection = users_collection
    role = "customer"

    if not user:
        user = vendors_collection.find_one({"email": email})
        collection = vendors_collection
        role = "vendor"

    if not user or "reset_otp" not in user:
        return jsonify({"error": "Invalid or expired OTP"}), 400

    # ✅ Fix here — no .datetime
    if datetime.utcnow() > user["reset_otp_expiry"]:
        return jsonify({"error": "OTP expired"}), 400

    if user["reset_otp"] != otp:
        return jsonify({"error": "Incorrect OTP"}), 400

    # Generate reset token
    reset_token = secrets.token_urlsafe(32)

    collection.update_one(
        {"_id": user["_id"]},
        {
            "$set": {"reset_token": reset_token},
            "$unset": {"reset_otp": "", "reset_otp_expiry": ""}
        }
    )

    return jsonify({
        "message": "OTP verified successfully.",
        "reset_token": reset_token,
        "role": role
    }), 200




import traceback
from werkzeug.security import generate_password_hash

@auth_bp.route('/set-password', methods=['POST'])
def set_password():
    try:
        data = request.json
        #print("Raw request data:", request.data)
        #print("Parsed JSON:", data)

        reset_token = data.get("token")
        new_password = data.get("password")

        if not reset_token or not new_password:
            return jsonify({"error": "Missing token or password"}), 400

        hashed_password = generate_password_hash(new_password)

        # ✅ Try finding vendor first
        user = vendors_collection.find_one({"reset_token": reset_token})
        collection = vendors_collection

        # ✅ If not found, try customer
        if not user:
            user = users_collection.find_one({"reset_token": reset_token})
            collection = users_collection

        if not user:
            return jsonify({"error": "Invalid or expired token"}), 404

        # ✅ Update password and clear token
        collection.update_one(
            {"_id": user["_id"]},
            {
                "$set": {"password": hashed_password},
                "$unset": {"reset_token": ""}
            }
        )

        # ✅ Return which role was updated (important for frontend redirect)
        role = "vendor" if collection == vendors_collection else "customer"

        return jsonify({
            "message": "Password has been set successfully.",
            "role": role
        }), 200

    except Exception as e:
        print("Error in set-password:", e)
        traceback.print_exc()
        return jsonify({"error": "Internal server error"}), 500


# ------------------ REGISTER VENDOR ------------------

'''
@auth_bp.route("/register-vendor", methods=["POST"])
def register_vendor():
    try:
        # Basic fields
        fullName = request.form.get("fullName")
        email = request.form.get("email")
        phone = request.form.get("phone")
        password = request.form.get("password")
        businessName = request.form.get("businessName")
        businessType = request.form.get("businessType")
        businessRegNo = request.form.get("businessRegNo")
        gstNo = request.form.get("gstNo")
        businessAddress = request.form.get("businessAddress")
        skuCount = request.form.get("skuCount")
        priceRange = request.form.get("priceRange")
        productType = request.form.get("productType")
        website = request.form.get("website")
        socialLinks = request.form.get("socialLinks")
        inventoryReady = request.form.get("inventoryReady")
        shipping = request.form.get("shipping")
        appeal = request.form.get("appeal")
        productDesc = request.form.get("productDesc")
        termsAgreed = request.form.get("termsAgreed") == "true"

        #  Parse categories properly (JSON instead of eval)
        productCategories = json.loads(request.form.get("productCategories", "[]"))
        selectedSubcategories = json.loads(request.form.get("selectedSubcategories", "{}"))

        # Upload documents
        documents = []
        if "documents" in request.files:
            for file in request.files.getlist("documents"):
                upload_result = cloudinary.uploader.upload(file, folder="citimart/vendors/docs")
                documents.append(upload_result["secure_url"])

        # Upload product images
        productImages = []
        if "productImages" in request.files:
            for file in request.files.getlist("productImages"):
                upload_result = cloudinary.uploader.upload(file, folder="citimart/vendors/products")
                productImages.append(upload_result["secure_url"])

        # Check for duplicate email
        if vendors_collection.find_one({"email": email}):
            return jsonify({"error": "Email already exists"}), 400

        hashed_password = generate_password_hash(password)

        vendor_data = {
            "fullName": fullName,
            "email": email,
            "phone": phone,
            "password": hashed_password,
            "businessName": businessName,
            "businessType": businessType,
            "businessRegNo": businessRegNo,
            "gstNo": gstNo,
            "businessAddress": businessAddress,

            #  Save both top-level and nested categories
            "productCategories": productCategories,
            "selectedSubcategories": selectedSubcategories,

            "skuCount": skuCount,
            "priceRange": priceRange,
            "productType": productType,
            "website": website,
            "socialLinks": socialLinks,
            "inventoryReady": inventoryReady,
            "shipping": shipping,
            "appeal": appeal,
            "productDesc": productDesc,
            "documents": documents,
            "productImages": productImages,
            "termsAgreed": termsAgreed,
            "status": "pending",
            "approvedCategories": []
        }

        vendors_collection.insert_one(vendor_data)

        return jsonify({"message": "Vendor application submitted successfully!"}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
'''


@auth_bp.route("/register-vendor", methods=["POST"])
def register_vendor():
    try:
        # Basic fields
        fullName = request.form.get("fullName")
        email = request.form.get("email")
        phone = request.form.get("phone")
        password = request.form.get("password")
        businessName = request.form.get("businessName")
        businessType = request.form.get("businessType")
        businessRegNo = request.form.get("businessRegNo")
        gstNo = request.form.get("gstNo")
        businessAddress = request.form.get("businessAddress")
        skuCount = request.form.get("skuCount")
        priceRange = request.form.get("priceRange")
        productType = request.form.get("productType")
        website = request.form.get("website")
        socialLinks = request.form.get("socialLinks")
        inventoryReady = request.form.get("inventoryReady")
        shipping = request.form.get("shipping")
        appeal = request.form.get("appeal")
        productDesc = request.form.get("productDesc")
        termsAgreed = request.form.get("termsAgreed") == "true"

        productCategories = json.loads(request.form.get("productCategories", "[]"))
        selectedSubcategories = json.loads(request.form.get("selectedSubcategories", "{}"))

        # Upload docs
        documents, productImages = [], []
        if "documents" in request.files:
            for f in request.files.getlist("documents"):
                res = cloudinary.uploader.upload(f, folder="citimart/vendors/docs")
                documents.append(res["secure_url"])
        if "productImages" in request.files:
            for f in request.files.getlist("productImages"):
                res = cloudinary.uploader.upload(f, folder="citimart/vendors/products")
                productImages.append(res["secure_url"])

        if vendors_collection.find_one({"email": email}):
            return jsonify({"error": "Email already exists"}), 400

        hashed_pw = generate_password_hash(password)
        subuser_exists = subusers_collection.count_documents({
    "$or": [
        {"active": True},
        {"status": "active"}
    ]
}) > 0

        initial_status = "pending_subuser" if subuser_exists else "pending_admin"

        vendor_data = {
            "fullName": fullName,
            "email": email,
            "phone": phone,
            "password": hashed_pw,
            "businessName": businessName,
            "businessType": businessType,
            "businessRegNo": businessRegNo,
            "gstNo": gstNo,
            "businessAddress": businessAddress,
            "productCategories": productCategories,
            "selectedSubcategories": selectedSubcategories,
            "skuCount": skuCount,
            "priceRange": priceRange,
            "productType": productType,
            "website": website,
            "socialLinks": socialLinks,
            "inventoryReady": inventoryReady,
            "shipping": shipping,
            "appeal": appeal,
            "productDesc": productDesc,
            "documents": documents,
            "productImages": productImages,
            "termsAgreed": termsAgreed,
            "status": initial_status,
            "approvedCategories": [],
            "subuserApprovedBy": None,
            "adminApprovedBy": None,
            "rejectionSource": None,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }

        vendors_collection.insert_one(vendor_data)
        return jsonify({"message": f"Vendor registered, status: {initial_status}"}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

