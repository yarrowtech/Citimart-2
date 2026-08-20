# tests/test_cart.py
from database import products_collection


def _insert_product(**overrides):
    doc = {
        "name": "Test Shirt", "brand": "TestBrand", "category": "Clothing",
        "subcategory": "Men", "price": "999", "discount": "0",
        "images": [], "variants": [], "status": "approved",
    }
    doc.update(overrides)
    result = products_collection.insert_one(doc)
    return str(result.inserted_id)


def _auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


class TestAddToCart:
    def test_add_new_product_to_empty_cart(self, client, registered_customer):
        customer_id, token = registered_customer
        product_id = _insert_product()

        res = client.post("/customer/cart/add", json={
            "customer_id": customer_id, "product_id": product_id, "quantity": 1,
        }, headers=_auth_headers(token))

        assert res.status_code == 200
        assert res.get_json()["message"] == "Added to cart"

    def test_add_nonexistent_product_returns_404(self, client, registered_customer):
        customer_id, token = registered_customer
        fake_id = "b" * 24
        res = client.post("/customer/cart/add", json={
            "customer_id": customer_id, "product_id": fake_id, "quantity": 1,
        }, headers=_auth_headers(token))
        assert res.status_code == 404

    def test_add_more_than_stock_rejected(self, client, registered_customer):
        customer_id, token = registered_customer
        product_id = _insert_product(variants=[
            {"size": "M", "color": "Red", "stock": 3}
        ])
        res = client.post("/customer/cart/add", json={
            "customer_id": customer_id, "product_id": product_id,
            "size": "M", "color": "Red", "quantity": 5,
        }, headers=_auth_headers(token))
        assert res.status_code == 400
        assert "left in stock" in res.get_json()["error"]

    def test_add_to_cart_without_token_returns_401(self, client, registered_customer):
        customer_id, _ = registered_customer
        product_id = _insert_product()
        res = client.post("/customer/cart/add", json={
            "customer_id": customer_id, "product_id": product_id, "quantity": 1,
        })
        assert res.status_code == 401

    def test_wrong_customer_id_for_token_returns_403(self, client, registered_customer):
        _, token = registered_customer
        product_id = _insert_product()
        res = client.post("/customer/cart/add", json={
            "customer_id": "someone-elses-id", "product_id": product_id, "quantity": 1,
        }, headers=_auth_headers(token))
        assert res.status_code == 403


class TestGetCart:
    def test_empty_cart_returns_empty_list(self, client, registered_customer):
        customer_id, token = registered_customer
        res = client.get(f"/customer/cart/{customer_id}", headers=_auth_headers(token))
        assert res.status_code == 200
        assert res.get_json()["items"] == []

    def test_cart_with_items_is_enriched_with_product_data(self, client, registered_customer):
        customer_id, token = registered_customer
        product_id = _insert_product(name="Enriched Shirt", price="500")
        client.post("/customer/cart/add", json={
            "customer_id": customer_id, "product_id": product_id, "quantity": 2,
        }, headers=_auth_headers(token))

        res = client.get(f"/customer/cart/{customer_id}", headers=_auth_headers(token))
        items = res.get_json()["items"]
        assert len(items) == 1
        assert items[0]["product"]["name"] == "Enriched Shirt"
        assert items[0]["quantity"] == 2


class TestUpdateQuantity:
    def test_update_quantity_success(self, client, registered_customer):
        customer_id, token = registered_customer
        product_id = _insert_product()
        client.post("/customer/cart/add", json={
            "customer_id": customer_id, "product_id": product_id, "quantity": 1,
        }, headers=_auth_headers(token))

        res = client.post("/customer/cart/update_quantity", json={
            "customer_id": customer_id, "product_id": product_id, "quantity": 3,
        }, headers=_auth_headers(token))
        assert res.status_code == 200
        assert res.get_json()["message"] == "Quantity updated"

    def test_update_quantity_below_one_rejected(self, client, registered_customer):
        customer_id, token = registered_customer
        product_id = _insert_product()
        res = client.post("/customer/cart/update_quantity", json={
            "customer_id": customer_id, "product_id": product_id, "quantity": 0,
        }, headers=_auth_headers(token))
        assert res.status_code == 400

    def test_update_quantity_item_not_in_cart_returns_404(self, client, registered_customer):
        customer_id, token = registered_customer
        product_id = _insert_product()
        # cart doesn't exist at all yet
        res = client.post("/customer/cart/update_quantity", json={
            "customer_id": customer_id, "product_id": product_id, "quantity": 2,
        }, headers=_auth_headers(token))
        assert res.status_code == 404


class TestRemoveAndClearCart:
    def test_remove_item_success(self, client, registered_customer):
        customer_id, token = registered_customer
        product_id = _insert_product()
        client.post("/customer/cart/add", json={
            "customer_id": customer_id, "product_id": product_id, "quantity": 1,
        }, headers=_auth_headers(token))

        res = client.delete("/customer/cart/remove_item", json={
            "customer_id": customer_id, "product_id": product_id,
        }, headers=_auth_headers(token))
        assert res.status_code == 200

        cart_res = client.get(f"/customer/cart/{customer_id}", headers=_auth_headers(token))
        assert cart_res.get_json()["items"] == []

    def test_remove_item_not_in_cart_returns_404(self, client, registered_customer):
        customer_id, token = registered_customer
        product_id = _insert_product()
        res = client.delete("/customer/cart/remove_item", json={
            "customer_id": customer_id, "product_id": product_id,
        }, headers=_auth_headers(token))
        assert res.status_code == 404

    def test_clear_cart(self, client, registered_customer):
        customer_id, token = registered_customer
        product_id = _insert_product()
        client.post("/customer/cart/add", json={
            "customer_id": customer_id, "product_id": product_id, "quantity": 1,
        }, headers=_auth_headers(token))

        res = client.delete(f"/customer/cart/clear/{customer_id}", headers=_auth_headers(token))
        assert res.status_code == 200

        cart_res = client.get(f"/customer/cart/{customer_id}", headers=_auth_headers(token))
        assert cart_res.get_json()["items"] == []
