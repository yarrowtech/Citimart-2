# tests/test_vendor_logo.py
from io import BytesIO
from unittest.mock import patch

from werkzeug.security import generate_password_hash

from database import vendors_collection, users_collection


def _vendor_token(client, email="vendor@test.com", password="vendorpass"):
    vendors_collection.insert_one({
        "fullName": "Vendor One", "email": email,
        "password": generate_password_hash(password), "status": "approved",
        "businessName": "Logo Co",
    })
    res = client.post("/auth/login/vendor", json={"email": email, "password": password})
    return res.get_json()["token"]


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def _fake_file(name="logo.png", content_type="image/png"):
    return (BytesIO(b"fake-image-bytes"), name, content_type)


class TestUploadLogo:
    @patch("routes.vendor_integration_routes.cloudinary.uploader.upload")
    def test_upload_sets_profile_logo(self, mock_upload, client):
        mock_upload.return_value = {"secure_url": "https://cloudinary.test/logo.png"}
        token = _vendor_token(client)

        res = client.put(
            "/api/vendor/storefront/logo",
            data={"logo": _fake_file()},
            headers=_auth(token),
            content_type="multipart/form-data",
        )
        assert res.status_code == 200
        assert res.get_json()["logo"] == "https://cloudinary.test/logo.png"

        vendor = vendors_collection.find_one({"email": "vendor@test.com"})
        assert vendor["profile"]["logo"] == "https://cloudinary.test/logo.png"

    def test_requires_auth(self, client):
        res = client.put("/api/vendor/storefront/logo", data={"logo": _fake_file()}, content_type="multipart/form-data")
        assert res.status_code == 401

    def test_customer_token_rejected(self, client):
        users_collection.insert_one({
            "name": "Cust", "email": "cust@test.com",
            "password": generate_password_hash("custpass123"), "role": "customer",
        })
        token = client.post("/auth/login/customer", json={
            "email": "cust@test.com", "password": "custpass123",
        }).get_json()["token"]
        res = client.put("/api/vendor/storefront/logo", data={"logo": _fake_file()},
                         headers=_auth(token), content_type="multipart/form-data")
        assert res.status_code == 403

    def test_missing_file_rejected(self, client):
        token = _vendor_token(client)
        res = client.put("/api/vendor/storefront/logo", data={}, headers=_auth(token), content_type="multipart/form-data")
        assert res.status_code == 400

    def test_wrong_file_type_rejected(self, client):
        token = _vendor_token(client)
        res = client.put(
            "/api/vendor/storefront/logo",
            data={"logo": _fake_file(name="doc.pdf", content_type="application/pdf")},
            headers=_auth(token), content_type="multipart/form-data",
        )
        assert res.status_code == 400

    def test_oversized_file_rejected(self, client):
        token = _vendor_token(client)
        big = BytesIO(b"x" * (6 * 1024 * 1024))
        res = client.put(
            "/api/vendor/storefront/logo",
            data={"logo": (big, "logo.png", "image/png")},
            headers=_auth(token), content_type="multipart/form-data",
        )
        assert res.status_code == 400


class TestRemoveLogo:
    @patch("routes.vendor_integration_routes.cloudinary.uploader.upload")
    def test_delete_removes_logo(self, mock_upload, client):
        mock_upload.return_value = {"secure_url": "https://cloudinary.test/logo.png"}
        token = _vendor_token(client)
        client.put("/api/vendor/storefront/logo", data={"logo": _fake_file()},
                   headers=_auth(token), content_type="multipart/form-data")

        res = client.delete("/api/vendor/storefront/logo", headers=_auth(token))
        assert res.status_code == 200

        vendor = vendors_collection.find_one({"email": "vendor@test.com"})
        assert "logo" not in vendor.get("profile", {})


class TestStorefrontIncludesLogo:
    @patch("routes.vendor_integration_routes.cloudinary.uploader.upload")
    def test_get_storefront_returns_logo(self, mock_upload, client):
        mock_upload.return_value = {"secure_url": "https://cloudinary.test/logo.png"}
        token = _vendor_token(client)
        client.put("/api/vendor/storefront/logo", data={"logo": _fake_file()},
                   headers=_auth(token), content_type="multipart/form-data")

        res = client.get("/api/vendor/storefront", headers=_auth(token))
        assert res.get_json()["storefront"]["logo"] == "https://cloudinary.test/logo.png"

    def test_get_storefront_logo_empty_when_unset(self, client):
        token = _vendor_token(client)
        res = client.get("/api/vendor/storefront", headers=_auth(token))
        assert res.get_json()["storefront"]["logo"] == ""

    @patch("routes.vendor_integration_routes.cloudinary.uploader.upload")
    def test_public_storefront_by_slug_shows_logo(self, mock_upload, client):
        mock_upload.return_value = {"secure_url": "https://cloudinary.test/logo.png"}
        token = _vendor_token(client)
        client.put("/api/vendor/storefront/logo", data={"logo": _fake_file()},
                   headers=_auth(token), content_type="multipart/form-data")
        client.put("/api/vendor/storefront", json={
            "slug": "logo-co-store", "published": True, "name": "Logo Co",
        }, headers=_auth(token))

        res = client.get("/api/storefront/logo-co-store")
        assert res.status_code == 200
        assert res.get_json()["store"]["logo"] == "https://cloudinary.test/logo.png"
