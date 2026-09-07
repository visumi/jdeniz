PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  lesson_date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  is_makeup INTEGER NOT NULL DEFAULT 0 CHECK (is_makeup IN (0, 1)),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'absent', 'makeup')),
  status_updated_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (length(lesson_date) = 10),
  CHECK (start_time < end_time),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lessons_student_date
  ON lessons (student_id, lesson_date, start_time);

CREATE INDEX IF NOT EXISTS idx_lessons_date_time
  ON lessons (lesson_date, start_time, end_time);

CREATE TABLE IF NOT EXISTS student_credit_ledger (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  lesson_id TEXT,
  delta INTEGER NOT NULL CHECK (delta <> 0),
  reason TEXT NOT NULL CHECK (reason IN ('makeup_scheduled', 'makeup_released', 'makeup_issued', 'status_correction')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_student_credit_ledger_student_created
  ON student_credit_ledger (student_id, created_at DESC);
