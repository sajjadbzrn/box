/**
 * compile-time type inference demo
 *
 * This file demonstrates that Box's v() correctly infers types
 * from Zod schemas into the handler's `c.validated` object.
 *
 * TypeScript will ERROR on the commented lines if the types are wrong.
 * If this file compiles, the type inference is working.
 */

import { z } from "zod";
import { type Validated, type ValidatedContext, v } from "../../packages/validator/src/index";

// -------- Params inference --------
const paramsSchema = { params: z.object({ id: z.string(), count: z.coerce.number() }) };

const paramsHandler = v(paramsSchema, (c) => {
  // These should type-check fine:
  const id: string = c.validated.params.id;
  const count: number = c.validated.params.count;

  // @ts-expect-error — 'foo' does not exist on params
  const bad = c.validated.params.foo;

  // @ts-expect-error — 'id' should be string, not number
  const alsoBad: number = c.validated.params.id;

  return c.json({ id, count });
});

// -------- Body inference --------
const bodySchema = { body: z.object({ name: z.string(), age: z.number() }) };

const bodyHandler = v(bodySchema, (c) => {
  const { name, age } = c.validated.body;
  // name is string, age is number

  const upper: string = name.toUpperCase();
  const double: number = age * 2;

  // @ts-expect-error — 'email' does not exist
  const bad = c.validated.body.email;

  return c.json({ name: upper, age: double });
});

// -------- Query inference --------
const querySchema = {
  query: z.object({
    page: z.coerce.number().default(1),
    q: z.string().optional(),
  }),
};

const queryHandler = v(querySchema, (c) => {
  const page: number = c.validated.query.page;
  const q: string | undefined = c.validated.query.q;

  // @ts-expect-error — 'foo' does not exist
  const bad = c.validated.query.foo;

  return c.json({ page, q });
});

// -------- All empty (no schemas) --------
const noSchemas = {};
const noSchemaHandler = v(noSchemas, (c) => {
  // c.validated exists but everything is default types
  const params: Record<string, string> = c.validated.params;
  const body: unknown = c.validated.body;

  return c.json({ params });
});

// Export to prevent dead-code elimination
export { bodyHandler, noSchemaHandler, paramsHandler, queryHandler };
