import { getStudentVariant } from "../../common/js/student-variants.js";

// Шість коефіцієнтів тепловіддачі та п'ять характеристик плити
// дають 30 відтворюваних установок. Варіант 1 зберігає базову модель.
export function createVariantThermalParameters(variant) {
    if (!Number.isInteger(variant) || variant < 1 || variant > 30) {
        throw new RangeError("Номер варіанта має бути від 1 до 30.");
    }

    const heatIndex = (variant - 1) % 6;
    const powerIndex = Math.floor((variant - 1) / 6);

    return Object.freeze({
        efficiency: 0.84 + heatIndex * 0.006,
        powerScale: 1 - powerIndex * 0.015,
        voltageOffsetV: heatIndex * 0.1 + powerIndex * 0.2
    });
}

export const THERMAL_VARIANT = createVariantThermalParameters(getStudentVariant());
export const HEATING_EFFICIENCY = THERMAL_VARIANT.efficiency;
export const MAXIMUM_CYCLES = 60;

const WATER_HEAT_CAPACITY = 4200; // Дж/(кг·К)
const BOILING_TEMPERATURE = 100; // °C

function round(value, digits) {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
}

export function createThermostatCycle(setup, records) {
    if (!Array.isArray(records) || records.length >= MAXIMUM_CYCLES) {
        throw new Error("Перевищено допустиму кількість циклів нагрівання.");
    }

    const index = records.length;
    const mass = Number(setup.waterMass);
    const initialTemperature = Number(setup.initialTemperature);
    const voltage = round(
        219.6 + (index * 7 % 9) * 0.1 + THERMAL_VARIANT.voltageOffsetV,
        1
    );
    const nominalPower =
        (1.32 + (index * 3 % 7) * 0.035) * THERMAL_VARIANT.powerScale;
    const current = round(nominalPower * 1000 / voltage, 2);
    const power = round(voltage * current / 1000, 3);
    const requiredElectricalEnergy =
        mass * WATER_HEAT_CAPACITY *
        (BOILING_TEMPERATURE - initialTemperature) / HEATING_EFFICIENCY;
    const spentEnergy = records.reduce(
        (sum, record) => sum + record.power * 1000 * record.onTime,
        0
    );
    const remainingEnergy = Math.max(0, requiredElectricalEnergy - spentEnergy);
    const scheduledOnTime = 8.8 + (index * 5 % 9) * 0.4;
    const boiling = remainingEnergy <= power * 1000 * scheduledOnTime;
    const onTime = round(
        boiling ? Math.max(0.01, remainingEnergy / (power * 1000)) : scheduledOnTime,
        2
    );
    const offTime = boiling ? 0 : round(6.4 + (index * 3 % 7) * 0.55, 2);
    const accumulatedEnergy = spentEnergy + power * 1000 * onTime;
    const finalTemperature = boiling
        ? BOILING_TEMPERATURE
        : round(
            Math.min(99.9,
                initialTemperature + accumulatedEnergy * HEATING_EFFICIENCY /
                (mass * WATER_HEAT_CAPACITY)),
            1
        );

    return {
        voltage, current, power, onTime, offTime,
        finalTemperature, boiling
    };
}

export function createParameterTrial(setup, trial) {
    const temperatureIndex = [110, 160, 240].indexOf(trial.setTemperature);
    if (temperatureIndex < 0) {
        throw new Error("Невідомий температурний режим.");
    }

    const initialTemperature = Number(setup.initialTemperature);
    const mass = Number(setup.waterMass);
    const voltage = round(
        trial.setVoltage + ((trial.setVoltage % 7) - 3) * 0.1 +
        THERMAL_VARIANT.voltageOffsetV,
        1
    );
    const nominalPower = [1.25, 1.38, 1.5][temperatureIndex] *
        (voltage / 220) ** 2 * THERMAL_VARIANT.powerScale;
    const power = round(Math.min(1.6, nominalPower), 3);
    const current = round(power * 1000 / (voltage * 0.94), 2);
    const dutyCycle = [0.26, 0.38, 0.56][temperatureIndex];
    const usefulHeat = mass * WATER_HEAT_CAPACITY *
        (BOILING_TEMPERATURE - initialTemperature);
    const boilingTime = round(
        usefulHeat / (power * 1000 * HEATING_EFFICIENCY * dutyCycle) / 60,
        2
    );

    return {
        ...trial,
        voltage, current, power, initialTemperature, boilingTime
    };
}
