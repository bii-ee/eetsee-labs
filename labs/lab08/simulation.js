import {
    createStorage
} from "../../common/js/storage.js";

const THERMOSTAT_CYCLES = Object.freeze([
    {
        voltage: 219.6,
        current: 5.8,
        power: 1.20,
        onTime: 6.06,
        offTime: 6.47,
        finalTemperature: 32.0
    },
    {
        voltage: 220.1,
        current: 6.3,
        power: 1.30,
        onTime: 9.39,
        offTime: 9.82,
        finalTemperature: 45.0
    },
    {
        voltage: 219.8,
        current: 6.8,
        power: 1.40,
        onTime: 9.40,
        offTime: 6.26,
        finalTemperature: 58.0
    },
    {
        voltage: 220.3,
        current: 7.3,
        power: 1.50,
        onTime: 8.42,
        offTime: 7.67,
        finalTemperature: 72.0
    },
    {
        voltage: 219.9,
        current: 7.7,
        power: 1.60,
        onTime: 7.92,
        offTime: 8.16,
        finalTemperature: 86.0
    },
    {
        voltage: 220.2,
        current: 8.2,
        power: 1.70,
        onTime: 8.11,
        offTime: 5.69,
        finalTemperature: 100.0
    }
]);

const PARAMETER_TRIALS = Object.freeze([
    {
        setTemperature: 110,
        setVoltage: 200,
        voltage: 199.2,
        initialTemperature: 20.0,
        current: 7.0,
        power: 1.31,
        boilingTime: 6.30
    },
    {
        setTemperature: 110,
        setVoltage: 220,
        voltage: 219.4,
        initialTemperature: 20.2,
        current: 6.2,
        power: 1.28,
        boilingTime: 5.72
    },
    {
        setTemperature: 110,
        setVoltage: 240,
        voltage: 239.1,
        initialTemperature: 20.1,
        current: 5.9,
        power: 1.34,
        boilingTime: 5.25
    },
    {
        setTemperature: 160,
        setVoltage: 200,
        voltage: 199.6,
        initialTemperature: 20.4,
        current: 7.0,
        power: 1.32,
        boilingTime: 5.95
    },
    {
        setTemperature: 160,
        setVoltage: 220,
        voltage: 219.8,
        initialTemperature: 20.3,
        current: 6.8,
        power: 1.42,
        boilingTime: 5.38
    },
    {
        setTemperature: 160,
        setVoltage: 240,
        voltage: 239.5,
        initialTemperature: 20.5,
        current: 6.4,
        power: 1.48,
        boilingTime: 4.92
    },
    {
        setTemperature: 240,
        setVoltage: 200,
        voltage: 199.4,
        initialTemperature: 20.2,
        current: 7.4,
        power: 1.39,
        boilingTime: 5.61
    },
    {
        setTemperature: 240,
        setVoltage: 220,
        voltage: 219.7,
        initialTemperature: 20.4,
        current: 7.2,
        power: 1.50,
        boilingTime: 5.04
    },
    {
        setTemperature: 240,
        setVoltage: 240,
        voltage: 239.8,
        initialTemperature: 20.3,
        current: 6.7,
        power: 1.57,
        boilingTime: 4.62
    }
]);

const TOTAL_OPERATIONS =
    THERMOSTAT_CYCLES.length +
    PARAMETER_TRIALS.length;

const STATE_VERSION = 1;

const SIMULATION_TIMING = Object.freeze({
    thermostatMillisecondsPerSecond: 230,
    thermostatMinimumInterval: 1800,
    parameterTrialDuration: 3500,
    measurementPause: 700,
    reducedMotionDuration: 900
});

function wait(milliseconds) {
    return new Promise((resolve) => {
        window.setTimeout(
            resolve,
            milliseconds
        );
    });
}

function createInitialState() {
    return {
        version: STATE_VERSION,

        setup: {
            confirmed: false,
            waterVolume: 200,
            waterMass: 0.2,
            initialTemperature: 20
        },

        experimentOne: {
            records: [],
            completed: false
        },

        experimentTwo: {
            records: [],
            completed: false
        },

        completed: false
    };
}

