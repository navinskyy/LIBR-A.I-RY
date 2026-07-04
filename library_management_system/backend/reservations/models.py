# reservations/models.py
from datetime import timedelta
from django.conf import settings
from django.db import models
from django.utils import timezone
from books.models import Book

class Reservation(models.Model):
    STATUS_BORROWED = 'borrowed'
    STATUS_RETURNED = 'returned'
    STATUS_OVERDUE = 'overdue'

    STATUS_CHOICES = [
        (STATUS_BORROWED, 'Borrowed'),
        (STATUS_RETURNED, 'Returned'),
        (STATUS_OVERDUE, 'Overdue'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    borrow_date = models.DateTimeField(auto_now_add=True)
    due_date = models.DateTimeField(blank=True, null=True)
    return_date = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=STATUS_BORROWED)

    def save(self, *args, **kwargs):
        if self.borrow_date and not self.due_date:
            self.due_date = self.borrow_date + timedelta(days=7)  # 7‑day loan
        super().save(*args, **kwargs)

    @property
    def days_left(self):
        if not self.due_date:
            return None
        delta = self.due_date - timezone.now()
        return delta.days
