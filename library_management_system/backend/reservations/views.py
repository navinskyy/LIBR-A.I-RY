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
from books.ai_recommender import get_recommendations


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reserve_book(request):
    book_id = request.data.get('book_id')
    if not book_id:
        return Response({'error': 'Missing book_id'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        book = Book.objects.get(id=book_id)
    except Book.DoesNotExist:
        return Response({'error': 'Book not found'}, status=status.HTTP_404_NOT_FOUND)

    # Block if any active reservation exists for this book
    active_statuses = [
        getattr(Reservation, 'STATUS_BORROWED', 'borrowed'),
        getattr(Reservation, 'STATUS_OVERDUE', 'overdue'),
    ]
    if Reservation.objects.filter(book=book, status__in=active_statuses).exists():
        return Response(
            {'error': 'Book is not available'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Defensive stock check
    if getattr(book, "available_count", 0) <= 0:
        return Response(
            {'error': 'No available book in stock'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # 7‑day loan period
    reservation = Reservation.objects.create(
        user=request.user,
        book=book,
        due_date=timezone.now() + timedelta(days=7),
        status=getattr(Reservation, 'STATUS_BORROWED', 'borrowed'),
    )

    book.available_count -= 1
    book.save()

    serializer = ReservationSerializer(reservation)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reservation_history(request):
    """
    Returns current user's active reservations (borrowed + overdue),
    including computed days_left and is_due_soon from the serializer.
    """
    active_statuses = [
        getattr(Reservation, 'STATUS_BORROWED', 'borrowed'),
        getattr(Reservation, 'STATUS_OVERDUE', 'overdue'),
    ]
    reservations = (
        Reservation.objects
        .filter(user=request.user, status__in=active_statuses)
        .order_by('-borrow_date')
    )
    serializer = ReservationSerializer(reservations, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def return_book(request, pk):
    try:
        reservation = Reservation.objects.get(pk=pk, user=request.user)
    except Reservation.DoesNotExist:
        return Response({'error': 'Reservation not found'}, status=status.HTTP_404_NOT_FOUND)

    reservation.return_date = timezone.now()
    # Once the user returns the book, always mark as returned
    reservation.status = getattr(Reservation, 'STATUS_RETURNED', 'returned')
    reservation.save()

    book = reservation.book
    book.available_count += 1
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
@permission_classes([IsAdminUser])
def all_reservations(request):
    """
    Admin view with backend pagination for all reservations
    (borrowed, overdue, returned, etc.).
    Also adds 'overdue_unreturned' so the frontend can show OVERDUE
    in the 'Returned On' column when appropriate.
    """
    qs = Reservation.objects.all().order_by('-borrow_date')

    # Read page and page_size from query params
    try:
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 15))
    except ValueError:
        return Response({'error': 'Invalid page or page_size'}, status=status.HTTP_400_BAD_REQUEST)

    if page < 1:
        page = 1
    if page_size <= 0:
        page_size = 15

    total = qs.count()
    start = (page - 1) * page_size
    end = start + page_size

    reservations = qs[start:end]
    serializer = ReservationSerializer(reservations, many=True)
    data = list(serializer.data)

    # flag: overdue and not yet returned
    now = timezone.now()
    for item, obj in zip(data, reservations):
        item['overdue_unreturned'] = (
            obj.return_date is None
            and obj.due_date is not None
            and obj.due_date < now
        )

    return Response({
        'results': data,
        'page': page,
        'page_size': page_size,
        'total': total,
        'total_pages': (total + page_size - 1) // page_size,
    })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_borrowers_list(request):
    """
    List all students who currently borrowed or have overdue books.
    Admin/staff only.
    """
    active_statuses = [
        getattr(Reservation, 'STATUS_BORROWED', 'borrowed'),
        getattr(Reservation, 'STATUS_OVERDUE', 'overdue'),
    ]

    reservations = (
        Reservation.objects
        .filter(status__in=active_statuses)
        .select_related('user', 'book')
        .order_by('-borrow_date')
    )

    data = []
    for r in reservations:
        data.append({
            "student": r.user.get_full_name() or r.user.username,
            "email": r.user.email,
            "book_title": r.book.title,
            "borrow_date": r.borrow_date,
            "due_date": r.due_date,
            "status": r.status,
        })

    return Response({"results": data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_book_availability(request):
    """
    Check if a book is available to borrow.
    Returns:
      - status: 'available', 'unavailable', or 'not_found'
      - user_has_book: True if current user already borrowed it
      - borrower_username: who currently borrowed it (for admins)
    """
    title = request.query_params.get('title', '').strip()
    if not title:
        return Response({'error': 'title is required'}, status=400)

    # 1) find book by title
    book = Book.objects.filter(title__icontains=title).first()
    if not book:
        return Response({'status': 'not_found'})

    # 2) who is currently borrowing it?
    active_statuses = [
        getattr(Reservation, 'STATUS_BORROWED', 'borrowed'),
        getattr(Reservation, 'STATUS_OVERDUE', 'overdue'),
    ]
    active_res = (
        Reservation.objects
        .filter(book=book, status__in=active_statuses)
        .select_related('user')
        .first()
    )

    # 3) does current user already have this book?
    user_has_book = Reservation.objects.filter(
        book=book,
        user=request.user,
        status__in=active_statuses,
    ).exists()

    data = {
        'status': 'available' if not active_res else 'unavailable',
        'book_title': book.title,
        'user_has_book': user_has_book,
    }

    if active_res:
        data['borrower_username'] = active_res.user.username

    return Response(data)