function normalizeState(savedState) {
    const state = createInitialState();

    if (
        !savedState ||
        typeof savedState !== "object" ||
        savedState.version !== STATE_VERSION
    ) {
        return state;
    }

    if (
        savedState.setup &&
        typeof savedState.setup === "object"
    ) {
        const waterVolume = Number(
            savedState.setup.waterVolume
        );
        const waterMass = Number(
            savedState.setup.waterMass
        );
        const initialTemperature = Number(
            savedState.setup.initialTemperature
        );

        if (
            Number.isFinite(waterVolume) &&
            Number.isFinite(waterMass) &&
            Number.isFinite(initialTemperature)
        ) {
            state.setup = {
                confirmed:
                    savedState.setup.confirmed === true,
                waterVolume,
                waterMass,
                initialTemperature
            };
        }
    }

    const firstRecords =
        savedState.experimentOne?.records;
    const secondRecords =
        savedState.experimentTwo?.records;

    if (Array.isArray(firstRecords)) {
        state.experimentOne.records =
            firstRecords.slice(
                0,
                THERMOSTAT_CYCLES.length
            );
    }

    if (Array.isArray(secondRecords)) {
        state.experimentTwo.records =
            secondRecords.slice(
                0,
                PARAMETER_TRIALS.length
            );
    }

    state.experimentOne.completed =
        state.experimentOne.records.length ===
        THERMOSTAT_CYCLES.length;

    state.experimentTwo.completed =
        state.experimentTwo.records.length ===
        PARAMETER_TRIALS.length;

    state.completed =
        state.experimentOne.completed &&
        state.experimentTwo.completed;

    return state;
}

function formatNumber(
    value,
    digits = 1
) {
    return Number(value).toLocaleString(
        "uk-UA",
        {
            minimumFractionDigits: digits,
            maximumFractionDigits: digits
        }
    );
}

function formatTableValue(
    value,
    digits = 1
) {
    if (
        value === null ||
        value === undefined ||
        !Number.isFinite(Number(value))
    ) {
        return "—";
    }

    return formatNumber(
        Number(value),
        digits
    );
}

function clamp(
    value,
    minimum,
    maximum
) {
    return Math.min(
        Math.max(value, minimum),
        maximum
    );
}

function prefersReducedMotion() {
    return window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;
}

