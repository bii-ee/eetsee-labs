import { renderStandProgress } from "../../common/js/stand-progress.js";

import {
    createStorage
} from "../../common/js/storage.js";

import {
    LAB06_CONFIG,
    LAB06_EVENTS
} from "./config.js";

const componentInformation = {
    qf: {
        title: "Автоматичний вимикач",
        description:
            "Забезпечує комутацію живлення лабораторної установки та її відключення у разі аварійного режиму.",
        code: "QF",
        function: "Увімкнення та захист кола",
        value: "Стан електричного кола"
    },

    pv1: {
        title: "Вольтметр живлення",
        description:
            "Підключений паралельно до входу установки та вимірює діюче значення напруги живлення.",
        code: "PV1",
        function: "Вимірювання вхідної напруги",
        value: "U₁, В"
    },

    pa: {
        title: "Амперметр",
        description:
            "Увімкнений послідовно з навантаженням та вимірює діюче значення струму установки.",
        code: "PA",
        function: "Вимірювання струму",
        value: "I, А"
    },

    pw: {
        title: "Ватметр",
        description:
            "Вимірює активну потужність, яку установка споживає з електричної мережі.",
        code: "PW",
        function: "Вимірювання активної потужності",
        value: "P, Вт"
    },

    controller: {
        title: "Тиристорний регулятор",
        description:
            "Змінює тривалість провідного стану тиристорів. Зміна кута керування впливає на напругу, струм і потужність навантаження.",
        code: "ТР",
        function: "Фазоімпульсне регулювання",
        value: "Кут керування α"
    },

    pv2: {
        title: "Вольтметр навантаження",
        description:
            "Підключений паралельно до печі опору та вимірює діюче значення напруги на навантаженні.",
        code: "PV2",
        function: "Вимірювання вихідної напруги",
        value: "U₂, В"
    },

    furnace: {
        title: "Активне навантаження",
        description:
            "Нагрівальний елемент імітує електричну піч опору та перетворює електричну енергію на теплову.",
        code: "R",
        function: "Імітація печі опору",
        value: "Електрична і теплова потужність"
    },

    satec: {
        title: "Аналізатор якості електроенергії",
        description:
            "За наявності використовується для контролю гармонічних складових і показників якості електричної енергії.",
        code: "SATEC PM172EH",
        function: "Аналіз форми струму та гармонік",
        value: "Показники гармонічних спотворень"
    }
};

