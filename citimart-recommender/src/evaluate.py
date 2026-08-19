# src/evaluate.py
# Leave-one-out hit-rate@k using real purchase history: for each user with 2+
# distinct purchased products, hold out their most recent purchase and check
# whether it appears in the top-k recommendations generated from their
# earlier purchases.
#
# Caveat, stated plainly: with ~19 users and ~51 orders, this evaluates on a
# handful of users at most. Treat the number as a rough sanity check, not a
# statistically reliable metric — it will become meaningful once order volume
# grows into the hundreds/thousands.
import os
import pandas as pd
import numpy as np

from recommend import Recommender

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
K = 10


def evaluate():
    orders_df = pd.read_csv(os.path.join(DATA_DIR, "orders_interactions.csv"))
    if orders_df.empty:
        print("No purchase interactions to evaluate on.")
        return

    orders_df["created_at"] = pd.to_datetime(orders_df["created_at"], errors="coerce")
    rec = Recommender()

    hits, evaluated = 0, 0
    for user_id, grp in orders_df.groupby("user_id"):
        pids = (
            grp.sort_values("created_at")["product_id"]
            .astype(str)
            .drop_duplicates()
            .tolist()
        )
        if len(pids) < 2:
            continue  # need at least 1 history item + 1 held-out target

        *history, target = pids
        evaluated += 1

        # aggregate similarity scores from every item in the user's history
        candidate_scores = {}
        for pid in history:
            for r in rec.similar_to(pid, k=K * 3):
                if r["product_id"] in history:
                    continue
                candidate_scores[r["product_id"]] = max(candidate_scores.get(r["product_id"], 0), r["score"])

        top_k = sorted(candidate_scores.items(), key=lambda x: -x[1])[:K]
        top_k_ids = {pid for pid, _ in top_k}

        if target in top_k_ids:
            hits += 1

    if evaluated == 0:
        print("No users had 2+ distinct purchases — nothing to evaluate yet.")
        return

    hit_rate = hits / evaluated
    print(f"Evaluable users: {evaluated} (out of {orders_df['user_id'].nunique()} total purchasers)")
    print(f"Hit-rate@{K}: {hit_rate:.2%}  ({hits}/{evaluated})")
    print("Note: sample size is small - re-run this after extract.py once order volume grows.")


if __name__ == "__main__":
    evaluate()
