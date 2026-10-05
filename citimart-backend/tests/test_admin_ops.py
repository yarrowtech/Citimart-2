# tests/test_admin_ops.py
from datetime import datetime, timedelta

from werkzeug.security import generate_password_hash

from database import error_logs_collection, orders_collection, vendors_collection, users_collection
from routes.admin_ops_routes import explain_error


def _admin_headers(client):
    users_collection.insert_one({
        "name": "Admin", "email": "ops@test.com",
        "password": generate_password_hash("opspass"), "role": "admin",
    })
    token = client.post("/auth/login/admin", json={"email": "ops@test.com", "password": "opspass"}).get_json()["token"]
    return {"Authorization": f"Bearer {token}"}


def _error(message="boom", status=500, resolved=None, age_hours=0):
    doc = {"method": "GET", "path": "/api/x", "error_message": message, "status_code": status,
           "created_at": datetime.utcnow() - timedelta(hours=age_hours)}
    if resolved is not None:
        doc["resolved"] = resolved
    return error_logs_collection.insert_one(doc).inserted_id


class TestExplainError:
    def test_connection_failure_explained(self):
        assert explain_error(500, "ServerSelectionTimeoutError")["title"] == "Database unreachable"

    def test_404_explained(self):
        assert explain_error(404, "not found")["title"] == "Page or API route not found"

    def test_unknown_falls_back(self):
        assert explain_error(500, "something odd")["title"] == "Unexpected server error"


class TestNotificationFeed:
    def test_requires_admin(self, client):
        assert client.get("/admin/notifications").status_code == 401

    def test_feed_includes_open_errors_and_new_orders(self, client):
        headers = _admin_headers(client)
        _error("KeyError: 'x'")
        orders_collection.insert_one({"created_at": datetime.utcnow(), "final_amount": 499, "status": "placed"})
        data = client.get("/admin/notifications", headers=headers).get_json()
        kinds = {item["kind"] for item in data["items"]}
        assert {"error", "order"} <= kinds
        assert data["unresolved_errors"] == 1

    def test_status_change_appears(self, client):
        headers = _admin_headers(client)
        orders_collection.insert_one({"created_at": datetime.utcnow() - timedelta(days=3),
                                      "status": "shipped", "status_updated_at": datetime.utcnow()})
        data = client.get("/admin/notifications", headers=headers).get_json()
        assert any(item["kind"] == "order_status" for item in data["items"])

    def test_resolved_errors_excluded(self, client):
        headers = _admin_headers(client)
        _error("KeyError", resolved=True)
        data = client.get("/admin/notifications", headers=headers).get_json()
        assert not any(item["kind"] == "error" for item in data["items"])
        assert data["unresolved_errors"] == 0

    def test_pending_vendors_summary(self, client):
        headers = _admin_headers(client)
        vendors_collection.insert_one({"fullName": "V", "status": "pending"})
        data = client.get("/admin/notifications", headers=headers).get_json()
        assert any(item["kind"] == "vendor" for item in data["items"])


class TestErrorCenter:
    def test_open_filter_excludes_resolved(self, client):
        headers = _admin_headers(client)
        _error("open one")
        _error("done", resolved=True)
        data = client.get("/admin/error-center?status=open", headers=headers).get_json()
        assert [log["error_message"] for log in data["logs"]] == ["open one"]
        assert data["counts"] == {"open": 1, "resolved": 1}

    def test_legacy_error_without_flag_counts_as_open(self, client):
        headers = _admin_headers(client)
        _error("legacy")
        data = client.get("/admin/error-center?status=open", headers=headers).get_json()
        assert data["counts"]["open"] == 1

    def test_logs_carry_explanation(self, client):
        headers = _admin_headers(client)
        _error("ServerSelectionTimeoutError", status=500)
        log = client.get("/admin/error-center", headers=headers).get_json()["logs"][0]
        assert log["title"] == "Database unreachable"
        assert log["fix"]

    def test_mark_resolved_with_note(self, client):
        headers = _admin_headers(client)
        oid = _error("fix me")
        res = client.patch(f"/admin/error-center/{oid}", json={"resolved": True, "note": "restarted mongo"}, headers=headers)
        assert res.status_code == 200
        doc = error_logs_collection.find_one({"_id": oid})
        assert doc["resolved"] is True and doc["note"] == "restarted mongo"
        assert doc["resolved_at"] is not None

    def test_reopen(self, client):
        headers = _admin_headers(client)
        oid = _error("again", resolved=True)
        client.patch(f"/admin/error-center/{oid}", json={"resolved": False}, headers=headers)
        assert error_logs_collection.find_one({"_id": oid})["resolved"] is False

    def test_invalid_id_rejected(self, client):
        headers = _admin_headers(client)
        assert client.patch("/admin/error-center/not-an-id", json={"resolved": True}, headers=headers).status_code == 400

    def test_empty_patch_rejected(self, client):
        headers = _admin_headers(client)
        oid = _error("x")
        assert client.patch(f"/admin/error-center/{oid}", json={}, headers=headers).status_code == 400


class TestChatInFeed:
    def test_waiting_support_appears_in_feed(self, client):
        from database import chat_conversations_collection
        headers = _admin_headers(client)
        chat_conversations_collection.insert_one({
            "channel": "support", "status": "waiting", "participants": [],
            "created_at": datetime.utcnow(), "updated_at": datetime.utcnow(), "read_at": {},
        })
        data = client.get("/admin/notifications", headers=headers).get_json()
        assert any(item["id"] == "chat-waiting-support" for item in data["items"])

    def test_no_chat_items_when_nothing_pending(self, client):
        headers = _admin_headers(client)
        data = client.get("/admin/notifications", headers=headers).get_json()
        assert not any(item["kind"] == "chat" for item in data["items"])
