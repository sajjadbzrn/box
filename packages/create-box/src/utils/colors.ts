const CSI = "\x1b[";
const SGR = (n: number) => `${CSI}${n}m`;

const isTTY = process.stdout.isTTY && process.env.NO_COLOR === undefined;

function color(code: number, text: string): string {
  return isTTY ? `${SGR(code)}${text}${SGR(0)}` : text;
}

/**
 * Convert a hex color to R, G, B components.
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const match = hex.replace("#", "").match(/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!match) return null;
  return { r: Number.parseInt(match[1]!, 16), g: Number.parseInt(match[2]!, 16), b: Number.parseInt(match[3]!, 16) };
}

/**
 * Apply a foreground true-color (24-bit) code.
 */
function trueColor(r: number, g: number, b: number, text: string): string {
  if (!isTTY) return text;
  return `${CSI}38;2;${r};${g};${b}m${text}${SGR(0)}`;
}

/**
 * Apply a background true-color (24-bit) code.
 */
function bgTrueColor(r: number, g: number, b: number, text: string): string {
  if (!isTTY) return text;
  return `${CSI}48;2;${r};${g};${b}m${text}${SGR(0)}`;
}

/**
 * Interpolate between two colors for a gradient effect.
 * `steps` controls how many segments to split the text into.
 */
function gradient(text: string, fromHex: string, toHex: string): string {
  if (!isTTY || !text) return text;
  const from = hexToRgb(fromHex);
  const to = hexToRgb(toHex);
  if (!from || !to) return text;

  const chars = [...text];
  const len = chars.length;
  return chars
    .map((ch, i) => {
      if (ch === " " || ch === "\n") return ch;
      const t = len > 1 ? i / (len - 1) : 0.5;
      const r = Math.round(from.r + (to.r - from.r) * t);
      const g = Math.round(from.g + (to.g - from.g) * t);
      const b = Math.round(from.b + (to.b - from.b) * t);
      return `${CSI}38;2;${r};${g};${b}m${ch}${SGR(0)}`;
    })
    .join("");
}

/**
 * Apply a hex color to text.
 */
function hex(hex: string, text: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return text;
  return trueColor(rgb.r, rgb.g, rgb.b, text);
}

/**
 * Apply a background hex color to text.
 */
function bgHex(hex: string, text: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return text;
  return bgTrueColor(rgb.r, rgb.g, rgb.b, text);
}

export const c = {
  reset: (t: string) => color(0, t),
  bold: (t: string) => color(1, t),
  dim: (t: string) => color(2, t),
  italic: (t: string) => color(3, t),
  underline: (t: string) => color(4, t),
  red: (t: string) => color(31, t),
  green: (t: string) => color(32, t),
  yellow: (t: string) => color(33, t),
  blue: (t: string) => color(34, t),
  magenta: (t: string) => color(35, t),
  cyan: (t: string) => color(36, t),
  white: (t: string) => color(37, t),
  gray: (t: string) => color(90, t),
  /** Bright/light variants */
  brightRed: (t: string) => color(91, t),
  brightGreen: (t: string) => color(92, t),
  brightYellow: (t: string) => color(93, t),
  brightBlue: (t: string) => color(94, t),
  brightMagenta: (t: string) => color(95, t),
  brightCyan: (t: string) => color(96, t),
  /** Background colors */
  bgRed: (t: string) => color(41, t),
  bgGreen: (t: string) => color(42, t),
  bgYellow: (t: string) => color(43, t),
  bgBlue: (t: string) => color(44, t),
  bgMagenta: (t: string) => color(45, t),
  bgCyan: (t: string) => color(46, t),
  /** Compound helpers */
  success: (t: string) => `${isTTY ? `${SGR(32)}✓${SGR(0)}` : "(ok)"} ${t}`,
  error: (t: string) => `${isTTY ? `${SGR(31)}✗${SGR(0)}` : "(err)"} ${t}`,
  info: (t: string) => `${isTTY ? `${SGR(34)}ℹ${SGR(0)}` : "(i)"} ${t}`,
  warn: (t: string) => `${isTTY ? `${SGR(33)}⚠${SGR(0)}` : "(warn)"} ${t}`,
  /** True-color helpers */
  hex,
  bgHex,
  gradient,
  isTTY,
};

