import type ts from 'typescript/lib/tsserverlibrary';

export function createClaireSys(typescript: typeof ts): ts.System {
    return {
        ...typescript.sys,
        fileExists(path: string): boolean {
            // If TS is looking for something.cx.ts (its guess),
            // check if something.cx exists instead
            if (path.endsWith('.cx.ts') || path.endsWith('.cx.d.ts')) {
                const cxPath = path.replace(/\.(d\.)?ts$/, '');
                return typescript.sys.fileExists(cxPath);
            }
            return typescript.sys.fileExists(path);
        }
    };
}