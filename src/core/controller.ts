import { ClaireRouter } from "./router";

export abstract class ClaireController {
    protected _router = new ClaireRouter();
    protected prefix: string;

    constructor (prefix: string) {
        this.prefix = prefix;
    }

    protected abstract register(): void;
}