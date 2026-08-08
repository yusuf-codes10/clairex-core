import { ClaireRequest } from "./request";
import { ClaireResponse } from "./response";

export class ClaireContext {
    // composition of both ClaireRouter & ClaireResponse here
    public request: ClaireRequest;
    public response: ClaireResponse;

    constructor (req: Request) {
        this.request = new ClaireRequest(req);
        this.response = new ClaireResponse();
    }
}