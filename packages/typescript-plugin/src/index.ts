import type ts from 'typescript/lib/tsserverlibrary';
import { patchModuleLoader } from './module-loader';

function init(modules: { typescript: typeof ts }): ts.server.PluginModule {
    function create(info: ts.server.PluginCreateInfo) {
        // Patch the module loader to resolve .claire imports
        patchModuleLoader(modules.typescript, info.languageServiceHost);

        // Return the original language service (we're not decorating it yet)
        return info.languageService;
    }

    return { create };
}

export = init;
