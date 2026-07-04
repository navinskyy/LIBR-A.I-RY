from rest_framework import serializers
from .models import Reservation


class ReservationSerializer(serializers.ModelSerializer):
    # Book fields
    book_title = serializers.CharField(source='book.title', read_only=True)
    book_author = serializers.CharField(source='book.author', read_only=True)
    book_cover_url = serializers.CharField(
        source='book.cover_url',
        read_only=True,
        allow_blank=True,
        allow_null=True,
    )

    # User fields
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_first_name = serializers.CharField(source='user.first_name', read_only=True)
    user_last_name = serializers.CharField(source='user.last_name', read_only=True)

    # Computed fields
    days_left = serializers.SerializerMethodField()
    is_due_soon = serializers.SerializerMethodField()

    class Meta:
        model = Reservation
        fields = [
            'id',
            # book relation
            'book',
            'book_title',
            'book_author',
            'book_cover_url',
            # user info
            'user_username',
            'user_full_name',
            'user_email',
            'user_first_name',
            'user_last_name',
            # reservation fields
            'borrow_date',
            'due_date',
            'return_date',
            'status',
            # computed
            'days_left',
            'is_due_soon',
        ]

    def get_days_left(self, obj):
        # uses Reservation.days_left property
        return obj.days_left

    def get_is_due_soon(self, obj):
        # due soon = 1–3 days left; adjust if you want to include 0
        if obj.days_left is None:
            return False
        return 1 <= obj.days_left <= 3
