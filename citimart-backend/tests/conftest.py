# tests/conftest.py
# Patches MongoClient with an in-memory mongomock instance BEFORE any app code
# is imported, so the whole test suite runs isolated from the real database —
# no network calls, no risk of touching real customer data.
import os
import sys

import mongomock
import pymongo

pymongo.MongoClient = mongomock.MongoClient  # must happen before `database` is imported

os.environ.setdefault("MONGO_URI", "mongodb://localhost/citimart_test")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key")
os.environ.setdefault("FLASK_DEBUG", "false")

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest

from app import create_app
from database import users_collection


@pytest.fixture
def app():
    application = create_app()
    application.config["TESTING"] = True
    yield application


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture(autouse=True)
def clean_db():
    """mongomock persists data across tests in the same process — wipe collections
    between tests so they stay independent."""
    yield
    from database import (
        users_collection, products_collection, orders_collection,
        wishlist_collection, cart_collection, guest_leads_collection,
        vendors_collection, reviews_collection, offers_collection,
        subusers_collection, faqs_collection, content_snippets_collection,
        media_library_collection, complaints_collection, categories_collection,
        collections_collection, platform_settings_collection, error_logs_collection,
        contact_messages_collection,
    )
    for coll in [users_collection, products_collection, orders_collection,
                 wishlist_collection, cart_collection, guest_leads_collection,
                 vendors_collection, reviews_collection, offers_collection,
                 subusers_collection, faqs_collection, content_snippets_collection,
                 media_library_collection, complaints_collection, categories_collection,
                 collections_collection, platform_settings_collection, error_logs_collection,
                 contact_messages_collection]:
        coll.delete_many({})


@pytest.fixture
def registered_customer(client):
    """Registers a customer and returns (customer_id, auth_token)."""
    client.post("/auth/register", json={
        "name": "Test Customer",
        "email": "customer@test.com",
        "password": "password123",
    })
    login_res = client.post("/auth/login/customer", json={
        "email": "customer@test.com",
        "password": "password123",
    })
    data = login_res.get_json()
    return data["user"]["id"], data["token"]
