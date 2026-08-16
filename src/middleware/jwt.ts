import type { ClaireContext } from "../core/context";
import { ClaireException } from "../core/exception";
import { ClaireMiddleware } from "../core/middleware";
import { verifyToken } from "../core/utils";

export class ClaireJWT extends ClaireMiddleware {
    private _secret: string;

    constructor(secret: string) {
        super();
        this._secret = secret;
    }

    override async before(c: ClaireContext) {
        const authHeader = c.request.headers.get('authorization');

        // 1. Check if the header exists
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new ClaireException(401, 'Missing or invalid token!').toResponse();
        }

        // 2. Extract token
        const token = authHeader.split(' ')[1] as string;

        // 3. Verify token
        try {
            const payload = await verifyToken(token, '');
            c.setAuth = payload;
        } catch {
            return new ClaireException(401, 'Invalid or Expired token').toResponse();
        }
    }
}