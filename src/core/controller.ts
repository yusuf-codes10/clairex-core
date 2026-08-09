import { ClaireRouter } from "./router";

export abstract class ClaireController {
    protected _router = new ClaireRouter();
    protected prefix: string;

    constructor (prefix: string) {
        this.prefix = prefix;
    }

    protected abstract register(): void;

    protected routes(
        method: 'get' | 'post' | 'put' | 'patch' | 'delete',
        path: string,
        handler: Function
    ) {
        this._router[method](`${this.prefix}${path}`, handler.bind(this));
    }

    get router() {
        return this._router.routes;
    }
}