import {
    createStorage
} from "../../common/js/storage.js";

const componentInformation = {
    supply: {
        title:
            "Джерело живлення і вимикач",

        description:
            "Лабораторна установка живиться від мережі змінного струму. Вимикач K використовується для подавання та зняття напруги зі стенда. Перед підготовкою схеми й заміною нагрівального елемента установка повинна бути вимкнена.",

        code:
            "~220 В; K",

        function:
            "Підключення та відключення лабораторної установки",

        value:
            "Стан кола: увімкнено або вимкнено"
    },

    latr: {
        title:
            "Лабораторний автотрансформатор",

        description:
            "ЛАТР забезпечує плавне регулювання напруги, що подається на електродний нагрівач. Під час дослідів за його допомогою послідовно встановлюють задані значення 100, 150 і 200 В.",

        code:
            "ЛАТР",

        function:
            "Регулювання напруги живлення нагрівача",

        value:
            "Задана напруга: 100, 150 або 200 В"
    },

    voltmeter: {
        title:
            "Вольтметр",

        description:
            "Вольтметр підключений паралельно до електродного нагрівача та використовується для вимірювання фактичної напруги під час кожного досліду.",

        code:
            "PV",

        function:
            "Вимірювання фактичної напруги",

        value:
            "Фактична напруга U, В"
    },

    ammeter: {
        title:
            "Амперметр",

        description:
            "Амперметр увімкнений послідовно в електричне коло та вимірює силу струму, що проходить через електропровідну рідину між фазним електродом і корпусом нагрівача.",

        code:
            "PA",

        function:
            "Вимірювання сили струму",

        value:
            "Сила струму I, А"
    },

    wattmeter: {
        title:
            "Ватметр",

        description:
            "Ватметр використовується для вимірювання активної потужності, яку споживає електродний нагрівач під час нагрівання води.",

        code:
            "PW",

        function:
            "Вимірювання активної потужності",

        value:
            "Активна потужність P, Вт"
    },

    heaters: {
        title:
            "Електродні нагрівальні елементи",

        description:
            "У лабораторній роботі досліджують два електродні нагрівальні елементи різних конструкцій. Для кожного з них виконують досліди за напруги 100, 150 і 200 В за однакових початкових умов.",

        code:
            "Нагрівач 1; нагрівач 2",

        function:
            "Безпосереднє нагрівання електропровідної рідини",

        value:
            "Тип нагрівального елемента"
    },

    water: {
        title:
            "Посудина з водою і термометр",

        description:
            "Посудина містить визначений об’єм води. Термометр використовується для контролю її початкової температури та моменту досягнення температури кипіння. У всіх дослідах об’єм і початкова температура повинні бути однаковими.",

        code:
            "Посудина; термометр",

        function:
            "Контроль початкових і кінцевих умов нагрівання",

        value:
            "Об’єм води та температура, °C"
    },

    stopwatch: {
        title:
            "Секундомір",

        description:
            "Секундомір використовується для вимірювання тривалості нагрівання води від початкової температури до температури кипіння в кожному з шести дослідів.",

        code:
            "Секундомір",

        function:
            "Вимірювання тривалості нагрівання",

        value:
            "Тривалість нагрівання t, хв"
    }
};

