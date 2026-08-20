# tests/test_guest_capture.py
from unittest.mock import patch

from database import guest_leads_collection


class TestGuestCaptureLead:
    @patch("routes.guest_routes.send_guest_invite_email", return_value=True)
    def test_valid_email_captured_and_invite_sent(self, mock_send, client):
        res = client.post("/guest/capture-lead", json={
            "email": "guest@test.com", "product_name": "Blue Shirt",
        })
        assert res.status_code == 200
        mock_send.assert_called_once()
        lead = guest_leads_collection.find_one({"email": "guest@test.com"})
        assert lead is not None
        assert lead["converted"] is False

    @patch("routes.guest_routes.send_guest_invite_email", return_value=True)
    def test_invalid_email_rejected_no_email_sent(self, mock_send, client):
        res = client.post("/guest/capture-lead", json={"email": "not-an-email"})
        assert res.status_code == 400
        mock_send.assert_not_called()

    @patch("routes.guest_routes.send_guest_invite_email", return_value=True)
    def test_register_after_invite_marks_lead_converted(self, mock_send, client):
        client.post("/guest/capture-lead", json={"email": "convert@test.com"})
        client.post("/auth/register", json={
            "name": "Converted Guest", "email": "convert@test.com", "password": "secret123",
        })
        lead = guest_leads_collection.find_one({"email": "convert@test.com"})
        assert lead["converted"] is True
