# routes/subuser_content_routes.py
# FAQ / Content / Media management for subusers holding the matching
# permission, plus a profile endpoint the dashboard uses to know which
# tabs to render. Real CRUD backed by Mongo (+ Cloudinary for media) —
# nothing here is placeholder data.
from datetime import datetime
from functools import wraps

from bson import ObjectId
from flask import Blueprint, request, jsonify

import cloudinary.uploader
from database import faqs_collection, content_snippets_collection, media_library_collection, offers_collection
from utils.auth_utils import subuser_token_required, require_permission
from routes.offers_routes import serialize_offer, update_offer_status, extract_offer_data

subuser_content_bp = Blueprint("subuser_content_bp", __name__, url_prefix="/subuser")


def require_any_permission(*keys):
    """Like require_permission, but passes if ANY of the given keys is granted
    — promotions and campaigns both map onto the same underlying offers tool."""
    def decorator(f):
        @wraps(f)
        def decorated(current_subuser, *args, **kwargs):
            perms = current_subuser.get("permissions", {})
            if not any(perms.get(k) for k in keys):
                return jsonify({'error': f'Missing required permission: one of {keys}'}), 403
            return f(current_subuser, *args, **kwargs)
        return decorated
    return decorator


# ── Profile ───────────────────────────────────────────────────────────────
@subuser_content_bp.route("/me", methods=["GET"])
@subuser_token_required
def get_my_profile(current_subuser):
    return jsonify({
        "id": current_subuser["_id"],
        "email": current_subuser.get("email"),
        "role": current_subuser.get("role"),
        "parentType": current_subuser.get("parentType"),
        "permissions": current_subuser.get("permissions", {}),
    }), 200


# ── FAQ ───────────────────────────────────────────────────────────────────
def _serialize_faq(doc):
    return {
        "_id": str(doc["_id"]),
        "question": doc.get("question", ""),
        "answer": doc.get("answer", ""),
        "category": doc.get("category", "General"),
        "status": doc.get("status", "published"),
        "order": doc.get("order", 0),
        "updated_at": doc.get("updated_at").isoformat() if doc.get("updated_at") else None,
    }


@subuser_content_bp.route("/faq", methods=["GET"])
@subuser_token_required
@require_permission("faq")
def list_faqs(current_subuser):
    docs = list(faqs_collection.find({}).sort("order", 1))
    return jsonify({"faqs": [_serialize_faq(d) for d in docs]}), 200


