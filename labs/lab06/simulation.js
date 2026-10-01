import { isLaboratoryPrepared } from "../../common/js/access-state.js";

import {
    LAB06_EXPERIMENT_MODES,
    LAB06_EXPERIMENT_STORAGE_KEY,
    getExperimentMode
} from "./data.js";

import {
    LAB06_CONFIG,
    LAB06_EVENTS
} from "./config.js";

import {
    getStudentVariant,
    selectStudentVariant,
    STUDENT_VARIANT_COUNT
} from "../../common/js/student-variants.js";

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

    const variantSelect = experimentSection.querySelector(
        "#student-variant-select"
    );
    const variantReturnKey = "lab06:variant-return";

    if (variantSelect) {
        for (let variant = 1; variant <= STUDENT_VARIANT_COUNT; variant += 1) {
            variantSelect.add(new Option(`Варіант ${variant}`, String(variant)));
        }

        variantSelect.value = String(getStudentVariant());
        variantSelect.addEventListener("change", () => {
            const nextVariant = Number(variantSelect.value);
            try {
                window.sessionStorage.setItem(variantReturnKey, String(nextVariant));
            } catch {
                // Вибір варіанта працює і без sessionStorage.
            }
            selectStudentVariant(nextVariant);
        });
    }

    const powerButton = experimentSection.querySelector(
        "#experiment-power-button"
    );

    const powerButtonLabel = powerButton.querySelector(
        ".experiment-power-button-label"
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

    const meterScales = { u1: 250, current: 5, power: 1000, u2: 250 };
    const meterNeedles = Object.fromEntries(
        Object.keys(meterScales).map((key) => [
            key,
            experimentSection.querySelector(`[data-needle="${key}"]`)
        ])
    );
    const meterPositions = Object.fromEntries(
        Object.keys(meterScales).map((key) => [key, 0])
    );
    const meterFrames = {};

    function updateMeterNeedles(measurement) {
        Object.entries(meterScales).forEach(([key, maximum]) => {
            const needle = meterNeedles[key];
            if (!needle) return;

            window.cancelAnimationFrame(meterFrames[key]);
            const initial = meterPositions[key];
            const target = Math.min(maximum, Math.max(0, Number(measurement?.[key]) || 0));
            if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                needle.setAttribute("transform", `rotate(${-62 + 124 * target / maximum} 165 158)`);
                meterPositions[key] = target;
                return;
            }

            const start = performance.now();
            function frame(now) {
                const progress = Math.min(1, Math.max(0, (now - start) / 680));
                const eased = 1 - (1 - progress) ** 3;
                const value = initial + (target - initial) * eased;
                needle.setAttribute("transform", `rotate(${-62 + 124 * value / maximum} 165 158)`);
                meterPositions[key] = value;
                if (progress < 1) meterFrames[key] = window.requestAnimationFrame(frame);
            }
            meterFrames[key] = window.requestAnimationFrame(frame);
        });
    }

    const state = {
        isPowered: false,
        selectedModeId: LAB06_EXPERIMENT_MODES[0].id,
        currentMeasurement: null,
        records: loadStoredRecords(),
        isMeasuring: false,
        measurementTimer: null
    };

    function isStandReady() {
        return isLaboratoryPrepared(LAB06_CONFIG);
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
        if (!accessGranted) {
            resetExperiment({ askConfirmation: false });
        }
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
        updateMeterNeedles(null);
    }

    function renderPowerState() {
        powerState.textContent = state.isPowered
            ? "Увімкнена"
            : "Вимкнена";

        powerState.classList.toggle(
            "is-on",
            state.isPowered
        );

        const powerAction = state.isPowered
            ? "Вимкнути установку"
            : "Увімкнути установку";
        powerButtonLabel.textContent = powerAction;
        powerButton.setAttribute("aria-label", powerAction);
        powerButton.setAttribute("aria-pressed", String(state.isPowered));

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
            measurement.current,
            2
        );

        readingOutputs.power.textContent = formatReading(
            measurement.power
        );

        readingOutputs.u2.textContent = formatReading(
            measurement.u2
        );
        updateMeterNeedles(measurement);

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
                        ? formatReading(record.current, 2)
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
                    LAB06_EVENTS.experimentCompleted,
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
        if (!isStandReady()) return;
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
        if (!isStandReady()) return;
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

        state.measurementTimer = window.setTimeout(() => {
            state.measurementTimer = null;
            if (!isStandReady()) return;

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
        if (!isStandReady()) return;
        const measurement =
            state.currentMeasurement;

        if (!measurement) {
            return;
        }

        state.records[
            measurement.modeId
        ] = {
            position:
                measurement.position,

            alpha:
                measurement.alpha,

            u1:
                measurement.u1,

            current:
                measurement.current,

            power:
                measurement.power,

            u2:
                measurement.u2
        };

        saveStoredRecords(
            state.records
        );

        window.dispatchEvent(
            new CustomEvent(
                LAB06_EVENTS.experimentUpdated,
                {
                    detail: {
                        modeId:
                            measurement.modeId,

                        record:
                            state.records[
                            measurement.modeId
                            ]
                    }
                }
            )
        );

        renderTable();

        setMessage(
            `Покази для положення ${measurement.position} записано.`,
            "success"
        );

        recordButton.disabled = true;
    }

    function resetExperiment({ askConfirmation = true } = {}) {
        const shouldReset =
            !askConfirmation || window.confirm(
                "Очистити всі записані результати досліду?"
            );

        if (!shouldReset) {
            return;
        }

        window.clearTimeout(state.measurementTimer);
        state.measurementTimer = null;
        state.isPowered = false;
        state.isMeasuring = false;
        measureButton.textContent = "Зняти покази";
        state.records = {};

        state.currentMeasurement =
            null;

        localStorage.removeItem(
            LAB06_EXPERIMENT_STORAGE_KEY
        );

        window.dispatchEvent(
            new CustomEvent(
                LAB06_EVENTS.experimentReset
            )
        );

        clearCurrentMeasurement();
        renderPowerState();
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
        () => resetExperiment()
    );

    document.addEventListener(
        LAB06_EVENTS.standReady,
        updateExperimentAccess
    );

    document.addEventListener(
        LAB06_EVENTS.standReset,
        updateExperimentAccess
    );

    renderReferenceWaveform();
    renderSelectedMode();
    renderPowerState();
    renderCurrentMeasurement();
    renderTable();
    updateExperimentAccess();

    if (variantSelect) {
        try {
            if (
                window.sessionStorage.getItem(variantReturnKey) ===
                String(getStudentVariant())
            ) {
                window.sessionStorage.removeItem(variantReturnKey);
                window.requestAnimationFrame(() => {
                    variantSelect.scrollIntoView({
                        behavior: "instant",
                        block: "center"
                    });
                    window.requestAnimationFrame(() => {
                        document.documentElement.classList.remove(
                            "variant-return-pending"
                        );
                    });
                });
            }
        } catch {
            // Приватний режим може обмежувати доступ до sessionStorage.
        }
    }
}
