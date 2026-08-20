
from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from datetime import datetime
from database import contact_messages_collection, faqs_collection
public_bp = Blueprint("public_bp", __name__)

# ---------------- Contact Us ----------------
@public_bp.route("/contact", methods=["POST"])
@cross_origin()
def contact_us():
    data = request.json
    name = data.get("name", "").strip()
    email = data.get("email", "").strip()
    subject = data.get("subject", "").strip()
    message = data.get("message", "").strip()

    if not name or not email or not message:
        return jsonify({"error": "Missing required fields"}), 400

    # Store in MongoDB
    contact_messages_collection.insert_one({
        "name": name,
        "email": email,
        "subject": subject,
        "message": message,
        "created_at": datetime.utcnow()
    })

    print(f"Contact message stored in DB from {name} <{email}>")

    return jsonify({"success": True, "message": "Message received!"}), 200

# ---------------- FAQ ----------------
@public_bp.route("/faq", methods=["GET"])
@cross_origin()
def get_faq():
    docs = list(faqs_collection.find({"status": "published"}).sort("order", 1))
    faqs = [
        {
            "_id": str(d["_id"]),
            "question": d.get("question", ""),
            "answer": d.get("answer", ""),
            "category": d.get("category", "General"),
        }
        for d in docs
    ]
    return jsonify({"success": True, "faqs": faqs}), 200
