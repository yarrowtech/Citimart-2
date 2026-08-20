# tests/test_vendor_products.py
import json

from werkzeug.security import generate_password_hash

from database import vendors_collection, products_collection
from utils.auth_utils import generate_token


def _seed_vendor(approved_categories=None, approved_subcategories=None):
    vendor_id = vendors_collection.insert_one({
        "fullName": "Vendor", "email": "vp@test.com",
        "password": generate_password_hash("x"), "status": "approved",
        "approved_categories": approved_categories or [],
        "approved_subcategories": approved_subcategories or {},
        "approved_childcategories": {},
    }).inserted_id
    token = generate_token(vendor_id, "vendor")
    return str(vendor_id), token


def _auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


class TestAddProduct:
    def test_add_product_in_approved_category_succeeds(self, client):
        _, token = _seed_vendor(approved_categories=["Clothing"])
        res = client.post("/vendor/add-product", data={
            "name": "New Shirt", "brand": "MyBrand", "price": "499",
            "category": "Clothing", "subcategory": "", "childcategory": "",
            "specifications": "[]", "variants": "[]",
        }, headers=_auth_headers(token))
        assert res.status_code == 201
        data = res.get_json()
        assert data["success"] is True

        product = products_collection.find_one({"name": "New Shirt"})
        assert product["status"] == "pending"
        assert product["added_by"] == "vendor"

    def test_add_product_in_unapproved_category_rejected(self, client):
        _, token = _seed_vendor(approved_categories=["Electronics"])
        res = client.post("/vendor/add-product", data={
            "name": "Sneaky Shirt", "brand": "MyBrand", "price": "499",
            "category": "Clothing", "specifications": "[]", "variants": "[]",
        }, headers=_auth_headers(token))
        assert res.status_code == 403

    def test_add_product_without_token_returns_401(self, client):
        res = client.post("/vendor/add-product", data={
            "name": "No Auth Shirt", "category": "Clothing",
            "specifications": "[]", "variants": "[]",
        })
        assert res.status_code == 401

    def test_add_product_with_variants_generates_skus(self, client):
        _, token = _seed_vendor(approved_categories=["Clothing"])
        variants = json.dumps([
            {"colorHex": "#FF0000", "colorName": "Red", "size": "M", "stock": 5},
        ])
        res = client.post("/vendor/add-product", data={
            "name": "Variant Shirt", "brand": "MyBrand", "price": "499",
            "category": "Clothing", "specifications": "[]", "variants": variants,
        }, headers=_auth_headers(token))
        assert res.status_code == 201

        product = products_collection.find_one({"name": "Variant Shirt"})
        assert len(product["variants"]) == 1
        assert product["variants"][0]["sku"]
        assert product["variants"][0]["stock"] == 5

    def test_add_product_with_invalid_color_hex_variant_dropped(self, client):
        _, token = _seed_vendor(approved_categories=["Clothing"])
        variants = json.dumps([
            {"colorHex": "not-a-hex", "colorName": "Red", "size": "M", "stock": 5},
        ])
        res = client.post("/vendor/add-product", data={
            "name": "Bad Variant Shirt", "brand": "MyBrand", "price": "499",
            "category": "Clothing", "specifications": "[]", "variants": variants,
        }, headers=_auth_headers(token))
        assert res.status_code == 201
        product = products_collection.find_one({"name": "Bad Variant Shirt"})
        assert product["variants"] == []
