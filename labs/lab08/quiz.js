import {
    createStorage
} from "../../common/js/storage.js";

const PASSING_SCORE = 6;
const STATE_VERSION = 1;

const QUESTIONS = [
    {
        id: "q1",

        text:
            "Що відбувається з активною потужністю конфорки у циклічному режимі «Термостат»?",

        hint:
            "Проаналізуйте ступінчастий графік P(t).",

        correct: "B",

        options: [
            {
                value: "A",

                label:
                    "Потужність безперервно та плавно зменшується",

                feedback:
                    "У дослідженні потужність не змінюється безперервно."
            },
            {
                value: "B",

                label:
                    "Під час увімкнення потужність дорівнює Pi, а під час вимкнення дорівнює нулю",

                feedback:
                    "Саме так формується ступінчастий графік активної потужності."
            },
            {
                value: "C",

                label:
                    "Потужність залишається сталою протягом усього циклу",

                feedback:
                    "У вимкненому інтервалі конфорка не споживає активної потужності."
            },
            {
                value: "D",

                label:
                    "Потужність змінюється лише через зміну температури води",

                feedback:
                    "Циклічна зміна визначається увімкненням і вимкненням конфорки."
            }
        ]
    },
    {
        id: "q2",

        text:
            "За якою формулою визначають електричну енергію, спожиту протягом одного увімкненого інтервалу?",

        hint:
            "Потужність подається у кіловатах, а тривалість у секундах.",

        correct: "C",

        options: [
            {
                value: "A",

                label:
                    "Wi = Pi / tувімк,i",

                feedback:
                    "Ділення потужності на час не визначає спожиту енергію."
            },
            {
                value: "B",

                label:
                    "Wi = Pi · tвимк,i / 3600",

                feedback:
                    "Енергію розраховують за тривалістю увімкненого, а не вимкненого стану."
            },
            {
                value: "C",

                label:
                    "Wi = Pi · tувімк,i / 3600",

                feedback:
                    "Добуток потужності на тривалість увімкнення з перерахунком секунд у години дає енергію у кВт·год."
            },
            {
                value: "D",

                label:
                    "Wi = Pi · (tувімк,i + tвимк,i)",

                feedback:
                    "У цій формулі не виконано перерахунок секунд у години та враховано вимкнений інтервал."
            }
        ]
    },
    {
        id: "q3",

        text:
            "Чому тривалість вимкненого інтервалу не входить до формули електричної енергії одного циклу?",

        hint:
            "Врахуйте значення активної потужності у вимкненому стані.",

        correct: "A",

        options: [
            {
                value: "A",

                label:
                    "У вимкненому інтервалі активна потужність конфорки дорівнює нулю",

                feedback:
                    "За нульової активної потужності електрична енергія конфоркою не споживається."
            },
            {
                value: "B",

                label:
                    "Тривалість вимкнення завжди дорівнює тривалості увімкнення",

                feedback:
                    "Тривалості увімкнення та вимкнення можуть відрізнятися."
            },
            {
                value: "C",

                label:
                    "Тривалість вимкнення неможливо виміряти",

                feedback:
                    "Тривалість вимкненого інтервалу вимірюється та записується в таблицю."
            },
            {
                value: "D",

                label:
                    "Під час вимкнення електрична енергія перетворюється на механічну",

                feedback:
                    "У вимкненому стані конфорка не споживає активної електричної енергії."
            }
        ]
    },
    {
        id: "q4",

        text:
            "Як визначають загальну електричну енергію Wел, спожиту під час шести циклів?",

        hint:
            "Потрібно об’єднати результати всіх окремих циклів.",

        correct: "D",

        options: [
            {
                value: "A",

                label:
                    "Вибирають найбільше значення Wi",

                feedback:
                    "Найбільше значення характеризує лише один цикл."
            },
            {
                value: "B",

                label:
                    "Обчислюють середнє значення Wi",

                feedback:
                    "Середнє значення не дорівнює загальній спожитій енергії."
            },
            {
                value: "C",

                label:
                    "Множать енергію першого циклу на шість",

                feedback:
                    "Потужність і тривалість увімкнення в циклах відрізняються."
            },
            {
                value: "D",

                label:
                    "Додають значення енергії всіх шести циклів",

                feedback:
                    "Загальна електрична енергія визначається як сума W1 + W2 + ... + W6."
            }
        ]
    },
    {
        id: "q5",

        text:
            "Яка формула використовується для визначення кількості теплоти, отриманої водою?",

        hint:
            "Ураховуються маса води, питома теплоємність і зміна температури.",

        correct: "B",

        options: [
            {
                value: "A",

                label:
                    "Q = P · tувімк",

                feedback:
                    "Ця залежність описує електричну енергію, а не теплоту, отриману водою."
            },
            {
                value: "B",

                label:
                    "Q = mв · cв · (100 − t0) / 3600",

                feedback:
                    "Формула враховує нагрівання заданої маси води від початкової температури до 100 °C."
            },
            {
                value: "C",

                label:
                    "Q = Wел · 3600",

                feedback:
                    "Це не враховує масу води та зміну її температури."
            },
            {
                value: "D",

                label:
                    "Q = mв / (100 − t0)",

                feedback:
                    "Для визначення теплоти масу потрібно помножити на питому теплоємність і зміну температури."
            }
        ]
    },
    {
        id: "q6",

        text:
            "Як визначають експериментальний термічний ККД плити?",

        hint:
            "Порівнюють корисну теплоту, отриману водою, зі спожитою електричною енергією.",

        correct: "A",

        options: [
            {
                value: "A",

                label:
                    "η = Q / Wел · 100%",

                feedback:
                    "ККД визначає частку спожитої електричної енергії, яка перетворилася на корисну теплоту води."
            },
            {
                value: "B",

                label:
                    "η = Wел / Q · 100%",

                feedback:
                    "У цій формулі чисельник і знаменник поміняно місцями."
            },
            {
                value: "C",

                label:
                    "η = Q + Wел",

                feedback:
                    "ККД є відносною величиною, а не сумою двох енергій."
            },
            {
                value: "D",

                label:
                    "η = P / U · 100%",

                feedback:
                    "Відношення потужності до напруги визначає струм, а не ККД."
            }
        ]
    },
    {
        id: "q7",

        text:
            "За якого значення заданої напруги в режимі 240 °C зафіксовано найбільшу активну потужність?",

        hint:
            "Порівняйте три точки лінії 240 °C на графіку P = f(Uзад).",

        correct: "D",

        options: [
            {
                value: "A",

                label:
                    "За напруги 100 В",

                feedback:
                    "Такого значення заданої напруги у другому досліді немає."
            },
            {
                value: "B",

                label:
                    "За напруги 200 В",

                feedback:
                    "За 200 В активна потужність становить 1,39 кВт, що менше максимального значення."
            },
            {
                value: "C",

                label:
                    "За напруги 220 В",

                feedback:
                    "За 220 В активна потужність становить 1,50 кВт."
            },
            {
                value: "D",

                label:
                    "За напруги 240 В",

                feedback:
                    "У режимі 240 °C найбільша потужність 1,57 кВт зафіксована за заданої напруги 240 В."
            }
        ]
    },
    {
        id: "q8",

        text:
            "Як змінюється тривалість нагрівання води до кипіння при збільшенні напруги від 200 до 240 В за однакової заданої температури?",

        hint:
            "Порівнюйте точки, що належать одній температурній лінії.",

        correct: "C",

        options: [
            {
                value: "A",

                label:
                    "Збільшується для всіх трьох температур",

                feedback:
                    "На графіку тривалість нагрівання зі збільшенням напруги зменшується."
            },
            {
                value: "B",

                label:
                    "Залишається незмінною",

                feedback:
                    "Експериментальні значення за 200, 220 і 240 В відрізняються."
            },
            {
                value: "C",

                label:
                    "Зменшується для всіх трьох заданих температур",

                feedback:
                    "За більшої напруги нагрівання води до кипіння в досліджених режимах відбувається швидше."
            },
            {
                value: "D",

                label:
                    "Залежить лише від номера режиму і не залежить від напруги",

                feedback:
                    "Результати другого досліду демонструють залежність тривалості нагрівання від напруги."
            }
        ]
    }
];

