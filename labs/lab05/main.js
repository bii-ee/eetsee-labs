import {
    initializeSafetyModule
} from "../../common/js/safety.js";

import {
    initializeStand
} from "./stand.js";

import {
    initializeExperiment
} from "./simulation.js";

import {
    initializeCalculations
} from "./calculations.js";

import {
    initializeAnalysis
} from "./charts.js";

import {
    initializeQuiz
} from "./quiz.js";

import {
    initializeReport
} from "./report.js";

const LAB_NAMESPACE = "lab05";

const sectionFiles = [
    "./sections/01-overview.html",
    "./sections/02-goals.html",
    "./sections/03-equipment.html",
    "./sections/04-theory.html",
    "./sections/05-safety.html",
    "./sections/06-stand.html",
    "./sections/07-experiment.html",
    "./sections/08-calculations.html",
    "./sections/09-analysis.html",
    "./sections/10-questions.html"
];

const sectionsRoot =
    document.querySelector(
        "#sections-root"
    );

const navigationLinks =
    Array.from(
        document.querySelectorAll(
            ".navigation-link"
        )
    );

async function loadSection(
    filePath
) {
    const response =
        await fetch(
            filePath,
            {
                cache:
                    "no-store"
            }
        );

    if (!response.ok) {
        throw new Error(
            `Не вдалося завантажити файл: ${filePath}`
        );
    }

    return response.text();
}

function initializeNavigation() {
    const sections =
        Array.from(
            document.querySelectorAll(
                ".content-section"
            )
        );

    if (
        sections.length === 0 ||
        navigationLinks.length === 0
    ) {
        return;
    }

    const observer =
        new IntersectionObserver(
            (entries) => {
                const visibleEntries =
                    entries
                        .filter(
                            (entry) =>
                                entry.isIntersecting
                        )
                        .sort(
                            (first, second) =>
                                second
                                    .intersectionRatio -
                                first
                                    .intersectionRatio
                        );

                const currentEntry =
                    visibleEntries[0];

                if (!currentEntry) {
                    return;
                }

                navigationLinks.forEach(
                    (link) => {
                        const isCurrent =
                            link.getAttribute(
                                "href"
                            ) ===
                            `#${currentEntry.target.id}`;

                        link.classList.toggle(
                            "is-active",
                            isCurrent
                        );

                        if (isCurrent) {
                            link.setAttribute(
                                "aria-current",
                                "true"
                            );
                        } else {
                            link.removeAttribute(
                                "aria-current"
                            );
                        }
                    }
                );
            },
            {
                rootMargin:
                    "-20% 0px -65% 0px",

                threshold:
                    [
                        0,
                        0.1,
                        0.25,
                        0.5
                    ]
            }
        );

    sections.forEach(
        (section) => {
            observer.observe(
                section
            );
        }
    );
}

function initializeLaboratoryModules() {
    initializeSafetyModule({
        namespace:
            LAB_NAMESPACE
    });

    initializeStand({
        namespace:
            LAB_NAMESPACE
    });

    initializeExperiment({
        namespace:
            LAB_NAMESPACE
    });

    initializeCalculations({
        namespace:
            LAB_NAMESPACE
    });

    initializeAnalysis({
        namespace:
            LAB_NAMESPACE
    });

    initializeQuiz({
        namespace:
            LAB_NAMESPACE
    });

    initializeReport({
        namespace:
            LAB_NAMESPACE
    });
}
async function loadLaboratoryContent() {
    if (!sectionsRoot) {
        console.error(
            "Не знайдено контейнер лабораторної роботи."
        );

        return;
    }

    try {
        const sectionContent =
            await Promise.all(
                sectionFiles.map(
                    loadSection
                )
            );

        sectionsRoot.innerHTML =
            sectionContent.join("");

        initializeNavigation();
        initializeLaboratoryModules();
    } catch (error) {
        console.error(
            error
        );

        sectionsRoot.innerHTML = `
            <div class="error-panel">
                <strong>
                    Помилка завантаження матеріалів.
                </strong>

                <p>
                    Перевірте структуру файлів і запустіть
                    лабораторну роботу через локальний сервер.
                </p>
            </div>
        `;
    }
}

loadLaboratoryContent();