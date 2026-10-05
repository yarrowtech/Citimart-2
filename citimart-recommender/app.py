# Vercel entrypoint — wraps the Recommender artifact (see src/recommend.py)
# in a tiny HTTP API so citimart-backend can call it as a separate service
# instead of importing it in-process.
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

from flask import Flask, jsonify
from recommend import Recommender

app = Flask(__name__)

_recommender = None
try:
    _recommender = Recommender()
except Exception as e:  # model not trained yet, or artifact missing
    print(f"[citimart-recommender] Recommender unavailable, API will return empty results: {e}")


@app.route("/similar/<product_id>", methods=["GET"])
def similar(product_id):
    if _recommender is None:
        return jsonify({"recommendations": []}), 200
    return jsonify({"recommendations": _recommender.similar_to(product_id, k=10)}), 200


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model_loaded": _recommender is not None}), 200
