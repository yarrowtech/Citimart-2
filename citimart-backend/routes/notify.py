# routes/notify.py
from flask import Blueprint, request, jsonify
from database import notify_collection
from datetime import datetime

notify_bp = Blueprint("notify", __name__)

@notify_bp.route("/customer/notify-me", methods=["POST"])
def notify_me():
    data = request.json
    customer_id = data.get("customer_id")
    product_id = data.get("product_id")
    customer_email = data.get("customer_email")

    if not customer_id or not product_id or not customer_email:
        return jsonify({"error": "Missing fields"}), 400

    # Check if already subscribed
    existing = notify_collection.find_one({
        "customer_id": customer_id,
        "product_id": product_id
    })
    if existing:
        return jsonify({"message": "Already subscribed"}), 200

    notify_collection.insert_one({
        "customer_id": customer_id,
        "customer_email": customer_email,
        "product_id": product_id,
        "created_at": datetime.utcnow()
    })

    return jsonify({"message": "Subscribed successfully"}), 200
