# tests/test_chat.py
from datetime import datetime, timedelta

import jwt
from werkzeug.security import generate_password_hash

from config import JWT_SECRET_KEY
from database import users_collection, vendors_collection, subusers_collection
from utils.auth_utils import generate_token

_counter = {"n": 0}


def _unique_email(prefix):
    _counter["n"] += 1
    return f"{prefix}{_counter['n']}@test.com"


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def _customer():
    uid = str(users_collection.insert_one({"name": "Customer", "email": _unique_email("c"), "role": "customer"}).inserted_id)
    return {"id": uid, "headers": _auth(generate_token(uid, "customer"))}


def _admin():
    uid = str(users_collection.insert_one({"name": "Admin", "email": _unique_email("a"), "role": "admin"}).inserted_id)
    return {"id": uid, "headers": _auth(generate_token(uid, "admin"))}


def _vendor(name="Shop"):
    uid = str(vendors_collection.insert_one({"businessName": name, "fullName": "Owner", "status": "approved"}).inserted_id)
    return {"id": uid, "headers": _auth(generate_token(uid, "vendor"))}


def _subuser(permissions):
    sid = str(subusers_collection.insert_one({
        "name": "Staff", "email": _unique_email("s"), "role": "Support Staff", "status": "active",
        "permissions": permissions, "passwordHash": generate_password_hash("x"),
    }).inserted_id)
    token = jwt.encode({"sub": sid, "role": "Support Staff", "exp": datetime.utcnow() + timedelta(hours=1)},
                       JWT_SECRET_KEY, algorithm="HS256")
    return {"id": sid, "headers": _auth(token)}


def _start_support(client, customer, text="I need help"):
    return client.post("/chat/conversations", json={"channel": "support", "subject": "Order", "body": text},
                       headers=customer["headers"])


def _handoff(client, customer, conv_id):
    return client.post(f"/chat/conversations/{conv_id}/handoff", headers=customer["headers"])


def _start_internal(client, admin, staff_ids):
    return client.post("/chat/conversations", json={
        "channel": "internal", "body": "private",
        "participantIds": [{"id": sid, "kind": "subuser"} for sid in staff_ids],
    }, headers=admin["headers"])


class TestCreateConversation:
    def test_customer_starts_support_chat_with_bot_first(self, client):
        res = _start_support(client, _customer())
        assert res.status_code == 201
        data = res.get_json()
        assert data["channel"] == "support" and data["status"] == "bot"

    def test_customer_can_hand_off_to_a_person(self, client):
        cust = _customer()
        conv_id = _start_support(client, cust).get_json()["id"]
        res = _handoff(client, cust, conv_id)
        assert res.status_code == 200
        assert res.get_json()["status"] == "waiting"

    def test_cannot_handoff_an_already_waiting_chat(self, client):
        cust = _customer()
        conv_id = _start_support(client, cust).get_json()["id"]
        _handoff(client, cust, conv_id)
        assert _handoff(client, cust, conv_id).status_code == 400

    def test_vendor_cannot_start_support_chat(self, client):
        res = client.post("/chat/conversations", json={"channel": "support", "body": "hi"},
                          headers=_vendor()["headers"])
        assert res.status_code == 403

    def test_empty_body_rejected(self, client):
        assert _start_support(client, _customer(), text="   ").status_code == 400

    def test_overlong_body_rejected(self, client):
        assert _start_support(client, _customer(), text="x" * 2001).status_code == 400

    def test_unknown_channel_rejected(self, client):
        res = client.post("/chat/conversations", json={"channel": "random", "body": "hi"},
                          headers=_customer()["headers"])
        assert res.status_code == 400

    def test_invalid_link_type_rejected(self, client):
        res = client.post("/chat/conversations", json={
            "channel": "support", "body": "hi", "link": {"type": "hacker", "id": "1"},
        }, headers=_customer()["headers"])
        assert res.status_code == 400

    def test_staff_vendor_chat_requires_existing_vendor(self, client):
        res = client.post("/chat/conversations", json={"channel": "vendor", "body": "hello"},
                          headers=_admin()["headers"])
        assert res.status_code == 400

    def test_staff_starts_vendor_chat_and_vendor_sees_it(self, client):
        admin, vendor = _admin(), _vendor()
        res = client.post("/chat/conversations", json={
            "channel": "vendor", "body": "Your KYB needs a fix", "vendorId": vendor["id"],
            "link": {"type": "vendor_application", "id": "abc"},
        }, headers=admin["headers"])
        assert res.status_code == 201
        listed = client.get("/chat/conversations", headers=vendor["headers"]).get_json()["conversations"]
        assert [c["id"] for c in listed] == [res.get_json()["id"]]

    def test_internal_chat_only_for_staff(self, client):
        res = client.post("/chat/conversations", json={"channel": "internal", "body": "hey"},
                          headers=_customer()["headers"])
        assert res.status_code == 403


