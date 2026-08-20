# tests/test_auth.py
class TestRegister:
    def test_register_success(self, client):
        res = client.post("/auth/register", json={
            "name": "Jane Doe", "email": "jane@test.com", "password": "secret123",
        })
        assert res.status_code == 201
        assert res.get_json()["message"] == "Registration successful!"

    def test_register_missing_fields_returns_400_not_crash(self, client):
        """Regression test: this used to crash with an unhandled TypeError
        (None["email"]) when the request body was missing required fields."""
        res = client.post("/auth/register", json={"name": "No Email Or Password"})
        assert res.status_code == 400
        assert "error" in res.get_json()

    def test_register_no_body_returns_400_not_crash(self, client):
        """Regression test: request.json is None with no JSON body at all."""
        res = client.post("/auth/register")
        assert res.status_code == 400

    def test_register_duplicate_email_rejected(self, client):
        payload = {"name": "Jane", "email": "dupe@test.com", "password": "secret123"}
        first = client.post("/auth/register", json=payload)
        second = client.post("/auth/register", json=payload)
        assert first.status_code == 201
        assert second.status_code == 400
        assert "already exists" in second.get_json()["error"]


class TestLogin:
    def test_login_success(self, client):
        client.post("/auth/register", json={
            "name": "Login User", "email": "login@test.com", "password": "secret123",
        })
        res = client.post("/auth/login/customer", json={
            "email": "login@test.com", "password": "secret123",
        })
        data = res.get_json()
        assert res.status_code == 200
        assert data["token"]
        assert data["user"]["email"] == "login@test.com"

    def test_login_wrong_password_rejected(self, client):
        client.post("/auth/register", json={
            "name": "Login User", "email": "login2@test.com", "password": "secret123",
        })
        res = client.post("/auth/login/customer", json={
            "email": "login2@test.com", "password": "wrongpassword",
        })
        assert res.status_code == 401

    def test_login_nonexistent_user_rejected(self, client):
        res = client.post("/auth/login/customer", json={
            "email": "nobody@test.com", "password": "whatever",
        })
        assert res.status_code == 401

    def test_login_missing_fields_returns_400(self, client):
        res = client.post("/auth/login/customer", json={"email": "only-email@test.com"})
        assert res.status_code == 400
