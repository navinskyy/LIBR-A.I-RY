from django.db import models

class Book(models.Model):
    title = models.CharField(max_length=512)
    author = models.CharField(max_length=512, blank=True)
    isbn = models.CharField(max_length=32, unique=True)
    cover_url = models.URLField(blank=True)
    genre = models.CharField(max_length=100, blank=True)

    stock = models.PositiveIntegerField(default=1)            # default 1
    available_count = models.PositiveIntegerField(default=1)  # default 1

    def __str__(self):
        return self.title
