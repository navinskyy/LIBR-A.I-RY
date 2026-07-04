from pathlib import Path
import os
import django

# Setup Django
BASE_DIR = Path(__file__).resolve().parent.parent
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "library_management.settings")
django.setup()

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
import joblib
from books.models import Book


def train_content_model():
    qs = Book.objects.all().values('id', 'title', 'author', 'genre')
    if not qs:
        print("No books found to train model.")
        return

    df = pd.DataFrame(list(qs))
    df['genre'] = df['genre'].fillna("")
    df['text'] = df['title'] + " " + df['author'] + " " + df['genre']

    vect = TfidfVectorizer(stop_words='english')
    X = vect.fit_transform(df['text'])

    models_dir = BASE_DIR / "recommender" / "models"
    models_dir.mkdir(parents=True, exist_ok=True)

    # Save dataframe + vectorizer + TF‑IDF matrix ONLY (no cosine_similarity here)
    joblib.dump((df, vect, X), models_dir / "content_recommender.joblib")
    print("✅ Content-based model trained and saved.")


if __name__ == "__main__":
    train_content_model()
