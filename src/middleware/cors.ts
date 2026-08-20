import type { ClaireContext } from "../core/context";
import { ClaireMiddleware } from "../core/middleware";

/**
 * CORS middleware. Answers the browser's preflight `OPTIONS` request and adds
 * CORS headers to every response.
 *
 * Register globally — CORS is not a per-route concern. You never need to define
 * an `OPTIONS` route yourself; this middleware short-circuits those requests.
 *
 * @example
 * app.use(new ClaireCors(
 *     'https://myapp.com',
 *     ['Content-Type', 'Authorization'],
 *     ['GET', 'POST', 'PATCH', 'DELETE'],
 *     ['X-Total-Count']
 * ));
 */
export class ClaireCors extends ClaireMiddleware {
  private _origin: string;
  private _allowedHeaders: string[];
  private _allowedMethods: string[];
  private _exposeHeaders: string[];

  /**
   * Creates the CORS middleware.
   *
   * @param origin - Value for `Access-Control-Allow-Origin` (e.g. `'*'` or a specific origin).
   * @param allowedHeaders - Headers the client is permitted to send.
   * @param allowedMethods - HTTP methods the client is permitted to use.
   * @param exposeHeaders - Response headers the client is permitted to read.
   *
   * @example
   * new ClaireCors('*', ['Content-Type'], ['GET', 'POST'], []);
   */
  constructor(
    origin: string,
    allowedHeaders: string[],
    allowedMethods: string[],
    exposeHeaders: string[],
  ) {
    super();
    this._origin = origin;
    this._allowedHeaders = allowedHeaders;
    this._allowedMethods = allowedMethods;
    this._exposeHeaders = exposeHeaders;
  }

  override before(c: ClaireContext): void | Response {
    // returning options | short circuit
    if (c.request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": this._origin,
          "Access-Control-Allow-Methods": this._allowedMethods.join(", "),
          "Access-Control-Allow-Headers": this._allowedHeaders.join(", "),
          "Access-Control-Expose-Headers": this._exposeHeaders.join(", "),
        },
      });
    }
  }

  override after(c: ClaireContext, response: Response): Response {
    // add cors headers
    response.headers.set("Access-Control-Allow-Origin", this._origin);
    response.headers.set(
      "Access-Control-Allow-Methods",
      this._allowedMethods.join(", "),
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      this._allowedHeaders.join(", "),
    );
    response.headers.set(
      "Access-Control-Expose-Headers",
      this._exposeHeaders.join(", "),
    );
    return response;
  }
}
