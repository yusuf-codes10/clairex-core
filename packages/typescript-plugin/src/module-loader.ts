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

import * as path from 'path';

// skipping typescript resolution entirely
function resolveClaireModule(
    typescript: typeof ts,
    moduleName: string,
    containingFile: string,
    options: ts.CompilerOptions
): ts.ResolvedModuleFull | undefined {
    // Since .claire imports always use the full extension,
    // resolve the path manually relative to the containing file
    const containingDir = path.dirname(containingFile);
    const resolvedPath = path.resolve(containingDir, moduleName);

    // Check if the file actually exists
    if (typescript.sys.fileExists(resolvedPath)) {
        return {
            resolvedFileName: resolvedPath,
            extension: typescript.Extension.Ts,
            isExternalLibraryImport: false
        };
    }

    return undefined;
}

