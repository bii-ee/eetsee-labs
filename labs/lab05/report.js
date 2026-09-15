import {
    LAB05_EXPERIMENT_CONDITIONS,
    LAB05_EXPERIMENT_RUNS,
    LAB05_EXPERIMENT_STORAGE_KEY,
    LAB05_TOTAL_EXPERIMENTS,
    LAB05_VERIFIED_CALCULATIONS_STORAGE_KEY
} from "./data.js";

import { formatNumber } from "./model.js";
import { createStorage } from "../../common/js/storage.js";

const QUIZ_TOTAL = 8;
const LAB05_ANALYSIS_STORAGE_KEY = "eetsee.lab05.analysis.v2";
const LAB05_QUIZ_STORAGE_KEY = "eetsee.lab05.quiz.v2";
const LAB05_REPORT_STORAGE_KEY = "eetsee.lab05.report.v2";

const CHARTS = Object.freeze([
    Object.freeze({
        selector: "#chart-current-voltage",
        caption: "Рисунок 1. Залежність сили струму від напруги"
    }),
    Object.freeze({
        selector: "#chart-power-voltage",
        caption: "Рисунок 2. Залежність активної потужності від напруги"
    }),
    Object.freeze({
        selector: "#chart-time-voltage",
        caption: "Рисунок 3. Тривалість нагрівання води"
    }),
    Object.freeze({
        selector: "#chart-energy-voltage",
        caption: "Рисунок 4. Витрати електричної енергії"
    })
]);

const CONCLUSIONS = Object.freeze([
    Object.freeze({
        key: "electricalCharacteristicsConclusion",
        title: "Електричні характеристики нагрівачів"
    }),
    Object.freeze({
        key: "heatingTimeConclusion",
        title: "Тривалість нагрівання води"
    }),
    Object.freeze({
        key: "energyConsumptionConclusion",
        title: "Витрати електричної енергії"
    })
]);

function isFiniteNumber(value) {
    return Number.isFinite(Number(value));
}

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

function energyField(experimentId) {
    return `energy-${experimentId}`;
}

function normalizeExperimentProgress(value) {
    const normalized = {
        records: {}
    };

    LAB05_EXPERIMENT_RUNS.forEach((experiment) => {
        const sourceRecord = value?.records?.[experiment.id];

        if (!sourceRecord || sourceRecord.completed !== true) {
            return;
        }

        const requiredValues = [
            sourceRecord.actualVoltageV,
            sourceRecord.currentA,
            sourceRecord.activePowerW,
            sourceRecord.boilingTimeSeconds,
            sourceRecord.boilingTimeMinutes
        ];

        if (!requiredValues.every(isFiniteNumber)) {
            return;
        }

        normalized.records[experiment.id] = {
            experimentId: experiment.id,
            heaterId: experiment.heaterId,
            heaterNumber: experiment.heaterNumber,
            targetVoltageV: Number(experiment.targetVoltageV),
            actualVoltageV: Number(sourceRecord.actualVoltageV),
            currentA: Number(sourceRecord.currentA),
            activePowerW: Number(sourceRecord.activePowerW),
            boilingTimeSeconds: Number(
                sourceRecord.boilingTimeSeconds
            ),
            boilingTimeMinutes: Number(
                sourceRecord.boilingTimeMinutes
            ),
            completed: true
        };
    });

    return normalized;
}

function isExperimentComplete(progress) {
    return LAB05_EXPERIMENT_RUNS.every(
        (experiment) =>
            progress.records[experiment.id]?.completed === true
    );
}

function createExperimentSignature(progress) {
    return JSON.stringify(
        LAB05_EXPERIMENT_RUNS.map((experiment) => {
            const record = progress.records[experiment.id];

            if (!record) {
                return {
                    id: experiment.id,
                    completed: false
                };
            }

            return {
                id: experiment.id,
                heaterId: record.heaterId,
                targetVoltageV: record.targetVoltageV,
                actualVoltageV: record.actualVoltageV,
                currentA: record.currentA,
                activePowerW: record.activePowerW,
                boilingTimeMinutes: record.boilingTimeMinutes,
                completed: true
            };
        })
    );
}

function normalizeCalculationProgress(value) {
    return {
        values:
            value?.values && typeof value.values === "object"
                ? value.values
                : {},
        completed: value?.completed === true,
        signature:
            typeof value?.signature === "string"
                ? value.signature
                : ""
    };
}

