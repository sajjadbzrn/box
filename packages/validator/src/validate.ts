import type { Context } from "boxfw-core";
import type { SchemaDef, ValidatedContext, ValidationIssue } from "../src/types";

/**
 * Parse section-specific error details from a Zod `ZodError`.
 */
function extractIssues(error: unknown, prefix: string): ValidationIssue[] {
  try {
    const zodError = error as { issues?: Array<{ path: (string | number)[]; message: string; code?: string }> };
    if (!zodError.issues) return [];
    return zodError.issues.map((i) => ({
      path: [prefix, ...i.path],
      message: i.message,
      code: i.code,
    }));
  } catch {
    return [{ path: [prefix], message: String(error) }];
  }
}

/**
 * Build a structured 400 JSON response for validation failures.
 */
export function validationError(c: Context, message: string, issues: ValidationIssue[]): Response {
  return c.status(400).json({
    error: message,
    issues,
  });
}

/**
 * Internal result from a schema validation — either validated data or an error Response.
 */
type ValidationResult<T> = { ok: true; data: T } | { ok: false; response: Response };

/**
 * Run a single schema validation and return the validated data or a 400 `Response`.
 */
async function checkSchema<T>(
  c: Context,
  // biome-ignore lint/suspicious/noExplicitAny: schema is a Zod-like object with safeParse
  schema: any,
  data: unknown,
  label: string,
): Promise<ValidationResult<T>> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { ok: true, data: result.data as T };
  }

  const issues = extractIssues(result.error, label);
  return { ok: false, response: validationError(c, `Invalid ${label}`, issues) };
}

/**
 * `v` is the primary validation wrapper: it takes a schema definition and a typed
 * handler, validates the request, and injects `c.validated` into the handler context.
 *
 * The returned value is a plain `Handler`, so it slots directly into `app.get()`,
 * `app.post()`, etc.
 *
 * @example
 * ```ts
 * app.get("/user/:id", v({
 *   params: z.object({ id: z.string() }),
 *   query: z.object({ page: z.coerce.number().optional() }),
 * }, (c) => {
 *   // c.validated.params.id → string
 *   // c.validated.query.page → number | undefined
 *   return c.json({ id: c.validated.params.id });
 * }));
 * ```
 *
 * @example
 * ```ts
 * // Body validation
 * app.post("/user", v({
 *   body: z.object({ name: z.string(), email: z.string().email() }),
 * }, async (c) => {
 *   const { name, email } = c.validated.body;
 *   // ... fully typed
 *   return c.json({ name, email }, 201);
 * }));
 * ```
 */
export function v<S extends SchemaDef>(
  schemas: S,
  handler: (c: ValidatedContext<S>) => Response | Promise<Response>,
): (c: Context) => Promise<Response> {
  return async (c: Context): Promise<Response> => {
    const validated: Record<string, unknown> = {};

    // --- Params ---
    if (schemas.params) {
      const result = await checkSchema(c, schemas.params, c.params, "params");
      if (!result.ok) return result.response;
      validated.params = result.data;
    }

    // --- Query ---
    if (schemas.query) {
      const queryObj: Record<string, string> = {};
      c.url.searchParams.forEach((val, key) => {
        queryObj[key] = val;
      });
      const result = await checkSchema(c, schemas.query, queryObj, "query");
      if (!result.ok) return result.response;
      validated.query = result.data;
    }

    // --- Headers ---
    if (schemas.headers) {
      const headersObj: Record<string, string> = {};
      c.req.headers.forEach((val, key) => {
        headersObj[key] = val;
      });
      const result = await checkSchema(c, schemas.headers, headersObj, "headers");
      if (!result.ok) return result.response;
      validated.headers = result.data;
    }

    // --- Body ---
    if (schemas.body) {
      let bodyObj: unknown;
      try {
        bodyObj = await c.req.json();
      } catch {
        bodyObj = null;
      }
      const result = await checkSchema(c, schemas.body, bodyObj, "body");
      if (!result.ok) return result.response;
      validated.body = result.data;
    }

    // Inject validated data into context
    (c as unknown as Record<string, unknown>).validated = validated;

    // Call handler with typed context
    const result = await handler(c as ValidatedContext<S>);
    return result;
  };
}
