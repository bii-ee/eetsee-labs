import {
    getExperimentById,
    isExperimentConfigured,
    validateExperiment
} from "./data.js";

const EPSILON = 1e-9;
const WATER_SPECIFIC_HEAT_J_PER_KG_K = 4184;
const WATER_DENSITY_KG_PER_LITER = 1;
const curveFactorCache = new Map();

function toFiniteNumber(
    value,
    name
) {
    const number =
        Number(value);

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
    const number =
        toFiniteNumber(
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

function clamp(
    value,
    minimum,
    maximum
) {
    return Math.min(
        maximum,
        Math.max(
            minimum,
            value
        )
    );
}

export function formatNumber(
    value,
    digits = 1
) {
    const number =
        Number(value);

    if (!Number.isFinite(number)) {
        return "–";
    }

    return new Intl.NumberFormat(
        "uk-UA",
        {
            minimumFractionDigits:
                0,

            maximumFractionDigits:
                digits
        }
    ).format(number);
}

export function secondsToMinutes(
    seconds
) {
    return (
        toFiniteNumber(
            seconds,
            "тривалість нагрівання"
        ) /
        60
    );
}

export function minutesToSeconds(
    minutes
) {
    return (
        toFiniteNumber(
            minutes,
            "тривалість нагрівання"
        ) *
        60
    );
}

export function formatStopwatch(
    seconds
) {
    const normalizedSeconds =
        Math.max(
            0,
            Math.round(
                Number(seconds) || 0
            )
        );

    const minutes =
        Math.floor(
            normalizedSeconds / 60
        );

    const remainingSeconds =
        normalizedSeconds % 60;

    return (
        `${String(minutes).padStart(2, "0")}:` +
        `${String(remainingSeconds).padStart(2, "0")}`
    );
}

export function calculateElectricalEnergyWh(
    activePowerW,
    boilingTimeSeconds
) {
    const power =
        toPositiveNumber(
            activePowerW,
            "активна потужність"
        );

    const duration =
        toPositiveNumber(
            boilingTimeSeconds,
            "тривалість нагрівання"
        );

    return (
        power *
        duration /
        3600
    );
}

export function calculateElectricalEnergyKWh(
    activePowerW,
    boilingTimeSeconds
) {
    return (
        calculateElectricalEnergyWh(
            activePowerW,
            boilingTimeSeconds
        ) /
        1000
    );
}

function getTemperatureCurveFactor(energyRatio) {
    if (energyRatio >= 1 - 1e-10) {
        return 0;
    }

    const cached = curveFactorCache.get(energyRatio);
    if (cached !== undefined) {
        return cached;
    }

    // (1 - exp(-z)) / z = Q_води / (P * t_кипіння).
    // z задає сумарні втрати теплоти, що зростають із температурою.
    let lower = 0;
    let upper = 1;

    while (-Math.expm1(-upper) / upper > energyRatio) {
        upper *= 2;
    }

    for (let step = 0; step < 42; step += 1) {
        const middle = (lower + upper) / 2;
        const ratioAtMiddle = -Math.expm1(-middle) / middle;

        if (ratioAtMiddle > energyRatio) {
            lower = middle;
        } else {
            upper = middle;
        }
    }

    const factor = (lower + upper) / 2;
    curveFactorCache.set(energyRatio, factor);
    return factor;
}

export function calculateTemperatureProgress(
    progress,
    energyRatio = 1
) {
    const normalizedProgress =
        clamp(
            Number(progress) || 0,
            0,
            1
        );

    const ratio = Number(energyRatio);
    if (!Number.isFinite(ratio) || ratio <= 0 || ratio > 1 + 1e-6) {
        throw new RangeError(
            "Енергії досліду недостатньо для нагрівання заданого об’єму води."
        );
    }

    if (normalizedProgress === 0) {
        return 0;
    }

    if (normalizedProgress === 1) {
        return 1;
    }

    if (ratio >= 1 - 1e-10) {
        return normalizedProgress;
    }

    const factor = getTemperatureCurveFactor(ratio);
    return -Math.expm1(-factor * normalizedProgress) /
        -Math.expm1(-factor);
}

export function calculateTemperatureAtTime({
    initialTemperatureC,
    boilingTemperatureC,
    elapsedSeconds,
    boilingTimeSeconds,
    activePowerW,
    waterVolumeLiters
}) {
    const initialTemperature =
        toFiniteNumber(
            initialTemperatureC,
            "початкова температура"
        );

    const boilingTemperature =
        toFiniteNumber(
            boilingTemperatureC,
            "температура кипіння"
        );

    const duration =
        toPositiveNumber(
            boilingTimeSeconds,
            "тривалість нагрівання"
        );

    const elapsed =
        clamp(
            toFiniteNumber(
                elapsedSeconds,
                "поточний час"
            ),
            0,
            duration
        );

    if (
        initialTemperature >=
        boilingTemperature
    ) {
        throw new Error(
            "Початкова температура повинна бути нижчою за температуру кипіння."
        );
    }

    const linearProgress =
        elapsed /
        duration;

    // 1 л води ~= 1 кг. Приймаємо сталу середню потужність.
    // За відсутності P або V зберігаємо сумісність старих викликів.
    const hasPhysicalParameters =
        activePowerW !== undefined &&
        waterVolumeLiters !== undefined;

    const energyRatio = hasPhysicalParameters
        ? toPositiveNumber(waterVolumeLiters, "об’єм води") *
            WATER_DENSITY_KG_PER_LITER *
            WATER_SPECIFIC_HEAT_J_PER_KG_K *
            (boilingTemperature - initialTemperature) /
            (toPositiveNumber(activePowerW, "активна потужність") * duration)
        : 1;

    const temperatureProgress =
        calculateTemperatureProgress(
            linearProgress,
            energyRatio
        );

    return (
        initialTemperature +
        (
            boilingTemperature -
            initialTemperature
        ) *
        temperatureProgress
    );
}

export function buildTemperatureCurve(
    experiment,
    sampleCount = 60
) {
    if (!experiment) {
        throw new Error(
            "Дослід не знайдено."
        );
    }

    const duration =
        toPositiveNumber(
            experiment.measurements
                ?.boilingTimeSeconds,
            "тривалість нагрівання"
        );

    const initialTemperature =
        toFiniteNumber(
            experiment.conditions
                ?.initialTemperatureC,
            "початкова температура"
        );

    const boilingTemperature =
        toFiniteNumber(
            experiment.conditions
                ?.boilingTemperatureC,
            "температура кипіння"
        );

    const normalizedSampleCount =
        Math.round(
            clamp(
                Number(sampleCount) || 60,
                10,
                200
            )
        );

    return Array.from(
        {
            length:
                normalizedSampleCount + 1
        },

        (_, index) => {
            const progress =
                index /
                normalizedSampleCount;

            const elapsedSeconds =
                duration *
                progress;

            return Object.freeze({
                progress,

                elapsedSeconds,

                temperatureC:
                    calculateTemperatureAtTime({
                        initialTemperatureC:
                            initialTemperature,

                        boilingTemperatureC:
                            boilingTemperature,

                        elapsedSeconds,

                        boilingTimeSeconds:
                            duration,

                        activePowerW:
                            experiment.measurements.activePowerW,

                        waterVolumeLiters:
                            experiment.conditions.waterVolumeLiters
                    })
            });
        }
    );
}

export function calculateExperimentResult(
    experiment
) {
    if (
        !isExperimentConfigured(
            experiment
        )
    ) {
        throw new Error(
            "Експериментальні дані ще не погоджені."
        );
    }

    const validation =
        validateExperiment(
            experiment
        );

    if (!validation.valid) {
        throw new Error(
            validation.errors.join(" ")
        );
    }

    const actualVoltage =
        toPositiveNumber(
            experiment.measurements
                .actualVoltageV,
            "фактична напруга"
        );

    const current =
        toPositiveNumber(
            experiment.measurements
                .currentA,
            "сила струму"
        );

    const activePower =
        toPositiveNumber(
            experiment.measurements
                .activePowerW,
            "активна потужність"
        );

    const boilingTimeSeconds =
        toPositiveNumber(
            experiment.measurements
                .boilingTimeSeconds,
            "тривалість нагрівання"
        );

    const boilingTimeMinutes =
        secondsToMinutes(
            boilingTimeSeconds
        );

    const electricalEnergyWh =
        calculateElectricalEnergyWh(
            activePower,
            boilingTimeSeconds
        );

    const electricalEnergyKWh =
        electricalEnergyWh /
        1000;

    return Object.freeze({
        experimentId:
            experiment.id,

        heaterId:
            experiment.heaterId,

        heaterNumber:
            experiment.heaterNumber,

        targetVoltageV:
            experiment.targetVoltageV,

        actualVoltageV:
            actualVoltage,

        currentA:
            current,

        activePowerW:
            activePower,

        initialTemperatureC:
            experiment.conditions
                .initialTemperatureC,

        boilingTemperatureC:
            experiment.conditions
                .boilingTemperatureC,

        boilingTimeSeconds,

        boilingTimeMinutes,

        electricalEnergyWh,

        electricalEnergyKWh
    });
}

export function calculateExperimentResultById(
    experimentId
) {
    const experiment =
        getExperimentById(
            experimentId
        );

    if (!experiment) {
        throw new Error(
            `Дослід «${experimentId}» не знайдено.`
        );
    }

    return calculateExperimentResult(
        experiment
    );
}
