import type { ClaireContext } from "../src/core/context";
import { ClaireMiddleware } from "../src/core/middleware";

export class tester extends ClaireMiddleware {
    override before (c: ClaireContext) {
        if (c.request.method === 'POST') {
            console.log('2nd', c.request.headers);
        } else {
            return c.response.json({msg: 'Not a POST request!'});
        }
    }
}