import {
    createStorage
} from "../../common/js/storage.js";

const REQUIRED_CYCLE_COUNT = 6;
const REQUIRED_TRIAL_COUNT = 9;
const QUIZ_TOTAL = 8;
const STATE_VERSION = 1;

const CHARTS = [
    {
        selector: "#chart-power-time",
        caption:
            "Рисунок 1. Циклічна зміна активної потужності"
    },
    {
        selector: "#chart-power-voltage",
        caption:
            "Рисунок 2. Залежність активної потужності від заданої напруги"
    },
    {
        selector: "#chart-boiling-time",
        caption:
            "Рисунок 3. Залежність тривалості нагрівання води до кипіння від заданої напруги"
    }
];

const CONCLUSIONS = [
    {
        key: "powerTimeConclusion",
        title:
            "Циклічна зміна активної потужності"
    },
    {
        key: "voltageInfluenceConclusion",
        title:
            "Вплив заданої напруги на активну потужність"
    },
    {
        key: "temperatureInfluenceConclusion",
        title:
            "Вплив параметрів режиму на тривалість нагрівання"
    }
];

function isFiniteNumber(value) {
    return (
        value !== null &&
        value !== "" &&
        Number.isFinite(Number(value))
    );
}

function formatNumber(
    value,
    digits = 1
) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "–";
    }

    return number.toLocaleString(
        "uk-UA",
        {
            minimumFractionDigits:
                digits,

            maximumFractionDigits:
                digits
        }
    );
}

function normalizeExperiment(value) {
    const setupSource =
        value?.setup &&
            typeof value.setup === "object"
            ? value.setup
            : {};

    const firstSource =
        Array.isArray(
            value?.experimentOne?.records
        )
            ? value.experimentOne.records
            : [];

    const secondSource =
        Array.isArray(
            value?.experimentTwo?.records
        )
            ? value.experimentTwo.records
            : [];

    const firstRecords =
        firstSource
            .filter(
                (record) =>
                    isFiniteNumber(
                        record?.voltage
                    ) &&
                    isFiniteNumber(
                        record?.current
                    ) &&
                    isFiniteNumber(
                        record?.power
                    ) &&
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
                        Number(
                            record.cycle
                        ) ||
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
            );

    const secondRecords =
        secondSource
            .filter(
                (record) =>
                    isFiniteNumber(
                        record?.setTemperature
                    ) &&
                    isFiniteNumber(
                        record?.setVoltage
                    ) &&
                    isFiniteNumber(
                        record?.voltage
                    ) &&
                    isFiniteNumber(
                        record?.current
                    ) &&
                    isFiniteNumber(
                        record?.power
                    ) &&
                    isFiniteNumber(
                        record?.boilingTime
                    )
            )
            .slice(
                0,
                REQUIRED_TRIAL_COUNT
            )
            .map(
                (
                    record,
                    index
                ) => ({
                    trial:
                        Number(
                            record.trial
                        ) ||
                        index + 1,

                    setTemperature:
                        Number(
                            record.setTemperature
                        ),

                    setVoltage:
                        Number(
                            record.setVoltage
                        ),

                    voltage:
                        Number(
                            record.voltage
                        ),

                    initialTemperature:
                        isFiniteNumber(
                            record.initialTemperature
                        )
                            ? Number(
                                record.initialTemperature
                            )
                            : null,

                    current:
                        Number(
                            record.current
                        ),

                    power:
                        Number(
                            record.power
                        ),

                    boilingTime:
                        Number(
                            record.boilingTime
                        )
                })
            );

    const waterMass =
        Number(
            setupSource.waterMass
        );

    const initialTemperature =
        Number(
            setupSource.initialTemperature
        );

    const setupValid =
        setupSource.confirmed === true &&
        Number.isFinite(waterMass) &&
        waterMass > 0 &&
        Number.isFinite(
            initialTemperature
        ) &&
        initialTemperature < 100;

    return {
        setup: {
            confirmed:
                setupValid,

            waterMass,

            initialTemperature
        },

        firstRecords,
        secondRecords,

        completed:
            setupValid &&
            firstRecords.length ===
            REQUIRED_CYCLE_COUNT &&
            secondRecords.length ===
            REQUIRED_TRIAL_COUNT &&
            value?.completed === true
    };
}

