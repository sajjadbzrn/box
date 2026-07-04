/**
 * Types for OpenAPI spec generation.
 */

export interface OpenApiInfo {
  title: string;
  version: string;
  description?: string;
}

export interface RouteSpec {
  method: string;
  path: string;
  params?: Record<string, string>;
  query?: Record<string, string>;
  body?: Record<string, string>;
  response?: Record<string, string>;
  summary?: string;
  tags?: string[];
}

export interface OpenApiDoc {
  openapi: string;
  info: OpenApiInfo;
  paths: Record<string, Record<string, unknown>>;
  components?: Record<string, unknown>;
}
