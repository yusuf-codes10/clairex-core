export class ClaireRequest {
    private raw: Request;
    public params: Record<string, string>;

    constructor (req: Request, params: Record<string, string> = {}) {
        this.raw = req;
        this.params = params;
    }

    async json () {
        return await this.raw.json();
    }

    async text () {
        return await this.raw.text();
    }
}