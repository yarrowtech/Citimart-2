from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash
import secrets
from database import users_collection  # adjust import based on your structure
from utils.email_utils import send_email  # adjust import path

customer_auth_bp = Blueprint("customer_auth_bp", __name__, url_prefix="/auth/customer")

# 1️⃣ Forgot Password
@customer_auth_bp.route("/forgot-password", methods=["POST"])
def customer_forgot_password():
    data = request.get_json()
    email = data.get("email")

    if not email:
        return jsonify({"error": "Email is required"}), 400

    user = users_collection.find_one({"email": email})
    if not user:
        return jsonify({"error": "Email not found"}), 404

    otp = str(secrets.randbelow(900000) + 100000)
    expiry = datetime.utcnow() + timedelta(minutes=10)

    users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"reset_otp": otp, "reset_otp_expiry": expiry}}
    )

    send_email(
        email,
        "CitiMart Customer Password Reset OTP",
        f"Your OTP is: {otp}\n\nValid for 10 minutes."
    )

    return jsonify({"message": "OTP sent to your registered email."}), 200


# 2️⃣ Verify OTP
@customer_auth_bp.route("/verify-otp", methods=["POST"])
def customer_verify_otp():
    data = request.json
    email = data.get("email")
    otp = data.get("otp")

    if not email or not otp:
        return jsonify({"error": "Email and OTP are required"}), 400

    user = users_collection.find_one({"email": email})
    if not user or "reset_otp" not in user:
        return jsonify({"error": "Invalid or expired OTP"}), 400

    if datetime.utcnow() > user["reset_otp_expiry"]:
        return jsonify({"error": "OTP expired"}), 400

    if user["reset_otp"] != otp:
        return jsonify({"error": "Incorrect OTP"}), 400

    reset_token = secrets.token_urlsafe(32)

    users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"reset_token": reset_token}, "$unset": {"reset_otp": "", "reset_otp_expiry": ""}}
    )

    return jsonify({
        "message": "OTP verified successfully.",
        "reset_token": reset_token
    }), 200


# 3️⃣ Set Password
@customer_auth_bp.route("/set-password", methods=["POST"])
def customer_set_password():
    data = request.json
    token = data.get("token")
    new_password = data.get("password")

    if not token or not new_password:
        return jsonify({"error": "Missing token or password"}), 400

    user = users_collection.find_one({"reset_token": token})
    if not user:
        return jsonify({"error": "Invalid or expired token"}), 404

    hashed_password = generate_password_hash(new_password)

    users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"password": hashed_password}, "$unset": {"reset_token": ""}}
    )

    return jsonify({"message": "Customer password reset successfully."}), 200
