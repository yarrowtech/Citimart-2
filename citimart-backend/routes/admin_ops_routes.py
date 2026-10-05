# routes/admin_ops_routes.py
# Admin operations center: a live notification feed (new orders, status
# changes, new errors, pending vendor approvals) and the Error Center, where
# logged server errors are listed, explained in plain language, and resolved.
from datetime import datetime, timedelta

from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, jsonify, request

from database import error_logs_collection, orders_collection, vendors_collection, chat_conversations_collection
from utils.auth_utils import admin_token_required
from routes.chat_routes import _unread_count

admin_ops_bp = Blueprint("admin_ops_bp", __name__, url_prefix="/admin")

FEED_ERROR_WINDOW_HOURS = 48
FEED_ORDER_WINDOW_HOURS = 24
FEED_MAX_PER_KIND = 8


def explain_error(status_code, message):
    text = (message or "").lower()
    if "serverselection" in text or "connection refused" in text or "timed out" in text:
        return {
            "title": "Database unreachable",
            "explanation": "The server could not reach MongoDB, so the request could not finish.",
            "fix": "Check that MongoDB is running and that MONGO_URI in the backend .env is correct.",
        }
    if "invalid objectid" in text or "invalidid" in text or "bson" in text:
        return {
            "title": "Invalid record ID",
            "explanation": "A request used an ID that does not match a real record.",
            "fix": "Check the page that sent the ID; it may be using a stale or hand-typed value.",
        }
    if "keyerror" in text:
        return {
            "title": "Missing data field",
            "explanation": "The code expected a field that a record does not have.",
            "fix": "Look at the record in the database; older documents may predate the field.",
        }
    if "nonetype" in text or "attributeerror" in text or "typeerror" in text:
        return {
            "title": "Empty or wrong-type value",
            "explanation": "The code received a value that was empty or of an unexpected type.",
            "fix": "Check what the calling page sends; a field may be missing or null.",
        }
    if status_code == 404:
        return {
            "title": "Page or API route not found",
            "explanation": "A request went to a URL that the backend does not serve.",
            "fix": "Check for a typo in the frontend API path or a missing backend route.",
        }
    if status_code in (401, 403):
        return {
            "title": "Access denied",
            "explanation": "The request was not authenticated or lacked permission.",
            "fix": "Check the login token and the user's role or subuser permissions.",
        }
    if status_code in (400, 422):
        return {
            "title": "Invalid request",
            "explanation": "The request data was rejected as malformed or incomplete.",
            "fix": "Check the form or payload that the page submitted.",
        }
    return {
        "title": "Unexpected server error",
        "explanation": "The server hit an exception it did not expect.",
        "fix": "Open the full error message below and check the code path named in it.",
    }


def _iso(value):
    return value.isoformat() + "Z" if value else None


def _serialize_error(doc):
    info = explain_error(doc.get("status_code"), doc.get("error_message"))
    return {
        "id": str(doc["_id"]),
        "method": doc.get("method"),
        "path": doc.get("path"),
        "status_code": doc.get("status_code"),
        "error_message": doc.get("error_message"),
        "created_at": _iso(doc.get("created_at")),
        "resolved": bool(doc.get("resolved")),
        "resolved_at": _iso(doc.get("resolved_at")),
        "note": doc.get("note", ""),
        **info,
    }


def _order_label(order):
    return f"#{str(order['_id'])[-6:].upper()}"


