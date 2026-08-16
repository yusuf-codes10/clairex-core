import { ClaireMiddleware } from "../core/middleware";

export class ClaireCors extends ClaireMiddleware {
    private _origin: string;
    private _alloweHeaders: string[];
    private _allowedMethods: string[];
    private _exposeHeaders: string[];

    constructor (origin: string, allowedHeaders: string[], allowedMethods: string[], exposeHeaders: string[]) {
        super();
        this._origin = origin;
        this._alloweHeaders = allowedHeaders;
        this._allowedMethods = allowedMethods;
        this._exposeHeaders = exposeHeaders
    }

    override before() {
        // returning options | short circuit
    }

    override after() {
        // add cors headers
    }
}