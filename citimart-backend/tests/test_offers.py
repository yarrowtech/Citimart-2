# tests/test_offers.py
from datetime import datetime, timedelta

from database import offers_collection


class TestGetOffers:
    def test_no_offers_returns_empty_list(self, client):
        res = client.get("/customer/offers")
        assert res.status_code == 200
        assert res.get_json() == []

    def test_active_offer_is_returned(self, client):
        offers_collection.insert_one({
            "title": "Summer Sale", "valid_till": datetime.utcnow() + timedelta(days=5),
        })
        res = client.get("/customer/offers")
        data = res.get_json()
        assert len(data) == 1
        assert data[0]["title"] == "Summer Sale"

    def test_expired_offer_is_excluded(self, client):
        offers_collection.insert_one({
            "title": "Old Sale", "valid_till": datetime.utcnow() - timedelta(days=5),
        })
        res = client.get("/customer/offers")
        assert res.get_json() == []
