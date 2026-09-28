import { createSvgElement } from "../../common/js/svg-elements.js";

import {
    createStorage
} from "../../common/js/storage.js";

import {
    LAB07_CONFIG,
    LAB07_EVENTS
} from "./config.js";


const MODES = [
    { id: "mode-1", position: 1 },
    { id: "mode-2", position: 2 },
    { id: "mode-3", position: 3 }
];

const CYCLES_PER_MODE = 3;
const MINIMUM_CONCLUSION_LENGTH = 30;

const COLORS = {
    duty: "#0e87a8",
    on: "#c45f3b",
    off: "#2f8260",
    cycle: "#397a95",
    temperatureModes: ["#0e87a8", "#c45f3b", "#6a549b"]
};

function isFiniteNumber(value) {
    return value !== null && value !== "" &&
        Number.isFinite(Number(value));
}

function formatNumber(value, digits = 1) {
    return new Intl.NumberFormat("uk-UA", {
        minimumFractionDigits: 0,
        maximumFractionDigits: digits
    }).format(value);
}

function average(values) {
    return values.reduce((sum, value) => sum + value, 0) /
        values.length;
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
    return MODES.every(
        (mode) =>
            isFiniteNumber(progress.records[mode.id]?.tau0) &&
            progress.records[mode.id]?.cycles.length ===
            CYCLES_PER_MODE
    );
}

