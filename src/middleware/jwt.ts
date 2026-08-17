import type { ClaireContext } from "../core/context";
import { ClaireException } from "../core/exception";
import { ClaireMiddleware } from "../core/middleware";
import { ClaireUtil } from "../utils/util";

/**
 * Built-in JWT authentication middleware.
 * Verifies Bearer tokens from the Authorization header using HMAC-SHA256.
 * Stores the decoded payload on context — access via c.auth<T>().
 *
 * @example
 * // Attach to protected routes:
 * super('/users', [new ClaireJWT(process.env.JWT_SECRET)]);
 *
 * // Access payload in handler:
 * const user = c.auth<{ userId: number, role: string }>();
 */
export class ClaireJWT extends ClaireMiddleware {
  private _secret: string;

  /**
   * Creates a ClaireJWT middleware instance.
   *
   * @param secret - The secret key used to verify token signatures.
   *
   * @example
   * new ClaireJWT('my-secret-key');
   * new ClaireJWT(process.env.JWT_SECRET);
   */
  constructor(secret: string) {
    super();
    this._secret = secret;
  }

  override async before(c: ClaireContext): Promise<void | Response> {
    const authHeader = c.request.headers.get("authorization");

    // 1. Check if the header exists
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new ClaireException(401, "Missing or invalid token!").toResponse();
    }

    // 2. Extract token
    const token = authHeader.split(" ")[1] as string;

    // 3. Verify token
    try {
      const payload = await ClaireUtil.verifyToken(token, this._secret);
      c.setAuth = payload;
    } catch {
      return new ClaireException(401, "Invalid or Expired token").toResponse();
    }
  }
}
