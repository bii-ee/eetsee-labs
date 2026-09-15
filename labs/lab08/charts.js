import {
    createStorage
} from "../../common/js/storage.js";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

const REQUIRED_CYCLE_COUNT = 6;
const REQUIRED_TRIAL_COUNT = 9;
const MINIMUM_CONCLUSION_LENGTH = 30;
const STATE_VERSION = 1;

const COLORS = Object.freeze({
    power: "#c45f3b",
    off: "#8ba0aa",
    temperature110: "#267a96",
    temperature160: "#d99524",
    temperature240: "#b64f3b"
});

function isFiniteNumber(value) {
    return Number.isFinite(Number(value));
}

function formatNumber(value, digits = 1) {
    return Number(value).toLocaleString("uk-UA", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
    });
}

function normalizeExperimentProgress(value) {
    const setupSource =
        value?.setup && typeof value.setup === "object"
            ? value.setup
            : {};

    const firstSource = Array.isArray(
        value?.experimentOne?.records
    )
        ? value.experimentOne.records
        : [];

    const secondSource = Array.isArray(
        value?.experimentTwo?.records
    )
        ? value.experimentTwo.records
        : [];

    const firstRecords = firstSource
        .filter(
            (record) =>
                isFiniteNumber(record?.voltage) &&
                isFiniteNumber(record?.current) &&
                isFiniteNumber(record?.power) &&
                isFiniteNumber(
                    record?.onTime ?? record?.tOn
                ) &&
                isFiniteNumber(
                    record?.offTime ?? record?.tOff
                )
        )
        .slice(0, REQUIRED_CYCLE_COUNT)
        .map((record, index) => ({
            cycle: Number(record.cycle) || index + 1,
            voltage: Number(record.voltage),
            current: Number(record.current),
            power: Number(record.power),
            onTime: Number(
                record.onTime ?? record.tOn
            ),
            offTime: Number(
                record.offTime ?? record.tOff
            )
        }));

    const secondRecords = secondSource
        .filter(
            (record) =>
                isFiniteNumber(record?.setTemperature) &&
                isFiniteNumber(record?.setVoltage) &&
                isFiniteNumber(record?.voltage) &&
                isFiniteNumber(record?.current) &&
                isFiniteNumber(record?.power) &&
                isFiniteNumber(record?.boilingTime)
        )
        .slice(0, REQUIRED_TRIAL_COUNT)
        .map((record, index) => ({
            trial: Number(record.trial) || index + 1,
            setTemperature: Number(
                record.setTemperature
            ),
            setVoltage: Number(record.setVoltage),
            voltage: Number(record.voltage),
            initialTemperature: isFiniteNumber(
                record.initialTemperature
            )
                ? Number(record.initialTemperature)
                : null,
            current: Number(record.current),
            power: Number(record.power),
            boilingTime: Number(record.boilingTime)
        }));

    const waterMass = Number(
        setupSource.waterMass
    );

    const initialTemperature = Number(
        setupSource.initialTemperature
    );

    const setupValid =
        setupSource.confirmed === true &&
        Number.isFinite(waterMass) &&
        waterMass > 0 &&
        Number.isFinite(initialTemperature) &&
        initialTemperature < 100;

    return {
        setup: {
            confirmed: setupValid,
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

function createExperimentSignature(progress) {
    return JSON.stringify({
        waterMass:
            progress.setup.waterMass,

        initialTemperature:
            progress.setup.initialTemperature,

        cycles:
            progress.firstRecords.map(
                (record) => ({
                    cycle: record.cycle,
                    voltage: record.voltage,
                    current: record.current,
                    power: record.power,
                    onTime: record.onTime,
                    offTime: record.offTime
                })
            )
    });
}

function createAnalysisSignature(
    progress,
    results
) {
    return JSON.stringify({
        setup: progress.setup,
        cycles: progress.firstRecords,
        trials: progress.secondRecords,

        calculations: {
            totalElectricalEnergy:
                results.totalElectricalEnergy,

            usefulHeat:
                results.usefulHeat,

            thermalEfficiency:
                results.thermalEfficiency
        }
    });
}

function createInitialState(signature = "") {
    return {
        version: STATE_VERSION,
        signature,
        conclusions: {},
        completed: false
    };
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
    minimum,
    maximum,
    intervals = 5
) {
    return Array.from(
        {
            length: intervals + 1
        },
        (_, index) =>
            minimum +
            (
                (maximum - minimum) *
                index
            ) /
            intervals
    );
}

function niceMaximum(
    values,
    step,
    minimum = step
) {
    const maximum =
        Math.max(
            minimum,
            ...values
        );

    return (
        Math.ceil(
            maximum / step
        ) *
        step
    );
}

function appendChartAxes(
    svg,
    {
        plot,
        xMinimum,
        xMaximum,
        yMinimum,
        yMaximum,
        xUnit,
        yUnit,
        xDigits = 0,
        yDigits = 1,
        xTicks = null
    }
) {
    const plotWidth =
        plot.right - plot.left;

    const plotHeight =
        plot.bottom - plot.top;

    function getX(value) {
        return (
            plot.left +
            (
                (value - xMinimum) /
                (xMaximum - xMinimum)
            ) *
            plotWidth
        );
    }

    function getY(value) {
        return (
            plot.bottom -
            (
                (value - yMinimum) /
                (yMaximum - yMinimum)
            ) *
            plotHeight
        );
    }

    createTicks(
        yMinimum,
        yMaximum,
        5
    ).forEach((tick) => {
        const y = getY(tick);

        svg.append(
            createSvgElement("line", {
                x1: plot.left,
                y1: y,
                x2: plot.right,
                y2: y,
                class:
                    "analysis-chart-grid-line"
            })
        );

        appendSvgText(
            svg,
            formatNumber(
                tick,
                yDigits
            ),
            {
                x: plot.left - 13,
                y: y + 5,
                class:
                    "analysis-chart-tick",
                "text-anchor": "end"
            }
        );
    });

    const horizontalTicks =
        Array.isArray(xTicks)
            ? xTicks
            : createTicks(
                xMinimum,
                xMaximum,
                5
            );

    horizontalTicks.forEach((tick) => {
        const x = getX(tick);

        svg.append(
            createSvgElement("line", {
                x1: x,
                y1: plot.top,
                x2: x,
                y2: plot.bottom,
                class:
                    "analysis-chart-grid-line"
            })
        );

        appendSvgText(
            svg,
            formatNumber(
                tick,
                xDigits
            ),
            {
                x,
                y: plot.bottom + 26,
                class:
                    "analysis-chart-tick",
                "text-anchor": "middle"
            }
        );
    });

    svg.append(
        createSvgElement("line", {
            x1: plot.left,
            y1: plot.top,
            x2: plot.left,
            y2: plot.bottom,
            class:
                "analysis-chart-axis"
        }),

        createSvgElement("line", {
            x1: plot.left,
            y1: plot.bottom,
            x2: plot.right,
            y2: plot.bottom,
            class:
                "analysis-chart-axis"
        })
    );

    appendSvgText(
        svg,
        yUnit,
        {
            x: plot.left,
            y: 29,
            class:
                "analysis-chart-unit"
        }
    );

    appendSvgText(
        svg,
        xUnit,
        {
            x:
                (
                    plot.left +
                    plot.right
                ) /
                2,

            y: plot.bottom + 58,

            class:
                "analysis-chart-axis-title",

            "text-anchor":
                "middle"
        }
    );

    return {
        getX,
        getY
    };
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

function renderPowerTimeline(
    container,
    cycles
) {
    const width = 980;
    const height = 440;

    const plot = {
        left: 82,
        right: 950,
        top: 52,
        bottom: 340
    };

    const totalDuration =
        cycles.reduce(
            (sum, cycle) =>
                sum +
                cycle.onTime +
                cycle.offTime,
            0
        );

    const yMaximum =
        niceMaximum(
            cycles.map(
                (cycle) =>
                    cycle.power
            ),
            0.5,
            2
        );

    const svg =
        createSvgElement("svg", {
            viewBox:
                `0 0 ${width} ${height}`,

            role: "img",

            "aria-label":
                "Ступінчастий графік активної потужності за шість циклів",

            preserveAspectRatio:
                "xMidYMid meet"
        });

    svg.classList.add(
        "analysis-chart-svg"
    );

    const {
        getX,
        getY
    } = appendChartAxes(
        svg,
        {
            plot,
            xMinimum: 0,
            xMaximum: totalDuration,
            yMinimum: 0,
            yMaximum,
            xUnit: "t, с",
            yUnit: "P, кВт",
            xDigits: 1,
            yDigits: 1
        }
    );

    let elapsed = 0;

    let pathData =
        `M ${getX(0)} ${getY(0)}`;

    cycles.forEach(
        (cycle, index) => {
            const cycleStart =
                elapsed;

            const onEnd =
                cycleStart +
                cycle.onTime;

            const cycleEnd =
                onEnd +
                cycle.offTime;

            const activeArea =
                createSvgElement(
                    "rect",
                    {
                        x:
                            getX(
                                cycleStart
                            ),

                        y: plot.top,

                        width:
                            getX(onEnd) -
                            getX(
                                cycleStart
                            ),

                        height:
                            plot.bottom -
                            plot.top,

                        class:
                            "analysis-chart-on-area"
                    }
                );

            svg.insertBefore(
                activeArea,
                svg.firstChild
            );

            pathData +=
                ` V ${getY(
                    cycle.power
                )}` +
                ` H ${getX(onEnd)}` +
                ` V ${getY(0)}` +
                ` H ${getX(cycleEnd)}`;

            appendSvgText(
                svg,
                formatNumber(
                    cycle.power,
                    2
                ),
                {
                    x:
                        (
                            getX(
                                cycleStart
                            ) +
                            getX(onEnd)
                        ) /
                        2,

                    y:
                        getY(
                            cycle.power
                        ) -
                        10,

                    class:
                        "analysis-chart-value",

                    "text-anchor":
                        "middle"
                }
            );

            appendSvgText(
                svg,
                `Ц${index + 1}`,
                {
                    x:
                        (
                            getX(
                                cycleStart
                            ) +
                            getX(
                                cycleEnd
                            )
                        ) /
                        2,

                    y:
                        plot.top +
                        18,

                    class:
                        "analysis-chart-cycle-label",

                    "text-anchor":
                        "middle"
                }
            );

            elapsed =
                cycleEnd;
        }
    );

    const path =
        createSvgElement(
            "path",
            {
                d: pathData,

                class:
                    "analysis-chart-step-line",

                stroke:
                    COLORS.power
            }
        );

    const title =
        createSvgElement("title");

    title.textContent =
        "Загальна тривалість шести циклів: " +
        `${formatNumber(
            totalDuration,
            2
        )} с`;

    path.append(title);
    svg.append(path);

    container.replaceChildren(svg);

    appendLegend(
        container,
        [
            {
                name:
                    "Конфорка увімкнена: P = Pi",

                color:
                    COLORS.power
            },
            {
                name:
                    "Конфорка вимкнена: P = 0",

                color:
                    COLORS.off
            }
        ]
    );
}

function groupTrialsByTemperature(
    trials,
    valueKey
) {
    const temperatures = [
        ...new Set(
            trials.map(
                (trial) =>
                    trial.setTemperature
            )
        )
    ].sort(
        (first, second) =>
            first - second
    );

    const temperatureColors = {
        110:
            COLORS.temperature110,

        160:
            COLORS.temperature160,

        240:
            COLORS.temperature240
    };

    const fallbackColors = [
        COLORS.temperature110,
        COLORS.temperature160,
        COLORS.temperature240
    ];

    return temperatures.map(
        (temperature, index) => ({
            name:
                `${formatNumber(
                    temperature,
                    0
                )} °C`,

            color:
                temperatureColors[
                    temperature
                ] ??
                fallbackColors[
                    index %
                    fallbackColors.length
                ],

            points:
                trials
                    .filter(
                        (trial) =>
                            trial.setTemperature ===
                            temperature
                    )
                    .sort(
                        (
                            first,
                            second
                        ) =>
                            first.setVoltage -
                            second.setVoltage
                    )
                    .map(
                        (trial) => ({
                            x:
                                trial.setVoltage,

                            y:
                                trial[
                                    valueKey
                                ]
                        })
                    )
        })
    );
}

/*
 * Розраховує вертикальне положення підписів
 * точок так, щоб підписи різних серій
 * не накладалися один на одного.
 */
function calculatePointLabelPositions(
    series,
    pointIndex,
    getY,
    plot
) {
    const minimumGap = 22;
    const topBoundary = plot.top + 16;
    const bottomBoundary = plot.bottom - 10;

    const labels = series
        .map((item, seriesIndex) => {
            const point =
                item.points[pointIndex];

            if (!point) {
                return null;
            }

            const pointY =
                getY(point.y);

            return {
                seriesIndex,
                point,
                pointY,
                preferredY:
                    pointY - 13,
                labelY:
                    pointY - 13
            };
        })
        .filter(Boolean)
        .sort(
            (first, second) =>
                first.preferredY -
                second.preferredY
        );

    if (labels.length === 0) {
        return new Map();
    }

    labels[0].labelY =
        Math.max(
            labels[0].preferredY,
            topBoundary
        );

    for (
        let index = 1;
        index < labels.length;
        index += 1
    ) {
        labels[index].labelY =
            Math.max(
                labels[index].preferredY,
                labels[index - 1].labelY +
                    minimumGap
            );
    }

    const bottomOverflow =
        labels.at(-1).labelY -
        bottomBoundary;

    if (bottomOverflow > 0) {
        labels.forEach((label) => {
            label.labelY -=
                bottomOverflow;
        });
    }

    for (
        let index =
            labels.length - 2;
        index >= 0;
        index -= 1
    ) {
        labels[index].labelY =
            Math.min(
                labels[index].labelY,
                labels[index + 1].labelY -
                    minimumGap
            );
    }

    const topOverflow =
        topBoundary -
        labels[0].labelY;

    if (topOverflow > 0) {
        labels.forEach((label) => {
            label.labelY +=
                topOverflow;
        });
    }

    return new Map(
        labels.map((label) => [
            label.seriesIndex,
            label
        ])
    );
}

function renderLineChart(
    container,
    {
        series,
        xMinimum,
        xMaximum,
        yMinimum,
        yMaximum,
        xUnit,
        yUnit,
        ariaLabel,
        valueDigits = 2,
        yDigits = 1
    }
) {
    const width = 900;
    const height = 430;

    const plot = {
        left: 82,
        right: 870,
        top: 52,
        bottom: 330
    };

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

    const {
        getX,
        getY
    } = appendChartAxes(
        svg,
        {
            plot,
            xMinimum,
            xMaximum,
            yMinimum,
            yMaximum,
            xUnit,
            yUnit,
            xDigits: 0,
            yDigits,
            xTicks: [
                200,
                220,
                240
            ]
        }
    );

    /*
     * Спочатку будуємо лінії.
     */

    series.forEach((item) => {
        const pathData =
            item.points
                .map(
                    (
                        point,
                        pointIndex
                    ) =>
                        `${pointIndex === 0
                            ? "M"
                            : "L"
                        } ` +
                        `${getX(point.x)} ` +
                        `${getY(point.y)}`
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
    });

    /*
     * Потім додаємо точки та підписи.
     * Для кожної напруги положення підписів
     * розраховуються окремо.
     */

    const maximumPointCount =
        Math.max(
            ...series.map(
                (item) =>
                    item.points.length
            )
        );

    for (
        let pointIndex = 0;
        pointIndex < maximumPointCount;
        pointIndex += 1
    ) {
        const labelPositions =
            calculatePointLabelPositions(
                series,
                pointIndex,
                getY,
                plot
            );

        series.forEach(
            (item, seriesIndex) => {
                const point =
                    item.points[
                        pointIndex
                    ];

                if (!point) {
                    return;
                }

                const pointX =
                    getX(point.x);

                const pointY =
                    getY(point.y);

                const labelData =
                    labelPositions.get(
                        seriesIndex
                    );

                const labelY =
                    labelData?.labelY ??
                    pointY - 13;

                const isFirstPoint =
                    pointIndex === 0;

                const isLastPoint =
                    pointIndex ===
                    item.points.length - 1;

                let labelX =
                    pointX;

                let textAnchor =
                    "middle";

                if (isFirstPoint) {
                    labelX =
                        pointX + 11;

                    textAnchor =
                        "start";
                } else if (
                    isLastPoint
                ) {
                    labelX =
                        pointX - 11;

                    textAnchor =
                        "end";
                }

                const label =
                    `${item.name}, ` +
                    `${formatNumber(
                        point.x,
                        0
                    )} В: ` +
                    `${formatNumber(
                        point.y,
                        valueDigits
                    )} ${yUnit}`;

                /*
                 * Допоміжна лінія від точки
                 * до віддаленого підпису.
                 */

                if (
                    Math.abs(
                        labelY -
                        pointY
                    ) > 17
                ) {
                    svg.append(
                        createSvgElement(
                            "line",
                            {
                                x1:
                                    pointX,

                                y1:
                                    pointY,

                                x2:
                                    labelX,

                                y2:
                                    labelY - 4,

                                stroke:
                                    item.color,

                                class:
                                    "analysis-chart-label-guide"
                            }
                        )
                    );
                }

                const circle =
                    createSvgElement(
                        "circle",
                        {
                            cx:
                                pointX,

                            cy:
                                pointY,

                            r: 7,

                            fill:
                                item.color,

                            class:
                                "analysis-chart-point",

                            tabindex: 0,

                            role: "img",

                            "aria-label":
                                label
                        }
                    );

                const title =
                    createSvgElement(
                        "title"
                    );

                title.textContent =
                    label;

                circle.append(title);
                svg.append(circle);

                appendSvgText(
                    svg,
                    formatNumber(
                        point.y,
                        valueDigits
                    ),
                    {
                        x:
                            labelX,

                        y:
                            labelY,

                        class:
                            "analysis-chart-value",

                        "text-anchor":
                            textAnchor
                    }
                );
            }
        );
    }

    container.replaceChildren(
        svg
    );

    appendLegend(
        container,
        series
    );
}

export function initializeAnalysis({
    root = document,
    namespace = "lab08"
} = {}) {
    const section =
        root.querySelector(
            "#analysis"
        );

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

        sourceLabel:
            section.querySelector(
                "#analysis-source-label"
            ),

        totalEnergy:
            section.querySelector(
                "#analysis-total-energy"
            ),

        usefulHeat:
            section.querySelector(
                "#analysis-useful-heat"
            ),

        efficiency:
            section.querySelector(
                "#analysis-efficiency"
            ),

        operationCount:
            section.querySelector(
                "#analysis-operation-count"
            ),

        powerTimeChart:
            section.querySelector(
                "#chart-power-time"
            ),

        powerVoltageChart:
            section.querySelector(
                "#chart-power-voltage"
            ),

        boilingTimeChart:
            section.querySelector(
                "#chart-boiling-time"
            ),

        form:
            section.querySelector(
                "#analysis-form"
            ),

        saveButton:
            section.querySelector(
                "#analysis-save-button"
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

    const missingElement =
        Object.entries(
            elements
        ).find(
            ([, element]) =>
                !element
        );

    if (missingElement) {
        console.warn(
            "Не знайдено елемент аналітичного модуля: " +
            `${missingElement[0]}.`
        );

        return;
    }

    section.dataset.initialized =
        "true";

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

    const textareas =
        Array.from(
            elements.form.querySelectorAll(
                "textarea[name]"
            )
        );

    let experimentProgress =
        normalizeExperimentProgress(
            {}
        );

    let calculationResults =
        null;

    let currentSignature =
        "";

    let state =
        createInitialState();

    function setMessage(
        text,
        messageState = "default"
    ) {
        elements.message.textContent =
            text;

        elements.message.dataset.state =
            messageState;
    }

    function dispatchAnalysisEvent(
        type,
        detail = {}
    ) {
        document.dispatchEvent(
            new CustomEvent(
                `laboratory:analysis-${type}`,
                {
                    detail: {
                        namespace,
                        ...detail
                    }
                }
            )
        );

        window.dispatchEvent(
            new CustomEvent(
                `${namespace}:analysis-${type}`,
                {
                    detail
                }
            )
        );
    }

    function readState(signature) {
        const stored =
            analysisStorage.get(
                "progress",
                null
            );

        if (
            !stored ||
            typeof stored !==
                "object" ||
            stored.version !==
                STATE_VERSION ||
            stored.signature !==
                signature
        ) {
            return createInitialState(
                signature
            );
        }

        return {
            version:
                STATE_VERSION,

            signature,

            conclusions:
                stored.conclusions &&
                typeof stored.conclusions ===
                    "object"
                    ? stored.conclusions
                    : {},

            completed:
                stored.completed ===
                true
        };
    }

    function saveState() {
        analysisStorage.set(
            "progress",
            state
        );
    }

    function calculationsAreReady() {
        const calculations =
            calculationsStorage.get(
                "progress",
                null
            );

        if (
            !experimentProgress.completed ||
            !calculations ||
            calculations.completed !==
                true ||
            !calculations.results
        ) {
            calculationResults =
                null;

            return false;
        }

        const expectedSignature =
            createExperimentSignature(
                experimentProgress
            );

        if (
            calculations.signature !==
            expectedSignature
        ) {
            calculationResults =
                null;

            return false;
        }

        const results =
            calculations.results;

        const validResults = [
            results.totalElectricalEnergy,
            results.usefulHeat,
            results.thermalEfficiency
        ].every(isFiniteNumber);

        if (!validResults) {
            calculationResults =
                null;

            return false;
        }

        calculationResults = {
            ...results,

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
                )
        };

        return true;
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

            return;
        }

        setMessage(
            "Проаналізуйте графіки та заповніть усі три поля."
        );
    }

    function renderSummary() {
        elements.sourceLabel.textContent =
            `m = ${formatNumber(
                experimentProgress
                    .setup
                    .waterMass,
                3
            )} кг; ` +
            `t₀ = ${formatNumber(
                experimentProgress
                    .setup
                    .initialTemperature,
                1
            )} °C`;

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
            `${formatNumber(
                calculationResults
                    .thermalEfficiency,
                1
            )} %`;

        const completedOperations =
            experimentProgress
                .firstRecords
                .length +
            experimentProgress
                .secondRecords
                .length;

        elements.operationCount.textContent =
            `${completedOperations} із 15`;
    }

    function renderCharts() {
        renderPowerTimeline(
            elements.powerTimeChart,
            experimentProgress
                .firstRecords
        );

        const powerSeries =
            groupTrialsByTemperature(
                experimentProgress
                    .secondRecords,
                "power"
            );

        const powerValues =
            powerSeries.flatMap(
                (item) =>
                    item.points.map(
                        (point) =>
                            point.y
                    )
            );

        const powerMinimum =
            Math.floor(
                (
                    Math.min(
                        ...powerValues
                    ) -
                    0.05
                ) /
                0.1
            ) *
            0.1;

        const powerMaximum =
            Math.ceil(
                (
                    Math.max(
                        ...powerValues
                    ) +
                    0.05
                ) /
                0.1
            ) *
            0.1;

        renderLineChart(
            elements.powerVoltageChart,
            {
                series:
                    powerSeries,

                xMinimum: 200,
                xMaximum: 240,

                yMinimum:
                    powerMinimum,

                yMaximum:
                    powerMaximum,

                xUnit:
                    "Uзад, В",

                yUnit:
                    "P, кВт",

                ariaLabel:
                    "Залежність активної потужності від заданої напруги",

                valueDigits: 2,
                yDigits: 2
            }
        );

        const timeSeries =
            groupTrialsByTemperature(
                experimentProgress
                    .secondRecords,
                "boilingTime"
            );

        const timeValues =
            timeSeries.flatMap(
                (item) =>
                    item.points.map(
                        (point) =>
                            point.y
                    )
            );

        renderLineChart(
            elements.boilingTimeChart,
            {
                series:
                    timeSeries,

                xMinimum: 200,
                xMaximum: 240,

                yMinimum: 0,

                yMaximum:
                    niceMaximum(
                        timeValues,
                        1,
                        7
                    ),

                xUnit:
                    "Uзад, В",

                yUnit:
                    "tкип, хв",

                ariaLabel:
                    "Залежність тривалості нагрівання води до кипіння від заданої напруги",

                valueDigits: 2,
                yDigits: 1
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

        dispatchAnalysisEvent(
            "invalidated"
        );
    }

    function clearVisibleResults() {
        elements.sourceLabel.textContent =
            "Дані ще не отримано";

        elements.totalEnergy.textContent =
            "–";

        elements.usefulHeat.textContent =
            "–";

        elements.efficiency.textContent =
            "–";

        elements.operationCount.textContent =
            "0 із 15";

        elements.powerTimeChart
            .replaceChildren();

        elements.powerVoltageChart
            .replaceChildren();

        elements.boilingTimeChart
            .replaceChildren();
    }

    function updateAccess(event) {
        if (
            event?.detail?.namespace &&
            event.detail.namespace !==
                namespace
        ) {
            return;
        }

        experimentProgress =
            normalizeExperimentProgress(
                experimentStorage.get(
                    "progress",
                    {}
                )
            );

        const ready =
            calculationsAreReady();

        elements.lockOverlay.hidden =
            ready;

        elements.interactiveArea.inert =
            !ready;

        elements.saveButton.disabled =
            !ready;

        elements.resetButton.disabled =
            !ready;

        if (!ready) {
            invalidateSavedAnalysis();

            currentSignature = "";

            clearVisibleResults();

            return;
        }

        const signature =
            createAnalysisSignature(
                experimentProgress,
                calculationResults
            );

        if (
            signature ===
            currentSignature
        ) {
            return;
        }

        currentSignature =
            signature;

        state =
            readState(
                signature
            );

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
                dispatchAnalysisEvent(
                    "invalidated"
                );
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

            state = {
                version:
                    STATE_VERSION,

                signature:
                    currentSignature,

                conclusions:
                    Object.fromEntries(
                        textareas.map(
                            (textarea) => [
                                textarea.name,
                                textarea.value
                                    .trim()
                            ]
                        )
                    ),

                completed: true
            };

            saveState();

            elements.completePanel.hidden =
                false;

            setMessage(
                "Висновки збережено. Можна переходити до контрольних питань.",
                "success"
            );

            dispatchAnalysisEvent(
                "completed",
                {
                    conclusions:
                        state.conclusions,

                    calculations:
                        calculationResults,

                    experiment:
                        experimentProgress
                }
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

            state =
                createInitialState(
                    currentSignature
                );

            textareas.forEach(
                (textarea) => {
                    textarea.value =
                        "";

                    textarea.setCustomValidity(
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
                dispatchAnalysisEvent(
                    "invalidated"
                );
            }

            setMessage(
                "Поля висновків очищено."
            );
        }
    );

    document.addEventListener(
        "laboratory:calculations-completed",
        updateAccess
    );

    document.addEventListener(
        "laboratory:calculations-invalidated",
        updateAccess
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
        updateAccess
    );

    updateAccess();
}