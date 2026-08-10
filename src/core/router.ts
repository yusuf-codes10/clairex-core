import { ClaireController } from "./controller";
import type { RouterEntry } from "./types";

export class ClaireRouter {
    protected _routes: RouterEntry [] = [];

    private register (method: string, path: string, handler: Function): void {
        this._routes.push({method, pattern: path, handler});
    }

    get (path: string, handler: Function): void {
        this.register('GET', path, handler);
    }

    post (path: string, handler: Function): void {
        this.register('POST', path, handler);
    }

    patch (path: string, handler: Function): void {
        this.register('PATCH', path, handler);
    }

    put (path: string, handler: Function): void {
        this.register('PUT', path, handler);
    }

    delete (path: string, handler: Function): void {
        this.register('DELETE', path, handler);
    }

    get routes() {
        return this._routes;
    }

    mount(controller: ClaireController) {
        this._routes.push(...controller.router);
    }
}