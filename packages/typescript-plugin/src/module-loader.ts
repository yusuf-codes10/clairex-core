import type ts from 'typescript/lib/tsserverlibrary';
import { isClaireFilePath } from './utils';

export function patchModuleLoader(
    typescript: typeof ts,
    languageServiceHost: ts.LanguageServiceHost
): void {
    const origResolveModuleNameLiterals = languageServiceHost.resolveModuleNameLiterals?.bind(languageServiceHost);

    if (languageServiceHost.resolveModuleNameLiterals) {
        languageServiceHost.resolveModuleNameLiterals = (
            moduleLiterals,
            containingFile,
            redirectedReference,
            options,
            containingSourceFile,
            reusedNames
        ) => {
            // 1. Let TypeScript try resolving everything first
            const resolved = origResolveModuleNameLiterals!(
                moduleLiterals,
                containingFile,
                redirectedReference,
                options,
                containingSourceFile,
                reusedNames
            );

            // 2. For any .claire imports that failed → resolve ourselves
            return resolved.map((result, idx) => {
                const moduleName = moduleLiterals[idx].text;

                // Skip if not a .claire file or already resolved
                if (!isClaireFilePath(moduleName) || result.resolvedModule) {
                    return result;
                }

                // Resolve the .claire file as TypeScript
                const resolvedModule = resolveClaireModule(
                    typescript,
                    moduleName,
                    containingFile,
                    options
                );

                return resolvedModule
                    ? { resolvedModule }
                    : result;
            });
        };
    }
}

function resolveClaireModule(
    typescript: typeof ts,
    moduleName: string,
    containingFile: string,
    options: ts.CompilerOptions
): ts.ResolvedModuleFull | undefined {
    // Use TypeScript's own resolution but with a custom sys 
    // that knows .claire files exist
    const claireSys: ts.System = {
        ...typescript.sys,
        fileExists(path: string): boolean {
            return typescript.sys.fileExists(path);
        }
    };

    const resolved = typescript.resolveModuleName(
        moduleName,
        containingFile,
        options,
        claireSys
    );

    if (resolved.resolvedModule) {
        // Tell TypeScript to treat it as a .ts file
        return {
            resolvedFileName: resolved.resolvedModule.resolvedFileName,
            extension: typescript.Extension.Ts,
            isExternalLibraryImport: resolved.resolvedModule.isExternalLibraryImport
        };
    }

    // If TS still can't find it, try resolving the path manually
    // (the file exists, TS just doesn't try .claire as an extension)
    const path = typescript.resolveModuleName(
        moduleName,
        containingFile,
        { ...options, allowArbitraryExtensions: true },
        claireSys
    );

    if (path.resolvedModule) {
        return {
            resolvedFileName: path.resolvedModule.resolvedFileName,
            extension: typescript.Extension.Ts,
            isExternalLibraryImport: false
        };
    }

    return undefined;
}
