/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  BOX FRAMEWORK — TASK MANAGER API EXAMPLE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This is a **production-quality demo** that shows how to build a complete
 * REST API with the Box Framework. It covers:
 *
 *   🔐 Authentication  — JWT-based auth with boxfw-auth
 *   📋 CRUD Operations — Tasks with full validation via boxfw-validator
 *   🗄️ Database       — SQLite + Drizzle ORM via boxfw-db
 *   🌍 i18n           — Bilingual error messages (EN/FA) via boxfw-i18n
 *   📝 Logging        — Structured request logging via boxfw-logger
 *   📖 OpenAPI        — Auto-generated API spec via boxfw-openapi
 *   🔌 WebSocket      — Real-time task updates via boxfw-core
 *   🌩️ Dual Runtime   — Same code runs on Bun + Cloudflare Workers
 *
 * ─── HOW TO RUN ───
 *   bun run example     # Starts on http://localhost:3000
 *
 * ─── QUICK START ───
 *   # Create a user
 *   curl -X POST http://localhost:3000/api/auth/register \
 *     -H "Content-Type: application/json" \
 *     -d '{"email":"demo@box.dev","name":"Demo User","password":"secret123"}'
 *
 *   # Login
 *   curl -X POST http://localhost:3000/api/auth/login \
 *     -H "Content-Type: application/json" \
 *     -d '{"email":"demo@box.dev","password":"secret123"}'
 *   # → { "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
 *
 *   # Create a task (use the token from login)
 *   curl -X POST http://localhost:3000/api/tasks \
 *     -H "Content-Type: application/json" \
 *     -H "Authorization: Bearer <token>" \
 *     -d '{"title":"Build something awesome","priority":"high"}'
 *
 *   # List tasks
 *   curl http://localhost:3000/api/tasks?status=todo&page=1&limit=10 \
 *     -H "Authorization: Bearer <token>"
 *
 *   # OpenAPI spec
 *   curl http://localhost:3000/openapi.json
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════
//  1. IMPORTS
// ═══════════════════════════════════════════════════════════════════════════