@admin_ops_bp.route("/notifications", methods=["GET"])
@admin_token_required
def get_notifications(current_admin):
    now = datetime.utcnow()
    items = []

    error_cutoff = now - timedelta(hours=FEED_ERROR_WINDOW_HOURS)
    open_errors = error_logs_collection.find(
        {"created_at": {"$gte": error_cutoff}, "resolved": {"$ne": True}}
    ).sort("created_at", -1).limit(FEED_MAX_PER_KIND)
    for doc in open_errors:
        info = explain_error(doc.get("status_code"), doc.get("error_message"))
        items.append({
            "id": f"error-{doc['_id']}", "kind": "error", "severity": "danger",
            "title": f"{info['title']} on {doc.get('path', '')}",
            "detail": info["explanation"],
            "path": "/admin/errors", "created_at": _iso(doc.get("created_at")),
        })

    order_cutoff = now - timedelta(hours=FEED_ORDER_WINDOW_HOURS)
    new_orders = orders_collection.find({"created_at": {"$gte": order_cutoff}}).sort("created_at", -1).limit(FEED_MAX_PER_KIND)
    for order in new_orders:
        amount = order.get("final_amount") or order.get("total_amount") or 0
        items.append({
            "id": f"order-{order['_id']}", "kind": "order", "severity": "info",
            "title": f"New order {_order_label(order)}",
            "detail": f"₹{float(amount):,.2f} · status {order.get('status', 'placed')}",
            "path": "/admin/orders", "created_at": _iso(order.get("created_at")),
        })

    status_changes = orders_collection.find(
        {"status_updated_at": {"$gte": order_cutoff}}
    ).sort("status_updated_at", -1).limit(FEED_MAX_PER_KIND)
    for order in status_changes:
        items.append({
            "id": f"status-{order['_id']}-{_iso(order.get('status_updated_at'))}", "kind": "order_status",
            "severity": "info",
            "title": f"Order {_order_label(order)} is now {order.get('status', '')}",
            "detail": "Status updated by admin or vendor",
            "path": "/admin/orders", "created_at": _iso(order.get("status_updated_at")),
        })

    pending_vendors = vendors_collection.count_documents({"status": {"$regex": "^pending$", "$options": "i"}})
    if pending_vendors:
        items.append({
            "id": "vendors-pending", "kind": "vendor", "severity": "warning",
            "title": f"{pending_vendors} vendor application{'s' if pending_vendors != 1 else ''} awaiting approval",
            "detail": "Review new vendor registrations",
            "path": "/admin/vendors", "created_at": _iso(now),
        })

    waiting_support = chat_conversations_collection.count_documents({"channel": "support", "status": "waiting"})
    if waiting_support:
        items.append({
            "id": "chat-waiting-support", "kind": "chat", "severity": "warning",
            "title": f"{waiting_support} customer{'s' if waiting_support != 1 else ''} waiting for support",
            "detail": "Open the Support Center to reply",
            "path": "/admin/support", "created_at": _iso(now),
        })

    waiting_vendor = chat_conversations_collection.count_documents({"channel": "vendor", "status": "waiting"})
    if waiting_vendor:
        items.append({
            "id": "chat-waiting-vendor", "kind": "chat", "severity": "warning",
            "title": f"{waiting_vendor} vendor message{'s' if waiting_vendor != 1 else ''} need a reply",
            "detail": "Open the Support Center to reply",
            "path": "/admin/support", "created_at": _iso(now),
        })

    actor = {"id": current_admin["_id"], "kind": "admin"}
    unread_internal = sum(
        1 for conv in chat_conversations_collection.find(
            {"channel": "internal", "participants": {"$elemMatch": {"id": actor["id"], "kind": "admin"}}}
        ) if _unread_count(conv, actor) > 0
    )
    if unread_internal:
        items.append({
            "id": "chat-unread-internal", "kind": "chat", "severity": "info",
            "title": f"{unread_internal} unread internal message{'s' if unread_internal != 1 else ''}",
            "detail": "From other staff",
            "path": "/admin/support", "created_at": _iso(now),
        })

    items.sort(key=lambda item: item["created_at"] or "", reverse=True)
    unresolved_errors = error_logs_collection.count_documents({"resolved": {"$ne": True}})
    return jsonify({"items": items, "unresolved_errors": unresolved_errors}), 200


@admin_ops_bp.route("/error-center", methods=["GET"])
@admin_token_required
def list_error_center(current_admin):
    status = request.args.get("status", "open")
    limit = min(int(request.args.get("limit", 100)), 500)
    query = {}
    if status == "open":
        query = {"resolved": {"$ne": True}}
    elif status == "resolved":
        query = {"resolved": True}

    docs = list(error_logs_collection.find(query).sort("created_at", -1).limit(limit))
    return jsonify({
        "logs": [_serialize_error(d) for d in docs],
        "counts": {
            "open": error_logs_collection.count_documents({"resolved": {"$ne": True}}),
            "resolved": error_logs_collection.count_documents({"resolved": True}),
        },
    }), 200


@admin_ops_bp.route("/error-center/<error_id>", methods=["PATCH"])
@admin_token_required
def update_error_center(current_admin, error_id):
    try:
        oid = ObjectId(error_id)
    except InvalidId:
        return jsonify({"error": "Invalid error ID"}), 400

    data = request.get_json(silent=True) or {}
    update = {}
    if "resolved" in data:
        update["resolved"] = bool(data["resolved"])
        update["resolved_at"] = datetime.utcnow() if data["resolved"] else None
    if "note" in data:
        update["note"] = str(data["note"])[:1000]
    if not update:
        return jsonify({"error": "Nothing to update"}), 400

    result = error_logs_collection.update_one({"_id": oid}, {"$set": update})
    if result.matched_count == 0:
        return jsonify({"error": "Error log not found"}), 404
    return jsonify({"message": "Error log updated"}), 200
