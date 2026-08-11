import { ClaireRouter } from "./router";
import type { RouterEntry, ClaireHandler } from "./types";
import { ClaireMiddleware } from "./middleware";

export abstract class ClaireController {
    protected _router = new ClaireRouter();
    protected prefix: string;

    // each ClaireController has its own middleware chain
    private _middlewareChain?: ClaireMiddleware[] = [];

    constructor (prefix: string, middlewares: ClaireMiddleware[] = []) {
        this._middlewareChain = middlewares;
        this.prefix = prefix;
        this.register() // have to call the register method after we have the prefix
    }

    protected abstract register(): void;

    protected routes(
        method: 'get' | 'post' | 'put' | 'patch' | 'delete',
        path: string,
        handler: ClaireHandler
    ): void {
        this._router[method](`${this.prefix}${path}`, handler.bind(this));
    }

    get router(): RouterEntry[] {
        return this._router.routes;
    }
}