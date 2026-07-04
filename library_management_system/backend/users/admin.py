from django.contrib import admin
from .models import CustomUser  # Fixed import

admin.site.register(CustomUser)
  