# tests/test_wishlist.py
from database import products_collection


def _insert_product(**overrides):
    doc = {
        "name": "Wishlist Item", "brand": "TestBrand", "category": "Clothing",
        "subcategory": "Men", "price": "799", "discount": "0",
        "images": [], "variants": [], "status": "approved",
    }
    doc.update(overrides)
    result = products_collection.insert_one(doc)
    return str(result.inserted_id)


def _auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


class TestAddToWishlist:
    def test_add_to_empty_wishlist(self, client, registered_customer):
        customer_id, token = registered_customer
        product_id = _insert_product()
        res = client.post("/customer/wishlist/add", json={
            "customer_id": customer_id, "product_id": product_id,
        }, headers=_auth_headers(token))
        assert res.status_code == 200
        assert res.get_json()["message"] == "Added to wishlist"

    def test_adding_same_item_twice_does_not_duplicate(self, client, registered_customer):
        customer_id, token = registered_customer
        product_id = _insert_product()
        payload = {"customer_id": customer_id, "product_id": product_id}

        client.post("/customer/wishlist/add", json=payload, headers=_auth_headers(token))
        client.post("/customer/wishlist/add", json=payload, headers=_auth_headers(token))

        res = client.get(f"/customer/wishlist/{customer_id}", headers=_auth_headers(token))
        assert len(res.get_json()["items"]) == 1

    def test_add_without_token_returns_401(self, client, registered_customer):
        customer_id, _ = registered_customer
        product_id = _insert_product()
        res = client.post("/customer/wishlist/add", json={
            "customer_id": customer_id, "product_id": product_id,
        })
        assert res.status_code == 401


class TestGetWishlist:
    def test_empty_wishlist(self, client, registered_customer):
        customer_id, token = registered_customer
        res = client.get(f"/customer/wishlist/{customer_id}", headers=_auth_headers(token))
        assert res.status_code == 200
        assert res.get_json()["items"] == []

    def test_wishlist_enriched_with_product_data(self, client, registered_customer):
        customer_id, token = registered_customer
        product_id = _insert_product(name="Fancy Jacket")
        client.post("/customer/wishlist/add", json={
            "customer_id": customer_id, "product_id": product_id,
        }, headers=_auth_headers(token))

        res = client.get(f"/customer/wishlist/{customer_id}", headers=_auth_headers(token))
        items = res.get_json()["items"]
        assert len(items) == 1
        assert items[0]["product"]["name"] == "Fancy Jacket"


class TestRemoveFromWishlist:
    def test_remove_existing_item(self, client, registered_customer):
        customer_id, token = registered_customer
        product_id = _insert_product()
        client.post("/customer/wishlist/add", json={
            "customer_id": customer_id, "product_id": product_id,
        }, headers=_auth_headers(token))

        res = client.delete("/customer/wishlist/remove", json={
            "customer_id": customer_id, "product_id": product_id,
        }, headers=_auth_headers(token))
        assert res.status_code == 200

        get_res = client.get(f"/customer/wishlist/{customer_id}", headers=_auth_headers(token))
        assert get_res.get_json()["items"] == []

    def test_remove_from_nonexistent_wishlist_returns_404(self, client, registered_customer):
        customer_id, token = registered_customer
        product_id = _insert_product()
        res = client.delete("/customer/wishlist/remove", json={
            "customer_id": customer_id, "product_id": product_id,
        }, headers=_auth_headers(token))
        assert res.status_code == 404


class TestMoveWishlistToCart:
    def test_move_to_cart_success(self, client, registered_customer):
        customer_id, token = registered_customer
        product_id = _insert_product()
        client.post("/customer/wishlist/add", json={
            "customer_id": customer_id, "product_id": product_id,
        }, headers=_auth_headers(token))

        res = client.post("/customer/wishlist/move_to_cart", json={
            "customer_id": customer_id, "product_id": product_id, "quantity": 1,
        }, headers=_auth_headers(token))
        assert res.status_code == 200

        wishlist_res = client.get(f"/customer/wishlist/{customer_id}", headers=_auth_headers(token))
        assert wishlist_res.get_json()["items"] == []

        cart_res = client.get(f"/customer/cart/{customer_id}", headers=_auth_headers(token))
        assert len(cart_res.get_json()["items"]) == 1
