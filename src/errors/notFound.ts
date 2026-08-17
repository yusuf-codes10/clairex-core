import { ClaireException } from "../core/exception";

export class NotFoundException extends ClaireException {
    private _hint: string;

    constructor(statusCode: number, content: string, ) {
        super(statusCode, content);
        this._hint = 'The hint...'
    }

    get hint(): string {
        return this._hint;
    }
}