# tests/test_admin_vendor_auth.py
from datetime import datetime, timedelta
from unittest.mock import patch

from werkzeug.security import generate_password_hash

from database import users_collection, vendors_collection


def _seed_admin(email="admin@test.com", password="adminpass"):
    users_collection.insert_one({
        "name": "Admin User", "email": email,
        "password": generate_password_hash(password), "role": "admin",
    })


def _seed_vendor(email="vendor@test.com", password="vendorpass", **overrides):
    doc = {
        "fullName": "Vendor User", "email": email,
        "password": generate_password_hash(password), "status": "approved",
    }
    doc.update(overrides)
    vendors_collection.insert_one(doc)


class TestAdminLogin:
    def test_admin_login_success(self, client):
        _seed_admin()
        res = client.post("/auth/login/admin", json={"email": "admin@test.com", "password": "adminpass"})
        data = res.get_json()
        assert res.status_code == 200
        assert data["token"]
        assert data["user"]["role"] == "admin"

    def test_admin_login_wrong_password(self, client):
        _seed_admin()
        res = client.post("/auth/login/admin", json={"email": "admin@test.com", "password": "wrong"})
        assert res.status_code == 401

    def test_customer_cannot_log_in_as_admin(self, client):
        # a plain customer account (role=customer) trying the admin endpoint
        client.post("/auth/register", json={
            "name": "Just A Customer", "email": "cust@test.com", "password": "custpass",
        })
        res = client.post("/auth/login/admin", json={"email": "cust@test.com", "password": "custpass"})
        assert res.status_code == 401


class TestVendorLogin:
    def test_vendor_login_success(self, client):
        _seed_vendor()
        res = client.post("/auth/login/vendor", json={"email": "vendor@test.com", "password": "vendorpass"})
        data = res.get_json()
        assert res.status_code == 200
        assert data["user"]["role"] == "vendor"

    def test_unapproved_vendor_cannot_log_in(self, client):
        _seed_vendor(email="pending@test.com", status="pending")
        res = client.post("/auth/login/vendor", json={"email": "pending@test.com", "password": "vendorpass"})
        assert res.status_code == 401

    def test_restricted_vendor_rejected(self, client):
        future_date = (datetime.utcnow() + timedelta(days=5)).strftime("%Y-%m-%d")
        _seed_vendor(email="restricted@test.com", restricted_until=future_date)
        res = client.post("/auth/login/vendor", json={"email": "restricted@test.com", "password": "vendorpass"})
        assert res.status_code == 403
        assert "restricted" in res.get_json()["error"]


class TestPasswordResetFlow:
    @patch("routes.auth_routes.send_email", return_value=True)
    def test_full_reset_flow(self, mock_send, client):
        client.post("/auth/register", json={
            "name": "Reset Me", "email": "reset@test.com", "password": "oldpassword",
        })

        # 1. Request OTP
        forgot_res = client.post("/auth/forgot-password", json={"email": "reset@test.com"})
        assert forgot_res.status_code == 200
        mock_send.assert_called_once()
        sent_otp = mock_send.call_args[0][2].split(": ")[1].split("\n")[0]

        # 2. Verify OTP
        verify_res = client.post("/auth/verify-otp", json={"email": "reset@test.com", "otp": sent_otp})
        assert verify_res.status_code == 200
        reset_token = verify_res.get_json()["reset_token"]

        # 3. Set new password
        set_res = client.post("/auth/set-password", json={"token": reset_token, "password": "newpassword"})
        assert set_res.status_code == 200

        # 4. Old password no longer works, new one does
        old_login = client.post("/auth/login/customer", json={"email": "reset@test.com", "password": "oldpassword"})
        assert old_login.status_code == 401
        new_login = client.post("/auth/login/customer", json={"email": "reset@test.com", "password": "newpassword"})
        assert new_login.status_code == 200

    @patch("routes.auth_routes.send_email", return_value=True)
    def test_wrong_otp_rejected(self, mock_send, client):
        client.post("/auth/register", json={
            "name": "Reset Me", "email": "wrongotp@test.com", "password": "oldpassword",
        })
        client.post("/auth/forgot-password", json={"email": "wrongotp@test.com"})
        res = client.post("/auth/verify-otp", json={"email": "wrongotp@test.com", "otp": "000000"})
        assert res.status_code == 400

    def test_forgot_password_unknown_email_returns_404(self, client):
        res = client.post("/auth/forgot-password", json={"email": "nobody@test.com"})
        assert res.status_code == 404

    def test_set_password_invalid_token_returns_404(self, client):
        res = client.post("/auth/set-password", json={"token": "bogus-token", "password": "whatever"})
        assert res.status_code == 404
