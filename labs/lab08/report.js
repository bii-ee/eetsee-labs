import { createPrintCopy } from "../../common/js/report-print.js";

import {
    createStorage
} from "../../common/js/storage.js";

import {
    LAB08_CONFIG,
    LAB08_EVENTS,
    LAB08_SCOPED_EVENTS
} from "./config.js";

import {
    getStudentVariant
} from "../../common/js/student-variants.js";

const REQUIRED_TRIAL_COUNT =
    LAB08_CONFIG.experiment.comparativeTrialCount;

const QUIZ_TOTAL =
    LAB08_CONFIG.quiz.questionCount;
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
                LAB08_CONFIG.experiment.maximumCyclicRunCount
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
            firstRecords.length > 0 &&
            Number(value?.experimentOne?.records?.at(-1)?.finalTemperature) >= 100 &&
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
    calculations,
    progress
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
                    LAB08_CONFIG.experiment.maximumCyclicRunCount
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
        progress.firstRecords.length ||
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

        studentVariant:
            section.querySelector(
                "#report-student-variant"
            ),

        studentGroup:
            section.querySelector(
                "#report-student-group"
            ),

        formVariant:
            section.querySelector(
                "#report-form-variant"
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

    // Як у ЛР5–7: підсумковий звіт розташований після тесту.
    const quizForm = section.querySelector("#quiz-form");
    if (quizForm && elements.panel.parentElement === quizForm.parentElement) {
        quizForm.insertAdjacentElement("afterend", elements.panel);
    }
    elements.formVariant.textContent = String(getStudentVariant());

    const experimentStorage =
        createStorage(
            LAB08_CONFIG.storage.experiment
        );

    const calculationsStorage =
        createStorage(
            LAB08_CONFIG.storage.calculations
        );

    const analysisStorage =
        createStorage(
            LAB08_CONFIG.storage.analysis
        );

    const quizStorage =
        createStorage(
            LAB08_CONFIG.storage.quiz
        );

    const reportStorage =
        createStorage(
            LAB08_CONFIG.storage.report
        );

    const studentInputs = {
        name:
            elements.form.elements.namedItem(
                "studentName"
            ),

        group:
            elements.form.elements.namedItem(
                "studentGroup"
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
                calculations,
                experiment
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
            event?.type === LAB08_SCOPED_EVENTS.quizCompleted ||
            event?.type === LAB08_EVENTS.quizCompleted;

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
        elements.studentVariant.textContent = String(getStudentVariant());
        elements.studentName.textContent =
            student.name;

        elements.studentGroup.textContent =
            student.group;


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

    function renderSchematic() {
        const source = root.querySelector("#equipment .lab-schematic img");
        if (!source) {
            elements.schematic.textContent = "Схему розділу 3 не знайдено.";
            return;
        }
        const image = source.cloneNode(false);
        image.loading = "eager";
        image.decoding = "async";
        elements.schematic.replaceChildren(image);
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
            variant: getStudentVariant()
        };

        fillReportMetadata(
            student,
            snapshot
        );

        renderSchematic();

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
                    "Очистити результати поточного варіанта лабораторної роботи №8?"
                );

            if (!confirmed) {
                return;
            }

            [
                LAB08_CONFIG.storage.experiment,
                LAB08_CONFIG.storage.calculations,
                LAB08_CONFIG.storage.analysis,
                LAB08_CONFIG.storage.quiz,
                LAB08_CONFIG.storage.report
            ].forEach(
                (storageNamespace) => {
                    createStorage(
                        storageNamespace
                    ).clear();
                }
            );

            document.dispatchEvent(
                new CustomEvent(
                    LAB08_EVENTS.experimentReset,
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
        LAB08_EVENTS.quizCompleted,
        LAB08_EVENTS.quizInvalidated,
        LAB08_EVENTS.analysisCompleted,
        LAB08_EVENTS.analysisInvalidated,
        LAB08_EVENTS.calculationsCompleted,
        LAB08_EVENTS.calculationsInvalidated,
        LAB08_EVENTS.experimentCompleted,
        LAB08_EVENTS.experimentReset
    ].forEach(
        (eventName) => {
            document.addEventListener(
                eventName,
                updateAccess
            );
        }
    );

    [
        LAB08_SCOPED_EVENTS.quizCompleted,
        LAB08_SCOPED_EVENTS.quizInvalidated,
        LAB08_SCOPED_EVENTS.analysisCompleted,
        LAB08_SCOPED_EVENTS.analysisInvalidated
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
