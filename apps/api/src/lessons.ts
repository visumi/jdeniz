import { type Client } from "@libsql/client/web";
import { getTodayDate } from "./workouts";
import { type AuthUser, type DbRow, HttpError, readDbNullableString, readDbString } from "./shared";

type DbExecutor = Pick<Client, "execute">;

export type LessonStatus = "scheduled" | "completed" | "absent" | "makeup";

export interface LessonInput {
  studentId?: string;
  lessonDate?: string;
  startTime?: string;
  endTime?: string;
  isMakeup?: boolean;
}

export interface LessonStatusInput {
  status?: string;
}

export interface Lesson {
  id: string;
  studentId: string;
  student: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    credits: number;
  };
  lessonDate: string;
  startTime: string;
  endTime: string;
  isMakeup: boolean;
  status: LessonStatus;
  statusUpdatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LessonsDay {
  date: string;
  today: string;
  items: Lesson[];
}

export interface StudentAttendanceSummary {
  studentId: string;
  checkIns: number;
  absences: number;
  credits: number;
}

interface ValidatedLessonInput {
  studentId: string;
  lessonDate: string;
  startTime: string;
  endTime: string;
  isMakeup: boolean;
}

const lessonColumns = `
  lessons.id,
  lessons.student_id,
  lessons.lesson_date,
  lessons.start_time,
  lessons.end_time,
  lessons.is_makeup,
  lessons.status,
  lessons.status_updated_at,
  lessons.created_at,
  lessons.updated_at,
  students.id AS student_id,
  students.name AS student_name,
  students.email AS student_email,
  students.phone AS student_phone,
  students.credits AS student_credits`;

export function validateLessonInput(payload: LessonInput, options: { requireFutureOrToday?: boolean } = {}): ValidatedLessonInput {
  const studentId = payload.studentId?.trim();
  if (!studentId) throw new HttpError(400, "student_required");

  const lessonDate = normalizeDate(payload.lessonDate);
  if (options.requireFutureOrToday && lessonDate < getTodayDate()) throw new HttpError(400, "lesson_date_in_past");

  const startTime = normalizeTime(payload.startTime, "start_time_required");
  const endTime = normalizeTime(payload.endTime, "end_time_required");
  if (endTime <= startTime) throw new HttpError(400, "end_time_before_start_time");
  if (typeof payload.isMakeup !== "boolean") throw new HttpError(400, "invalid_makeup_flag");

  return { studentId, lessonDate, startTime, endTime, isMakeup: payload.isMakeup };
}

export function isLessonStatus(value: string): value is LessonStatus {
  return value === "scheduled" || value === "completed" || value === "absent" || value === "makeup";
}

export async function listLessons(db: Client, user: AuthUser, lessonDate: string): Promise<LessonsDay> {
  if (!isValidIsoDate(lessonDate)) throw new HttpError(400, "invalid_date");
  const result = await db.execute({
    sql: `SELECT ${lessonColumns} FROM lessons INNER JOIN students ON students.id = lessons.student_id WHERE students.owner_user_id = ? AND lessons.lesson_date = ? ORDER BY lessons.start_time ASC, lessons.end_time ASC, students.name COLLATE NOCASE ASC`,
    args: [user.uid, lessonDate]
  });
  return { date: lessonDate, today: getTodayDate(), items: result.rows.map((row) => mapLesson(row as DbRow)) };
}

export async function getStudentAttendanceSummary(db: Client, user: AuthUser, studentId: string): Promise<StudentAttendanceSummary> {
  const result = await db.execute({
    sql: `
      SELECT
        students.id AS student_id,
        students.credits AS credits,
        COALESCE(SUM(CASE WHEN lessons.status = 'completed' THEN 1 ELSE 0 END), 0) AS check_ins,
        COALESCE(SUM(CASE WHEN lessons.status = 'absent' THEN 1 ELSE 0 END), 0) AS absences
      FROM students
      LEFT JOIN lessons ON lessons.student_id = students.id
      WHERE students.id = ? AND students.owner_user_id = ?
      GROUP BY students.id, students.credits
      LIMIT 1`,
    args: [studentId, user.uid]
  });
  if (!result.rows[0]) throw new HttpError(404, "student_not_found");
  const row = result.rows[0] as DbRow;
  return {
    studentId: readDbString(row, "student_id"),
    checkIns: readDbInteger(row, "check_ins"),
    absences: readDbInteger(row, "absences"),
    credits: readDbInteger(row, "credits")
  };
}

