import { ClaireRequest } from "./request";
import { ClaireResponse } from "./response";

export class ClaireContext {
  // composition of both ClaireRouter & ClaireResponse here
  public request: ClaireRequest;
  public response: ClaireResponse;

  private _valid: unknown = {};

  constructor(req: Request) {
    this.request = new ClaireRequest(req);
    this.response = new ClaireResponse();
  }

  set body(data: unknown) {
    this._valid = data;
  }

  /**
   * Returns the validated request body as a typed object.
   * Must be used after a ClaireValidator middleware has run on the route.
   *
   * @template T - The expected type of the validated body.
   * @returns The validated body cast to type T.
   *
   * @example
   * const user = c.valid<User>();
   */
  valid<T>(): T {
    return this._valid as T;
  }
}
