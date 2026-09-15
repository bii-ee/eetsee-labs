import {
    createStorage
} from "../../common/js/storage.js";

const componentInformation = {
    source: {
        title: "Джерело живлення",
        description:
            "Забезпечує живлення лабораторної установки змінною напругою. Подавання напруги дозволяється лише після перевірки схеми та з дозволу викладача.",
        code: "1; 220 В, 50 Гц",
        function:
            "Живлення лабораторної установки",
        value:
            "Напруга мережі та стан живлення"
    },

    switch: {
        title: "Вимикач установки",
        description:
            "Вимикач використовується для подавання та зняття напруги з лабораторної установки. Зміни підключень виконують тільки у вимкненому стані.",
        code: "2",
        function:
            "Комутація кола живлення",
        value:
            "Увімкнений або вимкнений стан установки"
    },

    autotransformer: {
        title: "Автотрансформатор",
        description:
            "Автотрансформатор використовується для встановлення заданої напруги живлення індукційної плити. У другому досліді задають 200, 220 або 240 В і контролюють фактичну напругу за DIRIS A20.",
        code: "3; ЛАТР",
        function:
            "Регулювання напруги живлення",
        value:
            "Задана і фактична напруга U, В"
    },

    "current-transformer": {
        title: "Трансформатор струму",
        description:
            "Трансформатор струму передає вимірювальний сигнал на струмовий вхід аналізатора DIRIS A20. Параметри його підключення повинні відповідати налаштуванням аналізатора.",
        code: "TA; S1, P1",
        function:
            "Передавання сигналу струму аналізатору",
        value:
            "Струм навантаження I, А"
    },

    analyzer: {
        title: "Аналізатор DIRIS A20",
        description:
            "Аналізатор параметрів мережі вимірює діюче значення напруги, струм і активну потужність під час увімкненого інтервалу роботи плити.",
        code: "4; DIRIS A20",
        function:
            "Вимірювання електричних параметрів",
        value:
            "U, В; I, А; P, кВт"
    },

    plate: {
        title: "Індукційна плита «МЕРИДІАН ПП-3»",
        description:
            "Досліджувана плита забезпечує індукційне нагрівання сумісного посуду. У роботі використовують режими «Нагрів» і «Термостат». Номінальна потужність плити становить 1600 Вт.",
        code: "5; МЕРИДІАН ПП-3",
        function:
            "Індукційне нагрівання посуду",
        value:
            "Режим, активна потужність і стан нагрівання"
    },

    cookware: {
        title: "Сумісний посуд із водою",
        description:
            "На плиті використовують посуд із рівним феромагнітним дном діаметром 12-26 см. Посуд із заданою кількістю води встановлюють у центрі зони нагрівання.",
        code: "Посуд 12-26 см",
        function:
            "Нагрівання заданої маси води",
        value:
            "Маса води mв та температура t0"
    },

    "measuring-tools": {
        title: "Засоби вимірювання",
        description:
            "Засоби вимірювання використовують для визначення маси води, її початкової температури, тривалості увімкнених і вимкнених інтервалів та загального часу нагрівання до кипіння.",
        code: "Термометр, засіб визначення маси, секундомір",
        function:
            "Вимірювання теплових і часових параметрів",
        value:
            "mв, t0, tувімк, tвимк, tкип"
    }
};

