# routes/vendor_invite_routes.py
# Marketing-subuser vendor outreach: send a prospective vendor an invite
# email (their name/phone/business info pre-captured), which links to the
# registration form with those fields prefilled. Uses one saved, editable
# template (see admin_settings_routes.py) merged with each invite's data —
# nobody rewrites the email per vendor, they just fill in the recipient's
# details and send.
import secrets
from datetime import datetime, timedelta

from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, request, jsonify

from config import FRONTEND_URL
from database import vendor_invites_collection, platform_settings_collection
from utils.auth_utils import subuser_token_required, require_permission
from utils.email_utils import send_email

vendor_invite_bp = Blueprint("vendor_invite_bp", __name__)

_SETTINGS_DOC_ID = "platform"
INVITE_EXPIRY_DAYS = 14

DEFAULT_INVITE_TEMPLATE = {
    "subject": "You're invited to sell on Citimart",
    "body": (
        "<p>Hi {{name}},</p>"
        "<p>We'd love to have <strong>{{businessName}}</strong> as a seller on Citimart.</p>"
        "<p>Click below to complete your vendor registration — "
        "we've already filled in what we know:</p>"
        "<p><a href=\"{{inviteLink}}\">Complete Your Registration</a></p>"
        "<p>Looking forward to having you on board!</p>"
    ),
}


def _render(template_str, data):
    out = template_str
    for key, value in data.items():
        out = out.replace("{{" + key + "}}", value or "")
    return out


def get_invite_template():
    doc = platform_settings_collection.find_one({"_id": _SETTINGS_DOC_ID}) or {}
    template = doc.get("vendorInviteTemplate")
    if not template or not template.get("subject") or not template.get("body"):
        return DEFAULT_INVITE_TEMPLATE
    return template


@vendor_invite_bp.route("/subuser/vendor-invites", methods=["POST"])
@subuser_token_required
@require_permission("vendor_invites")
def send_vendor_invite(current_subuser):
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip()
    if not email:
        return jsonify({"error": "email is required"}), 400

    name = (data.get("name") or "").strip()
    phone = (data.get("phone") or "").strip()
    business_name = (data.get("businessName") or "").strip()
    business_type = (data.get("businessType") or "").strip()

    token = secrets.token_urlsafe(24)
    now = datetime.utcnow()

    invite = {
        "email": email,
        "name": name,
        "phone": phone,
        "businessName": business_name,
        "businessType": business_type,
        "token": token,
        "status": "sent",
        "sentBy": current_subuser["_id"],
        "sentAt": now,
        "expiresAt": now + timedelta(days=INVITE_EXPIRY_DAYS),
    }
    vendor_invites_collection.insert_one(invite)

    invite_link = f"{FRONTEND_URL}/register-vendor?invite={token}"
    template = get_invite_template()
    merge_data = {
        "name": name or "there",
        "businessName": business_name or "your business",
        "phone": phone,
        "inviteLink": invite_link,
    }
    subject = _render(template["subject"], merge_data)
    body = _render(template["body"], merge_data)
    send_email(email, subject, body, html=True)

    return jsonify({"message": "Invite sent", "inviteLink": invite_link}), 201


@vendor_invite_bp.route("/subuser/vendor-invites", methods=["GET"])
@subuser_token_required
@require_permission("vendor_invites")
def list_vendor_invites(current_subuser):
    docs = list(vendor_invites_collection.find({}).sort("sentAt", -1).limit(200))
    for d in docs:
        d["_id"] = str(d["_id"])
        d["sentAt"] = d["sentAt"].isoformat() if d.get("sentAt") else None
        d["expiresAt"] = d["expiresAt"].isoformat() if d.get("expiresAt") else None
    return jsonify({"invites": docs}), 200


# Public — the vendor clicking the emailed link has no auth token yet.
@vendor_invite_bp.route("/vendor-invites/<token>", methods=["GET"])
def get_vendor_invite(token):
    invite = vendor_invites_collection.find_one({"token": token})
    if not invite:
        return jsonify({"error": "Invite not found"}), 404
    if invite.get("expiresAt") and invite["expiresAt"] < datetime.utcnow():
        return jsonify({"error": "This invite has expired"}), 410

    return jsonify({
        "email": invite.get("email"),
        "name": invite.get("name"),
        "phone": invite.get("phone"),
        "businessName": invite.get("businessName"),
        "businessType": invite.get("businessType"),
    }), 200


def mark_invite_registered(token):
    """Called from register_vendor() once the vendor actually submits the
    form — best-effort, must never break registration if it fails."""
    if not token:
        return
    try:
        vendor_invites_collection.update_one(
            {"token": token},
            {"$set": {"status": "registered", "registeredAt": datetime.utcnow()}}
        )
    except Exception:
        pass
