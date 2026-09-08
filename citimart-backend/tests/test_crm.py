# tests/test_crm.py
from werkzeug.security import generate_password_hash

from database import (
    users_collection, orders_collection, complaints_collection,
    cart_collection, wishlist_collection,
)


def _seed_admin(email="admin@test.com", password="adminpass"):
    users_collection.insert_one({
        "name": "Admin", "email": email,
        "password": generate_password_hash(password), "role": "admin",
    })


def _admin_token(client, email="admin@test.com", password="adminpass"):
    _seed_admin(email, password)
    res = client.post("/auth/login/admin", json={"email": email, "password": password})
    return res.get_json()["token"]


def _auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def _seed_customer(name="Jane Doe", email="jane@test.com", **overrides):
    doc = {"name": name, "email": email, "role": "customer"}
    doc.update(overrides)
    return str(users_collection.insert_one(doc).inserted_id)


class TestCrmAuth:
    def test_list_customers_requires_auth(self, client):
        res = client.get("/admin/crm/customers")
        assert res.status_code == 401

    def test_get_customer_requires_auth(self, client):
        cid = _seed_customer()
        res = client.get(f"/admin/crm/customers/{cid}")
        assert res.status_code == 401


class TestListCustomers:
    def test_list_returns_real_order_counts(self, client):
        token = _admin_token(client)
        cid = _seed_customer()
        orders_collection.insert_many([
            {"customer_id": cid, "order_items": [], "final_amount": 100, "status": "Delivered"},
            {"customer_id": cid, "order_items": [], "final_amount": 200, "status": "Placed"},
        ])
        res = client.get("/admin/crm/customers", headers=_auth_headers(token))
        assert res.status_code == 200
        customers = res.get_json()["customers"]
        assert len(customers) == 1
        assert customers[0]["order_count"] == 2
        assert customers[0]["email"] == "jane@test.com"

    def test_search_filters_by_name_or_email(self, client):
        token = _admin_token(client)
        _seed_customer(name="Alice", email="alice@test.com")
        _seed_customer(name="Bob", email="bob@test.com")

        res = client.get("/admin/crm/customers?search=alice", headers=_auth_headers(token))
        customers = res.get_json()["customers"]
        assert len(customers) == 1
        assert customers[0]["name"] == "Alice"

    def test_only_customers_listed_not_admins_or_vendors(self, client):
        token = _admin_token(client)
        _seed_customer(name="Real Customer")
        res = client.get("/admin/crm/customers", headers=_auth_headers(token))
        customers = res.get_json()["customers"]
        # the admin account itself must never show up here
        assert all(c["email"] != "admin@test.com" for c in customers)


class TestCustomerProfile:
    def test_full_profile_aggregation(self, client):
        token = _admin_token(client)
        cid = _seed_customer(segment="vip", segment_request={
            "requested_segment": "vip", "status": "approved",
        })
        orders_collection.insert_many([
            {"customer_id": cid, "order_items": [{"a": 1}], "final_amount": 300, "status": "Delivered"},
            {"customer_id": cid, "order_items": [{"a": 1}, {"b": 2}], "final_amount": 150, "status": "Placed"},
        ])
        complaints_collection.insert_one({
            "user_id": __import__("bson").ObjectId(cid), "category": "service",
            "description": "issue", "status": "Resolved", "date": "2026-01-01",
        })
        cart_collection.insert_one({"customer_id": cid, "items": [{"product_id": "x"}]})
        wishlist_collection.insert_one({"customer_id": cid, "items": [{"product_id": "x"}, {"product_id": "y"}]})

        res = client.get(f"/admin/crm/customers/{cid}", headers=_auth_headers(token))
        assert res.status_code == 200
        data = res.get_json()

        assert data["order_count"] == 2
        assert data["lifetime_spent"] == 450
        assert data["cart_item_count"] == 1
        assert data["wishlist_item_count"] == 2
        assert len(data["complaints"]) == 1
        assert data["profile"]["segment"] == "vip"
        assert data["profile"]["segment_request"]["status"] == "approved"
        assert data["profile"]["joined"] is not None  # derived from ObjectId, not stored

    def test_customer_with_no_activity_returns_zeros(self, client):
        token = _admin_token(client)
        cid = _seed_customer(name="Quiet Customer", email="quiet@test.com")
        res = client.get(f"/admin/crm/customers/{cid}", headers=_auth_headers(token))
        data = res.get_json()
        assert data["order_count"] == 0
        assert data["lifetime_spent"] == 0
        assert data["complaints"] == []

    def test_invalid_id_returns_400(self, client):
        token = _admin_token(client)
        res = client.get("/admin/crm/customers/not-an-id", headers=_auth_headers(token))
        assert res.status_code == 400

    def test_nonexistent_customer_returns_404(self, client):
        token = _admin_token(client)
        res = client.get("/admin/crm/customers/000000000000000000000000", headers=_auth_headers(token))
        assert res.status_code == 404
