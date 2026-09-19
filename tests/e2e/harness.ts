import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { request as httpRequest } from "node:http";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

const root = join(import.meta.dirname, "..", "..");

export const PASSWORD = "correct-horse-battery";
export const EMAIL = "admin@example.com";

const freePort = () =>
  new Promise<number>((resolve, reject) => {
    const srv = createServer();
    srv.once("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address() as { port: number };
      srv.close(() => resolve(port));
    });
  });

export type Server = {
  url: string;
  dbPath: string;
  /** Run a statement against the server's DB; returns rows for SELECTs. */
  sql: <T = Record<string, unknown>>(query: string, ...params: (string | number | null)[]) => T[];
  clearRateLimits: () => void;
  log: () => string;
  stop: () => Promise<void>;
};

/**
 * Boots the *built* app the way the container does: migrate, then
 * `node dist/server/entry.mjs`, on a free port with a throwaway database.
 */
export async function startServer(env: Record<string, string> = {}): Promise<Server> {
  const dir = mkdtempSync(join(tmpdir(), "fabio-e2e-"));
  const dbPath = join(dir, "e2e.db");
  const port = await freePort();
  const childEnv = {
    ...process.env,
    NODE_ENV: "production",
    NODE_NO_WARNINGS: "1",
    DATABASE_PATH: dbPath,
    HOST: "127.0.0.1",
    PORT: String(port),
    IP_HASH_SECRET: "e2e-secret",
    ...env,
  };

  execFileSync(process.execPath, ["src/lib/migrate.js", "up"], { cwd: root, env: childEnv, stdio: "pipe" });

  let output = "";
  const child: ChildProcess = spawn(process.execPath, ["dist/server/entry.mjs"], { cwd: root, env: childEnv });
  child.stdout?.on("data", (d) => (output += d));
  child.stderr?.on("data", (d) => (output += d));

  const url = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 20_000;
  for (;;) {
    if (child.exitCode !== null) throw new Error(`server exited early:\n${output}`);
    try {
      if ((await fetch(`${url}/robots.txt`)).ok) break;
    } catch {
      /* not up yet */
    }
    if (Date.now() > deadline) {
      child.kill();
      throw new Error(`server did not start:\n${output}`);
    }
    await new Promise((r) => setTimeout(r, 100));
  }

  const sql: Server["sql"] = (query, ...params) => {
    const db = new DatabaseSync(dbPath);
    try {
      db.exec("PRAGMA busy_timeout = 5000");
      return db.prepare(query).all(...params) as never;
    } finally {
      db.close();
    }
  };

  return {
    url,
    dbPath,
    sql,
    clearRateLimits: () => void sql("DELETE FROM rate_limits"),
    log: () => output,
    stop: async () => {
      child.kill();
      await new Promise((r) => child.once("exit", r));
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

/** A tiny cookie-keeping HTTP client. Never follows redirects, so tests can assert them. */
export class Client {
  jar = new Map<string, string>();

  constructor(readonly base: string) {}

  cookieHeader() {
    return [...this.jar].map(([k, v]) => `${k}=${v}`).join("; ");
  }

  private store(res: Response) {
    for (const line of res.headers.getSetCookie()) {
      const [pair, ...attrs] = line.split(";");
      const eq = pair.indexOf("=");
      const name = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();
      const a = attrs.map((x) => x.trim().toLowerCase());
      const expired =
        value === "" ||
        a.includes("max-age=0") ||
        a.some((x) => x.startsWith("expires=") && Date.parse(x.slice(8)) < Date.now());
      if (expired) this.jar.delete(name);
      else this.jar.set(name, value);
    }
  }

  async fetch(path: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    if (this.jar.size && !headers.has("cookie")) headers.set("cookie", this.cookieHeader());
    const res = await fetch(this.base + path, { redirect: "manual", ...init, headers });
    this.store(res);
    return res;
  }

  get = (path: string, headers: Record<string, string> = {}) => this.fetch(path, { headers });

  /** application/x-www-form-urlencoded POST. */
  form(path: string, fields: Record<string, string>, headers: Record<string, string> = {}) {
    return this.fetch(path, { method: "POST", body: new URLSearchParams(fields), headers });
  }

  /** multipart/form-data POST; values may be strings or Files. */
  multipart(path: string, fields: Record<string, string | File>, method = "POST") {
    const body = new FormData();
    for (const [k, v] of Object.entries(fields)) body.set(k, v);
    return this.fetch(path, { method, body });
  }

  json(path: string, body: unknown, headers: Record<string, string> = {}) {
    return this.fetch(path, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json", ...headers },
    });
  }
}

/**
 * A signed-in admin client. Creates the admin on first use (first-run
 * bootstrap) and signs in with the password on every later call, so tests can
 * ask for one as often as they like.
 */
export async function signedInClient(server: Server): Promise<Client> {
  const client = new Client(server.url);
  const exists = server.sql("SELECT 1 FROM admin_password").length > 0;
  server.clearRateLimits();
  const res = exists
    ? await client.form("/api/auth/password-login", { email: EMAIL, password: PASSWORD })
    : await client.form("/api/auth/setup-password", { email: EMAIL, password: PASSWORD, confirm_password: PASSWORD });
  if (!client.jar.has("admin_session")) {
    throw new Error(`sign-in failed: ${res.status} ${await res.text()}`);
  }
  return client;
}

/**
 * Sends a request declaring a `Content-Length` without a body. Lets a test
 * exercise oversize-body rejection without actually transferring the bytes
 * (a real 13 MB upload races the server closing the socket).
 */
export function declaredLength(
  base: string,
  path: string,
  contentLength: number,
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = httpRequest(
      base + path,
      { method: "POST", headers: { "content-length": String(contentLength), "content-type": "text/plain" } },
      (res) => {
        let body = "";
        res.on("data", (d) => (body += d));
        res.on("end", () => resolve({ status: res.statusCode ?? 0, body }));
      },
    );
    req.on("error", reject);
    req.flushHeaders();
    // The server answers from the headers alone; ending here would violate the declared length.
    setTimeout(() => req.destroy(), 1500).unref();
  });
}

export const PDF = () => new File([Buffer.from("%PDF-1.7\n%test pdf")], "cv.pdf", { type: "application/pdf" });
export const PNG = (name = "cert.png") =>
  new File([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3])], name, { type: "image/png" });
export const TEXT = (name = "evil.pdf") => new File(["<script>alert(1)</script>"], name, { type: "application/pdf" });
