# "You may also like" — serves recommendations from the trained similarity
# model in ../citimart-recommender. Loaded once at import time, not per
# request, since loading the joblib artifact is relatively slow.
import os
import sys

from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, jsonify

from database import products_collection

recommend_bp = Blueprint("recommend_bp", __name__)

_RECOMMENDER_SRC = os.path.join(
    os.path.dirname(__file__), "..", "..", "citimart-recommender", "src"
)
sys.path.insert(0, os.path.abspath(_RECOMMENDER_SRC))

_recommender = None
try:
    from recommend import Recommender  # noqa: E402

    _recommender = Recommender()
except Exception as e:  # model not trained yet, or recommender folder missing
    print(f"[recommend] Recommender unavailable, endpoint will return empty results: {e}")


@recommend_bp.route("/api/recommend/<product_id>", methods=["GET"])
def get_recommendations(product_id):
    if _recommender is None:
        return jsonify({"recommendations": []}), 200

    similar = _recommender.similar_to(product_id, k=10)
    if not similar:
        return jsonify({"recommendations": []}), 200

    ids = []
    for item in similar:
        try:
            ids.append(ObjectId(item["product_id"]))
        except InvalidId:
            continue

    docs = list(products_collection.find(
        {"_id": {"$in": ids}, "status": {"$in": ["active", "approved"]}},
        {"name": 1, "price": 1, "discount": 1, "images": 1, "brand": 1,
         "category": 1, "subcategory": 1, "variants": 1},
    ))
    docs_by_id = {str(d["_id"]): d for d in docs}

    results = []
    for item in similar:
        d = docs_by_id.get(item["product_id"])
        if not d:
            continue
        results.append({
            "_id": str(d["_id"]),
            "name": d.get("name"),
            "brand": d.get("brand"),
            "price": d.get("price"),
            "discount": d.get("discount", 0),
            "images": d.get("images") or [],
            "image": d["images"][0] if d.get("images") else None,
            "category": d.get("category"),
            "subcategory": d.get("subcategory"),
            "variants": d.get("variants") or [],
            "score": item["score"],
        })

    return jsonify({"recommendations": results}), 200
