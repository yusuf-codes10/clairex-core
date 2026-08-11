import { ClaireRouter } from "./router";
import type { RouterEntry, ClaireHandler } from "./types";
import { ClaireMiddleware } from "./middleware";

export abstract class ClaireController {
  protected _router = new ClaireRouter();
  protected prefix: string;

  // each ClaireController has its own middleware chain
  private _middlewareChain?: ClaireMiddleware[] = [];

  constructor(prefix: string, middlewares: ClaireMiddleware[] = []) {
    this._middlewareChain = middlewares;
    this.prefix = prefix;
    this.register(); // have to call the register method after we have the prefix
  }

  protected abstract register(): void;

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
