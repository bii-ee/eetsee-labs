import {
    LAB06_EXPERIMENT_MODES,
    LAB06_EXPERIMENT_STORAGE_KEY,
    getExperimentMode
} from "./data.js";

import {
    createStorage
} from "../../common/js/storage.js";

const EMPTY_READING = "—";

function createSineWavePath({
    width = 640,
    centerY = 90,
    amplitude = 62,
    alpha = 0,
    controlled = false
} = {}) {
    const points = [];
    const alphaRadians = (alpha * Math.PI) / 180;
    const samples = 480;

    for (let index = 0; index <= samples; index += 1) {
        const x = (index / samples) * width;
        const phase = (index / samples) * Math.PI * 4;
        const halfWavePhase = phase % Math.PI;

        const isConducting =
            !controlled || halfWavePhase >= alphaRadians;

        const value = isConducting ? Math.sin(phase) : 0;
        const y = centerY - value * amplitude;

        points.push(
            `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`
        );
    }

    return points.join(" ");
}

function loadStoredRecords() {
    try {
        const storedValue = localStorage.getItem(
            LAB06_EXPERIMENT_STORAGE_KEY
        );

        if (!storedValue) {
            return {};
        }

        const parsedValue = JSON.parse(storedValue);

        if (
            !parsedValue ||
            typeof parsedValue !== "object" ||
            Array.isArray(parsedValue)
        ) {
            return {};
        }

        return parsedValue;
    } catch (error) {
        console.warn(
            "Не вдалося прочитати результати експерименту.",
            error
        );

        return {};
    }
}

function saveStoredRecords(records) {
    try {
        localStorage.setItem(
            LAB06_EXPERIMENT_STORAGE_KEY,
            JSON.stringify(records)
        );
    } catch (error) {
        console.warn(
            "Не вдалося зберегти результати експерименту.",
            error
        );
    }
}

function formatReading(value, digits = 1) {
    if (!Number.isFinite(value)) {
        return EMPTY_READING;
    }

    return new Intl.NumberFormat("uk-UA", {
        minimumFractionDigits: 0,
        maximumFractionDigits: digits
    }).format(value);
}

