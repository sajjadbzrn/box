/**
 * compile-time type inference demo
 *
 * This file demonstrates that Box's v() correctly infers types
 * from Zod schemas into the handler's `c.validated` object.
 *
 * TypeScript will ERROR on the commented lines if the types are wrong.
 * If this file compiles, the type inference is working.
 */
declare const paramsHandler: (c: import("boxfw-core").Context) => Promise<Response>;
declare const bodyHandler: (c: import("boxfw-core").Context) => Promise<Response>;
declare const queryHandler: (c: import("boxfw-core").Context) => Promise<Response>;
declare const noSchemaHandler: (c: import("boxfw-core").Context) => Promise<Response>;

export { bodyHandler, noSchemaHandler, paramsHandler, queryHandler };
//# sourceMappingURL=type-inference.test.d.ts.map
