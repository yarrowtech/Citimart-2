# tests/test_reviews.py
from bson import ObjectId

from database import products_collection, orders_collection


def _insert_product(**overrides):
    doc = {"name": "Reviewable Item", "price": "500", "status": "approved", "variants": []}
    doc.update(overrides)
    return str(products_collection.insert_one(doc).inserted_id)


def _insert_order(customer_id, status="Delivered"):
    return str(orders_collection.insert_one({
        "customer_id": customer_id, "status": status, "order_items": [],
    }).inserted_id)


def _auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


class TestSubmitReview:
    def test_submit_review_after_delivery_succeeds(self, client, registered_customer):
        customer_id, token = registered_customer
        product_id = _insert_product()
        order_id = _insert_order(customer_id, status="Delivered")

        res = client.post(
            f"/customer/review/{order_id}/{product_id}",
            data={"review": "Great product, fits well!", "rating": "5"},
            headers=_auth_headers(token),
        )
        assert res.status_code == 200
        assert res.get_json()["message"] == "Review submitted successfully"

    def test_review_before_delivery_rejected(self, client, registered_customer):
        customer_id, token = registered_customer
        product_id = _insert_product()
        order_id = _insert_order(customer_id, status="Placed")

        res = client.post(
            f"/customer/review/{order_id}/{product_id}",
            data={"review": "Too early", "rating": "5"},
            headers=_auth_headers(token),
        )
        assert res.status_code == 403

    def test_review_with_invalid_rating_rejected(self, client, registered_customer):
        customer_id, token = registered_customer
        product_id = _insert_product()
        order_id = _insert_order(customer_id, status="Delivered")

        res = client.post(
            f"/customer/review/{order_id}/{product_id}",
            data={"review": "Rated too high", "rating": "9"},
            headers=_auth_headers(token),
        )
        assert res.status_code == 400

    def test_review_with_empty_text_rejected(self, client, registered_customer):
        customer_id, token = registered_customer
        product_id = _insert_product()
        order_id = _insert_order(customer_id, status="Delivered")

        res = client.post(
            f"/customer/review/{order_id}/{product_id}",
            data={"review": "  ", "rating": "4"},
            headers=_auth_headers(token),
        )
        assert res.status_code == 400

    def test_review_without_token_returns_401(self, client, registered_customer):
        customer_id, _ = registered_customer
        product_id = _insert_product()
        order_id = _insert_order(customer_id, status="Delivered")
        res = client.post(f"/customer/review/{order_id}/{product_id}", data={"review": "x", "rating": "5"})
        assert res.status_code == 401


class TestGetReviews:
    def test_get_reviews_empty(self, client):
        product_id = _insert_product()
        res = client.get(f"/customer/reviews/{product_id}")
        assert res.status_code == 200
        assert res.get_json()["reviews"] == []

    def test_get_reviews_after_submission(self, client, registered_customer):
        customer_id, token = registered_customer
        product_id = _insert_product()
        order_id = _insert_order(customer_id, status="Delivered")
        client.post(
            f"/customer/review/{order_id}/{product_id}",
            data={"review": "Loved it", "rating": "5"},
            headers=_auth_headers(token),
        )

        res = client.get(f"/customer/reviews/{product_id}")
        reviews = res.get_json()["reviews"]
        assert len(reviews) == 1
        assert reviews[0]["review"] == "Loved it"
        assert reviews[0]["rating"] == 5

    def test_get_reviews_invalid_product_id_returns_400(self, client):
        res = client.get("/customer/reviews/not-a-valid-id")
        assert res.status_code == 400
