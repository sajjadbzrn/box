export function render(template: string, ctx: Record<string, string | boolean>): string {
  let result = template;
  result = result.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_: string, key: string, body: string) => {
    return ctx[key] ? body : "";
  });
  result = result.replace(/\{\{(\w+)\}\}/g, (_: string, key: string) => {
    const val = ctx[key];
    if (val === undefined) return `{{${key}}}`;
    return String(val);
  });
  return result;
}
