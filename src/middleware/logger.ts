import type { ClaireContext } from "../core/context";
import { ClaireMiddleware } from "../core/middleware";
import { colorMethod } from "../core/utils";

/**
 * Request logger. Prints the method and URL on the way in, and again on the way
 * out with the elapsed time.
 *
 * Auto-registered as the first global middleware by the ClaireX constructor —
 * every app logs by default with no setup.
 *
 * @example
 * // → GET http://localhost:3000/users
 * // ← GET http://localhost:3000/users 2.34ms
 */
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