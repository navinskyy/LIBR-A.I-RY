from datetime import timedelta

from django.utils import timezone
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response

from reservations.models import Reservation
from reservations.serializers import ReservationSerializer
from books.models import Book
from books.serializers import BookSerializer
from books.ai_recommender import get_recommendations


@api_view(['GET'])
def book_list(request):
    books = Book.objects.all()
    serializer = BookSerializer(books, many=True)
    return Response(serializer.data)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated, IsAdminUser])
def book_detail(request, pk):
    """
    Admin-only detail/update for a single book.
    GET  /api/books/<id>/
    PUT  /api/books/<id>/
    """
    try:
        book = Book.objects.get(pk=pk)
    except Book.DoesNotExist:
        return Response({'detail': 'Book not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = BookSerializer(book)
        return Response(serializer.data)

    serializer = BookSerializer(book, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reserve_book(request):
    book_id = request.data.get('book_id')
    if not book_id:
        return Response({'error': 'Missing book_id'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        book = Book.objects.get(id=book_id, available=True)
        reservation = Reservation.objects.create(
            user=request.user,
            book=book,
            # 7‑day loan period to match Reservation model
            due_date=timezone.now() + timedelta(days=7)
        )
        book.available = False
        book.save()
        serializer = ReservationSerializer(reservation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Book.DoesNotExist:
        return Response({'error': 'Book not available'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reservation_history(request):
    # you can keep full history or filter to active; this is full history
    reservations = Reservation.objects.filter(user=request.user).order_by('-borrow_date')
    serializer = ReservationSerializer(reservations, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def return_book(request, pk):
    try:
        reservation = Reservation.objects.get(pk=pk, user=request.user, status='borrowed')
    except Reservation.DoesNotExist:
        return Response({'error': 'Reservation not found'}, status=status.HTTP_404_NOT_FOUND)

    reservation.return_date = timezone.now()
    reservation.status = 'returned' if reservation.return_date <= reservation.due_date else 'overdue'
    reservation.save()

    book = reservation.book
    book.available = True
    book.save()

    serializer = ReservationSerializer(reservation)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_recommendations_api(request):
    query = request.GET.get('query', '')
    user_id = request.user.id
    recs = get_recommendations(user_id, query)
    return Response(recs)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def all_reservations(request):
    reservations = Reservation.objects.all().order_by('-borrow_date')
    serializer = ReservationSerializer(reservations, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def search_books(request):
    query = request.GET.get('q', '')
    if query:
        books = Book.objects.filter(
            Q(title__icontains=query) |
            Q(author__icontains=query) |
            Q(genre__icontains=query)
        )
    else:
        books = Book.objects.all()
    serializer = BookSerializer(books, many=True)
    return Response(serializer.data)
