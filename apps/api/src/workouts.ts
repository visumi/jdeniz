import { type Client } from "@libsql/client/web";
import { type AuthUser, type DbRow, HttpError, readDbNullableString, readDbString } from "./shared";

export const WORKOUT_OBJECTIVES = ["hipertrofia", "emagrecimento", "saude_longevidade", "performance", "lesao"] as const;
export type WorkoutObjective = typeof WORKOUT_OBJECTIVES[number];
export type WorkoutDeadlineStatus = "on_track" | "expiring_soon" | "expired";
export type WorkoutOverviewStatus = WorkoutDeadlineStatus | "no_workout";

export interface WorkoutOverviewRow {
  student: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    attendanceMode: "online" | "presencial" | null;
  };
  activeWorkout: {
    id: string;
    name: string;
    objective: WorkoutObjective;
    frequencyPerWeek: number;
    startDate: string;
    endDate: string;
  } | null;
  status: WorkoutOverviewStatus;
}

export interface WorkoutOverviewPage {
  items: WorkoutOverviewRow[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
}

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

  const frequencyPerWeek = payload.frequencyPerWeek;
  if (typeof frequencyPerWeek !== "number" || !Number.isInteger(frequencyPerWeek) || frequencyPerWeek < 1 || frequencyPerWeek > 7) {
    throw new HttpError(400, "invalid_frequency_per_week");
  }

  const startDate = normalizeDate(payload.startDate, "start_date_required");
  const endDate = normalizeDate(payload.endDate, "end_date_required");
  if (endDate < startDate) throw new HttpError(400, "end_date_before_start_date");

  const observations = normalizeOptional(payload.observations);
  if (observations && observations.length > 1000) throw new HttpError(400, "observations_too_long");

  return { name, objective, frequencyPerWeek, startDate, endDate, observations };
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

const workoutOverviewPageSize = 10;

export async function listWorkoutOverview(db: Client, user: AuthUser, options: { page: number; search?: string; status?: WorkoutOverviewStatus }): Promise<WorkoutOverviewPage> {
  const page = Math.max(1, Math.floor(options.page));
  const search = options.search?.trim() || "";
  const status = options.status || "";
  const today = getTodayDate();
  const searchPattern = `%${search}%`;
  const baseSql = `
    WITH overview AS (
      SELECT
        students.id AS student_id,
        students.name AS student_name,
        students.email AS student_email,
        students.phone AS student_phone,
        student_profiles.attendance_mode AS attendance_mode,
        workouts.id AS workout_id,
        workouts.name AS workout_name,
        workouts.objective AS workout_objective,
        workouts.frequency_per_week AS workout_frequency_per_week,
        workouts.start_date AS workout_start_date,
        workouts.end_date AS workout_end_date,
        CASE
          WHEN workouts.id IS NULL THEN 'no_workout'
          WHEN julianday(workouts.end_date) < julianday(?) THEN 'expired'
          WHEN julianday(workouts.end_date) <= julianday(?) + 7 THEN 'expiring_soon'
          ELSE 'on_track'
        END AS status
      FROM students
      LEFT JOIN student_profiles ON student_profiles.student_id = students.id
      LEFT JOIN workouts ON workouts.student_id = students.id AND workouts.active = 1
      WHERE students.owner_user_id = ?
        AND (? = '' OR students.name LIKE ?)
    )`;
  const filterArgs = [today, today, user.uid, search, searchPattern];
  const statusArgs = [status, status];
  const countResult = await db.execute({ sql: `${baseSql} SELECT COUNT(*) AS total FROM overview WHERE (? = '' OR status = ?)`, args: [...filterArgs, ...statusArgs] });
  const total = readDbInteger(countResult.rows[0] as DbRow, "total");
  const pageCount = Math.max(1, Math.ceil(total / workoutOverviewPageSize));
  const currentPage = Math.min(page, pageCount);
  const result = await db.execute({
      sql: `${baseSql} SELECT * FROM overview WHERE (? = '' OR status = ?) ORDER BY CASE status WHEN 'expired' THEN 0 WHEN 'expiring_soon' THEN 1 WHEN 'on_track' THEN 2 ELSE 3 END ASC, CASE WHEN status = 'expired' THEN julianday(workout_end_date) END ASC, CASE WHEN status = 'expiring_soon' THEN julianday(workout_end_date) END ASC, student_name COLLATE NOCASE ASC LIMIT ? OFFSET ?`,
    args: [...filterArgs, ...statusArgs, workoutOverviewPageSize, (currentPage - 1) * workoutOverviewPageSize]
  });

  return { items: result.rows.map((row) => mapWorkoutOverviewRow(row as DbRow)), page: currentPage, pageSize: workoutOverviewPageSize, total, pageCount };
}

export function isWorkoutOverviewStatus(value: string): value is WorkoutOverviewStatus {
  return value === "on_track" || value === "expiring_soon" || value === "expired" || value === "no_workout";
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

function mapWorkoutOverviewRow(row: DbRow): WorkoutOverviewRow {
  const status = readDbString(row, "status");
  if (!isWorkoutOverviewStatus(status)) throw new HttpError(500, "invalid_workout_overview_status");

  const workoutId = readDbNullableString(row, "workout_id");
  const activeWorkout = workoutId
    ? (() => {
        const objective = readDbString(row, "workout_objective");
        if (!isWorkoutObjective(objective)) throw new HttpError(500, "invalid_db_objective");
        const frequencyPerWeek = readDbInteger(row, "workout_frequency_per_week");
        if (frequencyPerWeek < 1 || frequencyPerWeek > 7) throw new HttpError(500, "invalid_db_frequency_per_week");
        return {
          id: workoutId,
          name: readDbString(row, "workout_name"),
          objective,
          frequencyPerWeek,
          startDate: readDbString(row, "workout_start_date"),
          endDate: readDbString(row, "workout_end_date")
        };
      })()
    : null;

  return {
    student: {
      id: readDbString(row, "student_id"),
      name: readDbString(row, "student_name"),
      email: readDbNullableString(row, "student_email"),
      phone: readDbNullableString(row, "student_phone"),
      attendanceMode: readDbNullableString(row, "attendance_mode") as WorkoutOverviewRow["student"]["attendanceMode"]
    },
    activeWorkout,
    status
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
