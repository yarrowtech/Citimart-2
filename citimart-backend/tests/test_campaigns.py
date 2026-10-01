# tests/test_campaigns.py
from datetime import datetime, timedelta
from unittest.mock import patch

from werkzeug.security import generate_password_hash

from database import users_collection, orders_collection, db

campaigns_collection = db["campaigns"]


def _admin_token(client, email="admin@test.com", password="adminpass"):
    users_collection.insert_one({
        "name": "Admin", "email": email,
        "password": generate_password_hash(password), "role": "admin",
    })
    res = client.post("/auth/login/admin", json={"email": email, "password": password})
    return res.get_json()["token"]


def _auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def _create_active_subuser(client, email, permissions):
    with patch("routes.subuser_routes.send_email", return_value=True):
        create_res = client.post("/subuser/subusers", json={
            "email": email, "parentType": "Admin", "role": "Support Staff",
            "permissions": permissions,
        })
    setup_token = create_res.get_json()["subuser"]["setupToken"]
    client.post("/subuser/setup", json={"token": setup_token, "password": "subuserpass123"})
    login_res = client.post("/subuser/login/subuser", json={"email": email, "password": "subuserpass123"})
    return login_res.get_json()["token"]


def _seed_customer(name, email, segment="all"):
    return str(users_collection.insert_one({
        "name": name, "email": email, "role": "customer", "segment": segment,
    }).inserted_id)


class TestSendCampaign:
    @patch("routes.campaign_routes.send_email", return_value=True)
    def test_admin_send_to_all_customers(self, mock_send, client):
        token = _admin_token(client)
        _seed_customer("Alice", "alice@test.com")
        _seed_customer("Bob", "bob@test.com")

        res = client.post("/admin/campaigns", json={
            "subject": "Big Sale!", "body": "Hi {{name}}, 20% off everything.",
            "audience": {"type": "all"},
        }, headers=_auth_headers(token))
        assert res.status_code == 201
        data = res.get_json()
        assert data["recipient_count"] == 2
        assert data["sent_count"] == 2
        assert mock_send.call_count == 2
        assert campaigns_collection.count_documents({}) == 1

    @patch("routes.campaign_routes.send_email", return_value=True)
    def test_send_to_segment_only(self, mock_send, client):
        token = _admin_token(client)
        _seed_customer("VIP Vicky", "vicky@test.com", segment="vip")
        _seed_customer("Regular Rob", "rob@test.com", segment="all")

        res = client.post("/admin/campaigns", json={
            "subject": "VIP Early Access", "body": "Hi {{name}}",
            "audience": {"type": "segment", "segment": "vip"},
        }, headers=_auth_headers(token))
        assert res.get_json()["recipient_count"] == 1
        mock_send.assert_called_once()
        assert mock_send.call_args[0][0] == "vicky@test.com"

    @patch("routes.campaign_routes.send_email", return_value=True)
    def test_send_to_custom_list(self, mock_send, client):
        token = _admin_token(client)
        res = client.post("/admin/campaigns", json={
            "subject": "Hi", "body": "Hello",
            "audience": {"type": "custom", "emails": ["a@test.com", "b@test.com"]},
        }, headers=_auth_headers(token))
        assert res.get_json()["recipient_count"] == 2

    def test_missing_subject_rejected(self, client):
        token = _admin_token(client)
        res = client.post("/admin/campaigns", json={"body": "x", "audience": {"type": "all"}},
                           headers=_auth_headers(token))
        assert res.status_code == 400

    def test_send_requires_admin_auth(self, client):
        res = client.post("/admin/campaigns", json={"subject": "x", "body": "y"})
        assert res.status_code == 401

    @patch("routes.campaign_routes.send_email", return_value=True)
    def test_subuser_with_permission_can_send(self, mock_send, client):
        token = _create_active_subuser(client, "crm-sub@test.com", {"customer_crm": True})
        _seed_customer("Dana", "dana@test.com")

        res = client.post("/subuser/campaigns", json={
            "subject": "Offer", "body": "Hello {{name}}", "audience": {"type": "all"},
        }, headers=_auth_headers(token))
        assert res.status_code == 201
        assert res.get_json()["sent_count"] == 1

    def test_subuser_without_permission_rejected(self, client):
        token = _create_active_subuser(client, "nocrm-sub@test.com", {"customer_crm": False})
        res = client.post("/subuser/campaigns", json={"subject": "x", "body": "y"},
                           headers=_auth_headers(token))
        assert res.status_code == 403


