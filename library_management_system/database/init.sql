-- Create database (run this first if not created)
CREATE DATABASE IF NOT EXISTS library_db;
USE library_db;

-- Django will create tables via migrations.
-- Do NOT insert sample books here when using CSV.

-- Optional: you can still keep small test data here if you want,
-- but for a big CSV, all real data will come from the Django import command.
