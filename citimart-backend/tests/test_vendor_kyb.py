# tests/test_vendor_kyb.py
from io import BytesIO
from unittest.mock import patch

from werkzeug.security import generate_password_hash

from database import vendors_collection, users_collection, subusers_collection


def _seed_vendor(email="vendor@test.com", password="vendorpass"):
    vid = str(vendors_collection.insert_one({
        "fullName": "Vendor One", "email": email,
        "password": generate_password_hash(password), "status": "approved",
    }).inserted_id)
    return vid


def _vendor_token(client, email="vendor@test.com", password="vendorpass"):
    _seed_vendor(email, password)
    res = client.post("/auth/login/vendor", json={"email": email, "password": password})
    return res.get_json()["token"]


def _admin_token(client, email="admin@test.com", password="adminpass"):
    users_collection.insert_one({
        "name": "Admin", "email": email,
        "password": generate_password_hash(password), "role": "admin",
    })
    res = client.post("/auth/login/admin", json={"email": email, "password": password})
    return res.get_json()["token"]


def _auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def _create_active_subuser(client, email, permissions=None):
    with patch("routes.subuser_routes.send_email", return_value=True):
        create_res = client.post("/subuser/subusers", json={
            "email": email, "parentType": "Admin", "role": "Support Staff",
            "permissions": permissions or {},
        })
    setup_token = create_res.get_json()["subuser"]["setupToken"]
    client.post("/subuser/setup", json={"token": setup_token, "password": "subuserpass123"})
    login_res = client.post("/subuser/login/subuser", json={"email": email, "password": "subuserpass123"})
    return login_res.get_json()["token"]


VALID_PAN = "ABCDE1234F"
VALID_GST = "27ABCDE1234F1Z5"


def _kyb_payload(**overrides):
    payload = {
        "panNumber": VALID_PAN, "gstNumber": VALID_GST, "businessRegNumber": "REG12345",
    }
    payload.update(overrides)
    return payload


def _kyb_files():
    return {
        "panDocument": (BytesIO(b"pan bytes"), "pan.jpg"),
        "gstDocument": (BytesIO(b"gst bytes"), "gst.jpg"),
        "businessRegDocument": (BytesIO(b"reg bytes"), "reg.jpg"),
    }


class TestSubmitKyb:
    @patch("routes.vendor_kyb_routes.cloudinary.uploader.upload")
    def test_submit_valid_kyb_succeeds(self, mock_upload, client):
        mock_upload.return_value = {"secure_url": "https://cloudinary.test/doc.jpg"}
        token = _vendor_token(client)

        res = client.post("/vendor/kyb/submit", data={**_kyb_payload(), **_kyb_files()},
                           headers=_auth_headers(token), content_type="multipart/form-data")
        assert res.status_code == 200

        status_res = client.get("/vendor/kyb/status", headers=_auth_headers(token))
        data = status_res.get_json()
        assert data["kybStatus"] == "pending_review"
        assert data["panNumber"] == VALID_PAN
        assert data["panDocumentUrl"] == "https://cloudinary.test/doc.jpg"

    def test_invalid_pan_format_rejected(self, client):
        token = _vendor_token(client)
        res = client.post("/vendor/kyb/submit", data={**_kyb_payload(panNumber="notapan"), **_kyb_files()},
                           headers=_auth_headers(token), content_type="multipart/form-data")
        assert res.status_code == 400
        assert "PAN" in res.get_json()["error"]

    def test_invalid_gst_format_rejected(self, client):
        token = _vendor_token(client)
        res = client.post("/vendor/kyb/submit", data={**_kyb_payload(gstNumber="notgst"), **_kyb_files()},
                           headers=_auth_headers(token), content_type="multipart/form-data")
        assert res.status_code == 400
        assert "GST" in res.get_json()["error"]

    def test_missing_document_rejected(self, client):
        token = _vendor_token(client)
        files = _kyb_files()
        del files["panDocument"]
        res = client.post("/vendor/kyb/submit", data={**_kyb_payload(), **files},
                           headers=_auth_headers(token), content_type="multipart/form-data")
        assert res.status_code == 400

    def test_status_before_submission_is_not_submitted(self, client):
        token = _vendor_token(client)
        res = client.get("/vendor/kyb/status", headers=_auth_headers(token))
        assert res.get_json()["kybStatus"] == "not_submitted"

    def test_submit_requires_vendor_role(self, client):
        client.post("/auth/register", json={"name": "C", "email": "c@test.com", "password": "custpass123"})
        token = client.post("/auth/login/customer", json={"email": "c@test.com", "password": "custpass123"}).get_json()["token"]
        res = client.post("/vendor/kyb/submit", data={**_kyb_payload(), **_kyb_files()},
                           headers=_auth_headers(token), content_type="multipart/form-data")
        assert res.status_code == 403