export function initializeStand({
    root = document,
    namespace = "lab05"
} = {}) {
    const section =
        root.querySelector(
            "#stand"
        );

    if (
        !section ||
        section.dataset.initialized ===
            "true"
    ) {
        return;
    }

    const interactiveArea =
        section.querySelector(
            "#stand-interactive-area"
        );

    const lockOverlay =
        section.querySelector(
            "#stand-lock-overlay"
        );

    const componentElements =
        Array.from(
            section.querySelectorAll(
                "[data-stand-component]"
            )
        );

    const titleElement =
        section.querySelector(
            "#stand-component-title"
        );

    const descriptionElement =
        section.querySelector(
            "#stand-component-description"
        );

    const codeElement =
        section.querySelector(
            "#stand-component-code"
        );

    const functionElement =
        section.querySelector(
            "#stand-component-function"
        );

    const valueElement =
        section.querySelector(
            "#stand-component-value"
        );

    const progressText =
        section.querySelector(
            "#stand-progress-text"
        );

    const progressPercent =
        section.querySelector(
            "#stand-progress-percent"
        );

    const progressTrack =
        section.querySelector(
            ".stand-progress-track"
        );

    const progressBar =
        section.querySelector(
            "#stand-progress-bar"
        );

    const readyButton =
        section.querySelector(
            "#stand-ready-button"
        );

    const resetButton =
        section.querySelector(
            "#stand-reset-button"
        );

    const statusElement =
        section.querySelector(
            "#stand-status"
        );

    const requiredElements = [
        interactiveArea,
        lockOverlay,
        titleElement,
        descriptionElement,
        codeElement,
        functionElement,
        valueElement,
        progressText,
        progressPercent,
        progressTrack,
        progressBar,
        readyButton,
        resetButton,
        statusElement
    ];

    if (
        requiredElements.some(
            (element) => !element
        )
    ) {
        console.warn(
            "Не знайдено елементи віртуального стенда ЛР5."
        );

        return;
    }

    section.dataset.initialized =
        "true";

    const safetyStorage =
        createStorage(
            `${namespace}:safety`
        );

    const standStorage =
        createStorage(
            `${namespace}:stand`
        );

    const componentIds =
        Object.keys(
            componentInformation
        );

    const componentIdSet =
        new Set(
            componentIds
        );

    const savedProgress =
        standStorage.get(
            "progress",
            {
                visited: [],
                selected: null,
                ready: false
            }
        );

    const savedVisited =
        Array.isArray(
            savedProgress?.visited
        )
            ? savedProgress.visited
            : [];

    const visitedComponents =
        new Set(
            savedVisited.filter(
                (componentId) =>
                    componentIdSet.has(
                        componentId
                    )
            )
        );

    let selectedComponent =
        componentIdSet.has(
            savedProgress?.selected
        )
            ? savedProgress.selected
            : null;

    let standReady =
        savedProgress?.ready === true &&
        visitedComponents.size ===
            componentIds.length;

    function isSafetyPassed() {
        const safetyProgress =
            safetyStorage.get(
                "progress",
                {}
            );

        return (
            safetyProgress.passed ===
            true
        );
    }

    function updateAccess(event) {
        if (
            event?.detail?.namespace &&
            event.detail.namespace !==
                namespace
        ) {
            return;
        }

        const accessGranted =
            isSafetyPassed();

        lockOverlay.hidden =
            accessGranted;

        interactiveArea.inert =
            !accessGranted;

        section.classList.toggle(
            "stand-access-granted",
            accessGranted
        );
    }

    function saveProgress() {
        standStorage.set(
            "progress",
            {
                visited:
                    Array.from(
                        visitedComponents
                    ),

                selected:
                    selectedComponent,

                ready:
                    standReady
            }
        );
    }

    function setStatus(
        message,
        type = "neutral"
    ) {
        statusElement.textContent =
            message;

        statusElement.className =
            `stand-status stand-status-${type}`;
    }

    function updateComponentAppearance() {
        componentElements.forEach(
            (element) => {
                const componentId =
                    element.dataset
                        .standComponent;

                const isSelected =
                    componentId ===
                    selectedComponent;

                const isVisited =
                    visitedComponents.has(
                        componentId
                    );

                element.classList.toggle(
                    "is-selected",
                    isSelected
                );

                element.classList.toggle(
                    "is-visited",
                    isVisited
                );

                if (
                    element.matches(
                        "button"
                    )
                ) {
                    element.setAttribute(
                        "aria-pressed",
                        String(
                            isSelected
                        )
                    );
                }
            }
        );
    }

    function updateProgress() {
        const visitedCount =
            visitedComponents.size;

        const totalCount =
            componentIds.length;

        const percentage =
            Math.round(
                (
                    visitedCount /
                    totalCount
                ) * 100
            );

        progressText.textContent =
            `Переглянуто ${visitedCount} із ${totalCount} груп елементів`;

        progressPercent.textContent =
            `${percentage}%`;

        progressBar.style.width =
            `${percentage}%`;

        progressTrack.setAttribute(
            "aria-valuemax",
            String(totalCount)
        );

        progressTrack.setAttribute(
            "aria-valuenow",
            String(visitedCount)
        );

        readyButton.disabled =
            visitedCount !== totalCount ||
            standReady;

        if (standReady) {
            readyButton.textContent =
                "Готовність підтверджено";

            setStatus(
                "Склад і призначення елементів стенда вивчено. Можна переходити до проведення дослідів.",
                "success"
            );

            return;
        }

        readyButton.textContent =
            "Підтвердити готовність стенда";

        if (
            visitedCount ===
            totalCount
        ) {
            setStatus(
                "Усі групи елементів переглянуто. Підтвердьте готовність до роботи зі стендом.",
                "ready"
            );

            return;
        }

        setStatus(
            "Послідовно виберіть усі групи елементів стенда."
        );
    }

    function showComponent(
        componentId,
        markVisited = true
    ) {
        const information =
            componentInformation[
                componentId
            ];

        if (!information) {
            return;
        }

        selectedComponent =
            componentId;

        if (markVisited) {
            visitedComponents.add(
                componentId
            );
        }

        titleElement.textContent =
            information.title;

        descriptionElement.textContent =
            information.description;

        codeElement.textContent =
            information.code;

        functionElement.textContent =
            information.function;

        valueElement.textContent =
            information.value;

        updateComponentAppearance();
        updateProgress();
        saveProgress();
    }

    function handleComponentActivation(
        event
    ) {
        const componentId =
            event.currentTarget.dataset
                .standComponent;

        showComponent(
            componentId
        );
    }

    componentElements.forEach(
        (element) => {
            element.addEventListener(
                "click",
                handleComponentActivation
            );
        }
    );

    readyButton.addEventListener(
        "click",
        () => {
            if (
                visitedComponents.size !==
                componentIds.length
            ) {
                return;
            }

            standReady =
                true;

            updateProgress();
            saveProgress();

            document.dispatchEvent(
                new CustomEvent(
                    "laboratory:stand-ready",
                    {
                        detail: {
                            namespace
                        }
                    }
                )
            );
        }
    );

    resetButton.addEventListener(
        "click",
        () => {
            visitedComponents.clear();

            selectedComponent =
                null;

            standReady =
                false;

            titleElement.textContent =
                "Оберіть елемент стенда";

            descriptionElement.textContent =
                "Натисніть на елемент макета або його назву, щоб переглянути призначення.";

            codeElement.textContent =
                "-";

            functionElement.textContent =
                "-";

            valueElement.textContent =
                "-";

            updateComponentAppearance();
            updateProgress();
            saveProgress();

            document.dispatchEvent(
                new CustomEvent(
                    "laboratory:stand-reset",
                    {
                        detail: {
                            namespace
                        }
                    }
                )
            );
        }
    );

    document.addEventListener(
        "laboratory:safety-passed",
        updateAccess
    );

    document.addEventListener(
        "laboratory:safety-reset",
        updateAccess
    );

    updateAccess();
    updateComponentAppearance();

    if (selectedComponent) {
        showComponent(
            selectedComponent,
            false
        );
    } else {
        updateProgress();
    }
}