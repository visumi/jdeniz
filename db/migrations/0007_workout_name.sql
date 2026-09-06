PRAGMA foreign_keys = ON;

ALTER TABLE workouts
  ADD COLUMN name TEXT NOT NULL DEFAULT 'Treino sem nome'
  CHECK (length(trim(name)) BETWEEN 1 AND 120);

UPDATE workouts
SET name = CASE objective
  WHEN 'hipertrofia' THEN 'Treino de hipertrofia'
  WHEN 'emagrecimento' THEN 'Treino de emagrecimento'
  WHEN 'saude_longevidade' THEN 'Treino de saúde e longevidade'
  WHEN 'performance' THEN 'Treino de performance'
  WHEN 'lesao' THEN 'Treino de lesão'
  ELSE name
END
WHERE name = 'Treino sem nome';
