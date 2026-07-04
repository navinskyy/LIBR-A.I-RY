from django.urls import path
from .views import book_list, search_books, book_detail

urlpatterns = [
    path('list/', book_list, name='book-list'),
    path('search/', search_books, name='book-search'),
    path('<int:pk>/', book_detail, name='book-detail'),
]
