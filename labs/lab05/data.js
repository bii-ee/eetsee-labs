import {
    LAB05_CONFIG
} from "./config.js";

import { getStudentVariant } from "../../common/js/student-variants.js";

export const LAB05_EXPERIMENT_STORAGE_KEY =
    LAB05_CONFIG.storage.experiment;

export const LAB05_VERIFIED_CALCULATIONS_STORAGE_KEY =
    LAB05_CONFIG.storage.calculations;

export const LAB05_VOLTAGE_LEVELS =
    Object.freeze([
        100,
        150,
        200
    ]);

export const LAB05_TOTAL_EXPERIMENTS =
    6;

export const LAB05_EXPERIMENT_CONDITIONS =
    Object.freeze({
        heatCarrier:
            "water",

        heatCarrierLabel:
            "Вода",

        waterVolumeLiters:
            1,

        referenceInitialTemperatureC:
            20,

        initialTemperatureC:
            20,

        boilingTemperatureC:
            100
    });

export const LAB05_HEATERS =
    Object.freeze([
        Object.freeze({
            id:
                "heater-1",

            number:
                1,

            title:
                "Нагрівач 1",

            construction:
                "Електродний нагрівальний елемент першого типу"
        }),

        Object.freeze({
            id:
                "heater-2",

            number:
                2,

            title:
                "Нагрівач 2",

            construction:
                "Електродний нагрівальний елемент другого типу"
        })
    ]);

export const LAB05_EXPERIMENT_RUNS =
    Object.freeze([
        Object.freeze({
            id:
                "heater-1-100",

            heaterId:
                "heater-1",

            heaterNumber:
                1,

            targetVoltageV:
                100,

            conditions:
                LAB05_EXPERIMENT_CONDITIONS,

            measurements:
                Object.freeze({
                    actualVoltageV:
                        99.8,

                    currentA:
                        3.1,

                    activePowerW:
                        305,

                    boilingTimeSeconds:
                        1680
                }),

            source:
                Object.freeze({
                    type:
                        "simulation-model",

                    valuesRounded:
                        true
                })
        }),

        Object.freeze({
            id:
                "heater-1-150",

            heaterId:
                "heater-1",

            heaterNumber:
                1,

            targetVoltageV:
                150,

            conditions:
                LAB05_EXPERIMENT_CONDITIONS,

            measurements:
                Object.freeze({
                    actualVoltageV:
                        149.6,

                    currentA:
                        4.62,

                    activePowerW:
                        675,

                    boilingTimeSeconds:
                        720
                }),

            source:
                Object.freeze({
                    type:
                        "simulation-model",

                    valuesRounded:
                        true
                })
        }),

        Object.freeze({
            id:
                "heater-1-200",

            heaterId:
                "heater-1",

            heaterNumber:
                1,

            targetVoltageV:
                200,

            conditions:
                LAB05_EXPERIMENT_CONDITIONS,

            measurements:
                Object.freeze({
                    actualVoltageV:
                        199.4,

                    currentA:
                        6.12,

                    activePowerW:
                        1190,

                    boilingTimeSeconds:
                        390
                }),

            source:
                Object.freeze({
                    type:
                        "simulation-model",

                    valuesRounded:
                        true
                })
        }),

        Object.freeze({
            id:
                "heater-2-100",

            heaterId:
                "heater-2",

            heaterNumber:
                2,

            targetVoltageV:
                100,

            conditions:
                LAB05_EXPERIMENT_CONDITIONS,

            measurements:
                Object.freeze({
                    actualVoltageV:
                        99.7,

                    currentA:
                        2.72,

                    activePowerW:
                        263,

                    boilingTimeSeconds:
                        1980
                }),

            source:
                Object.freeze({
                    type:
                        "simulation-model",

                    valuesRounded:
                        true
                })
        }),

        Object.freeze({
            id:
                "heater-2-150",

            heaterId:
                "heater-2",

            heaterNumber:
                2,

            targetVoltageV:
                150,

            conditions:
                LAB05_EXPERIMENT_CONDITIONS,

            measurements:
                Object.freeze({
                    actualVoltageV:
                        149.5,

                    currentA:
                        4.04,

                    activePowerW:
                        590,

                    boilingTimeSeconds:
                        830
                }),

            source:
                Object.freeze({
                    type:
                        "simulation-model",

                    valuesRounded:
                        true
                })
        }),

        Object.freeze({
            id:
                "heater-2-200",

            heaterId:
                "heater-2",

            heaterNumber:
                2,

            targetVoltageV:
                200,

            conditions:
                LAB05_EXPERIMENT_CONDITIONS,

            measurements:
                Object.freeze({
                    actualVoltageV:
                        199.2,

                    currentA:
                        5.38,

                    activePowerW:
                        1045,

                    boilingTimeSeconds:
                        455
                }),

            source:
                Object.freeze({
                    type:
                        "simulation-model",

                    valuesRounded:
                        true
                })
        })
    ]);

