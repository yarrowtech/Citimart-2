# tests/test_admin_products_pending.py
#
# NOTE: these three routes (GET .../pending, PUT .../approve, PUT .../reject)
# have no @admin_token_required decorator at all, and the live path is
# doubled to /admin/admin/products/... because the route strings already
# include "/admin" on top of the blueprint's own /admin url_prefix. Confirmed
# via grep that nothing in the frontend currently calls them (the real
# approval flow goes through review_history elsewhere) — this test suite
# documents the CURRENT behavior as-is, per explicit instruction not to
# change route code in this pass. Flagged separately as a security item.
from bson import ObjectId

from database import products_collection


def _insert_pending_product(**overrides):
    doc = {"name": "Pending Product", "status": "pending", "price": "500"}
    doc.update(overrides)
    return str(products_collection.insert_one(doc).inserted_id)


class TestPendingProductsCurrentBehavior:
    def test_pending_list_reachable_without_any_auth(self, client):
        """Documents that no Authorization header is required."""
        _insert_pending_product()
        res = client.get("/admin/admin/products/pending")
        assert res.status_code == 200
        assert len(res.get_json()) == 1

    def test_pending_list_only_returns_pending_status(self, client):
        _insert_pending_product(name="Pending One")
        products_collection.insert_one({"name": "Approved One", "status": "approved"})
        res = client.get("/admin/admin/products/pending")
        names = [p["name"] for p in res.get_json()]
        assert names == ["Pending One"]

    def test_approve_reachable_without_any_auth(self, client):
        """Documents that anyone can approve a product with no login."""
        product_id = _insert_pending_product()
        res = client.put(f"/admin/admin/products/{product_id}/approve")
        assert res.status_code == 200

        product = products_collection.find_one({"_id": ObjectId(product_id)})
        assert product["status"] == "approved"

    def test_reject_reachable_without_any_auth(self, client):
        """Documents that anyone can reject a product with no login."""
        product_id = _insert_pending_product()
        res = client.put(f"/admin/admin/products/{product_id}/reject")
        assert res.status_code == 200
        product = products_collection.find_one({"name": "Pending Product"})
        assert product["status"] == "rejected"

    def test_approve_nonexistent_product_returns_404(self, client):
        fake_id = "c" * 24
        res = client.put(f"/admin/admin/products/{fake_id}/approve")
        assert res.status_code == 404

    def test_the_single_prefix_path_does_not_exist(self, client):
        """Documents the doubled /admin/admin/ routing quirk."""
        res = client.get("/admin/products/pending")
        assert res.status_code == 404
