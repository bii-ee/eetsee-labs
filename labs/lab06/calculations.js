import {
    LAB06_EXPERIMENT_MODES,
    LAB06_EXPERIMENT_STORAGE_KEY
} from "./data.js";

const CALCULATION_STORAGE_KEY =
    "eetsee.lab06.calculations.v1";

const CALCULATION_COMPLETED_KEY =
    "eetsee.lab06.calculations.completed.v1";

const EPSILON = 1e-9;

const CALCULATION_FIELDS = [
    {
        key: "voltageRegulation",
        tolerance: 0.005
    },
    {
        key: "apparentPower",
        tolerance: 2
    },
    {
        key: "cosPhi1p",
        tolerance: 0.005
    },
    {
        key: "nuP",
        tolerance: 0.005
    },
    {
        key: "chiP",
        tolerance: 0.005
    },
    {
        key: "firstHarmonicCurrent",
        tolerance: 0.02
    },
    {
        key: "reactivePower",
        tolerance: 2
    },
    {
        key: "distortionPower",
        tolerance: 2
    },
    {
        key: "currentDistortionFactor",
        tolerance: 0.005
    },
    {
        key: "powerFactor",
        tolerance: 0.005
    },
    {
        key: "harmonicDistortionFactor",
        tolerance: 0.02
    }
];

function degreesToRadians(degrees) {
    return (degrees * Math.PI) / 180;
}

function parseStudentNumber(value) {
    const normalizedValue = value
        .trim()
        .replace(/\s+/g, "")
        .replace(",", ".");

    if (normalizedValue === "") {
        return null;
    }

    const number = Number(normalizedValue);

    return Number.isFinite(number)
        ? number
        : null;
}

function formatNumber(value, digits = 2) {
    return new Intl.NumberFormat("uk-UA", {
        minimumFractionDigits: 0,
        maximumFractionDigits: digits
    }).format(value);
}

