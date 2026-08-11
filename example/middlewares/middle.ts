import type { ClaireContext } from "../../src/core/context";
import { ClaireMiddleware } from "../../src/core/middleware";

export class middle extends ClaireMiddleware {
    override before(c: ClaireContext) {
        console.log('Middle Middleware');
    }
}