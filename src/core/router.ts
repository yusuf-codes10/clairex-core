type RouterEntry = {
    method: string,
    pattern: string,
    handler: Function
}

export class ClaireRouter {
    protected routes: RouterEntry [] = [];

    private register (method: string, path: string, handler: Function) {
        this.routes.push({method, pattern: path, handler});
    }

    get (path: string, handler: Function) {
        this.register('GET', path, handler);
    }

    post (path: string, handler: Function) {
        this.register('GET', path, handler);
    }

    patch (path: string, handler: Function) {
        this.register('POST', path, handler);
    }

    put (path: string, handler: Function) {
        this.register('PUT', path, handler);
    }

    delete (path: string, handler: Function) {
        this.register('DELETE', path, handler);
    }
}