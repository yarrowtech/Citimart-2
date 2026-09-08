# tests/test_pricing_advisor.py
from werkzeug.security import generate_password_hash

from database import (
    products_collection, vendors_collection, orders_collection,
    cart_collection, wishlist_collection, users_collection,
)


def _seed_vendor(email="vendor@test.com", password="vendorpass"):
    doc = {
        "fullName": "Vendor One", "email": email,
        "password": generate_password_hash(password), "status": "approved",
    }
    return str(vendors_collection.insert_one(doc).inserted_id)


def _vendor_token(client, email="vendor@test.com", password="vendorpass"):
    _seed_vendor(email, password)
    res = client.post("/auth/login/vendor", json={"email": email, "password": password})
    return res.get_json()["token"]


def _auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def _seed_customer_token(client, email="cust@test.com"):
    client.post("/auth/register", json={"name": "Cust", "email": email, "password": "custpass123"})
    res = client.post("/auth/login/customer", json={"email": email, "password": "custpass123"})
    return res.get_json()["token"]


class TestAccess:
    def test_requires_auth(self, client):
        res = client.get("/vendor/pricing-suggestions")
        assert res.status_code == 401

    def test_customer_cannot_access(self, client):
        token = _seed_customer_token(client)
        res = client.get("/vendor/pricing-suggestions", headers=_auth_headers(token))
        assert res.status_code == 403


class TestSuggestions:
    def test_product_with_no_activity_returns_insufficient_data(self, client):
        vendor_id = "will-be-set"
        vendor_id = str(vendors_collection.insert_one({
            "fullName": "V", "email": "v2@test.com",
            "password": generate_password_hash("pass"), "status": "approved",
        }).inserted_id)
        products_collection.insert_one({
            "name": "Quiet Product", "vendor_id": vendor_id, "price": "500",
            "status": "approved", "variants": [{"stock": 10}],
        })
        token = client.post("/auth/login/vendor", json={"email": "v2@test.com", "password": "pass"}).get_json()["token"]

        res = client.get("/vendor/pricing-suggestions", headers=_auth_headers(token))
        assert res.status_code == 200
        suggestions = res.get_json()["suggestions"]
        assert len(suggestions) == 1
        assert suggestions[0]["suggestion"] == "insufficient_data"
        assert suggestions[0]["suggested_price"] is None

    def test_high_demand_low_stock_suggests_price_increase(self, client):
        vendor_id = str(vendors_collection.insert_one({
            "fullName": "V", "email": "v3@test.com",
            "password": generate_password_hash("pass"), "status": "approved",
        }).inserted_id)
        pid = str(products_collection.insert_one({
            "name": "Hot Product", "vendor_id": vendor_id, "price": "1000",
            "status": "approved", "variants": [{"stock": 1}],
        }).inserted_id)
        # 3 orders * weight 3 = 9 demand signal against stock of 1 -> ratio 9 -> increase
        for i in range(3):
            orders_collection.insert_one({
                "customer_id": f"c{i}", "order_items": [{"product_id": pid}], "final_amount": 1000,
            })
        token = client.post("/auth/login/vendor", json={"email": "v3@test.com", "password": "pass"}).get_json()["token"]

        res = client.get("/vendor/pricing-suggestions", headers=_auth_headers(token))
        row = res.get_json()["suggestions"][0]
        assert row["suggestion"] == "increase"
        assert row["adjustment_pct"] == 15
        assert row["suggested_price"] == 1150.0

    def test_low_demand_high_stock_suggests_discount(self, client):
        vendor_id = str(vendors_collection.insert_one({
            "fullName": "V", "email": "v4@test.com",
            "password": generate_password_hash("pass"), "status": "approved",
        }).inserted_id)
        pid = str(products_collection.insert_one({
            "name": "Stale Product", "vendor_id": vendor_id, "price": "1000",
            "status": "approved", "variants": [{"stock": 100}],
        }).inserted_id)
        wishlist_collection.insert_one({"customer_id": "c1", "items": [{"product_id": pid}]})
        token = client.post("/auth/login/vendor", json={"email": "v4@test.com", "password": "pass"}).get_json()["token"]

        res = client.get("/vendor/pricing-suggestions", headers=_auth_headers(token))
        row = res.get_json()["suggestions"][0]
        assert row["suggestion"] == "decrease"
        assert row["adjustment_pct"] == -10

    def test_only_shows_own_products(self, client):
        v1 = str(vendors_collection.insert_one({
            "fullName": "V1", "email": "v5@test.com",
            "password": generate_password_hash("pass"), "status": "approved",
        }).inserted_id)
        v2 = str(vendors_collection.insert_one({
            "fullName": "V2", "email": "v6@test.com",
            "password": generate_password_hash("pass"), "status": "approved",
        }).inserted_id)
        products_collection.insert_one({"name": "Mine", "vendor_id": v1, "price": "10", "status": "approved", "variants": []})
        products_collection.insert_one({"name": "Not Mine", "vendor_id": v2, "price": "10", "status": "approved", "variants": []})

        token = client.post("/auth/login/vendor", json={"email": "v5@test.com", "password": "pass"}).get_json()["token"]
        res = client.get("/vendor/pricing-suggestions", headers=_auth_headers(token))
        names = [s["name"] for s in res.get_json()["suggestions"]]
        assert names == ["Mine"]
