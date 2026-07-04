from django.urls import path
from .views import (
    reserve_book,
    reservation_history,
    return_book,
    get_recommendations_api,
    all_reservations,
    admin_borrowers_list,
    check_book_availability,
)

urlpatterns = [
    path('reserve/', reserve_book, name='reserve-book'),
    path('history/', reservation_history, name='reservation-history'),
    path('return/<int:pk>/', return_book, name='return-book'),
    path('recommendations/', get_recommendations_api, name='recommendations'),
    path('all/', all_reservations, name='all-reservations'),
    path('admin/borrowers/', admin_borrowers_list, name='admin-borrowers'),
    path('check-availability/', check_book_availability, name='check-availability'),
]
