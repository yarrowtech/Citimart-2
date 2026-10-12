import hashlib
import re
import secrets
from datetime import datetime
from functools import wraps
from flask import Blueprint, jsonify, request
from bson import ObjectId
from database import vendors_collection, products_collection, orders_collection
from utils.auth_utils import token_required
from cloudinary_config import cloudinary
import cloudinary.uploader

vendor_integration_bp = Blueprint("vendor_integration", __name__)

@vendor_integration_bp.route("/api/vendor/integration", methods=["GET", "PUT"])
@token_required
def settings(current_vendor):
    if current_vendor["role"] != "vendor": return jsonify(error="Unauthorized"), 403
    oid = ObjectId(current_vendor["_id"])
    if request.method == "GET":
        data = (vendors_collection.find_one({"_id": oid}) or {}).get("website_integration", {})
        data.pop("api_key_hash", None); data["has_api_key"] = bool((vendors_collection.find_one({"_id": oid}) or {}).get("website_integration", {}).get("api_key_hash"))
        return jsonify(data)
    data = request.get_json(silent=True) or {}
    saved = {"website_url": str(data.get("website_url") or ""), "webhook_url": str(data.get("webhook_url") or ""), "enabled": bool(data.get("enabled")), "accept_orders": bool(data.get("accept_orders", True)), "updated_at": datetime.utcnow()}
    vendors_collection.update_one({"_id": oid}, {"$set": {f"website_integration.{k}": v for k, v in saved.items()}})
    return jsonify(message="Website integration saved")

@vendor_integration_bp.route("/api/vendor/integration/api-key", methods=["POST"])
@token_required
def create_key(current_vendor):
    if current_vendor["role"] != "vendor": return jsonify(error="Unauthorized"), 403
    key = "cm_live_" + secrets.token_urlsafe(32)
    vendors_collection.update_one({"_id": ObjectId(current_vendor["_id"])}, {"$set": {"website_integration.api_key_hash": hashlib.sha256(key.encode()).hexdigest()}})
    return jsonify(api_key=key), 201

def required(fn):
    @wraps(fn)
    def inner(*args, **kwargs):
        key = request.headers.get("X-Citimart-Api-Key", "")
        vendor = vendors_collection.find_one({"website_integration.api_key_hash": hashlib.sha256(key.encode()).hexdigest(), "website_integration.enabled": True}) if key else None
        if not vendor: return jsonify(error="Valid X-Citimart-Api-Key required"), 401
        return fn(vendor, *args, **kwargs)
    return inner

@vendor_integration_bp.route("/integrations/v1/products")
@required
def products(vendor):
    rows = list(products_collection.find({"vendor_id": str(vendor["_id"]), "status": {"$in": ["active", "approved"]}}))
    for row in rows: row["_id"] = str(row["_id"])
    return jsonify(products=rows)

@vendor_integration_bp.route("/api/store/<vendor_id>")
def storefront(vendor_id):
    try:
        vendor = vendors_collection.find_one({"_id": ObjectId(vendor_id), "status": "approved"})
    except Exception:
        vendor = None
    if not vendor:
        return jsonify(error="Store not found"), 404
    rows = list(products_collection.find({"vendor_id": vendor_id, "status": {"$in": ["active", "approved"]}}).sort("created_at", -1))
    for row in rows:
        row["_id"] = str(row["_id"])
        row.pop("cost_price", None)
    profile = vendor.get("profile") or {}
    return jsonify({
        "store": {
            "id": vendor_id,
            "name": vendor.get("businessName") or vendor.get("business_name") or vendor.get("fullName") or "Citimart Store",
            "description": profile.get("description") or vendor.get("description") or "",
            "logo": profile.get("logo") or vendor.get("logo") or "",
            "website_url": (vendor.get("website_integration") or {}).get("website_url") or "",
        },
        "products": rows,
    })

def _slug(value):
    return re.sub(r"[^a-z0-9]+", "-", (value or "").strip().lower()).strip("-")[:70]

