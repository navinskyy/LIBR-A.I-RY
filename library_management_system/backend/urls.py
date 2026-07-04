from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('users.urls')),
    path('api/books/', include('books.urls')),
    path('api/reservations/', include('reservations.urls')),
    path('api/chatbot/', include('chatbot.urls')),
]
