# tests/test_subuser_operations.py
from unittest.mock import patch
from datetime import datetime, timedelta

from database import offers_collection, complaints_collection, products_collection


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


def _auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def _offer_payload(**overrides):
    payload = {
        "title": "Test Offer", "description": "desc", "discount": "10",
        "start_date": datetime.utcnow().isoformat(),
        "end_date": (datetime.utcnow() + timedelta(days=10)).isoformat(),
    }
    payload.update(overrides)
    return payload


class TestSubuserOffers:
    def test_offers_crud_with_promotions_permission(self, client):
        token = _create_active_subuser(client, "promo-sub@test.com", {"promotions": True})
        headers = _auth_headers(token)

        create_res = client.post("/subuser/offers", data=_offer_payload(), headers=headers)
        assert create_res.status_code == 201
        offer_id = create_res.get_json()["_id"]

        list_res = client.get("/subuser/offers", headers=headers)
        assert len(list_res.get_json()) == 1

        update_res = client.put(f"/subuser/offers/{offer_id}", data=_offer_payload(title="Updated Offer"), headers=headers)
        assert update_res.status_code == 200
        assert update_res.get_json()["title"] == "Updated Offer"

        delete_res = client.delete(f"/subuser/offers/{offer_id}", headers=headers)
        assert delete_res.status_code == 200
        assert offers_collection.count_documents({}) == 0

    def test_offers_accessible_with_campaigns_permission_too(self, client):
        token = _create_active_subuser(client, "campaign-sub@test.com", {"campaigns": True})
        res = client.get("/subuser/offers", headers=_auth_headers(token))
        assert res.status_code == 200

    def test_offers_without_either_permission_rejected(self, client):
        token = _create_active_subuser(client, "no-promo-sub@test.com", {"faq": True})
        res = client.get("/subuser/offers", headers=_auth_headers(token))
        assert res.status_code == 403

    def test_create_offer_missing_dates_rejected(self, client):
        token = _create_active_subuser(client, "baddate-sub@test.com", {"promotions": True})
        res = client.post("/subuser/offers", data={"title": "x"}, headers=_auth_headers(token))
        assert res.status_code == 400


class TestSubuserReports:
    def test_reports_with_reports_permission(self, client):
        token = _create_active_subuser(client, "reports-sub@test.com", {"reports": True})
        res = client.get("/subuser/reports", headers=_auth_headers(token))
        assert res.status_code == 200
        data = res.get_json()
        assert "total_sales" in data
        assert "monthly_revenue" in data

    def test_reports_with_analytics_permission_too(self, client):
        token = _create_active_subuser(client, "analytics-sub@test.com", {"analytics": True})
        res = client.get("/subuser/reports", headers=_auth_headers(token))
        assert res.status_code == 200

    def test_reports_without_permission_rejected(self, client):
        token = _create_active_subuser(client, "no-reports-sub@test.com", {"faq": True})
        res = client.get("/subuser/reports", headers=_auth_headers(token))
        assert res.status_code == 403


class TestSubuserMerchandise:
    def test_merchandise_with_permission(self, client):
        token = _create_active_subuser(client, "merch-sub@test.com", {"merchandise": True})
        products_collection.insert_one({
            "name": "Merch Item", "variants": [{"sku": "SKU1", "stock": 5, "color": "Red", "size": "M"}],
        })
        res = client.get("/subuser/merchandise", headers=_auth_headers(token))
        assert res.status_code == 200
        assert len(res.get_json()) == 1
        assert res.get_json()[0]["productName"] == "Merch Item"

    def test_merchandise_without_permission_rejected(self, client):
        token = _create_active_subuser(client, "no-merch-sub@test.com", {"faq": True})
        res = client.get("/subuser/merchandise", headers=_auth_headers(token))
        assert res.status_code == 403


class TestSubuserComplaints:
    def test_complaints_list_and_update_with_permission(self, client):
        token = _create_active_subuser(client, "complaints-sub@test.com", {"complaints": True})
        complaint_id = str(complaints_collection.insert_one({
            "user_id": None, "category": "Delivery", "description": "Late delivery",
            "status": "Pending", "date": "2026-01-01",
        }).inserted_id)

        list_res = client.get("/subuser/complaints", headers=_auth_headers(token))
        assert list_res.status_code == 200
        assert len(list_res.get_json()) == 1

        update_res = client.put(f"/subuser/complaints/{complaint_id}", json={"status": "Resolved"}, headers=_auth_headers(token))
        assert update_res.status_code == 200

        updated = complaints_collection.find_one({})
        assert updated["status"] == "Resolved"

    def test_complaints_without_permission_rejected(self, client):
        token = _create_active_subuser(client, "no-complaints-sub@test.com", {"faq": True})
        res = client.get("/subuser/complaints", headers=_auth_headers(token))
        assert res.status_code == 403