@vendor_integration_bp.route("/api/vendor/storefront", methods=["GET", "PUT"])
@token_required
def manage_storefront(current_vendor):
    if current_vendor["role"] != "vendor": return jsonify(error="Unauthorized"), 403
    oid, vendor_id = ObjectId(current_vendor["_id"]), current_vendor["_id"]
    vendor = vendors_collection.find_one({"_id": oid}) or {}
    if request.method == "GET":
        store = vendor.get("storefront") or {}
        logo = (vendor.get("profile") or {}).get("logo") or ""
        return jsonify({"storefront": {**store, "logo": logo}, "url": f"/store/{store.get('slug') or vendor_id}"})
    data = request.get_json(silent=True) or {}; slug = _slug(data.get("slug"))
    if not slug or len(slug) < 3: return jsonify(error="Store URL must contain at least 3 letters or numbers"), 400
    other = vendors_collection.find_one({"storefront.slug": slug, "_id": {"$ne": oid}})
    if other: return jsonify(error="That store URL is already in use"), 409
    store = {"slug": slug, "published": bool(data.get("published")), "name": str(data.get("name") or "").strip(), "description": str(data.get("description") or "").strip(), "banner": str(data.get("banner") or "").strip(), "updated_at": datetime.utcnow()}
    vendors_collection.update_one({"_id": oid}, {"$set": {"storefront": store}})
    return jsonify(message="Storefront saved", url=f"/store/{slug}")

ALLOWED_LOGO_TYPES = {"image/png", "image/jpeg", "image/webp"}
MAX_LOGO_BYTES = 5 * 1024 * 1024  # 5MB

@vendor_integration_bp.route("/api/vendor/storefront/logo", methods=["PUT", "DELETE"])
@token_required
def vendor_storefront_logo(current_vendor):
    if current_vendor["role"] != "vendor": return jsonify(error="Unauthorized"), 403
    oid = ObjectId(current_vendor["_id"])

    if request.method == "DELETE":
        vendors_collection.update_one({"_id": oid}, {"$unset": {"profile.logo": ""}})
        return jsonify(message="Logo removed")

    file = request.files.get("logo")
    if not file or not file.filename:
        return jsonify(error="A logo image file is required"), 400
    if file.mimetype not in ALLOWED_LOGO_TYPES:
        return jsonify(error="Logo must be a PNG, JPEG, or WEBP image"), 400
    file.seek(0, 2)
    size = file.tell()
    file.seek(0)
    if size > MAX_LOGO_BYTES:
        return jsonify(error="Logo must be under 5MB"), 400

    upload = cloudinary.uploader.upload(
        file, folder="citimart/vendors/logos",
        transformation=[{"width": 400, "height": 400, "crop": "limit"}],
    )
    vendors_collection.update_one({"_id": oid}, {"$set": {"profile.logo": upload["secure_url"]}})
    return jsonify(message="Logo updated", logo=upload["secure_url"])

@vendor_integration_bp.route("/api/storefront/<slug>")
def storefront_by_slug(slug):
    vendor = vendors_collection.find_one({"storefront.slug": _slug(slug), "storefront.published": True, "status": "approved"})
    if not vendor: return jsonify(error="Store not found"), 404
    vendor_id = str(vendor["_id"]); rows = list(products_collection.find({"vendor_id": vendor_id, "status": {"$in": ["active", "approved"]}, "storefront_visible": {"$ne": False}}).sort("created_at", -1))
    for row in rows: row["_id"] = str(row["_id"]); row.pop("cost_price", None)
    store = vendor.get("storefront") or {}
    return jsonify({"store": {"id": vendor_id, "slug": store.get("slug"), "name": store.get("name") or vendor.get("businessName") or vendor.get("business_name") or "Citimart Store", "description": store.get("description") or "", "banner": store.get("banner") or "", "logo": (vendor.get("profile") or {}).get("logo") or ""}, "products": rows})

@vendor_integration_bp.route("/api/vendor/storefront/products/<product_id>", methods=["PUT"])
@token_required
def storefront_product(current_vendor, product_id):
    if current_vendor["role"] != "vendor": return jsonify(error="Unauthorized"), 403
    data = request.get_json(silent=True) or {}
    update = {}
    if "visible" in data: update["storefront_visible"] = bool(data["visible"])
    if "featured" in data: update["storefront_featured"] = bool(data["featured"])
    if not update: return jsonify(error="visible or featured is required"), 400
    result = products_collection.update_one({"_id": ObjectId(product_id), "vendor_id": current_vendor["_id"]}, {"$set": update})
    if not result.matched_count: return jsonify(error="Product not found"), 404
    return jsonify(message="Storefront product settings saved", settings=update)

@vendor_integration_bp.route("/api/vendor/storefront/products", methods=["GET"])
@token_required
def storefront_products(current_vendor):
    if current_vendor["role"] != "vendor": return jsonify(error="Unauthorized"), 403
    rows = list(products_collection.find({"vendor_id": current_vendor["_id"]}, {"name": 1, "image": 1, "price": 1, "storefront_visible": 1, "storefront_featured": 1}))
    for row in rows: row["_id"] = str(row["_id"])
    return jsonify(products=rows)
