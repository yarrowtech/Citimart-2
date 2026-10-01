# routes/campaign_routes.py
# Customer CRM — promotional email campaigns + rule-based follow-up
# surfacing. Core logic is plain functions reused by both the admin routes
# here and the subuser proxy routes in subuser_content_routes.py.
#
# Campaigns send real email via the existing SMTP utility, synchronously,
# capped at MAX_RECIPIENTS per send — fine at this app's current scale;
# a background job would be the next step if that ever stops being true.
#
# Follow-ups are deliberately NOT automatic (no scheduler exists in this
# app). list_followups() surfaces who's due; nothing is emailed until a
# human clicks send.
from datetime import datetime, timedelta

from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, request, jsonify

from database import users_collection, orders_collection, db
from utils.auth_utils import admin_token_required
from utils.email_utils import send_email

campaign_bp = Blueprint("campaign_bp", __name__)

campaigns_collection = db["campaigns"]

MAX_RECIPIENTS = 500
POST_PURCHASE_MIN_DAYS = 3
POST_PURCHASE_MAX_DAYS = 14
WIN_BACK_MIN_DAYS = 60


def _safe_oid(value):
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        return None


def _resolve_audience(audience):
    """audience: {"type": "all"|"segment"|"custom", "segment": str, "emails": [str]}"""
    audience = audience or {}
    atype = audience.get("type", "all")

    if atype == "custom":
        emails = audience.get("emails") or []
        return [{"email": e, "name": ""} for e in emails if e][:MAX_RECIPIENTS]

    query = {"role": "customer"}
    if atype == "segment":
        segment = audience.get("segment")
        if not segment:
            return []
        query["segment"] = segment

    docs = list(users_collection.find(query, {"email": 1, "name": 1}).limit(MAX_RECIPIENTS))
    return [{"email": d.get("email"), "name": d.get("name")} for d in docs if d.get("email")]


def send_campaign(subject, body, audience, sender_id, sender_role):
    recipients = _resolve_audience(audience)
    sent_count = 0
    for r in recipients:
        personalized_body = body.replace("{{name}}", r.get("name") or "there")
        if send_email(r["email"], subject, personalized_body, html=True):
            sent_count += 1

    campaigns_collection.insert_one({
        "subject": subject, "body": body, "audience": audience,
        "recipient_count": len(recipients), "sent_count": sent_count,
        "sentBy": sender_id, "sentByRole": sender_role, "sentAt": datetime.utcnow(),
    })
    return {"recipient_count": len(recipients), "sent_count": sent_count}


def list_campaigns():
    docs = list(campaigns_collection.find({}).sort("sentAt", -1).limit(100))
    for d in docs:
        d["_id"] = str(d["_id"])
        d["sentAt"] = d["sentAt"].isoformat() if d.get("sentAt") else None
    return docs


def list_followups():
    now = datetime.utcnow()
    results = []

    # Post-purchase: delivered recently, no follow-up sent yet
    cutoff_recent = now - timedelta(days=POST_PURCHASE_MIN_DAYS)
    cutoff_old = now - timedelta(days=POST_PURCHASE_MAX_DAYS)
    delivered_orders = orders_collection.find({
        "status": {"$regex": "^delivered$", "$options": "i"},
        "created_at": {"$gte": cutoff_old, "$lte": cutoff_recent},
        "followUpSent": {"$ne": True},
    })
    for o in delivered_orders:
        customer = users_collection.find_one({"_id": _safe_oid(o.get("customer_id"))})
        if not customer or not customer.get("email"):
            continue
        results.append({
            "customer_id": str(customer["_id"]), "name": customer.get("name"),
            "email": customer.get("email"), "reason": "post_purchase",
            "detail": f"Order delivered on {o['created_at'].strftime('%Y-%m-%d')}, no follow-up sent yet.",
            "order_id": str(o["_id"]),
        })

    # Win-back: ordered before, but not in a long time
    win_back_cutoff = now - timedelta(days=WIN_BACK_MIN_DAYS)
    for cid in orders_collection.distinct("customer_id"):
        last_order = orders_collection.find_one({"customer_id": cid}, sort=[("created_at", -1)])
        if not last_order or not last_order.get("created_at"):
            continue
        if last_order["created_at"] < win_back_cutoff:
            customer = users_collection.find_one({"_id": _safe_oid(cid)})
            if not customer or not customer.get("email"):
                continue
            days_ago = (now - last_order["created_at"]).days
            results.append({
                "customer_id": str(customer["_id"]), "name": customer.get("name"),
                "email": customer.get("email"), "reason": "win_back",
                "detail": f"Last ordered {days_ago} days ago ({last_order['created_at'].strftime('%Y-%m-%d')}).",
                "order_id": None,
            })

    return results


def send_followup(customer_id, reason, subject, body, order_id=None):
    if not subject or not body:
        return {"error": "subject and body are required"}, 400
    customer = users_collection.find_one({"_id": _safe_oid(customer_id)})
    if not customer or not customer.get("email"):
        return {"error": "Customer not found or has no email"}, 404

    ok = send_email(customer["email"], subject, body, html=True)
    if order_id and reason == "post_purchase":
        orders_collection.update_one({"_id": _safe_oid(order_id)}, {"$set": {"followUpSent": True}})
    return {"message": "Follow-up sent" if ok else "Email failed to send"}, 200


# ── Admin routes ─────────────────────────────────────────────────────────
@campaign_bp.route("/admin/campaigns", methods=["POST"])
@admin_token_required
def admin_send_campaign(current_admin):
    data = request.get_json(silent=True) or {}
    subject = (data.get("subject") or "").strip()
    body = (data.get("body") or "").strip()
    if not subject or not body:
        return jsonify({"error": "subject and body are required"}), 400
    result = send_campaign(subject, body, data.get("audience"), current_admin["_id"], "admin")
    return jsonify(result), 201


@campaign_bp.route("/admin/campaigns", methods=["GET"])
@admin_token_required
def admin_list_campaigns(current_admin):
    return jsonify({"campaigns": list_campaigns()}), 200


@campaign_bp.route("/admin/crm/followups", methods=["GET"])
@admin_token_required
def admin_list_followups(current_admin):
    return jsonify({"followups": list_followups()}), 200


@campaign_bp.route("/admin/crm/followups/send", methods=["POST"])
@admin_token_required
def admin_send_followup(current_admin):
    data = request.get_json(silent=True) or {}
    body, status_code = send_followup(
        data.get("customer_id"), data.get("reason"),
        data.get("subject"), data.get("body"), data.get("order_id"),
    )
    return jsonify(body), status_code
