export const LAB06_EXPERIMENT_STORAGE_KEY =
    "eetsee.lab06.experiment.v1";

export const LAB06_EXPERIMENT_MODES = Object.freeze([
    Object.freeze({
        id: "mode-1",
        position: 1,
        alpha: 0,
        readings: Object.freeze({
            u1: 220,
            current: 5,
            power: 900,
            u2: 220
        })
    }),

    Object.freeze({
        id: "mode-2",
        position: 2,
        alpha: 60,
        readings: Object.freeze({
            u1: 220,
            current: 3.7,
            power: 400,
            u2: 150
        })
    }),

    Object.freeze({
        id: "mode-3",
        position: 3,
        alpha: 90,
        readings: Object.freeze({
            u1: 220,
            current: 2.8,
            power: 200,
            u2: 110
        })
    })
]);

export function getExperimentMode(modeId) {
    return (
        LAB06_EXPERIMENT_MODES.find(
            (mode) => mode.id === modeId
        ) ?? LAB06_EXPERIMENT_MODES[0]
    );
}