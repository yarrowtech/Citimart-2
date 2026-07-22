from flask import Blueprint, jsonify, request
import json
import os
import cloudinary.uploader
from cloudinary_config import cloudinary  

home_bp = Blueprint("home_bp", __name__)

# JSON file to keep homepage structure
DATA_FILE = "homepage_data.json"

# Default data structure
DEFAULT_DATA = {
    "heroBanners": [],
    "categories": [],
    "trendingNow": [],
    "featuredProducts": [],
    "brands": [],
    "reviews": [],
}


def load_homepage_data():
    """Load homepage data from file."""
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r") as f:
                return json.load(f)
        except Exception:
            return DEFAULT_DATA.copy()
    return DEFAULT_DATA.copy()


def save_homepage_data(data):
    """Save homepage data to JSON file."""
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)


# ----------------------------------
# 📤 Upload Image to Cloudinary
# ----------------------------------
@home_bp.route("/api/upload", methods=["POST"])
def upload_image():
    """Upload image to Cloudinary and return URL."""
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]

    try:
        upload_result = cloudinary.uploader.upload(file, folder="homepage_assets")
        return jsonify({"url": upload_result["secure_url"]}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ----------------------------------
# 💾 POST Save Homepage Content
# ----------------------------------

@home_bp.route("/api/homepage", methods=["POST"])
def update_homepage():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data received"}), 400

        save_homepage_data(data)
        return jsonify({"message": "Homepage updated successfully!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

from bson import ObjectId
from database import products_collection

@home_bp.route("/api/homepage", methods=["GET"])
def get_homepage():
    data = load_homepage_data()

    # ------------------------------
    # 🔥 Enrich Trending Now
    # ------------------------------
    enriched_trending = []
    for item in data.get("trendingNow", []):
        product_id = item.get("product_id") or item.get("_id")
        enriched_item = item.copy()  # default fallback
        if product_id:
            try:
                product = products_collection.find_one({"_id": ObjectId(product_id)})
                if product:
                    product["_id"] = str(product["_id"])
                    enriched_item = {
                        "_id": product["_id"],
                        "name": product.get("name"),
                        "price": product.get("price"),
                        "img": (product.get("images") or [None])[0],
                    }
            except Exception as e:
                print(f"⚠️ Skipping invalid trending product_id {product_id}: {e}")
        enriched_trending.append(enriched_item)

    data["trendingNow"] = enriched_trending

    # ------------------------------
    # ⭐ Enrich Featured Products (same style)
    # ------------------------------
    enriched_featured = []
    for item in data.get("featuredProducts", []):
        product_id = item.get("product_id") or item.get("_id")
        enriched_item = item.copy()
        if product_id:
            try:
                product = products_collection.find_one({"_id": ObjectId(product_id)})
                if product:
                    product["_id"] = str(product["_id"])
                    enriched_item = {
                        "_id": product["_id"],
                        "name": product.get("name"),
                        "price": product.get("price"),
                        "img": (product.get("images") or [None])[0],
                        "rating": product.get("rating", 4.5),  # optional extra
                    }
            except Exception as e:
                print(f"⚠️ Skipping invalid featured product_id {product_id}: {e}")
        enriched_featured.append(enriched_item)

    data["featuredProducts"] = enriched_featured

    return jsonify(data), 200


#  RESET Homepage 
@home_bp.route("/api/homepage/reset", methods=["POST"])
def reset_homepage():
    save_homepage_data(DEFAULT_DATA)
    return jsonify({"message": "Homepage reset to defaults"}), 200
