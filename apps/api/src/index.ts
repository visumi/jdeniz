import {
  authenticate,
  createAccessGrant,
  ensureOwnerAccessGrant,
  listAccessGrants,
  requireOwner,
  resolveAuthenticatedUser,
  updateAccessGrant,
  upsertUser,
  type AccessGrantInput,
  type AccessGrantPatchInput
} from "./access";
import { createDatabaseClient, type Env, HttpError } from "./shared";
import { createStudent, deleteStudent, getStudent, listStudents, updateStudent, type StudentInput } from "./students";

const jsonHeaders = { "Content-Type": "application/json; charset=utf-8" };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return handleRequest(request, env);
  }
} satisfies ExportedHandler<Env>;

export async function handleRequest(request: Request, env: Env): Promise<Response> {
  const corsHeaders = buildCorsHeaders(request, env);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

  try {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/health") return json({ ok: true, service: "jdeniz-api" }, 200, corsHeaders);

    const identity = await authenticate(request, env);
    const db = createDatabaseClient(env);
    const user = await resolveAuthenticatedUser(db, identity, env);

    if (request.method === "GET" && url.pathname === "/me") return json(user, 200, corsHeaders);
    if (!user.allowed) return json({ error: "forbidden" }, 403, corsHeaders);
    await upsertUser(db, user);

    if (url.pathname === "/students") {
      if (request.method === "GET") return json(await listStudents(db, user, url.searchParams.get("search") || ""), 200, corsHeaders);
      if (request.method === "POST") return json(await createStudent(db, user, await readJson<StudentInput>(request)), 201, corsHeaders);
    }

    const studentMatch = url.pathname.match(/^\/students\/([^/]+)$/);
    if (studentMatch) {
      const studentId = decodeURIComponent(studentMatch[1]);
      if (request.method === "GET") return json(await getStudent(db, user, studentId), 200, corsHeaders);
      if (request.method === "PATCH") return json(await updateStudent(db, user, studentId, await readJson<StudentInput>(request)), 200, corsHeaders);
      if (request.method === "DELETE") {
        await deleteStudent(db, user, studentId);
        return new Response(null, { status: 204, headers: corsHeaders });
      }
    }

    if (url.pathname === "/admin/access-users") {
      requireOwner(user);
      if (request.method === "GET") return json(await listAccessGrants(db, env), 200, corsHeaders);
      if (request.method === "POST") return json(await createAccessGrant(db, user, env, await readJson<AccessGrantInput>(request)), 201, corsHeaders);
    }

    const accessMatch = url.pathname.match(/^\/admin\/access-users\/([^/]+)$/);
    if (accessMatch && request.method === "PATCH") {
      requireOwner(user);
      return json(await updateAccessGrant(db, env, accessMatch[1], await readJson<AccessGrantPatchInput>(request)), 200, corsHeaders);
    }

    return json({ error: "not_found" }, 404, corsHeaders);
  } catch (error) {
    if (error instanceof HttpError) return json({ error: error.message }, error.status, corsHeaders);
    console.error(error);
    return json({ error: "internal_server_error" }, 500, corsHeaders);
  }
}

async function readJson<T>(request: Request): Promise<T> {
  try { return await request.json() as T; }
  catch { throw new HttpError(400, "invalid_json"); }
}

function buildCorsHeaders(request: Request, env: Env): Headers {
  const headers = new Headers();
  const origin = request.headers.get("Origin");
  const allowedOrigins = new Set(["http://localhost:5173", "http://127.0.0.1:5173", "https://jdeniz.isumi.com.br", ...parseAllowedOrigins(env.ALLOWED_ORIGIN)]);
  if (origin && allowedOrigins.has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  }
  headers.set("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Authorization,Content-Type");
  headers.set("Access-Control-Max-Age", "86400");
  return headers;
}

function parseAllowedOrigins(value: string | undefined): string[] {
  return (value || "").split(",").map((origin) => origin.trim()).filter(Boolean);
}

function json(body: unknown, status: number, headers?: Headers): Response {
  const responseHeaders = new Headers(headers);
  Object.entries(jsonHeaders).forEach(([key, value]) => responseHeaders.set(key, value));
  return new Response(JSON.stringify(body), { status, headers: responseHeaders });
}
