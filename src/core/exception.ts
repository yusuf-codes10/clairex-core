export class ClaireException extends Error {
    private _statusCode: number;
    private _content: string;
    private _metadata?: Record<string, string>; // might come in handy as debug info

    constructor (statusCode: number, content: string) {
        super();
        this._statusCode = statusCode;
        this._content = content;
    }

    get statusCode(): number {
        return this._statusCode;
    }

    get content(): string {
        return this._content;
    }

    get metadata(): Record<string, string> | undefined {
        return this._metadata;
    }
}