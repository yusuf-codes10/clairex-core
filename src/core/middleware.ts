import { ClaireContext } from "./context";


/**
 * Abstract base class for creating middlewares.
 * Extend this class and override `before()` and/or `after()` to add custom logic.
 *
 * @example
 * class AuthGuard extends ClaireMiddleware {
 *     override before(c: ClaireContext) {
 *         if (!c.request.headers.get('authorization')) {
 *             return c.response.json({ error: 'Unauthorized' }, 401);
 *         }
 *     }
 * }
 */
export abstract class ClaireMiddleware {

    /**
   * Runs before the route handler. Return a Response to short-circuit (skip the handler).
   *
   * @param ctx - The request context.
   * @returns void to continue, or a Response to short-circuit.
   *
   * @example
   * override before(c: ClaireContext) {
   *     console.log(`${c.request.method} ${c.request.pathname}`);
   * }
   */
  before(ctx: ClaireContext): void | Response | Promise<void | Response> {}


  /**
   * Runs after the route handler in reverse order (onion model).
   *
   * @param ctx - The request context.
   * @param response - The response returned by the handler.
   * @returns The response (modified or unchanged).
   *
   * @example
   * override after(c: ClaireContext, response: Response): Response {
   *     console.log(`Response status: ${response.status}`);
   *     return response;
   * }
   */
  after(ctx: ClaireContext, response: Response): Response | Promise<Response> {
    return response;
  }
}
