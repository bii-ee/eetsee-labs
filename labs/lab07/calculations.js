import {
    createStorage
} from "../../common/js/storage.js";

const MODES = [
    { id: "mode-1", position: 1 },
    { id: "mode-2", position: 2 },
    { id: "mode-3", position: 3 }
];

const CYCLES_PER_MODE = 3;
const TOTAL_FIELDS = 21;
const DURATION_TOLERANCE = 0.11;
const PERCENT_TOLERANCE = 0.16;

function parseStudentNumber(value) {
    const normalized = String(value ?? "")
        .trim()
        .replace(/\s+/g, "")
        .replace(",", ".");

    if (normalized === "") {
        return null;
    }

    const number = Number(normalized);

    return Number.isFinite(number) ? number : null;
}

function formatNumber(value, digits = 1) {
    return new Intl.NumberFormat("uk-UA", {
        minimumFractionDigits: 0,
        maximumFractionDigits: digits
    }).format(value);
}

function isFiniteNumber(value) {
    return Number.isFinite(Number(value));
}

function isClose(value, expected, tolerance) {
    return (
        Number.isFinite(value) &&
        Math.abs(value - expected) <= tolerance
    );
}

function normalizeExperimentProgress(value) {
    const normalized = {
        burner: value?.burner === 2 ? 2 : 1,
        records: {}
    };

    MODES.forEach((mode) => {
        const source = value?.records?.[mode.id];

        if (!source || typeof source !== "object") {
            return;
        }

        const cycles = Array.isArray(source.cycles)
            ? source.cycles
                .filter(
                    (cycle) =>
                        isFiniteNumber(cycle?.tOn) &&
                        isFiniteNumber(cycle?.tOff)
                )
                .slice(0, CYCLES_PER_MODE)
                .map((cycle) => ({
                    tOn: Number(cycle.tOn),
                    tOff: Number(cycle.tOff)
                }))
            : [];

        normalized.records[mode.id] = {
            position: mode.position,
            cycles
        };
    });

    return normalized;
}

function getCompletedCycleCount(progress) {
    return MODES.reduce(
        (total, mode) =>
            total +
            Math.min(
                progress.records[mode.id]?.cycles.length ?? 0,
                CYCLES_PER_MODE
            ),
        0
    );
}

function isExperimentComplete(progress) {
    return MODES.every(
        (mode) =>
            progress.records[mode.id]?.cycles.length ===
            CYCLES_PER_MODE
    );
}

function createExperimentSignature(progress) {
    return JSON.stringify({
        burner: progress.burner,
        records: MODES.map((mode) => ({
            id: mode.id,
            cycles: (
                progress.records[mode.id]?.cycles ?? []
            ).map(({ tOn, tOff }) => ({ tOn, tOff }))
        }))
    });
}

function expectedCycleValues(cycle) {
    const duration = cycle.tOn + cycle.tOff;
    const dutyCycle = duration > 0
        ? cycle.tOn / duration * 100
        : 0;

    return {
        duration,
        dutyCycle
    };
}

function durationField(modeId, cycleIndex) {
    return `${modeId}-cycle-${cycleIndex + 1}-duration`;
}

function dutyField(modeId, cycleIndex) {
    return `${modeId}-cycle-${cycleIndex + 1}-duty`;
}

function averageField(modeId) {
    return `${modeId}-average-duty`;
}

