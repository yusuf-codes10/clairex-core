import type { ClaireContext } from "../core/context";
import { ClaireMiddleware } from "../core/middleware";

export class ClaireLogger extends ClaireMiddleware {
    override before(c: ClaireContext) {
        console.log(`${c.request.method} ${c.request.url}`);
    }
}