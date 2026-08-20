import { ClaireRequest } from "./request";
import { ClaireResponse } from "./response";
import { ClaireException } from "./exception";

/**
 * Per-request context, created fresh for every incoming request.
 * Composition of ClaireRequest and ClaireResponse, plus storage for data
 * written by middleware and read by the handler (validated body, auth payload).
 *
 * Passed as the single argument to every route handler.
 *
 * @example
 * private getUsers(c: ClaireContext): Response {
 *     const { id } = c.request.params;
 *     return c.response.json(users);
 * }
 */
export class ClaireContext {
  // composition of both ClaireRouter & ClaireResponse here
  public request: ClaireRequest;
  public response: ClaireResponse;

  private _valid: unknown = {};
  private _partial: boolean = false;
  private _auth: Record<string, unknown> | null = null;

  constructor(req: Request, params: Record<string, string> = {}) {
    this.request = new ClaireRequest(req, params);
    this.response = new ClaireResponse();
  }

  /**
   * @internal
   * Stores the validated request body. Called by ClaireValidator after all rules pass.
   * Contains only fields declared in the schema — unknown keys are stripped.
   */
  set body(data: unknown) {
    this._valid = data;
  }

  /**
   * @internal
   * Marks whether the validated body is partial (PATCH) or full (POST/PUT).
   * Called by ClaireValidator. Determines whether the handler must read via
   * `valid<T>()` or `patched<T>()`.
   */
  set partial(flag: boolean) {
    this._partial = flag;
  }

  /**
   * Returns the validated request body as a typed object.
   * Must be used after a ClaireValidator middleware has run on the route.
   *
   * For full-body methods only (POST, PUT). On a PATCH route the body is
   * partial — use `patched<T>()` instead.
   *
   * @template T - The expected type of the validated body.
   * @returns The validated body cast to type T. Every field is guaranteed present.
   * @throws ClaireException 500 if the body was partial (wrong accessor for a PATCH route).
   * @throws ClaireException 500 if no validated body exists (missing ClaireValidator).
   *
   * @example
   * const user = c.valid<User>();
   */
  valid<T>(): T {
    // reject partial bodies
    if(this._partial) {
      throw new ClaireException(500,
        'This route received a partial body (PATCH). Use c.patched<T>() instead.'
      )
    }

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

  /**
   * Returns the validated PATCH body as a partial object.
   * Must be used after a ClaireValidator middleware has run on a PATCH route.
   *
   * Returns `Partial<T>` rather than `T` — on PATCH only the fields the client
   * actually sent are validated and stored, so every property is optional.
   * TypeScript therefore forces you to check each field before using it, which
   * prevents accidentally overwriting stored values with `undefined`.
   *
   * @template T - The full resource type. The return type is narrowed to Partial<T>.
   * @returns The validated body cast to Partial<T>. Fields may be absent.
   * @throws ClaireException 500 if the body was full (use `valid<T>()` on POST/PUT routes).
   *
   * @example
   * const patch = c.patched<User>();
   *
   * if (patch.name !== undefined) foundUser.name = patch.name;
   * if (patch.age  !== undefined) foundUser.age  = patch.age;
   */
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
