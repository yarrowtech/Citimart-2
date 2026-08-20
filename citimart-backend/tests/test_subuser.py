# tests/test_subuser.py
from unittest.mock import patch

from database import subusers_collection


class TestCreateSubuser:
    @patch("routes.subuser_routes.send_email", return_value=True)
    def test_create_subuser_success(self, mock_send, client):
        res = client.post("/subuser/subusers", json={
            "email": "sub1@test.com", "parentType": "Admin", "role": "Support Staff",
            "permissions": {"complaints": True},
        })
        assert res.status_code == 201
        mock_send.assert_called_once()

        subuser = subusers_collection.find_one({"email": "sub1@test.com"})
        assert subuser["status"] == "pending"
        assert subuser["permissions"]["complaints"] is True
        assert subuser["permissions"]["media"] is False  # unspecified permissions default False

    def test_create_subuser_invalid_parent_type_rejected(self, client):
        res = client.post("/subuser/subusers", json={
            "email": "sub2@test.com", "parentType": "NotARealType", "role": "Viewer",
        })
        assert res.status_code == 400

    def test_create_subuser_customer_type_requires_parent_id(self, client):
        res = client.post("/subuser/subusers", json={
            "email": "sub3@test.com", "parentType": "Customer", "role": "Viewer",
        })
        assert res.status_code == 400


class TestSubuserSetupAndLogin:
    @patch("routes.subuser_routes.send_email", return_value=True)
    def test_full_setup_and_login_flow(self, mock_send, client):
        create_res = client.post("/subuser/subusers", json={
            "email": "setupflow@test.com", "parentType": "HeadOffice", "role": "Moderator",
        })
        setup_token = create_res.get_json()["subuser"]["setupToken"]

        setup_res = client.post("/subuser/setup", json={
            "token": setup_token, "password": "subuserpass123",
        })
        assert setup_res.status_code == 200

        subuser = subusers_collection.find_one({"email": "setupflow@test.com"})
        assert subuser["status"] == "active"

        login_res = client.post("/subuser/login/subuser", json={
            "email": "setupflow@test.com", "password": "subuserpass123",
        })
        assert login_res.status_code == 200
        assert login_res.get_json()["token"]

    def test_setup_with_invalid_token_rejected(self, client):
        res = client.post("/subuser/setup", json={"token": "not-a-real-token", "password": "whatever"})
        assert res.status_code == 400

    def test_login_before_setup_rejected(self, client):
        res = client.post("/subuser/login/subuser", json={
            "email": "never-set-up@test.com", "password": "whatever",
        })
        assert res.status_code == 401

    @patch("routes.subuser_routes.send_email", return_value=True)
    def test_login_wrong_password_rejected(self, mock_send, client):
        create_res = client.post("/subuser/subusers", json={
            "email": "wrongpw@test.com", "parentType": "Marketing", "role": "Marketing Manager",
        })
        setup_token = create_res.get_json()["subuser"]["setupToken"]
        client.post("/subuser/setup", json={"token": setup_token, "password": "correctpass"})

        res = client.post("/subuser/login/subuser", json={
            "email": "wrongpw@test.com", "password": "wrongpass",
        })
        assert res.status_code == 401
