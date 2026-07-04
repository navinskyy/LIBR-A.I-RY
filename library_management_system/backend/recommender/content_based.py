from pathlib import Path
import joblib
import numpy as np
from django.db.models import Count
from books.models import Book
from reservations.models import Reservation

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "recommender" / "models" / "content_recommender.joblib"


def load_content_model():
    if not MODEL_PATH.exists():
        return None, None, None
    df, vect, X = joblib.load(MODEL_PATH)
    return df, vect, X


def recommend_for_user(user, top_n=5):
    df, vect, X = load_content_model()
    if df is None:
        return Book.objects.none()

    borrowed_ids = list(
        Reservation.objects.filter(user=user)
        .values_list("book_id", flat=True)
        .distinct()
    )

    # Cold start: no history → popular books
    if not borrowed_ids:
        return (
            Book.objects.annotate(borrow_count=Count("reservation"))
            .order_by("-borrow_count")[:top_n]
        )

    seed_indices = df[df["id"].isin(borrowed_ids)].index.tolist()
    if not seed_indices:
        return Book.objects.none()

    # Compute cosine similarity only for seed books vs all books
    from sklearn.metrics.pairwise import cosine_similarity

    seed_vectors = X[seed_indices]
    sims = cosine_similarity(seed_vectors, X)  # shape: (num_seeds, num_books)
    scores = sims.mean(axis=0)  # average similarity per book

    df["score"] = scores

    mask_not_borrowed = ~df["id"].isin(borrowed_ids)
    recs = (
        df[mask_not_borrowed]
        .sort_values("score", ascending=False)
        .head(top_n)
    )

    return Book.objects.filter(id__in=recs["id"].tolist())
