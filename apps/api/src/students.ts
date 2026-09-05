import { type Client } from "@libsql/client/web";
import { type AuthUser, type DbRow, HttpError, readDbNullableString, readDbString } from "./shared";

export interface StudentInput {
  name?: string;
  email?: string | null;
  phone?: string | null;
  attendanceMode?: "online" | "presencial" | null;
  birthDate?: string | null;
  startDate?: string | null;
  observations?: string | null;
}

export interface Student {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  credits: number;
  attendanceMode: "online" | "presencial" | null;
  birthDate: string | null;
  startDate: string | null;
  observations: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ValidatedStudentInput {
  name: string;
  email: string | null;
  phone: string | null;
  credits: number;
  attendanceMode: "online" | "presencial" | null;
  birthDate: string | null;
  startDate: string | null;
  observations: string | null;
}

export function validateStudentInput(payload: StudentInput): ValidatedStudentInput {
  const name = payload.name?.trim();
  if (!name) throw new HttpError(400, "name_required");
  if (name.length > 120) throw new HttpError(400, "name_too_long");
  const email = normalizeOptional(payload.email);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "invalid_email");
  const phone = normalizeOptional(payload.phone);
  if (phone && phone.length > 40) throw new HttpError(400, "phone_too_long");
  const attendanceMode = payload.attendanceMode === "online" || payload.attendanceMode === "presencial" ? payload.attendanceMode : null;
  if (payload.attendanceMode && !attendanceMode) throw new HttpError(400, "invalid_attendance_mode");
  const birthDate = normalizeDate(payload.birthDate);
  const startDate = normalizeDate(payload.startDate);
  const observations = normalizeOptional(payload.observations);
  if (observations && observations.length > 1000) throw new HttpError(400, "observations_too_long");
  return { name, email, phone, credits: 0, attendanceMode, birthDate, startDate, observations };
}

function normalizeOptional(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeDate(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  if (!normalized) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) throw new HttpError(400, "invalid_date");
  return normalized;
}

function mapStudent(row: DbRow): Student {
  return {
    id: readDbString(row, "id"),
    name: readDbString(row, "name"),
    email: readDbNullableString(row, "email"),
    phone: readDbNullableString(row, "phone"),
    credits: readDbInteger(row, "credits"),
    attendanceMode: readDbNullableString(row, "attendance_mode") as Student["attendanceMode"],
    birthDate: readDbNullableString(row, "birth_date"),
    startDate: readDbNullableString(row, "start_date"),
    observations: readDbNullableString(row, "observations"),
    createdAt: readDbString(row, "created_at"),
    updatedAt: readDbString(row, "updated_at")
  };
}

const selectColumns = "students.id, students.name, students.email, students.phone, students.credits, student_profiles.attendance_mode, student_profiles.birth_date, student_profiles.start_date, student_profiles.observations, students.created_at, students.updated_at";
const studentSource = "students LEFT JOIN student_profiles ON student_profiles.student_id = students.id";

export async function listStudents(db: Client, user: AuthUser, search = ""): Promise<Student[]> {
  const normalizedSearch = search.trim();
  const result = normalizedSearch
    ? await db.execute({ sql: `SELECT ${selectColumns} FROM ${studentSource} WHERE students.owner_user_id = ? AND students.name LIKE ? ORDER BY students.name COLLATE NOCASE ASC`, args: [user.uid, `%${normalizedSearch}%`] })
    : await db.execute({ sql: `SELECT ${selectColumns} FROM ${studentSource} WHERE students.owner_user_id = ? ORDER BY students.updated_at DESC, students.name COLLATE NOCASE ASC`, args: [user.uid] });
  return result.rows.map((row) => mapStudent(row as DbRow));
}

export async function getStudent(db: Client, user: AuthUser, id: string): Promise<Student> {
  const result = await db.execute({ sql: `SELECT ${selectColumns} FROM ${studentSource} WHERE students.id = ? AND students.owner_user_id = ? LIMIT 1`, args: [id, user.uid] });
  if (!result.rows[0]) throw new HttpError(404, "student_not_found");
  return mapStudent(result.rows[0] as DbRow);
}

export async function createStudent(db: Client, user: AuthUser, payload: StudentInput): Promise<Student> {
  const input = validateStudentInput(payload);
  const id = crypto.randomUUID();
  await db.execute({ sql: "INSERT INTO students (id, owner_user_id, name, email, phone) VALUES (?, ?, ?, ?, ?)", args: [id, user.uid, input.name, input.email, input.phone] });
  await db.execute({ sql: "INSERT INTO student_profiles (student_id, attendance_mode, birth_date, start_date, observations) VALUES (?, ?, ?, ?, ?)", args: [id, input.attendanceMode, input.birthDate, input.startDate, input.observations] });
  return getStudent(db, user, id);
}

export async function updateStudent(db: Client, user: AuthUser, id: string, payload: StudentInput): Promise<Student> {
  const input = validateStudentInput(payload);
  const result = await db.execute({ sql: "UPDATE students SET name = ?, email = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND owner_user_id = ?", args: [input.name, input.email, input.phone, id, user.uid] });
  if (result.rowsAffected === 0) throw new HttpError(404, "student_not_found");
  await db.execute({ sql: "INSERT INTO student_profiles (student_id, attendance_mode, birth_date, start_date, observations) VALUES (?, ?, ?, ?, ?) ON CONFLICT(student_id) DO UPDATE SET attendance_mode = excluded.attendance_mode, birth_date = excluded.birth_date, start_date = excluded.start_date, observations = excluded.observations", args: [id, input.attendanceMode, input.birthDate, input.startDate, input.observations] });
  return getStudent(db, user, id);
}

export async function deleteStudent(db: Client, user: AuthUser, id: string): Promise<void> {
  const result = await db.execute({ sql: "DELETE FROM students WHERE id = ? AND owner_user_id = ?", args: [id, user.uid] });
  if (result.rowsAffected === 0) throw new HttpError(404, "student_not_found");
}

function readDbInteger(row: DbRow, key: string): number {
  const value = row[key];
  if (typeof value !== "number" || !Number.isInteger(value)) throw new HttpError(500, `invalid_db_${key}`);
  return value;
}