export async function createLesson(db: Client, user: AuthUser, payload: LessonInput): Promise<Lesson> {
  const input = validateLessonInput(payload, { requireFutureOrToday: true });
  const id = crypto.randomUUID();
  const transaction = await db.transaction("write");

  try {
    await assertStudentOwnership(transaction, user, input.studentId);
    await assertNoConflict(transaction, user, input, null);

    if (input.isMakeup) {
      const creditUpdate = await transaction.execute({
        sql: "UPDATE students SET credits = credits - 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND owner_user_id = ? AND credits > 0",
        args: [input.studentId, user.uid]
      });
      if (creditUpdate.rowsAffected === 0) throw new HttpError(409, "insufficient_credits_for_makeup");
    }

    await transaction.execute({
      sql: "INSERT INTO lessons (id, student_id, lesson_date, start_time, end_time, is_makeup, status) VALUES (?, ?, ?, ?, ?, ?, 'scheduled')",
      args: [id, input.studentId, input.lessonDate, input.startTime, input.endTime, input.isMakeup ? 1 : 0]
    });

    if (input.isMakeup) await addCreditLedgerEntry(transaction, input.studentId, id, -1, "makeup_scheduled");
    await transaction.commit();
  } catch (error) {
    try { await transaction.rollback(); } catch { /* preserva o erro original */ }
    throw error;
  }

  return getLesson(db, user, id);
}

export async function updateLesson(db: Client, user: AuthUser, id: string, payload: LessonInput): Promise<Lesson> {
  const input = validateLessonInput(payload);
  const transaction = await db.transaction("write");

  try {
    const current = await getLessonRow(transaction, user, id);
    if (current.status !== "scheduled") throw new HttpError(409, "lesson_not_editable");
    if (input.studentId !== current.studentId) throw new HttpError(400, "student_cannot_change");
    await assertNoConflict(transaction, user, input, id);

    const creditDelta = input.isMakeup === current.isMakeup ? 0 : input.isMakeup ? -1 : 1;
    if (creditDelta < 0) {
      const creditUpdate = await transaction.execute({
        sql: "UPDATE students SET credits = credits - 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND owner_user_id = ? AND credits > 0",
        args: [current.studentId, user.uid]
      });
      if (creditUpdate.rowsAffected === 0) throw new HttpError(409, "insufficient_credits_for_makeup");
    } else if (creditDelta > 0) {
      await transaction.execute({ sql: "UPDATE students SET credits = credits + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND owner_user_id = ?", args: [current.studentId, user.uid] });
    }

    await transaction.execute({
      sql: "UPDATE lessons SET lesson_date = ?, start_time = ?, end_time = ?, is_makeup = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND student_id = ?",
      args: [input.lessonDate, input.startTime, input.endTime, input.isMakeup ? 1 : 0, id, current.studentId]
    });
    if (creditDelta !== 0) await addCreditLedgerEntry(transaction, current.studentId, id, creditDelta, creditDelta < 0 ? "makeup_scheduled" : "makeup_released");
    await transaction.commit();
  } catch (error) {
    try { await transaction.rollback(); } catch { /* preserva o erro original */ }
    throw error;
  }

  return getLesson(db, user, id);
}

export async function updateLessonStatus(db: Client, user: AuthUser, id: string, payload: LessonStatusInput): Promise<Lesson> {
  const status = payload.status?.trim();
  if (!status || !isLessonStatus(status) || status === "scheduled") throw new HttpError(400, "invalid_lesson_status");

  const transaction = await db.transaction("write");
  try {
    const current = await getLessonRow(transaction, user, id);
    if (current.lessonDate > getTodayDate()) throw new HttpError(409, "lesson_in_future");
    if (current.isMakeup && status === "makeup") throw new HttpError(400, "makeup_lesson_cannot_be_reposed");
    if (current.status === status) {
      await transaction.rollback();
      return getLesson(db, user, id);
    }

    const creditDelta = creditEffect(current.isMakeup, status) - creditEffect(current.isMakeup, current.status);
    if (creditDelta < 0) {
      const creditUpdate = await transaction.execute({
        sql: "UPDATE students SET credits = credits - 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND owner_user_id = ? AND credits > 0",
        args: [current.studentId, user.uid]
      });
      if (creditUpdate.rowsAffected === 0) throw new HttpError(409, "insufficient_credits_for_status_correction");
    } else if (creditDelta > 0) {
      await transaction.execute({ sql: "UPDATE students SET credits = credits + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND owner_user_id = ?", args: [current.studentId, user.uid] });
    }

    await transaction.execute({ sql: "UPDATE lessons SET status = ?, status_updated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND student_id = ?", args: [status, id, current.studentId] });
    if (creditDelta !== 0) await addCreditLedgerEntry(transaction, current.studentId, id, creditDelta, current.status === "scheduled" && status === "makeup" ? "makeup_issued" : "status_correction");
    await transaction.commit();
  } catch (error) {
    try { await transaction.rollback(); } catch { /* preserva o erro original */ }
    throw error;
  }

  return getLesson(db, user, id);
}

