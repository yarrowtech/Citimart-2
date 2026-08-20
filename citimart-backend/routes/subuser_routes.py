import traceback
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
import jwt, bcrypt
from config import JWT_SECRET_KEY, FRONTEND_URL
from database import subusers_collection,vendors_collection
from utils.email_utils import send_email
from utils.auth_utils import subuser_token_required, require_permission

subuser_bp = Blueprint("subuser", __name__)

# ---------------------------
# Generate a secure setup token
# ---------------------------
def generate_setup_token(email):
    payload = {
        "email": email,
        "role": "subuser_setup",
        "exp": datetime.utcnow() + timedelta(hours=24)  # ✅ expire in 24h
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm="HS256")


# ---------------------------
# Route: Create Subuser (invite)
# ---------------------------
'''
@subuser_bp.route("/subusers", methods=["POST"])
def create_subuser():
    try:
        data = request.get_json()
        parent_type = data.get("parentType")

        # Basic validation
        if parent_type not in ["Customer", "Vendor", "Merchandise", "Admin", "HeadOffice"]:
            return jsonify({"error": "Invalid parentType"}), 400

        if parent_type in ["Customer", "Vendor"] and not data.get("parentId"):
            return jsonify({"error": "parentId is required for Customers or Vendors"}), 400

        role = data.get("role")
        incoming_permissions = data.get("permissions", {})

        # Permissions: keep incoming or fallback
        permissions = incoming_permissions or {}

        # Generate setup token
        setup_token = generate_setup_token(data["email"])
        print("Generated setup token:", setup_token)

        # Insert subuser in DB
        subuser = {
            "email": data["email"],
            "parentType": parent_type,
            "parentId": data.get("parentId"),
            "role": role,
            "permissions": permissions,
            "status": "pending",
            "setupToken": setup_token,
            "otpHash": None,
            "passwordHash": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        result = subusers_collection.insert_one(subuser)
        subuser["_id"] = str(result.inserted_id)

        # Build frontend link
        setup_link = f"{FRONTEND_URL}/subuser/setup?token={setup_token}"
        print("Setup link:", setup_link)

        # Send email
        email_body = f"""
        <h2>Welcome to Citimart</h2>
        <p>You’ve been invited as a Subuser under <b>{parent_type}</b>.</p>
        <p><b>Role:</b> {role}</p>
        <p><b>Permissions:</b> {', '.join([p for p, v in permissions.items() if v])}</p>
        <p>Please set up your account within 24 hours:</p>
        <a href="{setup_link}">Setup My Account</a>
        """
        send_email(data["email"], "Complete Your Subuser Setup", email_body)

        return jsonify({"message": "Subuser invited successfully", "subuser": subuser}), 201

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
'''

