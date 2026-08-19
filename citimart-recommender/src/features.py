# src/features.py
# Builds two feature representations from the extracted CSVs:
#   1. Content vectors per product (category/brand/price/discount) — works
#      from day one, no interaction data required.
#   2. A user x product interaction matrix (purchase=3, cart=2, wishlist=1)
#      — collaborative signal. Sparse right now, but the pipeline is ready
#      to improve automatically as more orders/carts/wishlists accumulate.
import os
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import MinMaxScaler
from scipy.sparse import csr_matrix, hstack

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")


def load_products():
    return pd.read_csv(os.path.join(DATA_DIR, "products.csv"))


def load_interactions():
    frames = []
    for fname in ["orders_interactions.csv", "cart_interactions.csv", "wishlist_interactions.csv"]:
        path = os.path.join(DATA_DIR, fname)
        if os.path.exists(path):
            df = pd.read_csv(path)
            if len(df):
                frames.append(df)
    if not frames:
        return pd.DataFrame(columns=["user_id", "product_id", "event", "weight", "created_at"])
    return pd.concat(frames, ignore_index=True)


def build_content_matrix(products_df):
    """One row per product. Combines a TF-IDF text vector (brand+category+
    subcategory+childcategory) with scaled numeric price/discount columns."""
    text = (
        products_df["brand"].fillna("") + " " +
        products_df["category"].fillna("") + " " +
        products_df["subcategory"].fillna("") + " " +
        products_df["childcategory"].fillna("")
    )
    tfidf = TfidfVectorizer()
    text_matrix = tfidf.fit_transform(text)

    numeric = products_df[["price", "discount"]].fillna(0).to_numpy()
    numeric_scaled = MinMaxScaler().fit_transform(numeric)

    content_matrix = hstack([text_matrix, csr_matrix(numeric_scaled)]).tocsr()
    return content_matrix, tfidf


def build_interaction_matrix(interactions_df, products_df):
    """Sparse user x product matrix, summed weights (a user can purchase +
    cart + wishlist the same product — signals stack)."""
    product_ids = products_df["product_id"].tolist()
    pid_to_idx = {pid: i for i, pid in enumerate(product_ids)}

    if interactions_df.empty:
        user_ids = []
    else:
        user_ids = sorted(interactions_df["user_id"].dropna().unique().tolist())
    uid_to_idx = {uid: i for i, uid in enumerate(user_ids)}

    mat = np.zeros((len(user_ids), len(product_ids)), dtype=np.float32)
    for _, row in interactions_df.iterrows():
        uid, pid, w = row["user_id"], str(row["product_id"]), row["weight"]
        if uid in uid_to_idx and pid in pid_to_idx:
            mat[uid_to_idx[uid], pid_to_idx[pid]] += w

    return csr_matrix(mat), uid_to_idx, pid_to_idx
