import { createStorage } from "./storage.js";

// Допуск перевіряється за поточними даними, зокрема після перезавантаження.
export function isLaboratoryPrepared(config) {
    const safety = createStorage(config.storage.safety).get("progress", {});
    const stand = createStorage(config.storage.stand).get("progress", {});

    return safety?.passed === true && stand?.ready === true;
}
