import { createClient, type Client } from "@libsql/client/node";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { type AuthUser } from "../src/shared";
import { createLesson, getStudentAttendanceSummary, updateLesson, updateLessonStatus, validateLessonInput } from "../src/lessons";
import { getTodayDate } from "../src/workouts";

const user: AuthUser = { uid: "user-1", email: "owner@example.com", name: "Professor", picture: null, allowed: true, role: "owner" };
const otherUser: AuthUser = { ...user, uid: "user-2", email: "other@example.com" };
const today = getTodayDate();

let db: Client;

beforeEach(async () => {
  db = createClient({ url: "file::memory:?cache=shared" });
  await db.executeMultiple(`
    PRAGMA foreign_keys = ON;
    DROP TABLE IF EXISTS student_credit_ledger;
    DROP TABLE IF EXISTS lessons;
    DROP TABLE IF EXISTS student_profiles;
    DROP TABLE IF EXISTS students;
    DROP TABLE IF EXISTS users;
    CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE);
    CREATE TABLE students (id TEXT PRIMARY KEY, owner_user_id TEXT NOT NULL, name TEXT NOT NULL, email TEXT, phone TEXT, credits INTEGER NOT NULL DEFAULT 0 CHECK (credits >= 0), updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE);
    CREATE TABLE lessons (id TEXT PRIMARY KEY, student_id TEXT NOT NULL, lesson_date TEXT NOT NULL, start_time TEXT NOT NULL, end_time TEXT NOT NULL, is_makeup INTEGER NOT NULL DEFAULT 0 CHECK (is_makeup IN (0, 1)), status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'absent', 'makeup')), status_updated_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, CHECK (start_time < end_time), FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE);
    CREATE TABLE student_credit_ledger (id TEXT PRIMARY KEY, student_id TEXT NOT NULL, lesson_id TEXT, delta INTEGER NOT NULL CHECK (delta <> 0), reason TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE, FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE SET NULL);
    INSERT INTO users (id, email) VALUES ('user-1', 'owner@example.com'), ('user-2', 'other@example.com');
    INSERT INTO students (id, owner_user_id, name, credits) VALUES ('student-1', 'user-1', 'Ana Lima', 2), ('student-other', 'user-2', 'Outro aluno', 2);
  `);
});

afterEach(() => db.close());

describe("validateLessonInput", () => {
  it("normaliza e valida uma aula", () => {
    expect(validateLessonInput({ studentId: " student-1 ", lessonDate: today, startTime: "08:00", endTime: "09:00", isMakeup: false })).toEqual({ studentId: "student-1", lessonDate: today, startTime: "08:00", endTime: "09:00", isMakeup: false });
  });

  it("rejeita horário invertido e data passada na criação", () => {
    expect(() => validateLessonInput({ studentId: "student-1", lessonDate: today, startTime: "09:00", endTime: "08:00", isMakeup: false })).toThrowError("end_time_before_start_time");
    expect(() => validateLessonInput({ studentId: "student-1", lessonDate: "2020-01-01", startTime: "08:00", endTime: "09:00", isMakeup: false }, { requireFutureOrToday: true })).toThrowError("lesson_date_in_past");
  });
});

describe("lesson lifecycle", () => {
  it("ordena, bloqueia conflitos e mantém o saldo em check-in e falta", async () => {
    const later = await createLesson(db, user, { studentId: "student-1", lessonDate: today, startTime: "10:00", endTime: "11:00", isMakeup: false });
    const earlier = await createLesson(db, user, { studentId: "student-1", lessonDate: today, startTime: "08:00", endTime: "09:00", isMakeup: false });
    await expect(createLesson(db, user, { studentId: "student-1", lessonDate: today, startTime: "08:30", endTime: "09:30", isMakeup: false })).rejects.toThrowError("lesson_time_conflict");

    expect(earlier.startTime).toBe("08:00");
    expect(later.status).toBe("scheduled");
    await updateLessonStatus(db, user, earlier.id, { status: "completed" });
    await updateLessonStatus(db, user, later.id, { status: "absent" });
    const summary = await getStudentAttendanceSummary(db, user, "student-1");
    expect(summary).toEqual({ studentId: "student-1", checkIns: 1, absences: 1, credits: 2 });
  });

  it("gera crédito ao marcar reposição e permite correção idempotente", async () => {
    const lesson = await createLesson(db, user, { studentId: "student-1", lessonDate: today, startTime: "12:00", endTime: "13:00", isMakeup: false });
    await updateLessonStatus(db, user, lesson.id, { status: "makeup" });
    expect((await getStudentAttendanceSummary(db, user, "student-1")).credits).toBe(3);
    await updateLessonStatus(db, user, lesson.id, { status: "makeup" });
    expect((await getStudentAttendanceSummary(db, user, "student-1")).credits).toBe(3);
    await updateLessonStatus(db, user, lesson.id, { status: "completed" });
    expect((await getStudentAttendanceSummary(db, user, "student-1")).credits).toBe(2);
  });

  it("consome e devolve um crédito ao alternar reposição enquanto agendada", async () => {
    const lesson = await createLesson(db, user, { studentId: "student-1", lessonDate: "2099-01-01", startTime: "14:00", endTime: "15:00", isMakeup: false });
    const makeup = await updateLesson(db, user, lesson.id, { studentId: "student-1", lessonDate: "2099-01-01", startTime: "14:30", endTime: "15:30", isMakeup: true });
    expect(makeup.isMakeup).toBe(true);
    expect((await getStudentAttendanceSummary(db, user, "student-1")).credits).toBe(1);
    await updateLesson(db, user, makeup.id, { studentId: "student-1", lessonDate: "2099-01-02", startTime: "14:30", endTime: "15:30", isMakeup: false });
    expect((await getStudentAttendanceSummary(db, user, "student-1")).credits).toBe(2);
  });

  it("não deixa trocar o aluno e isola a aula pelo proprietário", async () => {
    const lesson = await createLesson(db, user, { studentId: "student-1", lessonDate: "2099-02-01", startTime: "08:00", endTime: "09:00", isMakeup: false });
    await expect(updateLesson(db, user, lesson.id, { studentId: "student-other", lessonDate: "2099-02-01", startTime: "08:00", endTime: "09:00", isMakeup: false })).rejects.toThrowError("student_cannot_change");
    await expect(updateLessonStatus(db, otherUser, lesson.id, { status: "completed" })).rejects.toThrowError("lesson_not_found");
  });

  it("permite corrigir uma aula passada, mas bloqueia uma futura", async () => {
    const past = await db.execute({ sql: "INSERT INTO lessons (id, student_id, lesson_date, start_time, end_time) VALUES (?, ?, ?, ?, ?)", args: ["past-lesson", "student-1", "2020-01-01", "08:00", "09:00"] });
    expect(past.rowsAffected).toBe(1);
    await updateLessonStatus(db, user, "past-lesson", { status: "absent" });
    const future = await createLesson(db, user, { studentId: "student-1", lessonDate: "2099-03-01", startTime: "08:00", endTime: "09:00", isMakeup: false });
    await expect(updateLessonStatus(db, user, future.id, { status: "completed" })).rejects.toThrowError("lesson_in_future");
  });
});
