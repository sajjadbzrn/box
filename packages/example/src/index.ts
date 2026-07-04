import { Box } from "boxfw-core";
import { bunEnv } from "boxfw-adapters";
import { v } from "boxfw-validator";
import { z } from "zod";
import { localeDetect, t, rtlMeta, bilingualError } from "boxfw-i18n";
import { jwt, signJwt, session } from "boxfw-auth";
import { openapi } from "boxfw-openapi";

// ============================================================
// Box — Full Feature Demo
// ============================================================

const app = new Box();

// ---- Runtime env (Bun) ----
app.setEnv(bunEnv());

// ---- i18n: Locale detection ----
const dict = {
  en: { hello: "Hello, Box!", not_found: "Not Found", error: "Internal Error" },
  fa: { hello: "سلام، باکس!", not_found: "پیدا نشد", error: "خطای داخلی" },
};

app.use(
  localeDetect({
    default: "en",
    supported: ["en", "fa"],
    strategies: ["header", "query"],
  }),
);

// ---- Auth: JWT + Session ----
app.use(session({ optional: true }));
// For JWT: set JWT_SECRET env var, then uncomment:
// app.use(jwt({ secret: c.env("JWT_SECRET") ?? "dev-secret", optional: true }));

// ---- Logging middleware ----
app.use(async (c, next) => {
  const start = Date.now();
  const res = await next();
  console.log(
    `${c.method} ${c.path} ${res.status} ${Date.now() - start}ms [${c.locale}]`,
  );
  return res;
});

app.use(async (c, next) => {
  c.header("X-Powered-By", "Box");
  return next();
});

// ============================================================
// Routes
// ============================================================

// 1. Home — i18n + RTL
app.get("/", (c) => {
  return c.json({
    message: t(c, "hello", dict),
    ...rtlMeta(c.locale),
    routes: [
      "/api/users",
      "/api/users/:id",
      "/openapi.json",
      "/openapi.json",
      "/ws (WebSocket)",
    ],
  });
});

// 2. Login — issue JWT
app.post(
  "/login",
  v(
    {
      body: z.object({
        username: z.string().min(1),
        password: z.string().min(1),
      }),
    },
    async (c) => {
      const { username } = c.validated.body;
      const secret = c.env("JWT_SECRET") ?? "dev-secret";
      const token = await signJwt(
        { sub: username, role: "user" },
        secret,
        3600,
      );
      return c.json({ token });
    },
  ),
);

// 3. Protect route with JWT
app.get("/me", (c) => {
  // Uncomment to require auth:
  // if (!c.jwt) return c.status(401).json({ error: "Unauthorized" });
  return c.json({ user: { id: "demo", name: "Box User" }, locale: c.locale });
});

// 4. i18n error
app.get(
  "/item/:id",
  v(
    {
      params: z.object({ id: z.string() }),
    },
    (c) => {
      const { id } = c.validated.params;
      if (id === "404") return bilingualError(c, "not_found", dict, 404);
      return c.json({ id, name: `Item ${id}` });
    },
  ),
);

// 5. Validation example
app.post(
  "/echo",
  v(
    {
      body: z.object({ message: z.string().min(1) }),
    },
    async (c) => {
      return c.json({ echoed: c.validated.body.message }, 201);
    },
  ),
);

// ---- OpenAPI spec ----
app.get(
  "/openapi.json",
  openapi(
    { title: "Box API", version: "1.0.0", description: "Box framework demo" },
    [
      {
        method: "GET",
        path: "/",
        summary: "Home with i18n",
        tags: ["Root"],
        params: {},
        response: {},
      },
      {
        method: "POST",
        path: "/login",
        summary: "Login (JWT)",
        tags: ["Auth"],
        body: { username: "string", password: "string" },
      },
      {
        method: "GET",
        path: "/me",
        summary: "Current user",
        tags: ["Auth"],
        response: {},
      },
      {
        method: "GET",
        path: "/item/:id",
        summary: "Get item by ID",
        tags: ["Items"],
        params: { id: "Item ID" },
      },
      {
        method: "POST",
        path: "/echo",
        summary: "Echo body",
        tags: ["Debug"],
        body: { message: "Message to echo" },
      },
    ],
  ),
);

// ---- WebSocket chat ----
app.ws("/chat", {
  open: (ws) => {
    console.log("[ws] Client connected");
    ws.send(
      JSON.stringify({ type: "welcome", message: "Connected to Box chat!" }),
    );
  },
  message: (ws, data) => {
    const msg =
      typeof data === "string" ? data : new TextDecoder().decode(data);
    console.log(`[ws] Received: ${msg}`);
    ws.send(JSON.stringify({ type: "echo", message: `You said: ${msg}` }));
  },
  close: (ws) => {
    console.log("[ws] Client disconnected");
  },
});

// ============================================================
// Start server
// ============================================================
const server = app.listen({ port: 3000 });
console.log(`
╔══════════════════════════════════════╗
║  Box Framework — Full Feature Demo   ║
╠══════════════════════════════════════╣
║  Server: ${server.url.href.padEnd(27)}║
║  i18n:   en, fa (Accept-Language)    ║
║  Auth:   JWT + Session               ║
║  WS:     /chat                       ║
║  Docs:   /openapi.json               ║
╚══════════════════════════════════════╝
`);
