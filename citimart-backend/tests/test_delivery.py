# tests/test_delivery.py
class TestDeliveryCheck:
    def test_serviceable_metro_pincode(self, client):
        res = client.get("/api/delivery/check?pincode=400001")
        data = res.get_json()
        assert res.status_code == 200
        assert data["serviceable"] is True
        assert data["city"] == "Mumbai"

    def test_non_serviceable_tier2_pincode(self, client):
        res = client.get("/api/delivery/check?pincode=440001")  # Nagpur
        data = res.get_json()
        assert res.status_code == 200
        assert data["serviceable"] is False
        assert data["city"] is None

    def test_invalid_pincode_format_rejected(self, client):
        for bad in ["12345", "abcdef", "0400001"]:
            res = client.get(f"/api/delivery/check?pincode={bad}")
            assert res.status_code == 400, f"expected 400 for {bad!r}"
