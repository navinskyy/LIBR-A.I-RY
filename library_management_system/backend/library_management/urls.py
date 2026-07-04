# library_management/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),

    # User authentication + profile + change-password under /api/auth/...
    path('api/', include('users.urls')),

    # Book-related APIs under /api/books/...
    path('api/books/', include('books.urls')),

    # Reservation-related APIs under /api/reservations/...
    path('api/reservations/', include('reservations.urls')),

    # Chatbot APIs under /api/chatbot/...
    path('api/chatbot/', include('chatbot.urls')),
]