class TestListCampaigns:
    @patch("routes.campaign_routes.send_email", return_value=True)
    def test_list_shows_sent_campaigns(self, mock_send, client):
        token = _admin_token(client)
        client.post("/admin/campaigns", json={"subject": "A", "body": "B", "audience": {"type": "all"}},
                     headers=_auth_headers(token))
        res = client.get("/admin/campaigns", headers=_auth_headers(token))
        assert len(res.get_json()["campaigns"]) == 1

    def test_list_requires_auth(self, client):
        res = client.get("/admin/campaigns")
        assert res.status_code == 401


class TestCustomerCrmSubuserAccess:
    def test_subuser_with_permission_can_view_customers(self, client):
        token = _create_active_subuser(client, "crmview-sub@test.com", {"customer_crm": True})
        _seed_customer("Eve", "eve@test.com")
        res = client.get("/subuser/crm/customers", headers=_auth_headers(token))
        assert res.status_code == 200
        assert len(res.get_json()["customers"]) == 1

    def test_subuser_can_view_customer_profile(self, client):
        token = _create_active_subuser(client, "crmprofile-sub@test.com", {"customer_crm": True})
        cid = _seed_customer("Frank", "frank@test.com")
        res = client.get(f"/subuser/crm/customers/{cid}", headers=_auth_headers(token))
        assert res.status_code == 200
        assert res.get_json()["profile"]["name"] == "Frank"

    def test_subuser_without_permission_rejected(self, client):
        token = _create_active_subuser(client, "nocrmview-sub@test.com", {"customer_crm": False})
        res = client.get("/subuser/crm/customers", headers=_auth_headers(token))
        assert res.status_code == 403


class TestFollowups:
    def test_post_purchase_followup_surfaced(self, client):
        token = _admin_token(client)
        cid = _seed_customer("Grace", "grace@test.com")
        order_id = str(orders_collection.insert_one({
            "customer_id": cid, "order_items": [], "final_amount": 500,
            "status": "Delivered", "created_at": datetime.utcnow() - timedelta(days=5),
        }).inserted_id)

        res = client.get("/admin/crm/followups", headers=_auth_headers(token))
        followups = res.get_json()["followups"]
        matches = [f for f in followups if f["order_id"] == order_id]
        assert len(matches) == 1
        assert matches[0]["reason"] == "post_purchase"

    def test_too_recent_delivery_not_surfaced(self, client):
        token = _admin_token(client)
        cid = _seed_customer("Henry", "henry@test.com")
        orders_collection.insert_one({
            "customer_id": cid, "order_items": [], "final_amount": 500,
            "status": "Delivered", "created_at": datetime.utcnow() - timedelta(days=1),
        })
        res = client.get("/admin/crm/followups", headers=_auth_headers(token))
        assert res.get_json()["followups"] == []

    def test_already_followed_up_order_excluded(self, client):
        token = _admin_token(client)
        cid = _seed_customer("Ivy", "ivy@test.com")
        orders_collection.insert_one({
            "customer_id": cid, "order_items": [], "final_amount": 500,
            "status": "Delivered", "created_at": datetime.utcnow() - timedelta(days=5),
            "followUpSent": True,
        })
        res = client.get("/admin/crm/followups", headers=_auth_headers(token))
        assert res.get_json()["followups"] == []

    def test_win_back_customer_surfaced(self, client):
        token = _admin_token(client)
        cid = _seed_customer("Jack", "jack@test.com")
        orders_collection.insert_one({
            "customer_id": cid, "order_items": [], "final_amount": 500,
            "status": "Placed", "created_at": datetime.utcnow() - timedelta(days=90),
        })
        res = client.get("/admin/crm/followups", headers=_auth_headers(token))
        reasons = [f["reason"] for f in res.get_json()["followups"] if f["customer_id"] == cid]
        assert "win_back" in reasons

    def test_recent_customer_not_win_back(self, client):
        token = _admin_token(client)
        cid = _seed_customer("Kate", "kate@test.com")
        orders_collection.insert_one({
            "customer_id": cid, "order_items": [], "final_amount": 500,
            "status": "Placed", "created_at": datetime.utcnow() - timedelta(days=10),
        })
        res = client.get("/admin/crm/followups", headers=_auth_headers(token))
        win_backs = [f for f in res.get_json()["followups"] if f["reason"] == "win_back" and f["customer_id"] == cid]
        assert win_backs == []

    def test_followups_require_auth(self, client):
        res = client.get("/admin/crm/followups")
        assert res.status_code == 401