# ---------------------------
# Route: Create Subuser (invite)
# ---------------------------
@subuser_bp.route("/subusers", methods=["POST"])
def create_subuser():
    try:
        data = request.get_json()
        parent_type = data.get("parentType")

        # ✅ Valid parent types (no parentId needed for Marketing, Admin, Merchandise, HeadOffice)
        valid_parent_types = ["Customer", "Vendor", "Merchandise", "Admin", "Marketing", "HeadOffice"]
        if parent_type not in valid_parent_types:
            return jsonify({"error": f"Invalid parentType. Must be one of {valid_parent_types}"}), 400

        # ✅ Only Customer and Vendor require parentId
        if parent_type in ["Customer", "Vendor"] and not data.get("parentId"):
            return jsonify({"error": "parentId is required for Customers or Vendors"}), 400

        role = data.get("role")
        incoming_permissions = data.get("permissions", {})

        # ✅ Define full permission map (includes "media")
        all_permissions = {
            "segmentation": False,
            "promotions": False,
            "content": False,
            "reports": False,
            "merchandise": False,
            "complaints": False,
            "analytics": False,
            "campaigns": False,
            "faq": False,
            "media": False
        }

        # ✅ Merge incoming permissions safely
        for key in all_permissions:
            all_permissions[key] = incoming_permissions.get(key, False)

        # ✅ Generate setup token
        setup_token = generate_setup_token(data["email"])

        # ✅ Create subuser document
        subuser = {
            "email": data["email"],
            "parentType": parent_type,
            "parentId": data.get("parentId") if parent_type in ["Customer", "Vendor"] else None,
            "role": role,
            "permissions": all_permissions,
            "status": "pending",
            "setupToken": setup_token,
            "otpHash": None,
            "passwordHash": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        result = subusers_collection.insert_one(subuser)
        subuser["_id"] = str(result.inserted_id)

        # ✅ Setup link for frontend
        setup_link = f"{FRONTEND_URL}/subuser/setup?token={setup_token}"

        # ✅ Send email invitation
        email_body = f"""
        <h2>Welcome to Citimart</h2>
        <p>You’ve been invited as a Subuser under <b>{parent_type}</b>.</p>
        <p><b>Role:</b> {role}</p>
        <p><b>Permissions:</b> {', '.join([p for p, v in all_permissions.items() if v])}</p>
        <p>Please set up your account within 24 hours:</p>
        <a href="{setup_link}">Setup My Account</a>
        """
        send_email(data["email"], "Complete Your Subuser Setup", email_body)

        return jsonify({"message": "Subuser invited successfully", "subuser": subuser}), 201

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ---------------------------
# Route: Setup Subuser (set password)
# ---------------------------
@subuser_bp.route("/setup", methods=["POST"])
def setup_subuser():
    try:
        data = request.get_json()
        token = data.get("token")
        password = data.get("password")

        if not token or not password:
            return jsonify({"error": "Token and password are required"}), 400

        # Decode token
        try:
            decoded = jwt.decode(token, JWT_SECRET_KEY, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 400
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 400

        email = decoded["email"]

        # Find subuser with this token
        subuser = subusers_collection.find_one({"email": email, "setupToken": token})
        if not subuser or subuser.get("status") != "pending":
            return jsonify({"error": "Invalid or already used setup link"}), 400

        # Hash password (bcrypt)
        hashed_pw = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

        # Update subuser
        subusers_collection.update_one(
            {"_id": subuser["_id"]},
            {"$set": {
                "passwordHash": hashed_pw,
                "status": "active",
                "updated_at": datetime.utcnow()
            },
             "$unset": {"setupToken": ""}}
        )

        return jsonify({"message": "Password set successfully. You can now log in.",
                        "redirectUrl": "/subuser/login"}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ---------------------------
# Route: Subuser Login
# ---------------------------
@subuser_bp.route("/login/subuser", methods=["POST"])
def login_subuser():
    data = request.get_json(silent=True) or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    subuser = subusers_collection.find_one({"email": email})
    if not subuser or not subuser.get("passwordHash"):
        return jsonify({"error": "Invalid credentials"}), 401

    # Check password with bcrypt
    if not bcrypt.checkpw(password.encode("utf-8"), subuser["passwordHash"].encode("utf-8")):
        return jsonify({"error": "Invalid credentials"}), 401

    # Generate JWT login token (short-lived, not setup token)
    payload = {
        "sub": str(subuser["_id"]),
        "role": subuser["role"],
        "exp": datetime.utcnow() + timedelta(hours=12)  # login session token valid 12h
    }
    login_token = jwt.encode(payload, JWT_SECRET_KEY, algorithm="HS256")

    # Every role lands on the one dashboard shell, which renders tabs from
    # the subuser's actual granted permissions rather than a fixed-per-role
    # page — permissions are customizable per-subuser, not fixed by role.
    redirect_url = "/subuser/dashboard"

    return jsonify({
        "token": login_token,
        "user": {
            "id": str(subuser["_id"]),
            "email": subuser.get("email"),
            "role": subuser.get("role"),
            "parentType": subuser.get("parentType"),
            "permissions": subuser.get("permissions", {}),
        },
        "redirectUrl": redirect_url
    }), 200

from bson import ObjectId
from database import users_collection




@subuser_bp.route("/segment-requests/<user_id>/approve", methods=["POST"])
@subuser_token_required
@require_permission("segmentation")
def approve_request_subuser(current_subuser, user_id):
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user or not user.get("segment_request"):
        return jsonify({"error": "No segment request found"}), 404

    users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {
            "segment_request.status": "pending_admin",
            "segment_request.approved_by_subuser": True,
            "segment_request.forwarded_to_admin": True
        }}
    )

    return jsonify({"message": "Request forwarded to admin"}), 200


@subuser_bp.route("/segment-requests/<user_id>/reject", methods=["POST"])
@subuser_token_required
@require_permission("segmentation")
def reject_request_subuser(current_subuser, user_id):
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user or not user.get("segment_request"):
        return jsonify({"error": "No segment request found"}), 404

    users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {
            "segment_request.status": "rejected",
            "segment_request.approved_by_subuser": False
        }}
    )

    return jsonify({"message": "Request rejected by subuser"}), 200


@subuser_bp.route("/segment-requests", methods=["GET"])
@subuser_token_required
@require_permission("segmentation")
def get_segment_requests(current_subuser):
    try:
        # Find all users who have requested a segment and are pending
        pending_requests = list(users_collection.find(
            {"segment_request.status": "pending_subuser"},
            {"name": 1, "email": 1, "segment_request": 1}
        ))

        # Convert ObjectId to string
        for req in pending_requests:
            req["_id"] = str(req["_id"])

        return jsonify({"requests": pending_requests}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500



@subuser_bp.route("/vendors", methods=["GET"])
@subuser_token_required
def list_pending_vendors(current_subuser):
    vendors = list(vendors_collection.find({"status": "pending_subuser"}))
    for v in vendors:
        v["_id"] = str(v["_id"])
    return jsonify(vendors), 200

@subuser_bp.route("/vendor/<vendor_id>/approve", methods=["PATCH"])
@subuser_token_required
def subuser_approve(current_subuser, vendor_id):
    try:
        data = request.get_json() or {}
        approve = data.get("approve")

        vendor = vendors_collection.find_one({"_id": ObjectId(vendor_id)})
        if not vendor:
            return jsonify({"error": "Vendor not found"}), 404

        update_data = {
            "status": "pending_admin" if approve else "rejected",
            "subuserApprovedBy": current_subuser["_id"],
            "rejectionSource": None if approve else "subuser",
            "updatedAt": datetime.utcnow()
        }
        vendors_collection.update_one({"_id": ObjectId(vendor_id)}, {"$set": update_data})
        return jsonify({"message": "Vendor processed by subuser"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500