import type ts from 'typescript/lib/tsserverlibrary';
import { patchModuleLoader } from './module-loader';
import { claireDiagnostics } from './diagnostics';

function init(modules: { typescript: typeof ts }): ts.server.PluginModule {
    const tsModule = modules.typescript;

    function create(info: ts.server.PluginCreateInfo) {
        // Patch the module loader to resolve .cx imports
        patchModuleLoader(tsModule, info.languageServiceHost);

        // Copy every method of the original language service onto a new object,
        // so we can override just the ones we want to change
        const proxy = Object.create(null) as ts.LanguageService;
        for (const key of Object.keys(info.languageService) as Array<keyof ts.LanguageService>) {
            const original = info.languageService[key];
            (proxy as any)[key] = (...args: unknown[]) => (original as any).apply(info.languageService, args);
        }

        // Add ClaireX diagnostics on top of the normal TypeScript ones
        proxy.getSemanticDiagnostics = (fileName) => {
            const prior = info.languageService.getSemanticDiagnostics(fileName);
            if (!fileName.endsWith('.cx')) return prior;

            const sf = info.languageService.getProgram()?.getSourceFile(fileName);
            return sf ? [...prior, ...claireDiagnostics(tsModule, sf)] : prior;
        };

        return proxy;
    }

    return { create };
}

export = init;