// Покази варіанта: опір нагрівача і втрати теплоти змінюються,
// задані напруги, об’єм та температури залишаються з методички.
export function createVariantExperiment(experiment, variantNumber) {
    if (!experiment) return null;
    if (!Number.isInteger(variantNumber) || variantNumber < 1 || variantNumber > 30) {
        throw new RangeError("Номер варіанта має бути від 1 до 30.");
    }

    const heaterNumber = experiment.heaterNumber;
    const base = experiment.measurements;
    const voltageOffset = ((variantNumber * 7 + heaterNumber * 3) % 9 - 4) * 0.1;
    const voltage = Math.round((base.actualVoltageV + voltageOffset) * 10) / 10;
    const conductivity = 0.93 + ((variantNumber * 11 + heaterNumber * 7) % 30) * 0.0045;
    const current = Math.round(base.currentA * conductivity *
        voltage / base.actualVoltageV * 100) / 100;
    const basePowerFactor = base.activePowerW /
        (base.actualVoltageV * base.currentA);
    const power = Math.round(voltage * current * basePowerFactor);
    const heatLoss = 0.95 +
        ((variantNumber * 13 + heaterNumber * 5) % 30) * 0.0035;
    const boilingTimeSeconds = Math.round(
        base.activePowerW * base.boilingTimeSeconds * heatLoss / power
    );

    return Object.freeze({
        ...experiment,
        measurements: Object.freeze({
            actualVoltageV: voltage,
            currentA: current,
            activePowerW: power,
            boilingTimeSeconds
        }),
        source: Object.freeze({
            type: "individual-teaching-model",
            variantNumber,
            valuesRounded: true
        })
    });
}

export function getHeater(heaterId) {
    return (
        LAB05_HEATERS.find(
            (heater) =>
                heater.id ===
                heaterId
        ) ??
        LAB05_HEATERS[0]
    );
}

export function getExperimentsForHeater(
    heaterId
) {
    return LAB05_EXPERIMENT_RUNS.filter(
        (experiment) =>
            experiment.heaterId ===
            heaterId
    );
}

export function getExperimentById(
    experimentId
) {
    const base = LAB05_EXPERIMENT_RUNS.find(
        (experiment) => experiment.id === experimentId
    );
    return createVariantExperiment(base, getStudentVariant());
}

export function getExperiment(
    heaterId,
    targetVoltageV
) {
    const base = LAB05_EXPERIMENT_RUNS.find(
        (experiment) =>
            experiment.heaterId === heaterId &&
            experiment.targetVoltageV === Number(targetVoltageV)
    );
    return createVariantExperiment(base, getStudentVariant());
}

export function isExperimentConfigured(
    experiment
) {
    if (!experiment) {
        return false;
    }

    const conditions =
        experiment.conditions;

    const measurements =
        experiment.measurements;

    if (
        !conditions ||
        !measurements
    ) {
        return false;
    }

    const positiveValues = [
        conditions.waterVolumeLiters,
        measurements.actualVoltageV,
        measurements.currentA,
        measurements.activePowerW,
        measurements.boilingTimeSeconds
    ];

    const temperaturesAreValid =
        Number.isFinite(
            Number(
                conditions.initialTemperatureC
            )
        ) &&
        Number.isFinite(
            Number(
                conditions.boilingTemperatureC
            )
        ) &&
        Number(
            conditions.initialTemperatureC
        ) <
        Number(
            conditions.boilingTemperatureC
        );

    return (
        positiveValues.every(
            (value) =>
                Number.isFinite(
                    Number(value)
                ) &&
                Number(value) > 0
        ) &&
        temperaturesAreValid
    );
}

export function validateExperiment(
    experiment
) {
    const errors = [];

    if (!experiment) {
        return {
            valid: false,
            errors: [
                "Не знайдено дані досліду."
            ]
        };
    }

    if (
        !isExperimentConfigured(
            experiment
        )
    ) {
        errors.push(
            "Не всі параметри досліду задано коректно."
        );
    }

    const voltage =
        Number(
            experiment.measurements
                ?.actualVoltageV
        );

    const current =
        Number(
            experiment.measurements
                ?.currentA
        );

    const power =
        Number(
            experiment.measurements
                ?.activePowerW
        );

    if (
        Number.isFinite(voltage) &&
        Number.isFinite(current) &&
        Number.isFinite(power) &&
        power > voltage * current + 1e-6
    ) {
        errors.push(
            "Активна потужність не може перевищувати добуток напруги та сили струму."
        );
    }

    return {
        valid:
            errors.length === 0,

        errors
    };
}

export function getConfiguredExperimentCount() {
    return LAB05_EXPERIMENT_RUNS.filter(
        isExperimentConfigured
    ).length;
}