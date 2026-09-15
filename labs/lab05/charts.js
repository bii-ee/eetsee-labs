import {
    LAB05_EXPERIMENT_RUNS,
    LAB05_EXPERIMENT_STORAGE_KEY,
    LAB05_TOTAL_EXPERIMENTS,
    LAB05_VERIFIED_CALCULATIONS_STORAGE_KEY
} from "./data.js";

import { formatNumber } from "./model.js";
import { createStorage } from "../../common/js/storage.js";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const LAB05_ANALYSIS_STORAGE_KEY = "eetsee.lab05.analysis.v2";
const MINIMUM_CONCLUSION_LENGTH = 30;

const HEATERS = Object.freeze([
    Object.freeze({
        id: "heater-1",
        name: "Нагрівач №1",
        shortName: "№1",
        color: "#b85f37"
    }),
    Object.freeze({
        id: "heater-2",
        name: "Нагрівач №2",
        shortName: "№2",
        color: "#2f7e93"
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

function normalizeExperimentProgress(value) {
    const normalized = {
        records: {}
    };

    LAB05_EXPERIMENT_RUNS.forEach((experiment) => {
        const sourceRecord =
            value?.records?.[experiment.id];

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

        if (!requiredValues.every(isFiniteNumber)) {
            return;
        }

        normalized.records[experiment.id] = {
            experimentId: experiment.id,
            heaterId: experiment.heaterId,
            heaterNumber: experiment.heaterNumber,
            targetVoltageV: Number(
                experiment.targetVoltageV
            ),
            actualVoltageV: Number(
                sourceRecord.actualVoltageV
            ),
            currentA: Number(
                sourceRecord.currentA
            ),
            activePowerW: Number(
                sourceRecord.activePowerW
            ),
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

function getCompletedCount(progress) {
    return LAB05_EXPERIMENT_RUNS.filter(
        (experiment) =>
            progress.records[experiment.id]
                ?.completed === true
    ).length;
}

function isExperimentComplete(progress) {
    return (
        getCompletedCount(progress) ===
        LAB05_TOTAL_EXPERIMENTS
    );
}

function createExperimentSignature(progress) {
    return JSON.stringify(
        LAB05_EXPERIMENT_RUNS.map((experiment) => {
            const record =
                progress.records[experiment.id];

            if (!record) {
                return {
                    id: experiment.id,
                    completed: false
                };
            }

            return {
                id: experiment.id,
                heaterId: record.heaterId,
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
                completed: true
            };
        })
    );
}

function energyField(experimentId) {
    return `energy-${experimentId}`;
}

function normalizeCalculationProgress(value) {
    return {
        values:
            value?.values &&
            typeof value.values === "object"
                ? value.values
                : {},

        completed:
            value?.completed === true,

        signature:
            typeof value?.signature === "string"
                ? value.signature
                : ""
    };
}

function calculationsAreReady(
    experimentProgress,
    calculationProgress
) {
    const correctSignature =
        calculationProgress.signature ===
        createExperimentSignature(
            experimentProgress
        );

    if (
        !isExperimentComplete(experimentProgress) ||
        calculationProgress.completed !== true ||
        !correctSignature
    ) {
        return false;
    }

    return LAB05_EXPERIMENT_RUNS.every(
        (experiment) =>
            parseStudentNumber(
                calculationProgress.values[
                    energyField(experiment.id)
                ]
            ) !== null
    );
}

function buildAnalysisData(
    experimentProgress,
    calculationProgress
) {
    return LAB05_EXPERIMENT_RUNS.map(
        (experiment) => ({
            ...experimentProgress.records[
                experiment.id
            ],

            electricalEnergyWh:
                parseStudentNumber(
                    calculationProgress.values[
                        energyField(experiment.id)
                    ]
                )
        })
    );
}

function createAnalysisSignature(
    experimentProgress,
    calculationProgress
) {
    return JSON.stringify({
        experiment:
            createExperimentSignature(
                experimentProgress
            ),

        energy:
            LAB05_EXPERIMENT_RUNS.map(
                (experiment) => ({
                    id: experiment.id,

                    value:
                        parseStudentNumber(
                            calculationProgress.values[
                                energyField(
                                    experiment.id
                                )
                            ]
                        )
                })
            )
    });
}

function createSvgElement(
    name,
    attributes = {}
) {
    const element =
        document.createElementNS(
            SVG_NAMESPACE,
            name
        );

    Object.entries(attributes).forEach(
        ([key, value]) => {
            element.setAttribute(
                key,
                String(value)
            );
        }
    );

    return element;
}

function appendSvgText(
    parent,
    text,
    attributes = {}
) {
    const element =
        createSvgElement(
            "text",
            attributes
        );

    element.textContent = text;
    parent.append(element);

    return element;
}

function createTicks(
    maximum,
    intervals = 5
) {
    return Array.from(
        {
            length: intervals + 1
        },
        (_, index) =>
            maximum * index / intervals
    );
}

function getNiceMaximum(
    values,
    step
) {
    const maximum =
        Math.max(...values, step);

    let result =
        Math.ceil(maximum / step) * step;

    if (maximum > result * 0.92) {
        result += step;
    }

    return result;
}

function appendLegend(
    container,
    series
) {
    const legend =
        document.createElement("div");

    legend.className =
        "analysis-chart-legend";

    series.forEach((item) => {
        const entry =
            document.createElement("span");

        const marker =
            document.createElement("i");

        marker.style.background =
            item.color;

        entry.append(
            marker,
            document.createTextNode(
                item.name
            )
        );

        legend.append(entry);
    });

    container.append(legend);
}

/*
 * Створення окремої мітки значення.
 *
 * Мітка містить:
 *  - номер нагрівача;
 *  - числове значення;
 *  - колір відповідної серії;
 *  - лінію-вказівник до точки.
 */

function appendPointLabel(
    svg,
    {
        point,
        label,
        color,
        position,
        plot
    }
) {
    const boxHeight = 25;
    const horizontalPadding = 11;
    const estimatedCharacterWidth = 7.2;

    const boxWidth = Math.max(
        66,
        label.length *
            estimatedCharacterWidth +
            horizontalPadding * 2
    );

    const requestedCenterY =
        position === "above"
            ? point.y - 31
            : point.y + 35;

    const centerY = Math.min(
        plot.bottom -
            boxHeight / 2 -
            5,

        Math.max(
            plot.top +
                boxHeight / 2 +
                5,

            requestedCenterY
        )
    );

    const boxX = Math.min(
        plot.right - boxWidth,

        Math.max(
            plot.left,
            point.x - boxWidth / 2
        )
    );

    const boxY =
        centerY - boxHeight / 2;

    const boxCenterX =
        boxX + boxWidth / 2;

    const labelIsAbove =
        centerY < point.y;

    const lineStartY =
        point.y +
        (labelIsAbove ? -9 : 9);

    const lineEndY =
        labelIsAbove
            ? boxY + boxHeight
            : boxY;

    svg.append(
        createSvgElement(
            "line",
            {
                x1: point.x,
                y1: lineStartY,
                x2: boxCenterX,
                y2: lineEndY,
                stroke: color,
                "stroke-width": 1.5,
                "stroke-linecap": "round",
                opacity: 0.78,
                "vector-effect":
                    "non-scaling-stroke",
                "aria-hidden": "true"
            }
        )
    );

    svg.append(
        createSvgElement(
            "rect",
            {
                x: boxX,
                y: boxY,
                width: boxWidth,
                height: boxHeight,
                rx: 7,
                fill: "#ffffff",
                stroke: color,
                "stroke-width": 1.5,
                "vector-effect":
                    "non-scaling-stroke",
                "aria-hidden": "true"
            }
        )
    );

    appendSvgText(
        svg,
        label,
        {
            x: boxCenterX,
            y: centerY + 4.5,
            fill: color,
            "font-family": "inherit",
            "font-size": 13,
            "font-weight": 800,
            "text-anchor": "middle",
            "aria-hidden": "true"
        }
    );
}

/*
 * Побудова графіка порівняння.
 */

function renderComparisonChart(
    container,
    options
) {
    const {
        categories,
        series,
        yMaximum,
        unit,
        xTitle,
        ariaLabel,
        valueDigits = 1,
        tickDigits = 0
    } = options;

    const width = 960;
    const height = 390;

    const plot = {
        left: 72,
        right: 930,
        top: 42,
        bottom: 312
    };

    const plotHeight =
        plot.bottom - plot.top;

    const svg =
        createSvgElement(
            "svg",
            {
                viewBox:
                    `0 0 ${width} ${height}`,

                role: "img",

                "aria-label":
                    ariaLabel,

                preserveAspectRatio:
                    "xMidYMid meet"
            }
        );

    svg.classList.add(
        "analysis-chart-svg"
    );

    function getY(value) {
        return (
            plot.bottom -
            Number(value) /
                yMaximum *
                plotHeight
        );
    }

    /*
     * Горизонтальна сітка
     */

    createTicks(yMaximum).forEach(
        (tick) => {
            const y = getY(tick);

            svg.append(
                createSvgElement(
                    "line",
                    {
                        x1: plot.left,
                        y1: y,
                        x2: plot.right,
                        y2: y,
                        class:
                            "analysis-chart-grid-line"
                    }
                )
            );

            appendSvgText(
                svg,
                formatNumber(
                    tick,
                    tickDigits
                ),
                {
                    x: plot.left - 12,
                    y: y + 5,
                    class:
                        "analysis-chart-tick",
                    "text-anchor": "end"
                }
            );
        }
    );

    /*
     * Осі
     */

    svg.append(
        createSvgElement(
            "line",
            {
                x1: plot.left,
                y1: plot.top,
                x2: plot.left,
                y2: plot.bottom,
                class:
                    "analysis-chart-axis"
            }
        ),

        createSvgElement(
            "line",
            {
                x1: plot.left,
                y1: plot.bottom,
                x2: plot.right,
                y2: plot.bottom,
                class:
                    "analysis-chart-axis"
            }
        )
    );

    appendSvgText(
        svg,
        unit,
        {
            x: plot.left,
            y: 25,
            class:
                "analysis-chart-unit"
        }
    );

    appendSvgText(
        svg,
        xTitle,
        {
            x:
                (
                    plot.left +
                    plot.right
                ) / 2,

            y: 374,

            class:
                "analysis-chart-axis-title",

            "text-anchor": "middle"
        }
    );

    const dataLeft =
        plot.left + 45;

    const dataRight =
        plot.right - 35;

    const stepX =
        categories.length > 1
            ? (
                dataRight -
                dataLeft
            ) /
            (
                categories.length -
                1
            )
            : 0;

    /*
     * Підписи категорій
     */

    categories.forEach(
        (category, index) => {
            appendSvgText(
                svg,
                category,
                {
                    x:
                        dataLeft +
                        stepX * index,

                    y:
                        plot.bottom +
                        27,

                    class:
                        "analysis-chart-category",

                    "text-anchor":
                        "middle"
                }
            );
        }
    );

    /*
     * Підготовка координат усіх серій.
     */

    const renderedSeries =
        series.map((item) => ({
            ...item,

            coordinates:
                item.values.map(
                    (value, index) => ({
                        value:
                            Number(value),

                        x:
                            dataLeft +
                            stepX * index,

                        y:
                            getY(value)
                    })
                )
        }));

    /*
     * Спочатку відображаються всі лінії.
     */

    renderedSeries.forEach(
        (item) => {
            const pathData =
                item.coordinates
                    .map(
                        (
                            point,
                            index
                        ) =>
                            `${
                                index === 0
                                    ? "M"
                                    : "L"
                            } ${
                                point.x
                            } ${
                                point.y
                            }`
                    )
                    .join(" ");

            svg.append(
                createSvgElement(
                    "path",
                    {
                        d: pathData,
                        class:
                            "analysis-chart-line",
                        stroke:
                            item.color
                    }
                )
            );
        }
    );

    /*
     * Після ліній відображаються точки.
     */

    renderedSeries.forEach(
        (item) => {
            item.coordinates.forEach(
                (point, index) => {
                    const valueText =
                        formatNumber(
                            point.value,
                            valueDigits
                        );

                    const accessibleText =
                        `${categories[index]}, ` +
                        `${item.name}: ` +
                        `${valueText} ${unit}`;

                    const circle =
                        createSvgElement(
                            "circle",
                            {
                                cx:
                                    point.x,

                                cy:
                                    point.y,

                                r: 7,

                                fill:
                                    item.color,

                                class:
                                    "analysis-chart-point",

                                tabindex: 0,

                                role:
                                    "img",

                                "aria-label":
                                    accessibleText
                            }
                        );

                    const title =
                        createSvgElement(
                            "title"
                        );

                    title.textContent =
                        accessibleText;

                    circle.append(title);
                    svg.append(circle);
                }
            );
        }
    );

    /*
     * Мітки малюються останніми.
     *
     * Для кожного рівня напруги:
     *  - більше значення розміщується зверху;
     *  - менше значення розміщується знизу;
     *  - якщо значення однакові, №1 зверху,
     *    а №2 знизу.
     */

    renderedSeries.forEach(
        (item, seriesIndex) => {
            item.coordinates.forEach(
                (point, index) => {
                    const valueText =
                        formatNumber(
                            point.value,
                            valueDigits
                        );

                    const valuesAtIndex =
                        renderedSeries.map(
                            (
                                currentSeries
                            ) =>
                                currentSeries
                                    .coordinates[
                                        index
                                    ]
                                    .value
                        );

                    const maximumAtIndex =
                        Math.max(
                            ...valuesAtIndex
                        );

                    const minimumAtIndex =
                        Math.min(
                            ...valuesAtIndex
                        );

                    const position =
                        maximumAtIndex ===
                        minimumAtIndex
                            ? (
                                seriesIndex === 0
                                    ? "above"
                                    : "below"
                            )
                            : (
                                point.value ===
                                maximumAtIndex
                                    ? "above"
                                    : "below"
                            );

                    appendPointLabel(
                        svg,
                        {
                            point,

                            label:
                                `${item.shortName}: ` +
                                `${valueText}`,

                            color:
                                item.color,

                            position,

                            plot
                        }
                    );
                }
            );
        }
    );

    container.replaceChildren(svg);

    appendLegend(
        container,
        series
    );
}

function getSeries(
    analysisData,
    property
) {
    return HEATERS.map(
        (heater) => ({
            name:
                heater.name,

            shortName:
                heater.shortName,

            color:
                heater.color,

            values:
                analysisData
                    .filter(
                        (record) =>
                            record.heaterId ===
                            heater.id
                    )
                    .sort(
                        (
                            first,
                            second
                        ) =>
                            first
                                .targetVoltageV -
                            second
                                .targetVoltageV
                    )
                    .map(
                        (record) =>
                            record[property]
                    )
        })
    );
}

function modeLabel(record) {
    return (
        `Нагрівач №${record.heaterNumber}, ` +
        `${formatNumber(
            record.targetVoltageV,
            0
        )} В`
    );
}

export function initializeAnalysis({
    root = document,
    namespace = "lab05"
} = {}) {
    const section =
        root.querySelector("#analysis");

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
                "#analysis-lock-overlay"
            ),

        interactiveArea:
            section.querySelector(
                "#analysis-interactive-area"
            ),

        dataLabel:
            section.querySelector(
                "#analysis-data-label"
            ),

        experimentCount:
            section.querySelector(
                "#analysis-experiment-count"
            ),

        maxPower:
            section.querySelector(
                "#analysis-max-power"
            ),

        maxPowerMode:
            section.querySelector(
                "#analysis-max-power-mode"
            ),

        minTime:
            section.querySelector(
                "#analysis-min-time"
            ),

        minTimeMode:
            section.querySelector(
                "#analysis-min-time-mode"
            ),

        minEnergy:
            section.querySelector(
                "#analysis-min-energy"
            ),

        minEnergyMode:
            section.querySelector(
                "#analysis-min-energy-mode"
            ),

        currentChart:
            section.querySelector(
                "#chart-current-voltage"
            ),

        powerChart:
            section.querySelector(
                "#chart-power-voltage"
            ),

        timeChart:
            section.querySelector(
                "#chart-time-voltage"
            ),

        energyChart:
            section.querySelector(
                "#chart-energy-voltage"
            ),

        form:
            section.querySelector(
                "#analysis-form"
            ),

        resetButton:
            section.querySelector(
                "#reset-analysis"
            ),

        message:
            section.querySelector(
                "#analysis-message"
            ),

        completePanel:
            section.querySelector(
                "#analysis-complete-panel"
            )
    };

    if (
        Object.values(elements).some(
            (element) => !element
        )
    ) {
        console.warn(
            "Не знайдено елементи розділу аналізу ЛР5."
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

    const analysisStorage =
        createStorage(
            LAB05_ANALYSIS_STORAGE_KEY
        );

    const textareas =
        Array.from(
            elements.form.querySelectorAll(
                "textarea[name]"
            )
        );

    let experimentProgress =
        normalizeExperimentProgress({});

    let calculationProgress =
        normalizeCalculationProgress({});

    let analysisData = [];
    let currentSignature = "";

    let state = {
        conclusions: {},
        completed: false,
        signature: ""
    };

    function setMessage(
        text,
        messageState = "default"
    ) {
        elements.message.textContent =
            text;

        elements.message.dataset.state =
            messageState;
    }

    function dispatchInvalidated() {
        window.dispatchEvent(
            new CustomEvent(
                `${namespace}:analysis-invalidated`
            )
        );
    }

    function readState(signature) {
        const stored =
            analysisStorage.get(
                "progress",
                {}
            );

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
                typeof stored.conclusions ===
                    "object"
                    ? stored.conclusions
                    : {},

            completed:
                stored.completed === true,

            signature
        };
    }

    function saveState() {
        analysisStorage.set(
            "progress",
            state
        );
    }

    function updateCharacterCount(
        textarea
    ) {
        const output =
            elements.form.querySelector(
                `[data-character-count="${textarea.name}"]`
            );

        if (output) {
            output.textContent =
                String(
                    textarea.value
                        .trim()
                        .length
                );
        }
    }

    function restoreConclusions() {
        textareas.forEach(
            (textarea) => {
                textarea.value =
                    state.conclusions[
                        textarea.name
                    ] ?? "";

                textarea.setCustomValidity(
                    ""
                );

                updateCharacterCount(
                    textarea
                );
            }
        );

        elements.completePanel.hidden =
            !state.completed;

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
        const maxPowerRecord =
            analysisData.reduce(
                (best, record) =>
                    record.activePowerW >
                    best.activePowerW
                        ? record
                        : best
            );

        const minTimeRecord =
            analysisData.reduce(
                (best, record) =>
                    record
                        .boilingTimeMinutes <
                    best
                        .boilingTimeMinutes
                        ? record
                        : best
            );

        const minEnergyRecord =
            analysisData.reduce(
                (best, record) =>
                    record
                        .electricalEnergyWh <
                    best
                        .electricalEnergyWh
                        ? record
                        : best
            );

        elements.dataLabel.textContent =
            "2 нагрівачі · 3 рівні напруги";

        elements.experimentCount.textContent =
            `${LAB05_TOTAL_EXPERIMENTS} ` +
            `із ${LAB05_TOTAL_EXPERIMENTS}`;

        elements.maxPower.textContent =
            `${formatNumber(
                maxPowerRecord.activePowerW,
                0
            )} Вт`;

        elements.maxPowerMode.textContent =
            modeLabel(maxPowerRecord);

        elements.minTime.textContent =
            `${formatNumber(
                minTimeRecord
                    .boilingTimeMinutes,
                2
            )} хв`;

        elements.minTimeMode.textContent =
            modeLabel(minTimeRecord);

        elements.minEnergy.textContent =
            `${formatNumber(
                minEnergyRecord
                    .electricalEnergyWh,
                1
            )} Вт·год`;

        elements.minEnergyMode.textContent =
            modeLabel(minEnergyRecord);
    }

    function renderCharts() {
        const categories = [
            "100 В",
            "150 В",
            "200 В"
        ];

        const currentSeries =
            getSeries(
                analysisData,
                "currentA"
            );

        const powerSeries =
            getSeries(
                analysisData,
                "activePowerW"
            );

        const timeSeries =
            getSeries(
                analysisData,
                "boilingTimeMinutes"
            );

        const energySeries =
            getSeries(
                analysisData,
                "electricalEnergyWh"
            );

        renderComparisonChart(
            elements.currentChart,
            {
                categories,
                series: currentSeries,

                yMaximum:
                    getNiceMaximum(
                        currentSeries.flatMap(
                            (seriesItem) =>
                                seriesItem.values
                        ),
                        1
                    ),

                unit: "I, А",

                xTitle:
                    "Задана напруга Uзад, В",

                ariaLabel:
                    "Залежність сили струму нагрівачів від напруги",

                valueDigits: 2,
                tickDigits: 1
            }
        );

        renderComparisonChart(
            elements.powerChart,
            {
                categories,
                series: powerSeries,

                yMaximum:
                    getNiceMaximum(
                        powerSeries.flatMap(
                            (seriesItem) =>
                                seriesItem.values
                        ),
                        250
                    ),

                unit: "P, Вт",

                xTitle:
                    "Задана напруга Uзад, В",

                ariaLabel:
                    "Залежність активної потужності нагрівачів від напруги",

                valueDigits: 0,
                tickDigits: 0
            }
        );

        renderComparisonChart(
            elements.timeChart,
            {
                categories,
                series: timeSeries,

                yMaximum:
                    getNiceMaximum(
                        timeSeries.flatMap(
                            (seriesItem) =>
                                seriesItem.values
                        ),
                        5
                    ),

                unit: "t, хв",

                xTitle:
                    "Задана напруга Uзад, В",

                ariaLabel:
                    "Залежність тривалості нагрівання води від напруги",

                valueDigits: 2,
                tickDigits: 0
            }
        );

        renderComparisonChart(
            elements.energyChart,
            {
                categories,
                series: energySeries,

                yMaximum:
                    getNiceMaximum(
                        energySeries.flatMap(
                            (seriesItem) =>
                                seriesItem.values
                        ),
                        25
                    ),

                unit:
                    "Wел, Вт·год",

                xTitle:
                    "Задана напруга Uзад, В",

                ariaLabel:
                    "Залежність витрат електричної енергії від напруги",

                valueDigits: 1,
                tickDigits: 0
            }
        );
    }

    function invalidateSavedAnalysis() {
        if (!state.completed) {
            return;
        }

        state.completed = false;
        elements.completePanel.hidden =
            true;

        saveState();
        dispatchInvalidated();
    }

    function updateAccess() {
        experimentProgress =
            normalizeExperimentProgress(
                experimentStorage.get(
                    "progress",
                    {}
                )
            );

        calculationProgress =
            normalizeCalculationProgress(
                calculationsStorage.get(
                    "progress",
                    {}
                )
            );

        const ready =
            calculationsAreReady(
                experimentProgress,
                calculationProgress
            );

        elements.lockOverlay.hidden =
            ready;

        elements.interactiveArea.inert =
            !ready;

        if (!ready) {
            invalidateSavedAnalysis();
            currentSignature = "";

            return;
        }

        const signature =
            createAnalysisSignature(
                experimentProgress,
                calculationProgress
            );

        if (
            signature ===
            currentSignature
        ) {
            return;
        }

        currentSignature = signature;

        analysisData =
            buildAnalysisData(
                experimentProgress,
                calculationProgress
            );

        state =
            readState(signature);

        renderSummary();
        renderCharts();
        restoreConclusions();
    }

    elements.form.addEventListener(
        "input",
        (event) => {
            const textarea =
                event.target.closest(
                    "textarea[name]"
                );

            if (!textarea) {
                return;
            }

            textarea.setCustomValidity(
                ""
            );

            updateCharacterCount(
                textarea
            );

            const wasCompleted =
                state.completed;

            state.completed = false;

            state.conclusions[
                textarea.name
            ] = textarea.value;

            elements.completePanel.hidden =
                true;

            saveState();

            if (wasCompleted) {
                dispatchInvalidated();
            }

            setMessage(
                "Чернетку збережено автоматично. Після завершення натисніть «Зберегти висновки»."
            );
        }
    );

    elements.form.addEventListener(
        "submit",
        (event) => {
            event.preventDefault();

            const invalidTextarea =
                textareas.find(
                    (textarea) =>
                        textarea.value
                            .trim()
                            .length <
                        MINIMUM_CONCLUSION_LENGTH
                );

            textareas.forEach(
                (textarea) => {
                    const valid =
                        textarea.value
                            .trim()
                            .length >=
                        MINIMUM_CONCLUSION_LENGTH;

                    textarea.setCustomValidity(
                        valid
                            ? ""
                            : `Введіть щонайменше ${MINIMUM_CONCLUSION_LENGTH} символів.`
                    );
                }
            );

            if (invalidTextarea) {
                invalidTextarea
                    .reportValidity();

                invalidTextarea.focus();

                setMessage(
                    "Доповніть усі три висновки до мінімальної довжини.",
                    "warning"
                );

                return;
            }

            state.conclusions =
                Object.fromEntries(
                    textareas.map(
                        (textarea) => [
                            textarea.name,
                            textarea.value
                                .trim()
                        ]
                    )
                );

            state.completed = true;

            state.signature =
                currentSignature;

            saveState();

            elements.completePanel.hidden =
                false;

            setMessage(
                "Висновки збережено. Можна переходити до контрольних питань.",
                "success"
            );

            window.dispatchEvent(
                new CustomEvent(
                    `${namespace}:analysis-completed`,
                    {
                        detail: {
                            conclusions:
                                state.conclusions,

                            data:
                                analysisData
                        }
                    }
                )
            );
        }
    );

    elements.resetButton.addEventListener(
        "click",
        () => {
            const hasText =
                textareas.some(
                    (textarea) =>
                        textarea.value
                            .trim() !== ""
                );

            if (
                hasText &&
                !window.confirm(
                    "Очистити всі введені висновки?"
                )
            ) {
                return;
            }

            const wasCompleted =
                state.completed;

            state = {
                conclusions: {},
                completed: false,
                signature:
                    currentSignature
            };

            textareas.forEach(
                (textarea) => {
                    textarea.value = "";

                    textarea
                        .setCustomValidity(
                            ""
                        );

                    updateCharacterCount(
                        textarea
                    );
                }
            );

            elements.completePanel.hidden =
                true;

            saveState();

            if (wasCompleted) {
                dispatchInvalidated();
            }

            setMessage(
                "Поля висновків очищено."
            );
        }
    );

    window.addEventListener(
        `${namespace}:calculations-completed`,
        updateAccess
    );

    window.addEventListener(
        `${namespace}:calculations-invalidated`,
        updateAccess
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
        updateAccess
    );

    updateAccess();
}