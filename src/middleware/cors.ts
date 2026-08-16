import { ClaireMiddleware } from "../core/middleware";

export class ClaireCors extends ClaireMiddleware {
    private _origin: string;
    private _alloweHeaders: string[];
    private _allowedMethods: string[];

    constructor (origin: string, allowedHeaders: string[], allowedMethods: string[]) {
        super();
        this._origin = origin;
        this._alloweHeaders = allowedHeaders;
        this._allowedMethods = allowedMethods;

    }
}