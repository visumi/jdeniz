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

for (const file of files) {
  console.log(`Aplicando ${file}`);
  await db.executeMultiple(await readFile(join(directory, file), "utf8"));
}

console.log("Migrações concluídas.");