function createInitialState(
    analysisSignature = ""
) {
    return {
        version: STATE_VERSION,
        answers: {},
        score: null,
        passed: false,
        checkedAt: null,
        analysisSignature
    };
}

function renderQuestion(
    question,
    number,
    selectedAnswer
) {
    const options = question.options
        .map(
            (option) => `
                <label class="quiz-option">
                    <input
                        type="radio"
                        name="${question.id}"
                        value="${option.value}"
                        ${selectedAnswer === option.value
                            ? "checked"
                            : ""
                        }
                    >

                    <span class="quiz-option-letter">
                        ${option.value}
                    </span>

                    <span>
                        ${option.label}
                    </span>
                </label>
            `
        )
        .join("");

    return `
        <fieldset
            class="quiz-question"
            data-question-id="${question.id}"
        >
            <legend>
                ${number}. ${question.text}
            </legend>

            <div class="quiz-options">
                ${options}
            </div>

            <details class="quiz-hint">
                <summary>
                    Підказка
                </summary>

                <p>
                    ${question.hint}
                </p>
            </details>

            <p
                class="quiz-feedback"
                hidden
            ></p>
        </fieldset>
    `;
}

export function initializeQuiz({
    root = document,
    namespace = "lab08"
} = {}) {
    const section =
        root.querySelector(
            "#questions"
        );

    if (
        !section ||
        section.dataset.quizInitialized ===
            "true"
    ) {
        return;
    }

    const elements = {
        lockOverlay:
            section.querySelector(
                "#quiz-lock-overlay"
            ),

        interactiveArea:
            section.querySelector(
                "#quiz-interactive-area"
            ),

        form:
            section.querySelector(
                "#quiz-form"
            ),

        list:
            section.querySelector(
                "#quiz-list"
            ),

        result:
            section.querySelector(
                "#quiz-result"
            ),

        checkButton:
            section.querySelector(
                "#quiz-check-button"
            ),

        resetButton:
            section.querySelector(
                "#reset-quiz"
            ),

        answeredCount:
            section.querySelector(
                "#quiz-answered-count"
            ),

        progressTrack:
            section.querySelector(
                ".quiz-progress-track"
            ),

        progressBar:
            section.querySelector(
                "#quiz-progress-bar"
            )
    };

    const missingElement =
        Object.entries(elements).find(
            ([, element]) => !element
        );

    if (missingElement) {
        console.warn(
            "Не знайдено елемент контрольного тесту: " +
            `${missingElement[0]}.`
        );

        return;
    }

    section.dataset.quizInitialized =
        "true";

    const analysisStorage =
        createStorage(
            `${namespace}:analysis`
        );

    const quizStorage =
        createStorage(
            `${namespace}:quiz`
        );

    let analysisSignature = "";

    let state =
        createInitialState();

    function setResult(
        text,
        resultState = "default"
    ) {
        elements.result.textContent =
            text;

        elements.result.dataset.state =
            resultState;
    }

    function readState(signature) {
        const stored =
            quizStorage.get(
                "progress",
                null
            );

        if (
            !stored ||
            typeof stored !== "object" ||
            stored.version !== STATE_VERSION ||
            stored.analysisSignature !==
                signature
        ) {
            return createInitialState(
                signature
            );
        }

        return {
            version: STATE_VERSION,

            answers:
                stored.answers &&
                typeof stored.answers ===
                    "object"
                    ? stored.answers
                    : {},

            score:
                Number.isFinite(
                    Number(stored.score)
                )
                    ? Number(stored.score)
                    : null,

            passed:
                stored.passed === true,

            checkedAt:
                stored.checkedAt ??
                null,

            analysisSignature:
                signature
        };
    }

    function saveState() {
        quizStorage.set(
            "progress",
            state
        );
    }

    function dispatchQuizEvent(
        type,
        detail = {}
    ) {
        document.dispatchEvent(
            new CustomEvent(
                `laboratory:quiz-${type}`,
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
                `${namespace}:quiz-${type}`,
                {
                    detail
                }
            )
        );
    }

    function renderQuestions() {
        elements.list.innerHTML =
            QUESTIONS.map(
                (
                    question,
                    index
                ) =>
                    renderQuestion(
                        question,
                        index + 1,
                        state.answers[
                            question.id
                        ]
                    )
            ).join("");
    }

    function getAnsweredCount() {
        return QUESTIONS.filter(
            (question) =>
                Boolean(
                    state.answers[
                        question.id
                    ]
                )
        ).length;
    }

    function updateProgress() {
        const answered =
            getAnsweredCount();

        const percentage =
            answered /
            QUESTIONS.length *
            100;

        elements.answeredCount.textContent =
            `${answered} із ${QUESTIONS.length}`;

        elements.progressBar.style.width =
            `${percentage}%`;

        elements.progressTrack.setAttribute(
            "aria-valuenow",
            String(answered)
        );
    }

    function clearEvaluation() {
        elements.list
            .querySelectorAll(
                ".quiz-question"
            )
            .forEach(
                (questionElement) => {
                    questionElement.classList.remove(
                        "is-correct",
                        "is-incorrect"
                    );

                    const feedback =
                        questionElement.querySelector(
                            ".quiz-feedback"
                        );

                    if (feedback) {
                        feedback.hidden =
                            true;

                        feedback.textContent =
                            "";
                    }
                }
            );
    }

    function evaluateAnswers({
        saveResult = true
    } = {}) {
        let score = 0;

        QUESTIONS.forEach(
            (question) => {
                const selectedValue =
                    state.answers[
                        question.id
                    ];

                const selectedOption =
                    question.options.find(
                        (option) =>
                            option.value ===
                            selectedValue
                    );

                const correctOption =
                    question.options.find(
                        (option) =>
                            option.value ===
                            question.correct
                    );

                const questionElement =
                    elements.list.querySelector(
                        `[data-question-id="${question.id}"]`
                    );

                const feedback =
                    questionElement?.querySelector(
                        ".quiz-feedback"
                    );

                const correct =
                    selectedValue ===
                    question.correct;

                if (correct) {
                    score += 1;
                }

                questionElement?.classList.toggle(
                    "is-correct",
                    correct
                );

                questionElement?.classList.toggle(
                    "is-incorrect",
                    !correct
                );

                if (feedback) {
                    feedback.hidden =
                        false;

                    feedback.textContent =
                        correct
                            ? selectedOption.feedback
                            : `${
                                selectedOption?.feedback ??
                                "Відповідь неправильна."
                            } Правильна відповідь: ${
                                correctOption.label
                            }.`;
                }
            }
        );

        const passed =
            score >= PASSING_SCORE;

        state.score = score;
        state.passed = passed;

        if (saveResult) {
            state.checkedAt =
                new Date().toISOString();

            saveState();
        }

        if (passed) {
            setResult(
                `Тест пройдено: ${score} із ${QUESTIONS.length}. ` +
                "Відкрито формування підсумкового звіту.",
                "success"
            );

            if (saveResult) {
                dispatchQuizEvent(
                    "completed",
                    {
                        score,
                        total:
                            QUESTIONS.length,

                        answers:
                            state.answers,

                        analysisSignature
                    }
                );
            }

            return;
        }

        setResult(
            `Результат: ${score} із ${QUESTIONS.length}. ` +
            `Для проходження потрібно щонайменше ${PASSING_SCORE} правильних відповідей.`,
            "error"
        );

        if (saveResult) {
            dispatchQuizEvent(
                "invalidated"
            );
        }
    }

    function invalidateQuiz() {
        const wasPassed =
            state.passed;

        state.score = null;
        state.passed = false;
        state.checkedAt = null;

        saveState();

        if (wasPassed) {
            dispatchQuizEvent(
                "invalidated"
            );
        }
    }

    function updateAccess(event) {
        if (
            event?.detail?.namespace &&
            event.detail.namespace !==
                namespace
        ) {
            return;
        }

        const analysis =
            analysisStorage.get(
                "progress",
                {}
            );

        const ready =
            analysis?.completed === true &&
            typeof analysis.signature ===
                "string" &&
            analysis.signature !== "";

        elements.lockOverlay.hidden =
            ready;

        elements.interactiveArea.inert =
            !ready;

        elements.checkButton.disabled =
            !ready;

        elements.resetButton.disabled =
            !ready;

        if (!ready) {
            invalidateQuiz();
            return;
        }

        if (
            analysis.signature ===
            analysisSignature
        ) {
            return;
        }

        analysisSignature =
            analysis.signature;

        state =
            readState(
                analysisSignature
            );

        renderQuestions();
        updateProgress();
        clearEvaluation();

        if (
            state.checkedAt &&
            getAnsweredCount() ===
                QUESTIONS.length
        ) {
            evaluateAnswers({
                saveResult: false
            });

            return;
        }

        setResult(
            "Дайте відповідь на всі 8 запитань."
        );
    }

    elements.form.addEventListener(
        "change",
        (event) => {
            const input =
                event.target.closest(
                    'input[type="radio"]'
                );

            if (!input) {
                return;
            }

            const wasPassed =
                state.passed;

            state.answers[
                input.name
            ] = input.value;

            state.score = null;
            state.passed = false;
            state.checkedAt = null;

            saveState();
            updateProgress();
            clearEvaluation();

            if (wasPassed) {
                dispatchQuizEvent(
                    "invalidated"
                );
            }

            setResult(
                "Відповідь збережено. Після заповнення тесту натисніть «Перевірити відповіді»."
            );
        }
    );

    elements.form.addEventListener(
        "submit",
        (event) => {
            event.preventDefault();

            const answered =
                getAnsweredCount();

            if (
                answered <
                QUESTIONS.length
            ) {
                setResult(
                    `Надано відповідей: ${answered} із ${QUESTIONS.length}. ` +
                    "Заповніть усі питання.",
                    "error"
                );

                const unanswered =
                    QUESTIONS.find(
                        (question) =>
                            !state.answers[
                                question.id
                            ]
                    );

                const unansweredElement =
                    elements.list.querySelector(
                        `[data-question-id="${unanswered.id}"]`
                    );

                unansweredElement?.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

                return;
            }

            evaluateAnswers();
        }
    );

    elements.resetButton.addEventListener(
        "click",
        () => {
            const hasAnswers =
                getAnsweredCount() > 0;

            if (
                hasAnswers &&
                !window.confirm(
                    "Очистити всі відповіді та почати тест заново?"
                )
            ) {
                return;
            }

            const wasPassed =
                state.passed;

            state =
                createInitialState(
                    analysisSignature
                );

            saveState();
            renderQuestions();
            updateProgress();
            clearEvaluation();

            setResult(
                "Дайте відповідь на всі 8 запитань."
            );

            if (wasPassed) {
                dispatchQuizEvent(
                    "invalidated"
                );
            }
        }
    );

    document.addEventListener(
        "laboratory:analysis-completed",
        updateAccess
    );

    document.addEventListener(
        "laboratory:analysis-invalidated",
        updateAccess
    );

    document.addEventListener(
        "laboratory:calculations-invalidated",
        updateAccess
    );

    document.addEventListener(
        "laboratory:experiment-reset",
        updateAccess
    );

    window.addEventListener(
        `${namespace}:analysis-completed`,
        updateAccess
    );

    window.addEventListener(
        `${namespace}:analysis-invalidated`,
        updateAccess
    );

    renderQuestions();
    updateProgress();
    updateAccess();
}