# tests/test_analytics.py
from datetime import datetime, timedelta

from werkzeug.security import generate_password_hash

from database import views_collection, users_collection, vendors_collection, subusers_collection


def _admin_token(client, email="admin@test.com", password="adminpass"):
    users_collection.insert_one({
        "name": "Admin", "email": email,
        "password": generate_password_hash(password), "role": "admin",
    })
    res = client.post("/auth/login/admin", json={"email": email, "password": password})
    return res.get_json()["token"]


def _auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


class TestPageviewLogging:
    def test_log_pageview_succeeds(self, client):
        res = client.post("/analytics/pageview", json={"path": "/products", "visitorId": "v1"})
        assert res.status_code == 200
        assert res.get_json()["ok"] is True
        assert views_collection.count_documents({"visitorId": "v1"}) == 1

    def test_missing_fields_does_not_crash(self, client):
        res = client.post("/analytics/pageview", json={})
        assert res.status_code == 200
        assert res.get_json()["ok"] is False
        assert views_collection.count_documents({}) == 0

    def test_logged_in_customer_is_identified(self, client):
        client.post("/auth/register", json={"name": "C", "email": "c@test.com", "password": "custpass123"})
        token = client.post("/auth/login/customer", json={"email": "c@test.com", "password": "custpass123"}).get_json()["token"]

        client.post("/analytics/pageview", json={"path": "/cart", "visitorId": "v2"},
                    headers=_auth_headers(token))
        doc = views_collection.find_one({"visitorId": "v2"})
        assert doc["role"] == "customer"
        assert doc["userId"] is not None

    def test_anonymous_visit_recorded_as_guest(self, client):
        client.post("/analytics/pageview", json={"path": "/", "visitorId": "v3"})
        doc = views_collection.find_one({"visitorId": "v3"})
        assert doc["role"] == "guest"
        assert doc["userId"] is None

    def test_invalid_token_still_logs_as_guest(self, client):
        res = client.post("/analytics/pageview", json={"path": "/", "visitorId": "v4"},
                           headers={"Authorization": "Bearer garbage-token"})
        assert res.status_code == 200
        doc = views_collection.find_one({"visitorId": "v4"})
        assert doc["role"] == "guest"


class TestOverview:
    def test_requires_admin_auth(self, client):
        res = client.get("/admin/analytics/overview")
        assert res.status_code == 401

    def test_counts_unique_visitors_and_pageviews(self, client):
        token = _admin_token(client)
        client.post("/analytics/pageview", json={"path": "/a", "visitorId": "x1"})
        client.post("/analytics/pageview", json={"path": "/b", "visitorId": "x1"})
        client.post("/analytics/pageview", json={"path": "/a", "visitorId": "x2"})

        res = client.get("/admin/analytics/overview?days=7", headers=_auth_headers(token))
        data = res.get_json()
        assert data["unique_visitors"] == 2
        assert data["total_pageviews"] == 3
        assert {"path": "/a", "views": 2} in data["top_pages"]

    def test_old_pageviews_outside_window_excluded(self, client):
        token = _admin_token(client)
        views_collection.insert_one({
            "path": "/old", "visitorId": "old-visitor", "userId": None, "role": "guest",
            "timestamp": datetime.utcnow() - timedelta(days=30),
        })
        res = client.get("/admin/analytics/overview?days=7", headers=_auth_headers(token))
        assert res.get_json()["total_pageviews"] == 0

    def test_includes_real_totals(self, client):
        token = _admin_token(client)
        users_collection.insert_one({"name": "Cust", "email": "x@test.com", "role": "customer"})
        res = client.get("/admin/analytics/overview", headers=_auth_headers(token))
        data = res.get_json()
        assert data["total_customers"] >= 1
        assert "guest_leads_total" in data
        assert "vendor_login_total" in data
        assert "subuser_login_total" in data