function createCalculationSignature(progress) {
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

function buildAnalysisData(progress) {
    return MODES.map((mode) => {
        const record = progress.records[mode.id];
        const dutyCycles = record.cycles.map((cycle) => {
            const duration = cycle.tOn + cycle.tOff;

            return duration > 0
                ? cycle.tOn / duration * 100
                : 0;
        });

        return {
            id: mode.id,
            position: mode.position,
            tau0: record.tau0,
            cycles: record.cycles,
            dutyCycles,
            averageDutyCycle: average(dutyCycles),
            averageOn: average(
                record.cycles.map((cycle) => cycle.tOn)
            ),
            averageOff: average(
                record.cycles.map((cycle) => cycle.tOff)
            ),
            averageCycle: average(
                record.cycles.map(
                    (cycle) => cycle.tOn + cycle.tOff
                )
            )
        };
    });
}

// Each mode starts at its own measured temperature and its own time zero.
export function buildTemperatureTimeline(mode) {
    const points = [{
        time: 0,
        temperature: mode.tau0,
        phase: "Початкова температура",
        cycle: 0
    }];
    let time = 0;

    mode.cycles.forEach((cycle, index) => {
        time += cycle.tOn;
        points.push({
            time,
            temperature: cycle.tauOn,
            phase: "Після нагрівання",
            cycle: index + 1
        });

        time += cycle.tOff;
        points.push({
            time,
            temperature: cycle.tauOff,
            phase: "Після охолодження",
            cycle: index + 1
        });
    });

    return points;
}



function appendSvgText(parent, text, attributes = {}) {
    const element = createSvgElement("text", attributes);
    element.textContent = text;
    parent.append(element);

    return element;
}

function createTicks(maximum, intervals = 5) {
    return Array.from(
        { length: intervals + 1 },
        (_, index) => maximum * index / intervals
    );
}

function getNiceMaximum(values, step) {
    const maximum = Math.max(...values, step);
    let result = Math.ceil(maximum / step) * step;

    if (maximum > result * 0.92) {
        result += step;
    }

    return result;
}

function appendChartBase(svg, {
    plot,
    yMaximum,
    unit,
    xTitle,
    tickDigits = 0
}) {
    const plotHeight = plot.bottom - plot.top;

    function getY(value) {
        return plot.bottom - value / yMaximum * plotHeight;
    }

    createTicks(yMaximum, 5).forEach((tick) => {
        const y = getY(tick);

        svg.append(
            createSvgElement("line", {
                x1: plot.left,
                y1: y,
                x2: plot.right,
                y2: y,
                class: "analysis-chart-grid-line"
            })
        );

        appendSvgText(
            svg,
            formatNumber(tick, tickDigits),
            {
                x: plot.left - 12,
                y: y + 5,
                class: "analysis-chart-tick",
                "text-anchor": "end"
            }
        );
    });

    svg.append(
        createSvgElement("line", {
            x1: plot.left,
            y1: plot.top,
            x2: plot.left,
            y2: plot.bottom,
            class: "analysis-chart-axis"
        }),
        createSvgElement("line", {
            x1: plot.left,
            y1: plot.bottom,
            x2: plot.right,
            y2: plot.bottom,
            class: "analysis-chart-axis"
        })
    );

    appendSvgText(svg, unit, {
        x: plot.left,
        y: 28,
        class: "analysis-chart-unit"
    });

    appendSvgText(svg, xTitle, {
        x: (plot.left + plot.right) / 2,
        y: 378,
        class: "analysis-chart-axis-title",
        "text-anchor": "middle"
    });

    return getY;
}

function appendLegend(container, series) {
    const legend = document.createElement("div");
    legend.className = "analysis-chart-legend";

    series.forEach((item) => {
        const entry = document.createElement("span");
        const marker = document.createElement("i");

        marker.style.background = item.color;
        entry.append(marker, document.createTextNode(item.name));
        legend.append(entry);
    });

    container.append(legend);
}

function renderBarChart(container, {
    categories,
    series,
    yMaximum,
    unit,
    xTitle,
    ariaLabel,
    valueDigits = 1,
    tickDigits = 0
}) {
    const width = 760;
    const height = 400;
    const plot = {
        left: 72,
        right: 730,
        top: 52,
        bottom: 315
    };

    const svg = createSvgElement("svg", {
        viewBox: `0 0 ${width} ${height}`,
        role: "img",
        "aria-label": ariaLabel,
        preserveAspectRatio: "xMidYMid meet"
    });
    svg.classList.add("analysis-chart-svg");

    const getY = appendChartBase(svg, {
        plot,
        yMaximum,
        unit,
        xTitle,
        tickDigits
    });

    const categoryWidth =
        (plot.right - plot.left) / categories.length;
    const usableWidth = categoryWidth * 0.68;
    const gap = series.length > 1 ? 7 : 0;
    const barWidth = Math.min(
        64,
        (usableWidth - gap * (series.length - 1)) /
        series.length
    );
    const groupWidth =
        barWidth * series.length + gap * (series.length - 1);

    categories.forEach((category, categoryIndex) => {
        const centerX =
            plot.left + categoryWidth * (categoryIndex + 0.5);

        series.forEach((item, seriesIndex) => {
            const value = Number(item.values[categoryIndex]);
            const x = centerX - groupWidth / 2 +
                seriesIndex * (barWidth + gap);
            const y = getY(value);
            const barHeight = plot.bottom - y;
            const bar = createSvgElement("rect", {
                x,
                y,
                width: barWidth,
                height: Math.max(0, barHeight),
                rx: 5,
                fill: item.color,
                class: "analysis-chart-bar",
                tabindex: 0,
                role: "img",
                "aria-label":
                    `${category}, ${item.name}: ` +
                    `${formatNumber(value, valueDigits)} ${unit}`
            });
            const title = createSvgElement("title");
            title.textContent =
                `${category}, ${item.name}: ` +
                `${formatNumber(value, valueDigits)} ${unit}`;
            bar.append(title);
            svg.append(bar);

            appendSvgText(
                svg,
                formatNumber(value, valueDigits),
                {
                    x: x + barWidth / 2,
                    y: Math.max(plot.top + 14, y - 8),
                    class: "analysis-chart-value",
                    "text-anchor": "middle"
                }
            );
        });

        appendSvgText(svg, category, {
            x: centerX,
            y: plot.bottom + 27,
            class: "analysis-chart-category",
            "text-anchor": "middle"
        });
    });

    container.replaceChildren(svg);
    appendLegend(container, series);
}

function renderTemperatureChart(container, modes) {
    const plot = {
        left: 76,
        right: 870,
        top: 52,
        bottom: 322
    };
    const series = modes.map((mode, index) => ({
        name: `Положення ${mode.position}`,
        color: COLORS.temperatureModes[index],
        points: buildTemperatureTimeline(mode)
    }));
    const allPoints = series.flatMap((item) => item.points);
    const longestDuration = Math.max(
        ...allPoints.map((point) => point.time)
    );
    const xStep = Math.max(
        10,
        10 ** Math.floor(Math.log10(longestDuration / 5))
    );
    const xMaximum = getNiceMaximum(
        [longestDuration],
        xStep
    );
    const yMaximum = getNiceMaximum(
        allPoints.map((point) => point.temperature),
        50
    );
    const svg = createSvgElement("svg", {
        viewBox: "0 0 900 420",
        role: "img",
        "aria-label":
            "Температура конфорки залежно від накопиченого часу; " +
            "кожне положення регулятора починається з нуля секунд",
        preserveAspectRatio: "xMidYMid meet"
    });
    svg.classList.add("analysis-chart-svg");

    const getY = appendChartBase(svg, {
        plot,
        yMaximum,
        unit: "τ, °C",
        xTitle: "Час від початку режиму t, с"
    });
    const getX = (time) =>
        plot.left + time / xMaximum * (plot.right - plot.left);

    createTicks(xMaximum, 5).forEach((tick) => {
        const x = getX(tick);
        svg.append(createSvgElement("line", {
            x1: x,
            y1: plot.top,
            x2: x,
            y2: plot.bottom,
            class: "analysis-chart-grid-line"
        }));
        appendSvgText(svg, formatNumber(tick, 0), {
            x,
            y: plot.bottom + 27,
            class: "analysis-chart-category",
            "text-anchor": "middle"
        });
    });

    series.forEach((item) => {
        const path = item.points.map((point, index) =>
            `${index === 0 ? "M" : "L"} ` +
            `${getX(point.time)} ${getY(point.temperature)}`
        ).join(" ");
        svg.append(createSvgElement("path", {
            d: path,
            class: "analysis-chart-line",
            stroke: item.color
        }));

        item.points.forEach((point) => {
            const label =
                `${item.name}, ${point.phase}` +
                (point.cycle ? ` циклу ${point.cycle}` : "") +
                `: ${formatNumber(point.time, 1)} с, ` +
                `${formatNumber(point.temperature, 1)} °C`;
            const circle = createSvgElement("circle", {
                cx: getX(point.time),
                cy: getY(point.temperature),
                r: 6,
                fill: item.color,
                class: "analysis-chart-point",
                tabindex: 0,
                role: "img",
                "aria-label": label
            });
            const title = createSvgElement("title");
            title.textContent = label;
            circle.append(title);
            svg.append(circle);
        });
    });

    container.replaceChildren(svg);
    appendLegend(container, series);
}

export function initializeAnalysis({
    root = document,
    namespace = "lab07"
} = {}) {
    const section = root.querySelector("#analysis");

    if (!section || section.dataset.initialized === "true") {
        return;
    }

    const elements = {
        lockOverlay: section.querySelector(
            "#analysis-lock-overlay"
        ),
        interactiveArea: section.querySelector(
            "#analysis-interactive-area"
        ),
        burnerLabel: section.querySelector(
            "#analysis-burner-label"
        ),
        cycleCount: section.querySelector(
            "#analysis-cycle-count"
        ),
        dutyMode1: section.querySelector(
            "#analysis-duty-mode-1"
        ),
        dutyMode2: section.querySelector(
            "#analysis-duty-mode-2"
        ),
        dutyMode3: section.querySelector(
            "#analysis-duty-mode-3"
        ),
        dutyChart: section.querySelector(
            "#chart-duty-cycle"
        ),
        durationChart: section.querySelector(
            "#chart-cycle-duration"
        ),
        temperatureChart: section.querySelector(
            "#chart-cycle-temperature"
        ),
        form: section.querySelector("#analysis-form"),
        resetButton: section.querySelector("#reset-analysis"),
        message: section.querySelector("#analysis-message"),
        completePanel: section.querySelector(
            "#analysis-complete-panel"
        )
    };

    if (Object.values(elements).some((element) => !element)) {
        console.warn(
            "Не знайдено елементи розділу аналізу ЛР7."
        );
        return;
    }

    section.dataset.initialized = "true";

    const experimentStorage = createStorage(
        LAB07_CONFIG.storage.experiment
    );

    const calculationsStorage = createStorage(
        LAB07_CONFIG.storage.calculations
    );

    const analysisStorage = createStorage(
        LAB07_CONFIG.storage.analysis
    );

    const textareas = [
        ...elements.form.querySelectorAll("textarea[name]")
    ];

    let experimentProgress = normalizeExperimentProgress({});
    let analysisData = [];
    let currentSignature = "";
    let state = {
        conclusions: {},
        completed: false,
        signature: ""
    };

    function setMessage(text, messageState = "default") {
        elements.message.textContent = text;
        elements.message.dataset.state = messageState;
    }

    function dispatchInvalidated() {
        window.dispatchEvent(
            new CustomEvent(LAB07_EVENTS.analysisInvalidated)
        );
    }

    function readState(signature) {
        const stored = analysisStorage.get("progress", {});

        if (
            !stored ||
            typeof stored !== "object" ||
            stored.signature !== signature
        ) {
            return {
                conclusions: {},
                completed: false,
                signature
            };
        }

        return {
            conclusions:
                stored.conclusions &&
                    typeof stored.conclusions === "object"
                    ? stored.conclusions
                    : {},
            completed: stored.completed === true,
            signature
        };
    }

    function saveState() {
        analysisStorage.set("progress", state);
    }

    function updateCharacterCount(textarea) {
        const output = elements.form.querySelector(
            `[data-character-count="${textarea.name}"]`
        );

        if (output) {
            output.textContent = String(textarea.value.trim().length);
        }
    }

    function restoreConclusions() {
        textareas.forEach((textarea) => {
            textarea.value = state.conclusions[textarea.name] ?? "";
            textarea.setCustomValidity("");
            updateCharacterCount(textarea);
        });

        elements.completePanel.hidden = !state.completed;

        if (state.completed) {
            setMessage(
                "Висновки збережено. Можна переходити до контрольних питань.",
                "success"
            );
        } else {
            setMessage(
                "Проаналізуйте графіки та заповніть усі три поля."
            );
        }
    }

    function renderSummary() {
        elements.burnerLabel.textContent =
            `Досліджувана конфорка: ${experimentProgress.burner}`;
        elements.cycleCount.textContent = "9 із 9";

        [
            elements.dutyMode1,
            elements.dutyMode2,
            elements.dutyMode3
        ].forEach((element, index) => {
            element.textContent =
                `${formatNumber(
                    analysisData[index].averageDutyCycle,
                    1
                )} %`;
        });
    }

    function renderCharts() {
        const modeCategories = analysisData.map(
            (mode) => `Положення ${mode.position}`
        );

        renderBarChart(elements.dutyChart, {
            categories: modeCategories,
            series: [
                {
                    name: "Середнє ТВ",
                    color: COLORS.duty,
                    values: analysisData.map(
                        (mode) => mode.averageDutyCycle
                    )
                }
            ],
            yMaximum: 100,
            unit: "%",
            xTitle: "Положення регулятора",
            ariaLabel:
                "Середня відносна тривалість увімкнення за положеннями регулятора",
            valueDigits: 1,
            tickDigits: 0
        });

        const durationValues = analysisData.flatMap((mode) => [
            mode.averageOn,
            mode.averageOff,
            mode.averageCycle
        ]);

        renderBarChart(elements.durationChart, {
            categories: modeCategories,
            series: [
                {
                    name: "Увімкнення tн",
                    color: COLORS.on,
                    values: analysisData.map(
                        (mode) => mode.averageOn
                    )
                },
                {
                    name: "Вимкнення tо",
                    color: COLORS.off,
                    values: analysisData.map(
                        (mode) => mode.averageOff
                    )
                },
                {
                    name: "Повний цикл Tц",
                    color: COLORS.cycle,
                    values: analysisData.map(
                        (mode) => mode.averageCycle
                    )
                }
            ],
            yMaximum: getNiceMaximum(durationValues, 10),
            unit: "с",
            xTitle: "Положення регулятора",
            ariaLabel:
                "Середні тривалості увімкнення, вимкнення та повного циклу",
            valueDigits: 1,
            tickDigits: 0
        });

        renderTemperatureChart(
            elements.temperatureChart,
            analysisData
        );
    }

    function calculationsAreReady() {
        const calculations = calculationsStorage.get("progress", {});
        const expectedSignature = createCalculationSignature(
            experimentProgress
        );

        return (
            isExperimentComplete(experimentProgress) &&
            calculations?.completed === true &&
            calculations?.signature === expectedSignature
        );
    }

    function invalidateSavedAnalysis() {
        const saved = analysisStorage.get("progress", {});
        if (!state.completed && saved?.completed !== true) {
            return;
        }

        // При старті state ще може бути порожнім, а у сховищі лишився старий допуск.
        if (!currentSignature) {
            state = { ...state, ...saved };
        }
        state.completed = false;
        elements.completePanel.hidden = true;
        saveState();
        dispatchInvalidated();
    }

    function updateAccess() {
        experimentProgress = normalizeExperimentProgress(
            experimentStorage.get("progress", {})
        );

        const ready = calculationsAreReady();

        elements.lockOverlay.hidden = ready;
        elements.interactiveArea.inert = !ready;

        if (!ready) {
            invalidateSavedAnalysis();
            return;
        }

        const signature = createAnalysisSignature(
            experimentProgress
        );

        if (signature !== currentSignature) {
            currentSignature = signature;
            analysisData = buildAnalysisData(experimentProgress);
            state = readState(signature);
            renderSummary();
            renderCharts();
            restoreConclusions();
        }
    }

    elements.form.addEventListener("input", (event) => {
        const textarea = event.target.closest("textarea[name]");

        if (!textarea) {
            return;
        }

        textarea.setCustomValidity("");
        updateCharacterCount(textarea);

        const wasCompleted = state.completed;
        state.completed = false;
        state.conclusions[textarea.name] = textarea.value;
        elements.completePanel.hidden = true;
        saveState();

        if (wasCompleted) {
            dispatchInvalidated();
        }

        setMessage(
            "Чернетку збережено автоматично. Після завершення натисніть «Зберегти висновки»."
        );
    });

    elements.form.addEventListener("submit", (event) => {
        event.preventDefault();

        const invalidTextarea = textareas.find(
            (textarea) =>
                textarea.value.trim().length <
                MINIMUM_CONCLUSION_LENGTH
        );

        textareas.forEach((textarea) => {
            const valid =
                textarea.value.trim().length >=
                MINIMUM_CONCLUSION_LENGTH;

            textarea.setCustomValidity(
                valid
                    ? ""
                    : `Введіть щонайменше ${MINIMUM_CONCLUSION_LENGTH} символів.`
            );
        });

        if (invalidTextarea) {
            invalidTextarea.reportValidity();
            invalidTextarea.focus();
            setMessage(
                "Доповніть усі три висновки до мінімальної довжини.",
                "warning"
            );
            return;
        }

        state.conclusions = Object.fromEntries(
            textareas.map((textarea) => [
                textarea.name,
                textarea.value.trim()
            ])
        );
        state.completed = true;
        state.signature = currentSignature;
        saveState();

        elements.completePanel.hidden = false;
        setMessage(
            "Висновки збережено. Можна переходити до контрольних питань.",
            "success"
        );

        window.dispatchEvent(
            new CustomEvent(LAB07_EVENTS.analysisCompleted, {
                detail: {
                    burner: experimentProgress.burner,
                    conclusions: state.conclusions,
                    data: analysisData
                }
            })
        );
    });

    elements.resetButton.addEventListener("click", () => {
        const hasText = textareas.some(
            (textarea) => textarea.value.trim() !== ""
        );

        if (
            hasText &&
            !window.confirm("Очистити всі введені висновки?")
        ) {
            return;
        }

        const wasCompleted = state.completed;

        state = {
            conclusions: {},
            completed: false,
            signature: currentSignature
        };
        textareas.forEach((textarea) => {
            textarea.value = "";
            textarea.setCustomValidity("");
            updateCharacterCount(textarea);
        });

        elements.completePanel.hidden = true;
        saveState();

        if (wasCompleted) {
            dispatchInvalidated();
        }

        setMessage("Поля висновків очищено.");
    });

    window.addEventListener(
        LAB07_EVENTS.calculationsCompleted,
        updateAccess
    );
    window.addEventListener(
        LAB07_EVENTS.calculationsInvalidated,
        updateAccess
    );
    window.addEventListener(
        LAB07_EVENTS.experimentReset,
        updateAccess
    );

    updateAccess();
}
