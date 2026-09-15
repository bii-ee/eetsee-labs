import { createStorage } from "../../common/js/storage.js";

const PASSING_SCORE = 6;
const LAB05_ANALYSIS_STORAGE_KEY = "eetsee.lab05.analysis.v2";
const LAB05_QUIZ_STORAGE_KEY = "eetsee.lab05.quiz.v2";

const QUESTIONS = Object.freeze([
    Object.freeze({
        id: "q1",
        text:
            "Яке основне призначення електродного нагрівального елемента?",
        hint:
            "Зверніть увагу на перетворення енергії під час проходження електричного струму.",
        correct: "B",
        options: Object.freeze([
            Object.freeze({
                value: "A",
                label: "Знижувати напругу мережі до нуля",
                feedback:
                    "Регулювання напруги виконує ЛАТР, а не нагрівальний елемент."
            }),
            Object.freeze({
                value: "B",
                label:
                    "Перетворювати електричну енергію на теплову та нагрівати воду",
                feedback:
                    "Нагрівальний елемент перетворює спожиту електричну енергію на теплоту."
            }),
            Object.freeze({
                value: "C",
                label: "Вимірювати температуру кипіння води",
                feedback:
                    "Температуру визначає вимірювальний засіб, а не нагрівальний елемент."
            }),
            Object.freeze({
                value: "D",
                label: "Вимірювати активну потужність установки",
                feedback:
                    "Активну потужність вимірює ватметр."
            })
        ])
    }),
    Object.freeze({
        id: "q2",
        text: "Яку функцію виконує ЛАТР у лабораторній установці?",
        hint:
            "Цей елемент використовують для встановлення необхідного режиму живлення нагрівача.",
        correct: "C",
        options: Object.freeze([
            Object.freeze({
                value: "A",
                label: "Вимірює силу струму",
                feedback: "Силу струму вимірює амперметр."
            }),
            Object.freeze({
                value: "B",
                label: "Визначає температуру води",
                feedback:
                    "ЛАТР не є засобом вимірювання температури."
            }),
            Object.freeze({
                value: "C",
                label:
                    "Плавно регулює напругу, прикладену до нагрівального елемента",
                feedback:
                    "ЛАТР дає змогу встановити потрібне значення напруги для досліду."
            }),
            Object.freeze({
                value: "D",
                label: "Автоматично обчислює витрати енергії",
                feedback:
                    "Витрати електричної енергії визначають розрахунком."
            })
        ])
    }),
    Object.freeze({
        id: "q3",
        text:
            "Які величини безпосередньо фіксують під час кожного досліду?",
        hint:
            "Використайте покази вольтметра, амперметра, ватметра та секундоміра.",
        correct: "A",
        options: Object.freeze([
            Object.freeze({
                value: "A",
                label:
                    "Напругу, силу струму, активну потужність і тривалість нагрівання",
                feedback:
                    "Саме ці величини утворюють основний набір експериментальних даних."
            }),
            Object.freeze({
                value: "B",
                label:
                    "Лише початкову та кінцеву температуру води",
                feedback:
                    "Температури є умовами досліду, але також фіксують електричні параметри й час."
            }),
            Object.freeze({
                value: "C",
                label: "Частоту мережі та реактивну потужність",
                feedback:
                    "Ці величини не є основними вимірюваними параметрами цієї роботи."
            }),
            Object.freeze({
                value: "D",
                label: "Опір ізоляції та коефіцієнт потужності",
                feedback:
                    "Такі вимірювання не передбачені програмою проведення цих шести дослідів."
            })
        ])
    }),
    Object.freeze({
        id: "q4",
        text:
            "Як у дослідженому діапазоні змінюється сила струму зі збільшенням напруги?",
        hint:
            "Порівняйте точки графіка I = f(U) для 100, 150 і 200 В.",
        correct: "D",
        options: Object.freeze([
            Object.freeze({
                value: "A",
                label: "Зменшується до нуля",
                feedback:
                    "Експериментальні дані показують протилежну тенденцію."
            }),
            Object.freeze({
                value: "B",
                label: "Залишається незмінною",
                feedback:
                    "Для кожного нагрівача значення струму змінюється разом із напругою."
            }),
            Object.freeze({
                value: "C",
                label: "Спочатку зменшується, а потім не змінюється",
                feedback:
                    "На графіку не спостерігається такої залежності."
            }),
            Object.freeze({
                value: "D",
                label: "Збільшується",
                feedback:
                    "Зі збільшенням прикладеної напруги сила струму обох нагрівачів зростає."
            })
        ])
    }),
    Object.freeze({
        id: "q5",
        text:
            "Як збільшення активної потужності впливає на тривалість нагрівання однакового об’єму води?",
        hint:
            "Зіставте графіки P = f(U) і t = f(U).",
        correct: "B",
        options: Object.freeze([
            Object.freeze({
                value: "A",
                label: "Тривалість нагрівання збільшується",
                feedback:
                    "За більшої потужності вода досягає температури кипіння швидше."
            }),
            Object.freeze({
                value: "B",
                label: "Тривалість нагрівання зменшується",
                feedback:
                    "Зростання потужності скорочує час нагрівання за однакових початкових умов."
            }),
            Object.freeze({
                value: "C",
                label: "Тривалість завжди дорівнює 60 хвилинам",
                feedback:
                    "Тривалість визначається параметрами конкретного режиму."
            }),
            Object.freeze({
                value: "D",
                label: "Потужність не впливає на нагрівання",
                feedback:
                    "Активна потужність безпосередньо впливає на швидкість передавання енергії."
            })
        ])
    }),
    Object.freeze({
        id: "q6",
        text:
            "За якою формулою визначають витрати електричної енергії Wел, якщо P задано у ватах, а t у хвилинах?",
        hint:
            "Щоб отримати ват-години, тривалість потрібно перевести з хвилин у години.",
        correct: "C",
        options: Object.freeze([
            Object.freeze({
                value: "A",
                label: "Wел = P / t",
                feedback:
                    "Ділення потужності на час не визначає спожиту енергію."
            }),
            Object.freeze({
                value: "B",
                label: "Wел = P · t · 60",
                feedback:
                    "Множення на 60 неправильно перетворює хвилини на години."
            }),
            Object.freeze({
                value: "C",
                label: "Wел = P · t / 60",
                feedback:
                    "Добуток потужності на тривалість у годинах визначає енергію у ват-годинах."
            }),
            Object.freeze({
                value: "D",
                label: "Wел = U · I / t",
                feedback:
                    "Енергію визначають множенням потужності на час, а не діленням на час."
            })
        ])
    }),
    Object.freeze({
        id: "q7",
        text:
            "Для чого у формулі Wел = P · t / 60 використано число 60?",
        hint:
            "Порівняйте одиниці часу в таблиці та одиниці вимірювання ват-години.",
        correct: "A",
        options: Object.freeze([
            Object.freeze({
                value: "A",
                label: "Для переведення хвилин у години",
                feedback:
                    "Одна година містить 60 хвилин, тому значення часу ділять на 60."
            }),
            Object.freeze({
                value: "B",
                label: "Для переведення вольтів у вати",
                feedback:
                    "Вольти та вати є різними фізичними величинами й так не перетворюються."
            }),
            Object.freeze({
                value: "C",
                label: "Для врахування температури кипіння",
                feedback:
                    "Температура кипіння не визначає коефіцієнт 60 у цій формулі."
            }),
            Object.freeze({
                value: "D",
                label: "Для визначення сили струму",
                feedback:
                    "Сила струму не обчислюється через цей коефіцієнт."
            })
        ])
    }),
    Object.freeze({
        id: "q8",
        text:
            "Чому витрати енергії за різних напруг залишаються відносно близькими, хоча потужність і час суттєво змінюються?",
        hint:
            "В усіх дослідах нагрівають однаковий об’єм води від однакової початкової температури до кипіння.",
        correct: "D",
        options: Object.freeze([
            Object.freeze({
                value: "A",
                label: "Тому що сила струму в усіх дослідах однакова",
                feedback:
                    "Сила струму змінюється зі зміною напруги та типу нагрівача."
            }),
            Object.freeze({
                value: "B",
                label: "Тому що напруга не впливає на потужність",
                feedback:
                    "Експериментальні графіки показують зростання потужності зі збільшенням напруги."
            }),
            Object.freeze({
                value: "C",
                label: "Тому що час нагрівання не змінюється",
                feedback:
                    "Тривалість нагрівання суттєво скорочується за більшої потужності."
            }),
            Object.freeze({
                value: "D",
                label:
                    "Тому що в кожному досліді вода отримує приблизно однакову кількість теплоти",
                feedback:
                    "За однакового об’єму води та однакової зміни температури потрібна близька кількість теплоти, а відмінності пояснюються режимом і втратами."
            })
        ])
    })
]);