import { Box, cors } from "boxfw-core";
import { bunEnv } from "boxfw-adapters";
import { v } from "boxfw-validator";
import { z } from "zod";
import { localeDetect, t, rtlMeta, bilingualError } from "boxfw-i18n";
import type { TranslationDict } from "boxfw-i18n";
import { jwt, signJwt } from "boxfw-auth";
import { openapi } from "boxfw-openapi";
import { createLogger, requestLogger } from "boxfw-logger";
import { eq, and, desc, asc, like, count, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { createDatabase, typedDb, D, users, tasks } from "./db";

// ═══════════════════════════════════════════════════════════════════════════
//  2. INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

const app = new Box();

// ── Logger ──────────────────────────────────────────────────────────────
const log = createLogger({ level: "debug", name: "taskmanager" });

// ── Runtime Environment ─────────────────────────────────────────────────
app.setEnv(bunEnv());

// ── Database ────────────────────────────────────────────────────────────
const orm = createDatabase();
app.use(D(orm));

// ── CORS ────────────────────────────────────────────────────────────────
app.use(cors({ origin: "*", credentials: false }));

// ── Request Logging ─────────────────────────────────────────────────────
app.use(requestLogger({ logger: log, logQuery: true }));

// ── Internationalization ────────────────────────────────────────────────
app.use(
  localeDetect({
    default: "en",
    supported: ["en", "fa"],
    strategies: ["header", "query"],
  }),
);

// ── JWT Authentication ──────────────────────────────────────────────────
// Using `optional: true` means routes without a token will get `c.jwt = null`
// instead of a 401. Protected routes check for `c.jwt` themselves and return
// 401 only when needed. This allows public routes like /api/auth/register and
// /api/auth/login to work without authentication.
const JWT_SECRET = process.env.JWT_SECRET ?? "taskmanager-dev-secret-change-in-prod";
app.use(jwt({ secret: JWT_SECRET, optional: true }));

// ── Response Headers ────────────────────────────────────────────────────
app.use(async (c, next) => {
  c.header("X-Powered-By", "Box Framework");
  c.header("X-Request-ID", String(c.store.get("requestId") ?? ""));
  return next();
});

// ═══════════════════════════════════════════════════════════════════════════
//  3. TRANSLATION DICTIONARY (i18n)
// ═══════════════════════════════════════════════════════════════════════════
//
// The `t(c, key, dict)` function looks up the key in the current request's
// locale. If the locale is missing, it falls back to the first locale in
// the dictionary. If the key is missing entirely, it returns the key itself.
//
// Usage in a handler:
//   return bilingualError(c, "task_not_found", dict, 404);
//

const dict: TranslationDict = {
  en: {
    welcome: "Welcome to Box Task Manager",
    task_created: "Task created successfully",
    task_updated: "Task updated successfully",
    task_deleted: "Task deleted successfully",
    task_not_found: "Task not found",
    tasks_fetched: "Tasks fetched successfully",
    user_registered: "User registered successfully",
    login_success: "Login successful",
    invalid_credentials: "Invalid email or password",
    email_taken: "This email is already registered",
    unauthorized: "Authentication required",
    server_error: "Internal server error",
    validation_error: "Validation failed",
  },
  fa: {
    welcome: "به سامانه مدیریت وظایف باکس خوش آمدید",
    task_created: "وظیفه با موفقیت ایجاد شد",
    task_updated: "وظیفه با موفقیت به‌روزرسانی شد",
    task_deleted: "وظیفه با موفقیت حذف شد",
    task_not_found: "وظیفه پیدا نشد",
    tasks_fetched: "وظایف با موفقیت دریافت شدند",
    user_registered: "کاربر با موفقیت ثبت نام شد",
    login_success: "ورود با موفقیت انجام شد",
    invalid_credentials: "ایمیل یا رمز عبور اشتباه است",
    email_taken: "این ایمیل قبلاً ثبت نام کرده است",
    unauthorized: "احراز هویت الزامی است",
    server_error: "خطای داخلی سرور",
    validation_error: "اعتبارسنجی ناموفق بود",
  },
};

// ═══════════════════════════════════════════════════════════════════════════
//  4. AUTH ROUTES
// ═══════════════════════════════════════════════════════════════════════════

// ─── POST /api/auth/register ───────────────────────────────────────────
// Validates the request body with Zod, creates a new user, and returns a JWT.
// The `v()` wrapper handles validation and injects typed data into `c.validated`.
app.post(
  "/api/auth/register",
  v(
    {
      body: z.object({
        email: z.string().email("Must be a valid email address"),
        name: z.string().min(2, "Name must be at least 2 characters").max(100),
        password: z.string().min(6, "Password must be at least 6 characters").max(128),
      }),
    },
    async (c) => {
      try {
        // c.validated.body is fully typed thanks to z.infer from the Zod schema above
        const { email, name, password } = c.validated.body;

        // Check if email already exists
        const existing = await typedDb(c)
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (existing.length > 0) {
          return bilingualError(c, "email_taken", dict, 409);
        }

        // Hash password (simple SHA-256 for demo — use bcrypt in production)
        const encoder = new TextEncoder();
        const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(password));
        const hashedPassword = Array.from(new Uint8Array(hashBuffer))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        // Insert user
        const result = await typedDb(c)
          .insert(users)
          .values({ email, name, password: hashedPassword })
          .returning();

        const user = result[0]!;

        // Generate JWT
        const token = await signJwt(
          { sub: String(user.id), email: user.email, name: user.name, role: user.role },
          JWT_SECRET,
          86400, // 24 hours
        );

        log.info("User registered", { userId: user.id, email });

        return c.status(201).json({
          message: t(c, "user_registered", dict),
          token,
          user: { id: user.id, email: user.email, name: user.name, role: user.role },
        });
      } catch (error) {
        log.error("Registration failed", { error: error instanceof Error ? error : new Error(String(error)) });
        return bilingualError(c, "server_error", dict, 500);
      }
    },
  ),
);

