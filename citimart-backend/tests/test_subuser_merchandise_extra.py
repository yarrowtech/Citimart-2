# tests/test_subuser_merchandise_extra.py
from unittest.mock import patch

from database import categories_collection, collections_collection, products_collection


def _create_active_subuser(client, email, permissions):
    with patch("routes.subuser_routes.send_email", return_value=True):
        create_res = client.post("/subuser/subusers", json={
            "email": email, "parentType": "Admin", "role": "Merchandise Manager",
            "permissions": permissions,
        })
    setup_token = create_res.get_json()["subuser"]["setupToken"]
    client.post("/subuser/setup", json={"token": setup_token, "password": "subuserpass123"})
    login_res = client.post("/subuser/login/subuser", json={"email": email, "password": "subuserpass123"})
    return login_res.get_json()["token"]


def _auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


class TestSubuserCategories:
    def test_add_and_list_category(self, client):
        token = _create_active_subuser(client, "cat-sub@test.com", {"merchandise": True})
        headers = _auth_headers(token)

        add_res = client.post("/subuser/categories", json={
            "category": "Electronics",
            "subcategories": [{"name": "Mobiles", "children": ["Android", "iPhone"]}],
        }, headers=headers)
        assert add_res.status_code == 201

        list_res = client.get("/subuser/categories", headers=headers)
        cats = list_res.get_json()["categories"]
        assert len(cats) == 1
        assert cats[0]["name"] == "Electronics"
        assert cats[0]["subCategories"][0]["childCategories"] == ["Android", "iPhone"]

    def test_edit_category_name(self, client):
        token = _create_active_subuser(client, "cat-sub2@test.com", {"merchandise": True})
        headers = _auth_headers(token)
        client.post("/subuser/categories", json={"category": "Books", "subcategories": []}, headers=headers)

        edit_res = client.put("/subuser/categories/edit", json={
            "type": "category", "old_name": "Books", "new_name": "Reading",
        }, headers=headers)
        assert edit_res.status_code == 200
        assert categories_collection.find_one({"name": "Reading"}) is not None

    def test_delete_category(self, client):
        token = _create_active_subuser(client, "cat-sub3@test.com", {"merchandise": True})
        headers = _auth_headers(token)
        client.post("/subuser/categories", json={"category": "Toys", "subcategories": []}, headers=headers)

        del_res = client.delete("/subuser/categories/delete", json={"type": "category", "name": "Toys"}, headers=headers)
        assert del_res.status_code == 200
        assert categories_collection.find_one({"name": "Toys"}) is None

    def test_categories_without_merchandise_permission_rejected(self, client):
        token = _create_active_subuser(client, "cat-sub4@test.com", {"faq": True})
        res = client.get("/subuser/categories", headers=_auth_headers(token))
        assert res.status_code == 403


class TestSubuserCollections:
    def test_collection_crud_full_cycle(self, client):
        token = _create_active_subuser(client, "coll-sub@test.com", {"merchandise": True})
        headers = _auth_headers(token)
        product_id = str(products_collection.insert_one({"name": "Coll Item", "price": 100}).inserted_id)

        create_res = client.post("/subuser/collections", json={
            "name": "Summer Picks", "slug": "summer-picks", "description": "Hot picks",
            "products": [{"_id": product_id}], "role": "merchandise",
        }, headers=headers)
        assert create_res.status_code == 201
        collection_id = create_res.get_json()["collection"]["_id"]

        list_res = client.get("/subuser/collections", headers=headers)
        assert len(list_res.get_json()["collections"]) == 1

        update_res = client.put(f"/subuser/collections/{collection_id}", json={
            "name": "Winter Picks", "role": "merchandise",
        }, headers=headers)
        assert update_res.status_code == 200
        assert update_res.get_json()["collection"]["name"] == "Winter Picks"

        delete_res = client.delete(f"/subuser/collections/{collection_id}?role=merchandise", headers=headers)
        assert delete_res.status_code == 200
        assert collections_collection.count_documents({}) == 0

    def test_collections_without_merchandise_permission_rejected(self, client):
        token = _create_active_subuser(client, "coll-sub2@test.com", {"faq": True})
        res = client.get("/subuser/collections", headers=_auth_headers(token))
        assert res.status_code == 403