function calculationsAreReady(experiment, calculations) {
    if (
        !isExperimentComplete(experiment) ||
        calculations.completed !== true ||
        calculations.signature !==
            createExperimentSignature(experiment)
    ) {
        return false;
    }

    return LAB05_EXPERIMENT_RUNS.every(
        (run) =>
            parseStudentNumber(
                calculations.values[energyField(run.id)]
            ) !== null
    );
}

function createAnalysisSignature(experiment, calculations) {
    return JSON.stringify({
        experiment: createExperimentSignature(experiment),
        energy: LAB05_EXPERIMENT_RUNS.map((run) => ({
            id: run.id,
            value: parseStudentNumber(
                calculations.values[energyField(run.id)]
            )
        }))
    });
}

function buildReportData(experiment, calculations) {
    return LAB05_EXPERIMENT_RUNS.map((run) => ({
        ...experiment.records[run.id],
        electricalEnergyWh: parseStudentNumber(
            calculations.values[energyField(run.id)]
        )
    }));
}

function createFunctionalScheme() {
    return `
        <svg
            viewBox="0 0 980 310"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Функціональна схема установки для дослідження електродного нагрівача"
        >
            <defs>
                <marker
                    id="lab05-report-arrow"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="7"
                    markerHeight="7"
                    orient="auto-start-reverse"
                >
                    <path
                        d="M 0 0 L 10 5 L 0 10 z"
                        fill="#6b3825"
                    />
                </marker>

                <linearGradient
                    id="lab05-report-water"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                >
                    <stop
                        offset="0"
                        stop-color="#a6deed"
                    />

                    <stop
                        offset="1"
                        stop-color="#7bc5dc"
                    />
                </linearGradient>
            </defs>

            <style>
                .report-scheme-box {
                    fill: #f8fbfc;
                    stroke: #7896a4;
                    stroke-width: 2;
                }

                .report-scheme-copper-box {
                    fill: #fcf4ef;
                    stroke: #9f664b;
                    stroke-width: 2;
                }

                .report-scheme-meter-box {
                    fill: #ffffff;
                    stroke: #2f7e93;
                    stroke-width: 2;
                }

                .report-scheme-line {
                    fill: none;
                    stroke: #6b3825;
                    stroke-width: 3;
                    marker-end: url(#lab05-report-arrow);
                }

                .report-scheme-branch {
                    fill: none;
                    stroke: #7896a4;
                    stroke-width: 2;
                    stroke-dasharray: 7 6;
                    marker-end: url(#lab05-report-arrow);
                }

                .report-scheme-title {
                    fill: #15384d;
                    font: 700 17px Arial, sans-serif;
                    text-anchor: middle;
                }

                .report-scheme-label {
                    fill: #526b7b;
                    font: 13px Arial, sans-serif;
                    text-anchor: middle;
                }
            </style>

            <rect
                class="report-scheme-box"
                x="24"
                y="52"
                width="138"
                height="82"
                rx="12"
            />

            <text
                class="report-scheme-title"
                x="93"
                y="84"
            >
                Мережа ~220 В
            </text>

            <text
                class="report-scheme-label"
                x="93"
                y="110"
            >
                живлення установки
            </text>

            <rect
                class="report-scheme-box"
                x="205"
                y="52"
                width="128"
                height="82"
                rx="12"
            />

            <text
                class="report-scheme-title"
                x="269"
                y="84"
            >
                Вимикач K
            </text>

            <text
                class="report-scheme-label"
                x="269"
                y="110"
            >
                комутація кола
            </text>

            <rect
                class="report-scheme-copper-box"
                x="376"
                y="52"
                width="150"
                height="82"
                rx="12"
            />

            <text
                class="report-scheme-title"
                x="451"
                y="84"
            >
                ЛАТР
            </text>

            <text
                class="report-scheme-label"
                x="451"
                y="110"
            >
                регулювання напруги
            </text>

            <rect
                class="report-scheme-meter-box"
                x="569"
                y="52"
                width="156"
                height="82"
                rx="12"
            />

            <text
                class="report-scheme-title"
                x="647"
                y="84"
            >
                PV · PA · PW
            </text>

            <text
                class="report-scheme-label"
                x="647"
                y="110"
            >
                U, I та P
            </text>

            <rect
                class="report-scheme-copper-box"
                x="768"
                y="34"
                width="184"
                height="118"
                rx="12"
            />

            <text
                class="report-scheme-title"
                x="860"
                y="66"
            >
                Нагрівач 1 / 2
            </text>

            <rect
                x="808"
                y="82"
                width="104"
                height="52"
                rx="5"
                fill="url(#lab05-report-water)"
                stroke="#667983"
                stroke-width="3"
            />

            <rect
                x="854"
                y="71"
                width="12"
                height="48"
                rx="4"
                fill="#9f5a37"
            />

            <text
                class="report-scheme-label"
                x="860"
                y="148"
            >
                нагрівання води
            </text>

            <path
                class="report-scheme-line"
                d="M 162 93 H 197"
            />

            <path
                class="report-scheme-line"
                d="M 333 93 H 368"
            />

            <path
                class="report-scheme-line"
                d="M 526 93 H 561"
            />

            <path
                class="report-scheme-line"
                d="M 725 93 H 760"
            />

            <rect
                class="report-scheme-meter-box"
                x="260"
                y="218"
                width="190"
                height="62"
                rx="12"
            />

            <text
                class="report-scheme-title"
                x="355"
                y="244"
            >
                Секундомір
            </text>

            <text
                class="report-scheme-label"
                x="355"
                y="266"
            >
                тривалість нагрівання t
            </text>

            <rect
                class="report-scheme-meter-box"
                x="570"
                y="218"
                width="190"
                height="62"
                rx="12"
            />

            <text
                class="report-scheme-title"
                x="665"
                y="244"
            >
                Термометр
            </text>

            <text
                class="report-scheme-label"
                x="665"
                y="266"
            >
                температура води T
            </text>

            <path
                class="report-scheme-branch"
                d="M 860 152 V 188 H 355 V 210"
            />

            <path
                class="report-scheme-branch"
                d="M 860 152 V 188 H 665 V 210"
            />
        </svg>
    `;
}

