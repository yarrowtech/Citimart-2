from bson import ObjectId

from database import cart_collection, products_collection, wishlist_collection


def make_product(name):
    result = products_collection.insert_one({
        "name": name,
        "price": 100,
        "images": [],
        "variants": [],
    })
    return str(result.inserted_id)


def test_guest_cart_is_added_to_existing_customer_cart(client, registered_customer):
    customer_id, token = registered_customer
    existing_ids = [make_product(f"Existing {index}") for index in range(3)]
    guest_id = make_product("Guest product")
    cart_collection.insert_one({
        "customer_id": customer_id,
        "items": [
            {"product_id": product_id, "size": "N/A", "color": "N/A", "quantity": 1}
            for product_id in existing_ids
        ],
    })

    response = client.post(
        "/customer/guest/merge",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "customer_id": customer_id,
            "cart": [{"product_id": guest_id, "size": "N/A", "color": "N/A", "quantity": 1}],
            "wishlist": [],
        },
    )

    assert response.status_code == 200
    assert response.get_json()["cart_count"] == 4
    assert len(cart_collection.find_one({"customer_id": customer_id})["items"]) == 4


def test_guest_merge_combines_quantity_and_deduplicates_wishlist(client, registered_customer):
    customer_id, token = registered_customer
    product_id = make_product("Shared product")
    cart_collection.insert_one({
        "customer_id": customer_id,
        "items": [{"product_id": product_id, "size": "M", "color": "Blue", "quantity": 3}],
    })
    wishlist_collection.insert_one({
        "customer_id": customer_id,
        "items": [{"product_id": product_id, "size": "M", "color": "Blue"}],
    })

    response = client.post(
        "/customer/guest/merge",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "customer_id": customer_id,
            "cart": [{"product_id": {"$oid": product_id}, "size": "M", "color": "Blue", "quantity": 1}],
            "wishlist": [{"product_id": product_id, "size": "M", "color": "Blue"}],
        },
    )

    assert response.status_code == 200
    assert response.get_json() == {
        "message": "Guest items merged",
        "cart_count": 4,
        "wishlist_count": 1,
    }
    assert cart_collection.find_one({"customer_id": customer_id})["items"][0]["quantity"] == 4
    assert len(wishlist_collection.find_one({"customer_id": customer_id})["items"]) == 1
