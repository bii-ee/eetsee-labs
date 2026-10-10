import { createPrintCopy } from "../../common/js/report-print.js";

import {
    createStorage
} from "../../common/js/storage.js";

import {
    LAB07_CONFIG,
    LAB07_EVENTS
} from "./config.js";

import {
    getStudentVariant
} from "../../common/js/student-variants.js";

const MODES = [
    { id: "mode-1", position: 1 },
    { id: "mode-2", position: 2 },
    { id: "mode-3", position: 3 }
];

const CYCLES_PER_MODE =
    LAB07_CONFIG.experiment.cyclesPerMode;

const QUIZ_TOTAL =
    LAB07_CONFIG.quiz.questionCount;

const CHARTS = [
    {
        selector: "#chart-duty-cycle",
        caption: "Рисунок 1. Відносна тривалість увімкнення"
    },
    {
        selector: "#chart-cycle-duration",
        caption: "Рисунок 2. Складові циклу роботи"
    },
    {
        selector: "#chart-cycle-temperature",
        caption: "Рисунок 3. Температура конфорки залежно від часу"
    }
];

const CONCLUSIONS = [
    {
        key: "dutyCycleConclusion",
        title: "Відносна тривалість увімкнення"
    },
    {
        key: "cycleDurationConclusion",
        title: "Співвідношення тривалостей циклу"
    },
    {
        key: "temperatureConclusion",
        title: "Температурний режим конфорки"
    }
];

function isFiniteNumber(value) {
    return Number.isFinite(Number(value));
}

function formatNumber(value, digits = 1) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "—";
    }

    return new Intl.NumberFormat("uk-UA", {
        minimumFractionDigits: 0,
        maximumFractionDigits: digits
    }).format(number);
}

function average(values) {
    return values.reduce((sum, value) => sum + value, 0) /
        values.length;
}

function normalizeExperiment(value) {
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
                        isFiniteNumber(cycle?.tOff) &&
                        isFiniteNumber(cycle?.tauOn) &&
                        isFiniteNumber(cycle?.tauOff)
                )
                .slice(0, CYCLES_PER_MODE)
                .map((cycle) => ({
                    tOn: Number(cycle.tOn),
                    tOff: Number(cycle.tOff),
                    tauOn: Number(cycle.tauOn),
                    tauOff: Number(cycle.tauOff)
                }))
            : [];

        normalized.records[mode.id] = {
            position: mode.position,
            tau0: isFiniteNumber(source.tau0)
                ? Number(source.tau0)
                : null,
            cycles
        };
    });

    return normalized;
}

function isExperimentComplete(progress) {
    return MODES.every((mode) => {
        const record = progress.records[mode.id];

        return (
            isFiniteNumber(record?.tau0) &&
            record.cycles.length === CYCLES_PER_MODE
        );
    });
}

function createCalculationSignature(progress) {
    return JSON.stringify({
        burner: progress.burner,
        records: MODES.map((mode) => ({
            id: mode.id,
            cycles: (progress.records[mode.id]?.cycles ?? [])
                .map(({ tOn, tOff }) => ({ tOn, tOff }))
        }))
    });
}

function createAnalysisSignature(progress) {
    return JSON.stringify({
        burner: progress.burner,
        records: MODES.map((mode) => ({
            id: mode.id,
            tau0: progress.records[mode.id]?.tau0 ?? null,
            cycles: progress.records[mode.id]?.cycles ?? []
        }))
    });
}

function getCycleValues(cycle) {
    const duration = cycle.tOn + cycle.tOff;

    return {
        duration,
        duty: duration > 0 ? cycle.tOn / duration * 100 : 0
    };
}

function buildReportData(progress) {
    return MODES.map((mode) => {
        const record = progress.records[mode.id];
        const cycles = record.cycles.map((cycle) => ({
            ...cycle,
            ...getCycleValues(cycle)
        }));

        return {
            id: mode.id,
            position: mode.position,
            tau0: record.tau0,
            cycles,
            averages: {
                tOn: average(cycles.map((cycle) => cycle.tOn)),
                tOff: average(cycles.map((cycle) => cycle.tOff)),
                duration: average(
                    cycles.map((cycle) => cycle.duration)
                ),
                duty: average(cycles.map((cycle) => cycle.duty))
            }
        };
    });
}

function renderSchematic(root, target) {
    const source = root.querySelector("#equipment .lab-schematic img");

    if (!source) {
        target.textContent = "Схему розділу 3 не знайдено.";
        return;
    }

    const image = source.cloneNode(false);
    image.loading = "eager";
    image.decoding = "async";
    target.replaceChildren(image);
}

