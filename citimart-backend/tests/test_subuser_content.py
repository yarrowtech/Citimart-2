# tests/test_subuser_content.py
from unittest.mock import patch, MagicMock

from database import faqs_collection, content_snippets_collection, media_library_collection


def _create_active_subuser(client, email="content-sub@test.com", permissions=None):
    with patch("routes.subuser_routes.send_email", return_value=True):
        create_res = client.post("/subuser/subusers", json={
            "email": email, "parentType": "Admin", "role": "Support Staff",
            "permissions": permissions or {},
        })
    setup_token = create_res.get_json()["subuser"]["setupToken"]
    client.post("/subuser/setup", json={"token": setup_token, "password": "subuserpass123"})
    login_res = client.post("/subuser/login/subuser", json={"email": email, "password": "subuserpass123"})
    return login_res.get_json()["token"]


def _auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


class TestSubuserProfile:
    def test_me_returns_permissions(self, client):
        token = _create_active_subuser(client, permissions={"faq": True})
        res = client.get("/subuser/me", headers=_auth_headers(token))
        data = res.get_json()
        assert res.status_code == 200
        assert data["permissions"]["faq"] is True
        assert "passwordHash" not in data  # never leak the hash

    def test_me_without_token_returns_401(self, client):
        res = client.get("/subuser/me")
        assert res.status_code == 401


class TestFaqCrud:
    def test_faq_crud_full_cycle(self, client):
        token = _create_active_subuser(client, "faq-sub@test.com", {"faq": True})
        headers = _auth_headers(token)

        create_res = client.post("/subuser/faq", json={
            "question": "Do you ship internationally?", "answer": "Not yet.",
        }, headers=headers)
        assert create_res.status_code == 201
        faq_id = create_res.get_json()["faq"]["_id"]

        list_res = client.get("/subuser/faq", headers=headers)
        assert len(list_res.get_json()["faqs"]) == 1

        update_res = client.put(f"/subuser/faq/{faq_id}", json={"answer": "Yes, to select countries."}, headers=headers)
        assert update_res.status_code == 200

        delete_res = client.delete(f"/subuser/faq/{faq_id}", headers=headers)
        assert delete_res.status_code == 200
        assert faqs_collection.count_documents({}) == 0

    def test_faq_without_permission_rejected(self, client):
        token = _create_active_subuser(client, "no-faq-sub@test.com", {"faq": False, "content": True})
        res = client.get("/subuser/faq", headers=_auth_headers(token))
        assert res.status_code == 403

    def test_faq_missing_fields_rejected(self, client):
        token = _create_active_subuser(client, "faq-sub2@test.com", {"faq": True})
        res = client.post("/subuser/faq", json={"question": "Only a question"}, headers=_auth_headers(token))
        assert res.status_code == 400

    def test_public_faq_endpoint_shows_published_faqs(self, client):
        token = _create_active_subuser(client, "faq-sub3@test.com", {"faq": True})
        client.post("/subuser/faq", json={
            "question": "Published Q", "answer": "Published A", "status": "published",
        }, headers=_auth_headers(token))
        client.post("/subuser/faq", json={
            "question": "Draft Q", "answer": "Draft A", "status": "draft",
        }, headers=_auth_headers(token))

        res = client.get("/faq")
        faqs = res.get_json()["faqs"]
        assert len(faqs) == 1
        assert faqs[0]["question"] == "Published Q"


class TestContentCrud:
    def test_content_crud_full_cycle(self, client):
        token = _create_active_subuser(client, "content-sub2@test.com", {"content": True})
        headers = _auth_headers(token)

        create_res = client.post("/subuser/content", json={
            "title": "Homepage Banner Text", "body": "Big summer sale!", "page": "home",
        }, headers=headers)
        assert create_res.status_code == 201
        content_id = create_res.get_json()["content"]["_id"]

        list_res = client.get("/subuser/content", headers=headers)
        assert len(list_res.get_json()["content"]) == 1

        update_res = client.put(f"/subuser/content/{content_id}", json={"status": "published"}, headers=headers)
        assert update_res.status_code == 200

        delete_res = client.delete(f"/subuser/content/{content_id}", headers=headers)
        assert delete_res.status_code == 200
        assert content_snippets_collection.count_documents({}) == 0

    def test_content_without_permission_rejected(self, client):
        token = _create_active_subuser(client, "no-content-sub@test.com", {"faq": True})
        res = client.post("/subuser/content", json={"title": "x", "body": "y"}, headers=_auth_headers(token))
        assert res.status_code == 403


class TestMediaCrud:
    @patch("routes.subuser_content_routes.cloudinary.uploader.upload")
    def test_media_upload_and_list(self, mock_upload, client):
        mock_upload.return_value = {"secure_url": "https://cloudinary.test/img.jpg"}
        token = _create_active_subuser(client, "media-sub@test.com", {"media": True})
        headers = _auth_headers(token)

        from io import BytesIO
        data = {"file": (BytesIO(b"fake image bytes"), "banner.jpg")}
        upload_res = client.post("/subuser/media", data=data, headers=headers, content_type="multipart/form-data")
        assert upload_res.status_code == 201
        media_id = upload_res.get_json()["media"]["_id"]
        assert upload_res.get_json()["media"]["url"] == "https://cloudinary.test/img.jpg"

        list_res = client.get("/subuser/media", headers=headers)
        assert len(list_res.get_json()["media"]) == 1

        delete_res = client.delete(f"/subuser/media/{media_id}", headers=headers)
        assert delete_res.status_code == 200
        assert media_library_collection.count_documents({}) == 0

    def test_media_upload_without_file_rejected(self, client):
        token = _create_active_subuser(client, "media-sub2@test.com", {"media": True})
        res = client.post("/subuser/media", data={}, headers=_auth_headers(token), content_type="multipart/form-data")
        assert res.status_code == 400

    def test_media_without_permission_rejected(self, client):
        token = _create_active_subuser(client, "no-media-sub@test.com", {"faq": True})
        res = client.get("/subuser/media", headers=_auth_headers(token))
        assert res.status_code == 403


class TestSegmentationNowRequiresAuth:
    def test_segment_requests_without_token_returns_401(self, client):
        res = client.get("/subuser/segment-requests")
        assert res.status_code == 401

    def test_segment_requests_without_permission_returns_403(self, client):
        token = _create_active_subuser(client, "seg-sub@test.com", {"segmentation": False})
        res = client.get("/subuser/segment-requests", headers=_auth_headers(token))
        assert res.status_code == 403

    def test_segment_requests_with_permission_succeeds(self, client):
        token = _create_active_subuser(client, "seg-sub2@test.com", {"segmentation": True})
        res = client.get("/subuser/segment-requests", headers=_auth_headers(token))
        assert res.status_code == 200


class TestVendorsNowRequiresAuth:
    def test_vendors_list_without_token_returns_401(self, client):
        res = client.get("/subuser/vendors")
        assert res.status_code == 401

    def test_vendors_list_with_any_active_subuser_succeeds(self, client):
        token = _create_active_subuser(client, "vendor-review-sub@test.com", {})
        res = client.get("/subuser/vendors", headers=_auth_headers(token))
        assert res.status_code == 200
