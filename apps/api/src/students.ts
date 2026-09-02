import { type Client } from "@libsql/client/web";
import { type AuthUser, type DbRow, HttpError, readDbNullableString, readDbString } from "./shared";

export interface StudentInput {
  name?: string;
  email?: string | null;
  phone?: string | null;
}

export interface Student {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ValidatedStudentInput {
  name: string;
  email: string | null;
  phone: string | null;
}

export function validateStudentInput(payload: StudentInput): ValidatedStudentInput {
  const name = payload.name?.trim();
  if (!name) throw new HttpError(400, "name_required");
  if (name.length > 120) throw new HttpError(400, "name_too_long");
  const email = normalizeOptional(payload.email);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "invalid_email");
  const phone = normalizeOptional(payload.phone);
  if (phone && phone.length > 40) throw new HttpError(400, "phone_too_long");
  return { name, email, phone };
}

function normalizeOptional(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function mapStudent(row: DbRow): Student {
  return {
    id: readDbString(row, "id"),
    name: readDbString(row, "name"),
    email: readDbNullableString(row, "email"),
    phone: readDbNullableString(row, "phone"),
    createdAt: readDbString(row, "created_at"),
    updatedAt: readDbString(row, "updated_at")
  };
}

const selectColumns = "id, name, email, phone, created_at, updated_at";

export async function listStudents(db: Client, user: AuthUser, search = ""): Promise<Student[]> {
  const normalizedSearch = search.trim();
  const result = normalizedSearch
    ? await db.execute({ sql: `SELECT ${selectColumns} FROM students WHERE owner_user_id = ? AND name LIKE ? ORDER BY name COLLATE NOCASE ASC`, args: [user.uid, `%${normalizedSearch}%`] })
    : await db.execute({ sql: `SELECT ${selectColumns} FROM students WHERE owner_user_id = ? ORDER BY updated_at DESC, name COLLATE NOCASE ASC`, args: [user.uid] });
  return result.rows.map((row) => mapStudent(row as DbRow));
}

export async function getStudent(db: Client, user: AuthUser, id: string): Promise<Student> {
  const result = await db.execute({ sql: `SELECT ${selectColumns} FROM students WHERE id = ? AND owner_user_id = ? LIMIT 1`, args: [id, user.uid] });
  if (!result.rows[0]) throw new HttpError(404, "student_not_found");
  return mapStudent(result.rows[0] as DbRow);
}

export async function createStudent(db: Client, user: AuthUser, payload: StudentInput): Promise<Student> {
  const input = validateStudentInput(payload);
  const id = crypto.randomUUID();
  await db.execute({ sql: "INSERT INTO students (id, owner_user_id, name, email, phone) VALUES (?, ?, ?, ?, ?)", args: [id, user.uid, input.name, input.email, input.phone] });
  return getStudent(db, user, id);
}

export async function updateStudent(db: Client, user: AuthUser, id: string, payload: StudentInput): Promise<Student> {
  const input = validateStudentInput(payload);
  const result = await db.execute({ sql: "UPDATE students SET name = ?, email = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND owner_user_id = ?", args: [input.name, input.email, input.phone, id, user.uid] });
  if (result.rowsAffected === 0) throw new HttpError(404, "student_not_found");
  return getStudent(db, user, id);
}
