# src/extract.py
# Pulls real data from the live Citimart MongoDB (read-only) and snapshots it
# to data/*.csv so training runs against a stable, offline copy.
import os
import pandas as pd
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")


def _flatten_variants(product):
    variants = product.get("variants") or []
    sizes = sorted({v.get("size") for v in variants if v.get("size")})
    colors = sorted({(v.get("colorName") or v.get("color")) for v in variants if v.get("color") or v.get("colorName")})
    return ", ".join(sizes), ", ".join(colors)


def extract():
    client = MongoClient(MONGO_URI)
    db = client["citimart_db"]

    os.makedirs(DATA_DIR, exist_ok=True)

    # ── Products (content features) ──────────────────────────────────────
    products = list(db["products"].find({}))
    prod_rows = []
    for p in products:
        sizes, colors = _flatten_variants(p)
        prod_rows.append({
            "product_id": str(p["_id"]),
            "name": p.get("name", ""),
            "brand": p.get("brand", ""),
            "category": p.get("category", ""),
            "subcategory": p.get("subcategory", ""),
            "childcategory": p.get("childcategory") or p.get("childCategory", ""),
            "price": float(p.get("price") or 0),
            "discount": float(p.get("discount") or 0),
            "sizes": sizes,
            "colors": colors,
            "status": p.get("status", ""),
        })
    products_df = pd.DataFrame(prod_rows)
    products_df.to_csv(os.path.join(DATA_DIR, "products.csv"), index=False)

    # ── Orders → user-product purchase interactions ──────────────────────
    orders = list(db["orders"].find({}))
    order_rows = []
    for o in orders:
        user_id = str(o.get("customer_id") or "")
        items = o.get("order_items") or []
        created = o.get("created_at")
        for it in items:
            pid = it.get("product_id")
            if not pid or not user_id:
                continue
            order_rows.append({
                "user_id": user_id,
                "product_id": str(pid),
                "event": "purchase",
                "weight": 3,
                "created_at": created,
            })
    orders_df = pd.DataFrame(order_rows)
    orders_df.to_csv(os.path.join(DATA_DIR, "orders_interactions.csv"), index=False)

    # ── Carts → weaker interaction signal ─────────────────────────────────
    carts = list(db["carts"].find({}))
    cart_rows = []
    for c in carts:
        user_id = str(c.get("customer_id") or c.get("user_id") or "")
        items = c.get("items") or c.get("products") or []
        for it in items:
            pid = it.get("product_id") or it.get("_id")
            if not pid or not user_id:
                continue
            cart_rows.append({
                "user_id": user_id, "product_id": str(pid),
                "event": "cart", "weight": 2, "created_at": c.get("created_at"),
            })
    carts_df = pd.DataFrame(cart_rows)
    carts_df.to_csv(os.path.join(DATA_DIR, "cart_interactions.csv"), index=False)

    # ── Wishlists → weakest interaction signal ────────────────────────────
    wishlists = list(db["wishlists"].find({}))
    wish_rows = []
    for w in wishlists:
        user_id = str(w.get("customer_id") or w.get("user_id") or "")
        items = w.get("items") or w.get("products") or []
        for it in items:
            pid = it.get("product_id") or it.get("_id")
            if not pid or not user_id:
                continue
            wish_rows.append({
                "user_id": user_id, "product_id": str(pid),
                "event": "wishlist", "weight": 1, "created_at": w.get("created_at"),
            })
    wish_df = pd.DataFrame(wish_rows)
    wish_df.to_csv(os.path.join(DATA_DIR, "wishlist_interactions.csv"), index=False)

    print(f"products:  {len(products_df)} rows")
    print(f"orders:    {len(orders_df)} interaction rows (from {len(orders)} order docs)")
    print(f"carts:     {len(carts_df)} interaction rows (from {len(carts)} cart docs)")
    print(f"wishlists: {len(wish_df)} interaction rows (from {len(wishlists)} wishlist docs)")
    print(f"Saved to {os.path.abspath(DATA_DIR)}")


if __name__ == "__main__":
    extract()
