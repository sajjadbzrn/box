import type { Context } from "boxfw-core";
import type { z } from "zod";

/**
 * A generic, library-agnostic schema parser interface.
 * Compatible with both Zod (`z.ZodType`) and Valibot.
 */
export interface SchemaParser<T> {
  safeParse(data: unknown): { success: true; data: T } | { success: false; error: unknown };
}

/**
 * Definition of all supported validation schemas for a route.
 *
 * Each key maps to a Zod schema. Only the schemas you provide are
 * validated — the rest pass through as-is.
 *
 * Using `z.ZodTypeAny` ensures full type inference via `z.infer` in
 * the `Validated` type, so `c.validated.body` has the exact shape
 * of the Zod schema you passed.
 *
 * @example
 * ```ts
 * app.post("/user", v({
 *   body: z.object({ name: z.string(), age: z.number() }),
 * }, (c) => {
 *   c.validated.body.name; // string
 *   c.validated.body.age;  // number
 * }));
 * ```
 */
export interface SchemaDef {
  params?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
  body?: z.ZodTypeAny;
  headers?: z.ZodTypeAny;
}

/**
 * `Validated` is the shape of the `c.validated` property added to the Context
 * after schema validation passes. Types are inferred from Zod schemas.
 */
export type Validated<S extends SchemaDef> = {
  params: S["params"] extends z.ZodTypeAny ? z.infer<S["params"]> : Record<string, string>;
  query: S["query"] extends z.ZodTypeAny ? z.infer<S["query"]> : Record<string, string>;
  body: S["body"] extends z.ZodTypeAny ? z.infer<S["body"]> : unknown;
  headers: S["headers"] extends z.ZodTypeAny ? z.infer<S["headers"]> : Record<string, string>;
};

/**
 * A `Context` augmented with a `.validated` property containing
 * the schema-inferred types.
 */
export type ValidatedContext<S extends SchemaDef> = Context & {
  validated: Validated<S>;
};

/**
 * A handler that receives a `ValidatedContext<S>`.
 */
export type ValidatedHandler<S extends SchemaDef> = (c: ValidatedContext<S>) => Response | Promise<Response>;

/**
 * Shape of a single validation error issue.
 */
export interface ValidationIssue {
  path: (string | number)[];
  message: string;
  code?: string;
}

/**
 * Structured validation error response body.
 */
export interface ValidationErrorBody {
  error: string;
  issues: ValidationIssue[];
}
