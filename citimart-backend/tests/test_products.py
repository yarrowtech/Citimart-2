# tests/test_products.py
from database import products_collection


def _insert_product(**overrides):
    doc = {
        "name": "Test Shirt", "brand": "TestBrand", "category": "Clothing",
        "subcategory": "Men", "price": "999", "discount": "10",
        "images": [], "variants": [], "status": "approved",
    }
    doc.update(overrides)
    result = products_collection.insert_one(doc)
    return str(result.inserted_id)


class TestProductListing:
    def test_get_all_products_empty(self, client):
        res = client.get("/api/products")
        assert res.status_code == 200
        assert res.get_json()["products"] == []

    def test_get_all_products_returns_inserted(self, client):
        _insert_product()
        res = client.get("/api/products")
        assert res.status_code == 200
        assert len(res.get_json()["products"]) == 1


class TestProductDetail:
    def test_get_product_not_found(self, client):
        fake_id = "a" * 24  # valid 24-char hex format, just doesn't exist
        res = client.get(f"/api/products/{fake_id}")
        assert res.status_code == 404
