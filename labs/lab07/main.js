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

const LAB_NAMESPACE = "lab07";

function initializeExperimentAccess() {
    const lockOverlay = document.querySelector(
        "#experiment-lock-overlay"
    );

    const interactiveArea = document.querySelector(
        "#experiment-interactive-area"
    );

    if (!lockOverlay || !interactiveArea) {
        console.warn(
            "Не знайдено елементи блокування розділу 7."
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
        ".content-section"
    );

    const observer = new IntersectionObserver(
        (entries) => {
            const visibleEntry = entries.find(
                (entry) => entry.isIntersecting
            );

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

async function loadLaboratoryContent() {
    try {
        const sectionContent =
            await Promise.all(
                sectionFiles.map(loadSection)
            );

        sectionsRoot.innerHTML =
            sectionContent.join("");

        initializeNavigation();

        initializeSafetyModule({
            namespace: LAB_NAMESPACE
        });

        initializeStand({
            namespace: LAB_NAMESPACE
        });

        initializeExperimentAccess();

        initializeExperiment({
            namespace: LAB_NAMESPACE
        });

        initializeCalculations({
            namespace: LAB_NAMESPACE
        });
        initializeAnalysis();
        initializeQuiz();
        initializeReport();
    } catch (error) {
        console.error(error);

        sectionsRoot.innerHTML = `
            <div class="error-panel">
                <strong>
                    Помилка завантаження матеріалів.
                </strong>

                <p>
                    Перевірте підключення до мережі та структуру
                    файлів, після чого перезавантажте сторінку.
                </p>
            </div>
        `;
    }
}

loadLaboratoryContent();