class TestLiveActivity:
    def test_requires_admin_auth(self, client):
        res = client.get("/admin/analytics/live")
        assert res.status_code == 401

    def test_shows_most_recent_page_per_visitor(self, client):
        token = _admin_token(client)
        client.post("/analytics/pageview", json={"path": "/first", "visitorId": "live1"})
        client.post("/analytics/pageview", json={"path": "/second", "visitorId": "live1"})

        res = client.get("/admin/analytics/live?minutes=5", headers=_auth_headers(token))
        data = res.get_json()
        assert data["count"] == 1
        assert data["live"][0]["path"] == "/second"  # most recent, not first

    def test_old_views_outside_window_excluded_from_live(self, client):
        token = _admin_token(client)
        views_collection.insert_one({
            "path": "/stale", "visitorId": "stale-visitor", "userId": None, "role": "guest",
            "timestamp": datetime.utcnow() - timedelta(minutes=30),
        })
        res = client.get("/admin/analytics/live?minutes=5", headers=_auth_headers(token))
        assert res.get_json()["count"] == 0

    def test_identified_vendor_shows_business_name(self, client):
        token = _admin_token(client)
        vendor_id = str(vendors_collection.insert_one({
            "fullName": "V", "businessName": "Cool Shop", "email": "v@test.com",
            "password": generate_password_hash("pass"), "status": "approved",
        }).inserted_id)
        vendor_token = client.post("/auth/login/vendor", json={"email": "v@test.com", "password": "pass"}).get_json()["token"]

        client.post("/analytics/pageview", json={"path": "/vendor/dashboard", "visitorId": "vendor-visit"},
                    headers=_auth_headers(vendor_token))

        res = client.get("/admin/analytics/live?minutes=5", headers=_auth_headers(token))
        row = res.get_json()["live"][0]
        assert row["label"] == "Cool Shop"
        assert row["role"] == "vendor"


class TestLoginTracking:
    def test_vendor_login_increments_count(self, client):
        vendors_collection.insert_one({
            "fullName": "V", "email": "vlogin@test.com",
            "password": generate_password_hash("pass"), "status": "approved",
        })
        client.post("/auth/login/vendor", json={"email": "vlogin@test.com", "password": "pass"})
        client.post("/auth/login/vendor", json={"email": "vlogin@test.com", "password": "pass"})

        v = vendors_collection.find_one({"email": "vlogin@test.com"})
        assert v["login_count"] == 2
        assert v["last_login"] is not None

    def test_subuser_login_increments_count(self, client):
        from unittest.mock import patch
        with patch("routes.subuser_routes.send_email", return_value=True):
            create_res = client.post("/subuser/subusers", json={
                "email": "sulogin@test.com", "parentType": "Admin", "role": "Support Staff",
                "permissions": {},
            })
        setup_token = create_res.get_json()["subuser"]["setupToken"]
        client.post("/subuser/setup", json={"token": setup_token, "password": "subuserpass123"})

        client.post("/subuser/login/subuser", json={"email": "sulogin@test.com", "password": "subuserpass123"})
        client.post("/subuser/login/subuser", json={"email": "sulogin@test.com", "password": "subuserpass123"})

        su = subusers_collection.find_one({"email": "sulogin@test.com"})
        assert su["login_count"] == 2
        assert su["last_login"] is not None

    def test_vendor_restriction_check_still_works_after_fix(self, client):
        """Regression check for the datetime-shadowing bug this exact
        change introduced and fixed — restricted vendors must still be
        blocked, not crash."""
        future_date = (datetime.utcnow() + timedelta(days=5)).strftime("%Y-%m-%d")
        vendors_collection.insert_one({
            "fullName": "V", "email": "restricted@test.com",
            "password": generate_password_hash("pass"), "status": "approved",
            "restricted_until": future_date,
        })
        res = client.post("/auth/login/vendor", json={"email": "restricted@test.com", "password": "pass"})
        assert res.status_code == 403
        assert "restricted" in res.get_json()["error"]
