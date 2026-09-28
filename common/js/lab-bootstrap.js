import { initializeLaboratoryShell } from "./lab-shell.js";

export function initializeLaboratoryApp({ root = document, config, modules }) {
    return initializeLaboratoryShell({
        root,
        sectionFiles: config.sectionFiles,
        initializeModules: ({ root: sectionRoot = document } = {}) => {
            const options = { root: sectionRoot, namespace: config.namespace };
            modules.forEach((initializeModule) => initializeModule(options));
        }
    });
}