function cloneReportCharts(target) {
    target.replaceChildren();

    CHARTS.forEach(({ selector, caption }) => {
        const source = document.querySelector(selector);
        const svg = source?.querySelector("svg");
        const legend = source?.querySelector(
            ".analysis-chart-legend"
        );

        if (!svg) {
            return;
        }

        const figure = document.createElement("figure");
        const figureCaption =
            document.createElement("figcaption");
        const clonedSvg = svg.cloneNode(true);
        const clonedLegend =
            legend?.cloneNode(true) ?? null;

        figure.className = "report-chart";
        figureCaption.textContent = caption;

        clonedSvg.removeAttribute("width");
        clonedSvg.removeAttribute("height");

        clonedSvg
            .querySelectorAll("[tabindex]")
            .forEach((element) => {
                element.removeAttribute("tabindex");
            });

        figure.append(
            figureCaption,
            clonedSvg
        );

        if (clonedLegend) {
            figure.append(clonedLegend);
        }

        target.append(figure);
    });
}

function createPrintCopy(reportDocument) {
    document.querySelector("#lab-print-root")?.remove();

    const printRoot = document.createElement("div");
    const reportCopy = reportDocument.cloneNode(true);

    printRoot.id = "lab-print-root";
    reportCopy.hidden = false;
    reportCopy.removeAttribute("hidden");
    printRoot.append(reportCopy);
    document.body.append(printRoot);

    return printRoot;
}

function clearStorageNamespace(storageNamespace) {
    const prefix = `${storageNamespace}:`;

    Object.keys(localStorage)
        .filter((key) => key.startsWith(prefix))
        .forEach((key) => {
            localStorage.removeItem(key);
        });
}