class TestAccessRules:
    def test_customer_sees_only_own_support_chats(self, client):
        mine, other = _customer(), _customer()
        conv_id = _start_support(client, mine).get_json()["id"]
        assert client.get(f"/chat/conversations/{conv_id}", headers=other["headers"]).status_code == 404
        assert client.get("/chat/conversations", headers=other["headers"]).get_json()["conversations"] == []

    def test_customer_cannot_see_vendor_thread(self, client):
        admin, vendor = _admin(), _vendor()
        conv_id = client.post("/chat/conversations", json={
            "channel": "vendor", "body": "hi", "vendorId": vendor["id"],
        }, headers=admin["headers"]).get_json()["id"]
        assert client.get(f"/chat/conversations/{conv_id}", headers=_customer()["headers"]).status_code == 404

    def test_vendor_cannot_see_another_vendors_thread(self, client):
        admin, vendor_a = _admin(), _vendor("A")
        conv_id = client.post("/chat/conversations", json={
            "channel": "vendor", "body": "hi", "vendorId": vendor_a["id"],
        }, headers=admin["headers"]).get_json()["id"]
        assert client.get(f"/chat/conversations/{conv_id}", headers=_vendor("B")["headers"]).status_code == 404

    def test_admin_sees_every_channel(self, client):
        conv_id = _start_support(client, _customer()).get_json()["id"]
        assert client.get(f"/chat/conversations/{conv_id}", headers=_admin()["headers"]).status_code == 200

    def test_subuser_without_chat_permission_is_forbidden(self, client):
        staff = _subuser({"complaints": True})
        assert client.get("/chat/conversations", headers=staff["headers"]).status_code == 403

    def test_subuser_with_chat_permission_sees_support(self, client):
        conv_id = _start_support(client, _customer()).get_json()["id"]
        staff = _subuser({"chat": True})
        assert client.get(f"/chat/conversations/{conv_id}", headers=staff["headers"]).status_code == 200

    def test_internal_thread_hidden_from_non_member_staff(self, client):
        member, outsider = _subuser({"chat": True}), _subuser({"chat": True})
        conv_id = _start_internal(client, _admin(), [member["id"]]).get_json()["id"]
        assert client.get(f"/chat/conversations/{conv_id}", headers=member["headers"]).status_code == 200
        assert client.get(f"/chat/conversations/{conv_id}", headers=outsider["headers"]).status_code == 404

    def test_internal_thread_hidden_from_customer_and_vendor(self, client):
        staff = _subuser({"chat": True})
        conv_id = _start_internal(client, _admin(), [staff["id"]]).get_json()["id"]
        assert client.get(f"/chat/conversations/{conv_id}", headers=_customer()["headers"]).status_code == 404
        assert client.get(f"/chat/conversations/{conv_id}", headers=_vendor()["headers"]).status_code == 404

    def test_internal_participants_must_be_staff(self, client):
        cust = _customer()
        res = client.post("/chat/conversations", json={
            "channel": "internal", "body": "x", "participantIds": [{"id": cust["id"], "kind": "customer"}],
        }, headers=_admin()["headers"])
        assert res.status_code == 400

    def test_invalid_token_rejected(self, client):
        res = client.get("/chat/conversations", headers={"Authorization": "Bearer nonsense"})
        assert res.status_code == 401


