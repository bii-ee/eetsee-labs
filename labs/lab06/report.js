import {
    LAB06_EXPERIMENT_STORAGE_KEY
} from "./data.js";

const STORAGE_KEYS = {
    experiment:
        LAB06_EXPERIMENT_STORAGE_KEY,

    calculations:
        "eetsee.lab06.calculations.v1",

    calculationsCompleted:
        "eetsee.lab06.calculations.completed.v1",

    analysis:
        "eetsee.lab06.analysis.v1",

    analysisCompleted:
        "eetsee.lab06.analysis.completed.v1",

    quiz:
        "eetsee.lab06.quiz.v1",

    quizCompleted:
        "eetsee.lab06.quiz.completed.v1",

    student:
        "eetsee.lab06.report.student.v1"
};

const CALCULATION_GROUPS = {
    energy: [
        ["voltageRegulation", "kU"],
        ["apparentPower", "S, В·А"],
        ["cosPhi1p", "cosφ₁p"],
        ["nuP", "νp"],
        ["chiP", "χp"],
        ["firstHarmonicCurrent", "I₁, А"]
    ],

    quality: [
        ["reactivePower", "Q, вар"],
        ["distortionPower", "T, В·А"],
        ["currentDistortionFactor", "ν"],
        ["powerFactor", "χ"],
        ["harmonicDistortionFactor", "kI"]
    ]
};

const CONCLUSION_TITLES = [
    "Зміна напруги U₂ зі збільшенням кута керування α",
    "Зміна повної потужності S",
    "Вплив кута керування на cosφ₁p та якість електроенергії"
];

function readJson(
    key,
    fallback = {}
) {
    try {
        const value =
            localStorage.getItem(key);

        return value
            ? JSON.parse(value)
            : fallback;
    } catch (error) {
        console.warn(
            `Не вдалося прочитати ${key}.`,
            error
        );

        return fallback;
    }
}

function writeJson(
    key,
    value
) {
    try {
        localStorage.setItem(
            key,
            JSON.stringify(value)
        );
    } catch (error) {
        console.warn(
            `Не вдалося зберегти ${key}.`,
            error
        );
    }
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatNumber(
    value,
    digits = 2
) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "Не вказано";
    }

    return new Intl.NumberFormat(
        "uk-UA",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: digits
        }
    ).format(number);
}

function displayStudentValue(value) {
    const text =
        String(value ?? "").trim();

    return text || "Не вказано";
}

function extractPositionNumber(
    record,
    index
) {
    const match =
        String(
            record.position ?? ""
        ).match(/\d+/);

    return match
        ? Number(match[0])
        : index + 1;
}

function getReportData() {
    const records =
        readJson(
            STORAGE_KEYS.experiment
        );

    const calculations =
        readJson(
            STORAGE_KEYS.calculations
        );

    const conclusions =
        readJson(
            STORAGE_KEYS.analysis
        );

    const quiz =
        readJson(
            STORAGE_KEYS.quiz
        );

    const rows =
        Object.entries(records)
            .map(
                (
                    [modeId, record],
                    index
                ) => ({
                    modeId,

                    position:
                        extractPositionNumber(
                            record,
                            index
                        ),

                    record,

                    calculation:
                        calculations[modeId]
                })
            )
            .filter(
                (row) =>
                    row.record &&
                    row.calculation
            )
            .sort(
                (first, second) => {
                    const alphaDifference =
                        Number(
                            first.record.alpha
                        ) -
                        Number(
                            second.record.alpha
                        );

                    return Number.isFinite(
                        alphaDifference
                    )
                        ? alphaDifference
                        : first.position -
                        second.position;
                }
            );

    return {
        rows,

        conclusions:
            Object.values(conclusions)
                .map(
                    (value) =>
                        String(value).trim()
                )
                .filter(Boolean),

        quiz
    };
}

function isWorkCompleted() {
    return (
        localStorage.getItem(
            STORAGE_KEYS
                .calculationsCompleted
        ) === "true" &&

        localStorage.getItem(
            STORAGE_KEYS
                .analysisCompleted
        ) === "true" &&

        localStorage.getItem(
            STORAGE_KEYS
                .quizCompleted
        ) === "true"
    );
}

