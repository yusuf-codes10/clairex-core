import type ts from 'typescript/lib/tsserverlibrary';

export function createClaireSys(typescript: typeof ts): ts.System {
    return {
        ...typescript.sys,
        fileExists(path: string): boolean {
            // If TS is looking for something.claire.ts (its guess), 
            // check if something.claire exists instead
            if (path.endsWith('.claire.ts') || path.endsWith('.claire.d.ts')) {
                const clairePath = path.replace(/\.(d\.)?ts$/, '');
                return typescript.sys.fileExists(clairePath);
            }
            return typescript.sys.fileExists(path);
        }
    };
}
