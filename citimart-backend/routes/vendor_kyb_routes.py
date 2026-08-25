# routes/vendor_kyb_routes.py
# "Know Your Business" — vendors submit PAN/GST/business-registration
# numbers + certificate uploads *after* signing up, not as part of the
# registration form. Reviewed by admin or an authorized subuser (helpers
# below are reused by both — see subuser_content_routes.py). This is
# deliberately separate from the existing category/identity approval
# (vendors_collection.status) — a vendor can be fully approved and selling
# while still not verified here; finance_routes.py checks kybStatus before
# a payout can be released (Option B: sell now, get paid once verified).
import re
from datetime import datetime

from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, request, jsonify
from cloudinary_config import cloudinary
import cloudinary.uploader

from database import vendors_collection
from utils.auth_utils import token_required, admin_token_required

vendor_kyb_bp = Blueprint("vendor_kyb_bp", __name__)

PAN_REGEX = re.compile(r"^[A-Z]{5}[0-9]{4}[A-Z]$")
GST_REGEX = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$")


def _serialize_vendor_kyb(v):
    return {
        "_id": str(v["_id"]),
        "businessName": v.get("businessName"),
        "fullName": v.get("fullName"),
        "email": v.get("email"),
        "kybStatus": v.get("kybStatus", "not_submitted"),
        "panNumber": v.get("panNumber"),
        "panDocumentUrl": v.get("panDocumentUrl"),
        "gstNumber": v.get("gstNumber"),
        "gstDocumentUrl": v.get("gstDocumentUrl"),
        "businessRegNumber": v.get("businessRegNumber"),
        "businessRegDocumentUrl": v.get("businessRegDocumentUrl"),
        "kybSubmittedAt": v["kybSubmittedAt"].isoformat() if v.get("kybSubmittedAt") else None,
        "kybReviewedAt": v["kybReviewedAt"].isoformat() if v.get("kybReviewedAt") else None,
        "kybRejectionReason": v.get("kybRejectionReason"),
    }


def list_pending_kyb():
    """Reused by both the admin route below and the subuser proxy route."""
    vendors = list(vendors_collection.find({"kybStatus": "pending_review"}))
    return [_serialize_vendor_kyb(v) for v in vendors]


def review_kyb(vendor_id, new_status, reason, reviewer_id, reviewer_role):
    if new_status not in ("verified", "rejected"):
        return {"error": "status must be 'verified' or 'rejected'"}, 400
    try:
        oid = ObjectId(vendor_id)
    except InvalidId:
        return {"error": "Invalid vendor ID"}, 400

    vendor = vendors_collection.find_one({"_id": oid})
    if not vendor:
        return {"error": "Vendor not found"}, 404

    vendors_collection.update_one({"_id": oid}, {"$set": {
        "kybStatus": new_status,
        "kybRejectionReason": reason if new_status == "rejected" else None,
        "kybReviewedAt": datetime.utcnow(),
        "kybReviewedBy": reviewer_id,
        "kybReviewerRole": reviewer_role,
    }})
    return {"message": f"Business verification {new_status}"}, 200


# ── Vendor-facing ─────────────────────────────────────────────────────────
@vendor_kyb_bp.route("/vendor/kyb/status", methods=["GET"])
@token_required
def get_kyb_status(current_vendor):
    if current_vendor.get("role") != "vendor":
        return jsonify({"error": "Vendor access only"}), 403
    vendor = vendors_collection.find_one({"_id": ObjectId(current_vendor["_id"])})
    if not vendor:
        return jsonify({"error": "Vendor not found"}), 404
    return jsonify(_serialize_vendor_kyb(vendor)), 200


@vendor_kyb_bp.route("/vendor/kyb/submit", methods=["POST"])
@token_required
def submit_kyb(current_vendor):
    if current_vendor.get("role") != "vendor":
        return jsonify({"error": "Vendor access only"}), 403

    pan_number = (request.form.get("panNumber") or "").strip().upper()
    gst_number = (request.form.get("gstNumber") or "").strip().upper()
    business_reg_number = (request.form.get("businessRegNumber") or "").strip()

    if not pan_number or not gst_number or not business_reg_number:
        return jsonify({"error": "PAN, GST, and business registration number are all required"}), 400
    if not PAN_REGEX.match(pan_number):
        return jsonify({"error": "PAN number format looks invalid (expected e.g. ABCDE1234F)"}), 400
    if not GST_REGEX.match(gst_number):
        return jsonify({"error": "GST number format looks invalid (expected a 15-character GSTIN)"}), 400

    for field in ("panDocument", "gstDocument", "businessRegDocument"):
        if field not in request.files or not request.files[field].filename:
            return jsonify({"error": f"{field} file is required"}), 400

    pan_doc = cloudinary.uploader.upload(request.files["panDocument"], folder="citimart/vendors/kyb")
    gst_doc = cloudinary.uploader.upload(request.files["gstDocument"], folder="citimart/vendors/kyb")
    reg_doc = cloudinary.uploader.upload(request.files["businessRegDocument"], folder="citimart/vendors/kyb")

    vendors_collection.update_one(
        {"_id": ObjectId(current_vendor["_id"])},
        {"$set": {
            "panNumber": pan_number,
            "panDocumentUrl": pan_doc["secure_url"],
            "gstNumber": gst_number,
            "gstDocumentUrl": gst_doc["secure_url"],
            "businessRegNumber": business_reg_number,
            "businessRegDocumentUrl": reg_doc["secure_url"],
            "kybStatus": "pending_review",
            "kybRejectionReason": None,
            "kybSubmittedAt": datetime.utcnow(),
        }}
    )
    return jsonify({"message": "Business verification submitted for review"}), 200


# ── Admin review ─────────────────────────────────────────────────────────
@vendor_kyb_bp.route("/admin/kyb/pending", methods=["GET"])
@admin_token_required
def admin_list_pending_kyb(current_admin):
    return jsonify({"vendors": list_pending_kyb()}), 200


@vendor_kyb_bp.route("/admin/kyb/<vendor_id>", methods=["PUT"])
@admin_token_required
def admin_review_kyb(current_admin, vendor_id):
    data = request.get_json(silent=True) or {}
    body, status_code = review_kyb(
        vendor_id, data.get("status"), data.get("reason"),
        reviewer_id=current_admin["_id"], reviewer_role="admin",
    )
    return jsonify(body), status_code
