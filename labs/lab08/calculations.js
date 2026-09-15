import {
    createStorage
} from "../../common/js/storage.js";

import {
    calculateCyclicExperimentResults
} from "./model.js";

const REQUIRED_CYCLE_COUNT = 6;
const REQUIRED_TRIAL_COUNT = 9;
const TOTAL_FIELDS = 9;
const STATE_VERSION = 1;

const ENERGY_TOLERANCE = 0.0000051;
const EFFICIENCY_TOLERANCE = 0.16;

function parseStudentNumber(value) {
    const normalized = String(
        value ?? ""
    )
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

function isFiniteNumber(value) {
    return Number.isFinite(
        Number(value)
    );
}

function isClose(
    value,
    expected,
    tolerance
) {
    return (
        Number.isFinite(value) &&
        Math.abs(
            value - expected
        ) <= tolerance
    );
}

function cycleEnergyField(cycleIndex) {
    return `cycle-energy-${cycleIndex + 1}`;
}

function createInitialDraft(signature = "") {
    return {
        version: STATE_VERSION,
        signature,
        values: {},
        completed: false,
        results: null
    };
}

function normalizeExperimentProgress(value) {
    const setup =
        value?.setup &&
        typeof value.setup === "object"
            ? value.setup
            : {};

    const firstRecords =
        Array.isArray(
            value?.experimentOne?.records
        )
            ? value.experimentOne.records
                .filter(
                    (record) =>
                        isFiniteNumber(record?.voltage) &&
                        isFiniteNumber(record?.current) &&
                        isFiniteNumber(record?.power) &&
                        isFiniteNumber(
                            record?.onTime ??
                            record?.tOn
                        ) &&
                        isFiniteNumber(
                            record?.offTime ??
                            record?.tOff
                        )
                )
                .slice(
                    0,
                    REQUIRED_CYCLE_COUNT
                )
                .map(
                    (
                        record,
                        index
                    ) => ({
                        cycle:
                            Number(record.cycle) ||
                            index + 1,

                        voltage:
                            Number(
                                record.voltage
                            ),

                        current:
                            Number(
                                record.current
                            ),

                        power:
                            Number(
                                record.power
                            ),

                        onTime:
                            Number(
                                record.onTime ??
                                record.tOn
                            ),

                        offTime:
                            Number(
                                record.offTime ??
                                record.tOff
                            )
                    })
                )
            : [];

    const secondRecords =
        Array.isArray(
            value?.experimentTwo?.records
        )
            ? value.experimentTwo.records.slice(
                0,
                REQUIRED_TRIAL_COUNT
            )
            : [];

    const waterMass =
        Number(
            setup.waterMass
        );

    const initialTemperature =
        Number(
            setup.initialTemperature
        );

    const setupValid =
        setup.confirmed === true &&
        Number.isFinite(waterMass) &&
        waterMass > 0 &&
        Number.isFinite(initialTemperature) &&
        initialTemperature < 100;

    const firstCompleted =
        firstRecords.length ===
        REQUIRED_CYCLE_COUNT;

    const secondCompleted =
        secondRecords.length ===
        REQUIRED_TRIAL_COUNT;

    return {
        setup: {
            confirmed:
                setupValid,
            waterMass,
            initialTemperature
        },

        firstRecords,
        secondRecords,

        firstCompleted,
        secondCompleted,

        completed:
            setupValid &&
            firstCompleted &&
            secondCompleted &&
            value?.completed === true
    };
}

function createExperimentSignature(
    experimentProgress
) {
    return JSON.stringify({
        waterMass:
            experimentProgress.setup.waterMass,

        initialTemperature:
            experimentProgress.setup
                .initialTemperature,

        cycles:
            experimentProgress.firstRecords.map(
                (record) => ({
                    cycle:
                        record.cycle,
                    voltage:
                        record.voltage,
                    current:
                        record.current,
                    power:
                        record.power,
                    onTime:
                        record.onTime,
                    offTime:
                        record.offTime
                })
            )
    });
}

export function initializeCalculations({
    root = document,
    namespace = "lab08"
} = {}) {
    const section = root.querySelector(
        "#calculations"
    );

    if (
        !section ||
        section.dataset.initialized === "true"
    ) {
        return;
    }

    const elements = {
        lockOverlay: section.querySelector(
            "#calculations-lock-overlay"
        ),

        interactiveArea: section.querySelector(
            "#calculations-interactive-area"
        ),

        waterMass: section.querySelector(
            "#calculations-water-mass"
        ),

        initialTemperature:
            section.querySelector(
                "#calculations-initial-temperature"
            ),

        cycleCount: section.querySelector(
            "#calculations-cycle-count"
        ),

        progress: section.querySelector(
            "#calculations-progress"
        ),

        tableBody: section.querySelector(
            "#calculations-table-body"
        ),

        totalEnergyInput: section.querySelector(
            "#calculations-total-energy-input"
        ),

        usefulHeatInput: section.querySelector(
            "#calculations-useful-heat-input"
        ),

        efficiencyInput: section.querySelector(
            "#calculations-efficiency-input"
        ),

        totalEnergyStatus: section.querySelector(
            "#calculations-total-energy-status"
        ),

        usefulHeatStatus: section.querySelector(
            "#calculations-useful-heat-status"
        ),

        efficiencyStatus: section.querySelector(
            "#calculations-efficiency-status"
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

    const missingElement =
        Object.entries(elements).find(
            ([, element]) => !element
        );

    if (missingElement) {
        console.warn(
            `Не знайдено елемент розрахункового модуля: ${missingElement[0]}.`
        );

        return;
    }

    section.dataset.initialized = "true";

    const experimentStorage =
        createStorage(
            `${namespace}:experiment`
        );

    const calculationsStorage =
        createStorage(
            `${namespace}:calculations`
        );

    let experimentProgress =
        normalizeExperimentProgress(
            experimentStorage.get(
                "progress",
                {}
            )
        );

    let experimentSignature = "";
    let expectedResults = null;
    let draft = createInitialDraft();

    function readSavedDraft(signature) {
        const saved =
            calculationsStorage.get(
                "progress",
                null
            );

        if (
            !saved ||
            typeof saved !== "object" ||
            saved.version !== STATE_VERSION ||
            saved.signature !== signature
        ) {
            return createInitialDraft(
                signature
            );
        }

        return {
            version: STATE_VERSION,
            signature,

            values:
                saved.values &&
                typeof saved.values === "object"
                    ? saved.values
                    : {},

            completed:
                saved.completed === true,

            results:
                saved.results &&
                typeof saved.results === "object"
                    ? saved.results
                    : null
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
        statusElement,
        text,
        state = "pending"
    ) {
        if (!statusElement) {
            return;
        }

        statusElement.textContent =
            text;
        statusElement.dataset.state =
            state;
    }

    function getInputs() {
        return Array.from(
            section.querySelectorAll(
                "[data-calculation-field]"
            )
        );
    }

    function getStatusForField(field) {
        if (
            field === "total-energy"
        ) {
            return elements.totalEnergyStatus;
        }

        if (
            field === "useful-heat"
        ) {
            return elements.usefulHeatStatus;
        }

        if (
            field === "efficiency"
        ) {
            return elements.efficiencyStatus;
        }

        return null;
    }

    function createCycleInputMarkup(
        cycleIndex
    ) {
        const field =
            cycleEnergyField(
                cycleIndex
            );

        return `
            <input
                class="calculation-input"
                type="text"
                inputmode="decimal"
                autocomplete="off"
                data-calculation-field="${field}"
                aria-label="Енергія циклу ${cycleIndex + 1}, кіловат-година"
                placeholder="0,00000"
            >
        `;
    }

    function renderCalculationTable() {
        if (!expectedResults) {
            elements.tableBody.innerHTML =
                "";

            return;
        }

        elements.tableBody.innerHTML =
            expectedResults.cycles.map(
                (
                    cycle,
                    index
                ) => `
                    <tr>
                        <th scope="row">
                            ${cycle.cycleNumber}
                        </th>

                        <td>
                            <span class="calculation-source-value">
                                ${formatNumber(
                                    cycle.voltage,
                                    1
                                )}
                            </span>
                        </td>

                        <td>
                            <span class="calculation-source-value">
                                ${formatNumber(
                                    cycle.current,
                                    1
                                )}
                            </span>
                        </td>

                        <td>
                            <span class="calculation-source-value">
                                ${formatNumber(
                                    cycle.power,
                                    2
                                )}
                            </span>
                        </td>

                        <td>
                            <span class="calculation-source-value">
                                ${formatNumber(
                                    cycle.onTime,
                                    2
                                )}
                            </span>
                        </td>

                        <td>
                            <span class="calculation-source-value">
                                ${formatNumber(
                                    cycle.offTime,
                                    2
                                )}
                            </span>
                        </td>

                        <td>
                            ${createCycleInputMarkup(
                                index
                            )}
                        </td>

                        <td>
                            <span
                                class="calculation-status"
                                data-cycle-status="${index + 1}"
                                data-state="pending"
                            >
                                Очікується
                            </span>
                        </td>
                    </tr>
                `
            ).join("");
    }

    function restoreDraftValues() {
        getInputs().forEach(
            (input) => {
                const field =
                    input.dataset
                        .calculationField;

                const savedValue =
                    draft.values[field];

                if (
                    savedValue !== undefined &&
                    savedValue !== null
                ) {
                    input.value =
                        String(savedValue);
                }
            }
        );
    }

    function captureDraftValues() {
        draft.values =
            Object.fromEntries(
                getInputs().map(
                    (input) => [
                        input.dataset
                            .calculationField,
                        input.value
                    ]
                )
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

        elements.progress.textContent =
            draft.completed
                ? "Розрахунки завершено"
                : `${filledCount} із ${TOTAL_FIELDS} значень введено`;
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

    function applyCompletedStyles() {
        getInputs().forEach(
            (input) => {
                input.classList.remove(
                    "is-incorrect"
                );

                input.classList.add(
                    "is-correct"
                );
            }
        );

        section.querySelectorAll(
            "[data-cycle-status]"
        ).forEach(
            (status) => {
                setStatus(
                    status,
                    "Правильно",
                    "correct"
                );
            }
        );

        setStatus(
            elements.totalEnergyStatus,
            "Правильно",
            "correct"
        );

        setStatus(
            elements.usefulHeatStatus,
            "Правильно",
            "correct"
        );

        setStatus(
            elements.efficiencyStatus,
            "Правильно",
            "correct"
        );
    }

    function dispatchInvalidatedEvent() {
        document.dispatchEvent(
            new CustomEvent(
                "laboratory:calculations-invalidated",
                {
                    detail: {
                        namespace
                    }
                }
            )
        );
    }

    function invalidateCompletion() {
        if (!draft.completed) {
            return;
        }

        draft.completed = false;
        draft.results = null;

        elements.completePanel.hidden =
            true;

        dispatchInvalidatedEvent();
    }

    function handleInput(event) {
        const input =
            event.target.closest(
                "[data-calculation-field]"
            );

        if (!input) {
            return;
        }

        invalidateCompletion();

        input.classList.remove(
            "is-correct",
            "is-incorrect"
        );

        const field =
            input.dataset
                .calculationField;

        draft.values[field] =
            input.value;

        const row =
            input.closest("tr");

        const rowStatus =
            row?.querySelector(
                ".calculation-status"
            );

        const resultStatus =
            getStatusForField(field);

        if (rowStatus) {
            setStatus(
                rowStatus,
                "Змінено",
                "partial"
            );
        }

        if (resultStatus) {
            setStatus(
                resultStatus,
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
        expected,
        tolerance
    ) {
        const value =
            parseStudentNumber(
                input.value
            );

        const filled =
            value !== null;

        const correct =
            isClose(
                value,
                expected,
                tolerance
            );

        input.classList.toggle(
            "is-correct",
            correct
        );

        input.classList.toggle(
            "is-incorrect",
            filled && !correct
        );

        return {
            value,
            filled,
            correct
        };
    }

    function createStoredResults() {
        return {
            cycles:
                expectedResults.cycles.map(
                    (cycle) => ({
                        cycleNumber:
                            cycle.cycleNumber,
                        energy:
                            cycle.energy
                    })
                ),

            totalElectricalEnergy:
                expectedResults
                    .totalElectricalEnergy,

            usefulHeat:
                expectedResults
                    .usefulHeat,

            thermalEfficiency:
                expectedResults
                    .thermalEfficiency,

            totalOnDuration:
                expectedResults
                    .totalOnDuration,

            totalOffDuration:
                expectedResults
                    .totalOffDuration,

            totalDuration:
                expectedResults
                    .totalDuration
        };
    }

    function checkCalculations() {
        if (
            !experimentProgress.completed ||
            !expectedResults
        ) {
            setMessage(
                "Спочатку завершіть обидва досліди.",
                "warning"
            );

            return;
        }

        let allFilled = true;
        let allCorrect = true;

        expectedResults.cycles.forEach(
            (
                cycle,
                index
            ) => {
                const input =
                    section.querySelector(
                        `[data-calculation-field="${cycleEnergyField(index)}"]`
                    );

                const result =
                    validateInput(
                        input,
                        cycle.energy,
                        ENERGY_TOLERANCE
                    );

                const status =
                    section.querySelector(
                        `[data-cycle-status="${index + 1}"]`
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

                allFilled =
                    allFilled &&
                    result.filled;

                allCorrect =
                    allCorrect &&
                    result.correct;
            }
        );

        const totalEnergyResult =
            validateInput(
                elements.totalEnergyInput,
                expectedResults
                    .totalElectricalEnergy,
                ENERGY_TOLERANCE
            );

        const usefulHeatResult =
            validateInput(
                elements.usefulHeatInput,
                expectedResults.usefulHeat,
                ENERGY_TOLERANCE
            );

        const efficiencyResult =
            validateInput(
                elements.efficiencyInput,
                expectedResults
                    .thermalEfficiency,
                EFFICIENCY_TOLERANCE
            );

        setStatus(
            elements.totalEnergyStatus,

            totalEnergyResult.correct
                ? "Правильно"
                : totalEnergyResult.filled
                    ? "Перевірте"
                    : "Не заповнено",

            totalEnergyResult.correct
                ? "correct"
                : totalEnergyResult.filled
                    ? "incorrect"
                    : "partial"
        );

        setStatus(
            elements.usefulHeatStatus,

            usefulHeatResult.correct
                ? "Правильно"
                : usefulHeatResult.filled
                    ? "Перевірте"
                    : "Не заповнено",

            usefulHeatResult.correct
                ? "correct"
                : usefulHeatResult.filled
                    ? "incorrect"
                    : "partial"
        );

        setStatus(
            elements.efficiencyStatus,

            efficiencyResult.correct
                ? "Правильно"
                : efficiencyResult.filled
                    ? "Перевірте"
                    : "Не заповнено",

            efficiencyResult.correct
                ? "correct"
                : efficiencyResult.filled
                    ? "incorrect"
                    : "partial"
        );

        allFilled =
            allFilled &&
            totalEnergyResult.filled &&
            usefulHeatResult.filled &&
            efficiencyResult.filled;

        allCorrect =
            allCorrect &&
            totalEnergyResult.correct &&
            usefulHeatResult.correct &&
            efficiencyResult.correct;

        captureDraftValues();

        draft.completed =
            allCorrect;

        draft.results =
            allCorrect
                ? createStoredResults()
                : null;

        saveDraft();
        updateFilledProgress();

        if (allCorrect) {
            elements.completePanel.hidden =
                false;

            setMessage(
                "Усі розрахунки правильні. Можна переходити до аналізу результатів.",
                "success"
            );

            document.dispatchEvent(
                new CustomEvent(
                    "laboratory:calculations-completed",
                    {
                        detail: {
                            namespace,
                            results:
                                draft.results,
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

        dispatchInvalidatedEvent();

        if (!allFilled) {
            setMessage(
                "Заповніть усі дев’ять полів і повторіть перевірку.",
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
                    input.value.trim() !== ""
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
                input.value = "";
            }
        );

        draft =
            createInitialDraft(
                experimentSignature
            );

        clearValidationStyles();
        updateFilledProgress();

        elements.completePanel.hidden =
            true;

        saveDraft();
        dispatchInvalidatedEvent();

        setMessage(
            "Розрахунки очищено. Заповніть таблицю повторно."
        );
    }

    function renderReadyWorkspace() {
        try {
            expectedResults =
                calculateCyclicExperimentResults({
                    cycles:
                        experimentProgress
                            .firstRecords,

                    waterMass:
                        experimentProgress
                            .setup
                            .waterMass,

                    initialTemperature:
                        experimentProgress
                            .setup
                            .initialTemperature
                });
        } catch (error) {
            console.error(error);

            expectedResults = null;

            setMessage(
                error.message ||
                "Не вдалося обробити результати досліду.",
                "error"
            );

            return;
        }

        const signature =
            createExperimentSignature(
                experimentProgress
            );

        if (
            signature !==
            experimentSignature
        ) {
            experimentSignature =
                signature;

            draft =
                readSavedDraft(
                    signature
                );

            renderCalculationTable();
            restoreDraftValues();

            if (draft.completed) {
                applyCompletedStyles();
            } else {
                clearValidationStyles();
            }
        }

        elements.completePanel.hidden =
            !draft.completed;

        updateFilledProgress();

        if (draft.completed) {
            setMessage(
                "Розрахунки вже перевірено. Можна переходити до аналізу результатів.",
                "success"
            );
        }
    }

    function updateAccess() {
        experimentProgress =
            normalizeExperimentProgress(
                experimentStorage.get(
                    "progress",
                    {}
                )
            );

        const completedCycles =
            experimentProgress
                .firstRecords
                .length;

        const ready =
            experimentProgress.completed;

        elements.waterMass.textContent =
            experimentProgress.setup.confirmed
                ? `${formatNumber(
                    experimentProgress
                        .setup
                        .waterMass,
                    3
                )} кг`
                : "Не визначено";

        elements.initialTemperature.textContent =
            experimentProgress.setup.confirmed
                ? `${formatNumber(
                    experimentProgress
                        .setup
                        .initialTemperature,
                    1
                )} °C`
                : "Не визначено";

        elements.cycleCount.textContent =
            `${completedCycles} із ${REQUIRED_CYCLE_COUNT}`;

        elements.lockOverlay.hidden =
            ready;

        elements.interactiveArea.inert =
            !ready;

        elements.checkButton.disabled =
            !ready;

        elements.resetButton.disabled =
            !ready;

        if (ready) {
            renderReadyWorkspace();

            return;
        }

        expectedResults = null;
        experimentSignature = "";

        elements.progress.textContent =
            "Очікування завершення дослідів";

        elements.completePanel.hidden =
            true;
    }

    function handleExperimentReset() {
        calculationsStorage.remove(
            "progress"
        );

        draft =
            createInitialDraft();

        expectedResults = null;
        experimentSignature = "";

        dispatchInvalidatedEvent();
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

    document.addEventListener(
        "laboratory:experiment-progress",
        updateAccess
    );

    document.addEventListener(
        "laboratory:experiment-completed",
        updateAccess
    );

    document.addEventListener(
        "laboratory:experiment-reset",
        handleExperimentReset
    );

    updateAccess();
}