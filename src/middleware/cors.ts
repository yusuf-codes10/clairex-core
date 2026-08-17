import type { ClaireContext } from "../core/context";
import { ClaireMiddleware } from "../core/middleware";

export class ClaireCors extends ClaireMiddleware {
  private _origin: string;
  private _allowedHeaders: string[];
  private _allowedMethods: string[];
  private _exposeHeaders: string[];

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
    // TODO: might need to return an actual Response later
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
