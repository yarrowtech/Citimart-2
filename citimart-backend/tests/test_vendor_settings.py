# tests/test_vendor_settings.py
from werkzeug.security import generate_password_hash

from database import vendors_collection, users_collection


def _seed_vendor(email="vendor@test.com", password="vendorpass", **extra):
    doc = {
        "fullName": "Vendor One", "email": email,
        "password": generate_password_hash(password), "status": "approved",
        "businessName": "Original Biz", "phone": "9999999999",
        "businessType": "Individual", "businessAddress": "Old Address",
        "kybStatus": "not_submitted",
    }
    doc.update(extra)
    vid = str(vendors_collection.insert_one(doc).inserted_id)
    return vid


def _vendor_token(client, email="vendor@test.com", password="vendorpass", **extra):
    _seed_vendor(email, password, **extra)
    res = client.post("/auth/login/vendor", json={"email": email, "password": password})
    return res.get_json()["token"]


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


class TestVendorProfile:
    def test_get_returns_real_vendor_fields(self, client):
        token = _vendor_token(client)
        res = client.get("/api/vendor/settings/profile", headers=_auth(token))
        assert res.status_code == 200
        data = res.get_json()
        assert data["businessName"] == "Original Biz"
        assert data["phone"] == "9999999999"
        assert data["kybStatus"] == "not_submitted"

    def test_requires_auth(self, client):
        res = client.get("/api/vendor/settings/profile")
        assert res.status_code == 401

    def test_put_updates_real_top_level_fields(self, client):
        token = _vendor_token(client)
        res = client.put("/api/vendor/settings/profile", json={
            "businessName": "New Biz Name", "phone": "8888888888",
        }, headers=_auth(token))
        assert res.status_code == 200

        vendor = vendors_collection.find_one({"email": "vendor@test.com"})
        assert vendor["businessName"] == "New Biz Name"
        assert vendor["phone"] == "8888888888"
        # Untouched fields stay as they were.
        assert vendor["businessType"] == "Individual"

    def test_put_rejects_empty_value(self, client):
        token = _vendor_token(client)
        res = client.put("/api/vendor/settings/profile", json={"businessName": "   "}, headers=_auth(token))
        assert res.status_code == 400

    def test_put_rejects_empty_payload(self, client):
        token = _vendor_token(client)
        res = client.put("/api/vendor/settings/profile", json={}, headers=_auth(token))
        assert res.status_code == 400

    def test_put_ignores_unknown_fields(self, client):
        token = _vendor_token(client)
        res = client.put("/api/vendor/settings/profile", json={
            "businessName": "Valid Update", "role": "admin", "email": "hacked@test.com",
        }, headers=_auth(token))
        assert res.status_code == 200
        vendor = vendors_collection.find_one({"email": "vendor@test.com"})
        assert vendor["email"] == "vendor@test.com"
        assert "role" not in vendor


class TestVendorPassword:
    def test_change_password_updates_real_login_credential(self, client):
        token = _vendor_token(client)
        res = client.put("/api/vendor/settings/password", json={
            "currentPassword": "vendorpass", "newPassword": "newpassword123",
        }, headers=_auth(token))
        assert res.status_code == 200

        login = client.post("/auth/login/vendor", json={
            "email": "vendor@test.com", "password": "newpassword123",
        })
        assert login.status_code == 200
        old_login = client.post("/auth/login/vendor", json={
            "email": "vendor@test.com", "password": "vendorpass",
        })
        assert old_login.status_code == 401

    def test_wrong_current_password_rejected(self, client):
        token = _vendor_token(client)
        res = client.put("/api/vendor/settings/password", json={
            "currentPassword": "wrongpass", "newPassword": "newpassword123",
        }, headers=_auth(token))
        assert res.status_code == 401

    def test_short_new_password_rejected(self, client):
        token = _vendor_token(client)
        res = client.put("/api/vendor/settings/password", json={
            "currentPassword": "vendorpass", "newPassword": "short",
        }, headers=_auth(token))
        assert res.status_code == 400

    def test_missing_fields_rejected(self, client):
        token = _vendor_token(client)
        res = client.put("/api/vendor/settings/password", json={}, headers=_auth(token))
        assert res.status_code == 400


class TestVendorPayments:
    def test_get_returns_empty_when_unset(self, client):
        token = _vendor_token(client)
        res = client.get("/api/vendor/settings/payments", headers=_auth(token))
        assert res.status_code == 200
        assert res.get_json() == {}

    def test_put_then_get_roundtrips(self, client):
        token = _vendor_token(client)
        res = client.put("/api/vendor/settings/payments", json={
            "holderName": "Vendor One", "bankName": "Test Bank",
            "accountNumber": "123456789", "ifsc": "TEST0001", "upi": "vendor@upi",
        }, headers=_auth(token))
        assert res.status_code == 200

        data = client.get("/api/vendor/settings/payments", headers=_auth(token)).get_json()
        assert data["bankName"] == "Test Bank"
        assert data["upi"] == "vendor@upi"

    def test_payments_isolated_per_vendor(self, client):
        token_a = _vendor_token(client, email="a@test.com")
        token_b = _vendor_token(client, email="b@test.com")
        client.put("/api/vendor/settings/payments", json={"bankName": "Bank A"}, headers=_auth(token_a))
        data_b = client.get("/api/vendor/settings/payments", headers=_auth(token_b)).get_json()
        assert data_b.get("bankName") != "Bank A"


class TestNonVendorAccess:
    def test_customer_token_rejected(self, client):
        users_collection.insert_one({
            "name": "Cust", "email": "cust@test.com",
            "password": generate_password_hash("custpass123"), "role": "customer",
        })
        token = client.post("/auth/login/customer", json={
            "email": "cust@test.com", "password": "custpass123",
        }).get_json()["token"]
        res = client.get("/api/vendor/settings/profile", headers=_auth(token))
        assert res.status_code == 403
