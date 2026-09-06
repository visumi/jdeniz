import { createClient, type Client } from "@libsql/client/node";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { type AuthUser } from "../src/shared";
import { createWorkout, getWorkoutDeadlineStatus, listWorkouts, validateWorkoutInput } from "../src/workouts";

const user: AuthUser = { uid: "user-1", email: "owner@example.com", name: "Professor", picture: null, allowed: true, role: "owner" };
const otherUser: AuthUser = { ...user, uid: "user-2", email: "other@example.com" };

let db: Client;

beforeEach(async () => {
  db = createClient({ url: "file::memory:?cache=shared" });
  await db.executeMultiple(`
    PRAGMA foreign_keys = ON;
    DROP TABLE IF EXISTS workouts;
    DROP TABLE IF EXISTS students;
    DROP TABLE IF EXISTS users;
    CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE);
    CREATE TABLE students (id TEXT PRIMARY KEY, owner_user_id TEXT NOT NULL, name TEXT NOT NULL, FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE);
    CREATE TABLE workouts (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      name TEXT NOT NULL,
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
    CREATE UNIQUE INDEX idx_workouts_one_active_per_student ON workouts (student_id) WHERE active = 1;
    INSERT INTO users (id, email) VALUES ('user-1', 'owner@example.com');
    INSERT INTO users (id, email) VALUES ('user-2', 'other@example.com');
    INSERT INTO students (id, owner_user_id, name) VALUES ('student-1', 'user-1', 'Ana Lima');
  `);
});

afterEach(() => {
  db.close();
});

describe("validateWorkoutInput", () => {
  it("normaliza um treino válido", () => {
    expect(validateWorkoutInput({ name: "  Força base  ", objective: " performance ", frequencyPerWeek: 3, startDate: "2026-09-06", endDate: "2026-10-06", observations: "  Foco em progressão  " })).toEqual({ name: "Força base", objective: "performance", frequencyPerWeek: 3, startDate: "2026-09-06", endDate: "2026-10-06", observations: "Foco em progressão" });
  });

  it("valida objetivo, frequência e datas", () => {
    expect(() => validateWorkoutInput({ objective: "performance", frequencyPerWeek: 3, startDate: "2026-09-06", endDate: "2026-10-06" })).toThrowError("name_required");
    expect(() => validateWorkoutInput({ name: "Treino", objective: "forca", frequencyPerWeek: 3, startDate: "2026-09-06", endDate: "2026-10-06" })).toThrowError("invalid_objective");
    expect(() => validateWorkoutInput({ name: "Treino", objective: "performance", frequencyPerWeek: 8, startDate: "2026-09-06", endDate: "2026-10-06" })).toThrowError("invalid_frequency_per_week");
    expect(() => validateWorkoutInput({ name: "Treino", objective: "performance", frequencyPerWeek: 3, startDate: "2026-02-30", endDate: "2026-10-06" })).toThrowError("invalid_date");
    expect(() => validateWorkoutInput({ name: "Treino", objective: "performance", frequencyPerWeek: 3, startDate: "2026-09-07", endDate: "2026-09-06" })).toThrowError("end_date_before_start_date");
    expect(() => validateWorkoutInput({ name: "Treino", objective: "performance", frequencyPerWeek: 3, startDate: "2026-09-06", endDate: "" })).toThrowError("end_date_required");
  });
});

describe("getWorkoutDeadlineStatus", () => {
  it("classifica os limites do prazo", () => {
    expect(getWorkoutDeadlineStatus("2026-09-05", "2026-09-06")).toBe("expired");
    expect(getWorkoutDeadlineStatus("2026-09-06", "2026-09-06")).toBe("expiring_soon");
    expect(getWorkoutDeadlineStatus("2026-09-13", "2026-09-06")).toBe("expiring_soon");
    expect(getWorkoutDeadlineStatus("2026-09-14", "2026-09-06")).toBe("on_track");
  });
});

describe("workout lifecycle", () => {
  it("mantém um único treino ativo e preserva o histórico", async () => {
    const first = await createWorkout(db, user, "student-1", { name: "Força base", objective: "hipertrofia", frequencyPerWeek: 4, startDate: "2026-09-06", endDate: "2026-10-06" });
    const second = await createWorkout(db, user, "student-1", { name: "Performance", objective: "performance", frequencyPerWeek: 5, startDate: "2026-10-07", endDate: "2026-11-07" });
    const history = await listWorkouts(db, user, "student-1");

    expect(first.active).toBe(true);
    expect(second.active).toBe(true);
    expect(history).toHaveLength(2);
    expect(history.filter((workout) => workout.active)).toHaveLength(1);
    expect(history.find((workout) => workout.id === first.id)?.active).toBe(false);
  });

  it("faz rollback da troca quando o novo treino falha", async () => {
    await createWorkout(db, user, "student-1", { name: "Força base", objective: "hipertrofia", frequencyPerWeek: 4, startDate: "2026-09-06", endDate: "2026-10-06" });
    await db.execute("CREATE TRIGGER fail_workout_insert BEFORE INSERT ON workouts BEGIN SELECT RAISE(ABORT, 'forced_failure'); END");

    await expect(createWorkout(db, user, "student-1", { name: "Performance", objective: "performance", frequencyPerWeek: 5, startDate: "2026-10-07", endDate: "2026-11-07" })).rejects.toThrow("forced_failure");
    const history = await listWorkouts(db, user, "student-1");
    expect(history).toHaveLength(1);
    expect(history[0].active).toBe(true);
  });

  it("isola os treinos pelo dono do aluno", async () => {
    await expect(listWorkouts(db, otherUser, "student-1")).rejects.toThrowError("student_not_found");
    await expect(createWorkout(db, otherUser, "student-1", { name: "Performance", objective: "performance", frequencyPerWeek: 3, startDate: "2026-09-06", endDate: "2026-10-06" })).rejects.toThrowError("student_not_found");
  });
});
