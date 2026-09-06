import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { createClient } from "@libsql/client/node";

const url = process.env.TURSO_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  throw new Error("TURSO_URL e TURSO_AUTH_TOKEN precisam estar configurados.");
}

const db = createClient({ url, authToken });
const directory = join(process.cwd(), "db", "migrations");
const files = (await readdir(directory)).filter((file) => file.endsWith(".sql")).sort();

await db.execute(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    name TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

for (const file of files) {
  const applied = await db.execute({ sql: "SELECT name FROM schema_migrations WHERE name = ? LIMIT 1", args: [file] });
  if (applied.rows.length > 0) {
    console.log(`Ignorando ${file} (já aplicada)`);
    continue;
  }

  console.log(`Aplicando ${file}`);
  if (file === "0005_student_credits_remove_pathology.sql") {
    await applyStudentCreditsMigration();
  } else {
    await db.executeMultiple(await readFile(join(directory, file), "utf8"));
  }
  await db.execute({ sql: "INSERT INTO schema_migrations (name) VALUES (?)", args: [file] });
}

console.log("Migrações concluídas.");

async function applyStudentCreditsMigration() {
  const studentsColumns = await getTableColumns("students");
  if (!studentsColumns.has("credits")) {
    await db.execute("ALTER TABLE students ADD COLUMN credits INTEGER NOT NULL DEFAULT 0 CHECK (credits >= 0)");
  }

  const profileColumns = await getTableColumns("student_profiles");
  if (profileColumns.has("pathology")) {
    await db.execute("ALTER TABLE student_profiles DROP COLUMN pathology");
  }
}

async function getTableColumns(tableName) {
  const result = await db.execute(`PRAGMA table_info(${tableName})`);
  return new Set(result.rows.map((row) => String(row.name)));
}
