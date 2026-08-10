import type { ClaireContext } from "../src/core/context";
import { ClaireMiddleware } from "../src/core/middleware";

export class logger extends ClaireMiddleware {
    override before (c: ClaireContext) {
        console.log('first middlware', c.request.method, c.request.pathname);
    }
}