function escapeAttribute(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll('"', "&quot;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

function readJsonStorage(key, fallback = {}) {
    try {
        const storedValue = localStorage.getItem(key);

        return storedValue
            ? JSON.parse(storedValue)
            : fallback;
    } catch (error) {
        console.warn(
            "Помилка читання локальних даних.",
            error
        );

        return fallback;
    }
}

function writeJsonStorage(key, value) {
    try {
        localStorage.setItem(
            key,
            JSON.stringify(value)
        );
    } catch (error) {
        console.warn(
            "Помилка збереження локальних даних.",
            error
        );
    }
}

function calculateExpectedValues(mode, record) {
    const alphaDegrees =
        Number.isFinite(Number(record.alpha))
            ? Number(record.alpha)
            : mode.alpha;

    const alpha = degreesToRadians(alphaDegrees);
    const u1 = Number(record.u1);
    const current = Number(record.current);
    const power = Number(record.power);
    const u2 = Number(record.u2);

    const phaseTerm =
        Math.PI -
        alpha +
        Math.sin(2 * alpha) / 2;

    const coefficientTerm =
        Math.sin(alpha) ** 4 +
        phaseTerm ** 2;

    if (
        [u1, current, power, u2].some(
            (value) =>
                !Number.isFinite(value) ||
                value < 0
        ) ||
        u1 <= EPSILON ||
        current <= EPSILON ||
        phaseTerm <= EPSILON ||
        coefficientTerm <= EPSILON
    ) {
        throw new Error(
            `Некоректні вихідні дані для режиму ${mode.position}.`
        );
    }

    const cosPhi1p =
        phaseTerm /
        Math.sqrt(coefficientTerm);

    const nuP = Math.sqrt(
        coefficientTerm /
        (Math.PI * phaseTerm)
    );

    const chiP = Math.sqrt(
        phaseTerm / Math.PI
    );

    const apparentPower =
        u1 * current;

    const voltageRegulation =
        u2 / u1;

    const firstHarmonicCurrent =
        power /
        (u1 * cosPhi1p);

    if (
        firstHarmonicCurrent >
        current + 1e-6
    ) {
        throw new Error(
            `Для режиму ${mode.position} отримано I₁ > I. Перевірте експериментальні дані.`
        );
    }

    const sinPhi1p = Math.sqrt(
        Math.max(
            0,
            1 - cosPhi1p ** 2
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

    return {
        voltageRegulation,
        apparentPower,
        cosPhi1p,
        nuP,
        chiP,
        firstHarmonicCurrent,
        reactivePower,
        distortionPower,
        currentDistortionFactor,
        powerFactor,
        harmonicDistortionFactor
    };
}

function isValueCorrect(
    studentValue,
    expectedValue,
    tolerance
) {
    return (
        Number.isFinite(studentValue) &&
        Math.abs(
            studentValue - expectedValue
        ) <= tolerance
    );
}

export function initializeCalculations() {
    const section =
        document.querySelector("#calculations");

    if (!section) {
        return;
    }

    const readiness = section.querySelector(
        "#calculation-readiness"
    );

    const readinessTitle = section.querySelector(
        "#calculation-readiness-title"
    );

    const readinessText = section.querySelector(
        "#calculation-readiness-text"
    );

    const workspace = section.querySelector(
        "#calculation-workspace"
    );

    const tableBody = section.querySelector(
        "#student-calculation-table-body"
    );

    const saveButton = section.querySelector(
        "#save-calculation-draft"
    );

    const checkButton = section.querySelector(
        "#check-calculations"
    );

    const resetButton = section.querySelector(
        "#reset-calculations"
    );

    const resultMessage = section.querySelector(
        "#calculation-result-message"
    );

    let experimentRecords = {};

    let studentDraft = readJsonStorage(
        CALCULATION_STORAGE_KEY,
        {}
    );

    function getCompletedExperimentCount() {
        return LAB06_EXPERIMENT_MODES.filter(
            (mode) =>
                Boolean(
                    experimentRecords[mode.id]
                )
        ).length;
    }

    function renderReadiness() {
        experimentRecords = readJsonStorage(
            LAB06_EXPERIMENT_STORAGE_KEY,
            {}
        );

        const completedCount =
            getCompletedExperimentCount();

        const isReady =
            completedCount ===
            LAB06_EXPERIMENT_MODES.length;

        readiness.classList.toggle(
            "is-ready",
            isReady
        );

        readinessTitle.textContent = isReady
            ? "Вимірювання готові до оброблення"
            : "Спочатку завершіть вимірювання";

        readinessText.textContent = isReady
            ? "Записано 3 із 3 режимів. Заповніть розрахункову частину таблиці самостійно."
            : `Записано ${completedCount} із 3 режимів. Поверніться до розділу 7.`;

        workspace.hidden = !isReady;

        if (isReady) {
            renderTable();
        }
    }

    function createInput(modeId, fieldKey) {
        const storedValue =
            studentDraft[modeId]?.[fieldKey] ??
            "";

        return `
            <input
                class="calculation-input"
                type="text"
                inputmode="decimal"
                autocomplete="off"
                data-mode-id="${modeId}"
                data-field="${fieldKey}"
                value="${escapeAttribute(storedValue)}"
                placeholder="0,000"
                aria-label="Введіть розраховане значення"
            >
        `;
    }

    function renderTable() {
        tableBody.innerHTML =
            LAB06_EXPERIMENT_MODES.map(
                (mode) => {
                    const record =
                        experimentRecords[mode.id];

                    return `
                        <tr>
                            <th scope="row">
                                ${mode.position}
                            </th>

                            <td>
                                ${formatNumber(
                        record.alpha ??
                        mode.alpha,
                        0
                    )}
                            </td>

                            <td>
                                ${formatNumber(
                        record.u1,
                        1
                    )}
                            </td>

                            <td>
                                ${formatNumber(
                        record.current,
                        2
                    )}
                            </td>

                            <td>
                                ${formatNumber(
                        record.power,
                        1
                    )}
                            </td>

                            <td>
                                ${formatNumber(
                        record.u2,
                        1
                    )}
                            </td>

                            <td>
                                ${createInput(
                        mode.id,
                        "voltageRegulation"
                    )}
                            </td>

                            <td>
                                ${createInput(
                        mode.id,
                        "apparentPower"
                    )}
                            </td>

                            <td>
                                ${createInput(
                        mode.id,
                        "cosPhi1p"
                    )}
                            </td>

                            <td>
                                ${createInput(
                        mode.id,
                        "nuP"
                    )}
                            </td>

                            <td>
                                ${createInput(
                        mode.id,
                        "chiP"
                    )}
                            </td>

                            <td>
                                ${createInput(
                        mode.id,
                        "firstHarmonicCurrent"
                    )}
                            </td>

                            <td>
                                ${createInput(
                        mode.id,
                        "reactivePower"
                    )}
                            </td>

                            <td>
                                ${createInput(
                        mode.id,
                        "distortionPower"
                    )}
                            </td>

                            <td>
                                ${createInput(
                        mode.id,
                        "currentDistortionFactor"
                    )}
                            </td>

                            <td>
                                ${createInput(
                        mode.id,
                        "powerFactor"
                    )}
                            </td>

                            <td>
                                ${createInput(
                        mode.id,
                        "harmonicDistortionFactor"
                    )}
                            </td>
                        </tr>
                    `;
                }
            ).join("");
    }

    function collectDraft() {
        const draft = {};

        tableBody.querySelectorAll(
            ".calculation-input"
        ).forEach((input) => {
            const modeId =
                input.dataset.modeId;

            const field =
                input.dataset.field;

            draft[modeId] ??= {};
            draft[modeId][field] =
                input.value.trim();
        });

        studentDraft = draft;

        writeJsonStorage(
            CALCULATION_STORAGE_KEY,
            draft
        );

        return draft;
    }

    function clearValidationStyles() {
        tableBody.querySelectorAll(
            ".calculation-input"
        ).forEach((input) => {
            input.classList.remove(
                "is-correct",
                "is-incorrect"
            );

            input.removeAttribute(
                "aria-invalid"
            );
        });
    }

    function saveDraft() {
        collectDraft();
        clearValidationStyles();

        resultMessage.dataset.type =
            "saved";

        resultMessage.textContent =
            "Чернетку розрахунків збережено у браузері.";
    }

    function checkCalculations() {
        collectDraft();

        let correctCount = 0;
        let filledCount = 0;

        const totalCount =
            LAB06_EXPERIMENT_MODES.length *
            CALCULATION_FIELDS.length;

        LAB06_EXPERIMENT_MODES.forEach(
            (mode) => {
                const record =
                    experimentRecords[mode.id];

                const expected =
                    calculateExpectedValues(
                        mode,
                        record
                    );

                CALCULATION_FIELDS.forEach(
                    (field) => {
                        const input =
                            tableBody.querySelector(
                                `[data-mode-id="${mode.id}"][data-field="${field.key}"]`
                            );

                        const studentValue =
                            parseStudentNumber(
                                input.value
                            );

                        const isFilled =
                            studentValue !== null;

                        const isCorrect =
                            isValueCorrect(
                                studentValue,
                                expected[field.key],
                                field.tolerance
                            );

                        if (isFilled) {
                            filledCount += 1;
                        }

                        if (isCorrect) {
                            correctCount += 1;
                        }

                        input.classList.toggle(
                            "is-correct",
                            isCorrect
                        );

                        input.classList.toggle(
                            "is-incorrect",
                            isFilled &&
                            !isCorrect
                        );

                        if (
                            isFilled &&
                            !isCorrect
                        ) {
                            input.setAttribute(
                                "aria-invalid",
                                "true"
                            );
                        } else {
                            input.removeAttribute(
                                "aria-invalid"
                            );
                        }
                    }
                );
            }
        );

        const allCorrect =
            correctCount === totalCount;

        if (allCorrect) {
            localStorage.setItem(
                CALCULATION_COMPLETED_KEY,
                "true"
            );

            resultMessage.dataset.type =
                "success";

            resultMessage.textContent =
                `Усі ${totalCount} значення розраховано правильно.`;

            window.dispatchEvent(
                new CustomEvent(
                    "lab06:calculations-completed"
                )
            );

            return;
        }

        localStorage.removeItem(
            CALCULATION_COMPLETED_KEY
        );
        window.dispatchEvent(
            new CustomEvent(
                "lab06:calculations-invalidated"
            )
        );

        resultMessage.dataset.type =
            "error";

        if (filledCount < totalCount) {
            resultMessage.textContent =
                `Заповнено ${filledCount} із ${totalCount} полів. Правильних значень: ${correctCount}.`;
        } else {
            resultMessage.textContent =
                `Правильних значень: ${correctCount} із ${totalCount}. Перевірте поля, позначені червоним.`;
        }
    }

    function resetCalculations() {
        const shouldReset =
            window.confirm(
                "Очистити всі введені розрахункові значення?"
            );

        if (!shouldReset) {
            return;
        }

        studentDraft = {};

        localStorage.removeItem(
            CALCULATION_STORAGE_KEY
        );

        localStorage.removeItem(
            CALCULATION_COMPLETED_KEY
        );

        renderTable();

        resultMessage.dataset.type =
            "default";

        resultMessage.textContent =
            "Розрахункові поля очищено.";
    }

    tableBody.addEventListener(
        "input",
        (event) => {
            if (
                !event.target.matches(
                    ".calculation-input"
                )
            ) {
                return;
            }

            event.target.classList.remove(
                "is-correct",
                "is-incorrect"
            );

            event.target.removeAttribute(
                "aria-invalid"
            );

            localStorage.removeItem(
                CALCULATION_COMPLETED_KEY
            );

            window.dispatchEvent(
                new CustomEvent(
                    "lab06:calculations-invalidated"
                )
            );

            resultMessage.dataset.type =
                "default";

            resultMessage.textContent =
                "Значення змінено. Виконайте повторну перевірку розрахунків.";
        }
    );

    saveButton.addEventListener(
        "click",
        saveDraft
    );

    checkButton.addEventListener(
        "click",
        checkCalculations
    );

    resetButton.addEventListener(
        "click",
        resetCalculations
    );

    window.addEventListener(
        "lab06:experiment-completed",
        renderReadiness
    );

    renderReadiness();
}