export function initializeStand({
    root = document,
    namespace = "lab06"
} = {}) {
    const section = root.querySelector("#stand");

    if (!section || section.dataset.initialized === "true") {
        return;
    }

    const interactiveArea = section.querySelector(
        "#stand-interactive-area"
    );
    const lockOverlay = section.querySelector(
        "#stand-lock-overlay"
    );
    const componentElements = Array.from(
        section.querySelectorAll("[data-stand-component]")
    );

    const titleElement = section.querySelector(
        "#stand-component-title"
    );
    const descriptionElement = section.querySelector(
        "#stand-component-description"
    );
    const codeElement = section.querySelector(
        "#stand-component-code"
    );
    const functionElement = section.querySelector(
        "#stand-component-function"
    );
    const valueElement = section.querySelector(
        "#stand-component-value"
    );

    const progressText = section.querySelector(
        "#stand-progress-text"
    );
    const progressPercent = section.querySelector(
        "#stand-progress-percent"
    );
    const progressTrack = section.querySelector(
        ".stand-progress-track"
    );
    const progressBar = section.querySelector(
        "#stand-progress-bar"
    );
    const readyButton = section.querySelector(
        "#stand-ready-button"
    );
    const resetButton = section.querySelector(
        "#stand-reset-button"
    );
    const statusElement = section.querySelector(
        "#stand-status"
    );

    if (
        !interactiveArea ||
        !lockOverlay ||
        !titleElement ||
        !readyButton
    ) {
        console.warn(
            "Не знайдено елементи віртуального стенда."
        );

        return;
    }

    section.dataset.initialized = "true";

    const safetyStorage = createStorage(
        LAB06_CONFIG.storage.safety
    );

    const standStorage = createStorage(
        LAB06_CONFIG.storage.stand
    );

    const savedProgress = standStorage.get("progress", {
        visited: [],
        selected: null,
        ready: false
    });

    const visitedComponents = new Set(
        Array.isArray(savedProgress.visited)
            ? savedProgress.visited
            : []
    );

    const componentIds = Object.keys(
        componentInformation
    );

    let selectedComponent = savedProgress.selected;
    let standReady = savedProgress.ready === true &&
        visitedComponents.size === componentIds.length;

    function isSafetyPassed() {
        const safetyProgress = safetyStorage.get(
            "progress",
            {}
        );

        return safetyProgress.passed === true;
    }

    function updateAccess() {
        const accessGranted = isSafetyPassed();

        lockOverlay.hidden = accessGranted;
        interactiveArea.inert = !accessGranted;

        section.classList.toggle(
            "stand-access-granted",
            accessGranted
        );
        if (
            !accessGranted &&
            (
                standReady || visitedComponents.size > 0 ||
                selectedComponent !== null ||
                standStorage.get("progress", {}).ready === true
            )
        ) {
            resetStandProgress();
        }
    }

    function saveProgress() {
        standStorage.set("progress", {
            visited: Array.from(visitedComponents),
            selected: selectedComponent,
            ready: standReady
        });
    }

    function setStatus(message, type = "neutral") {
        statusElement.textContent = message;
        statusElement.className =
            `stand-status stand-status-${type}`;
    }

    function updateComponentAppearance() {
        componentElements.forEach((element) => {
            const componentId =
                element.dataset.standComponent;

            element.classList.toggle(
                "is-selected",
                componentId === selectedComponent
            );

            element.classList.toggle(
                "is-visited",
                visitedComponents.has(componentId)
            );
        });
    }

    function updateProgress() {
        const visitedCount = visitedComponents.size;
        const totalCount = componentIds.length;

        renderStandProgress({
            visitedCount,
            totalCount,
            ready: standReady,
            label: "елементів",
            progressText: progressText,
            progressPercent: progressPercent,
            progressTrack: progressTrack,
            progressBar: progressBar,
            readyButton: readyButton
        });

        if (standReady) {
            setStatus(
                "Склад і призначення елементів стенда вивчено. Можна переходити до проведення досліду.",
                "success"
            );

            return;
        }

        if (visitedCount === totalCount) {
            setStatus(
                "Усі елементи переглянуто. Підтвердьте готовність стенда.",
                "ready"
            );
        } else {
            setStatus(
                "Послідовно виберіть усі елементи схеми."
            );
        }
    }

    function showComponent(componentId, markVisited = true) {
        const information =
            componentInformation[componentId];

        if (!information) {
            return;
        }

        selectedComponent = componentId;

        if (markVisited) {
            visitedComponents.add(componentId);
        }

        titleElement.textContent = information.title;
        descriptionElement.textContent =
            information.description;
        codeElement.textContent = information.code;
        functionElement.textContent =
            information.function;
        valueElement.textContent = information.value;

        updateComponentAppearance();
        updateProgress();
        saveProgress();
    }

    function handleComponentActivation(event) {
        const componentId =
            event.currentTarget.dataset.standComponent;

        showComponent(componentId);
    }

    componentElements.forEach((element) => {
        element.addEventListener(
            "click",
            handleComponentActivation
        );

        element.addEventListener("keydown", (event) => {
            if (
                event.key === "Enter" ||
                event.key === " "
            ) {
                event.preventDefault();
                handleComponentActivation(event);
            }
        });
    });

    readyButton.addEventListener("click", () => {
        if (
            !isSafetyPassed() ||
            visitedComponents.size !== componentIds.length
        ) {
            return;
        }

        standReady = true;

        updateProgress();
        saveProgress();

        document.dispatchEvent(
            new CustomEvent(LAB06_EVENTS.standReady, {
                detail: {
                    namespace
                }
            })
        );
    });

    function resetStandProgress() {
        visitedComponents.clear();
        selectedComponent = null;
        standReady = false;

        titleElement.textContent = "Оберіть елемент схеми";
        descriptionElement.textContent = "Натисніть на прилад або елемент схеми, щоб переглянути його призначення.";
        codeElement.textContent = "-";
        functionElement.textContent = "-";
        valueElement.textContent = "-";

        updateComponentAppearance();
        updateProgress();
        saveProgress();

        document.dispatchEvent(new CustomEvent(LAB06_EVENTS.standReset, {
            detail: { namespace }
        }));
    }

    resetButton.addEventListener("click", resetStandProgress);

    document.addEventListener(
        LAB06_EVENTS.safetyPassed,
        updateAccess
    );
    document.addEventListener(
        LAB06_EVENTS.safetyReset,
        updateAccess
    );
    saveProgress();
    updateAccess();
    updateComponentAppearance();

    if (
        selectedComponent &&
        componentInformation[selectedComponent]
    ) {
        showComponent(selectedComponent, false);
    } else {
        updateProgress();
    }
}