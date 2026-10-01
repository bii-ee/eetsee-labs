import { getStudentVariant } from "../../common/js/student-variants.js";

// Тривалості наведено в модельних секундах. Положення регулятора
// змінює співвідношення часу ввімкнення та вимкнення конфорки.
const BASE_MODE_SCHEDULES = Object.freeze([
    Object.freeze({
        id: "mode-1",
        position: 1,
        cycles: Object.freeze([
            Object.freeze({ tOn: 370, tOff: 650 }),
            Object.freeze({ tOn: 350, tOff: 635 }),
            Object.freeze({ tOn: 340, tOff: 625 })
        ])
    }),
    Object.freeze({
        id: "mode-2",
        position: 2,
        cycles: Object.freeze([
            Object.freeze({ tOn: 435, tOff: 440 }),
            Object.freeze({ tOn: 450, tOff: 425 }),
            Object.freeze({ tOn: 440, tOff: 430 })
        ])
    }),
    Object.freeze({
        id: "mode-3",
        position: 3,
        cycles: Object.freeze([
            Object.freeze({ tOn: 500, tOff: 365 }),
            Object.freeze({ tOn: 515, tOff: 350 }),
            Object.freeze({ tOn: 510, tOff: 345 })
        ])
    })
]);

function checkVariant(variant) {
    if (!Number.isInteger(variant) || variant < 1 || variant > 30) {
        throw new RangeError("Номер варіанта має бути від 1 до 30.");
    }
}

export function createVariantThermalModel(variant) {
    checkVariant(variant);

    const timeShift = (variant - 1) % 6;
    const inertiaShift = Math.floor((variant - 1) / 6);

    // Спрощена модель теплової інерції однієї відкритої конфорки.
    // Гранична температура є параметром моделі, а не показом стенда.
    return Object.freeze({
        ambientTemperature: 24 + 0.6 * inertiaShift,
        heatingLimit: 235 + 1.7 * timeShift,
        heatingTimeConstant: 900 + 30 * inertiaShift,
        coolingTimeConstant: 1050 + 45 * inertiaShift
    });
}

export function createVariantCycleModes(variant) {
    const model = createVariantThermalModel(variant);
    const timeShift = (variant - 1) % 6;
    const inertiaShift = Math.floor((variant - 1) / 6);

    let temperature = Math.round(model.ambientTemperature);

    return Object.freeze(BASE_MODE_SCHEDULES.map((mode) => {
        const initialTemperature = temperature;

        const cycles = mode.cycles.map(({ tOn, tOff }) => {
            const heatingTime = tOn + 3 * timeShift + 2 * inertiaShift;
            const coolingTime = tOff + 2 * timeShift + 3 * inertiaShift;

            const tauOn = Math.round(
                model.heatingLimit +
                (temperature - model.heatingLimit) *
                Math.exp(-heatingTime / model.heatingTimeConstant)
            );

            const tauOff = Math.round(
                model.ambientTemperature +
                (tauOn - model.ambientTemperature) *
                Math.exp(-coolingTime / model.coolingTimeConstant)
            );

            temperature = tauOff;

            return Object.freeze({
                tOn: heatingTime,
                tOff: coolingTime,
                tauOn,
                tauOff
            });
        });

        return Object.freeze({
            id: mode.id,
            position: mode.position,
            initialTemperature,
            cycles: Object.freeze(cycles)
        });
    }));
}

const studentVariant = getStudentVariant();

export const LAB07_THERMAL_MODEL =
    createVariantThermalModel(studentVariant);

export const LAB07_EXPERIMENT_MODES =
    createVariantCycleModes(studentVariant);
