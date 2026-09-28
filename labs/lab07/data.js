import { getStudentVariant } from "../../common/js/student-variants.js";

const BASE_EXPERIMENT_MODES = Object.freeze([
    Object.freeze({
        id: "mode-1",
        position: 1,
        initialTemperature: 24,
        cycles: Object.freeze([
            Object.freeze({
                tOn: 12,
                tOff: 35,
                tauOn: 68,
                tauOff: 49
            }),
            Object.freeze({
                tOn: 13,
                tOff: 37,
                tauOn: 74,
                tauOff: 54
            }),
            Object.freeze({
                tOn: 11,
                tOff: 34,
                tauOn: 78,
                tauOff: 58
            })
        ])
    }),
    Object.freeze({
        id: "mode-2",
        position: 2,
        initialTemperature: 58,
        cycles: Object.freeze([
            Object.freeze({
                tOn: 22,
                tOff: 23,
                tauOn: 138,
                tauOff: 99
            }),
            Object.freeze({
                tOn: 24,
                tOff: 23,
                tauOn: 151,
                tauOff: 109
            }),
            Object.freeze({
                tOn: 23,
                tOff: 24,
                tauOn: 160,
                tauOff: 116
            })
        ])
    }),
    Object.freeze({
        id: "mode-3",
        position: 3,
        initialTemperature: 116,
        cycles: Object.freeze([
            Object.freeze({
                tOn: 36,
                tOff: 13,
                tauOn: 245,
                tauOff: 205
            }),
            Object.freeze({
                tOn: 39,
                tOff: 12,
                tauOn: 273,
                tauOff: 226
            }),
            Object.freeze({
                tOn: 34,
                tOff: 12,
                tauOn: 292,
                tauOff: 241
            })
        ])
    })
]);

export function createVariantCycleModes(variant) {
    if (!Number.isInteger(variant) || variant < 1 || variant > 30) {
        throw new RangeError("Номер варіанта має бути від 1 до 30.");
    }

    // Шість зсувів тривалості та п'ять рівнів теплової інерції.
    // Однаковий зсув температур у трьох режимах зберігає
    // безперервність між кінцем попереднього та початком наступного.
    const timeShift = (variant - 1) % 6;
    const thermalShift = Math.floor((variant - 1) / 6);
    const temperatureShift = timeShift + 2 * thermalShift;

    return Object.freeze(BASE_EXPERIMENT_MODES.map((mode, modeIndex) =>
        Object.freeze({
            id: mode.id,
            position: mode.position,
            initialTemperature: mode.initialTemperature + temperatureShift,
            cycles: Object.freeze(mode.cycles.map((cycle) => Object.freeze({
                tOn: cycle.tOn + timeShift + thermalShift * (modeIndex + 1),
                tOff: cycle.tOff + thermalShift + timeShift % 3,
                tauOn: cycle.tauOn + temperatureShift,
                tauOff: cycle.tauOff + temperatureShift
            })))
        })
    ));
}

export const LAB07_EXPERIMENT_MODES =
    createVariantCycleModes(getStudentVariant());