// ─── POST /api/auth/login ──────────────────────────────────────────────
// Authenticates a user by email + password and returns a JWT.
app.post(
  "/api/auth/login",
  v(
    {
      body: z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }),
    },
    async (c) => {
      try {
        const { email, password } = c.validated.body;

        // Hash the provided password and look for a matching user
        const encoder = new TextEncoder();
        const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(password));
        const hashedPassword = Array.from(new Uint8Array(hashBuffer))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        const result = await typedDb(c)
          .select()
          .from(users)
          .where(and(eq(users.email, email), eq(users.password, hashedPassword)))
          .limit(1);

        if (result.length === 0) {
          return bilingualError(c, "invalid_credentials", dict, 401);
        }

        const user = result[0]!;
        const token = await signJwt(
          { sub: String(user.id), email: user.email, name: user.name, role: user.role },
          JWT_SECRET,
          86400,
        );

        log.info("User logged in", { userId: user.id });

        return c.json({
          message: t(c, "login_success", dict),
          token,
          user: { id: user.id, email: user.email, name: user.name, role: user.role },
        });
      } catch (error) {
        log.error("Login failed", { error: error instanceof Error ? error : new Error(String(error)) });
        return bilingualError(c, "server_error", dict, 500);
      }
    },
  ),
);

// ─── GET /api/auth/me ──────────────────────────────────────────────────
// Returns the current authenticated user's profile.
// The JWT middleware has already verified the token and set `c.jwt`.
app.get("/api/auth/me", async (c) => {
  const jwtPayload = (c as unknown as Record<string, unknown>).jwt as Record<string, unknown> | null;

  if (!jwtPayload?.sub) {
    return bilingualError(c, "unauthorized", dict, 401);
  }

  const userId = Number(jwtPayload.sub);
  const result = await typedDb(c)
    .select({ id: users.id, email: users.email, name: users.name, role: users.role, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (result.length === 0) {
    return bilingualError(c, "unauthorized", dict, 401);
  }

  return c.json({ user: result[0] });
});

// ═══════════════════════════════════════════════════════════════════════════
//  5. TASK ROUTES (CRUD)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Helper: extract the authenticated user ID from the JWT payload.
 * The JWT middleware stores the decoded token as `c.jwt`.
 */
function getUserId(c: import("boxfw-core").Context): number | null {
  const jwtPayload = (c as unknown as Record<string, unknown>).jwt as Record<string, unknown> | null;
  if (!jwtPayload?.sub) return null;
  return Number(jwtPayload.sub);
}

// ─── GET /api/tasks ────────────────────────────────────────────────────
// Lists tasks for the authenticated user with:
//   - Pagination (page, limit)
//   - Filtering (status, priority)
//   - Sorting (sortBy, sortOrder)
//   - Search (q — searches title and description)
app.get("/api/tasks", async (c) => {
  const userId = getUserId(c);
  if (!userId) return bilingualError(c, "unauthorized", dict, 401);

  // Parse query parameters with defaults
  const page = Math.max(1, Number(c.queryParam("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(c.queryParam("limit")) || 20));
  const offset = (page - 1) * limit;
  const statusFilter = c.queryParam("status");
  const priorityFilter = c.queryParam("priority");
  const searchQuery = c.queryParam("q");
  const sortBy = c.queryParam("sortBy") || "created_at";
  const sortOrder = c.queryParam("sortOrder") || "desc";

  // Build the WHERE conditions dynamically using Drizzle's query builder
  const conditions: (SQL | undefined)[] = [eq(tasks.userId, userId)];

  if (statusFilter && ["todo", "in_progress", "done", "cancelled"].includes(statusFilter)) {
    conditions.push(eq(tasks.status, statusFilter));
  }

  if (priorityFilter && ["low", "medium", "high", "urgent"].includes(priorityFilter)) {
    conditions.push(eq(tasks.priority, priorityFilter));
  }

  if (searchQuery) {
    conditions.push(like(tasks.title, `%${searchQuery}%`));
  }

  const whereClause = and(...conditions);

  // Get total count for pagination metadata
  const totalResult = await typedDb(c)
    .select({ total: count() })
    .from(tasks)
    .where(whereClause);

  const total = totalResult[0]?.total ?? 0;

  // Determine sort column and order
  const orderByClause = sortBy === "priority"
    ? sortOrder === "asc" ? asc(tasks.priority) : desc(tasks.priority)
    : sortBy === "due_date"
      ? sortOrder === "asc" ? asc(tasks.dueDate) : desc(tasks.dueDate)
      : sortBy === "updated_at"
        ? sortOrder === "asc" ? asc(tasks.updatedAt) : desc(tasks.updatedAt)
        : sortOrder === "asc" ? asc(tasks.createdAt) : desc(tasks.createdAt);

  // Fetch the paginated, filtered, sorted results
  const taskList = await typedDb(c)
    .select()
    .from(tasks)
    .where(whereClause)
    .orderBy(orderByClause)
    .limit(limit)
    .offset(offset);

  return c.json({
    data: taskList,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
});

// ─── GET /api/tasks/:id ────────────────────────────────────────────────
// Gets a single task by ID, scoped to the authenticated user.
app.get(
  "/api/tasks/:id",
  v(
    {
      params: z.object({ id: z.coerce.number().positive() }),
    },
    async (c) => {
      const userId = getUserId(c);
      if (!userId) return bilingualError(c, "unauthorized", dict, 401);

      const { id } = c.validated.params;

      const result = await typedDb(c)
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
        .limit(1);

      if (result.length === 0) {
        return bilingualError(c, "task_not_found", dict, 404);
      }

      return c.json({ data: result[0] });
    },
  ),
);

// ─── POST /api/tasks ───────────────────────────────────────────────────
// Creates a new task for the authenticated user.
app.post(
  "/api/tasks",
  v(
    {
      body: z.object({
        title: z.string().min(1, "Title is required").max(200, "Title too long"),
        description: z.string().max(2000).optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional().default("medium"),
        dueDate: z.string().optional(),
      }),
    },
    async (c) => {
      const userId = getUserId(c);
      if (!userId) return bilingualError(c, "unauthorized", dict, 401);

      const { title, description, priority, dueDate } = c.validated.body;

      const result = await typedDb(c)
        .insert(tasks)
        .values({
          userId,
          title,
          description: description ?? null,
          priority,
          dueDate: dueDate ?? null,
        })
        .returning();

      const task = result[0]!;

      log.info("Task created", { taskId: task.id, userId });

      return c.status(201).json({
        message: t(c, "task_created", dict),
        data: task,
      });
    },
  ),
);

// ─── PUT /api/tasks/:id ────────────────────────────────────────────────
// Fully updates an existing task (all fields).
app.put(
  "/api/tasks/:id",
  v(
    {
      params: z.object({ id: z.coerce.number().positive() }),
      body: z.object({
        title: z.string().min(1).max(200),
        description: z.string().max(2000).optional(),
        status: z.enum(["todo", "in_progress", "done", "cancelled"]).optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        dueDate: z.string().nullable().optional(),
      }),
    },
    async (c) => {
      const userId = getUserId(c);
      if (!userId) return bilingualError(c, "unauthorized", dict, 401);

      const { id } = c.validated.params;
      const { title, description, status, priority, dueDate } = c.validated.body;

      // Verify the task exists and belongs to the user
      const existing = await typedDb(c)
        .select({ id: tasks.id })
        .from(tasks)
        .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
        .limit(1);

      if (existing.length === 0) {
        return bilingualError(c, "task_not_found", dict, 404);
      }

      // Build update data using Drizzle's type-safe set method
      const result = await typedDb(c)
        .update(tasks)
        .set({
          title,
          description: description !== undefined ? description : undefined,
          status: status !== undefined ? status : undefined,
          priority: priority !== undefined ? priority : undefined,
          dueDate: dueDate !== undefined ? dueDate : undefined,
          updatedAt: sql`(datetime('now'))`,
        })
        .where(eq(tasks.id, id))
        .returning();

      log.info("Task updated", { taskId: id, userId });

      return c.json({
        message: t(c, "task_updated", dict),
        data: result[0],
      });
    },
  ),
);

// ─── DELETE /api/tasks/:id ─────────────────────────────────────────────
// Deletes a task by ID (scoped to user).
app.delete(
  "/api/tasks/:id",
  v(
    {
      params: z.object({ id: z.coerce.number().positive() }),
    },
    async (c) => {
      const userId = getUserId(c);
      if (!userId) return bilingualError(c, "unauthorized", dict, 401);

      const { id } = c.validated.params;

      const result = await typedDb(c)
        .delete(tasks)
        .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
        .returning({ id: tasks.id });

      if (result.length === 0) {
        return bilingualError(c, "task_not_found", dict, 404);
      }

      log.info("Task deleted", { taskId: id, userId });

      return c.json({ message: t(c, "task_deleted", dict), data: { id } });
    },
  ),
);

// ─── PATCH /api/tasks/:id/status ───────────────────────────────────────
// Quick status update (demonstrates partial updates).
app.patch(
  "/api/tasks/:id/status",
  v(
    {
      params: z.object({ id: z.coerce.number().positive() }),
      body: z.object({
        status: z.enum(["todo", "in_progress", "done", "cancelled"]),
      }),
    },
    async (c) => {
      const userId = getUserId(c);
      if (!userId) return bilingualError(c, "unauthorized", dict, 401);

      const { id } = c.validated.params;
      const { status } = c.validated.body;

      const result = await typedDb(c)
        .update(tasks)
        .set({ status, updatedAt: sql`(datetime('now'))` })
        .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
        .returning();

      if (result.length === 0) {
        return bilingualError(c, "task_not_found", dict, 404);
      }

      log.info("Task status updated", { taskId: id, status });

      return c.json({ message: t(c, "task_updated", dict), data: result[0] });
    },
  ),
);

// ═══════════════════════════════════════════════════════════════════════════
//  6. ROOT & OPENAPI ROUTES
// ═══════════════════════════════════════════════════════════════════════════

// ─── GET / ─────────────────────────────────────────────────────────────
// Welcome endpoint with i18n + RTL metadata.
// The `rtlMeta()` helper returns { dir: "rtl" | "ltr", locale } so frontends
// can set the correct text direction based on the user's language.
app.get("/", (c) => {
  return c.json({
    message: t(c, "welcome", dict),
    ...rtlMeta(c.locale),
    version: "1.0.0",
    documentation: "/openapi.json",
    endpoints: {
      auth: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login",
        profile: "GET /api/auth/me",
      },
      tasks: {
        list: "GET /api/tasks",
        create: "POST /api/tasks",
        get: "GET /api/tasks/:id",
        update: "PUT /api/tasks/:id",
        delete: "DELETE /api/tasks/:id",
        status: "PATCH /api/tasks/:id/status",
      },
    },
  });
});

// ─── GET /openapi.json ─────────────────────────────────────────────────
// Auto-generates an OpenAPI 3.0 specification from route definitions.
app.get(
  "/openapi.json",
  openapi(
    {
      title: "Box Task Manager API",
      version: "1.0.0",
      description:
        "A professional Task Manager API built with Box Framework. " +
        "Demonstrates JWT auth, Drizzle ORM, i18n, validation, logging, pagination, and more.",
    },
    [
      { method: "GET", path: "/", summary: "Welcome with i18n and API overview", tags: ["System"] },
      {
        method: "POST", path: "/api/auth/register", summary: "Register a new user", tags: ["Auth"],
        body: { email: "User email", name: "Display name", password: "Password (min 6 chars)" },
      },
      {
        method: "POST", path: "/api/auth/login", summary: "Login with email and password", tags: ["Auth"],
        body: { email: "User email", password: "User password" },
      },
      { method: "GET", path: "/api/auth/me", summary: "Get current user profile", tags: ["Auth"] },
      {
        method: "GET", path: "/api/tasks", summary: "List tasks (paginated, filterable, sortable)",
        tags: ["Tasks"], params: {},
        query: { page: "Page number (default: 1)", limit: "Items per page (default: 20)", status: "Filter by status", priority: "Filter by priority", q: "Search query", sortBy: "Sort field", sortOrder: "asc or desc" },
      },
      {
        method: "POST", path: "/api/tasks", summary: "Create a new task", tags: ["Tasks"],
        body: { title: "Task title (required)", description: "Task description", priority: "low, medium, high, or urgent", dueDate: "ISO-8601 due date" },
      },
      { method: "GET", path: "/api/tasks/:id", summary: "Get a task by ID", tags: ["Tasks"], params: { id: "Task ID" } },
      {
        method: "PUT", path: "/api/tasks/:id", summary: "Update a task", tags: ["Tasks"],
        params: { id: "Task ID" },
        body: { title: "Task title", description: "Task description", status: "todo, in_progress, done, or cancelled", priority: "low, medium, high, or urgent", dueDate: "ISO-8601 due date or null" },
      },
      { method: "DELETE", path: "/api/tasks/:id", summary: "Delete a task", tags: ["Tasks"], params: { id: "Task ID" } },
      {
        method: "PATCH", path: "/api/tasks/:id/status", summary: "Quick-update task status", tags: ["Tasks"],
        params: { id: "Task ID" }, body: { status: "todo, in_progress, done, or cancelled" },
      },
    ],
  ),
);

// ═══════════════════════════════════════════════════════════════════════════
//  7. WEBSOCKET
// ═══════════════════════════════════════════════════════════════════════════

/**
 * WebSocket endpoint for real-time task notifications.
 *
 * Connect with:
 *   ws://localhost:3000/ws
 */
app.ws("/ws", {
  open: (ws) => {
    log.info("WebSocket client connected");
    ws.send(JSON.stringify({ type: "connected", message: "Welcome to Box Task Manager!" }));
  },
  message: (ws, data) => {
    const msg = typeof data === "string" ? data : new TextDecoder().decode(data as ArrayBuffer);
    log.info("WebSocket message received", { message: msg });

    try {
      const parsed = JSON.parse(msg);
      ws.send(JSON.stringify({ type: "echo", original: parsed }));
    } catch {
      ws.send(JSON.stringify({ type: "echo", original: msg }));
    }
  },
  close: (ws) => {
    log.info("WebSocket client disconnected");
  },
});

// ═══════════════════════════════════════════════════════════════════════════
//  8. ERROR HANDLING
// ═══════════════════════════════════════════════════════════════════════════

// Custom 404 handler — returns a JSON error instead of plain text
app.notFound((c) => {
  return c.status(404).json({
    error: "Not Found",
    message: `Route ${c.method} ${c.path} does not exist`,
    available: "/openapi.json",
  });
});

// Custom error handler — catches all unhandled errors
app.onError((error, c) => {
  log.error("Unhandled error", { error, path: c.path, method: c.method });
  return bilingualError(c, "server_error", dict, 500);
});

// ═══════════════════════════════════════════════════════════════════════════
//  9. START THE SERVER
// ═══════════════════════════════════════════════════════════════════════════

const port = Number(process.env.PORT) || 3000;
const server = app.listen({ port, development: true });

log.info("══════════════════════════════════════════");
log.info("  Box Task Manager API is running!");
log.info(`  URL:           http://localhost:${port}`);
log.info(`  OpenAPI docs:  http://localhost:${port}/openapi.json`);
log.info("──────────────────────────────────────────");
log.info("  Endpoints:");
log.info("  POST /api/auth/register   — Register");
log.info("  POST /api/auth/login      — Login");
log.info("  GET  /api/auth/me         — My Profile");
log.info("  GET  /api/tasks           — List Tasks");
log.info("  POST /api/tasks           — Create Task");
log.info("  GET  /api/tasks/:id       — Get Task");
log.info("  PUT  /api/tasks/:id       — Update Task");
log.info("  DELETE /api/tasks/:id     — Delete Task");
log.info("  WS   /ws                  — WebSocket");
log.info("══════════════════════════════════════════");

// Export for Cloudflare Workers and testing
export { app };
