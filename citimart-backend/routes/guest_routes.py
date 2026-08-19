# routes/guest_routes.py
import os
import re
from datetime import datetime
from urllib.parse import quote

from flask import Blueprint, request, jsonify

from database import guest_leads_collection
from utils.email_utils import send_guest_invite_email

guest_bp = Blueprint("guest_bp", __name__, url_prefix="/guest")

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


@guest_bp.route("/capture-lead", methods=["POST"])
def capture_lead():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    product_id = data.get("product_id")
    product_name = data.get("product_name")

    if not email or not EMAIL_RE.match(email):
        return jsonify({"error": "Please enter a valid email address"}), 400

    now = datetime.utcnow()
    guest_leads_collection.update_one(
        {"email": email},
        {
            "$set": {
                "email": email,
                "last_product_id": product_id,
                "last_product_name": product_name,
                "invited_at": now,
            },
            "$setOnInsert": {
                "created_at": now,
                "converted": False,
            },
            "$inc": {"invite_count": 1},
        },
        upsert=True,
    )

    register_link = f"{FRONTEND_URL}/register?email={quote(email)}"
    send_guest_invite_email(email, register_link, product_name)

    return jsonify({"message": "Invite sent — check your inbox!"}), 200