export function initializeCalculations({
    root = document,
    namespace = "lab07"
} = {}) {
    const section = root.querySelector("#calculations");

    if (!section || section.dataset.initialized === "true") {
        return;
    }

    const elements = {
        lockOverlay: section.querySelector(
            "#calculations-lock-overlay"
        ),
        interactiveArea: section.querySelector(
            "#calculations-interactive-area"
        ),
        burner: section.querySelector("#calculations-burner"),
        cycleCount: section.querySelector(
            "#calculations-cycle-count"
        ),
        progress: section.querySelector(
            "#calculations-progress"
        ),
        tableBody: section.querySelector(
            "#calculations-table-body"
        ),
        summaryBody: section.querySelector(
            "#calculations-summary-body"
        ),
        checkButton: section.querySelector(
            "#calculations-check-button"
        ),
        resetButton: section.querySelector(
            "#calculations-reset-button"
        ),
        message: section.querySelector(
            "#calculations-message"
        ),
        completePanel: section.querySelector(
            "#calculations-complete-panel"
        )
    };

    if (Object.values(elements).some((element) => !element)) {
        console.warn(
            "Не знайдено елементи розділу розрахунків ЛР7."
        );
        return;
    }

    section.dataset.initialized = "true";

    const experimentStorage = createStorage(
        `${namespace}:cyclic-experiment`
    );

    const calculationsStorage = createStorage(
        `${namespace}:calculations`
    );

    let experimentProgress = normalizeExperimentProgress(
        experimentStorage.get("progress", {})
    );

    let experimentSignature = "";
    let draft = {
        values: {},
        completed: false,
        signature: ""
    };

    function readSavedDraft(signature) {
        const saved = calculationsStorage.get("progress", {});

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
                saved.values && typeof saved.values === "object"
                    ? saved.values
                    : {},
            completed: saved.completed === true,
            signature
        };
    }

    function saveDraft() {
        calculationsStorage.set("progress", draft);
    }

    function setMessage(text, state = "default") {
        elements.message.textContent = text;
        elements.message.dataset.state = state;
    }

    function setStatus(status, text, state = "pending") {
        status.textContent = text;
        status.dataset.state = state;
    }

    function getExpectedModeValues(modeId) {
        const record = experimentProgress.records[modeId];
        const cycles = record.cycles.map(expectedCycleValues);

        return {
            cycles,
            averageDutyCycle:
                cycles.reduce(
                    (sum, cycle) => sum + cycle.dutyCycle,
                    0
                ) / cycles.length
        };
    }

    function createInputMarkup(field, label) {
        return `
            <input
                class="calculation-input"
                type="text"
                inputmode="decimal"
                autocomplete="off"
                data-field="${field}"
                aria-label="${label}"
            >
        `;
    }

    function renderCalculationTable() {
        const rows = [];

        MODES.forEach((mode) => {
            const record = experimentProgress.records[mode.id];

            record.cycles.forEach((cycle, cycleIndex) => {
                const durationKey = durationField(
                    mode.id,
                    cycleIndex
                );
                const dutyKey = dutyField(
                    mode.id,
                    cycleIndex
                );
                const cycleNumber = cycleIndex + 1;

                rows.push(`
                    <tr>
                        ${cycleIndex === 0
                            ? `<th rowspan="3" scope="rowgroup">Режим ${mode.position}</th>`
                            : ""
                        }
                        <th scope="row">${cycleNumber}</th>
                        <td>
                            <span class="calculation-source-value">
                                ${formatNumber(cycle.tOn)}
                            </span>
                        </td>
                        <td>
                            <span class="calculation-source-value">
                                ${formatNumber(cycle.tOff)}
                            </span>
                        </td>
                        <td>
                            ${createInputMarkup(
                                durationKey,
                                `Тривалість циклу: режим ${mode.position}, цикл ${cycleNumber}`
                            )}
                        </td>
                        <td>
                            ${createInputMarkup(
                                dutyKey,
                                `Відносна тривалість увімкнення: режим ${mode.position}, цикл ${cycleNumber}`
                            )}
                        </td>
                        <td>
                            <span
                                class="calculation-status"
                                data-cycle-status="${mode.id}-${cycleNumber}"
                                data-state="pending"
                            >
                                Очікується
                            </span>
                        </td>
                    </tr>
                `);
            });
        });

        elements.tableBody.innerHTML = rows.join("");
    }

    function renderSummaryTable() {
        elements.summaryBody.innerHTML = MODES.map((mode) => {
            const values = [0, 1, 2].map(
                (cycleIndex) => `
                    <td>
                        <span
                            class="calculation-summary-value"
                            data-summary-field="${dutyField(
                                mode.id,
                                cycleIndex
                            )}"
                        >—</span>
                    </td>
                `
            ).join("");

            return `
                <tr>
                    <th scope="row">Режим ${mode.position}</th>
                    ${values}
                    <td>
                        ${createInputMarkup(
                            averageField(mode.id),
                            `Середня відносна тривалість увімкнення для режиму ${mode.position}`
                        )}
                    </td>
                    <td>
                        <span
                            class="calculation-status"
                            data-mode-status="${mode.id}"
                            data-state="pending"
                        >
                            Очікується
                        </span>
                    </td>
                </tr>
            `;
        }).join("");
    }

    function restoreDraftValues() {
        section.querySelectorAll("[data-field]").forEach(
            (input) => {
                const value = draft.values[input.dataset.field];

                if (value !== undefined && value !== null) {
                    input.value = String(value);
                }
            }
        );

        updateSummaryValues();
        updateFilledProgress();
    }

    function updateSummaryValues() {
        section.querySelectorAll("[data-summary-field]").forEach(
            (output) => {
                const input = section.querySelector(
                    `[data-field="${output.dataset.summaryField}"]`
                );
                const value = parseStudentNumber(input?.value);

                output.textContent = value === null
                    ? "—"
                    : `${formatNumber(value, 2)} %`;
            }
        );
    }

    function getInputs() {
        return [...section.querySelectorAll("[data-field]")];
    }

    function updateFilledProgress() {
        const filled = getInputs().filter(
            (input) => parseStudentNumber(input.value) !== null
        ).length;

        elements.progress.textContent = draft.completed
            ? "Розрахунки завершено"
            : `${filled} із ${TOTAL_FIELDS} значень введено`;
    }

    function clearValidationStyles() {
        getInputs().forEach((input) => {
            input.classList.remove("is-correct", "is-incorrect");
        });

        section.querySelectorAll(".calculation-status").forEach(
            (status) => setStatus(status, "Очікується")
        );
    }

    function invalidateCompletion() {
        if (!draft.completed) {
            return;
        }

        draft.completed = false;
        elements.completePanel.hidden = true;

        window.dispatchEvent(
            new CustomEvent(
                `${namespace}:calculations-invalidated`
            )
        );
    }

    function handleInput(event) {
        const input = event.target.closest("[data-field]");

        if (!input) {
            return;
        }

        invalidateCompletion();
        input.classList.remove("is-correct", "is-incorrect");
        draft.values[input.dataset.field] = input.value;

        const row = input.closest("tr");
        const status = row?.querySelector(".calculation-status");

        if (status) {
            setStatus(status, "Змінено", "partial");
        }

        updateSummaryValues();
        updateFilledProgress();
        saveDraft();

        setMessage(
            "Після заповнення всіх полів натисніть «Перевірити розрахунки»."
        );
    }

    function validateInput(input, expected, tolerance) {
        const value = parseStudentNumber(input.value);
        const correct = isClose(value, expected, tolerance);

        input.classList.toggle("is-correct", correct);
        input.classList.toggle(
            "is-incorrect",
            value !== null && !correct
        );

        return {
            filled: value !== null,
            correct
        };
    }

    function checkCalculations() {
        if (!isExperimentComplete(experimentProgress)) {
            setMessage(
                "Спочатку завершіть усі дев’ять циклів у розділі 7.",
                "warning"
            );
            return;
        }

        let allFilled = true;
        let allCorrect = true;

        MODES.forEach((mode) => {
            const expected = getExpectedModeValues(mode.id);
            let modeCorrect = true;
            let modeFilled = true;

            expected.cycles.forEach((cycle, cycleIndex) => {
                const durationInput = section.querySelector(
                    `[data-field="${durationField(
                        mode.id,
                        cycleIndex
                    )}"]`
                );
                const dutyInput = section.querySelector(
                    `[data-field="${dutyField(
                        mode.id,
                        cycleIndex
                    )}"]`
                );
                const durationResult = validateInput(
                    durationInput,
                    cycle.duration,
                    DURATION_TOLERANCE
                );
                const dutyResult = validateInput(
                    dutyInput,
                    cycle.dutyCycle,
                    PERCENT_TOLERANCE
                );
                const cycleFilled =
                    durationResult.filled && dutyResult.filled;
                const cycleCorrect =
                    durationResult.correct && dutyResult.correct;
                const status = section.querySelector(
                    `[data-cycle-status="${mode.id}-${cycleIndex + 1}"]`
                );

                setStatus(
                    status,
                    cycleCorrect
                        ? "Правильно"
                        : cycleFilled
                            ? "Перевірте"
                            : "Не заповнено",
                    cycleCorrect
                        ? "correct"
                        : cycleFilled
                            ? "incorrect"
                            : "partial"
                );

                modeFilled = modeFilled && cycleFilled;
                modeCorrect = modeCorrect && cycleCorrect;
            });

            const averageInput = section.querySelector(
                `[data-field="${averageField(mode.id)}"]`
            );
            const averageResult = validateInput(
                averageInput,
                expected.averageDutyCycle,
                PERCENT_TOLERANCE
            );
            const summaryStatus = section.querySelector(
                `[data-mode-status="${mode.id}"]`
            );
            const summaryCorrect =
                modeCorrect && averageResult.correct;
            const summaryFilled =
                modeFilled && averageResult.filled;

            setStatus(
                summaryStatus,
                summaryCorrect
                    ? "Правильно"
                    : summaryFilled
                        ? "Перевірте"
                        : "Не завершено",
                summaryCorrect
                    ? "correct"
                    : summaryFilled
                        ? "incorrect"
                        : "partial"
            );

            allFilled = allFilled && summaryFilled;
            allCorrect = allCorrect && summaryCorrect;
        });

        draft.completed = allCorrect;
        draft.values = Object.fromEntries(
            getInputs().map((input) => [
                input.dataset.field,
                input.value
            ])
        );
        saveDraft();
        updateFilledProgress();

        if (allCorrect) {
            elements.completePanel.hidden = false;
            setMessage(
                "Усі розрахунки правильні. Можна переходити до аналізу результатів.",
                "success"
            );

            window.dispatchEvent(
                new CustomEvent(
                    `${namespace}:calculations-completed`,
                    {
                        detail: {
                            burner: experimentProgress.burner,
                            records: experimentProgress.records,
                            values: draft.values
                        }
                    }
                )
            );
        } else if (!allFilled) {
            elements.completePanel.hidden = true;
            setMessage(
                "Заповніть усі поля таблиць і повторіть перевірку.",
                "warning"
            );
        } else {
            elements.completePanel.hidden = true;
            setMessage(
                "Деякі значення обчислено неправильно. Перевірте позначені поля.",
                "error"
            );
        }
    }

    function resetCalculations() {
        const hasValues = getInputs().some(
            (input) => input.value.trim() !== ""
        );

        if (
            hasValues &&
            !window.confirm(
                "Очистити всі введені розрахунки?"
            )
        ) {
            return;
        }

        getInputs().forEach((input) => {
            input.value = "";
        });

        draft = {
            values: {},
            completed: false,
            signature: experimentSignature
        };

        clearValidationStyles();
        updateSummaryValues();
        updateFilledProgress();
        elements.completePanel.hidden = true;
        saveDraft();

        window.dispatchEvent(
            new CustomEvent(
                `${namespace}:calculations-invalidated`
            )
        );

        setMessage(
            "Розрахунки очищено. Заповніть таблиці повторно."
        );
    }

    function renderReadyWorkspace() {
        const signature = createExperimentSignature(
            experimentProgress
        );

        if (signature !== experimentSignature) {
            experimentSignature = signature;
            draft = readSavedDraft(signature);
            renderCalculationTable();
            renderSummaryTable();
            restoreDraftValues();
            clearValidationStyles();
        }

        elements.completePanel.hidden = !draft.completed;

        if (draft.completed) {
            elements.progress.textContent =
                "Розрахунки завершено";
            setMessage(
                "Розрахунки вже перевірено. Можна переходити до аналізу результатів.",
                "success"
            );
        }
    }

    function updateAccess() {
        experimentProgress = normalizeExperimentProgress(
            experimentStorage.get("progress", {})
        );

        const completedCycles = getCompletedCycleCount(
            experimentProgress
        );
        const ready = isExperimentComplete(
            experimentProgress
        );

        elements.burner.textContent = ready
            ? `Конфорка ${experimentProgress.burner}`
            : "Не визначено";
        elements.cycleCount.textContent =
            `${completedCycles} із 9`;
        elements.lockOverlay.hidden = ready;
        elements.interactiveArea.inert = !ready;
        elements.checkButton.disabled = !ready;
        elements.resetButton.disabled = !ready;

        if (ready) {
            renderReadyWorkspace();
        } else {
            experimentSignature = "";
            elements.progress.textContent =
                "Очікування завершення досліду";
            elements.completePanel.hidden = true;
        }
    }

    function handleExperimentReset() {
        calculationsStorage.remove("progress");
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

    section.addEventListener("input", handleInput);
    elements.checkButton.addEventListener(
        "click",
        checkCalculations
    );
    elements.resetButton.addEventListener(
        "click",
        resetCalculations
    );

    window.addEventListener(
        "lab07:cyclic-experiment-updated",
        updateAccess
    );
    window.addEventListener(
        "lab07:cyclic-experiment-completed",
        updateAccess
    );
    window.addEventListener(
        "lab07:cyclic-experiment-reset",
        handleExperimentReset
    );

    updateAccess();
}