function renderQuestion(question, number, selectedAnswer) {
    const options = question.options
        .map((option) => `
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
        `)
        .join("");

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
    namespace = "lab05"
} = {}) {
    const section = root.querySelector("#questions");

    if (!section || section.dataset.quizInitialized === "true") {
        return;
    }

    const elements = {
        lockOverlay: section.querySelector("#quiz-lock-overlay"),
        interactiveArea: section.querySelector("#quiz-interactive-area"),
        form: section.querySelector("#quiz-form"),
        list: section.querySelector("#quiz-list"),
        result: section.querySelector("#quiz-result"),
        resetButton: section.querySelector("#reset-quiz"),
        answeredCount: section.querySelector("#quiz-answered-count"),
        progressTrack: section.querySelector(".quiz-progress-track"),
        progressBar: section.querySelector("#quiz-progress-bar")
    };

    if (Object.values(elements).some((element) => !element)) {
        console.warn("Не знайдено елементи контрольного тесту ЛР5.");
        return;
    }

    section.dataset.quizInitialized = "true";

    const analysisStorage = createStorage(
        LAB05_ANALYSIS_STORAGE_KEY
    );
    const quizStorage = createStorage(
        LAB05_QUIZ_STORAGE_KEY
    );

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

    function createEmptyState(signature) {
        return {
            answers: {},
            score: null,
            passed: false,
            checkedAt: null,
            analysisSignature: signature
        };
    }

    function readState(signature) {
        const stored = quizStorage.get("progress", {});

        if (
            !stored ||
            typeof stored !== "object" ||
            stored.analysisSignature !== signature
        ) {
            return createEmptyState(signature);
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
            checkedAt:
                typeof stored.checkedAt === "string"
                    ? stored.checkedAt
                    : null,
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
        elements.list.innerHTML = QUESTIONS
            .map((question, index) =>
                renderQuestion(
                    question,
                    index + 1,
                    state.answers[question.id]
                )
            )
            .join("");
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
        elements.list
            .querySelectorAll(".quiz-question")
            .forEach((questionElement) => {
                questionElement.classList.remove(
                    "is-correct",
                    "is-incorrect"
                );

                const feedback = questionElement.querySelector(
                    ".quiz-feedback"
                );

                feedback.hidden = true;
                feedback.textContent = "";
            });
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
                            answers: state.answers,
                            analysisSignature
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
            analysisSignature = "";
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
                `Надано відповідей: ${answered} із ${QUESTIONS.length}. ` +
                "Заповніть усі питання.",
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
            !window.confirm(
                "Очистити всі відповіді та почати тест заново?"
            )
        ) {
            return;
        }

        const wasPassed = state.passed;

        state = createEmptyState(analysisSignature);
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