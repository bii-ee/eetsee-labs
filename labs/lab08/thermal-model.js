import { getStudentVariant } from "../../common/js/student-variants.js";

// Навчальні параметри теплового вузла «посуд + вода».
// Термічний ККД води визначається з результатів, а не задається наперед.
export function createVariantThermalParameters(variant) {
    if (!Number.isInteger(variant) || variant < 1 || variant > 30) {
        throw new RangeError("Номер варіанта має бути від 1 до 30.");
    }
    const heatIndex = (variant - 1) % 6;
    const powerIndex = Math.floor((variant - 1) / 6);
    return Object.freeze({
        couplingEfficiency: 0.92 + heatIndex * 0.004,
        cookwareHeatCapacity: 100 + powerIndex * 8, // Дж/К
        heatLossCoefficient: 0.4 + heatIndex * 0.025 + powerIndex * 0.015, // Вт/К
        ambientTemperature: 20,
        powerFactor: 0.94 - powerIndex * 0.004,
        powerScale: 1 - powerIndex * 0.015,
        voltageOffsetV: heatIndex * 0.1 + powerIndex * 0.2
    });
}
export const THERMAL_VARIANT = createVariantThermalParameters(getStudentVariant());
export const MAXIMUM_CYCLES = 60;
const WATER_HEAT_CAPACITY = 4200; // Дж/(кг·К)
const BOILING_TEMPERATURE = 100;
const round = (value, digits) => Number(value.toFixed(digits));
const roundDurationUp = (value) => Math.ceil(value * 100 - 1e-8) / 100;

function capacity(setup, parameters) {
    const mass = Number(setup.waterMass);
    const initial = Number(setup.initialTemperature);
    if (!Number.isFinite(mass) || mass < 0.1 || mass > 1 ||
        !Number.isFinite(initial) || initial < 5 || initial > 40) {
        throw new RangeError("Маса води має бути 0,1–1 кг, початкова температура 5–40 °C.");
    }
    return mass * WATER_HEAT_CAPACITY + parameters.cookwareHeatCapacity;
}

