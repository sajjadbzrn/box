/**
 * Template engine supporting nested {{#if}}...{{else}}...{{/if}} blocks
 * and simple {{key}} interpolation.
 */

/**
 * Strip ANSI escape codes from a string to get its visible length.
 */
function stripAnsi(str: string): number {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, "").length;
}

/**
 * Find the matching {{/if}} for a {{#if ...}} block, handling nesting.
 * `start` should point to the character right after the opening {{#if ...}} tag.
 * Returns the index of the matching {{/if}} end, or -1 if not found.
 */
function findMatchingEndIf(template: string, start: number): number {
  let depth = 1;
  let i = start;

  while (i < template.length && depth > 0) {
    // Check for {{#if ...}} opening tag
    const ifOpen = template.indexOf("{{#if", i);
    // Check for {{/if}} closing tag
    const ifClose = template.indexOf("{{/if}}", i);

    if (ifClose === -1) return -1; // Unmatched

    if (ifOpen !== -1 && ifOpen < ifClose) {
      // Found an opening tag before the next closing tag → increase depth
      depth++;
      i = ifOpen + 5; // skip past "{{#if"
    } else {
      // Found a closing tag
      depth--;
      if (depth === 0) {
        return ifClose + "{{/if}}".length;
      }
      i = ifClose + "{{/if}}".length;
    }
  }

  return -1;
}

export function render(template: string, ctx: Record<string, string | boolean>): string {
  let result = template;

  // Process {{#if}} blocks (supports nesting) in a loop until none remain
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const ifStart = result.indexOf("{{#if");
    if (ifStart === -1) break;

    // Extract the key: find "{{#if key}}"
    const tagEnd = result.indexOf("}}", ifStart);
    if (tagEnd === -1) break;
    const key = result.slice(ifStart + "{{#if".length, tagEnd).trim();

    // Body starts after the opening tag's "}}"
    const bodyStart = tagEnd + "}}".length;

    // Find the matching {{/if}} handling nesting
    const endIfPos = findMatchingEndIf(result, bodyStart);
    if (endIfPos === -1) {
      // Malformed template — leave as-is
      break;
    }

    // Extract the full block content (between opening tag end and {{/if}})
    const fullBody = result.slice(bodyStart, endIfPos - "{{/if}}".length);

    // Check for {{else}}
    let output: string;
    const elseIndex = findTopLevelElse(fullBody);
    if (elseIndex !== -1) {
      const ifBody = fullBody.slice(0, elseIndex);
      const elseBody = fullBody.slice(elseIndex + "{{else}}".length);
      output = ctx[key] ? ifBody : elseBody;
    } else {
      output = ctx[key] ? fullBody : "";
    }

    // Replace the entire block
    result = result.slice(0, ifStart) + output + result.slice(endIfPos);
  }

  // Handle simple {{key}} interpolation
  result = result.replace(/\{\{(\w+)\}\}/g, (_: string, k: string) => {
    const val = ctx[k];
    if (val === undefined) return `{{${k}}}`;
    return String(val);
  });

  return result;
}

/**
 * Find the index of a top-level {{else}} inside a block body.
 * Returns the index of the first top-level {{else}}, or -1 if none.
 */
function findTopLevelElse(body: string): number {
  let depth = 0;
  let i = 0;

  while (i < body.length) {
    if (body.startsWith("{{#if", i)) {
      depth++;
      i += 5;
    } else if (body.startsWith("{{/if}}", i)) {
      depth--;
      i += 7;
    } else if (body.startsWith("{{else}}", i) && depth === 0) {
      return i;
    } else {
      i++;
    }
  }

  return -1;
}

