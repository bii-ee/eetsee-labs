const EPSILON = 1e-9;

function toFiniteNumber(value, name) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        throw new Error(
            `Значення «${name}» не є коректним числом.`
        );
    }

    return number;
}

export function degreesToRadians(degrees) {
    return (degrees * Math.PI) / 180;
}

export function calculatePhaseModel(
    alphaDegrees
) {
    const normalizedAlpha =
        toFiniteNumber(
            alphaDegrees,
            "кут керування α"
        );

    if (
        normalizedAlpha < 0 ||
        normalizedAlpha >= 180
    ) {
        throw new Error(
            "Кут керування α повинен належати діапазону від 0° до 180°."
        );
    }

    const alpha =
        degreesToRadians(
            normalizedAlpha
        );

    const phaseTerm =
        Math.PI -
        alpha +
        Math.sin(2 * alpha) / 2;

    const coefficientTerm =
        Math.sin(alpha) ** 4 +
        phaseTerm ** 2;

    if (
        phaseTerm <= EPSILON ||
        coefficientTerm <= EPSILON
    ) {
        throw new Error(
            "Для заданого кута неможливо визначити теоретичні коефіцієнти."
        );
    }

    const cosPhi1p =
        phaseTerm /
        Math.sqrt(
            coefficientTerm
        );

    const nuP =
        Math.sqrt(
            coefficientTerm /
            (
                Math.PI *
                phaseTerm
            )
        );

    const chiP =
        Math.sqrt(
            phaseTerm /
            Math.PI
        );

    return {
        alphaDegrees:
            normalizedAlpha,

        alphaRadians:
            alpha,

        phaseTerm,

        coefficientTerm,

        cosPhi1p,

        nuP,

        chiP
    };
}

export function calculateExpectedValues(
    mode,
    record
) {
    if (!mode || !record) {
        throw new Error(
            "Не знайдено дані режиму."
        );
    }

    const alphaDegrees =
        Number.isFinite(
            Number(record.alpha)
        )
            ? Number(record.alpha)
            : Number(mode.alpha);

    const phaseModel =
        calculatePhaseModel(
            alphaDegrees
        );

    const u1 =
        toFiniteNumber(
            record.u1,
            "U₁"
        );

    const current =
        toFiniteNumber(
            record.current,
            "I"
        );

    const power =
        toFiniteNumber(
            record.power,
            "P"
        );

    const u2 =
        toFiniteNumber(
            record.u2,
            "U₂"
        );

    if (u1 <= EPSILON) {
        throw new Error(
            `Для режиму ${mode.position} значення U₁ повинно бути більшим за нуль.`
        );
    }

    if (current <= EPSILON) {
        throw new Error(
            `Для режиму ${mode.position} значення I повинно бути більшим за нуль.`
        );
    }

    if (power < 0 || u2 < 0) {
        throw new Error(
            `Для режиму ${mode.position} значення P та U₂ не можуть бути від’ємними.`
        );
    }

    const apparentPower =
        u1 *
        current;

    if (
        power >
        apparentPower +
        1e-6
    ) {
        throw new Error(
            `Для режиму ${mode.position} отримано P > S. Перевірте покази приладів.`
        );
    }

    const voltageRegulation =
        u2 /
        u1;

    const firstHarmonicCurrent =
        power /
        (
            u1 *
            phaseModel.cosPhi1p
        );

    if (
        firstHarmonicCurrent >
        current +
        1e-6
    ) {
        throw new Error(
            `Для режиму ${mode.position} отримано I₁ > I. Перевірте покази приладів.`
        );
    }

    const sinPhi1p =
        Math.sqrt(
            Math.max(
                0,
                1 -
                phaseModel.cosPhi1p ** 2
            )
        );

    const reactivePower =
        u1 *
        firstHarmonicCurrent *
        sinPhi1p;

    const distortionPower =
        u1 *
        Math.sqrt(
            Math.max(
                0,
                current ** 2 -
                firstHarmonicCurrent ** 2
            )
        );

    const currentDistortionFactor =
        firstHarmonicCurrent /
        current;

    if (
        currentDistortionFactor <=
        EPSILON
    ) {
        throw new Error(
            `Для режиму ${mode.position} неможливо визначити коефіцієнт гармонічних спотворень.`
        );
    }

    const powerFactor =
        power /
        apparentPower;

    const harmonicDistortionFactor =
        Math.sqrt(
            Math.max(
                0,
                1 -
                currentDistortionFactor ** 2
            )
        ) /
        currentDistortionFactor;

    const powerBalance =
        Math.sqrt(
            power ** 2 +
            reactivePower ** 2 +
            distortionPower ** 2
        );

    return {
        voltageRegulation,

        apparentPower,

        cosPhi1p:
            phaseModel.cosPhi1p,

        nuP:
            phaseModel.nuP,

        chiP:
            phaseModel.chiP,

        firstHarmonicCurrent,

        reactivePower,

        distortionPower,

        currentDistortionFactor,

        powerFactor,

        harmonicDistortionFactor,

        powerBalance
    };
}