function createExperimentSignature(
    progress
) {
    return JSON.stringify({
        waterMass:
            progress.setup.waterMass,

        initialTemperature:
            progress.setup
                .initialTemperature,

        cycles:
            progress.firstRecords.map(
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

function createAnalysisSignature(
    progress,
    results
) {
    return JSON.stringify({
        setup:
            progress.setup,

        cycles:
            progress.firstRecords,

        trials:
            progress.secondRecords,

        calculations: {
            totalElectricalEnergy:
                results
                    .totalElectricalEnergy,

            usefulHeat:
                results.usefulHeat,

            thermalEfficiency:
                results
                    .thermalEfficiency
        }
    });
}

function normalizeCalculationResults(
    calculations
) {
    if (
        !calculations ||
        typeof calculations !== "object" ||
        calculations.completed !== true ||
        !calculations.results ||
        typeof calculations.results !==
        "object"
    ) {
        return null;
    }

    const results =
        calculations.results;

    const cycles =
        Array.isArray(results.cycles)
            ? results.cycles
                .filter(
                    (cycle) =>
                        isFiniteNumber(
                            cycle?.cycleNumber
                        ) &&
                        isFiniteNumber(
                            cycle?.energy
                        )
                )
                .slice(
                    0,
                    REQUIRED_CYCLE_COUNT
                )
                .map(
                    (cycle) => ({
                        cycleNumber:
                            Number(
                                cycle.cycleNumber
                            ),

                        energy:
                            Number(
                                cycle.energy
                            )
                    })
                )
            : [];

    const requiredValues = [
        results.totalElectricalEnergy,
        results.usefulHeat,
        results.thermalEfficiency,
        results.totalOnDuration,
        results.totalOffDuration,
        results.totalDuration
    ];

    if (
        cycles.length !==
        REQUIRED_CYCLE_COUNT ||
        !requiredValues.every(
            isFiniteNumber
        )
    ) {
        return null;
    }

    return {
        cycles,

        totalElectricalEnergy:
            Number(
                results
                    .totalElectricalEnergy
            ),

        usefulHeat:
            Number(
                results.usefulHeat
            ),

        thermalEfficiency:
            Number(
                results
                    .thermalEfficiency
            ),

        totalOnDuration:
            Number(
                results
                    .totalOnDuration
            ),

        totalOffDuration:
            Number(
                results
                    .totalOffDuration
            ),

        totalDuration:
            Number(
                results.totalDuration
            )
    };
}

function createFunctionalScheme() {
    return `
        <svg
            viewBox="0 0 1040 330"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Функціональна схема лабораторної установки"
        >
            <defs>
                <marker
                    id="report-flow-arrow"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="7"
                    markerHeight="7"
                    orient="auto-start-reverse"
                >
                    <path
                        d="M 0 0 L 10 5 L 0 10 z"
                        fill="#397a95"
                    />
                </marker>
            </defs>

            <style>
                .report-scheme-box {
                    fill: #f3f8fa;
                    stroke: #397a95;
                    stroke-width: 2;
                }

                .report-scheme-load {
                    fill: #edf8f2;
                    stroke: #2f8260;
                    stroke-width: 2;
                }

                .report-scheme-meter {
                    fill: #ffffff;
                    stroke: #0e87a8;
                    stroke-width: 2;
                }

                .report-scheme-line {
                    fill: none;
                    stroke: #397a95;
                    stroke-width: 3;
                    marker-end: url(#report-flow-arrow);
                }

                .report-scheme-branch {
                    fill: none;
                    stroke: #7896a4;
                    stroke-width: 2;
                    stroke-dasharray: 7 6;
                    marker-end: url(#report-flow-arrow);
                }
                .report-scheme-title {
                    fill: #15384d;
                    font: 700 19px Arial, sans-serif;
                    text-anchor: middle;
                }

                .report-scheme-label {
                    fill: #526b7b;
                    font: 16px Arial, sans-serif;
                    text-anchor: middle;
                }
            </style>

            <rect
                class="report-scheme-box"
                x="25"
                y="65"
                width="170"
                height="92"
                rx="12"
            />

            <text
                class="report-scheme-title"
                x="110"
                y="103"
            >
                Мережа 220 В
            </text>

            <text
                class="report-scheme-label"
                x="110"
                y="132"
            >
                джерело живлення
            </text>

            <rect
                class="report-scheme-box"
                x="240"
                y="65"
                width="170"
                height="92"
                rx="12"
            />

            <text
                class="report-scheme-title"
                x="325"
                y="103"
            >
                ЛАТР
            </text>

            <text
                class="report-scheme-label"
                x="325"
                y="132"
            >
                регулювання напруги
            </text>

            <rect
                class="report-scheme-meter"
                x="455"
                y="65"
                width="190"
                height="92"
                rx="12"
            />

            <text
                class="report-scheme-title"
                x="550"
                y="103"
            >
                Аналізатор мережі
            </text>

            <text
                class="report-scheme-label"
                x="550"
                y="132"
            >
                U, I, P
            </text>

            <rect
                class="report-scheme-load"
                x="690"
                y="65"
                width="170"
                height="92"
                rx="12"
            />

            <text
                class="report-scheme-title"
                x="775"
                y="103"
            >
                Плита ПП-3
            </text>

            <text
                class="report-scheme-label"
                x="775"
                y="132"
            >
                нагрівання
            </text>

            <rect
                class="report-scheme-load"
                x="900"
                y="65"
                width="115"
                height="92"
                rx="12"
            />

            <text
                class="report-scheme-title"
                x="957"
                y="103"
            >
                Вода
            </text>

            <text
                class="report-scheme-label"
                x="957"
                y="132"
            >
                m, t
            </text>

            <path
                class="report-scheme-line"
                d="M 195 111 H 232"
            />

            <path
                class="report-scheme-line"
                d="M 410 111 H 447"
            />

            <path
                class="report-scheme-line"
                d="M 645 111 H 682"
            />

            <path
                class="report-scheme-line"
                d="M 860 111 H 892"
            />

            <rect
                class="report-scheme-meter"
                x="315"
                y="235"
                width="180"
                height="65"
                rx="12"
            />

            <text
                class="report-scheme-title"
                x="405"
                y="263"
            >
                Секундомір
            </text>

            <text
                class="report-scheme-label"
                x="405"
                y="286"
            >
                tувімк, tвимк
            </text>

            <rect
                class="report-scheme-meter"
                x="650"
                y="235"
                width="190"
                height="65"
                rx="12"
            />

            <text
                class="report-scheme-title"
                x="745"
                y="263"
            >
                Вимірювання
            </text>

            <text
                class="report-scheme-label"
                x="745"
                y="286"
            >
                tкип і температура
            </text>

            <path
                class="report-scheme-branch"
                d="M 550 157 V 202 H 405 V 227"
            />

            <path
                class="report-scheme-branch"
                d="M 957 157 V 202 H 745 V 227"
            />
        </svg>
    `;
}

function cloneReportCharts(target) {
    target.replaceChildren();

    CHARTS.forEach(
        ({
            selector,
            caption
        }) => {
            const source =
                document.querySelector(
                    selector
                );

            const sourceSvg =
                source?.querySelector(
                    "svg"
                );

            if (!sourceSvg) {
                return;
            }

            const figure =
                document.createElement(
                    "figure"
                );

            const figureCaption =
                document.createElement(
                    "figcaption"
                );

            const clonedSvg =
                sourceSvg.cloneNode(
                    true
                );

            const sourceLegend =
                source.querySelector(
                    ".analysis-chart-legend"
                );

            figure.className =
                "report-chart";

            figureCaption.textContent =
                caption;

            clonedSvg.removeAttribute(
                "width"
            );

            clonedSvg.removeAttribute(
                "height"
            );

            clonedSvg.removeAttribute(
                "tabindex"
            );

            clonedSvg
                .querySelectorAll(
                    "[tabindex]"
                )
                .forEach(
                    (element) => {
                        element.removeAttribute(
                            "tabindex"
                        );
                    }
                );

            figure.append(
                figureCaption,
                clonedSvg
            );

            if (sourceLegend) {
                const clonedLegend =
                    sourceLegend.cloneNode(
                        true
                    );

                clonedLegend.classList.add(
                    "report-chart-legend"
                );

                figure.append(
                    clonedLegend
                );
            }

            target.append(
                figure
            );
        }
    );
}

function createPrintCopy(
    reportDocument
) {
    document
        .querySelector(
            "#lab-print-root"
        )
        ?.remove();

    const printRoot =
        document.createElement(
            "div"
        );

    const reportCopy =
        reportDocument.cloneNode(
            true
        );

    printRoot.id =
        "lab-print-root";

    reportCopy.hidden =
        false;

    reportCopy.removeAttribute(
        "hidden"
    );

    printRoot.append(
        reportCopy
    );

    document.body.append(
        printRoot
    );

    return printRoot;
}

export function initializeReport({
    root = document,
    namespace = "lab08"
} = {}) {
    const section =
        root.querySelector(
            "#questions"
        );

    if (
        !section ||
        section.dataset.reportInitialized ===
        "true"
    ) {
        return;
    }

    const elements = {
        panel:
            section.querySelector(
                "#final-report-panel"
            ),

        readiness:
            section.querySelector(
                "#report-readiness"
            ),

        form:
            section.querySelector(
                "#student-report-form"
            ),

        generateButton:
            section.querySelector(
                "#generate-report"
            ),

        printButton:
            section.querySelector(
                "#print-report"
            ),

        resetButton:
            section.querySelector(
                "#reset-lab"
            ),

        document:
            section.querySelector(
                "#report-document"
            ),

        studentName:
            section.querySelector(
                "#report-student-name"
            ),

        studentGroup:
            section.querySelector(
                "#report-student-group"
            ),

        studentBrigade:
            section.querySelector(
                "#report-student-brigade"
            ),

        date:
            section.querySelector(
                "#report-date"
            ),

        schematic:
            section.querySelector(
                "#report-schematic"
            ),

        waterMass:
            section.querySelector(
                "#report-water-mass"
            ),

        initialTemperature:
            section.querySelector(
                "#report-initial-temperature"
            ),

        experimentOneBody:
            section.querySelector(
                "#report-experiment-one-body"
            ),

        cycleEnergyBody:
            section.querySelector(
                "#report-cycle-energy-body"
            ),

        totalEnergy:
            section.querySelector(
                "#report-total-energy"
            ),

        usefulHeat:
            section.querySelector(
                "#report-useful-heat"
            ),

        efficiency:
            section.querySelector(
                "#report-efficiency"
            ),

        experimentTwoBody:
            section.querySelector(
                "#report-experiment-two-body"
            ),

        charts:
            section.querySelector(
                "#report-charts"
            ),

        conclusions:
            section.querySelector(
                "#report-conclusions"
            ),

        quizScore:
            section.querySelector(
                "#report-quiz-score"
            )
    };

    const missingElement =
        Object.entries(elements).find(
            ([, element]) =>
                !element
        );

    if (missingElement) {
        console.warn(
            "Не знайдено елемент підсумкового звіту: " +
            `${missingElement[0]}.`
        );

        return;
    }

    section.dataset.reportInitialized =
        "true";

    /*
     * У HTML панель звіту може залишатися після форми тесту.
     * Після ініціалізації переміщуємо її над заголовком
     * контрольного тесту, як у попередніх лабораторних роботах.
     */
    const quizHeading =
        section.querySelector(
            ".quiz-heading"
        );

    const quizInteractiveArea =
        section.querySelector(
            "#quiz-interactive-area"
        );

    if (
        quizHeading &&
        quizInteractiveArea &&
        elements.panel.parentElement ===
        quizInteractiveArea
    ) {
        quizInteractiveArea.insertBefore(
            elements.panel,
            quizHeading
        );
    }

    const experimentStorage =
        createStorage(
            `${namespace}:experiment`
        );

    const calculationsStorage =
        createStorage(
            `${namespace}:calculations`
        );

    const analysisStorage =
        createStorage(
            `${namespace}:analysis`
        );

    const quizStorage =
        createStorage(
            `${namespace}:quiz`
        );

    const reportStorage =
        createStorage(
            `${namespace}:report`
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

    let currentData =
        null;

    function setReadiness(
        text,
        state = "default"
    ) {
        elements.readiness.textContent =
            text;

        elements.readiness.dataset.state =
            state;
    }

    function getStateSnapshot() {
        const experiment =
            normalizeExperiment(
                experimentStorage.get(
                    "progress",
                    {}
                )
            );

        const calculations =
            calculationsStorage.get(
                "progress",
                {}
            );

        const calculationResults =
            normalizeCalculationResults(
                calculations
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

        const experimentSignature =
            createExperimentSignature(
                experiment
            );

        const calculationsReady =
            experiment.completed &&
            calculations?.completed ===
            true &&
            calculations?.signature ===
            experimentSignature &&
            calculationResults !== null;

        const analysisSignature =
            calculationsReady
                ? createAnalysisSignature(
                    experiment,
                    calculationResults
                )
                : "";

        const analysisReady =
            calculationsReady &&
            analysis?.completed === true &&
            analysis?.signature ===
            analysisSignature;

        const quizReady =
            analysisReady &&
            quiz?.passed === true &&
            quiz?.analysisSignature ===
            analysisSignature &&
            isFiniteNumber(
                quiz?.score
            );

        return {
            experiment,
            calculations,
            calculationResults,
            analysis,
            quiz,
            experimentSignature,
            analysisSignature,

            ready:
                quizReady
        };
    }

    function restoreStudentData() {
        const stored =
            reportStorage.get(
                "progress",
                {}
            );

        studentInputs.name.value =
            stored?.student?.name ??
            "";

        studentInputs.group.value =
            stored?.student?.group ??
            "";

        studentInputs.brigade.value =
            stored?.student?.brigade ??
            "";
    }

    function updateStudentFieldValidity(
        input
    ) {
        const value =
            input.value.trim();

        input.setCustomValidity(
            ""
        );

        if (
            input ===
            studentInputs.name
        ) {
            if (value === "") {
                input.setCustomValidity(
                    "Введіть прізвище, ім’я та по батькові."
                );
            } else if (
                value.length < 5
            ) {
                input.setCustomValidity(
                    "ПІБ має містити щонайменше 5 символів."
                );
            }
        }

        if (
            input ===
            studentInputs.group &&
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

        return elements.form
            .reportValidity();
    }

    function hideGeneratedReport() {
        currentData =
            null;

        elements.document.hidden =
            true;

        elements.printButton.disabled =
            true;
    }

    function updateAccess(event) {
        if (
            event?.detail?.namespace &&
            event.detail.namespace !== namespace
        ) {
            return;
        }

        const snapshot = getStateSnapshot();
        const panelWasHidden = elements.panel.hidden;

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

        const quizJustCompleted =
            event?.type === `${namespace}:quiz-completed` ||
            event?.type === "laboratory:quiz-completed";

        if (panelWasHidden && quizJustCompleted) {
            window.requestAnimationFrame(() => {
                elements.panel.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            });
        }
    }

    function renderExperimentOneTable(
        experiment
    ) {
        elements.experimentOneBody.innerHTML =
            experiment.firstRecords
                .map(
                    (record) => `
                        <tr>
                            <th scope="row">
                                ${record.cycle}
                            </th>

                            <td>
                                ${formatNumber(
                        record.voltage,
                        1
                    )}
                            </td>

                            <td>
                                ${formatNumber(
                        record.current,
                        1
                    )}
                            </td>

                            <td>
                                ${formatNumber(
                        record.power,
                        2
                    )}
                            </td>

                            <td>
                                ${formatNumber(
                        record.onTime,
                        2
                    )}
                            </td>

                            <td>
                                ${formatNumber(
                        record.offTime,
                        2
                    )}
                            </td>
                        </tr>
                    `
                )
                .join("");
    }

    function renderCycleEnergyTable(
        experiment,
        calculationResults
    ) {
        elements.cycleEnergyBody.innerHTML =
            calculationResults.cycles
                .map(
                    (
                        result,
                        index
                    ) => {
                        const record =
                            experiment
                                .firstRecords[
                            index
                            ];

                        return `
                            <tr>
                                <th scope="row">
                                    ${result.cycleNumber}
                                </th>

                                <td>
                                    ${formatNumber(
                            record?.power,
                            2
                        )}
                                </td>

                                <td>
                                    ${formatNumber(
                            record?.onTime,
                            2
                        )}
                                </td>

                                <td>
                                    ${formatNumber(
                            result.energy,
                            5
                        )}
                                </td>
                            </tr>
                        `;
                    }
                )
                .join("");

        elements.totalEnergy.textContent =
            formatNumber(
                calculationResults
                    .totalElectricalEnergy,
                5
            );

        elements.usefulHeat.textContent =
            formatNumber(
                calculationResults
                    .usefulHeat,
                5
            );

        elements.efficiency.textContent =
            formatNumber(
                calculationResults
                    .thermalEfficiency,
                1
            );
    }

    function renderExperimentTwoTable(
        experiment
    ) {
        elements.experimentTwoBody.innerHTML =
            experiment.secondRecords
                .map(
                    (record) => `
                        <tr>
                            <th scope="row">
                                ${record.trial}
                            </th>

                            <td>
                                ${formatNumber(
                        record.setTemperature,
                        0
                    )}
                            </td>

                            <td>
                                ${formatNumber(
                        record.setVoltage,
                        0
                    )}
                            </td>

                            <td>
                                ${formatNumber(
                        record.voltage,
                        1
                    )}
                            </td>

                            <td>
                                ${formatNumber(
                        record.initialTemperature,
                        1
                    )}
                            </td>

                            <td>
                                ${formatNumber(
                        record.current,
                        1
                    )}
                            </td>

                            <td>
                                ${formatNumber(
                        record.power,
                        2
                    )}
                            </td>

                            <td>
                                ${formatNumber(
                        record.boilingTime,
                        2
                    )}
                            </td>
                        </tr>
                    `
                )
                .join("");
    }

    function renderConclusions(
        conclusions
    ) {
        elements.conclusions
            .replaceChildren();

        CONCLUSIONS.forEach(
            (
                {
                    key,
                    title
                },
                index
            ) => {
                const container =
                    document.createElement(
                        "section"
                    );

                const heading =
                    document.createElement(
                        "h4"
                    );

                const paragraph =
                    document.createElement(
                        "p"
                    );

                heading.textContent =
                    `${index + 1}. ${title}`;

                paragraph.textContent =
                    conclusions?.[key] ??
                    "Висновок не введено.";

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

    function fillReportMetadata(
        student,
        snapshot
    ) {
        elements.studentName.textContent =
            student.name;

        elements.studentGroup.textContent =
            student.group;

        elements.studentBrigade.textContent =
            student.brigade ||
            "Не вказано";

        elements.date.textContent =
            new Intl.DateTimeFormat(
                "uk-UA",
                {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                }
            ).format(
                new Date()
            );

        elements.waterMass.textContent =
            `${formatNumber(
                snapshot.experiment
                    .setup
                    .waterMass,
                3
            )} кг`;

        elements.initialTemperature.textContent =
            `${formatNumber(
                snapshot.experiment
                    .setup
                    .initialTemperature,
                1
            )} °C`;

        elements.quizScore.textContent =
            `${snapshot.quiz.score} із ${QUIZ_TOTAL}`;
    }

    function generateReport() {
        const snapshot =
            getStateSnapshot();

        if (!snapshot.ready) {
            setReadiness(
                "Дані попередніх етапів змінилися. Повторно завершіть аналіз і контрольний тест.",
                "error"
            );

            updateAccess();

            return;
        }

        const student = {
            name:
                studentInputs.name.value
                    .trim(),

            group:
                studentInputs.group.value
                    .trim(),

            brigade:
                studentInputs.brigade.value
                    .trim()
        };

        fillReportMetadata(
            student,
            snapshot
        );

        elements.schematic.innerHTML =
            createFunctionalScheme();

        renderExperimentOneTable(
            snapshot.experiment
        );

        renderCycleEnergyTable(
            snapshot.experiment,
            snapshot.calculationResults
        );

        renderExperimentTwoTable(
            snapshot.experiment
        );

        renderConclusions(
            snapshot.analysis
                .conclusions
        );

        cloneReportCharts(
            elements.charts
        );

        currentData = {
            version:
                STATE_VERSION,

            student,

            generatedAt:
                new Date().toISOString(),

            experimentSignature:
                snapshot
                    .experimentSignature,

            analysisSignature:
                snapshot
                    .analysisSignature,

            quizScore:
                Number(
                    snapshot.quiz.score
                )
        };

        reportStorage.set(
            "progress",
            currentData
        );

        elements.document.hidden =
            false;

        elements.printButton.disabled =
            false;

        setReadiness(
            "Звіт сформовано. Перевірте дані та скористайтеся кнопкою друку або збереження у PDF.",
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

            if (
                !validateStudentFields()
            ) {
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
            if (
                event.target.matches(
                    "input"
                )
            ) {
                updateStudentFieldValidity(
                    event.target
                );
            }

            if (currentData) {
                currentData =
                    null;

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

            let cleaned =
                false;

            function cleanup() {
                if (cleaned) {
                    return;
                }

                cleaned =
                    true;

                document.body.classList.remove(
                    "lab-report-print-mode"
                );

                printRoot.remove();

                window.removeEventListener(
                    "afterprint",
                    cleanup
                );
            }

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
                2000
            );
        }
    );

    elements.resetButton.addEventListener(
        "click",
        () => {
            const confirmed =
                window.confirm(
                    "Очистити результати всіх етапів лабораторної роботи №8?"
                );

            if (!confirmed) {
                return;
            }

            [
                "safety",
                "stand",
                "experiment",
                "calculations",
                "analysis",
                "quiz",
                "report"
            ].forEach(
                (storageNamespace) => {
                    createStorage(
                        `${namespace}:${storageNamespace}`
                    ).clear();
                }
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

            window.location.reload();
        }
    );

    [
        "laboratory:quiz-completed",
        "laboratory:quiz-invalidated",
        "laboratory:analysis-completed",
        "laboratory:analysis-invalidated",
        "laboratory:calculations-completed",
        "laboratory:calculations-invalidated",
        "laboratory:experiment-completed",
        "laboratory:experiment-reset"
    ].forEach(
        (eventName) => {
            document.addEventListener(
                eventName,
                updateAccess
            );
        }
    );

    [
        `${namespace}:quiz-completed`,
        `${namespace}:quiz-invalidated`,
        `${namespace}:analysis-completed`,
        `${namespace}:analysis-invalidated`
    ].forEach(
        (eventName) => {
            window.addEventListener(
                eventName,
                updateAccess
            );
        }
    );

    restoreStudentData();
    updateAccess();
}