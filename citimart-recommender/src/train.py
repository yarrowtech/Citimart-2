# src/train.py
# Trains item-item similarity from both signals and saves everything needed
# to serve recommendations later. NOT wired into the live app — this only
# writes artifacts to models/. Re-run this after extract.py whenever you
# want to refresh the model with newer real data.
import os
import joblib
from sklearn.metrics.pairwise import cosine_similarity

from features import load_products, load_interactions, build_content_matrix, build_interaction_matrix

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")

# Given how sparse real interaction data is right now (see evaluate.py output),
# content similarity is weighted far more heavily than collaborative similarity.
# Raise CF_WEIGHT over time as orders/carts/wishlists grow.
CONTENT_WEIGHT = 0.75
CF_WEIGHT = 0.25


def train():
    products_df = load_products()
    interactions_df = load_interactions()

    content_matrix, tfidf = build_content_matrix(products_df)
    content_sim = cosine_similarity(content_matrix)

    interaction_matrix, uid_to_idx, pid_to_idx = build_interaction_matrix(interactions_df, products_df)
    if interaction_matrix.shape[0] > 0 and interaction_matrix.nnz > 0:
        # item-item CF similarity = cosine similarity between item columns
        # (i.e. "users who interacted with A also interacted with B")
        cf_sim = cosine_similarity(interaction_matrix.T)
    else:
        cf_sim = None

    if cf_sim is not None:
        blended_sim = CONTENT_WEIGHT * content_sim + CF_WEIGHT * cf_sim
    else:
        blended_sim = content_sim  # pure content fallback — no interaction data yet

    os.makedirs(MODELS_DIR, exist_ok=True)
    joblib.dump({
        "product_ids": products_df["product_id"].tolist(),
        "product_names": products_df["name"].tolist(),
        "content_similarity": content_sim,
        "cf_similarity": cf_sim,
        "blended_similarity": blended_sim,
        "content_weight": CONTENT_WEIGHT,
        "cf_weight": CF_WEIGHT,
        "n_users_with_interactions": interaction_matrix.shape[0],
        "n_interaction_rows": len(interactions_df),
    }, os.path.join(MODELS_DIR, "similarity_model.joblib"))

    print(f"Trained on {len(products_df)} products, "
          f"{interaction_matrix.shape[0]} users with interactions, "
          f"{len(interactions_df)} total interaction rows.")
    print(f"CF signal {'available' if cf_sim is not None else 'unavailable (no interactions) — using content-only'}.")
    print(f"Saved model to {os.path.join(MODELS_DIR, 'similarity_model.joblib')}")


if __name__ == "__main__":
    train()
