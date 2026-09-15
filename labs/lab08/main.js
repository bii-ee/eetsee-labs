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

import {
    createStorage
} from "../../common/js/storage.js";

const LAB_NAMESPACE = "lab08";

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

const sectionsRoot = document.querySelector(
    "#sections-root"
);

const navigationLinks = document.querySelectorAll(
    ".navigation-link"
);

function initializeExperimentAccess() {
    const lockOverlay = document.querySelector(
        "#experiment-lock-overlay"
    );

    const interactiveArea = document.querySelector(
        "#experiment-interactive-area"
    );

    if (!lockOverlay || !interactiveArea) {
        console.warn(
            "Не знайдено елементи блокування розділу проведення досліду."
        );

        return;
    }

    const standStorage = createStorage(
        `${LAB_NAMESPACE}:stand`
    );

    function updateExperimentAccess(event) {
        if (
            event?.detail?.namespace &&
            event.detail.namespace !== LAB_NAMESPACE
        ) {
            return;
        }

        const standProgress = standStorage.get(
            "progress",
            {}
        );

        const accessGranted =
            standProgress.ready === true;

        lockOverlay.hidden = accessGranted;
        interactiveArea.inert = !accessGranted;

        const experimentSection =
            document.querySelector("#experiment");

        experimentSection?.classList.toggle(
            "experiment-access-granted",
            accessGranted
        );
    }

    document.addEventListener(
        "laboratory:stand-ready",
        updateExperimentAccess
    );

    document.addEventListener(
        "laboratory:stand-reset",
        updateExperimentAccess
    );

    updateExperimentAccess();
}

async function loadSection(filePath) {
    const response = await fetch(filePath, {
        cache: "no-store"
    });

    if (!response.ok) {
        throw new Error(
            `Не вдалося завантажити файл: ${filePath}`
        );
    }

    return response.text();
}

function initializeNavigation() {
    const sections = document.querySelectorAll(
        ".content-section[id]"
    );

    if (
        sections.length === 0 ||
        navigationLinks.length === 0
    ) {
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            const visibleEntries = entries
                .filter((entry) => entry.isIntersecting)
                .sort(
                    (first, second) =>
                        first.boundingClientRect.top -
                        second.boundingClientRect.top
                );

            const visibleEntry = visibleEntries[0];

            if (!visibleEntry) {
                return;
            }

            navigationLinks.forEach((link) => {
                const isCurrent =
                    link.getAttribute("href") ===
                    `#${visibleEntry.target.id}`;

                link.classList.toggle(
                    "is-active",
                    isCurrent
                );

                if (isCurrent) {
                    link.setAttribute(
                        "aria-current",
                        "location"
                    );
                } else {
                    link.removeAttribute("aria-current");
                }
            });
        },
        {
            rootMargin: "-20% 0px -65% 0px",
            threshold: 0
        }
    );

    sections.forEach((section) => {
        observer.observe(section);
    });
}

function initializeLaboratoryModules() {
    const options = {
        root: document,
        namespace: LAB_NAMESPACE
    };

    initializeSafetyModule(options);
    initializeStand(options);

    initializeExperimentAccess();

    initializeExperiment(options);
    initializeCalculations(options);
    initializeAnalysis(options);
    initializeQuiz(options);
    initializeReport(options);
}

async function loadLaboratoryContent() {
    if (!sectionsRoot) {
        console.error(
            "Не знайдено контейнер #sections-root."
        );

        return;
    }

    sectionsRoot.setAttribute("aria-busy", "true");

    try {
        const sectionContent = await Promise.all(
            sectionFiles.map(loadSection)
        );

        sectionsRoot.innerHTML =
            sectionContent.join("");

        initializeNavigation();
        initializeLaboratoryModules();
    } catch (error) {
        console.error(
            "Помилка завантаження ЛР8:",
            error
        );

        sectionsRoot.innerHTML = `
            <div class="error-panel" role="alert">
                <strong>
                    Помилка завантаження матеріалів
                </strong>

                <p>
                    Перевірте структуру папки sections і запустіть
                    сторінку через локальний HTTP-сервер.
                </p>
            </div>
        `;
    } finally {
        sectionsRoot.removeAttribute("aria-busy");
    }
}

loadLaboratoryContent();