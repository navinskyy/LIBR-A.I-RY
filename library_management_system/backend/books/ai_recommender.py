import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from .models import Book

def get_recommendations(user_id, query=None, top_n=5):
    # Fetch all books
    books = Book.objects.all().values('id', 'title', 'author', 'category', 'description')
    df = pd.DataFrame(books)

    # Simple content-based: TF-IDF on description + category
    tfidf = TfidfVectorizer(stop_words='english')
    tfidf_matrix = tfidf.fit_transform(df['description'] + ' ' + df['category'])

    if query:
        # Recommend based on query similarity
        query_vec = tfidf.transform([query])
        sim_scores = cosine_similarity(query_vec, tfidf_matrix).flatten()
        df['score'] = sim_scores
        recommendations = df.nlargest(top_n, 'score')[['id', 'title', 'author']]
    else:
        # Fallback: Random or category-based (extend with user history from reservations)
        recommendations = df.sample(n=min(top_n, len(df)))[['id', 'title', 'author']]

    return recommendations.to_dict('records')