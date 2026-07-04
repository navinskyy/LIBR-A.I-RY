import os
import re
from collections import defaultdict

from django.conf import settings
from django.db.models import Q
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from openai import OpenAI

from books.models import Book
from reservations.models import Reservation

client = OpenAI(api_key=settings.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY"))


def parse_book_suggestion(reply: str):
    """
    Extract a single "Title" and Author from the AI reply.
    Examples:
      "I recommend \"1984\" by George Orwell."
      1. "Dune" by Frank Herbert
    """
    patterns = [
        r'"([^"]+)"\s*(?:by|BY)\s+([A-Za-z0-9\s\.\-,]+?)(?=\.|,|\n|$)',
        r'book\s+"([^"]+)"\s*(?:by|BY)\s+([A-Za-z0-9\s\.\-,]+?)(?=\.|,|\n|$)',
    ]
    for pat in patterns:
        m = re.search(pat, reply, re.IGNORECASE)
        if m:
            return {"title": m.group(1).strip(), "author": m.group(2).strip()}
    return None


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def chat(request):
    user_message = request.data.get("message")
    history = request.data.get("history", [])
    if not user_message:
        return Response({"error": "Message is required"}, status=status.HTTP_400_BAD_REQUEST)

    user = request.user
    text_lower = user_message.lower()

    # ------- ADMIN INTENTS (staff only, keyword-based) -------
    admin_reply = None
    if user.is_staff:
        tl = text_lower

        has_student = "student" in tl or "students" in tl
        has_borrow = "borrow" in tl  # borrowed/borrowing
        has_overdue = "overdue" in tl
        has_email = "email" in tl or "e-mail" in tl

        # 1) list students who currently have a borrowed book
        if has_student and has_borrow and not has_overdue and not has_email:
            active_statuses = ['borrowed', 'overdue']
            reservations = (
                Reservation.objects
                .filter(status__in=active_statuses)
                .select_related('user', 'book')
                .order_by('user__id', '-borrow_date')
            )

            if not reservations.exists():
                admin_reply = (
                    "There are currently no students with borrowed books. "
                    "If you have any other questions or need assistance, feel free to ask!"
                )
            else:
                grouped = defaultdict(list)
                for r in reservations:
                    key = (r.user.get_full_name() or r.user.username, r.user.email)
                    grouped[key].append(r)

                lines = [
                    "Here are the students who currently have a borrowed book in the library:"
                ]
                for (student_name, email), items in grouped.items():
                    lines.append(f"\n{student_name} ({email}):")
                    for r in items:
                        lines.append(
                            f"- {r.book.title} "
                            f"({r.borrow_date.date()}  |  {r.due_date.date()}  |  {r.status})"
                        )
                admin_reply = "\n".join(lines)

        # 2) list students with overdue books
        elif has_student and has_overdue and not has_email:
            overdue_reservations = (
                Reservation.objects
                .filter(status__in=['borrowed', 'overdue'], due_date__lt=timezone.now())
                .select_related('user', 'book')
                .order_by('user__id', '-due_date')
            )

            if not overdue_reservations.exists():
                admin_reply = (
                    "There are currently no students with overdue books. "
                    "All borrowed items are up to date."
                )
            else:
                grouped = defaultdict(list)
                for r in overdue_reservations:
                    key = (r.user.get_full_name() or r.user.username, r.user.email)
                    grouped[key].append(r)

                lines = ["Here are the students who currently have overdue books:"]
                for (student_name, email), items in grouped.items():
                    lines.append(f"\n{student_name} ({email}):")
                    for r in items:
                        lines.append(
                            f"- {r.book.title} "
                            f"({r.borrow_date.date()}  |  {r.due_date.date()}  |  {r.status})"
                        )
                admin_reply = "\n".join(lines)

        # 3) email students with overdue books – generate email text
        elif has_student and has_overdue and has_email:
            overdue_reservations = (
                Reservation.objects
                .filter(status__in=['borrowed', 'overdue'], due_date__lt=timezone.now())
                .select_related('user', 'book')
            )

            if not overdue_reservations.exists():
                admin_reply = (
                    "There are currently no students with overdue books, "
                    "so no reminder emails were generated."
                )
            else:
                email_body = (
                    "Subject: Reminder: Overdue Library Book\n\n"
                    "Dear Student,\n\n"
                    "Our records show that you currently have one or more overdue "
                    "library books. Please return your overdue items to the library "
                    "as soon as possible to avoid further penalties.\n\n"
                    "If you believe you received this message in error, "
                    "please contact the library staff.\n\n"
                    "Best regards,\n"
                    "Library Team\n"
                )

                grouped = defaultdict(list)
                for r in overdue_reservations:
                    key = (r.user.get_full_name() or r.user.username, r.user.email)
                    grouped[key].append(r)

                recipient_lines = []
                for (student_name, email), items in grouped.items():
                    recipient_lines.append(f"\n{student_name} ({email}):")
                    for r in items:
                        recipient_lines.append(
                            f"- {r.book.title} "
                            f"({r.borrow_date.date()}  |  {r.due_date.date()}  |  {r.status})"
                        )

                admin_reply = (
                    "A reminder email has been generated and is assumed to have been "
                    "sent to all students with overdue books.\n\n"
                    "Here is the email template used:\n\n"
                    f"{email_body}\n"
                    "The following students would receive this email:\n"
                    + "\n".join(recipient_lines)
                )

   
    if admin_reply is not None:
        return Response({
            "reply": admin_reply,
            "book_suggested": None,
        })

    # ------- INTENT DETECTION -------
    is_recommend_request = any(
        w in text_lower for w in ["recommend", "suggest", "pick a book"]
    )
    is_info_request = any(
        p in text_lower
        for p in [
            "what is that book about",
            "what is this book about",
            "what is the book about",
            "what is this about",
            "what is that about",
            "tell me about",
            "explain",
            "summary of",
            "who wrote",
            "genres are available",
            "what genres do you have",
        ]
    )
    if is_info_request:
        is_recommend_request = False

    # detect if the user explicitly mentions "by <author>"
    author_filter = None
    by_match = re.search(r'\bby\s+([A-Za-z][A-Za-z\s\.\-]+)', user_message, re.IGNORECASE)
    if by_match and is_recommend_request:
        author_filter = by_match.group(1).strip()
        print("👤 AUTHOR FILTER DETECTED:", repr(author_filter))

    # ------- 1) CURRENTLY BORROWED (context only) -------
    try:
        borrowed_reservations = Reservation.objects.filter(
            user=user,
            status='borrowed'
        ).select_related('book')[:5]
        borrowed_summary = [f"- {r.book.title} by {r.book.author}" for r in borrowed_reservations]
        user_books_context = (
            "Your currently borrowed books:\n" + "\n".join(borrowed_summary)
            if borrowed_reservations.exists()
            else "You have no currently borrowed books."
        )
    except Exception as e:
        print("❌ Borrowed books error:", e)
        user_books_context = "Unable to fetch your borrowed books."

    # ------- 2) TOPIC MATCH – search DB for matching books -------
    try:
        raw = user_message.strip()
        lower = raw.lower()

        topic_only = None
        if "recommend" in lower and "about" in lower:
            try:
                after_about = raw.split("about", 1)[1].strip()
                topic_only = after_about.rstrip("?.!")
            except Exception:
                topic_only = None

        q = topic_only or raw
        print("🔎 TOPIC QUERY:", repr(q))

        topic_books = Book.objects.none()

        if author_filter:
            author_qs = Book.objects.filter(author__icontains=author_filter)
            if author_qs.exists():
                topic_books = author_qs
                print("✅ AUTHOR MATCHES:", author_qs.count())
            else:
                topic_books = Book.objects.filter(
                    Q(title__icontains=q) |
                    Q(author__icontains=q) |
                    Q(genre__icontains=q)
                )
        else:
            topic_books = Book.objects.filter(
                Q(title__icontains=q) |
                Q(author__icontains=q) |
                Q(genre__icontains=q)
            )

        if not topic_books.exists():
            words = [w.rstrip('?.!,') for w in q.split() if w.strip()]
            print("🔎 TOPIC WORDS:", words)
            for w in words:
                topic_books = Book.objects.filter(
                    Q(title__icontains=w) |
                    Q(author__icontains=w) |
                    Q(genre__icontains=w)
                )
                if topic_books.exists():
                    print("✅ MATCH ON WORD:", w, "COUNT:", topic_books.count())
                    break
    except Exception as e:
        print("❌ Topic search error:", e)
        topic_books = Book.objects.none()

    if topic_books.exists():
        topic_books = topic_books[:10]
        has_topic_match = True
        topic_lines = [
            f"- \"{b.title}\" by {b.author} (genre: {b.genre})"
            for b in topic_books
        ]
        topic_context = (
            "Books in this library matching the topic (by title, author, or genre):\n"
            + "\n".join(topic_lines)
        )
    else:
        has_topic_match = False
        topic_context = (
            "No library books were found that directly match this topic, "
            "but you may still recommend books using your general knowledge."
        )

    # ------- 2b) FULL GENRE LIST FROM DB -------
    try:
        genres_qs = (
            Book.objects
            .exclude(genre__isnull=True)
            .exclude(genre__exact='')
            .values_list('genre', flat=True)
            .distinct()
        )
        all_genres = sorted(genres_qs)
        genres_text = (
            "Distinct genres available in this library's database:\n- "
            + "\n- ".join(all_genres)
            if all_genres
            else "No genres are recorded in the database."
        )
    except Exception as e:
        print("❌ Genre list error:", e)
        all_genres = []
        genres_text = "Unable to retrieve genre list from the database."

    # ------- 3) SYSTEM PROMPT -------
    system_prompt = (
        f"{user_books_context}\n\n"
        f"{topic_context}\n\n"
        f"{genres_text}\n\n"
        "ROLE:\n"
        "- You are a librarian for THIS library.\n\n"
        "INTENT HANDLING:\n"
        "- If the user asks to RECOMMEND or SUGGEST a book, treat it as a RECOMMENDATION REQUEST.\n"
        "- If the user asks what a book is about, or about an author, treat it as an INFORMATION QUESTION.\n"
        "- If the user asks to recommend a book BY a specific author, treat it as a RECOMMENDATION REQUEST FILTERED BY THAT AUTHOR.\n\n"
        "RECOMMENDATION RULES:\n"
        "- If the topic list above contains one or more library books, you MUST recommend one of those as your primary recommendation.\n"
        "- If the topic list above is empty, you MUST still recommend at least one real book using your general knowledge, even if it is not in the library database.\n"
        "- Never respond that you cannot find any books on a topic. Always recommend something relevant.\n"
        "- For RECOMMENDATION REQUESTS FILTERED BY AUTHOR, prefer books whose author matches the requested author name when possible.\n"
        "- Your first line MUST be exactly one book in the format: \"Title\" by Author.\n"
        "- For RECOMMEDATION REQUESTS, Do not suggest books that are already borrowed by the user.\n"
        "- For RECOMMENDATION REQUESTS, If the user didn't specify a topic/genre ask the user first what topic/genre the user wants.\n"
        "- After the first line, if you mention additional recommended books, list them as bullets, one per line, like:\n"
        "  - \"Other Title\" by Other Author\n\n"
        "INFORMATION RULES:\n"
        "- For INFORMATION QUESTIONS, explain or summarize the book or author using your general knowledge.\n"
        "- If the user asks for the list or number of genres, use the genres list from the database above and report the actual genres and count.\n"
        "- When asked about a book that is not in the data base, clarify to the user first that it is not available in our library. But give information about the book. \n"
        "- Do not treat information questions as new recommendations unless the user also asks for suggestions.\n"
    )

    # ------- 4) BUILD MESSAGES WITH HISTORY -------
    messages = [{"role": "system", "content": system_prompt}]
    for msg in history[-20:]:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": user_message})

    try:
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.4,
            max_tokens=400,
        )
        bot_reply = completion.choices[0].message.content.strip()

        # ------- 5) ENRICH RECOMMENDATION FOR BORROW/COVER CARD -------
        book_suggested = None
        if is_recommend_request:
            if has_topic_match:
                book_suggested = parse_book_suggestion(bot_reply)
                if book_suggested:
                    try:
                        title_hint = book_suggested["title"]
                        author_hint = book_suggested["author"]
                        book_obj = (
                            Book.objects
                            .filter(title__icontains=title_hint)
                            .filter(author__icontains=author_hint.split()[0])
                            .first()
                        )
                        if book_obj:
                            book_suggested["id"] = book_obj.id
                            book_suggested["title"] = book_obj.title
                            book_suggested["author"] = book_obj.author
                            book_suggested["cover_url"] = book_obj.cover_url
                            book_suggested["genre"] = book_obj.genre
                            bot_reply = f"\"{book_obj.title}\" by {book_obj.author}."
                        else:
                            book_suggested = None
                    except Exception as e:
                        print("❌ Book lookup for suggestion failed:", e)
                        book_suggested = None
            else:
                book_suggested = None

        return Response({
            "reply": bot_reply,
            "book_suggested": book_suggested,
        })
    except Exception as e:
        print("❌ OPENAI ERROR:", repr(e))
        return Response({"error": f"AI error: {str(e)}"}, status=status.HTTP_502_BAD_GATEWAY)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def related_books(request):
    """
    Return up to 5 books related to the given book,
    based on shared genre and/or author.
    Used by the frontend 'Suggest More' button.
    """
    book_id = request.query_params.get("book_id")
    if not book_id:
        return Response({"error": "book_id is required"}, status=400)

    try:
        base = Book.objects.get(id=book_id)
    except Book.DoesNotExist:
        return Response({"error": "Book not found"}, status=404)

    qs = Book.objects.filter(
        Q(genre__icontains=base.genre) |
        Q(author__icontains=base.author)
    ).exclude(id=base.id).distinct()[:5]

    data = [{
        "id": b.id,
        "title": b.title,
        "author": b.author,
        "genre": b.genre,
        "cover_url": getattr(b, "cover_url", None),
    } for b in qs]

    return Response({"related": data})
