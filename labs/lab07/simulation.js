import { createStorage } from "../../common/js/storage.js";

const EMPTY_READING = "—";
const MODEL_MILLISECONDS_PER_SECOND = 70;

const EXPERIMENT_MODES = Object.freeze([
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

function formatNumber(value, digits = 0) {
    if (!Number.isFinite(value)) {
        return EMPTY_READING;
    }

    return new Intl.NumberFormat("uk-UA", {
        minimumFractionDigits: 0,
        maximumFractionDigits: digits
    }).format(value);
}

function isFiniteNumber(value) {
    return Number.isFinite(Number(value));
}

function normalizeStoredProgress(value) {
    const normalized = {
        burner: value?.burner === 2 ? 2 : 1,
        records: {}
    };

    EXPERIMENT_MODES.forEach((mode) => {
        const sourceRecord = value?.records?.[mode.id];

        if (
            !sourceRecord ||
            typeof sourceRecord !== "object"
        ) {
            return;
        }

        const cycles = Array.isArray(sourceRecord.cycles)
            ? sourceRecord.cycles
                .filter(
                    (cycle) =>
                        isFiniteNumber(cycle?.tOn) &&
                        isFiniteNumber(cycle?.tOff) &&
                        isFiniteNumber(cycle?.tauOn) &&
                        isFiniteNumber(cycle?.tauOff)
                )
                .slice(0, 3)
                .map((cycle) => ({
                    tOn: Number(cycle.tOn),
                    tOff: Number(cycle.tOff),
                    tauOn: Number(cycle.tauOn),
                    tauOff: Number(cycle.tauOff)
                }))
            : [];

        normalized.records[mode.id] = {
            position: mode.position,
            tau0: isFiniteNumber(sourceRecord.tau0)
                ? Number(sourceRecord.tau0)
                : null,
            cycles
        };
    });

    return normalized;
}

export function initializeExperiment({
    namespace = "lab07"
} = {}) {
    const section = document.querySelector("#experiment");

    if (
        !section ||
        section.dataset.initialized === "true"
    ) {
        return;
    }

    const find = (selector) =>
        section.querySelector(selector);

    const findAll = (selector) =>
        Array.from(section.querySelectorAll(selector));

    const elements = {
        interactiveArea:
            find("#experiment-interactive-area"),

        lockOverlay:
            find("#experiment-lock-overlay"),

        powerButton:
            find("#experiment-power-button"),

        powerState:
            find("#experiment-power-state"),

        phaseLabel:
            find("#experiment-phase-label"),

        taskTitle:
            find("#experiment-task-title"),

        taskDescription:
            find("#experiment-task-description"),

        actionButton:
            find("#experiment-action-button"),

        message:
            find("#experiment-message"),

        currentMode:
            find("#experiment-current-mode"),

        regulatorLabel:
            find("#experiment-regulator-label"),

        indicator:
            find("#experiment-indicator"),

        indicatorLabel:
            find("#experiment-indicator-label"),

        switchValue:
            find("#experiment-switch"),

        switchLabel:
            find("#experiment-switch-label"),

        currentReading:
            find("#experiment-current-reading"),

        currentNote:
            find("#experiment-current-note"),

        stopwatchReading:
            find("#experiment-stopwatch-reading"),

        stopwatchNote:
            find("#experiment-stopwatch-note"),

        temperatureReading:
            find("#experiment-temperature-reading"),

        temperatureNote:
            find("#experiment-temperature-note"),

        intervalLabel:
            find("#experiment-interval-label"),

        cycleTrack:
            find(".experiment-cycle-track"),

        cycleBar:
            find("#experiment-cycle-bar"),

        temperatureLine:
            find("#experiment-temperature-line"),

        temperaturePoint:
            find("#experiment-temperature-point"),

        chartMinimum:
            find("#experiment-chart-y-min"),

        chartMaximum:
            find("#experiment-chart-y-max"),

        chartTimeMaximum:
            find("#experiment-chart-x-max"),

        chartStatus:
            find("#experiment-chart-status"),

        tableBody:
            find("#experiment-table-body"),

        progressValue:
            find("#experiment-progress-value"),

        resetButton:
            find("#experiment-reset-button"),

        knob:
            find(".experiment-knob"),

        burnerButtons:
            findAll(".experiment-burner-button"),

        visualBurners:
            findAll("[data-visual-burner]"),

        modeButtons:
            findAll(".experiment-mode-button")
    };

    const missingElement =
        Object.entries(elements).some(
            ([key, value]) =>
                ![
                    "burnerButtons",
                    "visualBurners",
                    "modeButtons"
                ].includes(key) &&
                !value
        );

    if (
        missingElement ||
        elements.burnerButtons.length !== 2 ||
        elements.visualBurners.length !== 2 ||
        elements.modeButtons.length !== 3
    ) {
        console.warn(
            "Не знайдено елементи інтерактивного експерименту ЛР7."
        );

        return;
    }

    section.dataset.initialized = "true";

    const standStorage = createStorage(
        `${namespace}:stand`
    );

    const experimentStorage = createStorage(
        `${namespace}:cyclic-experiment`
    );

    const storedProgress = normalizeStoredProgress(
        experimentStorage.get("progress", {})
    );

    const state = {
        burner: storedProgress.burner,
        records: storedProgress.records,
        modeIndex: 0,
        phase: "await-initial",
        isPowered: false,
        circuitOn: false,
        currentTemperature: null,
        lastMeasuredTemperature: null,
        elapsedInterval: 0,
        intervalProgress: 0,
        partialCycle: null,
        animationFrame: null
    };

    function getMode() {
        return EXPERIMENT_MODES[state.modeIndex];
    }

    function getRecord(mode = getMode()) {
        return state.records[mode.id] ?? null;
    }

    function ensureRecord(mode = getMode()) {
        if (!state.records[mode.id]) {
            state.records[mode.id] = {
                position: mode.position,
                tau0: null,
                cycles: []
            };
        }

        return state.records[mode.id];
    }

    function getCompletedCycleCount() {
        return EXPERIMENT_MODES.reduce(
            (total, mode) =>
                total +
                (
                    state.records[mode.id]?.cycles.length ??
                    0
                ),
            0
        );
    }

    function hasStartedExperiment() {
        return EXPERIMENT_MODES.some((mode) => {
            const record = state.records[mode.id];

            return Boolean(
                record &&
                (
                    Number.isFinite(record.tau0) ||
                    record.cycles.length > 0
                )
            );
        });
    }

    function isModeCompleted(mode) {
        return (
            state.records[mode.id]?.cycles.length ??
            0
        ) === 3;
    }

    function isStandReady() {
        return (
            standStorage.get("progress", {}).ready ===
            true
        );
    }

    function saveProgress() {
        experimentStorage.set("progress", {
            burner: state.burner,
            records: state.records
        });
    }

    function setMessage(
        text,
        type = "default"
    ) {
        elements.message.textContent = text;
        elements.message.dataset.type = type;
    }

    function cancelAnimation() {
        if (state.animationFrame !== null) {
            window.cancelAnimationFrame(
                state.animationFrame
            );

            state.animationFrame = null;
        }
    }

    function resolveInitialState() {
        const firstIncompleteIndex =
            EXPERIMENT_MODES.findIndex(
                (mode) => !isModeCompleted(mode)
            );

        if (firstIncompleteIndex === -1) {
            state.modeIndex =
                EXPERIMENT_MODES.length - 1;

            state.phase = "complete";

            const lastMode = getMode();
            const lastRecord = getRecord(lastMode);
            const lastCycle =
                lastRecord?.cycles.at(-1);

            state.currentTemperature =
                lastCycle?.tauOff ??
                lastMode.initialTemperature;

            state.lastMeasuredTemperature =
                lastCycle?.tauOff ??
                null;

            return;
        }

        state.modeIndex = firstIncompleteIndex;

        const mode = getMode();
        const record = getRecord(mode);
        const lastCycle =
            record?.cycles.at(-1);

        state.currentTemperature =
            lastCycle?.tauOff ??
            record?.tau0 ??
            mode.initialTemperature;

        state.lastMeasuredTemperature =
            lastCycle?.tauOff ??
            record?.tau0 ??
            null;

        state.phase =
            Number.isFinite(record?.tau0)
                ? "await-power"
                : "await-initial";
    }

    function updateAccess(event) {
        if (
            event?.detail?.namespace &&
            event.detail.namespace !== namespace
        ) {
            return;
        }

        const accessGranted = isStandReady();

        elements.lockOverlay.hidden =
            accessGranted;

        elements.interactiveArea.inert =
            !accessGranted;

        section.classList.toggle(
            "experiment-access-granted",
            accessGranted
        );

        if (
            !accessGranted &&
            state.isPowered
        ) {
            cancelAnimation();

            state.isPowered = false;
            state.circuitOn = false;
            state.partialCycle = null;

            state.phase =
                Number.isFinite(getRecord()?.tau0)
                    ? "await-power"
                    : "await-initial";

            renderAll();
        }
    }

    function getCycleIndex() {
        return (
            getRecord()?.cycles.length ??
            0
        );
    }

    function getCurrentCycleDefinition() {
        return getMode().cycles[
            getCycleIndex()
        ];
    }

    function getTemperatureProgress(
        linearProgress
    ) {
        const numerator =
            1 -
            Math.exp(
                -2.4 * linearProgress
            );

        const denominator =
            1 -
            Math.exp(-2.4);

        return numerator / denominator;
    }

    function appendCurveSamples(
        points,
        {
            startTime,
            startTemperature,
            duration,
            endTemperature,
            progress = 1
        }
    ) {
        const limitedProgress =
            Math.min(
                1,
                Math.max(0, progress)
            );

        const samples = Math.max(
            2,
            Math.ceil(
                24 * limitedProgress
            )
        );

        for (
            let index = 1;
            index <= samples;
            index += 1
        ) {
            const intervalProgress =
                limitedProgress *
                (index / samples);

            const temperatureProgress =
                getTemperatureProgress(
                    intervalProgress
                );

            points.push({
                time:
                    startTime +
                    duration *
                    intervalProgress,

                temperature:
                    startTemperature +
                    (
                        endTemperature -
                        startTemperature
                    ) *
                    temperatureProgress
            });
        }

        return {
            time:
                startTime +
                duration *
                limitedProgress,

            temperature:
                startTemperature +
                (
                    endTemperature -
                    startTemperature
                ) *
                getTemperatureProgress(
                    limitedProgress
                )
        };
    }

    function buildTemperatureTrace() {
        const mode = getMode();
        const record = getRecord(mode);

        if (
            !Number.isFinite(record?.tau0)
        ) {
            return [];
        }

        const points = [
            {
                time: 0,
                temperature: record.tau0
            }
        ];

        let cursor = {
            time: 0,
            temperature: record.tau0
        };

        record.cycles.forEach((cycle) => {
            cursor = appendCurveSamples(
                points,
                {
                    startTime:
                        cursor.time,

                    startTemperature:
                        cursor.temperature,

                    duration:
                        cycle.tOn,

                    endTemperature:
                        cycle.tauOn
                }
            );

            cursor = appendCurveSamples(
                points,
                {
                    startTime:
                        cursor.time,

                    startTemperature:
                        cursor.temperature,

                    duration:
                        cycle.tOff,

                    endTemperature:
                        cycle.tauOff
                }
            );
        });

        const cycle =
            getCurrentCycleDefinition();

        const includesHeating = [
            "heating",
            "await-tau-n",
            "cooling",
            "await-tau-o"
        ].includes(state.phase);

        if (
            !cycle ||
            !includesHeating
        ) {
            return points;
        }

        const heatingProgress =
            state.phase === "heating"
                ? state.intervalProgress
                : 1;

        cursor = appendCurveSamples(
            points,
            {
                startTime:
                    cursor.time,

                startTemperature:
                    cursor.temperature,

                duration:
                    cycle.tOn,

                endTemperature:
                    cycle.tauOn,

                progress:
                    heatingProgress
            }
        );

        const includesCooling = [
            "cooling",
            "await-tau-o"
        ].includes(state.phase);

        if (!includesCooling) {
            return points;
        }

        const coolingProgress =
            state.phase === "cooling"
                ? state.intervalProgress
                : 1;

        appendCurveSamples(
            points,
            {
                startTime:
                    cursor.time,

                startTemperature:
                    cycle.tauOn,

                duration:
                    cycle.tOff,

                endTemperature:
                    cycle.tauOff,

                progress:
                    coolingProgress
            }
        );

        return points;
    }

    function getPhaseText() {
        const labels = {
            "await-initial":
                "Початкове вимірювання",

            "await-power":
                "Очікується ввімкнення",

            "ready-cycle":
                "Готовність до циклу",

            heating:
                "Нагрівання конфорки",

            "await-tau-n":
                "Автоматичне вимкнення",

            cooling:
                "Охолодження конфорки",

            "await-tau-o":
                "Завершення охолодження",

            "mode-done":
                "Режим завершено",

            complete:
                "Експеримент завершено"
        };

        return (
            labels[state.phase] ??
            "Підготовка"
        );
    }

    function renderTemperatureTrace() {
        const mode = getMode();
        const points =
            buildTemperatureTrace();

        const allTemperatures = [
            mode.initialTemperature,
            ...mode.cycles.flatMap(
                (cycle) => [
                    cycle.tauOn,
                    cycle.tauOff
                ]
            )
        ];

        const minimum =
            Math.floor(
                (
                    Math.min(
                        ...allTemperatures
                    ) -
                    10
                ) /
                10
            ) *
            10;

        const maximum =
            Math.ceil(
                (
                    Math.max(
                        ...allTemperatures
                    ) +
                    10
                ) /
                10
            ) *
            10;

        const range = Math.max(
            1,
            maximum - minimum
        );

        const totalTime =
            mode.cycles.reduce(
                (total, cycle) =>
                    total +
                    cycle.tOn +
                    cycle.tOff,
                0
            );

        elements.chartMinimum.textContent =
            formatNumber(minimum);

        elements.chartMaximum.textContent =
            formatNumber(maximum);

        elements.chartTimeMaximum.textContent =
            formatNumber(totalTime);

        elements.chartStatus.textContent =
            getPhaseText();

        if (points.length === 0) {
            elements.temperatureLine.setAttribute(
                "points",
                ""
            );

            elements.temperaturePoint.hidden =
                true;

            return;
        }

        const mappedPoints =
            points.map((point) => ({
                x:
                    64 +
                    (
                        point.time /
                        totalTime
                    ) *
                    584,

                y:
                    198 -
                    (
                        (
                            point.temperature -
                            minimum
                        ) /
                        range
                    ) *
                    174
            }));

        const svgPoints =
            mappedPoints
                .map(
                    (point) =>
                        `${point.x.toFixed(1)},${point.y.toFixed(1)}`
                )
                .join(" ");

        const lastPoint =
            mappedPoints.at(-1);

        elements.temperatureLine.setAttribute(
            "points",
            svgPoints
        );

        elements.temperaturePoint.hidden =
            false;

        elements.temperaturePoint.setAttribute(
            "cx",
            lastPoint.x.toFixed(1)
        );

        elements.temperaturePoint.setAttribute(
            "cy",
            lastPoint.y.toFixed(1)
        );
    }

    function renderBurners() {
        const burnerSelectionLocked =
            hasStartedExperiment() ||
            state.isPowered;

        elements.burnerButtons.forEach(
            (button) => {
                const burner = Number(
                    button.dataset.burner
                );

                const selected =
                    burner === state.burner;

                button.classList.toggle(
                    "is-selected",
                    selected
                );

                button.setAttribute(
                    "aria-pressed",
                    String(selected)
                );

                button.disabled =
                    burnerSelectionLocked;
            }
        );

        elements.visualBurners.forEach(
            (button) => {
                const burner = Number(
                    button.dataset
                        .visualBurner
                );

                const selected =
                    burner === state.burner;

                button.classList.toggle(
                    "is-selected",
                    selected
                );

                button.classList.toggle(
                    "is-heating",
                    selected &&
                    state.circuitOn
                );

                button.setAttribute(
                    "aria-pressed",
                    String(selected)
                );

                button.disabled =
                    burnerSelectionLocked;

                const heatLevel =
                    Number.isFinite(
                        state.currentTemperature
                    )
                        ? Math.min(
                            1,
                            Math.max(
                                0.12,
                                state.currentTemperature /
                                300
                            )
                        )
                        : 0.12;

                button.style.setProperty(
                    "--heat-level",
                    heatLevel.toFixed(2)
                );

                button.style.setProperty(
                    "--heat-glow",
                    `${Math.round(
                        8 +
                        heatLevel *
                        28
                    )}px`
                );

                button.style.setProperty(
                    "--heat-brightness",
                    (
                        0.92 +
                        heatLevel *
                        0.42
                    ).toFixed(2)
                );
            }
        );
    }

    function renderModes() {
        elements.modeButtons.forEach(
            (button, index) => {
                const mode =
                    EXPERIMENT_MODES[index];

                const selected =
                    index ===
                    state.modeIndex;

                const completed =
                    isModeCompleted(mode);

                button.classList.toggle(
                    "is-selected",
                    selected
                );

                button.classList.toggle(
                    "is-completed",
                    completed
                );

                button.setAttribute(
                    "aria-pressed",
                    String(selected)
                );

                button.disabled = true;

                const strong =
                    button.querySelector(
                        "strong"
                    );

                if (strong) {
                    strong.textContent =
                        completed
                            ? "Завершено"
                            : selected
                                ? "Поточний"
                                : "Заблоковано";
                }
            }
        );
    }

    function renderTask() {
        const cycleNumber = Math.min(
            3,
            getCycleIndex() + 1
        );

        const isLastMode =
            state.modeIndex ===
            EXPERIMENT_MODES.length - 1;

        const tasks = {
            "await-initial": {
                title:
                    "Виміряйте початкову температуру τ₀",

                description:
                    "Установка має бути вимкнена. Наведіть пірометр на вибрану конфорку та зафіксуйте початкову температуру.",

                action:
                    "Виміряти τ₀",

                disabled: false
            },

            "await-power": {
                title:
                    "Увімкніть лабораторну установку",

                description:
                    "Початкову температуру записано. Увімкніть установку кнопкою у верхній панелі.",

                action:
                    "Очікується ввімкнення",

                disabled: true
            },

            "ready-cycle": {
                title:
                    `Розпочніть цикл ${cycleNumber}`,

                description:
                    "Секундомір почне відлік увімкненого стану. Слідкуйте за індикатором, амперметром і температурною кривою.",

                action:
                    `Розпочати цикл ${cycleNumber}`,

                disabled:
                    !state.isPowered
            },

            heating: {
                title:
                    `Цикл ${cycleNumber}: нагрівання`,

                description:
                    "Регулятор подав живлення на конфорку. Триває відлік tн.",

                action:
                    "Триває нагрівання...",

                disabled: true
            },

            "await-tau-n": {
                title:
                    "Зафіксуйте завершення нагрівання",

                description:
                    "Регулятор автоматично розімкнув коло. Зафіксуйте tн і виміряйте температуру τн.",

                action:
                    "Виміряти τн і розпочати охолодження",

                disabled: false
            },

            cooling: {
                title:
                    `Цикл ${cycleNumber}: охолодження`,

                description:
                    "Живлення конфорки відсутнє. Триває відлік вимкненого стану tо.",

                action:
                    "Триває охолодження...",

                disabled: true
            },

            "await-tau-o": {
                title:
                    "Зафіксуйте завершення охолодження",

                description:
                    "Регулятор досяг моменту повторного ввімкнення. Зафіксуйте tо і виміряйте температуру τо.",

                action:
                    "Виміряти τо та записати цикл",

                disabled: false
            },

            "mode-done": {
                title:
                    `Положення ${getMode().position} досліджено`,

                description:
                    isLastMode
                        ? "Усі три цикли останнього режиму записано. Завершіть експеримент."
                        : "Три цикли режиму записано. Перейдіть до наступного положення регулятора.",

                action:
                    isLastMode
                        ? "Завершити експеримент"
                        : `Перейти до положення ${getMode().position + 1}`,

                disabled: false
            },

            complete: {
                title:
                    "Експериментальні дані отримано",

                description:
                    "Завершено дев’ять циклів. Можна переходити до розрахунків повної та відносної тривалості ввімкнення.",

                action:
                    "Експеримент завершено",

                disabled: true
            }
        };

        const task =
            tasks[state.phase];

        elements.taskTitle.textContent =
            task.title;

        elements.taskDescription.textContent =
            task.description;

        elements.actionButton.textContent =
            task.action;

        elements.actionButton.disabled =
            task.disabled;
    }

    function renderVisualState() {
        const mode = getMode();

        const cycleNumber =
            Math.min(
                3,
                getCycleIndex() + 1
            );

        const knobAngles = [
            "-105deg",
            "-45deg",
            "20deg"
        ];

        elements.powerState.textContent =
            state.isPowered
                ? "Увімкнена"
                : "Вимкнена";

        elements.powerState.classList.toggle(
            "is-on",
            state.isPowered
        );

        elements.powerButton.textContent =
            state.isPowered
                ? "Вимкнути установку"
                : "Увімкнути установку";

        elements.powerButton.classList.toggle(
            "is-on",
            state.isPowered
        );

        elements.powerButton.disabled =
            ![
                "await-power",
                "ready-cycle"
            ].includes(state.phase);

        elements.phaseLabel.textContent =
            getPhaseText();

        elements.currentMode.textContent =
            state.phase === "complete"
                ? "Усі режими завершено"
                : `Положення ${mode.position}, цикл ${cycleNumber}`;

        elements.regulatorLabel.textContent =
            `Регулятор: ${mode.position}`;

        elements.knob.style.setProperty(
            "--knob-angle",
            knobAngles[state.modeIndex]
        );

        elements.indicator.classList.toggle(
            "is-on",
            state.circuitOn
        );

        elements.indicatorLabel.textContent =
            `L${state.burner}: ${
                state.circuitOn
                    ? "увімкнено"
                    : "вимкнено"
            }`;

        elements.switchValue.textContent =
            state.isPowered
                ? "I"
                : "0";

        elements.switchLabel.textContent =
            `K${state.burner}`;

        elements.currentReading.textContent =
            state.circuitOn
                ? "I > 0"
                : "0";

        elements.currentNote.textContent =
            state.circuitOn
                ? "Струм проходить через конфорку"
                : "Струм через конфорку відсутній";

        elements.stopwatchReading.textContent =
            formatNumber(
                state.elapsedInterval
            );

        elements.temperatureReading.textContent =
            Number.isFinite(
                state.lastMeasuredTemperature
            )
                ? formatNumber(
                    state.lastMeasuredTemperature
                )
                : EMPTY_READING;

        if (
            [
                "heating",
                "await-tau-n"
            ].includes(state.phase)
        ) {
            elements.stopwatchNote.textContent =
                "Відлік увімкненого стану tн";
        } else if (
            [
                "cooling",
                "await-tau-o"
            ].includes(state.phase)
        ) {
            elements.stopwatchNote.textContent =
                "Відлік вимкненого стану tо";
        } else {
            elements.stopwatchNote.textContent =
                "Очікування початку інтервалу";
        }

        if (
            state.phase ===
            "await-tau-n"
        ) {
            elements.temperatureNote.textContent =
                "Очікується фіксація температури τн";
        } else if (
            state.phase ===
            "await-tau-o"
        ) {
            elements.temperatureNote.textContent =
                "Очікується фіксація температури τо";
        } else if (
            state.phase === "cooling"
        ) {
            elements.temperatureNote.textContent =
                "Останнє вимірювання: температура τн";
        } else if (
            Number.isFinite(
                state.lastMeasuredTemperature
            )
        ) {
            elements.temperatureNote.textContent =
                "Останнє зафіксоване значення";
        } else {
            elements.temperatureNote.textContent =
                "Значення ще не зафіксовано";
        }

        const progressPercent =
            Math.round(
                state.intervalProgress *
                100
            );

        elements.cycleBar.style.width =
            `${progressPercent}%`;

        elements.cycleTrack.setAttribute(
            "aria-valuenow",
            String(progressPercent)
        );

        elements.cycleTrack.classList.toggle(
            "is-cooling",
            state.phase === "cooling" ||
            state.phase === "await-tau-o"
        );

        if (
            [
                "heating",
                "await-tau-n"
            ].includes(state.phase)
        ) {
            elements.intervalLabel.textContent =
                "Увімкнений стан tн";
        } else if (
            [
                "cooling",
                "await-tau-o"
            ].includes(state.phase)
        ) {
            elements.intervalLabel.textContent =
                "Вимкнений стан tо";
        } else {
            elements.intervalLabel.textContent =
                "Очікується";
        }

        renderBurners();
        renderTemperatureTrace();
    }

    function renderTable() {
        elements.tableBody.innerHTML =
            EXPERIMENT_MODES
                .map((mode, index) => {
                    const record =
                        state.records[
                            mode.id
                        ];

                    const cells = [];

                    for (
                        let cycleIndex = 0;
                        cycleIndex < 3;
                        cycleIndex += 1
                    ) {
                        const cycle =
                            record?.cycles[
                                cycleIndex
                            ];

                        cells.push(
                            cycle
                                ? formatNumber(
                                    cycle.tOn
                                )
                                : EMPTY_READING,

                            cycle
                                ? formatNumber(
                                    cycle.tauOn
                                )
                                : EMPTY_READING,

                            cycle
                                ? formatNumber(
                                    cycle.tOff
                                )
                                : EMPTY_READING,

                            cycle
                                ? formatNumber(
                                    cycle.tauOff
                                )
                                : EMPTY_READING
                        );
                    }

                    const completed =
                        isModeCompleted(mode);

                    const active =
                        index ===
                        state.modeIndex &&
                        state.phase !==
                        "complete";

                    return `
                        <tr class="${
                            completed
                                ? "is-completed"
                                : ""
                        } ${
                            active
                                ? "is-active"
                                : ""
                        }">
                            <th scope="row">
                                ${mode.position}
                            </th>

                            <td>
                                ${
                                    Number.isFinite(
                                        record?.tau0
                                    )
                                        ? formatNumber(
                                            record.tau0
                                        )
                                        : EMPTY_READING
                                }
                            </td>

                            ${cells
                                .map(
                                    (cell) =>
                                        `<td>${cell}</td>`
                                )
                                .join("")}

                            <td>
                                <span class="record-status">
                                    ${
                                        completed
                                            ? "Завершено"
                                            : record?.cycles.length
                                                ? `${record.cycles.length} із 3`
                                                : "Очікується"
                                    }
                                </span>
                            </td>
                        </tr>
                    `;
                })
                .join("");

        const completedCycles =
            getCompletedCycleCount();

        elements.progressValue.textContent =
            `${completedCycles} із 9`;

        section.classList.toggle(
            "is-completed",
            completedCycles === 9
        );
    }

    function renderAll() {
        renderModes();
        renderTask();
        renderVisualState();
        renderTable();
    }

    function selectBurner(burner) {
        if (
            hasStartedExperiment() ||
            state.isPowered
        ) {
            return;
        }

        state.burner =
            burner === 2
                ? 2
                : 1;

        saveProgress();
        renderAll();

        setMessage(
            `Для досліду вибрано конфорку ${state.burner}.`
        );
    }

    function measureInitialTemperature() {
        const mode = getMode();
        const record =
            ensureRecord(mode);

        record.tau0 =
            mode.initialTemperature;

        state.currentTemperature =
            record.tau0;

        state.lastMeasuredTemperature =
            record.tau0;

        state.phase = "await-power";
        state.elapsedInterval = 0;
        state.intervalProgress = 0;

        saveProgress();
        renderAll();

        setMessage(
            `Початкову температуру τ₀ = ${formatNumber(
                record.tau0
            )} °C записано. Увімкніть установку.`,
            "success"
        );
    }

    function togglePower() {
        if (
            state.phase ===
            "await-power"
        ) {
            state.isPowered = true;
            state.circuitOn = false;
            state.phase =
                "ready-cycle";

            renderAll();

            setMessage(
                "Установку увімкнено. Розпочніть перший інтервал нагрівання.",
                "success"
            );

            return;
        }

        if (
            state.phase ===
            "ready-cycle"
        ) {
            state.isPowered = false;
            state.circuitOn = false;
            state.phase =
                "await-power";

            renderAll();

            setMessage(
                "Установку вимкнено."
            );
        }
    }

    function runInterval(kind) {
        const cycle =
            getCurrentCycleDefinition();

        if (
            !cycle ||
            !state.isPowered
        ) {
            return;
        }

        const isHeating =
            kind === "heating";

        const duration =
            isHeating
                ? cycle.tOn
                : cycle.tOff;

        const startTemperature =
            state.currentTemperature;

        const endTemperature =
            isHeating
                ? cycle.tauOn
                : cycle.tauOff;

        const startTime =
            window.performance.now();

        state.phase = kind;
        state.circuitOn = isHeating;
        state.elapsedInterval = 0;
        state.intervalProgress = 0;

        if (isHeating) {
            state.partialCycle = {
                tOn: cycle.tOn,
                tauOn: null,
                tOff: cycle.tOff,
                tauOff: null
            };
        }

        renderAll();

        setMessage(
            isHeating
                ? "Конфорку автоматично ввімкнено. Триває відлік tн."
                : "Конфорку автоматично вимкнено. Триває відлік tо."
        );

        function tick(now) {
            const elapsedMilliseconds =
                now - startTime;

            const elapsedModelTime =
                Math.min(
                    duration,
                    elapsedMilliseconds /
                    MODEL_MILLISECONDS_PER_SECOND
                );

            const linearProgress =
                elapsedModelTime /
                duration;

            const temperatureProgress =
                getTemperatureProgress(
                    linearProgress
                );

            state.elapsedInterval =
                elapsedModelTime;

            state.intervalProgress =
                linearProgress;

            state.currentTemperature =
                startTemperature +
                (
                    endTemperature -
                    startTemperature
                ) *
                temperatureProgress;

            renderVisualState();

            if (
                linearProgress < 1
            ) {
                state.animationFrame =
                    window.requestAnimationFrame(
                        tick
                    );

                return;
            }

            state.animationFrame = null;

            state.currentTemperature =
                endTemperature;

            state.elapsedInterval =
                duration;

            state.intervalProgress = 1;
            state.circuitOn = false;

            state.phase =
                isHeating
                    ? "await-tau-n"
                    : "await-tau-o";

            renderAll();

            setMessage(
                isHeating
                    ? "Регулятор автоматично вимкнув конфорку. Зафіксуйте tн і виміряйте τн."
                    : "Інтервал охолодження завершено. Зафіксуйте tо і виміряйте τо.",
                "warning"
            );
        }

        state.animationFrame =
            window.requestAnimationFrame(
                tick
            );
    }

    function measureHeatingEndpoint() {
        state.partialCycle.tauOn =
            state.currentTemperature;

        state.lastMeasuredTemperature =
            state.currentTemperature;

        state.phase = "cooling";
        state.elapsedInterval = 0;
        state.intervalProgress = 0;

        renderAll();

        setMessage(
            `Записано tн = ${formatNumber(
                state.partialCycle.tOn
            )} с і τн = ${formatNumber(
                state.partialCycle.tauOn
            )} °C. Починається охолодження.`,
            "success"
        );

        window.setTimeout(() => {
            if (
                state.phase ===
                "cooling"
            ) {
                runInterval(
                    "cooling"
                );
            }
        }, 450);
    }

    function measureCoolingEndpoint() {
        const record =
            ensureRecord();

        state.partialCycle.tauOff =
            state.currentTemperature;

        state.lastMeasuredTemperature =
            state.currentTemperature;

        record.cycles.push({
            tOn:
                state.partialCycle.tOn,

            tauOn:
                state.partialCycle.tauOn,

            tOff:
                state.partialCycle.tOff,

            tauOff:
                state.partialCycle.tauOff
        });

        state.partialCycle = null;
        state.elapsedInterval = 0;
        state.intervalProgress = 0;

        const completedMode =
            record.cycles.length === 3;

        if (completedMode) {
            state.isPowered = false;
            state.circuitOn = false;
            state.phase = "mode-done";
        } else {
            state.phase = "ready-cycle";
        }

        saveProgress();
        renderAll();

        window.dispatchEvent(
            new CustomEvent(
                "lab07:cyclic-experiment-updated",
                {
                    detail: {
                        burner:
                            state.burner,

                        modeId:
                            getMode().id,

                        records:
                            state.records
                    }
                }
            )
        );

        setMessage(
            completedMode
                ? `Три цикли положення ${getMode().position} завершено.`
                : `Цикл ${record.cycles.length} записано. Підготуйте наступний цикл.`,
            "success"
        );
    }

    function continueAfterMode() {
        const isLastMode =
            state.modeIndex ===
            EXPERIMENT_MODES.length - 1;

        if (isLastMode) {
            state.phase = "complete";

            renderAll();

            window.dispatchEvent(
                new CustomEvent(
                    "lab07:cyclic-experiment-completed",
                    {
                        detail: {
                            burner:
                                state.burner,

                            records:
                                state.records
                        }
                    }
                )
            );

            setMessage(
                "Усі дев’ять циклів завершено. Перейдіть до розрахунків.",
                "success"
            );

            return;
        }

        state.modeIndex += 1;
        state.phase = "await-initial";

        state.currentTemperature =
            getMode().initialTemperature;

        state.lastMeasuredTemperature =
            null;

        state.elapsedInterval = 0;
        state.intervalProgress = 0;

        renderAll();

        setMessage(
            `Встановлено положення ${getMode().position}. Виміряйте нову початкову температуру τ₀.`
        );
    }

    function handlePrimaryAction() {
        const actions = {
            "await-initial":
                measureInitialTemperature,

            "ready-cycle":
                () =>
                    runInterval(
                        "heating"
                    ),

            "await-tau-n":
                measureHeatingEndpoint,

            "await-tau-o":
                measureCoolingEndpoint,

            "mode-done":
                continueAfterMode
        };

        actions[state.phase]?.();
    }

    function resetExperiment() {
        const confirmed =
            window.confirm(
                "Очистити всі дані дев’яти циклів і почати дослід спочатку?"
            );

        if (!confirmed) {
            return;
        }

        cancelAnimation();

        state.burner = 1;
        state.records = {};
        state.modeIndex = 0;
        state.phase = "await-initial";
        state.isPowered = false;
        state.circuitOn = false;

        state.currentTemperature =
            getMode().initialTemperature;

        state.lastMeasuredTemperature =
            null;

        state.elapsedInterval = 0;
        state.intervalProgress = 0;
        state.partialCycle = null;

        saveProgress();
        renderAll();

        window.dispatchEvent(
            new CustomEvent(
                "lab07:cyclic-experiment-reset"
            )
        );

        setMessage(
            "Результати очищено. Оберіть конфорку та виміряйте τ₀."
        );
    }

    elements.burnerButtons.forEach(
        (button) => {
            button.addEventListener(
                "click",
                () => {
                    selectBurner(
                        Number(
                            button.dataset.burner
                        )
                    );
                }
            );
        }
    );

    elements.visualBurners.forEach(
        (button) => {
            button.addEventListener(
                "click",
                () => {
                    selectBurner(
                        Number(
                            button.dataset
                                .visualBurner
                        )
                    );
                }
            );
        }
    );

    elements.powerButton.addEventListener(
        "click",
        togglePower
    );

    elements.actionButton.addEventListener(
        "click",
        handlePrimaryAction
    );

    elements.resetButton.addEventListener(
        "click",
        resetExperiment
    );

    document.addEventListener(
        "laboratory:stand-ready",
        updateAccess
    );

    document.addEventListener(
        "laboratory:stand-reset",
        updateAccess
    );

    resolveInitialState();
    renderAll();
    updateAccess();
}