function createMeasuredRows(rows) {
    return rows
        .map(
            ({
                position,
                record
            }) => `
                <tr>
                    <th scope="row">
                        ${position}
                    </th>

                    <td>
                        ${escapeHtml(
                formatNumber(
                    record.alpha,
                    0
                )
            )
                }
                    </td>

                    <td>
                        ${escapeHtml(
                    formatNumber(
                        record.u1,
                        1
                    )
                )
                }
                    </td>

                    <td>
                        ${escapeHtml(
                    formatNumber(
                        record.current,
                        2
                    )
                )
                }
                    </td>

                    <td>
                        ${escapeHtml(
                    formatNumber(
                        record.power,
                        1
                    )
                )
                }
                    </td>

                    <td>
                        ${escapeHtml(
                    formatNumber(
                        record.u2,
                        1
                    )
                )
                }
                    </td>
                </tr>
            `
        )
        .join("");
}

function createCalculationRows(
    rows,
    fields
) {
    return rows
        .map(
            ({
                position,
                calculation
            }) => `
                <tr>
                    <th scope="row">
                        ${position}
                    </th>

                    ${fields
                    .map(
                        ([key]) => `
                                    <td>
                                        ${escapeHtml(
                            displayStudentValue(
                                calculation[
                                key
                                ]
                            )
                        )
                            }
                                    </td>
                                `
                    )
                    .join("")
                }
                </tr>
            `
        )
        .join("");
}

function cloneChart(
    sourceSelector,
    target,
    title
) {
    const source =
        document.querySelector(
            sourceSelector
        );

    const svg =
        source?.querySelector("svg");

    if (!svg) {
        return;
    }

    const figure =
        document.createElement(
            "figure"
        );

    const caption =
        document.createElement(
            "figcaption"
        );

    const clonedSvg =
        svg.cloneNode(true);

    figure.className =
        "report-chart";

    caption.textContent =
        title;

    clonedSvg.removeAttribute(
        "width"
    );

    clonedSvg.removeAttribute(
        "height"
    );

    clonedSvg.setAttribute(
        "preserveAspectRatio",
        "xMidYMid meet"
    );

    figure.append(
        caption,
        clonedSvg
    );

    target.append(figure);
}