class TestAdminReview:
    @patch("routes.vendor_kyb_routes.cloudinary.uploader.upload")
    def test_admin_can_verify(self, mock_upload, client):
        mock_upload.return_value = {"secure_url": "https://cloudinary.test/doc.jpg"}
        vendor_token = _vendor_token(client)
        client.post("/vendor/kyb/submit", data={**_kyb_payload(), **_kyb_files()},
                    headers=_auth_headers(vendor_token), content_type="multipart/form-data")

        admin_token = _admin_token(client)
        pending_res = client.get("/admin/kyb/pending", headers=_auth_headers(admin_token))
        vendors = pending_res.get_json()["vendors"]
        assert len(vendors) == 1
        vendor_id = vendors[0]["_id"]

        review_res = client.put(f"/admin/kyb/{vendor_id}", json={"status": "verified"},
                                 headers=_auth_headers(admin_token))
        assert review_res.status_code == 200

        status_res = client.get("/vendor/kyb/status", headers=_auth_headers(vendor_token))
        assert status_res.get_json()["kybStatus"] == "verified"

    @patch("routes.vendor_kyb_routes.cloudinary.uploader.upload")
    def test_admin_can_reject_with_reason(self, mock_upload, client):
        mock_upload.return_value = {"secure_url": "https://cloudinary.test/doc.jpg"}
        vendor_token = _vendor_token(client)
        client.post("/vendor/kyb/submit", data={**_kyb_payload(), **_kyb_files()},
                    headers=_auth_headers(vendor_token), content_type="multipart/form-data")

        admin_token = _admin_token(client)
        vendor_id = client.get("/admin/kyb/pending", headers=_auth_headers(admin_token)).get_json()["vendors"][0]["_id"]
        client.put(f"/admin/kyb/{vendor_id}", json={"status": "rejected", "reason": "Blurry PAN photo"},
                   headers=_auth_headers(admin_token))

        status = client.get("/vendor/kyb/status", headers=_auth_headers(vendor_token)).get_json()
        assert status["kybStatus"] == "rejected"
        assert status["kybRejectionReason"] == "Blurry PAN photo"

    def test_review_requires_admin_auth(self, client):
        res = client.put("/admin/kyb/000000000000000000000000", json={"status": "verified"})
        assert res.status_code == 401

    def test_pending_list_requires_admin_auth(self, client):
        res = client.get("/admin/kyb/pending")
        assert res.status_code == 401


class TestSubuserReview:
    """The frontend's Vendor Review panel already calls these — confirms the
    endpoints actually exist and work (they were previously missing)."""

    @patch("routes.vendor_kyb_routes.cloudinary.uploader.upload")
    def test_subuser_can_list_and_verify(self, mock_upload, client):
        mock_upload.return_value = {"secure_url": "https://cloudinary.test/doc.jpg"}
        vendor_token = _vendor_token(client)
        client.post("/vendor/kyb/submit", data={**_kyb_payload(), **_kyb_files()},
                    headers=_auth_headers(vendor_token), content_type="multipart/form-data")

        subuser_token = _create_active_subuser(client, "reviewer@test.com")
        pending_res = client.get("/subuser/kyb/pending", headers=_auth_headers(subuser_token))
        assert pending_res.status_code == 200
        vendor_id = pending_res.get_json()["vendors"][0]["_id"]

        review_res = client.put(f"/subuser/kyb/{vendor_id}", json={"status": "verified"},
                                 headers=_auth_headers(subuser_token))
        assert review_res.status_code == 200

        status = client.get("/vendor/kyb/status", headers=_auth_headers(vendor_token)).get_json()
        assert status["kybStatus"] == "verified"

    def test_subuser_review_requires_auth(self, client):
        res = client.get("/subuser/kyb/pending")
        assert res.status_code == 401
