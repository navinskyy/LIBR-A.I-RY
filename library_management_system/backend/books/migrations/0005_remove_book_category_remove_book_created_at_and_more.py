from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('books', '0004_remove_book_available_book_available_count_and_more'),
    ]

    operations = [
        # Keep only the safe alters, no AddField, no RemoveField, no title/author alters

        migrations.AlterField(
            model_name='book',
            name='available_count',
            field=models.PositiveIntegerField(),
        ),
        migrations.AlterField(
            model_name='book',
            name='isbn',
            field=models.CharField(max_length=32, unique=True),
        ),
        migrations.AlterField(
            model_name='book',
            name='stock',
            field=models.PositiveIntegerField(),
        ),
        # if you still have an AlterField for title here, delete it
    ]
