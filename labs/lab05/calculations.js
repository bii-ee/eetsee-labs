import {
    LAB05_EXPERIMENT_RUNS,
    LAB05_EXPERIMENT_STORAGE_KEY,
    LAB05_TOTAL_EXPERIMENTS,
    LAB05_VERIFIED_CALCULATIONS_STORAGE_KEY
} from "./data.js";

import {
    formatNumber
} from "./model.js";

import {
    createStorage
} from "../../common/js/storage.js";

const ENERGY_TOLERANCE_WH = 0.11;

function parseStudentNumber(value) {
    const normalized = String(value ?? "")
        .trim()
        .replace(/\s+/g, "")
        .replace(",", ".");

    if (normalized === "") {
        return null;
    }

    const number = Number(normalized);

    return Number.isFinite(number)
        ? number
        : null;
}

function isFiniteNumber(value) {
    return Number.isFinite(
        Number(value)
    );
}

function normalizeExperimentProgress(value) {
    const normalized = {
        records: {}
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
                sourceRecord.boilingTimeSeconds,
                sourceRecord.boilingTimeMinutes
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

                boilingTimeSeconds:
                    Number(
                        sourceRecord.boilingTimeSeconds
                    ),

                boilingTimeMinutes:
                    Number(
                        sourceRecord.boilingTimeMinutes
                    ),

                completed:
                    true
            };
        }
    );

    return normalized;
}

function getCompletedCount(progress) {
    return LAB05_EXPERIMENT_RUNS.filter(
        (experiment) =>
            progress.records[
                experiment.id
            ]?.completed === true
    ).length;
}

function isExperimentComplete(progress) {
    return (
        getCompletedCount(progress) ===
        LAB05_TOTAL_EXPERIMENTS
    );
}

function calculateElectricalEnergyWh(record) {
    return (
        record.activePowerW *
        record.boilingTimeMinutes /
        60
    );
}

function createExperimentSignature(progress) {
    return JSON.stringify(
        LAB05_EXPERIMENT_RUNS.map(
            (experiment) => {
                const record =
                    progress.records[
                        experiment.id
                    ];

                if (!record) {
                    return {
                        id:
                            experiment.id,

                        completed:
                            false
                    };
                }

                return {
                    id:
                        experiment.id,

                    heaterId:
                        record.heaterId,

                    targetVoltageV:
                        record.targetVoltageV,

                    actualVoltageV:
                        record.actualVoltageV,

                    currentA:
                        record.currentA,

                    activePowerW:
                        record.activePowerW,

                    boilingTimeMinutes:
                        record.boilingTimeMinutes,

                    completed:
                        true
                };
            }
        )
    );
}

function energyField(experimentId) {
    return `energy-${experimentId}`;
}

