# tests/test_orders_returns.py
from database import products_collection, orders_collection


def _insert_product(**overrides):
    doc = {"name": "Orderable Item", "price": "500", "status": "approved", "images": []}
    doc.update(overrides)
    return str(products_collection.insert_one(doc).inserted_id)


def _insert_order(customer_id, product_id, **overrides):
    doc = {
        "customer_id": customer_id,
        "order_items": [{"product_id": product_id, "size": "M", "color": "Red", "quantity": 1}],
        "total_amount": 500, "final_amount": 500, "status": "Placed",
    }
    doc.update(overrides)
    return str(orders_collection.insert_one(doc).inserted_id)


def _auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


class TestGetOrders:
    def test_no_orders_returns_empty_list(self, client, registered_customer):
        customer_id, token = registered_customer
        res = client.get(f"/customer/orders/{customer_id}", headers=_auth_headers(token))
        assert res.status_code == 200
        assert res.get_json() == []

    def test_orders_enriched_with_product_data(self, client, registered_customer):
        customer_id, token = registered_customer
        product_id = _insert_product(name="My Ordered Shirt")
        _insert_order(customer_id, product_id)

        res = client.get(f"/customer/orders/{customer_id}", headers=_auth_headers(token))
        orders = res.get_json()
        assert len(orders) == 1
        assert orders[0]["products"][0]["product"]["name"] == "My Ordered Shirt"

    def test_cannot_view_another_customers_orders(self, client, registered_customer):
        _, token = registered_customer
        res = client.get("/customer/orders/someone-elses-id", headers=_auth_headers(token))
        assert res.status_code == 403


class TestReturnOrder:
    def test_return_request_success(self, client, registered_customer):
        customer_id, token = registered_customer
        product_id = _insert_product()
        order_id = _insert_order(customer_id, product_id)

        res = client.post("/customer/return", json={
            "order_id": order_id, "product_id": product_id, "quantity": 1,
        }, headers=_auth_headers(token))
        assert res.status_code == 200

        order = orders_collection.find_one({"customer_id": customer_id})
        assert len(order["returns"]) == 1
        assert order["returns"][0]["status"] == "pending"

    def test_return_missing_fields_rejected(self, client, registered_customer):
        customer_id, token = registered_customer
        res = client.post("/customer/return", json={}, headers=_auth_headers(token))
        assert res.status_code == 400

    def test_return_for_order_not_belonging_to_customer_rejected(self, client, registered_customer):
        customer_id, token = registered_customer
        product_id = _insert_product()
        other_order_id = _insert_order("some-other-customer-id", product_id)

        res = client.post("/customer/return", json={
            "order_id": other_order_id, "product_id": product_id,
        }, headers=_auth_headers(token))
        assert res.status_code == 404

    def test_return_without_token_returns_401(self, client, registered_customer):
        customer_id, _ = registered_customer
        product_id = _insert_product()
        order_id = _insert_order(customer_id, product_id)
        res = client.post("/customer/return", json={"order_id": order_id, "product_id": product_id})
        assert res.status_code == 401


class TestReorder:
    def test_reorder_adds_to_empty_cart(self, client, registered_customer):
        customer_id, token = registered_customer
        product_id = _insert_product()

        res = client.post("/customer/reorder", json={
            "product_id": product_id, "size": "M", "color": "Red", "quantity": 2,
        }, headers=_auth_headers(token))
        assert res.status_code == 200

        cart_res = client.get(f"/customer/cart/{customer_id}", headers=_auth_headers(token))
        items = cart_res.get_json()["items"]
        assert len(items) == 1
        assert items[0]["quantity"] == 2

    def test_reorder_same_item_increments_quantity(self, client, registered_customer):
        customer_id, token = registered_customer
        product_id = _insert_product()
        payload = {"product_id": product_id, "size": "M", "color": "Red", "quantity": 1}

        client.post("/customer/reorder", json=payload, headers=_auth_headers(token))
        client.post("/customer/reorder", json=payload, headers=_auth_headers(token))

        cart_res = client.get(f"/customer/cart/{customer_id}", headers=_auth_headers(token))
        items = cart_res.get_json()["items"]
        assert len(items) == 1
        assert items[0]["quantity"] == 2

    def test_reorder_missing_product_id_rejected(self, client, registered_customer):
        _, token = registered_customer
        res = client.post("/customer/reorder", json={}, headers=_auth_headers(token))
        assert res.status_code == 400
