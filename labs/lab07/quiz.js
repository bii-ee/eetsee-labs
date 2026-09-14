import {
    createStorage
} from "../../common/js/storage.js";

const PASSING_SCORE = 6;

const QUESTIONS = [
    {
        id: "q1",
        text:
            "Яку функцію виконує біметалевий регулятор потужності електроплити?",
        hint:
            "Зверніть увагу на періодичне замикання та розмикання кола нагрівального елемента.",
        correct: "B",
        options: [
            {
                value: "A",
                label:
                    "Безперервно змінює частоту напруги живлення",
                feedback:
                    "Частота мережі біметалевим регулятором не змінюється."
            },
            {
                value: "B",
                label:
                    "Періодично вмикає і вимикає нагрівальний елемент",
                feedback:
                    "Біметалевий регулятор забезпечує циклічне замикання та розмикання кола нагрівача."
            },
            {
                value: "C",
                label:
                    "Вимірює струм у колі нагрівального елемента",
                feedback:
                    "Струм вимірює амперметр, а не біметалевий регулятор."
            },
            {
                value: "D",
                label:
                    "Вимірює температуру поверхні конфорки",
                feedback:
                    "Температуру поверхні вимірюють пірометром."
            }
        ]
    },
    {
        id: "q2",
        text:
            "Що позначає тривалість tн у дослідженні циклічного режиму?",
        hint:
            "Цей інтервал відлічують, коли коло нагрівального елемента замкнене.",
        correct: "A",
        options: [
            {
                value: "A",
                label:
                    "Тривалість увімкненого стану конфорки",
                feedback:
                    "tн є тривалістю інтервалу нагрівання, протягом якого конфорка підключена до мережі."
            },
            {
                value: "B",
                label:
                    "Тривалість вимкненого стану конфорки",
                feedback:
                    "Тривалість вимкненого стану позначають tо."
            },
            {
                value: "C",
                label:
                    "Початкову температуру поверхні конфорки",
                feedback:
                    "Початкову температуру позначають τ₀ і вимірюють у градусах Цельсія."
            },
            {
                value: "D",
                label:
                    "Середню тривалість трьох повних циклів",
                feedback:
                    "tн визначають окремо для кожного інтервалу нагрівання."
            }
        ]
    },
    {
        id: "q3",
        text:
            "Що позначає тривалість tо в одному циклі роботи конфорки?",
        hint:
            "Упродовж цього інтервалу індикатор нагрівання не світиться.",
        correct: "C",
        options: [
            {
                value: "A",
                label:
                    "Час до першого увімкнення лабораторного стенда",
                feedback:
                    "Цей підготовчий інтервал не є складовою записаного циклу."
            },
            {
                value: "B",
                label:
                    "Час вимірювання температури пірометром",
                feedback:
                    "tо характеризує стан конфорки, а не тривалість роботи приладу."
            },
            {
                value: "C",
                label:
                    "Тривалість вимкненого стану та охолодження",
                feedback:
                    "tо є тривалістю інтервалу, коли нагрівальний елемент відключений від мережі."
            },
            {
                value: "D",
                label:
                    "Повну тривалість нагрівання трьох режимів",
                feedback:
                    "tо визначають для кожного окремого циклу."
            }
        ]
    },
    {
        id: "q4",
        text:
            "Як визначають повну тривалість одного циклу Tц?",
        hint:
            "Повний цикл охоплює увімкнений і вимкнений стани.",
        correct: "D",
        options: [
            {
                value: "A",
                label: "Tц = tн − tо",
                feedback:
                    "Віднімання не враховує повної тривалості двох послідовних інтервалів."
            },
            {
                value: "B",
                label: "Tц = tн · tо",
                feedback:
                    "Добуток двох тривалостей не має фізичного змісту повного часу циклу."
            },
            {
                value: "C",
                label: "Tц = tн / tо",
                feedback:
                    "Відношення є безрозмірним і не визначає тривалість циклу."
            },
            {
                value: "D",
                label: "Tц = tн + tо",
                feedback:
                    "Повна тривалість циклу дорівнює сумі інтервалів нагрівання та охолодження."
            }
        ]
    },
    {
        id: "q5",
        text:
            "Яка формула визначає відносну тривалість увімкнення ТВ?",
        hint:
            "Потрібно визначити частку повного циклу, протягом якої конфорка була увімкнена.",
        correct: "B",
        options: [
            {
                value: "A",
                label: "ТВ = tо / Tц · 100%",
                feedback:
                    "Ця формула визначає частку вимкненого стану."
            },
            {
                value: "B",
                label: "ТВ = tн / Tц · 100%",
                feedback:
                    "ТВ показує відсоткову частку повного циклу, протягом якої конфорка була увімкнена."
            },
            {
                value: "C",
                label: "ТВ = Tц / tн · 100%",
                feedback:
                    "У цій формулі чисельник і знаменник поміняно місцями."
            },
            {
                value: "D",
                label: "ТВ = tн + tо · 100%",
                feedback:
                    "Для визначення відносної величини потрібне відношення тривалостей."
            }
        ]
    },
    {
        id: "q6",
        text:
            "Як за результатами досліду змінюється режим роботи при переході від положення 1 до положення 3?",
        hint:
            "Порівняйте середні значення ТВ і температурні межі трьох режимів.",
        correct: "C",
        options: [
            {
                value: "A",
                label:
                    "ТВ і температурні межі залишаються незмінними",
                feedback:
                    "Експериментальні значення істотно відрізняються для трьох положень."
            },
            {
                value: "B",
                label:
                    "ТВ збільшується, а температури зменшуються",
                feedback:
                    "Збільшення часу увімкнення супроводжується підвищенням температурного рівня."
            },
            {
                value: "C",
                label:
                    "ТВ і температурні межі конфорки збільшуються",
                feedback:
                    "У вищому положенні регулятора конфорка довше увімкнена і працює за вищих температур."
            },
            {
                value: "D",
                label:
                    "Змінюється лише номер циклу, а режим не змінюється",
                feedback:
                    "Положення регулятора визначає співвідношення інтервалів нагрівання та охолодження."
            }
        ]
    },
    {
        id: "q7",
        text:
            "Для чого під час досліду використовують пірометр?",
        hint:
            "Прилад спрямовують на поверхню вибраної конфорки.",
        correct: "A",
        options: [
            {
                value: "A",
                label:
                    "Для безконтактного вимірювання температури поверхні",
                feedback:
                    "Пірометр дає змогу безконтактно визначати температуру поверхні конфорки."
            },
            {
                value: "B",
                label:
                    "Для вимірювання сили струму в нагрівальному елементі",
                feedback:
                    "Силу струму вимірюють амперметром."
            },
            {
                value: "C",
                label:
                    "Для визначення тривалості інтервалів циклу",
                feedback:
                    "Тривалість інтервалів визначають секундоміром."
            },
            {
                value: "D",
                label:
                    "Для перемикання положення регулятора",
                feedback:
                    "Пірометр є вимірювальним приладом і не керує регулятором."
            }
        ]
    },
    {
        id: "q8",
        text:
            "Яка послідовність початку експериментального дослідження є правильною?",
        hint:
            "Початкову температуру потрібно визначити до подавання живлення.",
        correct: "D",
        options: [
            {
                value: "A",
                label:
                    "Увімкнути установку, а потім вибрати конфорку",
                feedback:
                    "Досліджувану конфорку потрібно вибрати до початку першого режиму."
            },
            {
                value: "B",
                label:
                    "Спочатку змінити положення регулятора на третє",
                feedback:
                    "Режими виконують послідовно, починаючи з положення 1."
            },
            {
                value: "C",
                label:
                    "Виміряти τ₀ після завершення трьох циклів",
                feedback:
                    "τ₀ є початковою температурою і вимірюється до початку циклів."
            },
            {
                value: "D",
                label:
                    "Вибрати конфорку, виміряти τ₀ при вимкненій установці, потім подати живлення",
                feedback:
                    "Така послідовність забезпечує правильне початкове вимірювання та подальше виконання циклів."
            }
        ]
    }
];

