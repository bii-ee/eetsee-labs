import {
    LAB05_EXPERIMENT_CONDITIONS,
    LAB05_EXPERIMENT_RUNS,
    LAB05_EXPERIMENT_STORAGE_KEY,
    LAB05_TOTAL_EXPERIMENTS,
    LAB05_VOLTAGE_LEVELS,
    getExperiment,
    getHeater,
    isExperimentConfigured
} from "./data.js";

import {
    calculateExperimentResult,
    calculateTemperatureAtTime,
    formatNumber,
    formatStopwatch,
    secondsToMinutes
} from "./model.js";

import {
    createStorage
} from "../../common/js/storage.js";

const ANIMATION_DURATION_MS = 9000;
const VOLTAGE_TOLERANCE = 1;

function isFiniteNumber(
    value
) {
    return Number.isFinite(
        Number(value)
    );
}

function normalizeStoredProgress(
    value
) {
    const normalized = {
        selectedHeaterId:
            value?.selectedHeaterId ===
                "heater-2"
                ? "heater-2"
                : "heater-1",

        selectedVoltage:
            LAB05_VOLTAGE_LEVELS.includes(
                Number(
                    value?.selectedVoltage
                )
            )
                ? Number(
                    value.selectedVoltage
                )
                : LAB05_VOLTAGE_LEVELS[0],

        records:
            {}
    };

    LAB05_EXPERIMENT_RUNS.forEach(
        (experiment) => {
            const sourceRecord =
                value?.records?.[
                    experiment.id
                ];

            if (
                !sourceRecord ||
                sourceRecord.completed !== true
            ) {
                return;
            }

            const requiredValues = [
                sourceRecord.actualVoltageV,
                sourceRecord.currentA,
                sourceRecord.activePowerW,
                sourceRecord.initialTemperatureC,
                sourceRecord.boilingTemperatureC,
                sourceRecord.boilingTimeSeconds,
                sourceRecord.boilingTimeMinutes,
                sourceRecord.electricalEnergyWh
            ];

            if (
                !requiredValues.every(
                    isFiniteNumber
                )
            ) {
                return;
            }

            normalized.records[
                experiment.id
            ] = {
                experimentId:
                    experiment.id,

                heaterId:
                    experiment.heaterId,

                heaterNumber:
                    experiment.heaterNumber,

                targetVoltageV:
                    Number(
                        experiment.targetVoltageV
                    ),

                actualVoltageV:
                    Number(
                        sourceRecord.actualVoltageV
                    ),

                currentA:
                    Number(
                        sourceRecord.currentA
                    ),

                activePowerW:
                    Number(
                        sourceRecord.activePowerW
                    ),

                initialTemperatureC:
                    Number(
                        sourceRecord.initialTemperatureC
                    ),

                boilingTemperatureC:
                    Number(
                        sourceRecord.boilingTemperatureC
                    ),

                boilingTimeSeconds:
                    Number(
                        sourceRecord.boilingTimeSeconds
                    ),

                boilingTimeMinutes:
                    Number(
                        sourceRecord.boilingTimeMinutes
                    ),

                electricalEnergyWh:
                    Number(
                        sourceRecord.electricalEnergyWh
                    ),

                completed:
                    true
            };
        }
    );

    return normalized;
}

