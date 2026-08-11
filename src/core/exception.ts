export class ClaireException extends Error {
    private _statusCode: number;
    private _content: string;

    constructor (statusCode: number, content: string) {
        super();
        this._statusCode = statusCode;
        this._content = content;
    }

    get statusCode () {
        return this._statusCode;
    }

    get content() {
        return this._content;
    }
}