class TestMessagingFlow:
    def test_staff_reply_moves_waiting_to_open_and_joins(self, client):
        staff = _subuser({"chat": True})
        conv_id = _start_support(client, _customer()).get_json()["id"]
        res = client.post(f"/chat/conversations/{conv_id}/messages", json={"body": "On it"}, headers=staff["headers"])
        assert res.status_code == 201
        data = res.get_json()
        assert data["status"] == "open"
        assert any(p["id"] == staff["id"] for p in data["participants"])

    def test_customer_reply_on_resolved_reopens_support_chat(self, client):
        cust, staff = _customer(), _subuser({"chat": True})
        conv_id = _start_support(client, cust).get_json()["id"]
        client.post(f"/chat/conversations/{conv_id}/status", json={"status": "resolved"}, headers=staff["headers"])
        res = client.post(f"/chat/conversations/{conv_id}/messages", json={"body": "still broken"}, headers=cust["headers"])
        assert res.get_json()["status"] == "waiting"

    def test_customer_cannot_change_status(self, client):
        cust = _customer()
        conv_id = _start_support(client, cust).get_json()["id"]
        res = client.post(f"/chat/conversations/{conv_id}/status", json={"status": "resolved"}, headers=cust["headers"])
        assert res.status_code == 403

    def test_status_rejects_unknown_value(self, client):
        staff = _subuser({"chat": True})
        conv_id = _start_support(client, _customer()).get_json()["id"]
        res = client.post(f"/chat/conversations/{conv_id}/status", json={"status": "bot"}, headers=staff["headers"])
        assert res.status_code == 400

    def test_only_members_can_post_into_internal_thread(self, client):
        member, outsider = _subuser({"chat": True}), _subuser({"chat": True})
        conv_id = _start_internal(client, _admin(), [member["id"]]).get_json()["id"]
        assert client.post(f"/chat/conversations/{conv_id}/messages", json={"body": "hi"},
                           headers=member["headers"]).status_code == 201
        assert client.post(f"/chat/conversations/{conv_id}/messages", json={"body": "hi"},
                           headers=outsider["headers"]).status_code == 404

    def test_unread_count_clears_after_opening(self, client):
        cust, staff = _customer(), _subuser({"chat": True})
        conv_id = _start_support(client, cust).get_json()["id"]
        client.post(f"/chat/conversations/{conv_id}/messages", json={"body": "Reply 1"}, headers=staff["headers"])
        client.post(f"/chat/conversations/{conv_id}/messages", json={"body": "Reply 2"}, headers=staff["headers"])
        listed = client.get("/chat/conversations", headers=cust["headers"]).get_json()["conversations"][0]
        assert listed["unread"] == 2
        client.get(f"/chat/conversations/{conv_id}", headers=cust["headers"])
        listed = client.get("/chat/conversations", headers=cust["headers"]).get_json()["conversations"][0]
        assert listed["unread"] == 0

    def test_history_returned_oldest_first(self, client):
        cust = _customer()
        conv_id = _start_support(client, cust, text="first").get_json()["id"]
        _handoff(client, cust, conv_id)
        client.post(f"/chat/conversations/{conv_id}/messages", json={"body": "second"}, headers=cust["headers"])
        msgs = client.get(f"/chat/conversations/{conv_id}", headers=cust["headers"]).get_json()["messages"]
        bodies = [m["body"] for m in msgs]
        assert bodies.index("first") < bodies.index("second")

    def test_list_filters_by_status_and_channel(self, client):
        staff = _subuser({"chat": True})
        waiting_cust = _customer()
        waiting_id = _start_support(client, waiting_cust, "w").get_json()["id"]
        _handoff(client, waiting_cust, waiting_id)
        open_cust = _customer()
        open_id = _start_support(client, open_cust, "o").get_json()["id"]
        _handoff(client, open_cust, open_id)
        client.post(f"/chat/conversations/{open_id}/messages", json={"body": "ok"}, headers=staff["headers"])
        opens = client.get("/chat/conversations?status=open", headers=staff["headers"]).get_json()["conversations"]
        assert [c["id"] for c in opens] == [open_id]
        waits = client.get("/chat/conversations?status=waiting", headers=staff["headers"]).get_json()["conversations"]
        assert [c["id"] for c in waits] == [waiting_id]
        assert client.get("/chat/conversations?channel=vendor", headers=staff["headers"]).get_json()["conversations"] == []


class TestInboxSupport:
    def test_non_member_staff_view_is_audited(self, client):
        cust, staff = _customer(), _subuser({"chat": True})
        conv_id = _start_support(client, cust).get_json()["id"]
        data = client.get(f"/chat/conversations/{conv_id}", headers=staff["headers"]).get_json()
        assert data["audit"][-1]["viewer"]["id"] == staff["id"]

    def test_member_view_not_audited(self, client):
        cust = _customer()
        conv_id = _start_support(client, cust).get_json()["id"]
        data = client.get(f"/chat/conversations/{conv_id}", headers=cust["headers"]).get_json()
        assert data["audit"] == []

    def test_list_returns_status_counts(self, client):
        staff = _subuser({"chat": True})
        for _ in range(2):
            cust = _customer()
            conv_id = _start_support(client, cust, "a").get_json()["id"]
            _handoff(client, cust, conv_id)
        counts = client.get("/chat/conversations", headers=staff["headers"]).get_json()["counts"]
        assert counts["waiting"] == 2
        assert counts["resolved"] == 0

    def test_list_returns_bot_status_count(self, client):
        staff = _subuser({"chat": True})
        _start_support(client, _customer(), "a")
        counts = client.get("/chat/conversations", headers=staff["headers"]).get_json()["counts"]
        assert counts["bot"] == 1


