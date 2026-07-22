from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime
from database import complaints_collection ,users_collection
from cloudinary_config import cloudinary
import cloudinary.uploader

complaints_bp = Blueprint("complaints", __name__)

# Utility: serialize Mongo document
def serialize_complaint(c):
    return {
        "id": str(c.get("_id")),
        "user_id": str(c.get("user_id")),
        "category": c.get("category"),
        "order_id": c.get("order_id"),
        "description": c.get("description"),
        "image": c.get("image"),
        "status": c.get("status"),
        "date": c.get("date"),
    }

# 🧾 File a new complaint (Customer)
@complaints_bp.route("/customer/complaints", methods=["POST"])
def file_complaint():
    try:
        user_id = request.form.get("user_id")
        category = request.form.get("category")
        order_id = request.form.get("order_id", "")
        description = request.form.get("description")

        if not user_id or not category or not description:
            return jsonify({"error": "Missing required fields"}), 400

        # 📤 Upload image to Cloudinary (optional)
        image_url = None
        if "image" in request.files:
            image = request.files["image"]
            if image:
                upload_result = cloudinary.uploader.upload(
                    image,
                    folder="complaints",
                    resource_type="image"
                )
                image_url = upload_result.get("secure_url")

        complaint = {
            "user_id": ObjectId(user_id),
            "category": category,
            "order_id": order_id,
            "description": description,
            "image": image_url,
            "status": "Pending",
            "date": datetime.utcnow().strftime("%Y-%m-%d"),
        }

        complaints_collection.insert_one(complaint)
        return jsonify({"message": "Complaint filed successfully!"}), 201

    except Exception as e:
        print("Error filing complaint:", e)
        return jsonify({"error": "Server error"}), 500


# 📋 Get all complaints for a user
@complaints_bp.route("/customer/<user_id>/complaints", methods=["GET"])
def get_user_complaints(user_id):
    try:
        complaints = complaints_collection.find({"user_id": ObjectId(user_id)})
        result = [serialize_complaint(c) for c in complaints]
        return jsonify(result), 200
    except Exception as e:
        print("Error fetching user complaints:", e)
        return jsonify({"error": "Server error"}), 500


# 👨‍💼 Admin: get all complaints
'''
@complaints_bp.route("/admin/complaints", methods=["GET"])
def get_all_complaints():
    try:
        complaints = complaints_collection.find()
        result = [serialize_complaint(c) for c in complaints]
        return jsonify(result), 200
    except Exception as e:
        print("Error fetching complaints:", e)
        return jsonify({"error": "Server error"}), 500
'''
# 👨‍💼 Admin: get all complaints
@complaints_bp.route("/admin/complaints", methods=["GET"])
def get_all_complaints():
    try:
        complaints = complaints_collection.find()
        result = []

        for c in complaints:
            username = "Unknown"
            user_id = c.get("user_id")

            if user_id:
                # ✅ Ensure we query using ObjectId
                user = users_collection.find_one({"_id": ObjectId(user_id)})
                if user:
                    # ✅ Your field is 'name', not 'username'
                    username = user.get("name") or user.get("email")

            result.append({
                "id": str(c.get("_id")),
                "user_id": str(user_id),
                "username": username,
                "category": c.get("category"),
                "order_id": c.get("order_id"),
                "description": c.get("description"),
                "image": c.get("image"),
                "status": c.get("status"),
                "date": c.get("date"),
            })

        return jsonify(result), 200

    except Exception as e:
        print("Error fetching complaints:", e)
        return jsonify({"error": "Server error"}), 500


# ✅ Admin: update complaint status
@complaints_bp.route("/admin/complaints/<complaint_id>", methods=["PUT"])
def update_complaint_status(complaint_id):
    try:
        data = request.json
        status = data.get("status")
        if not status:
            return jsonify({"error": "Missing status"}), 400

        complaints_collection.update_one(
            {"_id": ObjectId(complaint_id)},
            {"$set": {"status": status}},
        )
        return jsonify({"message": "Complaint status updated"}), 200
    except Exception as e:
        print("Error updating complaint:", e)
        return jsonify({"error": "Server error"}), 500