export function initializeCalculations({
    root = document,
    namespace = "lab05"
} = {}) {
    const section =
        root.querySelector(
            "#calculations"
        );

    if (
        !section ||
        section.dataset.initialized ===
            "true"
    ) {
        return;
    }

    const elements = {
        lockOverlay:
            section.querySelector(
                "#calculations-lock-overlay"
            ),

        interactiveArea:
            section.querySelector(
                "#calculations-interactive-area"
            ),

        experimentCount:
            section.querySelector(
                "#calculations-experiment-count"
            ),

        filledCount:
            section.querySelector(
                "#calculations-filled-count"
            ),

        progress:
            section.querySelector(
                "#calculations-progress"
            ),

        tableBody:
            section.querySelector(
                "#calculations-table-body"
            ),

        checkButton:
            section.querySelector(
                "#calculations-check-button"
            ),

        resetButton:
            section.querySelector(
                "#calculations-reset-button"
            ),

        message:
            section.querySelector(
                "#calculations-message"
            ),

        completePanel:
            section.querySelector(
                "#calculations-complete-panel"
            )
    };

    if (
        Object.values(elements).some(
            (element) => !element
        )
    ) {
        console.warn(
            "Не знайдено елементи розділу розрахунків ЛР5."
        );

        return;
    }

    section.dataset.initialized =
        "true";

    const experimentStorage =
        createStorage(
            LAB05_EXPERIMENT_STORAGE_KEY
        );

    const calculationsStorage =
        createStorage(
            LAB05_VERIFIED_CALCULATIONS_STORAGE_KEY
        );

    let experimentProgress =
        normalizeExperimentProgress(
            experimentStorage.get(
                "progress",
                {}
            )
        );

    let experimentSignature =
        "";

    let draft = {
        values: {},
        completed: false,
        signature: ""
    };

    function getInputs() {
        return Array.from(
            section.querySelectorAll(
                "[data-energy-field]"
            )
        );
    }

    function readSavedDraft(signature) {
        const saved =
            calculationsStorage.get(
                "progress",
                {}
            );

        if (
            !saved ||
            typeof saved !== "object" ||
            saved.signature !== signature
        ) {
            return {
                values: {},
                completed: false,
                signature
            };
        }

        return {
            values:
                saved.values &&
                typeof saved.values ===
                    "object"
                    ? saved.values
                    : {},

            completed:
                saved.completed === true,

            signature
        };
    }

    function saveDraft() {
        calculationsStorage.set(
            "progress",
            draft
        );
    }

    function setMessage(
        text,
        state = "default"
    ) {
        elements.message.textContent =
            text;

        elements.message.dataset.state =
            state;
    }

    function setStatus(
        status,
        text,
        state = "pending"
    ) {
        status.textContent =
            text;

        status.dataset.state =
            state;
    }

    function createInputMarkup(
        experiment,
        disabled
    ) {
        return `
            <input
                class="calculation-input"
                type="text"
                inputmode="decimal"
                autocomplete="off"
                data-energy-field="${energyField(
                    experiment.id
                )}"
                aria-label="Витрати електричної енергії: нагрівач ${experiment.heaterNumber}, напруга ${experiment.targetVoltageV} В"
                ${disabled ? "disabled" : ""}
            >
        `;
    }

    function renderTable(ready) {
        const renderedHeaters =
            new Set();

        elements.tableBody.innerHTML =
            LAB05_EXPERIMENT_RUNS.map(
                (experiment) => {
                    const record =
                        experimentProgress.records[
                            experiment.id
                        ];

                    const hasRecord =
                        record?.completed ===
                        true;

                    let heaterCell =
                        "";

                    if (
                        !renderedHeaters.has(
                            experiment.heaterId
                        )
                    ) {
                        renderedHeaters.add(
                            experiment.heaterId
                        );

                        const rowCount =
                            LAB05_EXPERIMENT_RUNS.filter(
                                (run) =>
                                    run.heaterId ===
                                    experiment.heaterId
                            ).length;

                        heaterCell = `
                            <th
                                rowspan="${rowCount}"
                                scope="rowgroup"
                            >
                                <span class="calculations-heater-label">
                                    №${experiment.heaterNumber}
                                </span>
                            </th>
                        `;
                    }

                    return `
                        <tr>
                            ${heaterCell}

                            <td>
                                ${formatNumber(
                                    experiment.targetVoltageV,
                                    0
                                )}
                            </td>

                            <td>
                                ${
                                    hasRecord
                                        ? formatNumber(
                                            record.actualVoltageV,
                                            1
                                        )
                                        : "–"
                                }
                            </td>

                            <td>
                                ${
                                    hasRecord
                                        ? formatNumber(
                                            record.currentA,
                                            2
                                        )
                                        : "–"
                                }
                            </td>

                            <td>
                                ${
                                    hasRecord
                                        ? formatNumber(
                                            record.activePowerW,
                                            0
                                        )
                                        : "–"
                                }
                            </td>

                            <td>
                                ${
                                    hasRecord
                                        ? formatNumber(
                                            record.boilingTimeMinutes,
                                            2
                                        )
                                        : "–"
                                }
                            </td>

                            <td>
                                ${createInputMarkup(
                                    experiment,
                                    !ready
                                )}
                            </td>

                            <td>
                                <span
                                    class="calculation-status"
                                    data-calculation-status="${experiment.id}"
                                    data-state="pending"
                                >
                                    Очікується
                                </span>
                            </td>
                        </tr>
                    `;
                }
            ).join("");
    }

    function restoreDraftValues() {
        getInputs().forEach(
            (input) => {
                const value =
                    draft.values[
                        input.dataset
                            .energyField
                    ];

                if (
                    value !== undefined &&
                    value !== null
                ) {
                    input.value =
                        String(value);
                }
            }
        );
    }

    function renderCompletedValidation() {
        if (!draft.completed) {
            return;
        }

        getInputs().forEach(
            (input) => {
                input.classList.add(
                    "is-correct"
                );

                const experimentId =
                    input.dataset.energyField
                        .replace(
                            /^energy-/,
                            ""
                        );

                const status =
                    section.querySelector(
                        `[data-calculation-status="${experimentId}"]`
                    );

                if (status) {
                    setStatus(
                        status,
                        "Правильно",
                        "correct"
                    );
                }
            }
        );
    }

    function updateFilledProgress() {
        const filledCount =
            getInputs().filter(
                (input) =>
                    parseStudentNumber(
                        input.value
                    ) !== null
            ).length;

        elements.filledCount.textContent =
            `${filledCount} із ${LAB05_TOTAL_EXPERIMENTS}`;

        if (draft.completed) {
            elements.progress.textContent =
                "Розрахунки завершено";
        } else if (filledCount > 0) {
            elements.progress.textContent =
                "Виконується";
        } else {
            elements.progress.textContent =
                "Не розпочато";
        }
    }

    function clearValidationStyles() {
        getInputs().forEach(
            (input) => {
                input.classList.remove(
                    "is-correct",
                    "is-incorrect"
                );
            }
        );

        section.querySelectorAll(
            ".calculation-status"
        ).forEach(
            (status) => {
                setStatus(
                    status,
                    "Очікується"
                );
            }
        );
    }

    function invalidateCompletion() {
        if (!draft.completed) {
            return;
        }

        draft.completed =
            false;

        elements.completePanel.hidden =
            true;

        window.dispatchEvent(
            new CustomEvent(
                `${namespace}:calculations-invalidated`
            )
        );
    }

    function handleInput(event) {
        const input =
            event.target.closest(
                "[data-energy-field]"
            );

        if (!input) {
            return;
        }

        invalidateCompletion();

        input.classList.remove(
            "is-correct",
            "is-incorrect"
        );

        draft.values[
            input.dataset.energyField
        ] = input.value;

        const experimentId =
            input.dataset.energyField
                .replace(
                    /^energy-/,
                    ""
                );

        const status =
            section.querySelector(
                `[data-calculation-status="${experimentId}"]`
            );

        if (status) {
            setStatus(
                status,
                "Змінено",
                "partial"
            );
        }

        updateFilledProgress();
        saveDraft();

        setMessage(
            "Після заповнення всіх полів натисніть «Перевірити розрахунки»."
        );
    }

    function validateInput(
        input,
        expected
    ) {
        const value =
            parseStudentNumber(
                input.value
            );

        const filled =
            value !== null;

        const correct =
            filled &&
            Math.abs(
                value -
                expected
            ) <= ENERGY_TOLERANCE_WH;

        input.classList.toggle(
            "is-correct",
            correct
        );

        input.classList.toggle(
            "is-incorrect",
            filled && !correct
        );

        return {
            filled,
            correct,
            value
        };
    }

    function checkCalculations() {
        if (
            !isExperimentComplete(
                experimentProgress
            )
        ) {
            setMessage(
                "Спочатку завершіть усі шість дослідів у розділі 7.",
                "warning"
            );

            return;
        }

        let allFilled =
            true;

        let allCorrect =
            true;

        const calculatedValues =
            {};

        LAB05_EXPERIMENT_RUNS.forEach(
            (experiment) => {
                const record =
                    experimentProgress.records[
                        experiment.id
                    ];

                const expected =
                    calculateElectricalEnergyWh(
                        record
                    );

                const input =
                    section.querySelector(
                        `[data-energy-field="${energyField(
                            experiment.id
                        )}"]`
                    );

                const result =
                    validateInput(
                        input,
                        expected
                    );

                const status =
                    section.querySelector(
                        `[data-calculation-status="${experiment.id}"]`
                    );

                setStatus(
                    status,
                    result.correct
                        ? "Правильно"
                        : result.filled
                            ? "Перевірте"
                            : "Не заповнено",
                    result.correct
                        ? "correct"
                        : result.filled
                            ? "incorrect"
                            : "partial"
                );

                calculatedValues[
                    experiment.id
                ] = {
                    experimentId:
                        experiment.id,

                    heaterId:
                        experiment.heaterId,

                    heaterNumber:
                        experiment.heaterNumber,

                    targetVoltageV:
                        experiment.targetVoltageV,

                    electricalEnergyWh:
                        expected
                };

                allFilled =
                    allFilled &&
                    result.filled;

                allCorrect =
                    allCorrect &&
                    result.correct;
            }
        );

        draft.values =
            Object.fromEntries(
                getInputs().map(
                    (input) => [
                        input.dataset
                            .energyField,

                        input.value
                    ]
                )
            );

        draft.completed =
            allCorrect;

        saveDraft();
        updateFilledProgress();

        if (allCorrect) {
            elements.completePanel.hidden =
                false;

            setMessage(
                "Усі розрахунки правильні. Можна переходити до аналізу результатів.",
                "success"
            );

            window.dispatchEvent(
                new CustomEvent(
                    `${namespace}:calculations-completed`,
                    {
                        detail: {
                            records:
                                experimentProgress.records,

                            calculations:
                                calculatedValues,

                            values:
                                draft.values
                        }
                    }
                )
            );

            return;
        }

        elements.completePanel.hidden =
            true;

        if (!allFilled) {
            setMessage(
                "Заповніть усі шість полів і повторіть перевірку.",
                "warning"
            );

            return;
        }

        setMessage(
            "Деякі значення обчислено неправильно. Перевірте позначені поля.",
            "error"
        );
    }

    function resetCalculations() {
        const hasValues =
            getInputs().some(
                (input) =>
                    input.value.trim() !==
                    ""
            );

        if (
            hasValues &&
            !window.confirm(
                "Очистити всі введені розрахунки?"
            )
        ) {
            return;
        }

        getInputs().forEach(
            (input) => {
                input.value =
                    "";
            }
        );

        draft = {
            values: {},
            completed: false,
            signature:
                experimentSignature
        };

        clearValidationStyles();
        updateFilledProgress();

        elements.completePanel.hidden =
            true;

        saveDraft();

        window.dispatchEvent(
            new CustomEvent(
                `${namespace}:calculations-invalidated`
            )
        );

        setMessage(
            "Розрахунки очищено. Заповніть таблицю повторно."
        );
    }

    function updateAccess() {
        experimentProgress =
            normalizeExperimentProgress(
                experimentStorage.get(
                    "progress",
                    {}
                )
            );

        const completedCount =
            getCompletedCount(
                experimentProgress
            );

        const ready =
            isExperimentComplete(
                experimentProgress
            );

        const signature =
            createExperimentSignature(
                experimentProgress
            );

        if (
            ready &&
            signature !==
                experimentSignature
        ) {
            experimentSignature =
                signature;

            draft =
                readSavedDraft(
                    signature
                );
        }

        if (!ready) {
            experimentSignature =
                "";
        }

        renderTable(ready);
        restoreDraftValues();
        clearValidationStyles();
        renderCompletedValidation();

        elements.experimentCount.textContent =
            `${completedCount} із ${LAB05_TOTAL_EXPERIMENTS}`;

        elements.lockOverlay.hidden =
            ready;

        elements.interactiveArea.inert =
            !ready;

        elements.checkButton.disabled =
            !ready;

        elements.resetButton.disabled =
            !ready;

        elements.completePanel.hidden =
            !draft.completed;

        updateFilledProgress();

        if (ready) {
            setMessage(
                draft.completed
                    ? "Розрахунки вже перевірено. Можна переходити до аналізу результатів."
                    : "Введіть розраховані значення електричної енергії.",
                draft.completed
                    ? "success"
                    : "default"
            );
        } else {
            elements.progress.textContent =
                "Очікування експерименту";

            elements.filledCount.textContent =
                `0 із ${LAB05_TOTAL_EXPERIMENTS}`;

            setMessage(
                "Завершіть усі шість дослідів, щоб перейти до розрахунків.",
                "warning"
            );
        }
    }

    function handleExperimentReset() {
        calculationsStorage.remove(
            "progress"
        );

        draft = {
            values: {},
            completed: false,
            signature: ""
        };

        window.dispatchEvent(
            new CustomEvent(
                `${namespace}:calculations-invalidated`
            )
        );

        updateAccess();
    }

    section.addEventListener(
        "input",
        handleInput
    );

    elements.checkButton.addEventListener(
        "click",
        checkCalculations
    );

    elements.resetButton.addEventListener(
        "click",
        resetCalculations
    );

    window.addEventListener(
        "lab05:experiment-updated",
        updateAccess
    );

    window.addEventListener(
        "lab05:experiment-completed",
        updateAccess
    );

    window.addEventListener(
        "lab05:experiment-reset",
        handleExperimentReset
    );

    updateAccess();
}