import {
    LAB08_PHYSICAL_CONSTANTS
} from "./data.js";

const EPSILON = 1e-9;

function toFiniteNumber(
    value,
    name
) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        throw new Error(
            `Значення «${name}» не є коректним числом.`
        );
    }

    return number;
}

function toPositiveNumber(
    value,
    name
) {
    const number = toFiniteNumber(
        value,
        name
    );

    if (number <= EPSILON) {
        throw new Error(
            `Значення «${name}» повинно бути більшим за нуль.`
        );
    }

    return number;
}

function toNonNegativeNumber(
    value,
    name
) {
    const number = toFiniteNumber(
        value,
        name
    );

    if (number < 0) {
        throw new Error(
            `Значення «${name}» не може бути від’ємним.`
        );
    }

    return number;
}

function getCycleOnTime(cycle) {
    return cycle?.onTime ?? cycle?.tOn;
}

function getCycleOffTime(cycle) {
    return cycle?.offTime ?? cycle?.tOff;
}

/*
 * Спожита електрична енергія за один
 * увімкнений інтервал:
 *
 * Wi = Pi · tувімк,i / 3600
 *
 * Pi подається в кВт.
 * tувімк,i подається в секундах.
 * Wi отримуємо в кВт·год.
 */

export function calculateCycleEnergy(
    powerKilowatts,
    onDurationSeconds
) {
    const power = toPositiveNumber(
        powerKilowatts,
        "активна потужність P"
    );

    const onDuration = toPositiveNumber(
        onDurationSeconds,
        "тривалість увімкненого стану"
    );

    return (
        power *
        onDuration /
        3600
    );
}

/*
 * Загальна спожита електрична енергія:
 *
 * Wел = ΣWi
 */

export function calculateTotalElectricalEnergy(
    cycles
) {
    if (
        !Array.isArray(cycles) ||
        cycles.length === 0
    ) {
        throw new Error(
            "Необхідно додати результати хоча б одного циклу."
        );
    }

    return cycles.reduce(
        (
            total,
            cycle,
            index
        ) => {
            const cycleNumber =
                index + 1;

            const energy =
                calculateCycleEnergy(
                    cycle?.power,
                    getCycleOnTime(cycle)
                );

            if (!Number.isFinite(energy)) {
                throw new Error(
                    `Не вдалося визначити енергію циклу ${cycleNumber}.`
                );
            }

            return total + energy;
        },
        0
    );
}

/*
 * Кількість теплоти, отримана водою:
 *
 * Q = mв · cв · (100 - t0) / 3600
 *
 * mв подається в кг.
 * cв подається в кДж/(кг·К).
 * Температура подається в °C.
 * Q отримуємо в кВт·год.
 */

export function calculateUsefulHeat({
    waterMass,
    initialTemperature,
    finalTemperature =
        LAB08_PHYSICAL_CONSTANTS
            .boilingTemperature,
    specificHeat =
        LAB08_PHYSICAL_CONSTANTS
            .waterSpecificHeat
}) {
    const mass = toPositiveNumber(
        waterMass,
        "маса води"
    );

    const initial = toFiniteNumber(
        initialTemperature,
        "початкова температура води"
    );

    const final = toFiniteNumber(
        finalTemperature,
        "кінцева температура води"
    );

    const heatCapacity =
        toPositiveNumber(
            specificHeat,
            "питома теплоємність води"
        );

    if (initial >= final) {
        throw new Error(
            "Початкова температура води повинна бути меншою за кінцеву."
        );
    }

    return (
        mass *
        heatCapacity *
        (final - initial) /
        3600
    );
}

/*
 * Експериментальний термічний ККД:
 *
 * η = Q / Wел · 100 %
 */

export function calculateThermalEfficiency(
    usefulHeat,
    electricalEnergy
) {
    const heat =
        toNonNegativeNumber(
            usefulHeat,
            "кількість теплоти Q"
        );

    const energy =
        toPositiveNumber(
            electricalEnergy,
            "спожита електрична енергія Wел"
        );

    return (
        heat /
        energy *
        100
    );
}

/*
 * Формування часових інтервалів
 * для ступінчастого графіка P(t).
 */

export function buildPowerTimeline(
    cycles
) {
    if (
        !Array.isArray(cycles) ||
        cycles.length === 0
    ) {
        throw new Error(
            "Немає циклів для побудови графіка P(t)."
        );
    }

    let elapsedTime = 0;

    return cycles.flatMap(
        (
            cycle,
            index
        ) => {
            const cycleNumber =
                index + 1;

            const power =
                toPositiveNumber(
                    cycle?.power,
                    `P для циклу ${cycleNumber}`
                );

            const onTime =
                toPositiveNumber(
                    getCycleOnTime(cycle),
                    `tувімк для циклу ${cycleNumber}`
                );

            const offTime =
                toNonNegativeNumber(
                    getCycleOffTime(cycle),
                    `tвимк для циклу ${cycleNumber}`
                );

            const onStart =
                elapsedTime;

            const onEnd =
                onStart +
                onTime;

            const offEnd =
                onEnd +
                offTime;

            elapsedTime =
                offEnd;

            return [
                {
                    cycleNumber,
                    state: "on",
                    startTime: onStart,
                    endTime: onEnd,
                    power
                },
                {
                    cycleNumber,
                    state: "off",
                    startTime: onEnd,
                    endTime: offEnd,
                    power: 0
                }
            ];
        }
    );
}

