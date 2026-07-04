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
 * Each key maps to a Zod (or compatible) schema.
 * Only the schemas you provide are validated — the rest pass through as-is.
 */
export interface SchemaDef {
  params?: z.ZodType;
  query?: z.ZodType;
  body?: z.ZodType;
  headers?: z.ZodType;
}

/**
 * Extract the inferred type of a schema property, or fall back to a default.
 */
type InferProp<S, K extends keyof SchemaDef, Fallback> = S extends { [P in K]: z.ZodType<infer T> } ? T : Fallback;

/**
 * `Validated` is the shape of the `c.validated` property added to the Context
 * after schema validation passes.
 */
export type Validated<S extends SchemaDef> = {
  params: InferProp<S, "params", Record<string, string>>;
  query: InferProp<S, "query", Record<string, string>>;
  body: InferProp<S, "body", unknown>;
  headers: InferProp<S, "headers", Record<string, string>>;
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