export function initializeExperiment({
    root = document,
    namespace = "lab08"
} = {}) {
    const section = root.querySelector(
        "#experiment"
    );

    if (
        !section ||
        section.dataset.initialized === "true"
    ) {
        return;
    }

    const getElement = (selector) =>
        section.querySelector(selector);

    const elements = {
        lockOverlay: getElement(
            "#experiment-lock-overlay"
        ),
        interactiveArea: getElement(
            "#experiment-interactive-area"
        ),

        powerState: getElement(
            "#experiment-power-state"
        ),
        phaseLabel: getElement(
            "#experiment-phase-label"
        ),
        progressValue: getElement(
            "#experiment-progress-value"
        ),

        waterVolumeInput: getElement(
            "#experiment-water-volume"
        ),
        waterMassInput: getElement(
            "#experiment-water-mass"
        ),
        initialTemperatureInput: getElement(
            "#experiment-initial-temperature"
        ),
        setupButton: getElement(
            "#experiment-setup-button"
        ),

        experimentOneTask: getElement(
            "#experiment-one-task"
        ),
        experimentOneDescription: getElement(
            "#experiment-one-description"
        ),
        cycleButton: getElement(
            "#experiment-cycle-button"
        ),
        experimentOneMessage: getElement(
            "#experiment-one-message"
        ),
        experimentOneStatus: getElement(
            "#experiment-one-status"
        ),
        experimentOneTableBody: getElement(
            "#experiment-one-table-body"
        ),
        experimentOneSummary: getElement(
            "#experiment-one-summary"
        ),

        experimentTwoTask: getElement(
            "#experiment-two-task"
        ),
        experimentTwoDescription: getElement(
            "#experiment-two-description"
        ),
        trialButton: getElement(
            "#experiment-trial-button"
        ),
        experimentTwoMessage: getElement(
            "#experiment-two-message"
        ),
        experimentTwoStatus: getElement(
            "#experiment-two-status"
        ),
        experimentTwoTableBody: getElement(
            "#experiment-two-table-body"
        ),
        experimentTwoSummary: getElement(
            "#experiment-two-summary"
        ),
        experimentTwoLock: getElement(
            "#experiment-two-lock"
        ),
        experimentTwoContent: getElement(
            "#experiment-two-content"
        ),

        currentCondition: getElement(
            "#experiment-current-condition"
        ),
        modeBadge: getElement(
            "#experiment-mode-badge"
        ),
        sourceReading: getElement(
            "#experiment-source-reading"
        ),
        latrReading: getElement(
            "#experiment-latr-reading"
        ),

        plateVisual: getElement(
            "#experiment-plate-visual"
        ),
        potVisual: getElement(
            "#experiment-pot-visual"
        ),
        heatingIndicator: getElement(
            "#experiment-heating-indicator"
        ),
        displayMode: getElement(
            "#experiment-display-mode"
        ),
        displaySetting: getElement(
            "#experiment-display-setting"
        ),

        voltageReading: getElement(
            "#experiment-voltage-reading"
        ),
        currentReading: getElement(
            "#experiment-current-reading"
        ),
        powerReading: getElement(
            "#experiment-power-reading"
        ),
        timeReading: getElement(
            "#experiment-time-reading"
        ),
        temperatureReading: getElement(
            "#experiment-temperature-reading"
        ),

        intervalLabel: getElement(
            "#experiment-interval-label"
        ),
        intervalTrack: getElement(
            "#experiment-interval-track"
        ),
        intervalBar: getElement(
            "#experiment-interval-bar"
        ),

        completion: getElement(
            "#experiment-completion"
        ),
        resetButton: getElement(
            "#experiment-reset-button"
        )
    };

    const missingElement =
        Object.entries(elements).find(
            ([, element]) => !element
        );

    if (missingElement) {
        console.warn(
            `Не знайдено елемент модуля дослідів: ${missingElement[0]}.`
        );

        return;
    }

    section.dataset.initialized = "true";

    const standStorage = createStorage(
        `${namespace}:stand`
    );
    const experimentStorage = createStorage(
        `${namespace}:experiment`
    );

    let state = normalizeState(
        experimentStorage.get(
            "progress",
            null
        )
    );

    let operationInProgress = false;

    function isStandReady() {
        const standProgress =
            standStorage.get(
                "progress",
                {}
            );

        return standProgress.ready === true;
    }

    function updateAccess() {
        const accessGranted =
            isStandReady();

        elements.lockOverlay.hidden =
            accessGranted;
        elements.interactiveArea.inert =
            !accessGranted;

        section.classList.toggle(
            "experiment-access-granted",
            accessGranted
        );
    }

    function saveState() {
        experimentStorage.set(
            "progress",
            state
        );
    }

    function dispatchProgressEvent() {
        document.dispatchEvent(
            new CustomEvent(
                "laboratory:experiment-progress",
                {
                    detail: {
                        namespace,
                        completedOperations:
                            state.experimentOne.records.length +
                            state.experimentTwo.records.length,
                        totalOperations:
                            TOTAL_OPERATIONS
                    }
                }
            )
        );
    }

    function setMessage(
        element,
        message,
        type = "neutral"
    ) {
        element.textContent = message;

        if (type === "neutral") {
            delete element.dataset.type;
        } else {
            element.dataset.type = type;
        }
    }

    function setIntervalProgress(
        percentage,
        label
    ) {
        const normalizedPercentage =
            clamp(
                percentage,
                0,
                100
            );

        elements.intervalBar.style.width =
            `${normalizedPercentage}%`;

        elements.intervalTrack.setAttribute(
            "aria-valuenow",
            String(
                Math.round(
                    normalizedPercentage
                )
            )
        );

        elements.intervalLabel.textContent =
            label;
    }

    function setInstallationState({
        active = false,
        cooling = false,
        mode = "OFF",
        setting = "Установка знеструмлена"
    } = {}) {
        elements.powerState.textContent =
            active
                ? "Увімкнена"
                : "Знеструмлена";

        elements.powerState.classList.toggle(
            "is-on",
            active
        );

        elements.plateVisual.classList.toggle(
            "is-active",
            active || cooling
        );

        elements.plateVisual.classList.toggle(
            "is-heating",
            active
        );

        elements.potVisual.classList.toggle(
            "is-heating",
            active
        );

        elements.heatingIndicator.classList.toggle(
            "is-on",
            active
        );

        elements.intervalTrack.classList.toggle(
            "is-cooling",
            cooling
        );

        elements.displayMode.textContent =
            mode;
        elements.displaySetting.textContent =
            setting;
    }

    function updateInstrumentReadings({
        voltage = 0,
        current = 0,
        power = 0,
        elapsedTime = 0,
        temperature = state.setup.initialTemperature
    } = {}) {
        elements.voltageReading.textContent =
            formatNumber(
                voltage,
                voltage === 0 ? 0 : 1
            );

        elements.currentReading.textContent =
            formatNumber(
                current,
                1
            );

        elements.powerReading.textContent =
            formatNumber(
                power,
                2
            );

        elements.timeReading.textContent =
            formatNumber(
                elapsedTime,
                2
            );

        elements.temperatureReading.textContent =
            formatNumber(
                temperature,
                1
            );
    }

    function resetVisualState() {
        const lastFirstRecord =
            state.experimentOne.records.at(-1);

        const temperature =
            lastFirstRecord?.finalTemperature ??
            state.setup.initialTemperature;

        elements.sourceReading.textContent =
            "220 В";
        elements.latrReading.textContent =
            "0 В";

        elements.currentCondition.textContent =
            state.completed
                ? "Усі досліди завершено"
                : "Плита підготовлена до роботи";

        elements.modeBadge.textContent =
            state.completed
                ? "Завершено"
                : "Очікування";

        setInstallationState();

        updateInstrumentReadings({
            temperature
        });

        setIntervalProgress(
            0,
            "Очікування"
        );
    }

    function renderExperimentOneTable() {
        const records =
            state.experimentOne.records;

        elements.experimentOneTableBody.innerHTML =
            THERMOSTAT_CYCLES.map(
                (cycle, index) => {
                    const record =
                        records[index];

                    return `
                        <tr class="${record
                            ? "is-completed"
                            : index === records.length &&
                                !state.experimentOne.completed
                                ? "is-active"
                                : ""
                        }">
                            <th scope="row">
                                ${index + 1}
                            </th>

                            <td>
                                ${record
                            ? formatTableValue(
                                record.voltage,
                                1
                            )
                            : "—"
                        }
                            </td>

                            <td>
                                ${record
                            ? formatTableValue(
                                record.current,
                                1
                            )
                            : "—"
                        }
                            </td>

                            <td>
                                ${record
                            ? formatTableValue(
                                record.power,
                                2
                            )
                            : "—"
                        }
                            </td>

                            <td>
                                ${record
                            ? formatTableValue(
                                record.onTime,
                                2
                            )
                            : "—"
                        }
                            </td>

                            <td>
                                ${record
                            ? formatTableValue(
                                record.offTime,
                                2
                            )
                            : "—"
                        }
                            </td>

                            <td>
                                <span class="record-status">
                                    ${record
                            ? "Записано"
                            : index === records.length &&
                                !state.experimentOne.completed
                                ? "Наступний цикл"
                                : "Очікується"
                        }
                                </span>
                            </td>
                        </tr>
                    `;
                }
            ).join("");
    }

    function renderExperimentTwoTable() {
        const records =
            state.experimentTwo.records;

        elements.experimentTwoTableBody.innerHTML =
            PARAMETER_TRIALS.map(
                (trial, index) => {
                    const record =
                        records[index];

                    return `
                        <tr class="${record
                            ? "is-completed"
                            : index === records.length &&
                                state.experimentOne.completed &&
                                !state.experimentTwo.completed
                                ? "is-active"
                                : ""
                        }">
                            <th scope="row">
                                ${index + 1}
                            </th>

                            <td>
                                ${trial.setTemperature}
                            </td>

                            <td>
                                ${trial.setVoltage}
                            </td>

                            <td>
                                ${record
                            ? formatTableValue(
                                record.voltage,
                                1
                            )
                            : "—"
                        }
                            </td>

                            <td>
                                ${record
                            ? formatTableValue(
                                record.initialTemperature,
                                1
                            )
                            : "—"
                        }
                            </td>

                            <td>
                                ${record
                            ? formatTableValue(
                                record.current,
                                1
                            )
                            : "—"
                        }
                            </td>

                            <td>
                                ${record
                            ? formatTableValue(
                                record.power,
                                2
                            )
                            : "—"
                        }
                            </td>

                            <td>
                                ${record
                            ? formatTableValue(
                                record.boilingTime,
                                2
                            )
                            : "—"
                        }
                            </td>

                            <td>
                                <span class="record-status">
                                    ${record
                            ? "Записано"
                            : index === records.length &&
                                state.experimentOne.completed &&
                                !state.experimentTwo.completed
                                ? "Наступний режим"
                                : "Очікується"
                        }
                                </span>
                            </td>
                        </tr>
                    `;
                }
            ).join("");
    }

    function renderExperimentOneSummary() {
        const completedCount =
            state.experimentOne.records.length;

        elements.experimentOneStatus.textContent =
            `${completedCount} із ${THERMOSTAT_CYCLES.length} циклів`;

        if (state.experimentOne.completed) {
            elements.experimentOneSummary.innerHTML = `
                <strong>
                    Температуру кипіння досягнуто
                </strong>

                <p>
                    Зафіксовано ${completedCount} циклів.
                    Дані напруги, струму, активної потужності
                    та тривалості інтервалів готові
                    до розрахунку спожитої енергії.
                </p>
            `;

            elements.experimentOneSummary.dataset.type =
                "success";

            return;
        }

        delete elements.experimentOneSummary.dataset.type;

        if (!state.setup.confirmed) {
            elements.experimentOneSummary.innerHTML = `
                <strong>
                    Дослід ще не розпочато
                </strong>

                <p>
                    Зафіксуйте масу води та її початкову
                    температуру.
                </p>
            `;

            return;
        }

        elements.experimentOneSummary.innerHTML = `
            <strong>
                Виконано циклів: ${completedCount}
            </strong>

            <p>
                Наступний цикл буде записано після завершення
                увімкненого та вимкненого інтервалів.
            </p>
        `;
    }

    function renderExperimentTwoSummary() {
        const completedCount =
            state.experimentTwo.records.length;

        elements.experimentTwoStatus.textContent =
            `${completedCount} із ${PARAMETER_TRIALS.length} режимів`;

        if (state.experimentTwo.completed) {
            elements.experimentTwoSummary.innerHTML = `
                <strong>
                    Усі дев’ять режимів виконано
                </strong>

                <p>
                    Дані для побудови залежностей
                    P = f(U) і t<sub>кип</sub> = f(U)
                    підготовлено.
                </p>
            `;

            elements.experimentTwoSummary.dataset.type =
                "success";

            return;
        }

        delete elements.experimentTwoSummary.dataset.type;

        if (!state.experimentOne.completed) {
            elements.experimentTwoSummary.innerHTML = `
                <strong>
                    Дослід ще не розпочато
                </strong>

                <p>
                    Спочатку завершіть циклічний режим
                    «Термостат».
                </p>
            `;

            return;
        }

        elements.experimentTwoSummary.innerHTML = `
            <strong>
                Виконано режимів: ${completedCount}
            </strong>

            <p>
                Наступна комбінація буде виконана
                відповідно до таблиці 8.4.
            </p>
        `;
    }

    function renderControls() {
        const firstCompleted =
            state.experimentOne.completed;
        const secondCompleted =
            state.experimentTwo.completed;

        const firstCount =
            state.experimentOne.records.length;
        const secondCount =
            state.experimentTwo.records.length;

        const completedOperations =
            firstCount + secondCount;

        elements.progressValue.textContent =
            `${completedOperations} із ${TOTAL_OPERATIONS} операцій`;

        elements.waterVolumeInput.value =
            state.setup.waterVolume;
        elements.waterMassInput.value =
            state.setup.waterMass.toFixed(3);
        elements.initialTemperatureInput.value =
            state.setup.initialTemperature.toFixed(1);

        elements.waterVolumeInput.disabled =
            state.setup.confirmed ||
            operationInProgress;

        elements.waterMassInput.disabled =
            state.setup.confirmed ||
            operationInProgress;

        elements.initialTemperatureInput.disabled =
            state.setup.confirmed ||
            operationInProgress;

        elements.setupButton.disabled =
            state.setup.confirmed ||
            operationInProgress;

        elements.setupButton.textContent =
            state.setup.confirmed
                ? "Вихідні дані зафіксовано"
                : "Зафіксувати вихідні дані";

        elements.cycleButton.disabled =
            !state.setup.confirmed ||
            firstCompleted ||
            operationInProgress;

        elements.cycleButton.textContent =
            firstCompleted
                ? "Дослід 1 завершено"
                : `Запустити цикл ${firstCount + 1}`;

        if (!state.setup.confirmed) {
            elements.experimentOneTask.textContent =
                "Зафіксуйте вихідні параметри води";

            elements.experimentOneDescription.textContent =
                "Після підтвердження параметрів стане доступним запуск першого циклу.";
        } else if (!firstCompleted) {
            elements.experimentOneTask.textContent =
                `Виконайте цикл ${firstCount + 1}`;

            elements.experimentOneDescription.textContent =
                "Запустіть цикл і дочекайтеся завершення увімкненого та вимкненого інтервалів.";
        } else {
            elements.experimentOneTask.textContent =
                "Дослід 1 завершено";

            elements.experimentOneDescription.textContent =
                "Температуру кипіння досягнуто. Можна переходити до другого досліду.";
        }

        elements.experimentTwoLock.hidden =
            firstCompleted;

        elements.experimentTwoContent.inert =
            !firstCompleted;

        elements.trialButton.disabled =
            !firstCompleted ||
            secondCompleted ||
            operationInProgress;

        elements.trialButton.textContent =
            secondCompleted
                ? "Дослід 2 завершено"
                : `Виконати режим ${secondCount + 1}`;

        if (!firstCompleted) {
            elements.experimentTwoTask.textContent =
                "Дослід 2 ще не доступний";

            elements.experimentTwoDescription.textContent =
                "Спочатку завершіть усі цикли першого досліду.";
        } else if (!secondCompleted) {
            const nextTrial =
                PARAMETER_TRIALS[secondCount];

            elements.experimentTwoTask.textContent =
                `${nextTrial.setTemperature} °C, ${nextTrial.setVoltage} В`;

            elements.experimentTwoDescription.textContent =
                "Установіть задану температуру і напругу, після чого виконайте нагрівання води до кипіння.";
        } else {
            elements.experimentTwoTask.textContent =
                "Дослід 2 завершено";

            elements.experimentTwoDescription.textContent =
                "Усі дев’ять комбінацій температури та напруги досліджено.";
        }

        if (state.completed) {
            elements.phaseLabel.textContent =
                "Досліди завершено";
        } else if (firstCompleted) {
            elements.phaseLabel.textContent =
                "Дослід 2. Вплив заданих параметрів";
        } else if (state.setup.confirmed) {
            elements.phaseLabel.textContent =
                "Дослід 1. Циклічний режим";
        } else {
            elements.phaseLabel.textContent =
                "Підготовка вихідних даних";
        }

        elements.completion.hidden =
            !state.completed;

        section.classList.toggle(
            "is-completed",
            state.completed
        );

        elements.resetButton.disabled =
            operationInProgress;
    }

    function render() {
        renderExperimentOneTable();
        renderExperimentTwoTable();
        renderExperimentOneSummary();
        renderExperimentTwoSummary();
        renderControls();

        if (!operationInProgress) {
            resetVisualState();
        }
    }

    function animateInterval({
        laboratoryDuration,
        animationDuration,
        startTemperature,
        endTemperature,
        label
    }) {
        return new Promise((resolve) => {
            const effectiveDuration =
                prefersReducedMotion()
                    ? SIMULATION_TIMING.reducedMotionDuration
                    : animationDuration;

            const startTime =
                performance.now();

            function frame(currentTime) {
                const elapsed =
                    currentTime - startTime;

                const progress =
                    clamp(
                        elapsed / effectiveDuration,
                        0,
                        1
                    );

                const laboratoryElapsed =
                    laboratoryDuration *
                    progress;

                const temperature =
                    startTemperature +
                    (
                        endTemperature -
                        startTemperature
                    ) *
                    progress;

                elements.timeReading.textContent =
                    formatNumber(
                        laboratoryElapsed,
                        2
                    );

                elements.temperatureReading.textContent =
                    formatNumber(
                        temperature,
                        1
                    );

                setIntervalProgress(
                    progress * 100,
                    label
                );

                if (progress < 1) {
                    requestAnimationFrame(frame);
                } else {
                    resolve();
                }
            }

            requestAnimationFrame(frame);
        });
    }

    async function runThermostatCycle() {
        if (
            operationInProgress ||
            !state.setup.confirmed ||
            state.experimentOne.completed
        ) {
            return;
        }

        const cycleIndex =
            state.experimentOne.records.length;
        const cycle =
            THERMOSTAT_CYCLES[cycleIndex];

        if (!cycle) {
            return;
        }

        operationInProgress = true;
        renderControls();

        const previousRecord =
            state.experimentOne.records.at(-1);

        const startTemperature =
            previousRecord?.finalTemperature ??
            state.setup.initialTemperature;

        const heatingEndTemperature =
            startTemperature +
            (
                cycle.finalTemperature -
                startTemperature
            ) *
            0.88;

        elements.currentCondition.textContent =
            `Режим «Термостат», цикл ${cycleIndex + 1}`;

        elements.modeBadge.textContent =
            "Термостат";

        elements.sourceReading.textContent =
            "220 В";

        elements.latrReading.textContent =
            `${formatNumber(cycle.voltage, 1)} В`;

        setMessage(
            elements.experimentOneMessage,
            `Цикл ${cycleIndex + 1}: конфорка увімкнена.`,
            "warning"
        );

        setInstallationState({
            active: true,
            mode: "HEAT",
            setting: `Цикл ${cycleIndex + 1}: нагрівання`
        });

        updateInstrumentReadings({
            voltage: cycle.voltage,
            current: cycle.current,
            power: cycle.power,
            elapsedTime: 0,
            temperature: startTemperature
        });

        await animateInterval({
            laboratoryDuration:
                cycle.onTime,

            animationDuration:
                Math.max(
                    SIMULATION_TIMING
                        .thermostatMinimumInterval,

                    cycle.onTime *
                    SIMULATION_TIMING
                        .thermostatMillisecondsPerSecond
                ),

            startTemperature,

            endTemperature:
                heatingEndTemperature,

            label: "Увімкнений стан"
        });

        await wait(
            SIMULATION_TIMING.measurementPause
        );

        setMessage(
            elements.experimentOneMessage,
            `Цикл ${cycleIndex + 1}: конфорка вимкнена, триває інтервал термостата.`,
            "warning"
        );

        setInstallationState({
            cooling: true,
            mode: "PAUSE",
            setting: `Цикл ${cycleIndex + 1}: вимкнений інтервал`
        });

        updateInstrumentReadings({
            voltage: cycle.voltage,
            current: 0,
            power: 0,
            elapsedTime: 0,
            temperature:
                heatingEndTemperature
        });

        await animateInterval({
            laboratoryDuration:
                cycle.offTime,

            animationDuration:
                Math.max(
                    SIMULATION_TIMING
                        .thermostatMinimumInterval,

                    cycle.offTime *
                    SIMULATION_TIMING
                        .thermostatMillisecondsPerSecond
                ),

            startTemperature:
                heatingEndTemperature,

            endTemperature:
                cycle.finalTemperature,

            label: "Вимкнений стан"
        });

        await wait(
            SIMULATION_TIMING.measurementPause
        );

        state.experimentOne.records.push({
            cycle: cycleIndex + 1,
            voltage: cycle.voltage,
            current: cycle.current,
            power: cycle.power,
            onTime: cycle.onTime,
            offTime: cycle.offTime,
            finalTemperature:
                cycle.finalTemperature
        });

        state.experimentOne.completed =
            state.experimentOne.records.length ===
            THERMOSTAT_CYCLES.length;

        if (state.experimentOne.completed) {
            setMessage(
                elements.experimentOneMessage,
                "Дослід 1 завершено. Вода досягла температури кипіння.",
                "success"
            );
        } else {
            setMessage(
                elements.experimentOneMessage,
                `Цикл ${cycleIndex + 1} записано. Підготуйте цикл ${cycleIndex + 2}.`,
                "success"
            );
        }

        operationInProgress = false;

        saveState();
        dispatchProgressEvent();
        render();
    }

    async function runParameterTrial() {
        if (
            operationInProgress ||
            !state.experimentOne.completed ||
            state.experimentTwo.completed
        ) {
            return;
        }

        const trialIndex =
            state.experimentTwo.records.length;
        const trial =
            PARAMETER_TRIALS[trialIndex];

        if (!trial) {
            return;
        }

        operationInProgress = true;
        renderControls();

        elements.currentCondition.textContent =
            `${trial.setTemperature} °C, ${trial.setVoltage} В`;

        elements.modeBadge.textContent =
            `${trial.setTemperature} °C`;

        elements.sourceReading.textContent =
            "220 В";

        elements.latrReading.textContent =
            `${trial.setVoltage} В`;

        setMessage(
            elements.experimentTwoMessage,
            `Режим ${trialIndex + 1}: виконується нагрівання води до кипіння.`,
            "warning"
        );

        setInstallationState({
            active: true,
            mode: String(
                trial.setTemperature
            ),
            setting:
                `Задано ${trial.setTemperature} °C і ${trial.setVoltage} В`
        });

        updateInstrumentReadings({
            voltage: trial.voltage,
            current: trial.current,
            power: trial.power,
            elapsedTime: 0,
            temperature:
                trial.initialTemperature
        });

        await animateInterval({
            laboratoryDuration:
                trial.boilingTime * 60,

            animationDuration:
                SIMULATION_TIMING
                    .parameterTrialDuration,

            startTemperature:
                trial.initialTemperature,

            endTemperature: 100,

            label: "Нагрівання до кипіння"
        });

        await wait(
            SIMULATION_TIMING.measurementPause
        );

        state.experimentTwo.records.push({
            trial: trialIndex + 1,
            setTemperature:
                trial.setTemperature,
            setVoltage:
                trial.setVoltage,
            voltage:
                trial.voltage,
            initialTemperature:
                trial.initialTemperature,
            current:
                trial.current,
            power:
                trial.power,
            boilingTime:
                trial.boilingTime
        });

        state.experimentTwo.completed =
            state.experimentTwo.records.length ===
            PARAMETER_TRIALS.length;

        state.completed =
            state.experimentOne.completed &&
            state.experimentTwo.completed;

        setInstallationState({
            mode: "OFF",
            setting:
                "Нагрівання завершено"
        });

        if (state.experimentTwo.completed) {
            setMessage(
                elements.experimentTwoMessage,
                "Дослід 2 завершено. Усі результати готові до аналізу.",
                "success"
            );
        } else {
            setMessage(
                elements.experimentTwoMessage,
                `Режим ${trialIndex + 1} записано. Підготуйте наступну комбінацію.`,
                "success"
            );
        }

        operationInProgress = false;

        saveState();
        dispatchProgressEvent();
        render();

        if (state.completed) {
            document.dispatchEvent(
                new CustomEvent(
                    "laboratory:experiment-completed",
                    {
                        detail: {
                            namespace,
                            state
                        }
                    }
                )
            );
        }
    }

    elements.setupButton.addEventListener(
        "click",
        () => {
            if (
                operationInProgress ||
                state.setup.confirmed
            ) {
                return;
            }

            const waterVolume = Number(
                elements.waterVolumeInput.value
            );
            const waterMass = Number(
                elements.waterMassInput.value
            );
            const initialTemperature = Number(
                elements.initialTemperatureInput.value
            );

            const isValid =
                Number.isFinite(waterVolume) &&
                waterVolume >= 100 &&
                waterVolume <= 1000 &&
                Number.isFinite(waterMass) &&
                waterMass >= 0.1 &&
                waterMass <= 1 &&
                Number.isFinite(initialTemperature) &&
                initialTemperature >= 5 &&
                initialTemperature <= 40;

            if (!isValid) {
                setMessage(
                    elements.experimentOneMessage,
                    "Перевірте введені параметри: об’єм 100-1000 мл, маса 0,1-1 кг, температура 5-40 °C.",
                    "warning"
                );

                return;
            }

            state.setup = {
                confirmed: true,
                waterVolume,
                waterMass,
                initialTemperature
            };

            saveState();

            setMessage(
                elements.experimentOneMessage,
                "Вихідні параметри зафіксовано. Можна запускати перший цикл.",
                "success"
            );

            render();
        }
    );

    elements.cycleButton.addEventListener(
        "click",
        runThermostatCycle
    );

    elements.trialButton.addEventListener(
        "click",
        runParameterTrial
    );

    elements.resetButton.addEventListener(
        "click",
        () => {
            if (operationInProgress) {
                return;
            }

            const confirmed = window.confirm(
                "Очистити всі результати обох дослідів?"
            );

            if (!confirmed) {
                return;
            }

            state = createInitialState();

            saveState();
            render();

            setMessage(
                elements.experimentOneMessage,
                "Результати очищено. Зафіксуйте вихідні параметри води."
            );

            setMessage(
                elements.experimentTwoMessage,
                "Очікується завершення досліду 1."
            );

            document.dispatchEvent(
                new CustomEvent(
                    "laboratory:experiment-reset",
                    {
                        detail: {
                            namespace
                        }
                    }
                )
            );
        }
    );

    document.addEventListener(
        "laboratory:stand-ready",
        updateAccess
    );

    document.addEventListener(
        "laboratory:stand-reset",
        updateAccess
    );

    updateAccess();
    render();
}