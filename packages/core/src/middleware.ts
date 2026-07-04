import type { Context } from "./context";
import type { Middleware, Handler } from "./types";

/**
 * Compose an array of middleware into a single pipeline.
 *
 * Middleware executes in **onion-model** order:
 * the first middleware wraps the second, which wraps the third,
 * which eventually reaches the route handler.
 *
 * Each middleware receives `(ctx, next)` where `next()` returns a `Promise<Response>`.
 * A middleware must return a `Response` — either from `await next()`, or
 * constructed directly to short-circuit the chain.
 *
 * @example
 * ```ts
 * const pipeline = compose([logger, auth]);
 * // pipeline(ctx, handler) => Response
 * ```
 */
export function compose(
  middlewares: Middleware[],
): (c: Context, finalHandler: Handler) => Promise<Response> {
  return async (ctx: Context, finalHandler: Handler): Promise<Response> => {
    let index = -1;

    const dispatch = async (i: number): Promise<Response> => {
      if (i <= index) {
        throw new Error("next() called multiple times in the same middleware");
      }
      index = i;

      if (i >= middlewares.length) {
        return finalHandler(ctx);
      }

      const mw = middlewares[i]!;
      return mw(ctx, () => dispatch(i + 1));
    };

    return dispatch(0);
  };
}