export function initializeStand({
    root = document,
    namespace = "lab08"
} = {}) {
    const section = root.querySelector("#stand");

    if (
        !section ||
        section.dataset.initialized === "true"
    ) {
        return;
    }

    const elements = {
        interactiveArea: section.querySelector(
            "#stand-interactive-area"
        ),

        lockOverlay: section.querySelector(
            "#stand-lock-overlay"
        ),

        title: section.querySelector(
            "#stand-component-title"
        ),

        description: section.querySelector(
            "#stand-component-description"
        ),

        code: section.querySelector(
            "#stand-component-code"
        ),

        functionValue: section.querySelector(
            "#stand-component-function"
        ),

        measuredValue: section.querySelector(
            "#stand-component-value"
        ),

        progressText: section.querySelector(
            "#stand-progress-text"
        ),

        progressPercent: section.querySelector(
            "#stand-progress-percent"
        ),

        progressTrack: section.querySelector(
            ".stand-progress-track"
        ),

        progressBar: section.querySelector(
            "#stand-progress-bar"
        ),

        readyButton: section.querySelector(
            "#stand-ready-button"
        ),

        resetButton: section.querySelector(
            "#stand-reset-button"
        ),

        status: section.querySelector(
            "#stand-status"
        )
    };

    const componentElements = Array.from(
        section.querySelectorAll(
            "[data-stand-component]"
        )
    );

    if (
        Object.values(elements).some(
            (element) => !element
        ) ||
        componentElements.length === 0
    ) {
        console.warn(
            "Не знайдено елементи віртуального стенда ЛР8."
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

    const componentIdSet = new Set(
        componentIds
    );

    const savedProgress = standStorage.get(
        "progress",
        {
            visited: [],
            selected: null,
            ready: false
        }
    );

    const savedVisited = Array.isArray(
        savedProgress?.visited
    )
        ? savedProgress.visited
        : [];

    const visitedComponents = new Set(
        savedVisited.filter(
            (componentId) =>
                componentIdSet.has(componentId)
        )
    );

    let selectedComponent =
        componentIdSet.has(savedProgress?.selected)
            ? savedProgress.selected
            : null;

    let standReady =
        savedProgress?.ready === true &&
        visitedComponents.size === componentIds.length;

    function isSafetyPassed() {
        const safetyProgress = safetyStorage.get(
            "progress",
            {}
        );

        return safetyProgress?.passed === true;
    }

    function eventMatchesNamespace(event) {
        return (
            !event?.detail?.namespace ||
            event.detail.namespace === namespace
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
        elements.status.textContent = message;
        elements.status.className =
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
        const visitedCount =
            visitedComponents.size;

        const totalCount =
            componentIds.length;

        const percentage = Math.round(
            visitedCount / totalCount * 100
        );

        elements.progressText.textContent =
            `Переглянуто ${visitedCount} із ${totalCount} груп елементів`;

        elements.progressPercent.textContent =
            `${percentage}%`;

        elements.progressBar.style.width =
            `${percentage}%`;

        elements.progressTrack.setAttribute(
            "aria-valuemax",
            String(totalCount)
        );

        elements.progressTrack.setAttribute(
            "aria-valuenow",
            String(visitedCount)
        );

        elements.readyButton.disabled =
            visitedCount !== totalCount ||
            standReady;

        if (standReady) {
            elements.readyButton.textContent =
                "Готовність підтверджено";

            setStatus(
                "Склад і призначення елементів установки вивчено. Можна переходити до проведення дослідів.",
                "success"
            );

            return;
        }

        elements.readyButton.textContent =
            "Підтвердити готовність стенда";

        if (visitedCount === totalCount) {
            setStatus(
                "Усі групи елементів переглянуто. Підтвердьте готовність до роботи з установкою.",
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

        elements.title.textContent =
            information.title;

        elements.description.textContent =
            information.description;

        elements.code.textContent =
            information.code;

        elements.functionValue.textContent =
            information.function;

        elements.measuredValue.textContent =
            information.value;

        updateComponentAppearance();
        updateProgress();
        saveProgress();
    }

    function resetInformation() {
        elements.title.textContent =
            "Оберіть елемент стенда";

        elements.description.textContent =
            "Натисніть на елемент макета або його назву, щоб переглянути призначення.";

        elements.code.textContent = "-";
        elements.functionValue.textContent = "-";
        elements.measuredValue.textContent = "-";
    }

    function dispatchStandReset() {
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

    function resetProgress({
        notify = true
    } = {}) {
        const hadProgress =
            visitedComponents.size > 0 ||
            standReady ||
            selectedComponent !== null;

        visitedComponents.clear();
        selectedComponent = null;
        standReady = false;

        resetInformation();
        updateComponentAppearance();
        updateProgress();
        saveProgress();

        if (notify && hadProgress) {
            dispatchStandReset();
        }
    }

    function updateAccess() {
        const accessGranted =
            isSafetyPassed();

        elements.lockOverlay.hidden =
            accessGranted;

        elements.interactiveArea.inert =
            !accessGranted;

        section.classList.toggle(
            "stand-access-granted",
            accessGranted
        );

        if (
            !accessGranted &&
            (
                standReady ||
                visitedComponents.size > 0
            )
        ) {
            resetProgress();
        }
    }

    componentElements.forEach((element) => {
        element.addEventListener(
            "click",
            () => {
                showComponent(
                    element.dataset.standComponent
                );
            }
        );
    });

    elements.readyButton.addEventListener(
        "click",
        () => {
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
        }
    );

    elements.resetButton.addEventListener(
        "click",
        () => {
            resetProgress();
        }
    );

    document.addEventListener(
        "laboratory:safety-passed",
        (event) => {
            if (!eventMatchesNamespace(event)) {
                return;
            }

            updateAccess();
        }
    );

    document.addEventListener(
        "laboratory:safety-reset",
        (event) => {
            if (!eventMatchesNamespace(event)) {
                return;
            }

            resetProgress();
            updateAccess();
        }
    );

    if (!isSafetyPassed()) {
        visitedComponents.clear();
        selectedComponent = null;
        standReady = false;
        saveProgress();
    }

    updateAccess();
    updateComponentAppearance();

    if (selectedComponent) {
        showComponent(
            selectedComponent,
            false
        );
    } else {
        resetInformation();
        updateProgress();
    }
}