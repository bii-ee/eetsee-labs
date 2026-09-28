import {
    LAB06_CONFIG
} from "./config.js";

import {
    getStudentVariant
} from "../../common/js/student-variants.js";

export const LAB06_EXPERIMENT_STORAGE_KEY =
    LAB06_CONFIG.storage.experiment;

export const LAB06_VERIFIED_CALCULATIONS_STORAGE_KEY =
    LAB06_CONFIG.storage.calculationsVerified;

// The old methodology identifies a 500 W load; the updated one refers
// to the stand passport. This value is an explicit teaching baseline.
export function createVariantLoadModel(variant) {
    if (!Number.isInteger(variant) || variant < 1 || variant > 30) {
        throw new RangeError("Номер варіанта має бути від 1 до 30.");
    }

    // Шість напруг та п'ять номінальних потужностей утворюють
    // 30 відтворюваних установок. Для всіх трьох режимів
    // опір одного й того самого навантаження залишається сталим.
    const referenceVoltageV = 218 + ((variant - 1) % 6) * 2;
    const referencePowerW = 450 + Math.floor((variant - 1) / 6) * 25;

    return Object.freeze({
        referenceVoltageV,
        referencePowerW,
        resistanceOhms: referenceVoltageV ** 2 / referencePowerW
    });
}

export const LAB06_LOAD_MODEL = createVariantLoadModel(getStudentVariant());

function round(value, digits) {
    const scale = 10 ** digits;
    return Math.round(value * scale) / scale;
}

// One resistive load produces U2, I and P at every firing angle.
function createMode(position, alphaDegrees) {
    const alpha = alphaDegrees * Math.PI / 180;
    const voltageFraction =
        (Math.PI - alpha + Math.sin(2 * alpha) / 2) /
        Math.PI;
    const u1 = LAB06_LOAD_MODEL.referenceVoltageV;
    const u2 = round(
        u1 * Math.sqrt(voltageFraction),
        1
    );
    const current = round(
        u2 / LAB06_LOAD_MODEL.resistanceOhms,
        2
    );
    // P uses displayed readings, so calculations need no hidden digits.
    // За α = 0° округлення не повинно давати P > U₁I.
    const power = Math.floor(u2 * current * 10 + 1e-8) / 10;

    return Object.freeze({
        id: `mode-${position}`,
        position,
        alpha: alphaDegrees,
        readings: Object.freeze({
            u1,
            current,
            power,
            u2
        }),
        source: Object.freeze({
            type: "resistive-load-model",
            referencePowerW:
                LAB06_LOAD_MODEL.referencePowerW,
            valuesRounded: true
        })
    });
}

export const LAB06_EXPERIMENT_MODES = Object.freeze(
    LAB06_CONFIG.experiment.controlAngles.map(
        (alpha, index) => createMode(index + 1, alpha)
    )
);

export function getExperimentMode(modeId) {
    return (
        LAB06_EXPERIMENT_MODES.find(
            (mode) => mode.id === modeId
        ) ??
        LAB06_EXPERIMENT_MODES[0]
    );
}
