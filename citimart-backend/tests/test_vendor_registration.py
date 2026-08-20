# tests/test_vendor_registration.py
from database import vendors_collection


def _register_payload(**overrides):
    payload = {
        "fullName": "Vendor Person", "email": "newvendor@test.com", "phone": "9999999999",
        "password": "vendorpass123", "businessName": "Test Biz", "businessType": "Retailer",
        "businessRegNo": "REG123", "gstNo": "GST123", "businessAddress": "123 Test St",
        "skuCount": "50", "priceRange": "100-1000", "productType": "Clothing",
        "website": "", "socialLinks": "", "inventoryReady": "yes", "shipping": "own",
        "appeal": "", "productDesc": "Clothes", "termsAgreed": "true",
        "productCategories": "[]", "selectedSubcategories": "{}",
    }
    payload.update(overrides)
    return payload


class TestVendorRegistration:
    def test_register_vendor_success(self, client):
        res = client.post("/auth/register-vendor", data=_register_payload())
        assert res.status_code == 201

        vendor = vendors_collection.find_one({"email": "newvendor@test.com"})
        assert vendor is not None
        # no active subusers exist in a fresh test DB -> goes straight to pending_admin
        assert vendor["status"] == "pending_admin"

    def test_register_duplicate_vendor_email_rejected(self, client):
        client.post("/auth/register-vendor", data=_register_payload())
        res = client.post("/auth/register-vendor", data=_register_payload())
        assert res.status_code == 400
        assert "already exists" in res.get_json()["error"]

    def test_unapproved_vendor_cannot_log_in_immediately_after_registering(self, client):
        client.post("/auth/register-vendor", data=_register_payload(email="pending2@test.com"))
        res = client.post("/auth/login/vendor", json={
            "email": "pending2@test.com", "password": "vendorpass123",
        })
        assert res.status_code == 401
