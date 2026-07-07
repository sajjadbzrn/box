const INVALID_NAME_RE = /[\s~)('!*]/;
const NPM_NAME_RE = /^(@[a-z0-9-]+?\/)?[a-z0-9][a-z0-9._-]*[a-z0-9]$/;

export function validateProjectName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Project name cannot be empty.";
  if (trimmed.length > 214) return "Project name is too long (max 214 chars).";
  if (INVALID_NAME_RE.test(trimmed)) return "Project name contains invalid characters for a directory name.";
  if (!NPM_NAME_RE.test(trimmed)) return "Project name is not a valid npm package name.";
  return null;
}
