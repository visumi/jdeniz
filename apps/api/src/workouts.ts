import { type Client } from "@libsql/client/web";
import { type AuthUser, type DbRow, HttpError, readDbNullableString, readDbString } from "./shared";

export const WORKOUT_OBJECTIVES = ["hipertrofia", "emagrecimento", "saude_longevidade", "performance", "lesao"] as const;
export type WorkoutObjective = typeof WORKOUT_OBJECTIVES[number];
export type WorkoutDeadlineStatus = "on_track" | "expiring_soon" | "expired";

export interface WorkoutInput {
  name?: string;
  objective?: string;
  frequencyPerWeek?: number;
  startDate?: string;
  endDate?: string;
  observations?: string | null;
}

export interface Workout extends WorkoutInput {
  id: string;
  studentId: string;
  name: string;
  objective: WorkoutObjective;
  frequencyPerWeek: number;
  startDate: string;
  endDate: string;
  observations: string | null;
  active: boolean;
  deadlineStatus: WorkoutDeadlineStatus;
  createdAt: string;
  updatedAt: string;
}

interface ValidatedWorkoutInput {
  name: string;
  objective: WorkoutObjective;
  frequencyPerWeek: number;
  startDate: string;
  endDate: string;
  observations: string | null;
}

export function validateWorkoutInput(payload: WorkoutInput): ValidatedWorkoutInput {
  const name = normalizeName(payload.name);
  const objective = payload.objective?.trim();
  if (!objective) throw new HttpError(400, "objective_required");
  if (!isWorkoutObjective(objective)) throw new HttpError(400, "invalid_objective");

  if (!Number.isInteger(payload.frequencyPerWeek) || payload.frequencyPerWeek < 1 || payload.frequencyPerWeek > 7) {
    throw new HttpError(400, "invalid_frequency_per_week");
  }

  const startDate = normalizeDate(payload.startDate, "start_date_required");
  const endDate = normalizeDate(payload.endDate, "end_date_required");
  if (endDate < startDate) throw new HttpError(400, "end_date_before_start_date");

  const observations = normalizeOptional(payload.observations);
  if (observations && observations.length > 1000) throw new HttpError(400, "observations_too_long");

  return { name, objective, frequencyPerWeek: payload.frequencyPerWeek, startDate, endDate, observations };
}

export function isWorkoutObjective(value: string): value is WorkoutObjective {
  return (WORKOUT_OBJECTIVES as readonly string[]).includes(value);
}

export function getWorkoutDeadlineStatus(endDate: string, today = getTodayDate()): WorkoutDeadlineStatus {
  const daysUntilEnd = Math.round((dateToUtcMs(endDate) - dateToUtcMs(today)) / 86_400_000);
  if (daysUntilEnd < 0) return "expired";
  if (daysUntilEnd <= 7) return "expiring_soon";
  return "on_track";
}

export function getTodayDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

const selectColumns = "id, student_id, name, objective, frequency_per_week, start_date, end_date, observations, active, created_at, updated_at";

export async function listWorkouts(db: Client, user: AuthUser, studentId: string): Promise<Workout[]> {
  await assertStudentOwnership(db, user, studentId);
  const result = await db.execute({
    sql: `SELECT ${selectColumns} FROM workouts WHERE student_id = ? ORDER BY active DESC, start_date DESC, created_at DESC`,
    args: [studentId]
  });
  return result.rows.map((row) => mapWorkout(row as DbRow));
}

export async function createWorkout(db: Client, user: AuthUser, studentId: string, payload: WorkoutInput): Promise<Workout> {
  const input = validateWorkoutInput(payload);
  await assertStudentOwnership(db, user, studentId);
  const id = crypto.randomUUID();
  const transaction = await db.transaction("write");

  try {
    await transaction.execute({ sql: "UPDATE workouts SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE student_id = ? AND active = 1", args: [studentId] });
    await transaction.execute({
      sql: "INSERT INTO workouts (id, student_id, name, objective, frequency_per_week, start_date, end_date, observations, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)",
      args: [id, studentId, input.name, input.objective, input.frequencyPerWeek, input.startDate, input.endDate, input.observations]
    });
    await transaction.commit();
  } catch (error) {
    try { await transaction.rollback(); } catch { /* preserva o erro original */ }
    throw error;
  }

  const result = await db.execute({ sql: `SELECT ${selectColumns} FROM workouts WHERE id = ? AND student_id = ? LIMIT 1`, args: [id, studentId] });
  if (!result.rows[0]) throw new HttpError(500, "workout_not_created");
  return mapWorkout(result.rows[0] as DbRow);
}

async function assertStudentOwnership(db: Client, user: AuthUser, studentId: string): Promise<void> {
  const result = await db.execute({ sql: "SELECT id FROM students WHERE id = ? AND owner_user_id = ? LIMIT 1", args: [studentId, user.uid] });
  if (!result.rows[0]) throw new HttpError(404, "student_not_found");
}

function mapWorkout(row: DbRow): Workout {
  const objective = readDbString(row, "objective");
  if (!isWorkoutObjective(objective)) throw new HttpError(500, "invalid_db_objective");
  const active = readDbInteger(row, "active");
  if (active !== 0 && active !== 1) throw new HttpError(500, "invalid_db_active");
  const frequencyPerWeek = readDbInteger(row, "frequency_per_week");
  if (frequencyPerWeek < 1 || frequencyPerWeek > 7) throw new HttpError(500, "invalid_db_frequency_per_week");
  const endDate = readDbString(row, "end_date");

  return {
    id: readDbString(row, "id"),
    studentId: readDbString(row, "student_id"),
    name: readDbString(row, "name"),
    objective,
    frequencyPerWeek,
    startDate: readDbString(row, "start_date"),
    endDate,
    observations: readDbNullableString(row, "observations"),
    active: active === 1,
    deadlineStatus: getWorkoutDeadlineStatus(endDate),
    createdAt: readDbString(row, "created_at"),
    updatedAt: readDbString(row, "updated_at")
  };
}

function normalizeOptional(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeName(value: string | null | undefined): string {
  const normalized = value?.trim();
  if (!normalized) throw new HttpError(400, "name_required");
  if (normalized.length > 120) throw new HttpError(400, "name_too_long");
  return normalized;
}

function normalizeDate(value: string | null | undefined, requiredError: string): string {
  const normalized = value?.trim();
  if (!normalized) throw new HttpError(400, requiredError);
  if (!isValidIsoDate(normalized)) throw new HttpError(400, "invalid_date");
  return normalized;
}

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function dateToUtcMs(value: string): number {
  return Date.parse(`${value}T00:00:00Z`);
}

function readDbInteger(row: DbRow, key: string): number {
  const value = row[key];
  if (typeof value !== "number" || !Number.isInteger(value)) throw new HttpError(500, `invalid_db_${key}`);
  return value;
}