/*
 * Повний результат першого досліду.
 */

export function calculateCyclicExperimentResults({
    cycles,
    waterMass,
    initialTemperature,
    finalTemperature =
        LAB08_PHYSICAL_CONSTANTS
            .boilingTemperature
}) {
    if (
        !Array.isArray(cycles) ||
        cycles.length === 0
    ) {
        throw new Error(
            "Необхідно внести результати циклів роботи плити."
        );
    }

    const normalizedCycles =
        cycles.map(
            (
                cycle,
                index
            ) => {
                const cycleNumber =
                    index + 1;

                const voltage =
                    toPositiveNumber(
                        cycle?.voltage,
                        `U для циклу ${cycleNumber}`
                    );

                const current =
                    toPositiveNumber(
                        cycle?.current,
                        `I для циклу ${cycleNumber}`
                    );

                const power =
                    toPositiveNumber(
                        cycle?.power,
                        `P для циклу ${cycleNumber}`
                    );

                const onTime =
                    toPositiveNumber(
                        getCycleOnTime(cycle),
                        `tувімк для циклу ${cycleNumber}`
                    );

                const offTime =
                    toNonNegativeNumber(
                        getCycleOffTime(cycle),
                        `tвимк для циклу ${cycleNumber}`
                    );

                const energy =
                    calculateCycleEnergy(
                        power,
                        onTime
                    );

                return {
                    cycleNumber,
                    voltage,
                    current,
                    power,
                    onTime,
                    offTime,
                    energy
                };
            }
        );

    const totalElectricalEnergy =
        normalizedCycles.reduce(
            (
                total,
                cycle
            ) =>
                total +
                cycle.energy,
            0
        );

    const totalOnDuration =
        normalizedCycles.reduce(
            (
                total,
                cycle
            ) =>
                total +
                cycle.onTime,
            0
        );

    const totalOffDuration =
        normalizedCycles.reduce(
            (
                total,
                cycle
            ) =>
                total +
                cycle.offTime,
            0
        );

    const usefulHeat =
        calculateUsefulHeat({
            waterMass,
            initialTemperature,
            finalTemperature
        });

    const thermalEfficiency =
        calculateThermalEfficiency(
            usefulHeat,
            totalElectricalEnergy
        );

    return {
        waterMass:
            toPositiveNumber(
                waterMass,
                "маса води"
            ),

        initialTemperature:
            toFiniteNumber(
                initialTemperature,
                "початкова температура води"
            ),

        finalTemperature:
            toFiniteNumber(
                finalTemperature,
                "кінцева температура води"
            ),

        cycles:
            normalizedCycles,

        totalOnDuration,
        totalOffDuration,

        totalDuration:
            totalOnDuration +
            totalOffDuration,

        totalElectricalEnergy,
        usefulHeat,
        thermalEfficiency,

        timeline:
            buildPowerTimeline(
                normalizedCycles
            )
    };
}

/*
 * Нормалізація одного рядка
 * другого досліду.
 */

export function normalizeComparativeExperimentRecord(
    record
) {
    if (
        !record ||
        typeof record !== "object"
    ) {
        throw new Error(
            "Не знайдено результати другого досліду."
        );
    }

    const setTemperature =
        toPositiveNumber(
            record.setTemperature ??
            record.temperatureSetpoint,
            "задана температура"
        );

    const setVoltage =
        toPositiveNumber(
            record.setVoltage ??
            record.voltageSetpoint,
            "задана напруга"
        );

    const voltage =
        toPositiveNumber(
            record.voltage,
            "фактична напруга"
        );

    const initialTemperature =
        toFiniteNumber(
            record.initialTemperature,
            "початкова температура води"
        );

    const current =
        toPositiveNumber(
            record.current,
            "струм"
        );

    const power =
        toPositiveNumber(
            record.power,
            "активна потужність"
        );

    const boilingTime =
        toPositiveNumber(
            record.boilingTime,
            "тривалість нагрівання води до кипіння"
        );

    return {
        trial:
            Number.isFinite(
                Number(record.trial)
            )
                ? Number(record.trial)
                : null,

        setTemperature,
        setVoltage,
        voltage,
        initialTemperature,
        current,
        power,
        boilingTime
    };
}

/*
 * Нормалізація всіх результатів
 * другого досліду.
 */

export function normalizeComparativeExperimentRecords(
    records
) {
    if (
        !Array.isArray(records) ||
        records.length === 0
    ) {
        throw new Error(
            "Немає результатів другого досліду."
        );
    }

    return records.map(
        normalizeComparativeExperimentRecord
    );
}