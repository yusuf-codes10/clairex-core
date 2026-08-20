import { ClaireRequest } from "./request";
import { ClaireResponse } from "./response";
import { ClaireException } from "./exception";

export class ClaireContext {
  // composition of both ClaireRouter & ClaireResponse here
  public request: ClaireRequest;
  public response: ClaireResponse;

  private _valid: unknown = {};
  private _partial: unknown = {};
  private _auth: Record<string, unknown> | null = null;

  constructor(req: Request, params: Record<string, string> = {}) {
    this.request = new ClaireRequest(req, params);
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
    if (
      this._valid === undefined ||
      (typeof this._valid === "object" &&
        Object.keys(this._valid as object).length === 0)
    ) {
      throw new ClaireException(
        500,
        "No validated body found. Did you forget to attach a ClaireValidator middleware to this route?",
      );
    }

    return this._valid as T;
  }

  // patched
  patched<T>(): Partial<T> {
    if (!this._partial) {
      throw new ClaireException(500, 'This route received a full body. Use c.valid<T>() instead.');
    }
    return this._valid as Partial<T>;
  }

  /**
   * Returns the authenticated user's token payload as a typed object.
   * Must be used after a ClaireJWT middleware has run on the route.
   *
   * @template T - The expected type of the decoded token payload.
   * @returns The decoded auth payload cast to type T.
   *
   * @example
   * type TokenPayload = { userId: number, role: string };
   * const user = c.auth<TokenPayload>();
   */
  auth<T>(): T {
    if (!this._auth) {
      throw new ClaireException(
        500,
        "No auth payload found. Did you forget to attach a ClaireJWT middleware?",
      );
    }
    return this._auth as T;
  }

  /**
   * @internal
   * Sets the authenticated payload. Called by ClaireJWT middleware.
   */
  set setAuth(data: Record<string, unknown>) {
    this._auth = data;
  }
}