class TestSupportBot:
    def _faq(self, question, answer, status="published", order=1):
        from database import faqs_collection
        faqs_collection.insert_one({"question": question, "answer": answer, "status": status, "order": order})

    def test_bot_answers_from_matching_faq(self, client):
        self._faq("What is your return policy?", "You can return items within 7 days.")
        cust = _customer()
        res = _start_support(client, cust, text="what is your return policy")
        conv_id = res.get_json()["id"]
        msgs = client.get(f"/chat/conversations/{conv_id}", headers=cust["headers"]).get_json()["messages"]
        assert any("return items within 7 days" in m["body"] for m in msgs)
        assert all(m["sender"]["kind"] != "subuser" for m in msgs)

    def test_bot_falls_back_when_no_faq_matches(self, client):
        cust = _customer()
        conv_id = _start_support(client, cust, text="zzz gibberish question").get_json()["id"]
        msgs = client.get(f"/chat/conversations/{conv_id}", headers=cust["headers"]).get_json()["messages"]
        assert any("Talk to a person" in m["body"] for m in msgs)

    def test_unpublished_faq_not_used(self, client):
        self._faq("Shipping cost?", "Shipping is free.", status="draft")
        cust = _customer()
        conv_id = _start_support(client, cust, text="shipping cost").get_json()["id"]
        msgs = client.get(f"/chat/conversations/{conv_id}", headers=cust["headers"]).get_json()["messages"]
        assert not any("Shipping is free" in m["body"] for m in msgs)

    def test_bot_keeps_answering_until_handoff(self, client):
        self._faq("refund", "Refunds take 5 days.")
        cust = _customer()
        conv_id = _start_support(client, cust, text="hello").get_json()["id"]
        res = client.post(f"/chat/conversations/{conv_id}/messages", json={"body": "refund please"}, headers=cust["headers"])
        assert res.get_json()["status"] == "bot"
        msgs = client.get(f"/chat/conversations/{conv_id}", headers=cust["headers"]).get_json()["messages"]
        assert any("Refunds take 5 days" in m["body"] for m in msgs)

    def test_handoff_posts_bot_notice_and_stops_bot_replies(self, client):
        self._faq("refund", "Refunds take 5 days.")
        cust = _customer()
        conv_id = _start_support(client, cust, text="hi").get_json()["id"]
        _handoff(client, cust, conv_id)
        client.post(f"/chat/conversations/{conv_id}/messages", json={"body": "refund please"}, headers=cust["headers"])
        msgs = client.get(f"/chat/conversations/{conv_id}", headers=cust["headers"]).get_json()["messages"]
        assert not any("Refunds take 5 days" in m["body"] for m in msgs)
        assert any("Connecting you to a support agent" in m["body"] for m in msgs)

    def test_vendor_and_internal_channels_have_no_bot(self, client):
        admin, vendor = _admin(), _vendor()
        conv_id = client.post("/chat/conversations", json={
            "channel": "vendor", "body": "hello", "vendorId": vendor["id"],
        }, headers=admin["headers"]).get_json()["id"]
        msgs = client.get(f"/chat/conversations/{conv_id}", headers=admin["headers"]).get_json()["messages"]
        assert len(msgs) == 1

    def test_only_customer_participant_can_handoff(self, client):
        cust = _customer()
        conv_id = _start_support(client, cust).get_json()["id"]
        other = _customer()
        res = _handoff(client, other, conv_id)
        assert res.status_code == 404


