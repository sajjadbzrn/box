import { c } from "./colors";

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export function createSpinner(text: string) {
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
        process.stdout.write(`\r${c.cyan(FRAMES[i]!)} ${text}`);
        i = (i + 1) % FRAMES.length;
      }, 80);
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
    update(newText: string) {
      text = newText;
    },
  };
}
