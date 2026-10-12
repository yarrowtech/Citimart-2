# routes/vendor_settings.py
# Vendor-facing account settings. Deliberately scoped to what the rest of
# the app actually reads or acts on:
#   - Profile: the real top-level vendor fields (businessName, fullName,
#     phone, businessType, businessAddress) shown on KYB, admin vendor
#     review, invoices, etc. — not a disconnected "profile" sub-document.
#   - Password: actually changes the login credential (werkzeug hash),
#     matching how login_vendor() checks it.
#   - Payments: bank/UPI details kept as a reference for the finance team
#     to use when processing manual payouts (see routes/finance_routes.py).
# GST/PAN/business-registration live in the separate KYB flow
# (vendor_kyb_routes.py) and are not duplicated here. Shipping, catalog,
# notification-preference, report-scheduling and "compliance" tabs were
# removed — nothing in the app reads those fields, so they did nothing.
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash

from bson import ObjectId

from database import vendors_collection
from utils.auth_utils import token_required

vendor_settings_bp = Blueprint('vendor_settings', __name__)

PROFILE_FIELDS = ["businessName", "fullName", "phone", "businessType", "businessAddress"]
PAYMENT_FIELDS = ["holderName", "bankName", "accountNumber", "ifsc", "upi"]


def _require_vendor(current_vendor):
    if current_vendor.get("role") != "vendor":
        return jsonify({"error": "Unauthorized"}), 403
    return None


# ------------------ PROFILE ------------------
@vendor_settings_bp.route('/settings/profile', methods=['GET', 'PUT'])
@token_required
def vendor_profile(current_vendor):
    error = _require_vendor(current_vendor)
    if error:
        return error
    vendor_id = ObjectId(current_vendor['_id'])

    if request.method == 'GET':
        vendor = vendors_collection.find_one({'_id': vendor_id})
        if not vendor:
            return jsonify({"error": "Vendor not found"}), 404
        return jsonify({
            "email": vendor.get("email", ""),
            "businessName": vendor.get("businessName", ""),
            "fullName": vendor.get("fullName", ""),
            "phone": vendor.get("phone", ""),
            "businessType": vendor.get("businessType", ""),
            "businessAddress": vendor.get("businessAddress", ""),
            "status": vendor.get("status", ""),
            "kybStatus": vendor.get("kybStatus", "not_submitted"),
        }), 200

    data = request.get_json(silent=True) or {}
    updates = {}
    for field in PROFILE_FIELDS:
        if field in data:
            value = (data[field] or "").strip()
            if not value:
                return jsonify({"error": f"{field} cannot be empty"}), 400
            updates[field] = value
    if not updates:
        return jsonify({"error": "Nothing to update"}), 400

    vendors_collection.update_one({'_id': vendor_id}, {'$set': updates})
    return jsonify({'message': 'Profile updated successfully'}), 200


# ------------------ PASSWORD ------------------
@vendor_settings_bp.route('/settings/password', methods=['PUT'])
@token_required
def vendor_change_password(current_vendor):
    error = _require_vendor(current_vendor)
    if error:
        return error
    vendor_id = ObjectId(current_vendor['_id'])

    data = request.get_json(silent=True) or {}
    current_password = data.get("currentPassword", "")
    new_password = data.get("newPassword", "")
    if not current_password or not new_password:
        return jsonify({"error": "Current and new password are required"}), 400
    if len(new_password) < 8:
        return jsonify({"error": "New password must be at least 8 characters"}), 400

    vendor = vendors_collection.find_one({'_id': vendor_id})
    if not vendor or not check_password_hash(vendor.get("password", ""), current_password):
        return jsonify({"error": "Current password is incorrect"}), 401

    vendors_collection.update_one(
        {'_id': vendor_id}, {'$set': {'password': generate_password_hash(new_password)}}
    )
    return jsonify({'message': 'Password updated successfully'}), 200


# ------------------ PAYMENTS ------------------
@vendor_settings_bp.route('/settings/payments', methods=['GET', 'PUT'])
@token_required
def vendor_payments(current_vendor):
    error = _require_vendor(current_vendor)
    if error:
        return error
    vendor_id = ObjectId(current_vendor['_id'])

    if request.method == 'GET':
        vendor = vendors_collection.find_one({'_id': vendor_id}, {'payments': 1})
        return jsonify((vendor or {}).get('payments', {})), 200

    data = request.get_json(silent=True) or {}
    payment_data = {field: (data.get(field) or "").strip() for field in PAYMENT_FIELDS}
    vendors_collection.update_one({'_id': vendor_id}, {'$set': {'payments': payment_data}})
    return jsonify({'message': 'Payment info saved'}), 200
