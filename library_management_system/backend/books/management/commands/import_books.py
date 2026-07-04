import csv
from pathlib import Path

from django.core.management.base import BaseCommand
from books.models import Book  # Adjust import if your model location differs

class Command(BaseCommand):
    help = "Import books from a CSV file into books_book table"

    def add_arguments(self, parser):
        parser.add_argument(
            "--path",
            required=True,
            type=str,
            default="database/books.csv",
            help="Path to the CSV file relative to backend/ folder",
        )

    def handle(self, *args, **options):
        csv_path = Path(options["path"])

        if not csv_path.exists():
            self.stderr.write(self.style.ERROR(f"CSV file not found: {csv_path}"))
            return

        created_count = 0
        updated_count = 0

        with csv_path.open(newline="", encoding="latin1") as f:
            reader = csv.DictReader(f)
            header_fields = reader.fieldnames
            headers_lower = [h.lower() for h in header_fields]

            for i, row in enumerate(reader, start=1):
                # Skip rows where all fields are empty or whitespace only
                if all(not (value and value.strip()) for value in row.values()):
                    continue

                # Skip repeated header rows if any appear mid-file
                values = [value.strip().lower() if value else '' for value in row.values()]
                if values == headers_lower:
                    print(f"Skipping repeated header row at line {i}")
                    continue

                if i % 100 == 0:
                    print(f"Processing row {i}")

                book_id = row.get("BookID", "").strip()

                # Skip rows without BookID
                if not book_id:
                    continue

                defaults = {
                    "title": row.get("Title", "").strip(),
                    "author": row.get("Author", "").strip(),
                    "category": row.get("Genre", "").strip(),  # Adjust field name if needed
                    # Add other model fields here
                }

                stock = row.get("Stock", "").strip()
                if stock.isdigit():
                    defaults["available"] = bool(int(stock))
                else:
                    defaults["available"] = False

                # Change 'isbn' below if your model uses a different unique identifier
                obj, created = Book.objects.update_or_create(
                    isbn=book_id,
                    defaults=defaults,
                )

                if created:
                    created_count += 1
                else:
                    updated_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Import finished. Created: {created_count}, Updated: {updated_count}"
            )
        )
