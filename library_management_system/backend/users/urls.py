from django.urls import path
from .views import register, login, profile, change_password, current_user

urlpatterns = [
    path('auth/register/', register, name='register'),
    path('auth/login/', login, name='login'),
    path('auth/profile/', profile, name='profile'),
    path('auth/change-password/', change_password, name='change-password'),
    path('auth/me/', current_user, name='current-user'),
]
