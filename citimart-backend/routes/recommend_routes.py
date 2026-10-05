# "You may also like" — calls the citimart-recommender service, which serves
# recommendations from the trained similarity model. RECOMMENDER_URL is a
# Vercel service binding; it's only populated at request time in a deployed
# function, never at import/build time, so it must be read inside the view.
import os

import requests
from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, jsonify

from database import products_collection

recommend_bp = Blueprint("recommend_bp", __name__)


def _fetch_similar(product_id):
    base_url = os.getenv("RECOMMENDER_URL")
    if not base_url:
        return []
    try:
        resp = requests.get(f"{base_url.rstrip('/')}/similar/{product_id}", timeout=3)
        resp.raise_for_status()
        return resp.json().get("recommendations", [])
    except (requests.RequestException, ValueError) as e:
        print(f"[recommend] citimart-recommender unavailable, returning empty results: {e}")
        return []


@recommend_bp.route("/api/recommend/<product_id>", methods=["GET"])
def get_recommendations(product_id):
    similar = _fetch_similar(product_id)
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
