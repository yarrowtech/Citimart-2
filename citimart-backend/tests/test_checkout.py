# tests/test_checkout.py
from database import products_collection, orders_collection


def _insert_product(**overrides):
    doc = {
        "name": "Checkout Item", "brand": "TestBrand", "category": "Clothing",
        "subcategory": "Men", "price": "600", "discount": "0",
        "images": [], "variants": [
            {"size": "M", "color": "Red", "stock": {"$numberInt": "10"}},
        ], "status": "approved",
    }
    doc.update(overrides)
    result = products_collection.insert_one(doc)
    return str(result.inserted_id)


def _auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


class TestCheckout:
    def test_checkout_empty_cart_rejected(self, client, registered_customer):
        customer_id, token = registered_customer
        res = client.post("/customer/checkout", json={"customer_id": customer_id}, headers=_auth_headers(token))
        assert res.status_code == 400
        assert res.get_json()["message"] == "No items to checkout"

    def test_checkout_without_token_returns_401(self, client, registered_customer):
        customer_id, _ = registered_customer
        res = client.post("/customer/checkout", json={"customer_id": customer_id})
        assert res.status_code == 401

    def test_successful_checkout_from_cart(self, client, registered_customer):
        customer_id, token = registered_customer
        product_id = _insert_product(price="600")

        client.post("/customer/cart/add", json={
            "customer_id": customer_id, "product_id": product_id,
            "size": "M", "color": "Red", "quantity": 2,
        }, headers=_auth_headers(token))

        res = client.post("/customer/checkout", json={
            "customer_id": customer_id, "phone": "9999999999", "address": "Test address",
        }, headers=_auth_headers(token))

        data = res.get_json()
        assert res.status_code == 200
        assert data["message"] == "Order placed successfully"
        # subtotal 600*2=1200 (>500 so free delivery), no discount, no gift wrap
        assert data["total"] == 1200
        assert data["delivery_fee"] == 0
        assert data["gift_wrap_fee"] == 0
        assert data["final_amount"] == 1200
        assert data["order_id"]

    def test_checkout_under_500_adds_delivery_fee(self, client, registered_customer):
        customer_id, token = registered_customer
        product_id = _insert_product(price="200")
        client.post("/customer/cart/add", json={
            "customer_id": customer_id, "product_id": product_id,
            "size": "M", "color": "Red", "quantity": 1,
        }, headers=_auth_headers(token))

        res = client.post("/customer/checkout", json={"customer_id": customer_id}, headers=_auth_headers(token))
        data = res.get_json()
        assert data["total"] == 200
        assert data["delivery_fee"] == 50
        assert data["final_amount"] == 250

    def test_checkout_creates_order_record(self, client, registered_customer):
        customer_id, token = registered_customer
        product_id = _insert_product()
        client.post("/customer/cart/add", json={
            "customer_id": customer_id, "product_id": product_id,
            "size": "M", "color": "Red", "quantity": 1,
        }, headers=_auth_headers(token))
        client.post("/customer/checkout", json={"customer_id": customer_id}, headers=_auth_headers(token))

        order = orders_collection.find_one({"customer_id": customer_id})
        assert order is not None
        assert order["status"] == "Placed"
        assert len(order["order_items"]) == 1

    def test_checkout_clears_cart_afterward(self, client, registered_customer):
        customer_id, token = registered_customer
        product_id = _insert_product()
        client.post("/customer/cart/add", json={
            "customer_id": customer_id, "product_id": product_id,
            "size": "M", "color": "Red", "quantity": 1,
        }, headers=_auth_headers(token))
        client.post("/customer/checkout", json={"customer_id": customer_id}, headers=_auth_headers(token))

        cart_res = client.get(f"/customer/cart/{customer_id}", headers=_auth_headers(token))
        assert cart_res.get_json()["items"] == []

    def test_checkout_reduces_variant_stock(self, client, registered_customer):
        customer_id, token = registered_customer
        product_id = _insert_product(variants=[
            {"size": "M", "color": "Red", "stock": {"$numberInt": "10"}},
        ])
        client.post("/customer/cart/add", json={
            "customer_id": customer_id, "product_id": product_id,
            "size": "M", "color": "Red", "quantity": 3,
        }, headers=_auth_headers(token))
        client.post("/customer/checkout", json={"customer_id": customer_id}, headers=_auth_headers(token))

        from bson import ObjectId
        product = products_collection.find_one({"_id": ObjectId(product_id)})
        variant = product["variants"][0]
        assert int(variant["stock"]["$numberInt"]) == 7  # 10 - 3

    def test_checkout_with_gift_adds_gift_wrap_fee(self, client, registered_customer):
        customer_id, token = registered_customer
        product_id = _insert_product(price="600")
        client.post("/customer/cart/add", json={
            "customer_id": customer_id, "product_id": product_id,
            "size": "M", "color": "Red", "quantity": 1,
        }, headers=_auth_headers(token))

        res = client.post("/customer/checkout", json={
            "customer_id": customer_id, "isGift": True,
        }, headers=_auth_headers(token))
        data = res.get_json()
        assert data["gift_wrap_fee"] == 50
        assert data["final_amount"] == 650  # 600 + 0 delivery (>500) + 50 gift wrap

    def test_buy_now_checkout_bypasses_cart(self, client, registered_customer):
        customer_id, token = registered_customer
        product_id = _insert_product(price="600")

        res = client.post("/customer/checkout", json={
            "customer_id": customer_id,
            "checkout_mode": "buyNow",
            "items": [{"product_id": product_id, "size": "M", "color": "Red", "quantity": 1}],
        }, headers=_auth_headers(token))
        assert res.status_code == 200
        assert res.get_json()["total"] == 600

        # buyNow mode should NOT touch/clear the (empty) cart collection state
        cart_res = client.get(f"/customer/cart/{customer_id}", headers=_auth_headers(token))
        assert cart_res.get_json()["items"] == []