class TestSendFollowup:
    @patch("routes.campaign_routes.send_email", return_value=True)
    def test_send_post_purchase_followup_marks_order(self, mock_send, client):
        token = _admin_token(client)
        cid = _seed_customer("Liam", "liam@test.com")
        order_id = str(orders_collection.insert_one({
            "customer_id": cid, "order_items": [], "final_amount": 500,
            "status": "Delivered", "created_at": datetime.utcnow() - timedelta(days=5),
        }).inserted_id)

        res = client.post("/admin/crm/followups/send", json={
            "customer_id": cid, "reason": "post_purchase", "order_id": order_id,
            "subject": "How was your order?", "body": "We'd love your feedback!",
        }, headers=_auth_headers(token))
        assert res.status_code == 200
        mock_send.assert_called_once()

        order = orders_collection.find_one({"_id": __import__("bson").ObjectId(order_id)})
        assert order["followUpSent"] is True

        # sent again -> no longer surfaced
        followups = client.get("/admin/crm/followups", headers=_auth_headers(token)).get_json()["followups"]
        assert all(f["order_id"] != order_id for f in followups)

    def test_send_followup_missing_fields_rejected(self, client):
        token = _admin_token(client)
        cid = _seed_customer("Mia", "mia@test.com")
        res = client.post("/admin/crm/followups/send", json={"customer_id": cid},
                           headers=_auth_headers(token))
        assert res.status_code == 400

    def test_send_followup_requires_auth(self, client):
        res = client.post("/admin/crm/followups/send", json={})
        assert res.status_code == 401


class TestOrderStatusEmail:
    @patch("routes.crm_routes.send_order_status_email", return_value=True)
    def test_status_change_triggers_email(self, mock_send, client):
        cid = _seed_customer("Noah", "noah@test.com")
        order_id = str(orders_collection.insert_one({
            "customer_id": cid, "order_items": [{"a": 1}], "final_amount": 300, "status": "Placed",
        }).inserted_id)

        res = client.put(f"/admin/orders/{order_id}", json={"status": "shipped"})
        assert res.status_code == 200
        mock_send.assert_called_once()
        call_kwargs = mock_send.call_args.kwargs
        assert call_kwargs["customer_email"] == "noah@test.com"
        assert call_kwargs["status"] == "shipped"

    @patch("routes.crm_routes.send_order_status_email", return_value=True)
    def test_customer_with_no_email_does_not_crash(self, mock_send, client):
        cid = str(users_collection.insert_one({"name": "No Email", "role": "customer"}).inserted_id)
        order_id = str(orders_collection.insert_one({
            "customer_id": cid, "order_items": [], "final_amount": 100, "status": "Placed",
        }).inserted_id)

        res = client.put(f"/admin/orders/{order_id}", json={"status": "shipped"})
        assert res.status_code == 200
        mock_send.assert_not_called()
