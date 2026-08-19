# src/recommend.py
# Loads the trained artifact and serves "similar products" recommendations.
# Not wired into the live app yet — this is the module that would get called
# from a new Flask route (or a batch job) when you're ready to switch it on.
import os
import joblib
import numpy as np

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")


class Recommender:
    def __init__(self, model_path=None):
        model_path = model_path or os.path.join(MODELS_DIR, "similarity_model.joblib")
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"No trained model at {model_path} — run train.py first.")
        artifact = joblib.load(model_path)
        self.product_ids = artifact["product_ids"]
        self.product_names = artifact["product_names"]
        self.sim = artifact["blended_similarity"]
        self._pid_to_idx = {pid: i for i, pid in enumerate(self.product_ids)}

    def similar_to(self, product_id, k=10):
        """Top-k products similar to the given product_id, most similar first."""
        idx = self._pid_to_idx.get(product_id)
        if idx is None:
            return []
        scores = self.sim[idx].copy()
        scores[idx] = -1  # exclude itself
        top_idx = np.argsort(scores)[::-1][:k]
        return [
            {"product_id": self.product_ids[i], "name": self.product_names[i], "score": float(scores[i])}
            for i in top_idx if scores[i] > 0
        ]


if __name__ == "__main__":
    rec = Recommender()
    if rec.product_ids:
        sample_id = rec.product_ids[0]
        print(f"Similar to '{rec.product_names[0]}' ({sample_id}):")
        for r in rec.similar_to(sample_id, k=5):
            print(f"  {r['score']:.3f}  {r['name']}  ({r['product_id']})")
