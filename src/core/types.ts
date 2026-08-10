// types

import type { ClaireContext } from "./context"

export type ClaireHandler = (c: ClaireContext) => Response | Promise<Response>;

export type RouterEntry = {
    method: string,
    pattern: string,
    handler: ClaireHandler
}