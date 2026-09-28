import { createSvgElement } from "../../common/js/svg-elements.js";

import { parseStudentNumber as parseStoredNumber } from "../../common/js/student-numbers.js";

import {
    LAB06_EXPERIMENT_MODES,
    LAB06_EXPERIMENT_STORAGE_KEY,
    LAB06_VERIFIED_CALCULATIONS_STORAGE_KEY
} from "./data.js";

import {
    LAB06_CONFIG,
    LAB06_EVENTS
} from "./config.js";

const CALCULATION_COMPLETED_KEY =
    LAB06_CONFIG.storage.calculationsCompleted;

const ANALYSIS_STORAGE_KEY =
    LAB06_CONFIG.storage.analysis;

const ANALYSIS_COMPLETED_KEY =
    LAB06_CONFIG.storage.analysisCompleted;


function readJsonStorage(key, fallback = {}) {
    try {
        const value =
            localStorage.getItem(key);

        return value
            ? JSON.parse(value)
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



function formatNumber(value, digits = 2) {
    return new Intl.NumberFormat(
        "uk-UA",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: digits
        }
    ).format(value);
}

function normalizePosition(position, index) {
    const match =
        String(position ?? "")
            .match(/\d+/);

    return match
        ? match[0]
        : String(index + 1);
}



function appendText(
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

function clamp(
    value,
    minimum,
    maximum
) {
    return Math.min(
        Math.max(value, minimum),
        maximum
    );
}

function createTicks(
    maximum,
    intervals
) {
    return Array.from(
        {
            length: intervals + 1
        },
        (_, index) =>
            (
                maximum *
                index
            ) /
            intervals
    );
}

function getNiceMaximum(
    values,
    step
) {
    const maximum =
        Math.max(...values);

    let scaleMaximum =
        Math.ceil(
            maximum / step
        ) * step;

    if (
        maximum >
        scaleMaximum * 0.9
    ) {
        scaleMaximum += step;
    }

    return Math.max(
        step,
        scaleMaximum
    );
}

function appendValueBadge(
    svg,
    point,
    valueText,
    plot
) {
    const estimatedWidth =
        Math.max(
            46,
            valueText.length * 9 + 18
        );

    const labelX =
        clamp(
            point.x,
            plot.left +
            estimatedWidth / 2,
            plot.right -
            estimatedWidth / 2
        );

    const placeBelow =
        point.y - 30 < plot.top;

    const labelY =
        placeBelow
            ? point.y + 31
            : point.y - 17;

    const group =
        createSvgElement(
            "g",
            {
                class:
                    "analysis-chart-value-group"
            }
        );

    group.append(
        createSvgElement(
            "rect",
            {
                x:
                    labelX -
                    estimatedWidth / 2,

                y:
                    labelY - 18,

                width:
                    estimatedWidth,

                height:
                    25,

                rx:
                    7,

                class:
                    "analysis-chart-value-background"
            }
        )
    );

    appendText(
        group,
        valueText,
        {
            x:
                labelX,

            y:
                labelY,

            class:
                "analysis-chart-value",

            "text-anchor":
                "middle"
        }
    );

    svg.append(group);
}

function renderLineChart(
    container,
    options
) {
    if (!container) {
        return;
    }

    const width = 780;
    const height = 420;

    const plot = {
        left: 88,
        right: 742,
        top: 54,
        bottom: 326
    };

    const svg =
        createSvgElement(
            "svg",
            {
                viewBox:
                    `0 0 ${width} ${height}`,

                role:
                    "img",

                "aria-label":
                    options.ariaLabel,

                preserveAspectRatio:
                    "xMidYMid meet"
            }
        );

    svg.classList.add(
        "analysis-chart-svg"
    );

    const plotHeight =
        plot.bottom - plot.top;

    const dataLeft =
        plot.left + 54;

    const dataRight =
        plot.right - 54;

    function getY(value) {
        const ratio =
            clamp(
                value /
                options.yMaximum,
                0,
                1
            );

        return (
            plot.bottom -
            ratio * plotHeight
        );
    }

    options.ticks.forEach(
        (tickValue) => {
            const y =
                getY(tickValue);

            svg.append(
                createSvgElement(
                    "line",
                    {
                        x1:
                            plot.left,

                        y1:
                            y,

                        x2:
                            plot.right,

                        y2:
                            y,

                        class:
                            "analysis-chart-grid-line"
                    }
                )
            );

            appendText(
                svg,
                options.tickFormatter(
                    tickValue
                ),
                {
                    x:
                        plot.left - 14,

                    y:
                        y + 5,

                    class:
                        "analysis-chart-tick",

                    "text-anchor":
                        "end"
                }
            );
        }
    );

    svg.append(
        createSvgElement(
            "line",
            {
                x1:
                    plot.left,

                y1:
                    plot.top,

                x2:
                    plot.left,

                y2:
                    plot.bottom,

                class:
                    "analysis-chart-axis"
            }
        ),

        createSvgElement(
            "line",
            {
                x1:
                    plot.left,

                y1:
                    plot.bottom,

                x2:
                    plot.right,

                y2:
                    plot.bottom,

                class:
                    "analysis-chart-axis"
            }
        )
    );

    const alphaValues =
        options.points.map(
            (point) =>
                Number(point.alpha)
        );

    const minimumAlpha =
        Math.min(
            ...alphaValues
        );

    const maximumAlpha =
        Math.max(
            ...alphaValues
        );

    const alphaRange =
        maximumAlpha -
        minimumAlpha;

    const coordinates =
        options.points.map(
            (point) => {
                const alpha =
                    Number(
                        point.alpha
                    );

                const ratio =
                    alphaRange <= 0
                        ? 0.5
                        : (
                            alpha -
                            minimumAlpha
                        ) /
                        alphaRange;

                return {
                    ...point,

                    x:
                        dataLeft +
                        ratio *
                        (
                            dataRight -
                            dataLeft
                        ),

                    y:
                        getY(
                            point.value
                        )
                };
            }
        );

    const pathData =
        coordinates
            .map(
                (point, index) =>
                    `${index === 0
                        ? "M"
                        : "L"
                    } ${point.x} ${point.y}`
            )
            .join(" ");

    svg.append(
        createSvgElement(
            "path",
            {
                d:
                    pathData,

                class:
                    "analysis-chart-line"
            }
        )
    );

    coordinates.forEach(
        (point) => {
            svg.append(
                createSvgElement(
                    "circle",
                    {
                        cx:
                            point.x,

                        cy:
                            point.y,

                        r:
                            8,

                        class:
                            "analysis-chart-point"
                    }
                )
            );

            appendValueBadge(
                svg,
                point,
                options.valueFormatter(
                    point.value
                ),
                plot
            );

            const positionLabel =
                appendText(
                    svg,
                    `Положення ${point.position}`,
                    {
                        x:
                            point.x,

                        y:
                            plot.bottom +
                            31,

                        class:
                            "analysis-chart-label",

                        "text-anchor":
                            "middle"
                    }
                );

            const angleLabel =
                createSvgElement(
                    "tspan",
                    {
                        x:
                            point.x,

                        dy:
                            20
                    }
                );

            angleLabel.textContent =
                `α = ${point.alpha}°`;

            positionLabel.append(
                angleLabel
            );
        }
    );

    appendText(
        svg,
        options.unit,
        {
            x:
                plot.left,

            y:
                27,

            class:
                "analysis-chart-unit"
        }
    );

    appendText(
        svg,
        "Кут керування α, град",
        {
            x:
                (
                    plot.left +
                    plot.right
                ) / 2,

            y:
                height - 15,

            class:
                "analysis-chart-axis-title",

            "text-anchor":
                "middle"
        }
    );

    container.replaceChildren(svg);
}

function getAnalysisData() {
    const records =
        readJsonStorage(
            LAB06_EXPERIMENT_STORAGE_KEY,
            {}
        );

    const verifiedCalculations =
        readJsonStorage(
            LAB06_VERIFIED_CALCULATIONS_STORAGE_KEY,
            {}
        );

    return LAB06_EXPERIMENT_MODES.map(
        (mode, index) => {
            const record =
                records[
                mode.id
                ];

            const calculation =
                verifiedCalculations[
                mode.id
                ];

            if (
                !record ||
                !calculation
            ) {
                throw new Error(
                    "Не знайдено перевірені дані одного з режимів."
                );
            }

            const apparentPower =
                Number(
                    calculation
                        .apparentPower
                );

            const cosPhi1p =
                Number(
                    calculation
                        .cosPhi1p
                );

            const loadVoltage =
                Number(
                    record.u2
                );

            const alpha =
                Number(
                    record.alpha ??
                    mode.alpha
                );

            if (
                !Number.isFinite(
                    apparentPower
                ) ||
                !Number.isFinite(
                    cosPhi1p
                ) ||
                !Number.isFinite(
                    loadVoltage
                ) ||
                !Number.isFinite(
                    alpha
                )
            ) {
                throw new Error(
                    "Перевірені розрахункові дані мають неправильний формат."
                );
            }

            return {
                position:
                    normalizePosition(
                        mode.position,
                        index
                    ),

                alpha,

                apparentPower,

                cosPhi1p,

                loadVoltage
            };
        }
    );
}

export function initializeAnalysis() {
    const section =
        document.querySelector(
            "#analysis"
        );

    if (!section) {
        return;
    }

    const lockOverlay =
        section.querySelector(
            "#analysis-lock-overlay"
        );

    const lockText =
        section.querySelector(
            "#analysis-lock-text"
        );

    const workspace =
        section.querySelector(
            "#analysis-workspace"
        );

    const form =
        section.querySelector(
            "#analysis-form"
        );

    const resetButton =
        section.querySelector(
            "#reset-analysis"
        );

    const message =
        section.querySelector(
            "#analysis-message"
        );

    if (
        !lockOverlay ||
        !lockText ||
        !workspace ||
        !form ||
        !resetButton ||
        !message
    ) {
        console.warn(
            "Не знайдено елементи розділу аналізу."
        );

        return;
    }

    const storedConclusions =
        readJsonStorage(
            ANALYSIS_STORAGE_KEY,
            {}
        );

    Array.from(
        form.elements
    ).forEach((field) => {
        if (
            field.name &&
            storedConclusions[
            field.name
            ]
        ) {
            field.value =
                storedConclusions[
                field.name
                ];
        }
    });

    function renderCharts(data) {
        const commonPoints =
            data.map(
                (item) => ({
                    position:
                        item.position,

                    alpha:
                        item.alpha
                })
            );

        const apparentPowerMaximum =
            getNiceMaximum(
                data.map(
                    (item) =>
                        item.apparentPower
                ),
                100
            );

        const loadVoltageMaximum =
            getNiceMaximum(
                data.map(
                    (item) =>
                        item.loadVoltage
                ),
                50
            );

        renderLineChart(
            section.querySelector(
                "#chart-apparent-power"
            ),
            {
                ariaLabel:
                    "Залежність повної потужності від положення регулятора",

                unit:
                    "S, В·А",

                yMaximum:
                    apparentPowerMaximum,

                ticks:
                    createTicks(
                        apparentPowerMaximum,
                        6
                    ),

                tickFormatter:
                    (value) =>
                        formatNumber(
                            value,
                            0
                        ),

                valueFormatter:
                    (value) =>
                        formatNumber(
                            value,
                            1
                        ),

                points:
                    data.map(
                        (
                            item,
                            index
                        ) => ({
                            ...commonPoints[
                            index
                            ],

                            value:
                                item.apparentPower
                        })
                    )
            }
        );

        renderLineChart(
            section.querySelector(
                "#chart-displacement-factor"
            ),
            {
                ariaLabel:
                    "Залежність коефіцієнта зсуву першої гармоніки від положення регулятора",

                unit:
                    "cosφ₁p, в. о.",

                yMaximum:
                    1.05,

                ticks:
                    [
                        0,
                        0.2,
                        0.4,
                        0.6,
                        0.8,
                        1
                    ],

                tickFormatter:
                    (value) =>
                        formatNumber(
                            value,
                            1
                        ),

                valueFormatter:
                    (value) =>
                        formatNumber(
                            value,
                            4
                        ),

                points:
                    data.map(
                        (
                            item,
                            index
                        ) => ({
                            ...commonPoints[
                            index
                            ],

                            value:
                                item.cosPhi1p
                        })
                    )
            }
        );

        renderLineChart(
            section.querySelector(
                "#chart-load-voltage"
            ),
            {
                ariaLabel:
                    "Залежність напруги навантаження від положення регулятора",

                unit:
                    "U₂, В",

                yMaximum:
                    loadVoltageMaximum,

                ticks:
                    createTicks(
                        loadVoltageMaximum,
                        5
                    ),

                tickFormatter:
                    (value) =>
                        formatNumber(
                            value,
                            0
                        ),

                valueFormatter:
                    (value) =>
                        formatNumber(
                            value,
                            1
                        ),

                points:
                    data.map(
                        (
                            item,
                            index
                        ) => ({
                            ...commonPoints[
                            index
                            ],

                            value:
                                item.loadVoltage
                        })
                    )
            }
        );
    }

    function invalidateAnalysis() {
        const wasCompleted = localStorage.getItem(ANALYSIS_COMPLETED_KEY) === "true";
        localStorage.removeItem(ANALYSIS_COMPLETED_KEY);
        if (wasCompleted) {
            window.dispatchEvent(new CustomEvent(LAB06_EVENTS.analysisInvalidated));
        }
    }

    function renderReadiness() {
        const calculationsCompleted =
            localStorage.getItem(
                CALCULATION_COMPLETED_KEY
            ) === "true";

        if (!calculationsCompleted) {
            invalidateAnalysis();
            lockText.textContent =
                "Спочатку виконайте та перевірте всі розрахунки в розділі 8.";

            lockOverlay.hidden = false;
            lockOverlay.style.display = "";
            workspace.inert = true;

            return;
        }

        try {
            const data =
                getAnalysisData();

            renderCharts(data);

            lockOverlay.hidden = true;
            lockOverlay.style.display = "none";
            workspace.inert = false;
        } catch (error) {
            invalidateAnalysis();
            lockText.textContent =
                `${error.message} Перевірте дані в розділі 8.`;

            lockOverlay.hidden = false;
            lockOverlay.style.display = "";
            workspace.inert = true;
        }
    }

    form.addEventListener(
        "input",
        () => {
            localStorage.removeItem(
                ANALYSIS_COMPLETED_KEY
            );

            window.dispatchEvent(
                new CustomEvent(
                    LAB06_EVENTS.analysisInvalidated
                )
            );

            message.dataset.type =
                "default";

            message.textContent =
                "Зміни не збережено. Після завершення натисніть «Зберегти висновки».";
        }
    );

    form.addEventListener(
        "submit",
        (event) => {
            event.preventDefault();

            if (
                !form.reportValidity()
            ) {
                return;
            }

            const conclusions =
                Object.fromEntries(
                    new FormData(
                        form
                    ).entries()
                );

            writeJsonStorage(
                ANALYSIS_STORAGE_KEY,
                conclusions
            );

            localStorage.setItem(
                ANALYSIS_COMPLETED_KEY,
                "true"
            );
            window.dispatchEvent(
                new CustomEvent(LAB06_EVENTS.analysisCompleted)
            );

            message.dataset.type =
                "success";

            message.textContent =
                "Висновки збережено.";
        }
    );

    resetButton.addEventListener(
        "click",
        () => {
            const shouldReset =
                window.confirm(
                    "Очистити всі введені висновки?"
                );

            if (!shouldReset) {
                return;
            }

            form.reset();

            localStorage.removeItem(
                ANALYSIS_STORAGE_KEY
            );

            localStorage.removeItem(
                ANALYSIS_COMPLETED_KEY
            );
            window.dispatchEvent(
                new CustomEvent(LAB06_EVENTS.analysisInvalidated)
            );

            message.dataset.type =
                "default";

            message.textContent =
                "Поля висновків очищено.";
        }
    );

    window.addEventListener(
        LAB06_EVENTS.calculationsCompleted,
        renderReadiness
    );

    window.addEventListener(
        LAB06_EVENTS.calculationsInvalidated,
        renderReadiness
    );

    renderReadiness();
}