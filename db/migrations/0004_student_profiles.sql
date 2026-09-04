PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS student_profiles (
  student_id TEXT PRIMARY KEY,
  attendance_mode TEXT CHECK (attendance_mode IN ('online', 'presencial')),
  birth_date TEXT,
  start_date TEXT,
  pathology TEXT,
  observations TEXT,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);
