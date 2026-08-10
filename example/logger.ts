import { ClaireMiddleware } from "../src/core/middleware";

export class logger extends ClaireMiddleware {
    override before () {
        console.log('nothing!');
    }
}