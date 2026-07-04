from django.urls import path
from .views import chat, related_books

urlpatterns = [
    path("chat/", chat, name="chat"),
    path('related-books/', related_books, name='related-books'),
    
]
