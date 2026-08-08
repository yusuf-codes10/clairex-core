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

    get () {

    }

    post () {

    }

    patch () {

    }

    put () {

    }

    delete () {

    }
}