export function initializeReport() {
    const panel =
        document.querySelector(
            "#final-report-panel"
        );

    if (!panel) {
        return;
    }

    const form =
        panel.querySelector(
            "#student-report-form"
        );

    const readiness =
        panel.querySelector(
            "#report-readiness"
        );

    const documentBlock =
        panel.querySelector(
            "#report-document"
        );

    const printButton =
        panel.querySelector(
            "#print-report"
        );

    const resetButton =
        panel.querySelector(
            "#reset-lab"
        );

    const measuredBody =
        panel.querySelector(
            "#report-measured-body"
        );

    const energyBody =
        panel.querySelector(
            "#report-energy-body"
        );

    const qualityBody =
        panel.querySelector(
            "#report-quality-body"
        );

    const conclusionsList =
        panel.querySelector(
            "#report-conclusions"
        );

    const charts =
        panel.querySelector(
            "#report-charts"
        );

    const schematic =
        panel.querySelector(
            "#report-schematic"
        );

    if (
        !form ||
        !readiness ||
        !documentBlock ||
        !printButton ||
        !resetButton ||
        !measuredBody ||
        !energyBody ||
        !qualityBody ||
        !conclusionsList ||
        !charts ||
        !schematic
    ) {
        console.warn(
            "Не знайдено елементи підсумкового звіту."
        );

        return;
    }

    const storedStudent =
        readJson(
            STORAGE_KEYS.student
        );

    [
        "studentName",
        "studentGroup",
        "studentBrigade"
    ].forEach((name) => {
        const field =
            form.elements.namedItem(
                name
            );

        if (
            field &&
            storedStudent[name]
        ) {
            field.value =
                storedStudent[name];
        }
    });

    function refreshAvailability() {
        const completed =
            isWorkCompleted();

        panel.hidden =
            !completed;

        if (completed) {
            readiness.dataset.type =
                "success";

            readiness.textContent =
                "Усі етапи виконано. Заповніть дані студента та сформуйте звіт.";
        }
    }

    function renderConclusions(values) {
        conclusionsList.replaceChildren();

        values.forEach(
            (value, index) => {
                const item =
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
                    CONCLUSION_TITLES[
                    index
                    ] ??
                    `Висновок ${index + 1}`;

                paragraph.textContent =
                    value;

                item.append(
                    heading,
                    paragraph
                );

                conclusionsList.append(
                    item
                );
            }
        );
    }
    function renderSchematic() {
        const source =
            document.querySelector(
                ".stand-schematic"
            );

        if (!source) {
            schematic.textContent =
                "Принципову схему не знайдено.";

            return;
        }

        const clonedSvg =
            source.cloneNode(true);

        clonedSvg.removeAttribute(
            "width"
        );

        clonedSvg.removeAttribute(
            "height"
        );

        clonedSvg.setAttribute(
            "viewBox",
            "0 50 1160 520"
        );

        clonedSvg.setAttribute(
            "preserveAspectRatio",
            "xMidYMid meet"
        );

        clonedSvg.setAttribute(
            "aria-label",
            "Принципова схема лабораторної установки"
        );

        schematic.replaceChildren(
            clonedSvg
        );
    }
    function renderCharts() {
        charts.replaceChildren();

        cloneChart(
            "#chart-apparent-power",
            charts,
            "Залежність повної потужності S від положення регулятора"
        );

        cloneChart(
            "#chart-displacement-factor",
            charts,
            "Залежність коефіцієнта зсуву cosφ₁p від положення регулятора"
        );

        cloneChart(
            "#chart-load-voltage",
            charts,
            "Залежність напруги навантаження U₂ від положення регулятора"
        );
    }

    function generateReport() {
        if (
            !form.reportValidity()
        ) {
            return;
        }

        if (!isWorkCompleted()) {
            refreshAvailability();
            return;
        }

        const student =
            Object.fromEntries(
                new FormData(
                    form
                ).entries()
            );

        const data =
            getReportData();

        if (
            data.rows.length !== 3 ||
            data.conclusions.length < 3
        ) {
            readiness.dataset.type =
                "error";

            readiness.textContent =
                "Не вдалося зібрати всі результати. Перевірте розділи 7–9.";

            return;
        }

        writeJson(
            STORAGE_KEYS.student,
            student
        );

        panel.querySelector(
            "#report-student-name"
        ).textContent =
            student.studentName;

        panel.querySelector(
            "#report-student-group"
        ).textContent =
            student.studentGroup;

        panel.querySelector(
            "#report-student-brigade"
        ).textContent =
            student.studentBrigade ||
            "Не вказано";

        panel.querySelector(
            "#report-date"
        ).textContent =
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

        const quizScore =
            Number(
                data.quiz.score
            );

        panel.querySelector(
            "#report-quiz-score"
        ).textContent =
            Number.isFinite(
                quizScore
            )
                ? `${quizScore} із 8`
                : "Тест пройдено";

        measuredBody.innerHTML =
            createMeasuredRows(
                data.rows
            );

        energyBody.innerHTML =
            createCalculationRows(
                data.rows,
                CALCULATION_GROUPS.energy
            );

        qualityBody.innerHTML =
            createCalculationRows(
                data.rows,
                CALCULATION_GROUPS.quality
            );

        renderConclusions(
            data.conclusions
        );

        renderSchematic();
        renderCharts();

        documentBlock.hidden =
            false;

        printButton.disabled =
            false;

        readiness.dataset.type =
            "success";

        readiness.textContent =
            "Звіт сформовано. Перевірте його та збережіть у PDF.";

        documentBlock.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    form.addEventListener(
        "submit",
        (event) => {
            event.preventDefault();
            generateReport();
        }
    );

    async function collectCurrentStyles() {
        const printCssUrl =
            new URL(
                "../../common/css/print.css",
                window.location.href
            ).href;

        const styleNodes = [
            ...document.querySelectorAll(
                'link[rel~="stylesheet"], style'
            )
        ];

        const regularStyleNodes =
            styleNodes.filter(
                (node) => {
                    if (
                        node.tagName ===
                        "STYLE"
                    ) {
                        return true;
                    }

                    return (
                        node.href !==
                        printCssUrl
                    );
                }
            );

        const regularStyles =
            await Promise.all(
                regularStyleNodes.map(
                    async (node) => {
                        if (
                            node.tagName ===
                            "STYLE"
                        ) {
                            return (
                                node.textContent ||
                                ""
                            );
                        }

                        try {
                            const response =
                                await fetch(
                                    node.href,
                                    {
                                        cache:
                                            "no-store"
                                    }
                                );

                            if (!response.ok) {
                                throw new Error(
                                    `HTTP ${response.status}`
                                );
                            }

                            return await response.text();
                        } catch (error) {
                            console.warn(
                                "Не вдалося завантажити CSS:",
                                node.href,
                                error
                            );

                            return "";
                        }
                    }
                )
            );

        const printResponse =
            await fetch(
                printCssUrl,
                {
                    cache: "no-store"
                }
            );

        if (!printResponse.ok) {
            throw new Error(
                `Не вдалося завантажити print.css: HTTP ${printResponse.status}`
            );
        }

        const printStyles =
            await printResponse.text();

        return [
            ...regularStyles,
            printStyles
        ].join("\n");
    }

    async function openPrintableReport() {
        if (documentBlock.hidden) {
            generateReport();
        }

        if (documentBlock.hidden) {
            return;
        }

        const printWindow =
            window.open(
                "",
                "lab06-print-report",
                "width=1280,height=900"
            );

        if (!printWindow) {
            window.alert(
                "Браузер заблокував вікно звіту. Дозвольте спливаючі вікна для цього сайту."
            );

            return;
        }

        const temporaryDocument =
            printWindow.document;

        temporaryDocument.open();

        temporaryDocument.write(`
        <!DOCTYPE html>

        <html lang="uk">
            <head>
                <meta charset="UTF-8">

                <title>
                    Формування звіту
                </title>

                <style>
                    body {
                        display: grid;
                        min-height: 100vh;
                        margin: 0;
                        place-items: center;
                        font-family: Arial, sans-serif;
                        color: #12344d;
                        background: #eef4f7;
                    }
                </style>
            </head>

            <body>
                Формування звіту...
            </body>
        </html>
    `);

        temporaryDocument.close();

        let currentStyles;

        try {
            currentStyles =
                await collectCurrentStyles();
        } catch (error) {
            console.error(error);

            printWindow.close();

            window.alert(
                "Не вдалося завантажити стилі друку. Перевірте файл common/css/print.css."
            );

            return;
        }

        if (printWindow.closed) {
            return;
        }

        const reportCopy =
            documentBlock.cloneNode(
                true
            );

        reportCopy.hidden =
            false;

        reportCopy.removeAttribute(
            "id"
        );

        const safeStyles =
            currentStyles.replace(
                /<\/style/gi,
                "<\\/style"
            );

        const printDocument =
            printWindow.document;

        printDocument.open();

        printDocument.write(`
        <!DOCTYPE html>

        <html lang="uk">
            <head>
                <meta charset="UTF-8">

                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1.0"
                >

                <base href="${document.baseURI}">

                <title>
                    Звіт до лабораторної роботи №6
                </title>

                <style>
                    ${safeStyles}
                </style>

                <style>
                    @media screen {
                        html,
                        body {
                            margin: 0;
                            padding: 0;
                            background: #eef4f7;
                        }

                        #lab-print-root {
                            display: block !important;
                            width: min(
                                1120px,
                                calc(100% - 32px)
                            );
                            margin: 24px auto;
                        }

                        #lab-print-root
                        .report-document {
                            display: block !important;
                            margin: 0;
                        }
                    }
                </style>
            </head>

            <body class="lab-report-print-mode">
                <div id="lab-print-root">
                    ${reportCopy.outerHTML}
                </div>
            </body>
        </html>
    `);

        printDocument.close();

        const fontsReady =
            printDocument.fonts
                ? printDocument.fonts.ready
                : Promise.resolve();

        Promise.resolve(
            fontsReady
        ).then(() => {
            window.setTimeout(
                () => {
                    if (printWindow.closed) {
                        return;
                    }

                    printWindow.focus();
                    printWindow.print();
                },
                500
            );
        });
    }

    printButton.addEventListener(
        "click",
        () => {
            openPrintableReport();
        }
    );





    resetButton.addEventListener(
        "click",
        () => {
            const confirmed =
                window.confirm(
                    "Очистити всі результати лабораторної роботи на цьому пристрої?"
                );

            if (!confirmed) {
                return;
            }

            Object.keys(
                localStorage
            )
                .filter(
                    (key) =>
                        key.startsWith(
                            "eetsee.lab06."
                        )
                )
                .forEach(
                    (key) =>
                        localStorage.removeItem(
                            key
                        )
                );

            window.location.reload();
        }
    );

    [
        "lab06:quiz-completed",
        "lab06:quiz-invalidated",
        "lab06:analysis-invalidated",
        "lab06:calculations-invalidated"
    ].forEach((eventName) => {
        window.addEventListener(
            eventName,
            refreshAvailability
        );
    });

    const quizForm =
        document.querySelector(
            "#quiz-form"
        );

    quizForm?.addEventListener(
        "submit",
        () => {
            window.setTimeout(
                refreshAvailability,
                0
            );
        }
    );

    quizForm?.addEventListener(
        "change",
        () => {
            window.setTimeout(
                refreshAvailability,
                0
            );
        }
    );

    refreshAvailability();
}