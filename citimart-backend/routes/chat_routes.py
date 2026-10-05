# routes/chat_routes.py
# Shared conversation backend for customer support, vendor threads, and
# internal staff chat. One set of endpoints; access is decided per
# conversation from the caller's identity and role (see _can_view/_can_post).
import re
from datetime import datetime

from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, jsonify, request

from database import (
    chat_conversations_collection, chat_messages_collection,
    users_collection, vendors_collection, subusers_collection, faqs_collection,
)
from utils.auth_utils import verify_token

chat_bp = Blueprint("chat_bp", __name__, url_prefix="/chat")

CHANNELS = {"support", "vendor", "internal"}
STATUSES = {"bot", "waiting", "open", "resolved"}
STAFF_SETTABLE_STATUSES = {"waiting", "open", "resolved"}
LINK_TYPES = {"vendor_application", "product", "payout", "order", "complaint"}
MAX_BODY = 2000
MAX_SUBJECT = 120
HISTORY_LIMIT = 200
AUDIT_LIMIT = 50
BOT = {"id": "bot", "kind": "bot", "name": "CitiMart Assistant"}
BOT_STOPWORDS = {
    "the", "and", "for", "are", "you", "your", "can", "how", "what", "when", "where",
    "why", "does", "with", "this", "that", "have", "from", "there", "about", "would",
    "could", "should", "will", "please", "want", "need", "get", "its", "not", "use",
}
BOT_FALLBACK = (
    "I couldn't find an answer to that yet. Try rephrasing, or tap \"Talk to a person\" "
    "and a support agent will reply here."
)
BOT_HANDOFF = "Connecting you to a support agent. A team member will reply in this chat."


def _find_by_id(collection, raw_id):
    try:
        return collection.find_one({"_id": ObjectId(raw_id)})
    except (InvalidId, TypeError):
        return None