// C dT/dt = eta_зв'язку P - H(T - T_повітря).
// P у кВт; точний розв'язок для сталого P на одному інтервалі.
export function temperatureAfterInterval(setup, initialTemperature, power, seconds,
    parameters = THERMAL_VARIANT) {
    const thermalCapacity = capacity(setup, parameters);
    const equilibrium = parameters.ambientTemperature +
        parameters.couplingEfficiency * power * 1000 / parameters.heatLossCoefficient;
    return equilibrium + (initialTemperature - equilibrium) *
        Math.exp(-parameters.heatLossCoefficient * seconds / thermalCapacity);
}
function timeToBoiling(setup, initialTemperature, power, parameters) {
    const thermalCapacity = capacity(setup, parameters);
    const equilibrium = parameters.ambientTemperature +
        parameters.couplingEfficiency * power * 1000 / parameters.heatLossCoefficient;
    if (equilibrium <= BOILING_TEMPERATURE) return Infinity;
    return thermalCapacity / parameters.heatLossCoefficient *
        Math.log((equilibrium - initialTemperature) / (equilibrium - BOILING_TEMPERATURE));
}
function electricalReadings(voltage, nominalPower, parameters) {
    // Дані фіксуються з тією самою точністю, яку бачить студент.
    const power = round(Math.min(1.6, nominalPower), 2);
    const current = round(power * 1000 / (voltage * parameters.powerFactor), 1);
    return { voltage, current, power };
}
export function createThermostatCycle(setup, records, parameters = THERMAL_VARIANT) {
    if (!Array.isArray(records) || records.length >= MAXIMUM_CYCLES) {
        throw new Error("Перевищено допустиму кількість циклів нагрівання.");
    }
    capacity(setup, parameters);
    const setTemperature = Number(setup.setTemperature ?? 240);
    if (![110, 160, 240].includes(setTemperature)) {
        throw new RangeError("Температурний режим має бути 110, 160 або 240 °C.");
    }
    // Режим плити керує тривалістю пауз і потужністю активного нагрівання.
    // За 240 °C зберігається початковий навчальний цикл.
    const modeFactor = { 110: 0.83, 160: 0.92, 240: 1 }[setTemperature];
    const pauseFactor = { 110: 2.7, 160: 1.6, 240: 1 }[setTemperature];
    const index = records.length;
    const startTemperature = records.at(-1)?.finalTemperature ?? Number(setup.initialTemperature);
    if (startTemperature >= BOILING_TEMPERATURE) throw new Error("Нагрівання вже завершено.");
    const voltage = round(219.6 + (index * 7 % 9) * 0.1 + parameters.voltageOffsetV, 1);
    const readings = electricalReadings(voltage,
        (1.32 + (index * 3 % 7) * 0.035) * parameters.powerScale * modeFactor, parameters);
    const scheduledOnTime = round(8.8 + (index * 5 % 9) * 0.4, 2);
    const requiredTime = timeToBoiling(setup, startTemperature, readings.power, parameters);
    const boiling = requiredTime <= scheduledOnTime;
    const onTime = boiling ? Math.max(0.01, roundDurationUp(requiredTime)) : scheduledOnTime;
    const offTime = boiling ? 0 : round((6.4 + (index * 3 % 7) * 0.55) * pauseFactor, 2);
    const heatingEndTemperature = boiling ? BOILING_TEMPERATURE :
        temperatureAfterInterval(setup, startTemperature, readings.power, onTime, parameters);
    const finalTemperature = boiling ? BOILING_TEMPERATURE :
        temperatureAfterInterval(setup, heatingEndTemperature, 0, offTime, parameters);
    return { ...readings, startTemperature, heatingEndTemperature,
        onTime, offTime, finalTemperature, boiling };
}
export function createParameterTrial(setup, trial, parameters = THERMAL_VARIANT) {
    capacity(setup, parameters);
    const temperatureIndex = [110, 160, 240].indexOf(trial.setTemperature);
    if (temperatureIndex < 0 || ![200, 220, 240].includes(trial.setVoltage)) {
        throw new Error("Невідомий режим другого досліду.");
    }
    const initialTemperature = Number(setup.initialTemperature);
    const voltage = round(trial.setVoltage + ((trial.setVoltage % 7) - 3) * 0.1 +
        parameters.voltageOffsetV, 1);
    // Навчальна апроксимація характеристики електронного перетворювача.
    const readings = electricalReadings(voltage,
        [1.25, 1.38, 1.5][temperatureIndex] * (voltage / 220) ** 2 * parameters.powerScale,
        parameters);
    const dutyCycle = [0.26, 0.38, 0.56][temperatureIndex];
    const scheduledOnTime = 10;
    const scheduledOffTime = round(scheduledOnTime * (1 - dutyCycle) / dutyCycle, 2);
    const intervals = [];
    let temperature = initialTemperature;
    let elapsed = 0;
    let electricalEnergy = 0;
    for (let cycle = 0; cycle < 500; cycle += 1) {
        const requiredTime = timeToBoiling(setup, temperature, readings.power, parameters);
        const boiling = requiredTime <= scheduledOnTime;
        const onTime = boiling ? Math.max(0.01, roundDurationUp(requiredTime)) : scheduledOnTime;
        const heatingEndTemperature = boiling ? BOILING_TEMPERATURE :
            temperatureAfterInterval(setup, temperature, readings.power, onTime, parameters);
        intervals.push({state: "on", startTime: elapsed, duration: onTime,
            startTemperature: temperature, endTemperature: heatingEndTemperature,
            voltage, current: readings.current, power: readings.power});
        elapsed += onTime;
        electricalEnergy += readings.power * onTime / 3600;
        if (boiling) {
            return { ...trial, ...readings, initialTemperature, dutyCycle,
                boilingTime: round(elapsed / 60, 2), boilingTimeSeconds: elapsed,
                electricalEnergy, intervals };
        }
        temperature = temperatureAfterInterval(setup, heatingEndTemperature, 0,
            scheduledOffTime, parameters);
        intervals.push({state: "off", startTime: elapsed, duration: scheduledOffTime,
            startTemperature: heatingEndTemperature, endTemperature: temperature,
            voltage, current: 0, power: 0});
        elapsed += scheduledOffTime;
    }
    throw new Error("За заданих умов температура кипіння не досягнута.");
}