export function initializeExperiment({
    namespace = "lab05"
} = {}) {
    const section =
        document.querySelector(
            "#experiment"
        );

    if (
        !section ||
        section.dataset.initialized ===
            "true"
    ) {
        return;
    }

    const find = (
        selector
    ) =>
        section.querySelector(
            selector
        );

    const findAll = (
        selector
    ) =>
        Array.from(
            section.querySelectorAll(
                selector
            )
        );

    const elements = {
        lockOverlay:
            find(
                "#experiment-lock-overlay"
            ),

        interactiveArea:
            find(
                "#experiment-interactive-area"
            ),

        powerState:
            find(
                "#experiment-power-state"
            ),

        phaseLabel:
            find(
                "#experiment-phase-label"
            ),

        powerButton:
            find(
                "#experiment-power-button"
            ),

        heaterButtons:
            findAll(
                ".experiment-heater-button"
            ),

        voltageButtons:
            findAll(
                ".experiment-voltage-button"
            ),

        waterVolume:
            find(
                "#experiment-water-volume"
            ),

        initialTemperature:
            find(
                "#experiment-initial-temperature"
            ),

        boilingTemperature:
            find(
                "#experiment-boiling-temperature"
            ),

        taskTitle:
            find(
                "#experiment-task-title"
            ),

        taskDescription:
            find(
                "#experiment-task-description"
            ),

        actionButton:
            find(
                "#experiment-action-button"
            ),

        message:
            find(
                "#experiment-message"
            ),

        currentRun:
            find(
                "#experiment-current-run"
            ),

        targetVoltageLabel:
            find(
                "#experiment-target-voltage-label"
            ),

        switchState:
            find(
                "#experiment-switch-state"
            ),

        latrControl:
            find(
                "#experiment-latr-control"
            ),

        latrOutput:
            find(
                "#experiment-latr-output"
            ),

        voltageReading:
            find(
                "#experiment-voltage-reading"
            ),

        currentReading:
            find(
                "#experiment-current-reading"
            ),

        powerReading:
            find(
                "#experiment-power-reading"
            ),

        heatingSystem:
            find(
                ".experiment-heating-system"
            ),

        activeHeaterLabel:
            find(
                "#experiment-active-heater-label"
            ),

        activeHeaterDescription:
            find(
                "#experiment-active-heater-description"
            ),

        temperatureReading:
            find(
                "#experiment-temperature-reading"
            ),

        stopwatchReading:
            find(
                "#experiment-stopwatch-reading"
            ),

        stopwatchNote:
            find(
                "#experiment-stopwatch-note"
            ),

        progressLabel:
            find(
                "#experiment-progress-label"
            ),

        progressTrack:
            find(
                ".experiment-heating-track"
            ),

        progressBar:
            find(
                "#experiment-heating-bar"
            ),

        chartStatus:
            find(
                "#experiment-chart-status"
            ),

        chartMinimum:
            find(
                "#experiment-chart-y-min"
            ),

        chartMaximum:
            find(
                "#experiment-chart-y-max"
            ),

        chartTimeMaximum:
            find(
                "#experiment-chart-x-max"
            ),

        temperatureLine:
            find(
                "#experiment-temperature-line"
            ),

        temperaturePoint:
            find(
                "#experiment-temperature-point"
            ),

        tableBody:
            find(
                "#experiment-table-body"
            ),

        progressValue:
            find(
                "#experiment-progress-value"
            ),

        resetButton:
            find(
                "#experiment-reset-button"
            )
    };

    const requiredSingleElements =
        Object.entries(
            elements
        ).filter(
            ([key]) =>
                ![
                    "heaterButtons",
                    "voltageButtons"
                ].includes(key)
        );

    const missingElement =
        requiredSingleElements.some(
            ([, element]) =>
                !element
        );

    if (
        missingElement ||
        elements.heaterButtons.length !==
            2 ||
        elements.voltageButtons.length !==
            3
    ) {
        console.warn(
            "Не знайдено елементи експериментального модуля ЛР5."
        );

        return;
    }

    section.dataset.initialized =
        "true";

    const standStorage =
        createStorage(
            `${namespace}:stand`
        );

    const experimentStorage =
        createStorage(
            LAB05_EXPERIMENT_STORAGE_KEY
        );

    const storedProgress =
        normalizeStoredProgress(
            experimentStorage.get(
                "progress",
                {}
            )
        );

    const state = {
        selectedHeaterId:
            storedProgress
                .selectedHeaterId,

        selectedVoltage:
            storedProgress
                .selectedVoltage,

        records:
            storedProgress.records,

        phase:
            "selection",

        isPowered:
            false,

        latrValue:
            0,

        capturedVoltage:
            null,

        capturedCurrent:
            null,

        capturedPower:
            null,

        currentTemperature:
            LAB05_EXPERIMENT_CONDITIONS
                .referenceInitialTemperatureC,

        elapsedSeconds:
            0,

        progress:
            0,

        animationFrame:
            null
    };

    function getCurrentExperiment() {
        return getExperiment(
            state.selectedHeaterId,
            state.selectedVoltage
        );
    }

    function getCurrentHeater() {
        return getHeater(
            state.selectedHeaterId
        );
    }

    function getCompletedCount() {
        return Object.values(
            state.records
        ).filter(
            (record) =>
                record?.completed === true
        ).length;
    }

    function isExperimentCompleted(
        experiment
    ) {
        return Boolean(
            experiment &&
            state.records[
                experiment.id
            ]?.completed === true
        );
    }

    function isHeaterCompleted(
        heaterId
    ) {
        return LAB05_VOLTAGE_LEVELS.every(
            (voltage) => {
                const experiment =
                    getExperiment(
                        heaterId,
                        voltage
                    );

                return isExperimentCompleted(
                    experiment
                );
            }
        );
    }

    function isStandReady() {
        return (
            standStorage.get(
                "progress",
                {}
            ).ready === true
        );
    }

    function saveProgress() {
        experimentStorage.set(
            "progress",
            {
                selectedHeaterId:
                    state.selectedHeaterId,

                selectedVoltage:
                    state.selectedVoltage,

                records:
                    state.records
            }
        );
    }

    function setMessage(
        text,
        type = "default"
    ) {
        elements.message.textContent =
            text;

        elements.message.dataset.type =
            type;
    }

    function cancelAnimation() {
        if (
            state.animationFrame !==
            null
        ) {
            window.cancelAnimationFrame(
                state.animationFrame
            );

            state.animationFrame =
                null;
        }
    }

    function resetLiveValues() {
        cancelAnimation();

        const experiment =
            getCurrentExperiment();

        state.isPowered =
            false;

        state.latrValue =
            0;

        state.capturedVoltage =
            null;

        state.capturedCurrent =
            null;

        state.capturedPower =
            null;

        state.elapsedSeconds =
            0;

        state.progress =
            0;

        state.currentTemperature =
            experiment?.conditions
                ?.initialTemperatureC ??
            LAB05_EXPERIMENT_CONDITIONS
                .referenceInitialTemperatureC;
    }

    function findNextIncompleteExperiment() {
        return (
            LAB05_EXPERIMENT_RUNS.find(
                (experiment) =>
                    !isExperimentCompleted(
                        experiment
                    )
            ) ??
            null
        );
    }

    function resolveInitialState() {
        if (
            getCompletedCount() ===
            LAB05_TOTAL_EXPERIMENTS
        ) {
            state.phase =
                "all-complete";

            return;
        }

        const currentExperiment =
            getCurrentExperiment();

        if (
            isExperimentCompleted(
                currentExperiment
            )
        ) {
            const nextExperiment =
                findNextIncompleteExperiment();

            if (nextExperiment) {
                state.selectedHeaterId =
                    nextExperiment.heaterId;

                state.selectedVoltage =
                    nextExperiment
                        .targetVoltageV;
            }
        }

        state.phase =
            "selection";

        resetLiveValues();
    }

    function updateAccess(
        event
    ) {
        if (
            event?.detail?.namespace &&
            event.detail.namespace !==
                namespace
        ) {
            return;
        }

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

        if (
            !accessGranted &&
            state.isPowered
        ) {
            resetLiveValues();

            state.phase =
                "selection";

            renderAll();
        }
    }

    function getPhaseLabel() {
        const labels = {
            selection:
                "Вибір параметрів досліду",

            prepared:
                "Підготовка установки",

            adjustment:
                "Установлення напруги",

            "ready-heating":
                "Готовність до нагрівання",

            heating:
                "Нагрівання води",

            boiling:
                "Температуру кипіння досягнуто",

            "all-complete":
                "Усі досліди завершено"
        };

        return (
            labels[state.phase] ??
            "Підготовка"
        );
    }

    function renderSelectionButtons() {
        const selectionLocked =
            state.isPowered ||
            state.phase === "heating";

        elements.heaterButtons.forEach(
            (button) => {
                const heaterId =
                    button.dataset.heaterId;

                const selected =
                    heaterId ===
                    state.selectedHeaterId;

                button.classList.toggle(
                    "is-selected",
                    selected
                );

                button.classList.toggle(
                    "is-completed",
                    isHeaterCompleted(
                        heaterId
                    )
                );

                button.setAttribute(
                    "aria-pressed",
                    String(selected)
                );

                button.disabled =
                    selectionLocked;
            }
        );

        elements.voltageButtons.forEach(
            (button) => {
                const voltage =
                    Number(
                        button.dataset.voltage
                    );

                const experiment =
                    getExperiment(
                        state.selectedHeaterId,
                        voltage
                    );

                const selected =
                    voltage ===
                    state.selectedVoltage;

                button.classList.toggle(
                    "is-selected",
                    selected
                );

                button.classList.toggle(
                    "is-completed",
                    isExperimentCompleted(
                        experiment
                    )
                );

                button.setAttribute(
                    "aria-pressed",
                    String(selected)
                );

                button.disabled =
                    selectionLocked;
            }
        );
    }

    function renderConditions() {
        const experiment =
            getCurrentExperiment();

        const waterVolume =
            experiment?.conditions
                ?.waterVolumeLiters;

        const initialTemperature =
            experiment?.conditions
                ?.initialTemperatureC ??
            LAB05_EXPERIMENT_CONDITIONS
                .referenceInitialTemperatureC;

        const boilingTemperature =
            experiment?.conditions
                ?.boilingTemperatureC ??
            LAB05_EXPERIMENT_CONDITIONS
                .boilingTemperatureC;

        elements.waterVolume.textContent =
            isFiniteNumber(
                waterVolume
            )
                ? `${formatNumber(
                    Number(
                        waterVolume
                    ),
                    2
                )} л`
                : "Не визначено";

        elements.initialTemperature.textContent =
            formatNumber(
                initialTemperature,
                1
            );

        elements.boilingTemperature.textContent =
            formatNumber(
                boilingTemperature,
                1
            );
    }

    function renderTask() {
        const experiment =
            getCurrentExperiment();

        const configured =
            isExperimentConfigured(
                experiment
            );

        const completed =
            isExperimentCompleted(
                experiment
            );

        let task = {
            title:
                "Підготуйте дослід",

            description:
                "Виберіть нагрівальний елемент і напругу досліду.",

            action:
                "Підготувати дослід",

            disabled:
                false
        };

        if (
            state.phase ===
            "all-complete"
        ) {
            task = {
                title:
                    "Усі шість дослідів завершено",

                description:
                    "Експериментальні дані записано. Можна переходити до розрахунків.",

                action:
                    "Досліди завершено",

                disabled:
                    true
            };
        } else if (!configured) {
            task = {
                title:
                    "Дані досліду очікують погодження",

                description:
                    "Для вибраного нагрівача і напруги ще не внесено погоджені значення U, I, P і t.",

                action:
                    "Дані не погоджено",

                disabled:
                    true
            };
        } else if (completed) {
            task = {
                title:
                    "Цей дослід уже виконано",

                description:
                    "Виберіть іншу напругу або інший нагрівальний елемент.",

                action:
                    "Дослід завершено",

                disabled:
                    true
            };
        } else if (
            state.phase ===
            "prepared"
        ) {
            task = {
                title:
                    "Увімкніть установку",

                description:
                    "Перевірте вибраний нагрівач і натисніть кнопку ввімкнення у верхній панелі.",

                action:
                    "Очікується ввімкнення",

                disabled:
                    true
            };
        } else if (
            state.phase ===
            "adjustment"
        ) {
            const voltageDifference =
                Math.abs(
                    state.latrValue -
                    state.selectedVoltage
                );

            const voltageReached =
                voltageDifference <=
                VOLTAGE_TOLERANCE;

            task = {
                title:
                    `Установіть напругу ${state.selectedVoltage} В`,

                description:
                    voltageReached
                        ? "Задану напругу встановлено. Зафіксуйте покази вимірювальних приладів."
                        : "Переміщуйте регулятор ЛАТР, доки показ вольтметра не відповідатиме заданій напрузі.",

                action:
                    voltageReached
                        ? "Зафіксувати покази приладів"
                        : `Установіть ${state.selectedVoltage} В`,

                disabled:
                    !voltageReached
            };
        } else if (
            state.phase ===
            "ready-heating"
        ) {
            task = {
                title:
                    "Розпочніть нагрівання води",

                description:
                    "Покази PV, PA і PW зафіксовано. Запустіть секундомір та нагрівання.",

                action:
                    "Розпочати нагрівання",

                disabled:
                    false
            };
        } else if (
            state.phase ===
            "heating"
        ) {
            task = {
                title:
                    "Триває нагрівання води",

                description:
                    "Слідкуйте за температурою, секундоміром і перебігом нагрівання.",

                action:
                    "Триває нагрівання",

                disabled:
                    true
            };
        } else if (
            state.phase ===
            "boiling"
        ) {
            task = {
                title:
                    "Зафіксуйте результат досліду",

                description:
                    "Температура води досягла заданого кінцевого значення. Запишіть покази до таблиці.",

                action:
                    "Записати результат",

                disabled:
                    false
            };
        }

        elements.taskTitle.textContent =
            task.title;

        elements.taskDescription.textContent =
            task.description;

        elements.actionButton.textContent =
            task.action;

        elements.actionButton.disabled =
            task.disabled;
    }

    function renderPowerState() {
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

        elements.phaseLabel.textContent =
            getPhaseLabel();

        const experiment =
            getCurrentExperiment();

        const configured =
            isExperimentConfigured(
                experiment
            );

        elements.powerButton.disabled =
            !configured ||
            !(
                state.phase ===
                    "prepared" ||
                state.isPowered
            );

        elements.switchState.textContent =
            state.isPowered
                ? "Увімкнено"
                : "Вимкнено";

        elements.switchState.classList.toggle(
            "is-on",
            state.isPowered
        );
    }

    function renderVisualHeader() {
        const heater =
            getCurrentHeater();

        elements.currentRun.textContent =
            `${heater.title}, напруга ${state.selectedVoltage} В`;

        elements.targetVoltageLabel.innerHTML =
            `U<sub>зад</sub> = ${state.selectedVoltage} В`;

        elements.activeHeaterLabel.textContent =
            heater.title;

        elements.activeHeaterDescription.textContent =
            heater.construction;
    }

    function renderLatr() {
        elements.latrControl.disabled =
            !(
                state.isPowered &&
                state.phase ===
                    "adjustment"
            );

        elements.latrControl.value =
            String(
                Math.round(
                    state.latrValue
                )
            );

        elements.latrOutput.textContent =
            `${formatNumber(
                state.latrValue,
                0
            )} В`;
    }

    function renderMeasurements() {
        const experiment =
            getCurrentExperiment();

        const initialTemperature =
            experiment?.conditions
                ?.initialTemperatureC ??
            LAB05_EXPERIMENT_CONDITIONS
                .referenceInitialTemperatureC;

        const useCapturedReadings =
            [
                "ready-heating",
                "heating",
                "boiling"
            ].includes(
                state.phase
            );

        let voltage =
            state.isPowered
                ? state.latrValue
                : 0;

        let current =
            0;

        let power =
            0;

        if (useCapturedReadings) {
            voltage =
                state.capturedVoltage;

            current =
                state.capturedCurrent;

            power =
                state.capturedPower;
        }

        elements.voltageReading.textContent =
            formatNumber(
                voltage,
                1
            );

        elements.currentReading.textContent =
            formatNumber(
                current,
                2
            );

        elements.powerReading.textContent =
            formatNumber(
                power,
                0
            );

        elements.temperatureReading.textContent =
            formatNumber(
                state.currentTemperature ??
                    initialTemperature,
                1
            );

        elements.stopwatchReading.textContent =
            formatStopwatch(
                state.elapsedSeconds
            );

        if (
            state.phase ===
            "heating"
        ) {
            elements.stopwatchNote.textContent =
                "Відлік тривалості нагрівання";
        } else if (
            state.phase ===
            "boiling"
        ) {
            elements.stopwatchNote.textContent =
                "Тривалість нагрівання зафіксовано";
        } else {
            elements.stopwatchNote.textContent =
                "Очікування початку нагрівання";
        }
    }

    function renderHeatingProgress() {
        const progressPercent =
            Math.round(
                state.progress *
                100
            );

        elements.progressBar.style.width =
            `${progressPercent}%`;

        elements.progressTrack.setAttribute(
            "aria-valuenow",
            String(
                progressPercent
            )
        );

        if (
            state.phase ===
            "heating"
        ) {
            elements.progressLabel.textContent =
                `${progressPercent}%`;
        } else if (
            state.phase ===
            "boiling"
        ) {
            elements.progressLabel.textContent =
                "Завершено";
        } else {
            elements.progressLabel.textContent =
                "Очікується";
        }

        elements.heatingSystem.classList.toggle(
            "is-heating",
            state.phase ===
                "heating"
        );

        elements.heatingSystem.classList.toggle(
            "is-boiling",
            state.phase ===
                "boiling"
        );
    }

    function renderChart() {
        const experiment =
            getCurrentExperiment();

        if (
            !experiment ||
            !isExperimentConfigured(
                experiment
            )
        ) {
            elements.temperatureLine.setAttribute(
                "points",
                ""
            );

            elements.temperaturePoint.hidden =
                true;

            elements.chartMinimum.textContent =
                formatNumber(
                    LAB05_EXPERIMENT_CONDITIONS
                        .referenceInitialTemperatureC,
                    0
                );

            elements.chartMaximum.textContent =
                formatNumber(
                    LAB05_EXPERIMENT_CONDITIONS
                        .boilingTemperatureC,
                    0
                );

            elements.chartTimeMaximum.textContent =
                "0";

            elements.chartStatus.textContent =
                "Дані досліду очікують погодження";

            return;
        }

        const initialTemperature =
            experiment.conditions
                .initialTemperatureC;

        const boilingTemperature =
            experiment.conditions
                .boilingTemperatureC;

        const totalDuration =
            experiment.measurements
                .boilingTimeSeconds;

        elements.chartMinimum.textContent =
            formatNumber(
                initialTemperature,
                0
            );

        elements.chartMaximum.textContent =
            formatNumber(
                boilingTemperature,
                0
            );

        elements.chartTimeMaximum.textContent =
            formatNumber(
                secondsToMinutes(
                    totalDuration
                ),
                1
            );

        elements.chartStatus.textContent =
            getPhaseLabel();

        const chartVisible =
            [
                "prepared",
                "adjustment",
                "ready-heating",
                "heating",
                "boiling"
            ].includes(
                state.phase
            );

        if (!chartVisible) {
            elements.temperatureLine.setAttribute(
                "points",
                ""
            );

            elements.temperaturePoint.hidden =
                true;

            return;
        }

        const sampleCount =
            Math.max(
                1,
                Math.ceil(
                    60 *
                    state.progress
                )
            );

        const points = [];

        for (
            let index = 0;
            index <= sampleCount;
            index += 1
        ) {
            const pointProgress =
                sampleCount === 0
                    ? 0
                    : state.progress *
                        (
                            index /
                            sampleCount
                        );

            const elapsedSeconds =
                totalDuration *
                pointProgress;

            const temperature =
                calculateTemperatureAtTime({
                    initialTemperatureC:
                        initialTemperature,

                    boilingTemperatureC:
                        boilingTemperature,

                    elapsedSeconds,

                    boilingTimeSeconds:
                        totalDuration
                });

            const x =
                64 +
                pointProgress *
                584;

            const y =
                198 -
                (
                    (
                        temperature -
                        initialTemperature
                    ) /
                    (
                        boilingTemperature -
                        initialTemperature
                    )
                ) *
                174;

            points.push({
                x,
                y
            });
        }

        if (
            points.length === 0
        ) {
            elements.temperatureLine.setAttribute(
                "points",
                ""
            );

            elements.temperaturePoint.hidden =
                true;

            return;
        }

        elements.temperatureLine.setAttribute(
            "points",
            points
                .map(
                    (point) =>
                        `${point.x.toFixed(1)},${point.y.toFixed(1)}`
                )
                .join(" ")
        );

        const lastPoint =
            points.at(-1);

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

    function renderTable() {
        elements.tableBody.innerHTML =
            LAB05_EXPERIMENT_RUNS.map(
                (experiment) => {
                    const record =
                        state.records[
                            experiment.id
                        ];

                    const completed =
                        record?.completed ===
                        true;

                    const active =
                        experiment.heaterId ===
                            state.selectedHeaterId &&
                        experiment.targetVoltageV ===
                            state.selectedVoltage &&
                        state.phase !==
                            "all-complete";

                    const configured =
                        isExperimentConfigured(
                            experiment
                        );

                    const rowClass =
                        completed
                            ? "is-completed"
                            : active
                                ? "is-active"
                                : configured
                                    ? ""
                                    : "is-pending";

                    const status =
                        completed
                            ? "Завершено"
                            : !configured
                                ? "Очікує даних"
                                : active
                                    ? "Вибрано"
                                    : "Очікується";

                    return `
                        <tr class="${rowClass}">
                           
                            <th scope="row">
                                <span class="experiment-heater-table-label">
                                    №${experiment.heaterNumber}
                                </span>
                            </th>
                            <td>
                                ${formatNumber(
                                    experiment.targetVoltageV,
                                    0
                                )}
                            </td>

                            <td>
                                ${
                                    completed
                                        ? formatNumber(
                                            record.actualVoltageV,
                                            1
                                        )
                                        : "–"
                                }
                            </td>

                            <td>
                                ${
                                    completed
                                        ? formatNumber(
                                            record.currentA,
                                            2
                                        )
                                        : "–"
                                }
                            </td>

                            <td>
                                ${
                                    completed
                                        ? formatNumber(
                                            record.activePowerW,
                                            0
                                        )
                                        : "–"
                                }
                            </td>

                            <td>
                                ${
                                    completed
                                        ? formatNumber(
                                            record.initialTemperatureC,
                                            1
                                        )
                                        : "–"
                                }
                            </td>

                            <td>
                                ${
                                    completed
                                        ? formatNumber(
                                            record.boilingTemperatureC,
                                            1
                                        )
                                        : "–"
                                }
                            </td>

                            <td>
                                ${
                                    completed
                                        ? formatNumber(
                                            record.boilingTimeMinutes,
                                            2
                                        )
                                        : "–"
                                }
                            </td>

                            <td>
                                <span class="record-status">
                                    ${status}
                                </span>
                            </td>
                        </tr>
                    `;
                }
            ).join("");

        const completedCount =
            getCompletedCount();

        elements.progressValue.textContent =
            `${completedCount} із ${LAB05_TOTAL_EXPERIMENTS}`;

        section.classList.toggle(
            "is-completed",
            completedCount ===
                LAB05_TOTAL_EXPERIMENTS
        );
    }

    function renderAll() {
        renderSelectionButtons();
        renderConditions();
        renderTask();
        renderPowerState();
        renderVisualHeader();
        renderLatr();
        renderMeasurements();
        renderHeatingProgress();
        renderChart();
        renderTable();
    }

    function selectHeater(
        heaterId
    ) {
        if (
            state.isPowered ||
            state.phase ===
                "heating"
        ) {
            return;
        }

        if (
            ![
                "heater-1",
                "heater-2"
            ].includes(
                heaterId
            )
        ) {
            return;
        }

        state.selectedHeaterId =
            heaterId;

        state.phase =
            "selection";

        resetLiveValues();
        saveProgress();
        renderAll();

        const experiment =
            getCurrentExperiment();

        if (
            isExperimentConfigured(
                experiment
            )
        ) {
            setMessage(
                `Вибрано ${getCurrentHeater().title}.`,
                "success"
            );
        } else {
            setMessage(
                "Для вибраного досліду експериментальні значення ще не погоджені.",
                "warning"
            );
        }
    }

    function selectVoltage(
        voltage
    ) {
        if (
            state.isPowered ||
            state.phase ===
                "heating" ||
            !LAB05_VOLTAGE_LEVELS.includes(
                voltage
            )
        ) {
            return;
        }

        state.selectedVoltage =
            voltage;

        state.phase =
            "selection";

        resetLiveValues();
        saveProgress();
        renderAll();

        const experiment =
            getCurrentExperiment();

        if (
            isExperimentConfigured(
                experiment
            )
        ) {
            setMessage(
                `Вибрано напругу ${voltage} В.`,
                "success"
            );
        } else {
            setMessage(
                `Дані досліду за напруги ${voltage} В ще не погоджені.`,
                "warning"
            );
        }
    }

    function prepareExperiment() {
        const experiment =
            getCurrentExperiment();

        if (
            !isExperimentConfigured(
                experiment
            ) ||
            isExperimentCompleted(
                experiment
            )
        ) {
            return;
        }

        resetLiveValues();

        state.phase =
            "prepared";

        renderAll();

        setMessage(
            "Установку підготовлено. Увімкніть живлення.",
            "success"
        );
    }

    function togglePower() {
        const experiment =
            getCurrentExperiment();

        if (
            !isExperimentConfigured(
                experiment
            )
        ) {
            return;
        }

        if (state.isPowered) {
            resetLiveValues();

            state.phase =
                "prepared";

            renderAll();

            setMessage(
                "Установку вимкнено. Поточний незавершений дослід скинуто.",
                "warning"
            );

            return;
        }

        if (
            state.phase !==
            "prepared"
        ) {
            return;
        }

        state.isPowered =
            true;

        state.phase =
            "adjustment";

        state.latrValue =
            0;

        renderAll();

        setMessage(
            `Установку ввімкнено. За допомогою ЛАТР установіть ${state.selectedVoltage} В.`
        );
    }

    function handleLatrInput() {
        if (
            !state.isPowered ||
            state.phase !==
                "adjustment"
        ) {
            return;
        }

        state.latrValue =
            Number(
                elements.latrControl.value
            );

        renderAll();

        const voltageDifference =
            Math.abs(
                state.latrValue -
                state.selectedVoltage
            );

        if (
            voltageDifference <=
            VOLTAGE_TOLERANCE
        ) {
            setMessage(
                "Задану напругу встановлено. Зафіксуйте покази приладів.",
                "success"
            );
        } else {
            setMessage(
                `Поточна напруга ${formatNumber(
                    state.latrValue,
                    0
                )} В. Потрібно встановити ${state.selectedVoltage} В.`
            );
        }
    }

    function captureMeasurements() {
        const experiment =
            getCurrentExperiment();

        if (
            state.phase !==
                "adjustment" ||
            !state.isPowered ||
            !isExperimentConfigured(
                experiment
            )
        ) {
            return;
        }

        const voltageDifference =
            Math.abs(
                state.latrValue -
                state.selectedVoltage
            );

        if (
            voltageDifference >
            VOLTAGE_TOLERANCE
        ) {
            return;
        }

        state.capturedVoltage =
            experiment.measurements
                .actualVoltageV;

        state.capturedCurrent =
            experiment.measurements
                .currentA;

        state.capturedPower =
            experiment.measurements
                .activePowerW;

        state.latrValue =
            state.capturedVoltage;

        state.phase =
            "ready-heating";

        renderAll();

        setMessage(
            `Зафіксовано U = ${formatNumber(
                state.capturedVoltage,
                1
            )} В, I = ${formatNumber(
                state.capturedCurrent,
                2
            )} А, P = ${formatNumber(
                state.capturedPower,
                0
            )} Вт.`,
            "success"
        );
    }

    function startHeating() {
        const experiment =
            getCurrentExperiment();

        if (
            state.phase !==
                "ready-heating" ||
            !state.isPowered ||
            !isExperimentConfigured(
                experiment
            )
        ) {
            return;
        }

        const totalDuration =
            experiment.measurements
                .boilingTimeSeconds;

        const initialTemperature =
            experiment.conditions
                .initialTemperatureC;

        const boilingTemperature =
            experiment.conditions
                .boilingTemperatureC;

        const animationStart =
            window.performance.now();

        state.phase =
            "heating";

        state.elapsedSeconds =
            0;

        state.progress =
            0;

        state.currentTemperature =
            initialTemperature;

        renderAll();

        setMessage(
            "Розпочато нагрівання води та відлік часу."
        );

        function tick(
            currentTime
        ) {
            const elapsedAnimationTime =
                currentTime -
                animationStart;

            const progress =
                Math.min(
                    1,
                    elapsedAnimationTime /
                        ANIMATION_DURATION_MS
                );

            state.progress =
                progress;

            state.elapsedSeconds =
                totalDuration *
                progress;

            state.currentTemperature =
                calculateTemperatureAtTime({
                    initialTemperatureC:
                        initialTemperature,

                    boilingTemperatureC:
                        boilingTemperature,

                    elapsedSeconds:
                        state.elapsedSeconds,

                    boilingTimeSeconds:
                        totalDuration
                });

            renderMeasurements();
            renderHeatingProgress();
            renderChart();

            if (progress < 1) {
                state.animationFrame =
                    window.requestAnimationFrame(
                        tick
                    );

                return;
            }

            state.animationFrame =
                null;

            state.progress =
                1;

            state.elapsedSeconds =
                totalDuration;

            state.currentTemperature =
                boilingTemperature;

            state.isPowered =
                false;

            state.phase =
                "boiling";

            renderAll();

            setMessage(
                "Вода досягла температури кипіння. Запишіть результат досліду.",
                "success"
            );
        }

        state.animationFrame =
            window.requestAnimationFrame(
                tick
            );
    }

    function recordExperiment() {
        const experiment =
            getCurrentExperiment();

        if (
            state.phase !==
                "boiling" ||
            !isExperimentConfigured(
                experiment
            )
        ) {
            return;
        }

        const result =
            calculateExperimentResult(
                experiment
            );

        state.records[
            experiment.id
        ] = {
            ...result,

            completed:
                true
        };

        saveProgress();

        window.dispatchEvent(
            new CustomEvent(
                "lab05:experiment-updated",
                {
                    detail: {
                        experimentId:
                            experiment.id,

                        record:
                            state.records[
                                experiment.id
                            ],

                        records:
                            state.records
                    }
                }
            )
        );

        const completedCount =
            getCompletedCount();

        if (
            completedCount ===
            LAB05_TOTAL_EXPERIMENTS
        ) {
            state.phase =
                "all-complete";

            resetLiveValues();

            state.phase =
                "all-complete";

            renderAll();

            window.dispatchEvent(
                new CustomEvent(
                    "lab05:experiment-completed",
                    {
                        detail: {
                            records:
                                state.records
                        }
                    }
                )
            );

            setMessage(
                "Усі шість дослідів завершено. Перейдіть до розрахунків.",
                "success"
            );

            return;
        }

        const nextExperiment =
            findNextIncompleteExperiment();

        if (nextExperiment) {
            state.selectedHeaterId =
                nextExperiment.heaterId;

            state.selectedVoltage =
                nextExperiment
                    .targetVoltageV;
        }

        resetLiveValues();

        state.phase =
            "selection";

        saveProgress();
        renderAll();

        setMessage(
            "Результат записано. Підготуйте наступний дослід.",
            "success"
        );
    }

    function handlePrimaryAction() {
        const actions = {
            selection:
                prepareExperiment,

            adjustment:
                captureMeasurements,

            "ready-heating":
                startHeating,

            boiling:
                recordExperiment
        };

        actions[
            state.phase
        ]?.();
    }

    function resetExperiment() {
        const confirmed =
            window.confirm(
                "Очистити результати всіх дослідів і почати роботу спочатку?"
            );

        if (!confirmed) {
            return;
        }

        cancelAnimation();

        state.selectedHeaterId =
            "heater-1";

        state.selectedVoltage =
            LAB05_VOLTAGE_LEVELS[0];

        state.records =
            {};

        state.phase =
            "selection";

        resetLiveValues();
        saveProgress();
        renderAll();

        window.dispatchEvent(
            new CustomEvent(
                "lab05:experiment-reset"
            )
        );

        const experiment =
            getCurrentExperiment();

        if (
            isExperimentConfigured(
                experiment
            )
        ) {
            setMessage(
                "Результати очищено. Виберіть параметри першого досліду."
            );
        } else {
            setMessage(
                "Результати очищено. Дані першого досліду очікують погодження.",
                "warning"
            );
        }
    }

    elements.heaterButtons.forEach(
        (button) => {
            button.addEventListener(
                "click",
                () => {
                    selectHeater(
                        button.dataset
                            .heaterId
                    );
                }
            );
        }
    );

    elements.voltageButtons.forEach(
        (button) => {
            button.addEventListener(
                "click",
                () => {
                    selectVoltage(
                        Number(
                            button.dataset
                                .voltage
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

    elements.latrControl.addEventListener(
        "input",
        handleLatrInput
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

    const initialExperiment =
        getCurrentExperiment();

    if (
        isExperimentConfigured(
            initialExperiment
        )
    ) {
        setMessage(
            "Виберіть нагрівач і напругу, після чого підготуйте дослід."
        );
    } else {
        setMessage(
            "Експериментальні значення для вибраного досліду ще не погоджені.",
            "warning"
        );
    }
}