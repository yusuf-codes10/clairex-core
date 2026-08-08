export class ClaireRequest {
    private raw: Request;
    public params: Record<string, string>;
    private method: string;
    private url: URL;

    constructor (req: Request, params: Record<string, string> = {}) {
        this.raw = req;
        this.params = params;
        this.url = new URL(req.url);
        this.method = req.method;
    }

    async json () {
        return await this.raw.json();
    }

    async text () {
        return await this.raw.text();
    }
}