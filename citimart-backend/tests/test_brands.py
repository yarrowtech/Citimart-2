# tests/test_brands.py
from database import products_collection


class TestBrandsEndpoint:
    def test_returns_distinct_sorted_brands(self, client):
        products_collection.insert_many([
            {"name": "A", "brand": "Nike"},
            {"name": "B", "brand": "Adidas"},
            {"name": "C", "brand": "nike"},  # different case, should not dedupe against "Nike"
            {"name": "D", "brand": "Nike"},  # exact duplicate
        ])
        res = client.get("/api/brands")
        assert res.status_code == 200
        data = res.get_json()
        assert data["brands"] == sorted(["Nike", "Adidas", "nike"])

    def test_blank_and_missing_brand_excluded(self, client):
        products_collection.insert_many([
            {"name": "A", "brand": "  "},
            {"name": "B"},
            {"name": "C", "brand": None},
            {"name": "D", "brand": "Puma"},
        ])
        res = client.get("/api/brands")
        assert res.get_json()["brands"] == ["Puma"]

    def test_empty_when_no_products(self, client):
        res = client.get("/api/brands")
        assert res.get_json()["brands"] == []

    def test_whitespace_trimmed(self, client):
        products_collection.insert_one({"name": "A", "brand": "  Zara  "})
        res = client.get("/api/brands")
        assert res.get_json()["brands"] == ["Zara"]
