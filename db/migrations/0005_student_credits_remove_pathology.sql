PRAGMA foreign_keys = ON;

ALTER TABLE students
  ADD COLUMN credits INTEGER NOT NULL DEFAULT 0 CHECK (credits >= 0);

ALTER TABLE student_profiles
  DROP COLUMN pathology;
