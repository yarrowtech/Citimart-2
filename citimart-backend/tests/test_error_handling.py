# tests/test_error_handling.py
# Regression tests for the global error handlers added in app.py.
# Without them, a malformed MongoDB id anywhere in the ~60 unguarded
# ObjectId() call sites across the route files would 500/crash with a raw
# traceback instead of a clean, predictable error response.


class TestInvalidIdHandler:
    def test_malformed_product_id_in_cart_update_returns_400_not_crash(
        self, client, registered_customer
    ):
        customer_id, token = registered_customer
        res = client.post(
            "/customer/cart/update_quantity",
            json={"customer_id": customer_id, "product_id": "not-a-valid-object-id", "quantity": 2},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 400
        assert res.get_json()["error"] == "Invalid ID format"

    def test_malformed_id_without_auth_still_hits_auth_check_first(self, client):
        # Sanity check: the route requires auth before it ever reaches the
        # ObjectId conversion, so an unauthenticated request should 401, not 400.
        res = client.post(
            "/customer/cart/update_quantity",
            json={"customer_id": "x", "product_id": "not-a-valid-object-id"},
        )
        assert res.status_code == 401
