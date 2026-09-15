export const LAB08_EXPERIMENT_STORAGE_KEY =
    "eetsee.lab08.experiment.v1";

export const LAB08_VERIFIED_CALCULATIONS_STORAGE_KEY =
    "eetsee.lab08.calculations.verified.v1";


/* Фізичні величини, використані в методиці */

export const LAB08_PHYSICAL_CONSTANTS =
    Object.freeze({
        waterSpecificHeat: 4.2,
        waterSpecificHeatUnit: "кДж/(кг·К)",

        boilingTemperature: 100,
        boilingTemperatureUnit: "°C"
    });


/* Технічні характеристики плити «МЕРИДІАН ПП-3» */

export const LAB08_PLATE_SPECIFICATIONS =
    Object.freeze({
        model: "МЕРИДІАН ПП-3",

        supplyVoltage: Object.freeze({
            minimum: 180,
            maximum: 260,
            unit: "В"
        }),

        supplyFrequency: Object.freeze({
            value: 50,
            unit: "Гц"
        }),

        nominalPower: Object.freeze({
            value: 1600,
            unit: "Вт"
        }),

        powerRange: Object.freeze({
            minimum: 320,
            maximum: 1600,
            unit: "Вт"
        }),

        dimensions: Object.freeze({
            width: 340,
            depth: 300,
            height: 70,
            unit: "мм"
        }),

        mass: Object.freeze({
            value: 2.5,
            unit: "кг"
        })
    });


/* Режими керування плити */

export const LAB08_OPERATING_MODES =
    Object.freeze({
        heating: Object.freeze({
            id: "heating",
            name: "Нагрів",
            levelCount: 7,
            description:
                "Ступінчасте регулювання потужності нагрівання."
        }),

        thermostat: Object.freeze({
            id: "thermostat",
            name: "Термостат",
            levelCount: 6,
            description:
                "Підтримання заданого температурного режиму."
        }),

        timer: Object.freeze({
            id: "timer",
            name: "Час",
            minimum: 1,
            maximum: 99,
            unit: "хв",
            description:
                "Установлення тривалості роботи плити."
        })
    });


/* Дослід 1. Циклічний режим роботи */

export const LAB08_CYCLIC_EXPERIMENT =
    Object.freeze({
        id: "cyclic-heating",

        name:
            "Дослідження циклічного режиму роботи та визначення термічного ККД нагрівання води",

        operatingMode: "thermostat",

        initialTableRows: 6,

        measurementFields: Object.freeze([
            "voltage",
            "current",
            "power",
            "tOn",
            "tOff"
        ]),

        units: Object.freeze({
            voltage: "В",
            current: "А",
            power: "кВт",
            tOn: "с",
            tOff: "с",
            energy: "кВт·год"
        })
    });


/* Дослід 2. Вплив напруги та температурного режиму */

export const LAB08_TEMPERATURE_SETPOINTS =
    Object.freeze([
        110,
        160,
        240
    ]);

export const LAB08_VOLTAGE_SETPOINTS =
    Object.freeze([
        200,
        220,
        240
    ]);

export const LAB08_COMPARATIVE_EXPERIMENTS =
    Object.freeze(
        LAB08_TEMPERATURE_SETPOINTS.flatMap(
            (temperatureSetpoint) =>
                LAB08_VOLTAGE_SETPOINTS.map(
                    (voltageSetpoint) =>
                        Object.freeze({
                            id:
                                `temperature-${temperatureSetpoint}` +
                                `-voltage-${voltageSetpoint}`,

                            temperatureSetpoint,
                            voltageSetpoint
                        })
                )
        )
    );

export const LAB08_COMPARATIVE_EXPERIMENT =
    Object.freeze({
        id: "voltage-temperature",

        name:
            "Дослідження впливу напруги живлення та температурного режиму на параметри нагрівання",

        operatingMode: "thermostat",

        measurementFields: Object.freeze([
            "temperatureSetpoint",
            "voltageSetpoint",
            "voltage",
            "initialTemperature",
            "current",
            "power",
            "boilingTime"
        ]),

        units: Object.freeze({
            temperatureSetpoint: "°C",
            voltageSetpoint: "В",
            voltage: "В",
            initialTemperature: "°C",
            current: "А",
            power: "кВт",
            boilingTime: "хв"
        }),

        experiments: LAB08_COMPARATIVE_EXPERIMENTS
    });


/*
 * Тимчасові сумісні назви.
 * Вони не дають старим імпортам з інших модулів
 * зупинити завантаження сторінки.
 */

export const lab08_EXPERIMENT_STORAGE_KEY =
    LAB08_EXPERIMENT_STORAGE_KEY;

export const lab08_VERIFIED_CALCULATIONS_STORAGE_KEY =
    LAB08_VERIFIED_CALCULATIONS_STORAGE_KEY;

export const lab08_EXPERIMENT_MODES =
    LAB08_COMPARATIVE_EXPERIMENTS;


export function getExperimentMode(experimentId) {
    return (
        LAB08_COMPARATIVE_EXPERIMENTS.find(
            (experiment) =>
                experiment.id === experimentId
        ) ?? null
    );
}