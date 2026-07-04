from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('books', '0007_remove_book_category_remove_book_created_at_and_more'),
    ]

    # cover_url already exists in the database, so this migration should do nothing.
    operations = []
