export class ClaireException extends Error {
    private _statusCode: number;
    private _content: string;
    private _metadata?: Record<string, string>; // might come in handy as debug info

    constructor (statusCode: number, content: string, metadata: Record<string, string>) {
        super(content);
        this._statusCode = statusCode;
        this._content = content;
        this.name = 'ClaireException';
        this._metadata = metadata;
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

    toResponse(): Response {
        return new Response(JSON.stringify({ exception: this._content }), {
            status: this._statusCode,
            headers: { "Content-Type": "application/json" },
        });
    }
}