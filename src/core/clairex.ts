import { ClaireRouter } from "./router";
import { ClaireContext } from "./context";
import { clairexBanner, matchRoute } from "./utils";
import { ClaireMiddleware } from "./middleware";
import { ClaireException } from "./exception";
import { ClaireLogger } from "../middleware/logger";
import { ClaireKey } from "./key";
import { ClaireValidator } from "./validator";

/**
 * The main application class for ClaireX.
 * Uses composition — owns a ClaireRouter internally for route storage.
 * Create an instance, mount your keys, register global middleware, and call listen().
 *
 * @example
 * const app = new ClaireX(3000);
 * app.mount(new UserKey());
 * app.use(new AuthGuard());
 * app.listen();
 */
export class ClaireX {
  private _port;

  private _middlewareChain: ClaireMiddleware[] = [];

  private _router = new ClaireRouter();

  /**
   * Creates a new ClaireX application.
   *
   * @param port - The port to listen on. Defaults to 3000.
   *
   * @example
   * const app = new ClaireX(8080);
   */
  constructor(port?: number) {
    this._port = port ?? 3000;
    this._middlewareChain.push(new ClaireLogger());
  }

  /**
   * Registers a global middleware that runs on every route.
   * Order matters — middlewares execute in the order they are registered.
   *
   * @param middleware - An instance of a class extending ClaireMiddleware.
   *
   * @example
   * app.use(new AuthGuard());
   * app.use(new RateLimiter());
   */
  use(middleware: ClaireMiddleware): this {
    if (middleware instanceof ClaireValidator) {
      throw new ClaireException(
        500,
        "Validators must be used on the route level!",
      ).toResponse();
    }
    this._middlewareChain.push(middleware);
    return this;
  }

  /**
   * Unlocks a resource into the application using a ClaireKey.
   * A key grants access to its routes, handlers, and scoped middlewares.
   *
   * @param key - An instance of a class extending ClaireKey.
   *
   * @example
   * app.unlock(new UserKey());
   * app.unlock(new PostKey());
   */
  unlock(key: ClaireKey): this {
    const tagged = key.router.map((route) => ({
      ...route,
      middlewares: key.middlewares,
    }));
    this._router.routes.push(...tagged);
    return this;
  }

  /**
   * Starts the server on the configured port.
   * Registers the Bun.serve fetch handler with route matching, middleware execution, and error handling.
   *
   * @example
   * app.listen();
   */
  listen(): void {
    Bun.serve({
      port: this._port,

      fetch: async (req: Request) => {
        try {
          for (const route of this._router.routes) {
             const url = new URL(req.url);

            if (route.method !== req.method) continue; //skip to next iteration

            const params = matchRoute(route.pattern, url.pathname);

            if (params === null) continue;

                        // Context created AFTER matching — params passed at birth
            const context = new ClaireContext(req, params);
            // check and loop throught the middleware
            // 1. the before loop
            for (const middleware of this._middlewareChain) {
              const early = await middleware.before(context);
              // check if that before returns a Response or not

              if (early instanceof Response) return early;
            }

            // 2. the scoped before
            if (route.middlewares) {
              for (const middleware of route.middlewares) {
                const early = await middleware.before(context);
                if (early instanceof Response) return early;
              }
            }

            // route level middleware
            if (route.routeMiddlewares) {
              for (const middleware of route.routeMiddlewares) {
                const early = await middleware.before(context);
                if (early instanceof Response) return early;
              }
            }

            // 3. Call the handler
            const response = await route.handler(context);

            // route level before
            if (route.routeMiddlewares) {
              for (let i = route.routeMiddlewares.length - 1; i >= 0; i--) {
                await route.routeMiddlewares[i]?.after(context, response);
              }
            }

            // 4. the scoped after
            if (route.middlewares) {
              for (let i = route.middlewares.length - 1; i >= 0; i--) {
                await route.middlewares[i]?.after(context, response);
              }
            }

            // 5. the after loop (reverse)
            for (let i = this._middlewareChain.length - 1; i >= 0; i--) {
              await this._middlewareChain[i]?.after(context, response);
            }

            return response;
          }

          return new ClaireException(404, "Route Not Found!").toResponse();
        } catch (e) {
          console.log("something went wrong!", e);
          if (e instanceof ClaireException) return e.toResponse();
          return new ClaireException(
            500,
            " Internal Server Error",
          ).toResponse();
        }
      },
    });

    clairexBanner(this._port);
  }
}
