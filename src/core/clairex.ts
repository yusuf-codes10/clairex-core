import { ClaireRouter } from "./router";
import { ClaireContext } from "./context";
import { clairexBanner, matchRoute } from "./utils";
import { ClaireMiddleware } from "./middleware";
import { ClaireException } from "./exception";
import { ClaireLogger } from "../middleware/ClaireLogger";
export class ClaireX extends ClaireRouter {
  private port;

  private _middlewareChain: ClaireMiddleware[] = [];

  constructor(port?: number) {
    super();
    this.port = port ?? 3000;
    this._middlewareChain.push(new ClaireLogger());
  }

  use(middleware: ClaireMiddleware): void {
    this._middlewareChain.push(middleware);
  }

  listen() {
    Bun.serve({
      port: this.port,

      fetch: async (req: Request) => {
        try {
          const context = new ClaireContext(req);

          for (const route of this.routes) {
            if (route.method !== context.request.method) continue; //skip to next iteration

            const params = matchRoute(route.pattern, context.request.pathname);

            if (params === null) continue;

            // TODO: we might solve this with ClaireNiddleware or something
            context.request.params = params;

            // check and loop throught the middleware
            // 1. the before loop
            for (const middleware of this._middlewareChain) {
              const early = await middleware.before(context);
              // check if that before returns a Response or not
              // TODO: might have an option to call after() in a short cicuit
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
            // return route.handler(context);
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

    clairexBanner(this.port);
  }
}