async function getLesson(db: DbExecutor, user: AuthUser, id: string): Promise<Lesson> {
  return mapLesson(await getLessonRow(db, user, id));
}

async function getLessonRow(db: DbExecutor, user: AuthUser, id: string): Promise<DbRow & { studentId: string; lessonDate: string; isMakeup: boolean; status: LessonStatus }> {
  const result = await db.execute({ sql: `SELECT ${lessonColumns} FROM lessons INNER JOIN students ON students.id = lessons.student_id WHERE lessons.id = ? AND students.owner_user_id = ? LIMIT 1`, args: [id, user.uid] });
  if (!result.rows[0]) throw new HttpError(404, "lesson_not_found");
  const lesson = mapLesson(result.rows[0] as DbRow);
  return Object.assign(result.rows[0] as DbRow, { studentId: lesson.studentId, lessonDate: lesson.lessonDate, isMakeup: lesson.isMakeup, status: lesson.status });
}

async function assertStudentOwnership(db: DbExecutor, user: AuthUser, studentId: string): Promise<void> {
  const result = await db.execute({ sql: "SELECT id FROM students WHERE id = ? AND owner_user_id = ? LIMIT 1", args: [studentId, user.uid] });
  if (!result.rows[0]) throw new HttpError(404, "student_not_found");
}

async function assertNoConflict(db: DbExecutor, user: AuthUser, input: ValidatedLessonInput, excludeId: string | null): Promise<void> {
  const result = await db.execute({
    sql: `SELECT lessons.id FROM lessons INNER JOIN students ON students.id = lessons.student_id WHERE students.owner_user_id = ? AND lessons.lesson_date = ? AND lessons.start_time < ? AND lessons.end_time > ? AND (? IS NULL OR lessons.id <> ?) LIMIT 1`,
    args: [user.uid, input.lessonDate, input.endTime, input.startTime, excludeId, excludeId]
  });
  if (result.rows[0]) throw new HttpError(409, "lesson_time_conflict");
}

async function addCreditLedgerEntry(db: DbExecutor, studentId: string, lessonId: string, delta: number, reason: "makeup_scheduled" | "makeup_released" | "makeup_issued" | "status_correction"): Promise<void> {
  await db.execute({ sql: "INSERT INTO student_credit_ledger (id, student_id, lesson_id, delta, reason) VALUES (?, ?, ?, ?, ?)", args: [crypto.randomUUID(), studentId, lessonId, delta, reason] });
}

function mapLesson(row: DbRow): Lesson {
  const status = readDbString(row, "status");
  if (!isLessonStatus(status)) throw new HttpError(500, "invalid_db_lesson_status");
  const isMakeup = readDbInteger(row, "is_makeup");
  if (isMakeup !== 0 && isMakeup !== 1) throw new HttpError(500, "invalid_db_is_makeup");
  return {
    id: readDbString(row, "id"),
    studentId: readDbString(row, "student_id"),
    student: {
      id: readDbString(row, "student_id"),
      name: readDbString(row, "student_name"),
      email: readDbNullableString(row, "student_email"),
      phone: readDbNullableString(row, "student_phone"),
      credits: readDbInteger(row, "student_credits")
    },
    lessonDate: readDbString(row, "lesson_date"),
    startTime: readDbString(row, "start_time"),
    endTime: readDbString(row, "end_time"),
    isMakeup: isMakeup === 1,
    status,
    statusUpdatedAt: readDbNullableString(row, "status_updated_at"),
    createdAt: readDbString(row, "created_at"),
    updatedAt: readDbString(row, "updated_at")
  };
}

function creditEffect(isMakeupLesson: boolean, status: LessonStatus): number {
  if (isMakeupLesson || status !== "makeup") return 0;
  return 1;
}

function normalizeDate(value: string | null | undefined): string {
  const normalized = value?.trim();
  if (!normalized) throw new HttpError(400, "lesson_date_required");
  if (!isValidIsoDate(normalized)) throw new HttpError(400, "invalid_date");
  return normalized;
}

function normalizeTime(value: string | null | undefined, requiredError: string): string {
  const normalized = value?.trim();
  if (!normalized) throw new HttpError(400, requiredError);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(normalized)) throw new HttpError(400, "invalid_time");
  return normalized;
}

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function readDbInteger(row: DbRow, key: string): number {
  const value = row[key];
  if (typeof value !== "number" || !Number.isInteger(value)) throw new HttpError(500, `invalid_db_${key}`);
  return value;
}