@subuser_content_bp.route("/faq", methods=["POST"])
@subuser_token_required
@require_permission("faq")
def create_faq(current_subuser):
    data = request.get_json(silent=True) or {}
    question = (data.get("question") or "").strip()
    answer = (data.get("answer") or "").strip()
    if not question or not answer:
        return jsonify({"error": "question and answer are required"}), 400

    count = faqs_collection.count_documents({})
    doc = {
        "question": question,
        "answer": answer,
        "category": data.get("category", "General"),
        "status": data.get("status", "published"),
        "order": count,
        "created_by": current_subuser["email"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = faqs_collection.insert_one(doc)
    doc["_id"] = result.inserted_id
    return jsonify({"message": "FAQ created", "faq": _serialize_faq(doc)}), 201


@subuser_content_bp.route("/faq/<faq_id>", methods=["PUT"])
@subuser_token_required
@require_permission("faq")
def update_faq(current_subuser, faq_id):
    data = request.get_json(silent=True) or {}
    updates = {"updated_at": datetime.utcnow()}
    for field in ("question", "answer", "category", "status", "order"):
        if field in data:
            updates[field] = data[field]

    result = faqs_collection.update_one({"_id": ObjectId(faq_id)}, {"$set": updates})
    if result.matched_count == 0:
        return jsonify({"error": "FAQ not found"}), 404
    return jsonify({"message": "FAQ updated"}), 200


@subuser_content_bp.route("/faq/<faq_id>", methods=["DELETE"])
@subuser_token_required
@require_permission("faq")
def delete_faq(current_subuser, faq_id):
    result = faqs_collection.delete_one({"_id": ObjectId(faq_id)})
    if result.deleted_count == 0:
        return jsonify({"error": "FAQ not found"}), 404
    return jsonify({"message": "FAQ deleted"}), 200


# ── Content snippets (homepage/about/policy blurbs etc.) ───────────────────
def _serialize_content(doc):
    return {
        "_id": str(doc["_id"]),
        "title": doc.get("title", ""),
        "body": doc.get("body", ""),
        "page": doc.get("page", "home"),
        "status": doc.get("status", "draft"),
        "updated_at": doc.get("updated_at").isoformat() if doc.get("updated_at") else None,
    }


@subuser_content_bp.route("/content", methods=["GET"])
@subuser_token_required
@require_permission("content")
def list_content(current_subuser):
    docs = list(content_snippets_collection.find({}).sort("updated_at", -1))
    return jsonify({"content": [_serialize_content(d) for d in docs]}), 200


@subuser_content_bp.route("/content", methods=["POST"])
@subuser_token_required
@require_permission("content")
def create_content(current_subuser):
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    body = (data.get("body") or "").strip()
    if not title or not body:
        return jsonify({"error": "title and body are required"}), 400

    doc = {
        "title": title,
        "body": body,
        "page": data.get("page", "home"),
        "status": data.get("status", "draft"),
        "created_by": current_subuser["email"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = content_snippets_collection.insert_one(doc)
    doc["_id"] = result.inserted_id
    return jsonify({"message": "Content created", "content": _serialize_content(doc)}), 201


@subuser_content_bp.route("/content/<content_id>", methods=["PUT"])
@subuser_token_required
@require_permission("content")
def update_content(current_subuser, content_id):
    data = request.get_json(silent=True) or {}
    updates = {"updated_at": datetime.utcnow()}
    for field in ("title", "body", "page", "status"):
        if field in data:
            updates[field] = data[field]

    result = content_snippets_collection.update_one({"_id": ObjectId(content_id)}, {"$set": updates})
    if result.matched_count == 0:
        return jsonify({"error": "Content not found"}), 404
    return jsonify({"message": "Content updated"}), 200


@subuser_content_bp.route("/content/<content_id>", methods=["DELETE"])
@subuser_token_required
@require_permission("content")
def delete_content(current_subuser, content_id):
    result = content_snippets_collection.delete_one({"_id": ObjectId(content_id)})
    if result.deleted_count == 0:
        return jsonify({"error": "Content not found"}), 404
    return jsonify({"message": "Content deleted"}), 200


# ── Media library ────────────────────────────────────────────────────────
def _serialize_media(doc):
    return {
        "_id": str(doc["_id"]),
        "url": doc.get("url", ""),
        "filename": doc.get("filename", ""),
        "uploaded_by": doc.get("uploaded_by", ""),
        "uploaded_at": doc.get("uploaded_at").isoformat() if doc.get("uploaded_at") else None,
    }


@subuser_content_bp.route("/media", methods=["GET"])
@subuser_token_required
@require_permission("media")
def list_media(current_subuser):
    docs = list(media_library_collection.find({}).sort("uploaded_at", -1))
    return jsonify({"media": [_serialize_media(d) for d in docs]}), 200


@subuser_content_bp.route("/media", methods=["POST"])
@subuser_token_required
@require_permission("media")
def upload_media(current_subuser):
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    upload_result = cloudinary.uploader.upload(file, folder="citimart/subuser_media")

    doc = {
        "url": upload_result["secure_url"],
        "filename": file.filename,
        "uploaded_by": current_subuser["email"],
        "uploaded_at": datetime.utcnow(),
    }
    result = media_library_collection.insert_one(doc)
    doc["_id"] = result.inserted_id
    return jsonify({"message": "Media uploaded", "media": _serialize_media(doc)}), 201


@subuser_content_bp.route("/media/<media_id>", methods=["DELETE"])
@subuser_token_required
@require_permission("media")
def delete_media(current_subuser, media_id):
    result = media_library_collection.delete_one({"_id": ObjectId(media_id)})
    if result.deleted_count == 0:
        return jsonify({"error": "Media not found"}), 404
    return jsonify({"message": "Media deleted"}), 200


# ── Promotions / Campaigns (both map onto the same offers system) ─────────
# The existing /api/offers/* routes are gated by @token_required, which only
# recognizes customer/vendor/admin tokens (looked up in users_collection) —
# a subuser's JWT has a different shape ("sub" not "user_id") and subusers
# live in a separate collection, so those routes were unreachable for
# subusers despite checking `role == "subuser"`. These mirror the same
# offers_collection and helpers under the subuser auth scheme instead.
@subuser_content_bp.route("/offers", methods=["GET"])
@subuser_token_required
@require_any_permission("promotions", "campaigns")
def subuser_list_offers(current_subuser):
    update_offer_status()
    offers = list(offers_collection.find())
    return jsonify([serialize_offer(o) for o in offers]), 200


@subuser_content_bp.route("/offers", methods=["POST"])
@subuser_token_required
@require_any_permission("promotions", "campaigns")
def subuser_create_offer(current_subuser):
    err, offer_data = extract_offer_data()
    if err:
        return jsonify(err), 400
    offer_data["created_by"] = current_subuser["email"]

    result = offers_collection.insert_one(offer_data)
    offer_data["_id"] = str(result.inserted_id)
    return jsonify(serialize_offer(offer_data)), 201


@subuser_content_bp.route("/offers/<offer_id>", methods=["PUT"])
@subuser_token_required
@require_any_permission("promotions", "campaigns")
def subuser_update_offer(current_subuser, offer_id):
    err, offer_data = extract_offer_data()
    if err:
        return jsonify(err), 400
    offer_data.pop("created_at", None)

    result = offers_collection.update_one({"_id": ObjectId(offer_id)}, {"$set": offer_data})
    if result.matched_count == 0:
        return jsonify({"error": "Offer not found"}), 404
    updated_offer = offers_collection.find_one({"_id": ObjectId(offer_id)})
    return jsonify(serialize_offer(updated_offer)), 200


@subuser_content_bp.route("/offers/<offer_id>", methods=["DELETE"])
@subuser_token_required
@require_any_permission("promotions", "campaigns")
def subuser_delete_offer(current_subuser, offer_id):
    result = offers_collection.delete_one({"_id": ObjectId(offer_id)})
    if result.deleted_count == 0:
        return jsonify({"error": "Offer not found"}), 404
    return jsonify({"success": True, "message": "Offer deleted"}), 200


# ── Reports / Analytics (reuse the existing rich admin summary) ───────────
@subuser_content_bp.route("/reports", methods=["GET"])
@subuser_token_required
@require_any_permission("reports", "analytics")
def subuser_reports(current_subuser):
    from routes.admin_dashboard_routes import dashboard_summary
    return dashboard_summary()


# ── Merchandise (product + stock overview) ─────────────────────────────────
@subuser_content_bp.route("/merchandise", methods=["GET"])
@subuser_token_required
@require_permission("merchandise")
def subuser_merchandise(current_subuser):
    from routes.inventory_routes import get_inventory
    return get_inventory()


# ── Complaints (reuse the existing admin complaints tool) ──────────────────
@subuser_content_bp.route("/complaints", methods=["GET"])
@subuser_token_required
@require_permission("complaints")
def subuser_complaints(current_subuser):
    from routes.complaints import get_all_complaints
    return get_all_complaints()


@subuser_content_bp.route("/complaints/<complaint_id>", methods=["PUT"])
@subuser_token_required
@require_permission("complaints")
def subuser_update_complaint(current_subuser, complaint_id):
    from routes.complaints import update_complaint_status
    return update_complaint_status(complaint_id)


# ── Categories (reuse the existing admin category tree tool) ──────────────
@subuser_content_bp.route("/categories", methods=["GET"])
@subuser_token_required
@require_permission("merchandise")
def subuser_get_categories(current_subuser):
    from routes.category_routes import get_categories
    return get_categories()


@subuser_content_bp.route("/categories", methods=["POST"])
@subuser_token_required
@require_permission("merchandise")
def subuser_add_category(current_subuser):
    from routes.category_routes import add_category
    return add_category()


@subuser_content_bp.route("/categories/edit", methods=["PUT"])
@subuser_token_required
@require_permission("merchandise")
def subuser_edit_category(current_subuser):
    from routes.category_routes import edit_category
    return edit_category()


@subuser_content_bp.route("/categories/delete", methods=["DELETE"])
@subuser_token_required
@require_permission("merchandise")
def subuser_delete_category(current_subuser):
    from routes.category_routes import delete_category
    return delete_category()


# ── Collections (reuse the existing admin/merchandise collections tool) ───
@subuser_content_bp.route("/collections", methods=["GET"])
@subuser_token_required
@require_permission("merchandise")
def subuser_get_collections(current_subuser):
    from routes.collection_routes import get_all_collections
    return get_all_collections()


@subuser_content_bp.route("/collections", methods=["POST"])
@subuser_token_required
@require_permission("merchandise")
def subuser_add_collection(current_subuser):
    from routes.collection_routes import add_collection
    return add_collection()


@subuser_content_bp.route("/collections/<collection_id>", methods=["PUT"])
@subuser_token_required
@require_permission("merchandise")
def subuser_update_collection(current_subuser, collection_id):
    from routes.collection_routes import update_collection
    return update_collection(collection_id)


@subuser_content_bp.route("/collections/<collection_id>", methods=["DELETE"])
@subuser_token_required
@require_permission("merchandise")
def subuser_delete_collection(current_subuser, collection_id):
    from routes.collection_routes import delete_collection
    return delete_collection(collection_id)
