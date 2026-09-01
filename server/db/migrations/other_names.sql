-- Migration: Add other_names column to students and teachers
ALTER TABLE students ADD COLUMN IF NOT EXISTS other_names TEXT;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS other_names TEXT;