function renderQuestion(question, number, selectedAnswer) {
    const options = question.options.map((option) => `
        <label class="quiz-option">
            <input
                type="radio"
                name="${question.id}"
                value="${option.value}"
                ${selectedAnswer === option.value ? "checked" : ""}
            >

            <span class="quiz-option-letter">
                ${option.value}
            </span>

            <span>${option.label}</span>
        </label>
    `).join("");

    return `
        <fieldset
            class="quiz-question"
            data-question-id="${question.id}"
        >
            <legend>${number}. ${question.text}</legend>

            <div class="quiz-options">
                ${options}
            </div>

            <details class="quiz-hint">
                <summary>Підказка</summary>
                <p>${question.hint}</p>
            </details>

            <p class="quiz-feedback" hidden></p>
        </fieldset>
    `;
}

export function initializeQuiz({
    root = document,
    namespace = "lab07"
} = {}) {
    const section = root.querySelector("#questions");

    if (!section || section.dataset.quizInitialized === "true") {
        return;
    }

    const elements = {
        lockOverlay: section.querySelector("#quiz-lock-overlay"),
        interactiveArea: section.querySelector(
            "#quiz-interactive-area"
        ),
        form: section.querySelector("#quiz-form"),
        list: section.querySelector("#quiz-list"),
        result: section.querySelector("#quiz-result"),
        resetButton: section.querySelector("#reset-quiz"),
        answeredCount: section.querySelector(
            "#quiz-answered-count"
        ),
        progressTrack: section.querySelector(
            ".quiz-progress-track"
        ),
        progressBar: section.querySelector("#quiz-progress-bar")
    };

    if (Object.values(elements).some((element) => !element)) {
        console.warn(
            "Не знайдено елементи контрольного тесту ЛР7."
        );
        return;
    }

    section.dataset.quizInitialized = "true";

    const analysisStorage = createStorage(`${namespace}:analysis`);
    const quizStorage = createStorage(`${namespace}:quiz`);

    let analysisSignature = "";
    let state = {
        answers: {},
        score: null,
        passed: false,
        checkedAt: null,
        analysisSignature: ""
    };

    function setResult(text, resultState = "default") {
        elements.result.textContent = text;
        elements.result.dataset.state = resultState;
    }

    function readState(signature) {
        const stored = quizStorage.get("progress", {});

        if (
            !stored ||
            typeof stored !== "object" ||
            stored.analysisSignature !== signature
        ) {
            return {
                answers: {},
                score: null,
                passed: false,
                checkedAt: null,
                analysisSignature: signature
            };
        }

        return {
            answers:
                stored.answers && typeof stored.answers === "object"
                    ? stored.answers
                    : {},
            score: Number.isFinite(Number(stored.score))
                ? Number(stored.score)
                : null,
            passed: stored.passed === true,
            checkedAt: stored.checkedAt ?? null,
            analysisSignature: signature
        };
    }

    function saveState() {
        quizStorage.set("progress", state);
    }

    function dispatchInvalidated() {
        window.dispatchEvent(
            new CustomEvent(`${namespace}:quiz-invalidated`)
        );
    }

    function renderQuestions() {
        elements.list.innerHTML = QUESTIONS.map(
            (question, index) => renderQuestion(
                question,
                index + 1,
                state.answers[question.id]
            )
        ).join("");
    }

    function getAnsweredCount() {
        return QUESTIONS.filter(
            (question) => Boolean(state.answers[question.id])
        ).length;
    }

    function updateProgress() {
        const answered = getAnsweredCount();
        const percentage = answered / QUESTIONS.length * 100;

        elements.answeredCount.textContent =
            `${answered} із ${QUESTIONS.length}`;
        elements.progressBar.style.width = `${percentage}%`;
        elements.progressTrack.setAttribute(
            "aria-valuenow",
            String(answered)
        );
    }

    function clearEvaluation() {
        elements.list.querySelectorAll(".quiz-question").forEach(
            (questionElement) => {
                questionElement.classList.remove(
                    "is-correct",
                    "is-incorrect"
                );

                const feedback = questionElement.querySelector(
                    ".quiz-feedback"
                );
                feedback.hidden = true;
                feedback.textContent = "";
            }
        );
    }

    function evaluateAnswers({ saveResult = true } = {}) {
        let score = 0;

        QUESTIONS.forEach((question) => {
            const selectedValue = state.answers[question.id];
            const selectedOption = question.options.find(
                (option) => option.value === selectedValue
            );
            const correctOption = question.options.find(
                (option) => option.value === question.correct
            );
            const questionElement = elements.list.querySelector(
                `[data-question-id="${question.id}"]`
            );
            const feedback = questionElement.querySelector(
                ".quiz-feedback"
            );
            const correct = selectedValue === question.correct;

            if (correct) {
                score += 1;
            }

            questionElement.classList.toggle("is-correct", correct);
            questionElement.classList.toggle("is-incorrect", !correct);
            feedback.hidden = false;

            if (correct) {
                feedback.textContent = selectedOption.feedback;
            } else {
                feedback.textContent =
                    `${selectedOption?.feedback ?? "Відповідь неправильна."} ` +
                    `Правильна відповідь: ${correctOption.label}.`;
            }
        });

        const passed = score >= PASSING_SCORE;

        state.score = score;
        state.passed = passed;

        if (saveResult) {
            state.checkedAt = new Date().toISOString();
            saveState();
        }

        if (passed) {
            setResult(
                `Тест пройдено: ${score} із ${QUESTIONS.length}. ` +
                "Відкрито формування підсумкового звіту.",
                "success"
            );

            if (saveResult) {
                window.dispatchEvent(
                    new CustomEvent(`${namespace}:quiz-completed`, {
                        detail: {
                            score,
                            total: QUESTIONS.length,
                            answers: state.answers
                        }
                    })
                );
            }
        } else {
            setResult(
                `Результат: ${score} із ${QUESTIONS.length}. ` +
                `Для проходження потрібно щонайменше ${PASSING_SCORE} правильних відповідей.`,
                "error"
            );

            if (saveResult) {
                dispatchInvalidated();
            }
        }
    }

    function invalidateQuiz() {
        const wasPassed = state.passed;

        state.score = null;
        state.passed = false;
        state.checkedAt = null;
        saveState();

        if (wasPassed) {
            dispatchInvalidated();
        }
    }

    function updateAccess() {
        const analysis = analysisStorage.get("progress", {});
        const ready =
            analysis?.completed === true &&
            typeof analysis.signature === "string" &&
            analysis.signature !== "";

        elements.lockOverlay.hidden = ready;
        elements.interactiveArea.inert = !ready;

        if (!ready) {
            invalidateQuiz();
            return;
        }

        if (analysis.signature !== analysisSignature) {
            analysisSignature = analysis.signature;
            state = readState(analysisSignature);
            renderQuestions();
            updateProgress();
            clearEvaluation();

            if (
                state.checkedAt &&
                getAnsweredCount() === QUESTIONS.length
            ) {
                evaluateAnswers({ saveResult: false });
            } else {
                setResult("Дайте відповідь на всі 8 запитань.");
            }
        }
    }

    elements.form.addEventListener("change", (event) => {
        const input = event.target.closest('input[type="radio"]');

        if (!input) {
            return;
        }

        const wasPassed = state.passed;

        state.answers[input.name] = input.value;
        state.score = null;
        state.passed = false;
        state.checkedAt = null;
        saveState();
        updateProgress();
        clearEvaluation();

        if (wasPassed) {
            dispatchInvalidated();
        }

        setResult(
            "Відповідь збережено. Після заповнення тесту натисніть «Перевірити відповіді»."
        );
    });

    elements.form.addEventListener("submit", (event) => {
        event.preventDefault();

        const answered = getAnsweredCount();

        if (answered < QUESTIONS.length) {
            setResult(
                `Надано відповідей: ${answered} із ${QUESTIONS.length}. Заповніть усі питання.`,
                "error"
            );

            const unanswered = QUESTIONS.find(
                (question) => !state.answers[question.id]
            );
            const unansweredElement = elements.list.querySelector(
                `[data-question-id="${unanswered.id}"]`
            );
            unansweredElement.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
            return;
        }

        evaluateAnswers();
    });

    elements.resetButton.addEventListener("click", () => {
        const hasAnswers = getAnsweredCount() > 0;

        if (
            hasAnswers &&
            !window.confirm("Очистити всі відповіді та почати тест заново?")
        ) {
            return;
        }

        const wasPassed = state.passed;

        state = {
            answers: {},
            score: null,
            passed: false,
            checkedAt: null,
            analysisSignature
        };
        saveState();
        renderQuestions();
        updateProgress();
        clearEvaluation();
        setResult("Дайте відповідь на всі 8 запитань.");

        if (wasPassed) {
            dispatchInvalidated();
        }
    });

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
