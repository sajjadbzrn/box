import type { OpenApiInfo, OpenApiDoc, RouteSpec } from "./types";

/**
 * Generate an OpenAPI 3.0 spec from registered route specs.
 *
 * @example
 * ```ts
 * import { openapi } from "boxfw-openapi";
 *
 * app.get("/openapi.json", openapi({
 *   title: "My API",
 *   version: "1.0.0",
 * }, [
 *   {
 *     method: "GET",
 *     path: "/users",
 *     summary: "List users",
 *     tags: ["Users"],
 *     response: { "200": "User[]" },
 *   },
 * ]));
 * ```
 */
export function openapi(info: OpenApiInfo, routes: RouteSpec[]): (() => Response) {
  return () => {
    const doc: OpenApiDoc = {
      openapi: "3.0.3",
      info,
      paths: {},
    };

    for (const route of routes) {
      const pathKey = convertParams(route.path);
      if (!doc.paths[pathKey]) doc.paths[pathKey] = {};

      const operation: Record<string, unknown> = {
        summary: route.summary ?? "",
        tags: route.tags ?? [],
        responses: {
          "200": { description: "OK" },
        },
      };

      // Params
      if (route.params && Object.keys(route.params).length > 0) {
        operation.parameters = Object.entries(route.params).map(([name, desc]) => ({
          name,
          in: "path",
          required: true,
          schema: { type: "string" },
          description: desc,
        }));
      }

      // Query
      if (route.query && Object.keys(route.query).length > 0) {
        const qParams = Object.entries(route.query).map(([name, desc]) => ({
          name,
          in: "query",
          required: false,
          schema: { type: "string" },
          description: desc,
        }));
        operation.parameters = [...(operation.parameters as unknown[] ?? []), ...qParams];
      }

      // Body
      if (route.body) {
        operation.requestBody = {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: Object.fromEntries(
                  Object.entries(route.body).map(([key, desc]) => [
                    key,
                    { type: "string", description: desc },
                  ]),
                ),
              },
            },
          },
        };
      }

      doc.paths[pathKey]![route.method.toLowerCase()] = operation;
    }

    return new Response(JSON.stringify(doc, null, 2), {
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  };
}

function convertParams(path: string): string {
  return path.replace(/:(\w+)/g, "{$1}");
}

/**
 * Helper: extract Zod schema shapes to OpenAPI-compatible property definitions.
 */
export function zodToOpenApi(schema: unknown): Record<string, unknown> {
  if (schema === null || schema === undefined || typeof schema !== "object") return {};
  const def = schema as { shape?: Record<string, unknown> };
  if (!def.shape) return {};

  const properties: Record<string, unknown> = {};
  for (const [key, field] of Object.entries(def.shape)) {
    properties[key] = zodFieldToSchema(field);
  }

  return properties;
}

function zodFieldToSchema(field: unknown): Record<string, unknown> {
  const f = field as {
    _def?: { typeName?: string; checks?: Array<{ kind: string; value?: unknown }> };
    isOptional?: () => boolean;
  };

  const typeName = f._def?.typeName ?? "ZodString";
  const typeMap: Record<string, string> = {
    ZodString: "string",
    ZodNumber: "number",
    ZodBoolean: "boolean",
    ZodArray: "array",
    ZodObject: "object",
    ZodEnum: "string",
  };

  return {
    type: typeMap[typeName] ?? "string",
  };
}
