export class ClaireRequest {
    private raw: Request;
    public params: Record<string, string>;

    constructor (req: Request, params: Record<string, string> = {}) {
        this.raw = req;
        this.params = params;
    }

    json () {

    }

    text () {
        
    }
}