export class ClaireRequest {
    private raw: Request;
    public params: Record<string, string>;
    private _method: string;
    private _url: URL;

    constructor (req: Request, params: Record<string, string> = {}) {
        this.raw = req;
        this.params = params;
        this._url = new URL(req.url);
        this._method = req.method;
    }

    async json () {
        return await this.raw.json();
    }

    async text () {
        return await this.raw.text();
    }

    get method () {
        return this._method;
    }

    get url () {
        return this._url;
    }
}