class TestVendorLinkDedupe:
    def test_second_message_on_same_link_reuses_thread(self, client):
        admin, vendor = _admin(), _vendor()
        link = {"type": "payout", "id": "p1"}
        first = client.post("/chat/conversations", json={
            "channel": "vendor", "body": "Payout question 1", "vendorId": vendor["id"], "link": link,
        }, headers=admin["headers"])
        assert first.status_code == 201
        conv_id = first.get_json()["id"]

        second = client.post("/chat/conversations", json={
            "channel": "vendor", "body": "Payout question 2", "vendorId": vendor["id"], "link": link,
        }, headers=admin["headers"])
        assert second.status_code == 200
        assert second.get_json()["id"] == conv_id

        msgs = client.get(f"/chat/conversations/{conv_id}", headers=admin["headers"]).get_json()["messages"]
        assert [m["body"] for m in msgs] == ["Payout question 1", "Payout question 2"]

    def test_vendor_side_also_reuses_same_link_thread(self, client):
        admin, vendor = _admin(), _vendor()
        link = {"type": "product", "id": "sku1"}
        client.post("/chat/conversations", json={
            "channel": "vendor", "body": "Why was it rejected?", "vendorId": vendor["id"], "link": link,
        }, headers=admin["headers"])
        res = client.post("/chat/conversations", json={
            "channel": "vendor", "body": "Any update?", "link": link,
        }, headers=vendor["headers"])
        assert res.status_code == 200

    def test_different_link_ids_create_separate_threads(self, client):
        admin, vendor = _admin(), _vendor()
        first = client.post("/chat/conversations", json={
            "channel": "vendor", "body": "A", "vendorId": vendor["id"], "link": {"type": "payout", "id": "p1"},
        }, headers=admin["headers"]).get_json()["id"]
        second = client.post("/chat/conversations", json={
            "channel": "vendor", "body": "B", "vendorId": vendor["id"], "link": {"type": "payout", "id": "p2"},
        }, headers=admin["headers"]).get_json()["id"]
        assert first != second

    def test_resolved_link_thread_is_not_reused(self, client):
        admin, vendor = _admin(), _vendor()
        link = {"type": "vendor_application", "id": "app1"}
        first_id = client.post("/chat/conversations", json={
            "channel": "vendor", "body": "A", "vendorId": vendor["id"], "link": link,
        }, headers=admin["headers"]).get_json()["id"]
        client.post(f"/chat/conversations/{first_id}/status", json={"status": "resolved"}, headers=admin["headers"])
        second = client.post("/chat/conversations", json={
            "channel": "vendor", "body": "B", "vendorId": vendor["id"], "link": link,
        }, headers=admin["headers"])
        assert second.status_code == 201
        assert second.get_json()["id"] != first_id


class TestStaffDirectory:
    def test_requires_staff(self, client):
        res = client.get("/chat/staff-directory", headers=_customer()["headers"])
        assert res.status_code == 403

    def test_admin_sees_other_admins_and_chat_subusers(self, client):
        admin = _admin()
        _admin()
        _subuser({"chat": True})
        _subuser({"complaints": True})
        people = client.get("/chat/staff-directory", headers=admin["headers"]).get_json()["people"]
        kinds = [p["kind"] for p in people]
        assert kinds.count("admin") == 1
        assert kinds.count("subuser") == 1

    def test_self_excluded_from_directory(self, client):
        staff = _subuser({"chat": True})
        people = client.get("/chat/staff-directory", headers=staff["headers"]).get_json()["people"]
        assert staff["id"] not in [p["id"] for p in people]


class TestUnreadSummary:
    def test_requires_staff(self, client):
        assert client.get("/chat/unread-summary", headers=_customer()["headers"]).status_code == 403

    def test_counts_waiting_support_and_vendor(self, client):
        admin, vendor = _admin(), _vendor()
        cust = _customer()
        conv_id = _start_support(client, cust).get_json()["id"]
        _handoff(client, cust, conv_id)
        client.post("/chat/conversations", json={"channel": "vendor", "body": "hi"}, headers=vendor["headers"])
        data = client.get("/chat/unread-summary", headers=admin["headers"]).get_json()
        assert data["waiting_support"] == 1
        assert data["waiting_vendor"] == 1

    def test_counts_own_unread_internal(self, client):
        admin = _admin()
        staff = _subuser({"chat": True})
        _start_internal(client, admin, [staff["id"]])
        data = client.get("/chat/unread-summary", headers=staff["headers"]).get_json()
        assert data["unread_internal"] == 1
        assert data["total"] >= 1

    def test_reading_clears_unread_internal(self, client):
        admin = _admin()
        staff = _subuser({"chat": True})
        conv_id = _start_internal(client, admin, [staff["id"]]).get_json()["id"]
        client.get(f"/chat/conversations/{conv_id}", headers=staff["headers"])
        data = client.get("/chat/unread-summary", headers=staff["headers"]).get_json()
        assert data["unread_internal"] == 0
