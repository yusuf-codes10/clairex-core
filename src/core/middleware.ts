import  { ClaireContext } from '../core/context';
import type { ClaireResponse } from './response';

export abstract class ClaireMiddleware {

    protected before (c: ClaireContext) {

    }

    protected after (c: ClaireContext, response: ClaireResponse ) {

    }
}