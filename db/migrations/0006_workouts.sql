PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS workouts (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  objective TEXT NOT NULL CHECK (objective IN ('hipertrofia', 'emagrecimento', 'saude_longevidade', 'performance', 'lesao')),
  frequency_per_week INTEGER NOT NULL CHECK (frequency_per_week BETWEEN 1 AND 7),
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL CHECK (end_date >= start_date),
  observations TEXT,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_workouts_student_history
  ON workouts (student_id, start_date DESC, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_workouts_one_active_per_student
  ON workouts (student_id)
  WHERE active = 1;
