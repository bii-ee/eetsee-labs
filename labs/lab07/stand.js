import {
    createStorage
} from "../../common/js/storage.js";

const componentInformation = {
    switches: {
        title: "Вимикачі конфорок",
        description:
            "Вимикачі K1 і K2 підключають до кола відповідно першу та другу конфорки. Перед подаванням напруги вони повинні бути вимкнені.",
        code: "K1, K2",
        function: "Комутація кіл першої та другої конфорок",
        value: "Увімкнений або вимкнений стан конфорки"
    },

    regulators: {
        title: "Регулятори потужності",
        description:
            "Регулятори R1, R2 і біметалеві елементи B1, B2 забезпечують автоматичне циклічне вмикання та вимикання конфорок. Положення ручки змінює співвідношення тривалості нагрівання й охолодження.",
        code: "R1, R2; B1, B2",
        function: "Циклічне регулювання теплового режиму",
        value: "Тривалості tн і tо та відносна тривалість увімкнення ТВ"
    },

    indicators: {
        title: "Світлові індикатори",
        description:
            "Індикаторні лампи L1 і L2 відображають стан відповідної конфорки. Зміна стану індикатора допомагає визначити моменти автоматичного ввімкнення та вимкнення.",
        code: "L1, L2",
        function: "Візуальний контроль стану конфорок",
        value: "Моменти початку і завершення інтервалів tн та tо"
    },

    heaters: {
        title: "Нагрівальні елементи конфорок",
        description:
            "Нагрівальні елементи ТЕН1 і ТЕН2 перетворюють електричну енергію на теплову. У досліді температуру поверхні вибраної конфорки вимірюють на початку режиму та наприкінці інтервалів нагрівання й охолодження.",
        code: "ТЕН1, ТЕН2",
        function: "Нагрівання робочої поверхні конфорок",
        value: "Температури τ0, τн і τо, °C"
    },

    ammeter: {
        title: "Амперметр",
        description:
            "Амперметр увімкнений у спільне коло стенда. Разом зі світловим індикатором його покази використовують для визначення моментів автоматичного ввімкнення та вимкнення конфорки.",
        code: "PA",
        function: "Контроль проходження струму через установку",
        value: "Наявність або відсутність струму, А"
    },

    pyrometer: {
        title: "Пірометр",
        description:
            "Пірометр безконтактно вимірює температуру поверхні вибраної конфорки. Вимірювання виконують із безпечної відстані перед початком режиму та в моменти завершення нагрівання й охолодження.",
        code: "Пірометр",
        function: "Безконтактне вимірювання температури",
        value: "τ0, τн, τо, °C"
    },

    stopwatch: {
        title: "Секундомір",
        description:
            "Секундомір використовують для окремого визначення тривалості увімкненого стану tн і вимкненого стану tо в кожному з трьох циклів досліджуваного режиму.",
        code: "Секундомір",
        function: "Вимірювання часових інтервалів циклу",
        value: "tн, tо та Tц, с"
    }
};

export function initializeStand({
    root = document,
    namespace = "lab07"
} = {}) {
    const section = root.querySelector("#stand");

    if (
        !section ||
        section.dataset.initialized === "true"
    ) {
        return;
    }

    const interactiveArea = section.querySelector(
        "#stand-interactive-area"
    );
    const lockOverlay = section.querySelector(
        "#stand-lock-overlay"
    );
    const componentElements = Array.from(
        section.querySelectorAll(
            "[data-stand-component]"
        )
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
        !descriptionElement ||
        !codeElement ||
        !functionElement ||
        !valueElement ||
        !progressText ||
        !progressPercent ||
        !progressTrack ||
        !progressBar ||
        !readyButton ||
        !resetButton ||
        !statusElement
    ) {
        console.warn(
            "Не знайдено елементи віртуального стенда ЛР7."
        );

        return;
    }

    section.dataset.initialized = "true";

    const safetyStorage = createStorage(
        `${namespace}:safety`
    );
    const standStorage = createStorage(
        `${namespace}:stand`
    );
    const componentIds = Object.keys(
        componentInformation
    );
    const componentIdSet = new Set(componentIds);
    const savedProgress = standStorage.get(
        "progress",
        {
            visited: [],
            selected: null,
            ready: false
        }
    );
    const savedVisited = Array.isArray(
        savedProgress.visited
    )
        ? savedProgress.visited
        : [];
    const visitedComponents = new Set(
        savedVisited.filter((componentId) =>
            componentIdSet.has(componentId)
        )
    );

    let selectedComponent = componentIdSet.has(
        savedProgress.selected
    )
        ? savedProgress.selected
        : null;
    let standReady =
        savedProgress.ready === true &&
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
    }

    function saveProgress() {
        standStorage.set("progress", {
            visited: Array.from(visitedComponents),
            selected: selectedComponent,
            ready: standReady
        });
    }

    function setStatus(
        message,
        type = "neutral"
    ) {
        statusElement.textContent = message;
        statusElement.className =
            `stand-status stand-status-${type}`;
    }

    function updateComponentAppearance() {
        componentElements.forEach((element) => {
            const componentId =
                element.dataset.standComponent;
            const isSelected =
                componentId === selectedComponent;
            const isVisited =
                visitedComponents.has(componentId);

            element.classList.toggle(
                "is-selected",
                isSelected
            );
            element.classList.toggle(
                "is-visited",
                isVisited
            );

            if (element.matches("button")) {
                element.setAttribute(
                    "aria-pressed",
                    String(isSelected)
                );
            }
        });
    }

    function updateProgress() {
        const visitedCount = visitedComponents.size;
        const totalCount = componentIds.length;
        const percentage = Math.round(
            (visitedCount / totalCount) * 100
        );

        progressText.textContent =
            `Переглянуто ${visitedCount} із ${totalCount} груп елементів`;
        progressPercent.textContent = `${percentage}%`;
        progressBar.style.width = `${percentage}%`;

        progressTrack.setAttribute(
            "aria-valuemax",
            String(totalCount)
        );
        progressTrack.setAttribute(
            "aria-valuenow",
            String(visitedCount)
        );

        readyButton.disabled =
            visitedCount !== totalCount || standReady;

        if (standReady) {
            readyButton.textContent =
                "Готовність підтверджено";

            setStatus(
                "Склад і призначення елементів стенда вивчено. Можна переходити до проведення досліду.",
                "success"
            );

            return;
        }

        readyButton.textContent =
            "Підтвердити готовність стенда";

        if (visitedCount === totalCount) {
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
    });

    readyButton.addEventListener("click", () => {
        if (
            visitedComponents.size !==
            componentIds.length
        ) {
            return;
        }

        standReady = true;

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
    });

    resetButton.addEventListener("click", () => {
        visitedComponents.clear();

        selectedComponent = null;
        standReady = false;

        titleElement.textContent =
            "Оберіть елемент стенда";
        descriptionElement.textContent =
            "Натисніть на елемент макета або його назву, щоб переглянути призначення.";
        codeElement.textContent = "-";
        functionElement.textContent = "-";
        valueElement.textContent = "-";

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
    });

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