export function initializeReport({
    root = document,
    namespace = "lab05"
} = {}) {
    const section = root.querySelector("#questions");

    if (
        !section ||
        section.dataset.reportInitialized === "true"
    ) {
        return;
    }

    const elements = {
        panel: section.querySelector(
            "#final-report-panel"
        ),
        readiness: section.querySelector(
            "#report-readiness"
        ),
        form: section.querySelector(
            "#student-report-form"
        ),
        printButton: section.querySelector(
            "#print-report"
        ),
        resetButton: section.querySelector(
            "#reset-lab"
        ),
        document: section.querySelector(
            "#report-document"
        ),
        studentName: section.querySelector(
            "#report-student-name"
        ),
        studentGroup: section.querySelector(
            "#report-student-group"
        ),
        studentBrigade: section.querySelector(
            "#report-student-brigade"
        ),
        date: section.querySelector(
            "#report-date"
        ),
        schematic: section.querySelector(
            "#report-schematic"
        ),
        heatCarrier: section.querySelector(
            "#report-heat-carrier"
        ),
        waterVolume: section.querySelector(
            "#report-water-volume"
        ),
        initialTemperature: section.querySelector(
            "#report-initial-temperature"
        ),
        finalTemperature: section.querySelector(
            "#report-final-temperature"
        ),
        experimentBody: section.querySelector(
            "#report-experiment-body"
        ),
        calculationBody: section.querySelector(
            "#report-calculation-body"
        ),
        charts: section.querySelector(
            "#report-charts"
        ),
        conclusions: section.querySelector(
            "#report-conclusions"
        ),
        quizScore: section.querySelector(
            "#report-quiz-score"
        )
    };

    if (
        Object.values(elements).some(
            (element) => !element
        )
    ) {
        console.warn(
            "Не знайдено елементи підсумкового звіту ЛР5."
        );
        return;
    }

    section.dataset.reportInitialized = "true";

    const experimentStorage = createStorage(
        LAB05_EXPERIMENT_STORAGE_KEY
    );
    const calculationsStorage = createStorage(
        LAB05_VERIFIED_CALCULATIONS_STORAGE_KEY
    );
    const analysisStorage = createStorage(
        LAB05_ANALYSIS_STORAGE_KEY
    );
    const quizStorage = createStorage(
        LAB05_QUIZ_STORAGE_KEY
    );
    const reportStorage = createStorage(
        LAB05_REPORT_STORAGE_KEY
    );

    const studentInputs = {
        name:
            elements.form.elements.namedItem(
                "studentName"
            ),
        group:
            elements.form.elements.namedItem(
                "studentGroup"
            ),
        brigade:
            elements.form.elements.namedItem(
                "studentBrigade"
            )
    };

    let currentData = null;

    function setReadiness(
        text,
        state = "default"
    ) {
        elements.readiness.textContent = text;
        elements.readiness.dataset.state = state;
    }

    function getStateSnapshot() {
        const experiment =
            normalizeExperimentProgress(
                experimentStorage.get(
                    "progress",
                    {}
                )
            );

        const calculations =
            normalizeCalculationProgress(
                calculationsStorage.get(
                    "progress",
                    {}
                )
            );

        const analysis =
            analysisStorage.get(
                "progress",
                {}
            );

        const quiz =
            quizStorage.get(
                "progress",
                {}
            );

        const calculationReady =
            calculationsAreReady(
                experiment,
                calculations
            );

        const analysisSignature =
            calculationReady
                ? createAnalysisSignature(
                    experiment,
                    calculations
                )
                : "";

        const ready =
            calculationReady &&
            analysis?.completed === true &&
            analysis?.signature ===
                analysisSignature &&
            quiz?.passed === true &&
            quiz?.analysisSignature ===
                analysisSignature &&
            Number(quiz?.score) >= 6;

        return {
            experiment,
            calculations,
            analysis,
            quiz,
            analysisSignature,
            ready
        };
    }

    function restoreStudentData() {
        const stored = reportStorage.get(
            "progress",
            {}
        );

        studentInputs.name.value =
            stored?.student?.name ?? "";

        studentInputs.group.value =
            stored?.student?.group ?? "";

        studentInputs.brigade.value =
            stored?.student?.brigade ?? "";
    }

    function updateStudentFieldValidity(input) {
        const value = input.value.trim();

        input.setCustomValidity("");

        if (input === studentInputs.name) {
            if (value === "") {
                input.setCustomValidity(
                    "Введіть прізвище, ім’я та по батькові."
                );
            } else if (value.length < 5) {
                input.setCustomValidity(
                    "ПІБ має містити щонайменше 5 символів."
                );
            }
        }

        if (
            input === studentInputs.group &&
            value === ""
        ) {
            input.setCustomValidity(
                "Введіть назву навчальної групи."
            );
        }
    }

    function validateStudentFields() {
        [
            studentInputs.name,
            studentInputs.group
        ].forEach(
            updateStudentFieldValidity
        );

        return elements.form.reportValidity();
    }

    function hideGeneratedReport() {
        currentData = null;
        elements.document.hidden = true;
        elements.printButton.disabled = true;
    }

    function updateAccess() {
        const snapshot = getStateSnapshot();

        elements.panel.hidden = !snapshot.ready;

        if (!snapshot.ready) {
            hideGeneratedReport();
            return;
        }

        setReadiness(
            `Тест пройдено: ${snapshot.quiz.score} із ${QUIZ_TOTAL}. ` +
            "Введіть дані студента та сформуйте звіт.",
            "success"
        );
    }

    function renderExperimentTable(data) {
        elements.experimentBody.innerHTML =
            data
                .map((record, index) => {
                    const firstHeaterRow =
                        index === 0 ||
                        data[index - 1].heaterId !==
                            record.heaterId;

                    return `
                        <tr>
                            ${
                                firstHeaterRow
                                    ? `<th scope="rowgroup" rowspan="3">№${record.heaterNumber}</th>`
                                    : ""
                            }

                            <td>
                                ${formatNumber(
                                    record.targetVoltageV,
                                    0
                                )}
                            </td>

                            <td>
                                ${formatNumber(
                                    record.actualVoltageV,
                                    1
                                )}
                            </td>

                            <td>
                                ${formatNumber(
                                    record.currentA,
                                    2
                                )}
                            </td>

                            <td>
                                ${formatNumber(
                                    record.activePowerW,
                                    0
                                )}
                            </td>

                            <td>
                                ${formatNumber(
                                    LAB05_EXPERIMENT_CONDITIONS
                                        .initialTemperatureC,
                                    0
                                )}
                            </td>

                            <td>
                                ${formatNumber(
                                    LAB05_EXPERIMENT_CONDITIONS
                                        .boilingTemperatureC,
                                    0
                                )}
                            </td>

                            <td>
                                ${formatNumber(
                                    record.boilingTimeMinutes,
                                    2
                                )}
                            </td>
                        </tr>
                    `;
                })
                .join("");
    }

    function renderCalculationTable(data) {
        elements.calculationBody.innerHTML =
            data
                .map((record, index) => {
                    const firstHeaterRow =
                        index === 0 ||
                        data[index - 1].heaterId !==
                            record.heaterId;

                    return `
                        <tr>
                            ${
                                firstHeaterRow
                                    ? `<th scope="rowgroup" rowspan="3">№${record.heaterNumber}</th>`
                                    : ""
                            }

                            <td>
                                ${formatNumber(
                                    record.targetVoltageV,
                                    0
                                )}
                            </td>

                            <td>
                                ${formatNumber(
                                    record.activePowerW,
                                    0
                                )}
                            </td>

                            <td>
                                ${formatNumber(
                                    record.boilingTimeMinutes,
                                    2
                                )}
                            </td>

                            <td>
                                ${formatNumber(
                                    record.electricalEnergyWh,
                                    1
                                )}
                            </td>
                        </tr>
                    `;
                })
                .join("");
    }

    function renderConclusions(conclusions) {
        elements.conclusions.replaceChildren();

        CONCLUSIONS.forEach(
            ({ key, title }, index) => {
                const container =
                    document.createElement("section");

                const heading =
                    document.createElement("h4");

                const paragraph =
                    document.createElement("p");

                heading.textContent =
                    `${index + 1}. ${title}`;

                paragraph.textContent =
                    conclusions[key] ?? "";

                container.append(
                    heading,
                    paragraph
                );

                elements.conclusions.append(
                    container
                );
            }
        );
    }

    function generateReport() {
        const snapshot = getStateSnapshot();

        if (!snapshot.ready) {
            setReadiness(
                "Дані попередніх етапів змінилися. Повторно завершіть аналіз і тест.",
                "error"
            );

            updateAccess();
            return;
        }

        const student = {
            name: studentInputs.name.value.trim(),
            group: studentInputs.group.value.trim(),
            brigade:
                studentInputs.brigade.value.trim()
        };

        const data = buildReportData(
            snapshot.experiment,
            snapshot.calculations
        );

        elements.studentName.textContent =
            student.name;

        elements.studentGroup.textContent =
            student.group;

        elements.studentBrigade.textContent =
            student.brigade || "Не вказано";

        elements.date.textContent =
            new Intl.DateTimeFormat(
                "uk-UA",
                {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                }
            ).format(new Date());

        elements.heatCarrier.textContent =
            LAB05_EXPERIMENT_CONDITIONS
                .heatCarrierLabel;

        elements.waterVolume.textContent =
            `${formatNumber(
                LAB05_EXPERIMENT_CONDITIONS
                    .waterVolumeLiters,
                1
            )} л`;

        elements.initialTemperature.textContent =
            `${formatNumber(
                LAB05_EXPERIMENT_CONDITIONS
                    .initialTemperatureC,
                0
            )} °C`;

        elements.finalTemperature.textContent =
            `${formatNumber(
                LAB05_EXPERIMENT_CONDITIONS
                    .boilingTemperatureC,
                0
            )} °C`;

        elements.schematic.innerHTML =
            createFunctionalScheme();

        elements.quizScore.textContent =
            `${snapshot.quiz.score} із ${QUIZ_TOTAL}`;

        renderExperimentTable(data);
        renderCalculationTable(data);

        renderConclusions(
            snapshot.analysis.conclusions ?? {}
        );

        cloneReportCharts(elements.charts);

        currentData = {
            student,
            generatedAt: new Date().toISOString(),
            signature: snapshot.analysisSignature
        };

        reportStorage.set(
            "progress",
            currentData
        );

        elements.document.hidden = false;
        elements.printButton.disabled = false;

        setReadiness(
            "Звіт сформовано. Перевірте його та скористайтеся кнопкою друку або збереження у PDF.",
            "success"
        );

        elements.document.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    elements.form.addEventListener(
        "submit",
        (event) => {
            event.preventDefault();

            if (!validateStudentFields()) {
                setReadiness(
                    "Заповніть прізвище, ім’я та навчальну групу.",
                    "error"
                );
                return;
            }

            generateReport();
        }
    );

    elements.form.addEventListener(
        "input",
        (event) => {
            if (event.target.matches("input")) {
                updateStudentFieldValidity(
                    event.target
                );
            }

            if (currentData) {
                elements.printButton.disabled =
                    true;

                setReadiness(
                    "Дані студента змінено. Сформуйте звіт повторно."
                );
            }
        }
    );

    elements.printButton.addEventListener(
        "click",
        () => {
            if (
                !currentData ||
                elements.document.hidden
            ) {
                return;
            }

            const printRoot =
                createPrintCopy(
                    elements.document
                );

            let cleaned = false;

            const cleanup = () => {
                if (cleaned) {
                    return;
                }

                cleaned = true;

                document.body.classList.remove(
                    "lab-report-print-mode"
                );

                printRoot.remove();

                window.removeEventListener(
                    "afterprint",
                    cleanup
                );
            };

            document.body.classList.add(
                "lab-report-print-mode"
            );

            window.addEventListener(
                "afterprint",
                cleanup
            );

            window.print();

            window.setTimeout(
                cleanup,
                1500
            );
        }
    );

    elements.resetButton.addEventListener(
        "click",
        () => {
            if (
                !window.confirm(
                    "Очистити результати всіх етапів лабораторної роботи №5?"
                )
            ) {
                return;
            }

            [
                `${namespace}:safety`,
                `${namespace}:stand`,
                LAB05_EXPERIMENT_STORAGE_KEY,
                LAB05_VERIFIED_CALCULATIONS_STORAGE_KEY,
                LAB05_ANALYSIS_STORAGE_KEY,
                LAB05_QUIZ_STORAGE_KEY,
                LAB05_REPORT_STORAGE_KEY
            ].forEach(
                clearStorageNamespace
            );

            window.location.reload();
        }
    );

    [
        `${namespace}:quiz-completed`,
        `${namespace}:quiz-invalidated`,
        `${namespace}:analysis-completed`,
        `${namespace}:analysis-invalidated`,
        `${namespace}:calculations-completed`,
        `${namespace}:calculations-invalidated`,
        "lab05:experiment-updated",
        "lab05:experiment-completed",
        "lab05:experiment-reset"
    ].forEach((eventName) => {
        window.addEventListener(
            eventName,
            updateAccess
        );
    });

    restoreStudentData();
    updateAccess();
}