function cloneReportCharts(target) {
    target.replaceChildren();

    CHARTS.forEach(({ selector, caption }) => {
        const source = document.querySelector(selector);
        const svg = source?.querySelector("svg");

        if (!svg) {
            return;
        }

        const figure = document.createElement("figure");
        const figureCaption = document.createElement("figcaption");
        const clonedSvg = svg.cloneNode(true);

        figure.className = "report-chart";
        figureCaption.textContent = caption;
        clonedSvg.removeAttribute("width");
        clonedSvg.removeAttribute("height");
        figure.append(figureCaption, clonedSvg);
        target.append(figure);
    });
}


export function initializeReport({
    root = document,
    namespace = "lab07"
} = {}) {
    const section = root.querySelector("#questions");

    if (!section || section.dataset.reportInitialized === "true") {
        return;
    }

    const elements = {
        panel: section.querySelector("#final-report-panel"),
        readiness: section.querySelector("#report-readiness"),
        form: section.querySelector("#student-report-form"),
        generateButton: section.querySelector("#generate-report"),
        printButton: section.querySelector("#print-report"),
        resetButton: section.querySelector("#reset-lab"),
        document: section.querySelector("#report-document"),
        studentName: section.querySelector("#report-student-name"),
        studentVariant: section.querySelector("#report-student-variant"),
        studentGroup: section.querySelector("#report-student-group"),
        formVariant: section.querySelector("#report-form-variant"),
        date: section.querySelector("#report-date"),
        schematic: section.querySelector("#report-schematic"),
        burner: section.querySelector("#report-burner"),
        experimentBody: section.querySelector(
            "#report-experiment-body"
        ),
        calculationBody: section.querySelector(
            "#report-calculation-body"
        ),
        summaryBody: section.querySelector("#report-summary-body"),
        charts: section.querySelector("#report-charts"),
        conclusions: section.querySelector("#report-conclusions"),
        quizScore: section.querySelector("#report-quiz-score")
    };

    if (Object.values(elements).some((element) => !element)) {
        console.warn("Не знайдено елементи підсумкового звіту ЛР7.");
        return;
    }

    section.dataset.reportInitialized = "true";

    const experimentStorage = createStorage(
        LAB07_CONFIG.storage.experiment
    );

    const calculationsStorage = createStorage(
        LAB07_CONFIG.storage.calculations
    );

    const analysisStorage = createStorage(
        LAB07_CONFIG.storage.analysis
    );

    const quizStorage = createStorage(
        LAB07_CONFIG.storage.quiz
    );

    const reportStorage = createStorage(
        LAB07_CONFIG.storage.report
    );

    const studentInputs = {
        name: elements.form.elements.namedItem("studentName"),
        group: elements.form.elements.namedItem("studentGroup")
    };

    let currentData = null;

    function setReadiness(text, state = "default") {
        elements.readiness.textContent = text;
        elements.readiness.dataset.state = state;
    }

    function getStateSnapshot() {
        const experiment = normalizeExperiment(
            experimentStorage.get("progress", {})
        );
        const calculations = calculationsStorage.get("progress", {});
        const analysis = analysisStorage.get("progress", {});
        const quiz = quizStorage.get("progress", {});
        const calculationSignature = createCalculationSignature(
            experiment
        );
        const analysisSignature = createAnalysisSignature(experiment);

        return {
            experiment,
            calculations,
            analysis,
            quiz,
            calculationSignature,
            analysisSignature,
            ready:
                isExperimentComplete(experiment) &&
                calculations?.completed === true &&
                calculations?.signature === calculationSignature &&
                analysis?.completed === true &&
                analysis?.signature === analysisSignature &&
                quiz?.passed === true &&
                quiz?.analysisSignature === analysisSignature
        };
    }

    function restoreStudentData() {
        const stored = reportStorage.get("progress", {});

        studentInputs.name.value = stored?.student?.name ?? "";
        studentInputs.group.value = stored?.student?.group ?? "";
        elements.formVariant.textContent = String(getStudentVariant());
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

        if (input === studentInputs.group && value === "") {
            input.setCustomValidity(
                "Введіть назву навчальної групи."
            );
        }
    }

    function validateStudentFields() {
        [studentInputs.name, studentInputs.group].forEach(
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
        elements.experimentBody.innerHTML = data.map((mode) =>
            mode.cycles.map((cycle, cycleIndex) => `
                <tr>
                    ${cycleIndex === 0
                    ? `<th scope="rowgroup" rowspan="3">${mode.position}</th>`
                    : ""}
                    <th scope="row">${cycleIndex + 1}</th>
                    <td>${formatNumber(mode.tau0, 0)}</td>
                    <td>${formatNumber(cycle.tOn, 0)}</td>
                    <td>${formatNumber(cycle.tauOn, 0)}</td>
                    <td>${formatNumber(cycle.tOff, 0)}</td>
                    <td>${formatNumber(cycle.tauOff, 0)}</td>
                </tr>
            `).join("")
        ).join("");
    }

    function renderCalculationTable(data) {
        elements.calculationBody.innerHTML = data.map((mode) =>
            mode.cycles.map((cycle, cycleIndex) => `
                <tr>
                    ${cycleIndex === 0
                    ? `<th scope="rowgroup" rowspan="3">${mode.position}</th>`
                    : ""}
                    <th scope="row">${cycleIndex + 1}</th>
                    <td>${formatNumber(cycle.duration, 0)}</td>
                    <td>${formatNumber(cycle.duty, 1)}</td>
                </tr>
            `).join("")
        ).join("");

        elements.summaryBody.innerHTML = data.map((mode) => `
            <tr>
                <th scope="row">${mode.position}</th>
                <td>${formatNumber(mode.averages.tOn, 1)}</td>
                <td>${formatNumber(mode.averages.tOff, 1)}</td>
                <td>${formatNumber(mode.averages.duration, 1)}</td>
                <td>${formatNumber(mode.averages.duty, 1)}</td>
            </tr>
        `).join("");
    }

    function renderConclusions(conclusions) {
        elements.conclusions.replaceChildren();

        CONCLUSIONS.forEach(({ key, title }, index) => {
            const container = document.createElement("section");
            const heading = document.createElement("h4");
            const paragraph = document.createElement("p");

            heading.textContent = `${index + 1}. ${title}`;
            paragraph.textContent = conclusions[key] ?? "";
            container.append(heading, paragraph);
            elements.conclusions.append(container);
        });
    }

    function generateReport() {
        const snapshot = getStateSnapshot();

        if (!snapshot.ready) {
            setReadiness(
                "Дані попередніх етапів змінилися. Повторно завершіть тест.",
                "error"
            );
            updateAccess();
            return;
        }

        const student = {
            name: studentInputs.name.value.trim(),
            group: studentInputs.group.value.trim()
        };
        const data = buildReportData(snapshot.experiment);

        elements.studentName.textContent = student.name;
        elements.studentVariant.textContent = String(getStudentVariant());
        elements.studentGroup.textContent = student.group;
        elements.date.textContent = new Intl.DateTimeFormat("uk-UA", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }).format(new Date());
        elements.burner.textContent = `Конфорка ${snapshot.experiment.burner}`;
        renderSchematic(root, elements.schematic);
        elements.quizScore.textContent =
            `${snapshot.quiz.score} із ${QUIZ_TOTAL}`;

        renderExperimentTable(data);
        renderCalculationTable(data);
        renderConclusions(snapshot.analysis.conclusions ?? {});
        cloneReportCharts(elements.charts);

        currentData = {
            student,
            generatedAt: new Date().toISOString(),
            signature: snapshot.analysisSignature
        };

        reportStorage.set("progress", currentData);
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

    elements.form.addEventListener("submit", (event) => {
        event.preventDefault();

        if (!validateStudentFields()) {
            setReadiness(
                "Заповніть прізвище, ім’я та навчальну групу.",
                "error"
            );
            return;
        }

        generateReport();
    });

    elements.form.addEventListener("input", (event) => {
        if (event.target.matches("input")) {
            updateStudentFieldValidity(event.target);
        }

        if (currentData) {
            elements.printButton.disabled = true;

            setReadiness(
                "Дані студента змінено. Сформуйте звіт повторно.",
                "default"
            );
        }
    });

    elements.printButton.addEventListener("click", () => {
        if (!currentData || elements.document.hidden) {
            return;
        }

        const printRoot = createPrintCopy(elements.document);
        let cleaned = false;

        const cleanup = () => {
            if (cleaned) {
                return;
            }

            cleaned = true;
            document.body.classList.remove("lab-report-print-mode");
            printRoot.remove();
            window.removeEventListener("afterprint", cleanup);
        };

        document.body.classList.add("lab-report-print-mode");
        window.addEventListener("afterprint", cleanup);
        window.print();
        window.setTimeout(cleanup, 1500);
    });

    elements.resetButton.addEventListener("click", () => {
        if (!window.confirm(
            "Очистити результати поточного варіанта лабораторної роботи №7?"
        )) {
            return;
        }

        [
            LAB07_CONFIG.storage.experiment,
            LAB07_CONFIG.storage.calculations,
            LAB07_CONFIG.storage.analysis,
            LAB07_CONFIG.storage.quiz,
            LAB07_CONFIG.storage.report
        ].forEach((storageNamespace) => {
            createStorage(
                storageNamespace
            ).clear();
        });

        window.location.reload();
    });

    [
        LAB07_EVENTS.quizCompleted,
        LAB07_EVENTS.quizInvalidated,
        LAB07_EVENTS.analysisCompleted,
        LAB07_EVENTS.analysisInvalidated,
        LAB07_EVENTS.calculationsCompleted,
        LAB07_EVENTS.calculationsInvalidated,
        LAB07_EVENTS.experimentReset
    ].forEach((eventName) => {
        window.addEventListener(eventName, updateAccess);
    });

    restoreStudentData();
    updateAccess();
}