def _actor():
    """Resolves the caller from their Bearer token into a small identity dict,
    or None if the token is missing, invalid, or belongs to an inactive account."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    data = verify_token(auth.split(" ", 1)[1])
    if not data:
        return None

    if data.get("sub"):
        sub = _find_by_id(subusers_collection, data["sub"])
        if not sub or sub.get("status") != "active":
            return None
        return {
            "id": str(sub["_id"]), "kind": "subuser",
            "name": sub.get("name") or sub.get("email", "Subuser"),
            "perms": sub.get("permissions", {}),
        }

    role, uid = data.get("role"), data.get("user_id")
    if role == "vendor":
        doc = _find_by_id(vendors_collection, uid)
        if not doc:
            return None
        return {"id": str(doc["_id"]), "kind": "vendor",
                "name": doc.get("businessName") or doc.get("fullName", "Vendor")}
    if role in ("admin", "customer"):
        doc = _find_by_id(users_collection, uid)
        if not doc:
            return None
        return {"id": str(doc["_id"]), "kind": role, "name": doc.get("name", role.title())}
    return None


def _is_staff(actor):
    return actor["kind"] == "admin" or (actor["kind"] == "subuser" and actor["perms"].get("chat"))


def _is_participant(conv, actor):
    return any(p["id"] == actor["id"] and p["kind"] == actor["kind"] for p in conv["participants"])


def _can_view(conv, actor):
    if _is_participant(conv, actor):
        return True
    if actor["kind"] == "admin":
        return True
    if _is_staff(actor):
        return conv["channel"] in ("support", "vendor")
    return False


def _can_post(conv, actor):
    if _is_participant(conv, actor):
        return True
    return _is_staff(actor) and conv["channel"] in ("support", "vendor")


def _visibility_query(actor):
    if actor["kind"] == "admin":
        return {}
    mine = {"participants": {"$elemMatch": {"id": actor["id"], "kind": actor["kind"]}}}
    if _is_staff(actor):
        return {"$or": [{"channel": {"$in": ["support", "vendor"]}}, mine]}
    return mine


def _require_actor():
    actor = _actor()
    if not actor:
        return None, (jsonify({"error": "Authentication required"}), 401)
    if actor["kind"] == "subuser" and not actor["perms"].get("chat"):
        return None, (jsonify({"error": "Missing required permission: chat"}), 403)
    return actor, None


def _iso(value):
    return value.isoformat() + "Z" if value else None


def _participant_view(p):
    return {"id": p["id"], "kind": p["kind"], "name": p["name"]}


def _unread_count(conv, actor):
    since = (conv.get("read_at") or {}).get(actor["id"])
    query = {"conversation_id": str(conv["_id"]), "sender.id": {"$ne": actor["id"]}}
    if since:
        query["created_at"] = {"$gt": since}
    return chat_messages_collection.count_documents(query)


def _serialize_conversation(conv, actor=None):
    data = {
        "id": str(conv["_id"]),
        "channel": conv["channel"],
        "subject": conv.get("subject", ""),
        "status": conv["status"],
        "link": conv.get("link"),
        "participants": [_participant_view(p) for p in conv["participants"]],
        "last_message_at": _iso(conv.get("last_message_at")),
        "last_message_preview": conv.get("last_message_preview", ""),
        "created_at": _iso(conv.get("created_at")),
    }
    if actor:
        data["unread"] = _unread_count(conv, actor)
    return data


def _serialize_message(msg):
    return {
        "id": str(msg["_id"]),
        "sender": msg["sender"],
        "body": msg["body"],
        "created_at": _iso(msg["created_at"]),
    }


def _clean_body(raw):
    body = (raw or "").strip()
    if not body:
        return None, "Message cannot be empty"
    if len(body) > MAX_BODY:
        return None, f"Message is longer than {MAX_BODY} characters"
    return body, None


def _tokens(text):
    return {w for w in re.findall(r"[a-z0-9]+", (text or "").lower()) if len(w) > 2 and w not in BOT_STOPWORDS}


def _find_faq_answer(question):
    query = _tokens(question)
    if not query:
        return None
    best, best_score = None, 0
    for faq in faqs_collection.find({"status": "published"}):
        score = len(query & _tokens(faq.get("question"))) + 0.5 * len(query & _tokens(faq.get("answer")))
        if score > best_score:
            best, best_score = faq, score
    threshold = 1 if len(query) <= 3 else 2
    return best if best and best_score >= threshold else None


def _bot_say(conv, text, now):
    chat_messages_collection.insert_one({
        "conversation_id": str(conv["_id"]),
        "sender": {"id": BOT["id"], "kind": BOT["kind"], "name": BOT["name"]},
        "body": text,
        "created_at": now,
    })
    chat_conversations_collection.update_one({"_id": conv["_id"]}, {"$set": {
        "last_message_at": now, "last_message_preview": text[:120], "updated_at": now,
    }})


def _bot_respond(conv, customer_text, now):
    faq = _find_faq_answer(customer_text)
    if faq:
        answer = faq.get('answer', '').strip()
        text = answer + "\n\nDid that answer your question? If not, tap \"Talk to a person\"."
    else:
        text = BOT_FALLBACK
    _bot_say(conv, text, now)


def _append_message(conv, actor, body, now):
    chat_messages_collection.insert_one({
        "conversation_id": str(conv["_id"]),
        "sender": {"id": actor["id"], "kind": actor["kind"], "name": actor["name"]},
        "body": body,
        "created_at": now,
    })
    updates = {
        "last_message_at": now,
        "last_message_preview": body[:120],
        "updated_at": now,
        f"read_at.{actor['id']}": now,
    }
    if not _is_participant(conv, actor):
        updates_participants = conv["participants"] + [
            {"id": actor["id"], "kind": actor["kind"], "name": actor["name"]}
        ]
        updates["participants"] = updates_participants

    if _is_staff(actor) and conv["status"] in ("waiting", "bot"):
        updates["status"] = "open"
    elif not _is_staff(actor) and conv["status"] == "resolved":
        updates["status"] = "waiting" if conv["channel"] == "support" else "open"

    chat_conversations_collection.update_one({"_id": conv["_id"]}, {"$set": updates})


@chat_bp.route("/conversations", methods=["POST"])
def create_conversation():
    actor, error = _require_actor()
    if error:
        return error

    data = request.get_json(silent=True) or {}
    channel = data.get("channel")
    if channel not in CHANNELS:
        return jsonify({"error": "Unknown channel"}), 400
    body, err = _clean_body(data.get("body"))
    if err:
        return jsonify({"error": err}), 400
    subject = (data.get("subject") or "").strip()[:MAX_SUBJECT]

    link = None
    if data.get("link"):
        link_type = data["link"].get("type")
        link_id = str(data["link"].get("id", "")).strip()
        if link_type not in LINK_TYPES or not link_id:
            return jsonify({"error": "Invalid link"}), 400
        link = {"type": link_type, "id": link_id}

    me = {"id": actor["id"], "kind": actor["kind"], "name": actor["name"]}
    participants = [me]
    status = "open"

    if channel == "support":
        if actor["kind"] != "customer":
            return jsonify({"error": "Only customers start support chats"}), 403
        status = "waiting"

    vendor_dedupe_id = None
    if channel == "vendor":
        if actor["kind"] == "vendor":
            status = "waiting"
            vendor_dedupe_id = actor["id"]
        elif _is_staff(actor):
            vendor_id = data.get("vendorId")
            vendor = _find_by_id(vendors_collection, vendor_id) if vendor_id else None
            if not vendor:
                return jsonify({"error": "vendorId is required and must exist"}), 400
            participants.insert(0, {"id": str(vendor["_id"]), "kind": "vendor",
                                    "name": vendor.get("businessName") or vendor.get("fullName", "Vendor")})
            vendor_dedupe_id = str(vendor["_id"])
        else:
            return jsonify({"error": "Only vendors and staff start vendor chats"}), 403

    if channel == "vendor" and link:
        existing = chat_conversations_collection.find_one({
            "channel": "vendor", "link": link, "status": {"$ne": "resolved"},
            "participants": {"$elemMatch": {"id": vendor_dedupe_id, "kind": "vendor"}},
        })
        if existing:
            now = datetime.utcnow()
            _append_message(existing, actor, body, now)
            existing = chat_conversations_collection.find_one({"_id": existing["_id"]})
            return jsonify(_serialize_conversation(existing, actor)), 200

    elif channel == "internal":
        if not _is_staff(actor):
            return jsonify({"error": "Only staff start internal chats"}), 403
        for invitee in data.get("participantIds") or []:
            kind = invitee.get("kind")
            if kind not in ("admin", "subuser"):
                return jsonify({"error": "Internal chats include staff only"}), 400
            doc = _find_by_id(subusers_collection if kind == "subuser" else users_collection, invitee.get("id"))
            if not doc:
                return jsonify({"error": "Unknown participant"}), 400
            if not any(p["id"] == str(doc["_id"]) and p["kind"] == kind for p in participants):
                participants.append({"id": str(doc["_id"]), "kind": kind,
                                     "name": doc.get("name") or doc.get("email", kind.title())})

    now = datetime.utcnow()
    if channel == "support":
        status = "bot"
    result = chat_conversations_collection.insert_one({
        "channel": channel,
        "subject": subject,
        "status": status,
        "link": link,
        "participants": participants,
        "created_at": now,
        "updated_at": now,
        "read_at": {},
    })
    conv = chat_conversations_collection.find_one({"_id": result.inserted_id})
    _append_message(conv, actor, body, now)
    if channel == "support":
        _bot_respond(conv, body, now)
    conv = chat_conversations_collection.find_one({"_id": result.inserted_id})
    return jsonify(_serialize_conversation(conv, actor)), 201


@chat_bp.route("/conversations", methods=["GET"])
def list_conversations():
    actor, error = _require_actor()
    if error:
        return error

    query = _visibility_query(actor)
    channel = request.args.get("channel")
    status = request.args.get("status")
    if channel in CHANNELS:
        query = {"$and": [query, {"channel": channel}]}
    if status in STATUSES:
        query = {"$and": [query, {"status": status}]}

    convs = chat_conversations_collection.find(query).sort("last_message_at", -1).limit(200)

    counts = {s: 0 for s in STATUSES}
    base = _visibility_query(actor)
    for row in chat_conversations_collection.aggregate([
        {"$match": base}, {"$group": {"_id": "$status", "n": {"$sum": 1}}},
    ]):
        counts[row["_id"]] = row["n"]

    return jsonify({
        "conversations": [_serialize_conversation(c, actor) for c in convs],
        "counts": counts,
    }), 200


@chat_bp.route("/conversations/<conversation_id>", methods=["GET"])
def get_conversation(conversation_id):
    actor, error = _require_actor()
    if error:
        return error

    conv = _find_by_id(chat_conversations_collection, conversation_id)
    if not conv or not _can_view(conv, actor):
        return jsonify({"error": "Conversation not found"}), 404

    messages = list(
        chat_messages_collection.find({"conversation_id": conversation_id})
        .sort("created_at", -1).limit(HISTORY_LIMIT)
    )
    messages.reverse()

    now = datetime.utcnow()
    updates = {f"read_at.{actor['id']}": now}
    if not _is_participant(conv, actor):
        chat_conversations_collection.update_one({"_id": conv["_id"]}, {"$push": {"audit": {
            "$each": [{"viewer": {"id": actor["id"], "kind": actor["kind"], "name": actor["name"]}, "at": now}],
            "$slice": -AUDIT_LIMIT,
        }}})
    chat_conversations_collection.update_one({"_id": conv["_id"]}, {"$set": updates})
    conv = chat_conversations_collection.find_one({"_id": conv["_id"]})
    payload = _serialize_conversation(conv, actor)
    payload["unread"] = 0
    payload["messages"] = [_serialize_message(m) for m in messages]
    payload["audit"] = [
        {"viewer": e["viewer"], "at": _iso(e["at"])} for e in (conv.get("audit") or [])[-AUDIT_LIMIT:]
    ]
    return jsonify(payload), 200


@chat_bp.route("/conversations/<conversation_id>/messages", methods=["POST"])
def post_message(conversation_id):
    actor, error = _require_actor()
    if error:
        return error

    conv = _find_by_id(chat_conversations_collection, conversation_id)
    if not conv or not _can_view(conv, actor):
        return jsonify({"error": "Conversation not found"}), 404
    if not _can_post(conv, actor):
        return jsonify({"error": "You cannot post in this conversation"}), 403

    body, err = _clean_body((request.get_json(silent=True) or {}).get("body"))
    if err:
        return jsonify({"error": err}), 400

    now = datetime.utcnow()
    bot_handles = conv["status"] == "bot" and actor["kind"] == "customer"
    _append_message(conv, actor, body, now)
    if bot_handles:
        _bot_respond(conv, body, now)
    conv = chat_conversations_collection.find_one({"_id": conv["_id"]})
    return jsonify(_serialize_conversation(conv, actor)), 201


@chat_bp.route("/conversations/<conversation_id>/handoff", methods=["POST"])
def request_handoff(conversation_id):
    actor, error = _require_actor()
    if error:
        return error

    conv = _find_by_id(chat_conversations_collection, conversation_id)
    if not conv or not _is_participant(conv, actor):
        return jsonify({"error": "Conversation not found"}), 404
    if actor["kind"] != "customer" or conv["channel"] != "support":
        return jsonify({"error": "Only customers can request a person in a support chat"}), 403
    if conv["status"] != "bot":
        return jsonify({"error": "This chat is already with a support agent"}), 400

    now = datetime.utcnow()
    chat_conversations_collection.update_one({"_id": conv["_id"]}, {"$set": {"status": "waiting", "updated_at": now}})
    conv = chat_conversations_collection.find_one({"_id": conv["_id"]})
    _bot_say(conv, BOT_HANDOFF, now)
    conv = chat_conversations_collection.find_one({"_id": conv["_id"]})
    return jsonify(_serialize_conversation(conv, actor)), 200


@chat_bp.route("/conversations/<conversation_id>/status", methods=["POST"])
def set_status(conversation_id):
    actor, error = _require_actor()
    if error:
        return error
    if not _is_staff(actor):
        return jsonify({"error": "Only staff can change conversation status"}), 403

    conv = _find_by_id(chat_conversations_collection, conversation_id)
    if not conv or not _can_view(conv, actor):
        return jsonify({"error": "Conversation not found"}), 404

    status = (request.get_json(silent=True) or {}).get("status")
    if status not in STAFF_SETTABLE_STATUSES:
        return jsonify({"error": "Invalid status"}), 400

    chat_conversations_collection.update_one(
        {"_id": conv["_id"]}, {"$set": {"status": status, "updated_at": datetime.utcnow()}}
    )
    conv = chat_conversations_collection.find_one({"_id": conv["_id"]})
    return jsonify(_serialize_conversation(conv, actor)), 200


@chat_bp.route("/staff-directory", methods=["GET"])
def staff_directory():
    """Lists admins and chat-permitted subusers, for picking who to start an
    internal chat with. Only staff can see this list — not customers or vendors."""
    actor, error = _require_actor()
    if error:
        return error
    if not _is_staff(actor):
        return jsonify({"error": "Staff only"}), 403

    people = []
    for doc in users_collection.find({"role": "admin"}, {"name": 1, "email": 1}):
        pid = str(doc["_id"])
        if pid == actor["id"] and actor["kind"] == "admin":
            continue
        people.append({"id": pid, "kind": "admin", "name": doc.get("name") or doc.get("email", "Admin")})

    for doc in subusers_collection.find(
        {"status": "active", "permissions.chat": True}, {"name": 1, "email": 1, "role": 1}
    ):
        pid = str(doc["_id"])
        if pid == actor["id"] and actor["kind"] == "subuser":
            continue
        label = doc.get("name") or doc.get("email", "Staff")
        people.append({"id": pid, "kind": "subuser", "name": f"{label} ({doc.get('role', 'Subuser')})"})

    return jsonify({"people": people}), 200


@chat_bp.route("/unread-summary", methods=["GET"])
def unread_summary():
    """Lightweight counts for nav badges: support/vendor chats waiting on
    staff, plus this staff member's own unread internal messages."""
    actor, error = _require_actor()
    if error:
        return error
    if not _is_staff(actor):
        return jsonify({"error": "Staff only"}), 403

    waiting_support = chat_conversations_collection.count_documents({"channel": "support", "status": "waiting"})
    waiting_vendor = chat_conversations_collection.count_documents({"channel": "vendor", "status": "waiting"})

    unread_internal = 0
    mine = {"channel": "internal", "participants": {"$elemMatch": {"id": actor["id"], "kind": actor["kind"]}}}
    for conv in chat_conversations_collection.find(mine):
        if _unread_count(conv, actor) > 0:
            unread_internal += 1

    total = waiting_support + waiting_vendor + unread_internal
    return jsonify({
        "waiting_support": waiting_support,
        "waiting_vendor": waiting_vendor,
        "unread_internal": unread_internal,
        "total": total,
    }), 200
