# tests/test_finance.py
from werkzeug.security import generate_password_hash

from database import orders_collection, vendors_collection, users_collection, payouts_collection


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


def _seed_vendor(email="vendor@test.com", **overrides):
    doc = {"fullName": "Vendor One", "businessName": "Vendor Biz", "email": email, "status": "approved"}
    doc.update(overrides)
    return str(vendors_collection.insert_one(doc).inserted_id)


def _seed_order(vendor_id, price=1000, qty=1):
    return str(orders_collection.insert_one({
        "customer_id": "cust1",
        "order_items": [{"product_id": "p1", "vendor_id": vendor_id, "price": price, "quantity": qty}],
        "final_amount": price * qty, "status": "Placed",
    }).inserted_id)


class TestCommissionSettlement:
    def test_marking_delivered_creates_payout_at_platform_rate(self, client):
        client.put("/admin/settings/platform", json={"commissionRate": 20})
        vendor_id = _seed_vendor()
        order_id = _seed_order(vendor_id, price=1000)

        res = client.put(f"/admin/orders/{order_id}", json={"status": "delivered"})
        assert res.status_code == 200

        payout = payouts_collection.find_one({"order_id": order_id})
        assert payout is not None
        assert payout["vendor_id"] == vendor_id
        assert payout["gross_amount"] == 1000
        assert payout["commission_rate"] == 20
        assert payout["commission_amount"] == 200
        assert payout["net_payout"] == 800
        assert payout["status"] == "pending"

    def test_marking_delivered_twice_does_not_double_settle(self, client):
        vendor_id = _seed_vendor()
        order_id = _seed_order(vendor_id, price=500)
        client.put(f"/admin/orders/{order_id}", json={"status": "delivered"})
        client.put(f"/admin/orders/{order_id}", json={"status": "delivered"})
        assert payouts_collection.count_documents({"order_id": order_id}) == 1

    def test_non_delivered_status_does_not_settle(self, client):
        vendor_id = _seed_vendor()
        order_id = _seed_order(vendor_id)
        client.put(f"/admin/orders/{order_id}", json={"status": "shipped"})
        assert payouts_collection.count_documents({"order_id": order_id}) == 0

    def test_admin_added_item_with_no_vendor_has_no_payout_owed(self, client):
        order_id = str(orders_collection.insert_one({
            "customer_id": "cust1",
            "order_items": [{"product_id": "p1", "vendor_id": None, "price": 100, "quantity": 1}],
            "final_amount": 100, "status": "Placed",
        }).inserted_id)
        client.put(f"/admin/orders/{order_id}", json={"status": "delivered"})
        payout = payouts_collection.find_one({"order_id": order_id})
        assert payout["net_payout"] == 0
        assert payout["status"] == "not_applicable"


class TestFinanceOverview:
    def test_overview_requires_auth(self, client):
        res = client.get("/admin/finance/overview")
        assert res.status_code == 401

    def test_overview_aggregates_real_settled_payouts(self, client):
        token = _admin_token(client)
        client.put("/admin/settings/platform", json={"commissionRate": 10})
        vendor_id = _seed_vendor()
        order_id = _seed_order(vendor_id, price=1000)
        client.put(f"/admin/orders/{order_id}", json={"status": "delivered"})

        res = client.get("/admin/finance/overview", headers=_auth_headers(token))
        data = res.get_json()
        assert data["gross_settled_sales"] == 1000
        assert data["commission_revenue"] == 100
        assert data["pending_vendor_payouts"] == 900
        assert data["settled_order_count"] == 1


class TestPayoutsAndKybGate:
    def test_list_payouts_requires_auth(self, client):
        res = client.get("/admin/finance/payouts")
        assert res.status_code == 401

    def test_cannot_mark_paid_until_vendor_kyb_verified(self, client):
        token = _admin_token(client)
        vendor_id = _seed_vendor()  # no kybStatus set -> defaults to not verified
        order_id = _seed_order(vendor_id, price=500)
        client.put(f"/admin/orders/{order_id}", json={"status": "delivered"})
        payout_id = str(payouts_collection.find_one({"order_id": order_id})["_id"])

        res = client.put(f"/admin/finance/payouts/{payout_id}", json={"status": "paid"},
                          headers=_auth_headers(token))
        assert res.status_code == 400
        assert "verif" in res.get_json()["error"].lower()
        assert payouts_collection.find_one({"_id": __import__("bson").ObjectId(payout_id)})["status"] == "pending"

    def test_can_mark_paid_once_vendor_kyb_verified(self, client):
        token = _admin_token(client)
        vendor_id = _seed_vendor(kybStatus="verified")
        order_id = _seed_order(vendor_id, price=500)
        client.put(f"/admin/orders/{order_id}", json={"status": "delivered"})
        payout_id = str(payouts_collection.find_one({"order_id": order_id})["_id"])

        res = client.put(f"/admin/finance/payouts/{payout_id}", json={"status": "paid"},
                          headers=_auth_headers(token))
        assert res.status_code == 200
        assert payouts_collection.find_one({"_id": __import__("bson").ObjectId(payout_id)})["status"] == "paid"

    def test_invalid_status_rejected(self, client):
        token = _admin_token(client)
        res = client.put("/admin/finance/payouts/000000000000000000000000",
                          json={"status": "bogus"}, headers=_auth_headers(token))
        assert res.status_code == 400


class TestExpenses:
    def test_expenses_require_auth(self, client):
        res = client.get("/admin/finance/expenses")
        assert res.status_code == 401

    def test_add_list_and_delete_expense(self, client):
        token = _admin_token(client)
        headers = _auth_headers(token)

        create_res = client.post("/admin/finance/expenses", json={
            "label": "Ad campaign", "amount": 500, "category": "marketing",
        }, headers=headers)
        assert create_res.status_code == 201
        expense_id = create_res.get_json()["expense"]["_id"]

        list_res = client.get("/admin/finance/expenses", headers=headers)
        assert len(list_res.get_json()["expenses"]) == 1

        del_res = client.delete(f"/admin/finance/expenses/{expense_id}", headers=headers)
        assert del_res.status_code == 200
        assert client.get("/admin/finance/expenses", headers=headers).get_json()["expenses"] == []

    def test_add_expense_missing_fields_rejected(self, client):
        token = _admin_token(client)
        res = client.post("/admin/finance/expenses", json={"label": "x"}, headers=_auth_headers(token))
        assert res.status_code == 400


class TestVendorPayoutView:
    def test_vendor_payouts_requires_auth(self, client):
        res = client.get("/vendor/payouts")
        assert res.status_code == 401

    def test_vendor_sees_only_their_own_payouts(self, client):
        vendor_id = _seed_vendor(email="v1@test.com", password=generate_password_hash("vendorpass"))
        other_vendor_id = _seed_vendor(email="v2@test.com", password=generate_password_hash("vendorpass"))

        order1 = _seed_order(vendor_id, price=1000)
        order2 = _seed_order(other_vendor_id, price=2000)
        client.put(f"/admin/orders/{order1}", json={"status": "delivered"})
        client.put(f"/admin/orders/{order2}", json={"status": "delivered"})

        login_res = client.post("/auth/login/vendor", json={"email": "v1@test.com", "password": "vendorpass"})
        token = login_res.get_json()["token"]

        res = client.get("/vendor/payouts", headers=_auth_headers(token))
        data = res.get_json()
        assert len(data["payouts"]) == 1
        assert data["payouts"][0]["order_id"] == order1
