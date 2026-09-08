# tests/test_recommend.py
# The trained model artifact isn't part of the isolated test DB (mongomock
# has no products matching the real trained IDs, and on a fresh clone/CI
# machine the .joblib file itself may not exist at all) — so what's actually
# verifiable here is that the endpoint degrades gracefully rather than
# erroring, in every case.
from database import products_collection


class TestRecommend:
    def test_unknown_product_returns_empty_list(self, client):
        res = client.get("/api/recommend/000000000000000000000000")
        assert res.status_code == 200
        assert res.get_json() == {"recommendations": []}

    def test_real_product_with_no_similarity_data_returns_empty_list(self, client):
        product_id = str(products_collection.insert_one({
            "name": "Isolated Test Product", "price": 100, "status": "approved", "images": [],
        }).inserted_id)
        res = client.get(f"/api/recommend/{product_id}")
        assert res.status_code == 200
        assert res.get_json()["recommendations"] == []

    def test_malformed_product_id_does_not_crash(self, client):
        res = client.get("/api/recommend/not-a-valid-object-id")
        assert res.status_code == 200
        assert res.get_json() == {"recommendations": []}
