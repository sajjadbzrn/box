import { c } from "./colors";

/**
 * Spinner frame sets for different moods/contexts.
 */
const FRAME_SETS = {
  dots: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
  arrows: ["←", "↖", "↑", "↗", "→", "↘", "↓", "↙"],
  circle: ["◡", "⊙", "◠", "⊙"],
  clock: ["🕐", "🕑", "🕒", "🕓", "🕔", "🕕", "🕖", "🕗", "🕘", "🕙", "🕚", "🕛"],
  bounce: ["⠁", "⠂", "⠄", "⡀", "⢀", "⠠", "⠐", "⠈"],
  pulse: ["█", "▓", "▒", "░", "▒", "▓"],
} as const;

type SpinnerStyle = keyof typeof FRAME_SETS;
type SpinnerColor = (text: string) => string;

export interface SpinnerOptions {
  /** The spinner animation style. Default: "dots" */
  style?: SpinnerStyle;
  /** A color function to apply to the spinner frame. Default: c.cyan */
  color?: SpinnerColor;
  /** Frame interval in ms. Default: 80 */
  interval?: number;
}

export function createSpinner(
  text: string,
  options: SpinnerOptions = {},
) {
  const frames = FRAME_SETS[options.style ?? "dots"];
  const frameColor = options.color ?? c.cyan;
  const frameInterval = options.interval ?? 80;

  if (!c.isTTY) {
    return {
      start: () => {},
      stop: () => {},
      succeed: (msg?: string) => console.log(c.success(msg ?? text)),
      fail: (msg?: string) => console.log(c.error(msg ?? text)),
    };
  }

  let i = 0;
  let interval: ReturnType<typeof setInterval> | null = null;

  return {
    start() {
      process.stdout.write("\x1b[?25l");
      interval = setInterval(() => {
        process.stdout.write(`\r${frameColor(frames[i]!)} ${text}`);
        i = (i + 1) % frames.length;
      }, frameInterval);
    },
    stop() {
      if (interval) clearInterval(interval);
      process.stdout.write("\r\x1b[K");
      process.stdout.write("\x1b[?25h");
    },
    succeed(msg?: string) {
      this.stop();
      console.log(c.success(msg ?? text));
    },
    fail(msg?: string) {
      this.stop();
      console.log(c.error(msg ?? text));
    },
    /** Update the spinner text dynamically. */
    update(newText: string) {
      text = newText;
    },
  };
}

