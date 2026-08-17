import { logClaireException } from './utils';

/**
 * Base exception class for ClaireX.
 * Extend this to create custom typed exceptions.
 * Use `throw new ClaireException(...)` to bubble to the global catch, or `.toResponse()` to return inline.
 *
 * @example
 * // Throw (bubbles to ClaireX catch block):
 * throw new ClaireException(404, 'User not found');
 *
 * // Return inline (handler stays in control):
 * return new ClaireException(400, 'Invalid input').toResponse();
 */
export class ClaireException extends Error {
    private _statusCode: number;
    private _content: string;
    private _metadata?: Record<string, string>;

    constructor (statusCode: number, content: string, metadata?: Record<string, string>) {
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

    /**
     * Converts the exception into a structured JSON Response.
     * Logs the error to the console in a styled format.
     *
     * @returns A native Response with JSON body `{ exception: content }` and the appropriate status code.
     *
     * @example
     * return new ClaireException(404, 'Not found').toResponse();
     */
    toResponse(): Response {
        logClaireException('ClaireException', this.statusCode, this.content);
        return new Response(JSON.stringify({ exception: this._content }), {
            status: this._statusCode,
            headers: { "Content-Type": "application/json" },
        });
    }
}