const CSI = "\x1b[";
const SGR = (n: number) => `${CSI}${n}m`;

const isTTY = process.stdout.isTTY && process.env.NO_COLOR === undefined;

function color(code: number, text: string): string {
  return isTTY ? `${SGR(code)}${text}${SGR(0)}` : text;
}

export const c = {
  reset: (t: string) => color(0, t),
  bold: (t: string) => color(1, t),
  dim: (t: string) => color(2, t),
  red: (t: string) => color(31, t),
  green: (t: string) => color(32, t),
  yellow: (t: string) => color(33, t),
  blue: (t: string) => color(34, t),
  magenta: (t: string) => color(35, t),
  cyan: (t: string) => color(36, t),
  white: (t: string) => color(37, t),
  gray: (t: string) => color(90, t),
  success: (t: string) => `${isTTY ? SGR(32) + "✓" + SGR(0) : "(ok)"} ${t}`,
  error: (t: string) => `${isTTY ? SGR(31) + "✗" + SGR(0) : "(err)"} ${t}`,
  info: (t: string) => `${isTTY ? SGR(34) + "ℹ" + SGR(0) : "(i)"} ${t}`,
  warn: (t: string) => `${isTTY ? SGR(33) + "⚠" + SGR(0) : "(warn)"} ${t}`,
  isTTY,
};
