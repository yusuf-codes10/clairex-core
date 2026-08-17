import type { ClaireContext } from "../core/context";
import { ClaireMiddleware } from "../core/middleware";
import { colorMethod } from "../core/utils";

export class ClaireLogger extends ClaireMiddleware {
    private start: number = 0;

    override before(c: ClaireContext): void {
        this.start = performance.now();
        console.log(`→ ${colorMethod(c.request.method)} ${c.request.url}`);
    }

    override after(c: ClaireContext, response: Response): Response {
        const duration = (performance.now() - this.start).toFixed(2);
        console.log(`← ${colorMethod(c.request.method)} ${c.request.url} ${duration}ms`);
        return response;
    }
}