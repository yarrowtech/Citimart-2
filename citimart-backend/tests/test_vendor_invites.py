# tests/test_vendor_invites.py
from unittest.mock import patch

from werkzeug.security import generate_password_hash

from database import vendor_invites_collection, vendors_collection, users_collection


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
            "email": email, "parentType": "Marketing", "role": "Marketing Manager",
            "permissions": permissions,
        })
    setup_token = create_res.get_json()["subuser"]["setupToken"]
    client.post("/subuser/setup", json={"token": setup_token, "password": "subuserpass123"})
    login_res = client.post("/subuser/login/subuser", json={"email": email, "password": "subuserpass123"})
    return login_res.get_json()["token"]


class TestSendInvite:
    @patch("routes.vendor_invite_routes.send_email", return_value=True)
    def test_marketing_subuser_can_send_invite(self, mock_send, client):
        token = _create_active_subuser(client, "marketer@test.com", {"vendor_invites": True})
        res = client.post("/subuser/vendor-invites", json={
            "email": "prospect@test.com", "name": "Amit", "phone": "9999999999",
            "businessName": "Amit Crafts", "businessType": "Proprietor",
        }, headers=_auth_headers(token))
        assert res.status_code == 201
        assert "invite=" in res.get_json()["inviteLink"]
        mock_send.assert_called_once()

        invite = vendor_invites_collection.find_one({"email": "prospect@test.com"})
        assert invite["status"] == "sent"
        assert invite["businessName"] == "Amit Crafts"

    def test_subuser_without_permission_rejected(self, client):
        token = _create_active_subuser(client, "nomarket@test.com", {"vendor_invites": False})
        res = client.post("/subuser/vendor-invites", json={"email": "x@test.com"}, headers=_auth_headers(token))
        assert res.status_code == 403

    def test_send_requires_auth(self, client):
        res = client.post("/subuser/vendor-invites", json={"email": "x@test.com"})
        assert res.status_code == 401

    def test_email_is_required(self, client):
        token = _create_active_subuser(client, "marketer2@test.com", {"vendor_invites": True})
        res = client.post("/subuser/vendor-invites", json={"name": "No Email"}, headers=_auth_headers(token))
        assert res.status_code == 400


class TestListInvites:
    @patch("routes.vendor_invite_routes.send_email", return_value=True)
    def test_list_requires_permission(self, mock_send, client):
        token = _create_active_subuser(client, "marketer3@test.com", {"vendor_invites": True})
        client.post("/subuser/vendor-invites", json={"email": "a@test.com"}, headers=_auth_headers(token))

        res = client.get("/subuser/vendor-invites", headers=_auth_headers(token))
        assert res.status_code == 200
        assert len(res.get_json()["invites"]) == 1


class TestPublicInviteFetch:
    @patch("routes.vendor_invite_routes.send_email", return_value=True)
    def test_fetch_valid_invite_no_auth_needed(self, mock_send, client):
        token = _create_active_subuser(client, "marketer4@test.com", {"vendor_invites": True})
        send_res = client.post("/subuser/vendor-invites", json={
            "email": "prospect2@test.com", "name": "Priya", "businessName": "Priya Co",
        }, headers=_auth_headers(token))
        invite_token = send_res.get_json()["inviteLink"].split("invite=")[1]

        res = client.get(f"/vendor-invites/{invite_token}")
        assert res.status_code == 200
        data = res.get_json()
        assert data["name"] == "Priya"
        assert data["businessName"] == "Priya Co"
        assert data["email"] == "prospect2@test.com"

    def test_unknown_token_returns_404(self, client):
        res = client.get("/vendor-invites/does-not-exist")
        assert res.status_code == 404

    def test_expired_invite_returns_410(self, client):
        from datetime import datetime, timedelta
        vendor_invites_collection.insert_one({
            "email": "old@test.com", "token": "expired-token",
            "expiresAt": datetime.utcnow() - timedelta(days=1),
        })
        res = client.get("/vendor-invites/expired-token")
        assert res.status_code == 410


class TestInviteConvertsOnRegistration:
    @patch("routes.vendor_invite_routes.send_email", return_value=True)
    def test_registering_with_invite_token_marks_it_registered(self, mock_send, client):
        token = _create_active_subuser(client, "marketer5@test.com", {"vendor_invites": True})
        send_res = client.post("/subuser/vendor-invites", json={"email": "converted@test.com"},
                                headers=_auth_headers(token))
        invite_token = send_res.get_json()["inviteLink"].split("invite=")[1]

        reg_res = client.post("/auth/register-vendor", data={
            "fullName": "Converted Vendor", "email": "converted@test.com", "phone": "8888888888",
            "businessName": "Converted Biz", "businessType": "Proprietor",
            "businessAddress": "1 Main St", "termsAgreed": "true",
            "productCategories": "[]", "selectedSubcategories": "{}",
            "inviteToken": invite_token,
        })
        assert reg_res.status_code == 201

        invite = vendor_invites_collection.find_one({"token": invite_token})
        assert invite["status"] == "registered"
        assert "registeredAt" in invite

    def test_registering_without_invite_token_still_works(self, client):
        res = client.post("/auth/register-vendor", data={
            "fullName": "Direct Vendor", "email": "direct@test.com", "phone": "7777777777",
            "businessName": "Direct Biz", "businessType": "Proprietor",
            "businessAddress": "2 Main St", "termsAgreed": "true",
            "productCategories": "[]", "selectedSubcategories": "{}",
        })
        assert res.status_code == 201
        vendor = vendors_collection.find_one({"email": "direct@test.com"})
        assert "password" not in vendor


class TestInviteTemplate:
    def test_get_requires_admin_auth(self, client):
        res = client.get("/admin/settings/vendor-invite-template")
        assert res.status_code == 401

    def test_get_returns_default_when_unset(self, client):
        token = _admin_token(client)
        res = client.get("/admin/settings/vendor-invite-template", headers=_auth_headers(token))
        assert res.status_code == 200
        assert "{{name}}" in res.get_json()["body"]

    def test_update_and_new_invite_uses_it(self, client):
        token = _admin_token(client)
        put_res = client.put("/admin/settings/vendor-invite-template", json={
            "subject": "Custom Subject {{name}}",
            "body": "Custom body {{inviteLink}}",
        }, headers=_auth_headers(token))
        assert put_res.status_code == 200

        get_res = client.get("/admin/settings/vendor-invite-template", headers=_auth_headers(token))
        assert get_res.get_json()["subject"] == "Custom Subject {{name}}"

        from routes.vendor_invite_routes import get_invite_template
        assert get_invite_template()["subject"] == "Custom Subject {{name}}"

    def test_update_missing_fields_rejected(self, client):
        token = _admin_token(client)
        res = client.put("/admin/settings/vendor-invite-template", json={"subject": ""},
                          headers=_auth_headers(token))
        assert res.status_code == 400
