export function render(template: string, ctx: Record<string, string | boolean>): string {
  let result = template;
  // Handle {{#if key}}...{{else}}...{{/if}}
  result = result.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_: string, key: string, body: string) => {
    if (body.includes("{{else}}")) {
      const [ifBody, elseBody] = body.split("{{else}}");
      return ctx[key] ? (ifBody ?? "") : (elseBody ?? "");
    }
    return ctx[key] ? body : "";
  });
  // Handle simple {{key}} interpolation
  result = result.replace(/\{\{(\w+)\}\}/g, (_: string, key: string) => {
    const val = ctx[key];
    if (val === undefined) return `{{${key}}}`;
    return String(val);
  });
  return result;
}
