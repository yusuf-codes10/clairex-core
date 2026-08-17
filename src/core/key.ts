import { ClaireRouter } from "./router";
import type { RouterEntry, ClaireHandler } from "./types";
import { ClaireMiddleware } from "./middleware";
import { ClaireValidator } from "./validator";
import { ClaireException } from "./exception";

/**
 * Abstract base class for defining a self-contained unit of routes, handlers, and middleware.
 * Extend this class to create a key for each resource in your API.
 *
 * @example
 * export class UserKey extends ClaireKey {
 *     constructor() {
 *         super('/users', [new AuthGuard()]);
 *     }
 *
 *     register() {
 *         this.routes('get', '/', this.getUsers);
 *         this.routes('post', '/', this.createUser, [new UserValidator()]);
 *     }
 * }
 */
export abstract class ClaireKey {
  protected _router = new ClaireRouter();
  protected prefix: string;

  // each Key has its own middleware chain
  private _middlewareChain?: ClaireMiddleware[] = [];

  constructor(prefix: string, middlewares: ClaireMiddleware[] = []) {
    for (const mw of middlewares) {
          if (mw instanceof ClaireValidator) {
            throw new ClaireException(500, 'Validators must be used on the route level only!');
          }
    }
    this._middlewareChain = middlewares;
    this.prefix = prefix;
    this.register(); // have to call the register method after we have the prefix
  }

  /**
   * Define your routes and handlers here.
   * Called automatically in the constructor after the prefix is set.
   *
   * @abstract
   * @example
   * register() {
   *     this.routes('get', '/', this.getAll);
   *     this.routes('post', '/', this.create, [new MyValidator()]);
   * }
   */
  protected abstract register(): void;

  /**
   * Registers a route on this key with an optional array of route-level middlewares.
   *
   * @param method - The HTTP method (get, post, put, patch, delete).
   * @param path - The route path, appended to the key's prefix.
   * @param handler - The handler method for this route.
   * @param middleware - Optional array of middlewares scoped to this route only.
   *
   * @example
   * this.routes('get', '/:id', this.getById);
   * this.routes('post', '/', this.create, [new UserValidator()]);
   */
  protected routes(
    method: "get" | "post" | "put" | "patch" | "delete",
    path: string,
    handler: ClaireHandler,
    middleware?: ClaireMiddleware[],
  ): void {
    this._router.routes.push({
      method: method.toUpperCase(),
      pattern: `${this.prefix}${path}`,
      handler: handler.bind(this),
      routeMiddlewares: middleware,
    });
  }

  get router(): RouterEntry[] {
    return this._router.routes;
  }

  get middlewares(): ClaireMiddleware[] | undefined {
    return this._middlewareChain;
  }
}
