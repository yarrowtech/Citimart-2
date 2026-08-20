# routes/admin_settings_routes.py
# Real, working admin settings: platform info, maintenance mode (actually
# enforced, not decorative), persisted error logs, and contact-support
# ticket triage. Everything here reads/writes real Mongo collections.
from datetime import datetime

from bson import ObjectId
from flask import Blueprint, request, jsonify

from database import (
    platform_settings_collection, error_logs_collection,
    contact_messages_collection, users_collection,
)

admin_settings_bp = Blueprint("admin_settings_bp", __name__, url_prefix="/admin/settings")

DEFAULT_PLATFORM_SETTINGS = {
    "platformName": "Citimart",
    "supportEmail": "",
    "contactNumber": "",
    "currency": "INR",
    "timeZone": "Asia/Kolkata",
    "defaultLanguage": "English",
}

_SETTINGS_DOC_ID = "platform"  # single fixed document holding all platform-wide settings


def _get_settings_doc():
    doc = platform_settings_collection.find_one({"_id": _SETTINGS_DOC_ID})
    if not doc:
        doc = {"_id": _SETTINGS_DOC_ID, **DEFAULT_PLATFORM_SETTINGS, "maintenanceMode": False, "maintenanceMessage": ""}
        platform_settings_collection.insert_one(doc)
    return doc


def is_maintenance_mode_active():
    """Used by app.py's before_request hook."""
    doc = platform_settings_collection.find_one({"_id": _SETTINGS_DOC_ID})
    return bool(doc and doc.get("maintenanceMode"))


# ── Platform settings ───────────────────────────────────────────────────────
@admin_settings_bp.route("/platform", methods=["GET"])
def get_platform_settings():
    doc = _get_settings_doc()
    doc.pop("_id", None)
    return jsonify(doc), 200


@admin_settings_bp.route("/platform", methods=["PUT"])
def update_platform_settings():
    data = request.get_json(silent=True) or {}
    updates = {k: data[k] for k in DEFAULT_PLATFORM_SETTINGS if k in data}
    if not updates:
        return jsonify({"error": "No valid fields provided"}), 400

    platform_settings_collection.update_one(
        {"_id": _SETTINGS_DOC_ID}, {"$set": updates}, upsert=True
    )
    return jsonify({"message": "Platform settings updated"}), 200


# ── Maintenance mode ─────────────────────────────────────────────────────────
@admin_settings_bp.route("/maintenance", methods=["GET"])
def get_maintenance_mode():
    doc = _get_settings_doc()
    return jsonify({
        "maintenanceMode": doc.get("maintenanceMode", False),
        "maintenanceMessage": doc.get("maintenanceMessage", ""),
    }), 200


@admin_settings_bp.route("/maintenance", methods=["PUT"])
def update_maintenance_mode():
    data = request.get_json(silent=True) or {}
    if "maintenanceMode" not in data:
        return jsonify({"error": "maintenanceMode is required"}), 400

    platform_settings_collection.update_one(
        {"_id": _SETTINGS_DOC_ID},
        {"$set": {
            "maintenanceMode": bool(data["maintenanceMode"]),
            "maintenanceMessage": data.get("maintenanceMessage", ""),
        }},
        upsert=True,
    )
    return jsonify({"message": "Maintenance mode updated"}), 200


# ── Error logs ────────────────────────────────────────────────────────────
def log_error(*, method, path, error_message, status_code=500):
    """Called from app.py's global error handler. Never allowed to raise —
    a broken logger must not turn a handled error into a crash."""
    try:
        error_logs_collection.insert_one({
            "method": method,
            "path": path,
            "error_message": str(error_message)[:2000],
            "status_code": status_code,
            "created_at": datetime.utcnow(),
        })
    except Exception:
        pass


@admin_settings_bp.route("/error-logs", methods=["GET"])
def get_error_logs():
    limit = min(int(request.args.get("limit", 100)), 500)
    docs = list(error_logs_collection.find().sort("created_at", -1).limit(limit))
    for d in docs:
        d["_id"] = str(d["_id"])
        d["created_at"] = d["created_at"].isoformat() if d.get("created_at") else None
    return jsonify({"logs": docs, "count": error_logs_collection.count_documents({})}), 200


@admin_settings_bp.route("/error-logs", methods=["DELETE"])
def clear_error_logs():
    result = error_logs_collection.delete_many({})
    return jsonify({"message": "Error logs cleared", "deleted": result.deleted_count}), 200


# ── Contact support tickets ─────────────────────────────────────────────────
@admin_settings_bp.route("/contact-messages", methods=["GET"])
def get_contact_messages():
    status_filter = request.args.get("status")
    query = {"status": status_filter} if status_filter else {}
    docs = list(contact_messages_collection.find(query).sort("created_at", -1))
    for d in docs:
        d["_id"] = str(d["_id"])
        d["created_at"] = d["created_at"].isoformat() if d.get("created_at") else None
        d.setdefault("status", "open")
    return jsonify({"messages": docs}), 200


@admin_settings_bp.route("/contact-messages/<message_id>", methods=["PUT"])
def update_contact_message(message_id):
    data = request.get_json(silent=True) or {}
    status = data.get("status")
    if status not in ("open", "in_progress", "resolved"):
        return jsonify({"error": "status must be one of open, in_progress, resolved"}), 400

    result = contact_messages_collection.update_one(
        {"_id": ObjectId(message_id)}, {"$set": {"status": status}}
    )
    if result.matched_count == 0:
        return jsonify({"error": "Message not found"}), 404
    return jsonify({"message": "Ticket status updated"}), 200


# ── Admin accounts (Security tab) ───────────────────────────────────────────
@admin_settings_bp.route("/admin-accounts", methods=["GET"])
def get_admin_accounts():
    admins = list(users_collection.find({"role": "admin"}, {"password": 0}))
    for a in admins:
        a["_id"] = str(a["_id"])
        if a.get("last_login"):
            a["last_login"] = a["last_login"].isoformat()
    return jsonify({"admins": admins}), 200
