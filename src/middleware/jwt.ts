import type { ClaireContext } from "../core/context";
import { ClaireException } from "../core/exception";
import { ClaireMiddleware } from "../core/middleware";

export class ClaireJWT extends ClaireMiddleware {
    override before(c: ClaireContext) {
        const authHeader = c.request.headers.get('authorization');

        // 1. Check if the header exists
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new ClaireException(401, 'Missing or invalid token!').toResponse();
        }

        // 2. Extract token
        const token = authHeader.split(' ')[1];

        // 3. Verify token
    }
}