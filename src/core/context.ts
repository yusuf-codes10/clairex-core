import { ClaireRequest } from "./request";
import { ClaireResponse } from "./response";

export class ClaireContext {
    // composition of both ClaireRouter & ClaireResponse here
    public request: ClaireRequest;
    public response: ClaireResponse;

    private _valid: unknown = {};

    constructor (req: Request) {
        this.request = new ClaireRequest(req);
        this.response = new ClaireResponse();
    }

    set setBody(data: unknown) {
        this._valid = data;
    }

    valid<T>(): T {
        return this._valid as T;
    }
}