export function initializeExperiment({
    namespace = "lab06"
} = {}) {
    const experimentSection = document.querySelector("#experiment");

    if (!experimentSection) {
        return;
    }

    const interactiveArea = experimentSection.querySelector(
        "#experiment-interactive-area"
    );

    const lockOverlay = experimentSection.querySelector(
        "#experiment-lock-overlay"
    );

    if (!interactiveArea || !lockOverlay) {
        console.warn(
            "Не знайдено елементи блокування експерименту."
        );

        return;
    }

    const standStorage = createStorage(
        `${namespace}:stand`
    );
    const powerButton = experimentSection.querySelector(
        "#experiment-power-button"
    );

    const powerState = experimentSection.querySelector(
        "#experiment-power-state"
    );

    const modeButtons = Array.from(
        experimentSection.querySelectorAll(
            ".experiment-mode-button"
        )
    );

    const measureButton = experimentSection.querySelector(
        "#experiment-measure-button"
    );

    const recordButton = experimentSection.querySelector(
        "#experiment-record-button"
    );

    const resetButton = experimentSection.querySelector(
        "#experiment-reset-button"
    );

    const message = experimentSection.querySelector(
        "#experiment-message"
    );

    const alphaLabel = experimentSection.querySelector(
        "#experiment-alpha-label"
    );

    const currentModeLabel = experimentSection.querySelector(
        "#experiment-current-mode"
    );

    const waveformPath = experimentSection.querySelector(
        "#experiment-waveform-path"
    );

    const waveformSvg = experimentSection.querySelector(
        ".experiment-waveform"
    );

    const referenceWaveform = experimentSection.querySelector(
        "#experiment-reference-waveform"
    );

    const tableBody = experimentSection.querySelector(
        "#experiment-table-body"
    );

    const progressValue = experimentSection.querySelector(
        "#experiment-progress-value"
    );

    const readingOutputs = {
        u1: experimentSection.querySelector(
            '[data-reading="u1"]'
        ),

        current: experimentSection.querySelector(
            '[data-reading="current"]'
        ),

        power: experimentSection.querySelector(
            '[data-reading="power"]'
        ),

        u2: experimentSection.querySelector(
            '[data-reading="u2"]'
        )
    };

    const state = {
        isPowered: false,
        selectedModeId: LAB06_EXPERIMENT_MODES[0].id,
        currentMeasurement: null,
        records: loadStoredRecords(),
        isMeasuring: false
    };

    function isStandReady() {
        const standProgress = standStorage.get(
            "progress",
            {}
        );

        return standProgress.ready === true;
    }

    function updateExperimentAccess(event) {
        if (
            event?.detail?.namespace &&
            event.detail.namespace !== namespace
        ) {
            return;
        }

        const accessGranted = isStandReady();

        lockOverlay.hidden = accessGranted;
        interactiveArea.inert = !accessGranted;

        experimentSection.classList.toggle(
            "experiment-access-granted",
            accessGranted
        );
    }
    function getSelectedMode() {
        return getExperimentMode(state.selectedModeId);
    }

    function restartWaveformAnimation() {
        waveformPath.classList.remove("is-drawing");

        void waveformPath.getBoundingClientRect();

        waveformPath.classList.add("is-drawing");
    }

    function setMessage(text, type = "default") {
        message.textContent = text;
        message.dataset.type = type;
    }

    function clearCurrentMeasurement() {
        state.currentMeasurement = null;

        Object.values(readingOutputs).forEach((output) => {
            output.textContent = EMPTY_READING;
        });

        recordButton.disabled = true;
    }

    function renderPowerState() {
        powerState.textContent = state.isPowered
            ? "Увімкнена"
            : "Вимкнена";

        powerState.classList.toggle(
            "is-on",
            state.isPowered
        );

        powerButton.textContent = state.isPowered
            ? "Вимкнути установку"
            : "Увімкнути установку";

        powerButton.classList.toggle(
            "is-on",
            state.isPowered
        );

        measureButton.disabled =
            !state.isPowered || state.isMeasuring;

        waveformSvg.classList.toggle(
            "is-off",
            !state.isPowered
        );

        if (state.isPowered) {
            restartWaveformAnimation();
        } else {
            waveformPath.classList.remove("is-drawing");
        }
    }

    function renderSelectedMode() {
        const mode = getSelectedMode();

        modeButtons.forEach((button) => {
            const isSelected =
                button.dataset.modeId === mode.id;

            button.classList.toggle(
                "is-selected",
                isSelected
            );

            button.setAttribute(
                "aria-pressed",
                String(isSelected)
            );
        });

        alphaLabel.textContent = `α = ${mode.alpha}°`;
        currentModeLabel.textContent =
            `Положення ${mode.position}`;

        waveformPath.setAttribute(
            "d",
            createSineWavePath({
                alpha: mode.alpha,
                controlled: true
            })
        );

        if (state.isPowered) {
            restartWaveformAnimation();
        }
    }

    function renderReferenceWaveform() {
        referenceWaveform.setAttribute(
            "d",
            createSineWavePath({
                controlled: false
            })
        );
    }

    function renderCurrentMeasurement() {
        const measurement = state.currentMeasurement;

        if (!measurement) {
            clearCurrentMeasurement();
            return;
        }

        readingOutputs.u1.textContent = formatReading(
            measurement.u1
        );

        readingOutputs.current.textContent = formatReading(
            measurement.current
        );

        readingOutputs.power.textContent = formatReading(
            measurement.power
        );

        readingOutputs.u2.textContent = formatReading(
            measurement.u2
        );

        recordButton.disabled = false;
    }

    function renderTable() {
        tableBody.innerHTML = LAB06_EXPERIMENT_MODES.map(
            (mode) => {
                const record = state.records[mode.id];

                return `
                    <tr class="${record ? "is-recorded" : ""}">
                        <th scope="row">
                            Положення ${mode.position}
                        </th>

                        <td>${mode.alpha}</td>

                        <td>
                            ${record
                        ? formatReading(record.u1)
                        : EMPTY_READING}
                        </td>

                        <td>
                            ${record
                        ? formatReading(record.current)
                        : EMPTY_READING}
                        </td>

                        <td>
                            ${record
                        ? formatReading(record.power)
                        : EMPTY_READING}
                        </td>

                        <td>
                            ${record
                        ? formatReading(record.u2)
                        : EMPTY_READING}
                        </td>

                        <td>
                            <span class="record-status">
                                ${record ? "Записано" : "Очікується"}
                            </span>
                        </td>
                    </tr>
                `;
            }
        ).join("");

        const completedCount = LAB06_EXPERIMENT_MODES.filter(
            (mode) => Boolean(state.records[mode.id])
        ).length;

        progressValue.textContent =
            `${completedCount} із ${LAB06_EXPERIMENT_MODES.length}`;

        experimentSection.classList.toggle(
            "is-completed",
            completedCount === LAB06_EXPERIMENT_MODES.length
        );

        if (completedCount === LAB06_EXPERIMENT_MODES.length) {
            window.dispatchEvent(
                new CustomEvent(
                    "lab06:experiment-completed",
                    {
                        detail: {
                            records: state.records
                        }
                    }
                )
            );
        }
    }

    function selectMode(modeId) {
        if (state.isMeasuring) {
            return;
        }

        state.selectedModeId = modeId;
        clearCurrentMeasurement();
        renderSelectedMode();

        if (state.isPowered) {
            setMessage(
                "Положення регулятора змінено. Зніміть покази приладів."
            );
        } else {
            setMessage(
                "Положення вибрано. Для вимірювання увімкніть установку."
            );
        }
    }

    function togglePower() {
        if (state.isMeasuring) {
            return;
        }

        state.isPowered = !state.isPowered;
        clearCurrentMeasurement();
        renderPowerState();

        if (state.isPowered) {
            setMessage(
                "Установку увімкнено. Можна знімати покази.",
                "success"
            );
        } else {
            setMessage(
                "Установку вимкнено.",
                "default"
            );
        }
    }

    function measureCurrentMode() {
        if (!state.isPowered || state.isMeasuring) {
            return;
        }

        const mode = getSelectedMode();

        state.isMeasuring = true;
        measureButton.disabled = true;
        recordButton.disabled = true;
        measureButton.textContent = "Вимірювання...";

        setMessage(
            "Виконується стабілізація показів приладів."
        );

        window.setTimeout(() => {
            state.currentMeasurement = {
                modeId: mode.id,
                position: mode.position,
                alpha: mode.alpha,
                ...mode.readings
            };

            state.isMeasuring = false;
            measureButton.textContent = "Зняти покази";

            renderPowerState();
            renderCurrentMeasurement();

            setMessage(
                "Покази отримано. Запишіть їх у таблицю.",
                "success"
            );
        }, 650);
    }

    function recordCurrentMeasurement() {
        const measurement = state.currentMeasurement;

        if (!measurement) {
            return;
        }

        state.records[measurement.modeId] = {
            position: measurement.position,
            alpha: measurement.alpha,
            u1: measurement.u1,
            current: measurement.current,
            power: measurement.power,
            u2: measurement.u2
        };

        saveStoredRecords(state.records);
        renderTable();

        setMessage(
            `Покази для положення ${measurement.position} записано.`,
            "success"
        );

        recordButton.disabled = true;
    }

    function resetExperiment() {
        const shouldReset = window.confirm(
            "Очистити всі записані результати досліду?"
        );

        if (!shouldReset) {
            return;
        }

        state.records = {};
        state.currentMeasurement = null;

        localStorage.removeItem(
            LAB06_EXPERIMENT_STORAGE_KEY
        );

        clearCurrentMeasurement();
        renderTable();

        setMessage(
            "Результати експерименту очищено."
        );
    }

    powerButton.addEventListener(
        "click",
        togglePower
    );

    modeButtons.forEach((button) => {
        button.addEventListener("click", () => {
            selectMode(button.dataset.modeId);
        });
    });

    measureButton.addEventListener(
        "click",
        measureCurrentMode
    );

    recordButton.addEventListener(
        "click",
        recordCurrentMeasurement
    );

    resetButton.addEventListener(
        "click",
        resetExperiment
    );

    document.addEventListener(
        "laboratory:stand-ready",
        updateExperimentAccess
    );

    document.addEventListener(
        "laboratory:stand-reset",
        updateExperimentAccess
    );

    renderReferenceWaveform();
    renderSelectedMode();
    renderPowerState();
    renderCurrentMeasurement();
    renderTable();
    updateExperimentAccess();
}