import { ClaireRouter } from "./router";
import type { RouterEntry, ClaireHandler } from "./types";

export abstract class ClaireController {
    protected _router = new ClaireRouter();
    protected prefix: string;

    constructor (prefix: string) {
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