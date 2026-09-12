const ANALYSIS_COMPLETED_KEY =
    "eetsee.lab06.analysis.completed.v1";

const QUIZ_STORAGE_KEY =
    "eetsee.lab06.quiz.v1";

const QUIZ_COMPLETED_KEY =
    "eetsee.lab06.quiz.completed.v1";

const PASSING_SCORE = 6;

const QUESTIONS = [
    {
        id: "q1",
        text: "Що характеризує непряме електричне нагрівання?",
        hint: "Зверніть увагу, де спочатку виділяється теплота.",
        correct: "B",
        options: [
            {
                value: "A",
                label: "Струм проходить безпосередньо через виріб",
                feedback:
                    "Це ознака прямого електричного нагрівання."
            },
            {
                value: "B",
                label:
                    "Теплота виділяється в нагрівальному елементі й передається виробу",
                feedback:
                    "За непрямого нагрівання теплота спочатку виділяється в нагрівачі."
            },
            {
                value: "C",
                label:
                    "Виріб нагрівається тільки сонячним випромінюванням",
                feedback:
                    "Такий процес не належить до електричного нагрівання печі опору."
            },
            {
                value: "D",
                label:
                    "Нагрівання відбувається без перетворення електричної енергії",
                feedback:
                    "У печі опору електрична енергія перетворюється на теплову."
            }
        ]
    },
    {
        id: "q2",
        text:
            "На які основні групи поділяють печі опору за режимом роботи?",
        hint:
            "Класифікація враховує характер переміщення та оброблення виробів.",
        correct: "C",
        options: [
            {
                value: "A",
                label: "Однофазні та трифазні",
                feedback:
                    "Це класифікація за системою живлення, а не за режимом роботи."
            },
            {
                value: "B",
                label: "Відкриті та закриті",
                feedback:
                    "Такий поділ не визначає режим роботи печі."
            },
            {
                value: "C",
                label: "Періодичної та безперервної дії",
                feedback:
                    "За режимом роботи печі поділяють на періодичні та безперервні."
            },
            {
                value: "D",
                label: "Активні та реактивні",
                feedback:
                    "Активність і реактивність характеризують електричні величини, а не режим печі."
            }
        ]
    },
    {
        id: "q3",
        text:
            "Які печі опору належать до високотемпературних?",
        hint:
            "Це найвищий температурний діапазон у наведеній класифікації.",
        correct: "D",
        options: [
            {
                value: "A",
                label: "До 300 °C",
                feedback:
                    "Ця температура належить до низькотемпературного діапазону."
            },
            {
                value: "B",
                label: "До 600-700 °C",
                feedback:
                    "До 600-700 °C працюють низькотемпературні печі."
            },
            {
                value: "C",
                label: "Від 700 до 1200 °C",
                feedback:
                    "Це середньотемпературний діапазон."
            },
            {
                value: "D",
                label: "Понад 1200-1250 °C",
                feedback:
                    "Печі з температурою понад 1200-1250 °C належать до високотемпературних."
            }
        ]
    },
    {
        id: "q4",
        text:
            "Чим визначаються вимоги до надійності електропостачання печі опору?",
        hint:
            "Враховують особливості обладнання та наслідки переривання процесу.",
        correct: "A",
        options: [
            {
                value: "A",
                label:
                    "Конструкцією печі та особливостями технологічного процесу",
                feedback:
                    "Надійність визначають з урахуванням конструкції печі й допустимості перерв у процесі."
            },
            {
                value: "B",
                label:
                    "Тільки номінальною напругою мережі",
                feedback:
                    "Номінальна напруга не визначає наслідки аварійного переривання технологічного процесу."
            },
            {
                value: "C",
                label:
                    "Тільки кількістю вимірювальних приладів",
                feedback:
                    "Кількість приладів не визначає категорію надійності електропостачання."
            },
            {
                value: "D",
                label:
                    "Виключно температурою приміщення",
                feedback:
                    "Температура приміщення не є основним критерієм надійності живлення печі."
            }
        ]
    },
    {
        id: "q5",
        text:
            "Чому необхідно регулювати потужність печі опору?",
        hint:
            "Пригадайте головний технологічний параметр нагрівального процесу.",
        correct: "B",
        options: [
            {
                value: "A",
                label:
                    "Щоб збільшувати частоту живильної мережі",
                feedback:
                    "Регулятор потужності не змінює частоту мережі."
            },
            {
                value: "B",
                label:
                    "Щоб підтримувати або програмно змінювати задану температуру",
                feedback:
                    "Плавне регулювання потужності забезпечує необхідний температурний режим."
            },
            {
                value: "C",
                label:
                    "Щоб повністю усунути активну потужність",
                feedback:
                    "Активна потужність потрібна для утворення теплоти."
            },
            {
                value: "D",
                label:
                    "Щоб вимкнути всі вимірювальні прилади",
                feedback:
                    "Вимірювальні прилади необхідні для контролю режиму установки."
            }
        ]
    },
    {
        id: "q6",
        text:
            "Який елемент установки є основною причиною появи вищих гармонік струму та напруги?",
        hint:
            "Цей елемент змінює момент відкривання силових напівпровідників.",
        correct: "C",
        options: [
            {
                value: "A",
                label: "Вольтметр PV1",
                feedback:
                    "Вольтметр вимірює напругу і не виконує фазового регулювання."
            },
            {
                value: "B",
                label: "Амперметр PA",
                feedback:
                    "Амперметр лише вимірює струм установки."
            },
            {
                value: "C",
                label:
                    "Тиристорний регулятор потужності",
                feedback:
                    "Фазове керування тиристорами спотворює форму струму та напруги."
            },
            {
                value: "D",
                label:
                    "Автоматичний вимикач QF",
                feedback:
                    "Автоматичний вимикач забезпечує комутацію та захист, а не фазове регулювання."
            }
        ]
    },
    {
        id: "q7",
        text:
            "Що відбувається зі збільшенням кута керування α?",
        hint:
            "Більша затримка відкривання скорочує провідний інтервал тиристора.",
        correct: "A",
        options: [
            {
                value: "A",
                label:
                    "Зменшуються напруга U₂ та потужність навантаження",
                feedback:
                    "Збільшення α скорочує провідний інтервал і зменшує діючу напругу навантаження."
            },
            {
                value: "B",
                label:
                    "Напруга U₂ та потужність навантаження збільшуються",
                feedback:
                    "За більшого α тиристори відкриваються пізніше, тому потужність не збільшується."
            },
            {
                value: "C",
                label:
                    "Змінюється тільки частота мережі",
                feedback:
                    "Частота мережі залишається сталою, змінюється форма та діюче значення напруги."
            },
            {
                value: "D",
                label:
                    "Усі електричні величини залишаються незмінними",
                feedback:
                    "Експеримент показує зменшення U₂, струму й потужності."
            }
        ]
    },
    {
        id: "q8",
        text:
            "Які засоби застосовують для вимірювання температури печей опору?",
        hint:
            "Потрібні прилади, які безпосередньо або безконтактно визначають температуру.",
        correct: "D",
        options: [
            {
                value: "A",
                label:
                    "Тільки амперметри та ватметри",
                feedback:
                    "Ці прилади вимірюють електричні величини, а не температуру."
            },
            {
                value: "B",
                label:
                    "Тільки лічильники електричної енергії",
                feedback:
                    "Лічильник визначає спожиту електроенергію, а не температуру печі."
            },
            {
                value: "C",
                label:
                    "Тільки вольтметри електромагнітної системи",
                feedback:
                    "Вольтметр вимірює напругу і не замінює температурний датчик."
            },
            {
                value: "D",
                label:
                    "Термопари, пірометри, терморезистори та контактні термометри",
                feedback:
                    "Ці засоби охоплюють контактні й безконтактні методи вимірювання температури."
            }
        ]
    }
];

function readQuizState() {
    try {
        const value = localStorage.getItem(
            QUIZ_STORAGE_KEY
        );

        return value
            ? JSON.parse(value)
            : { answers: {} };
    } catch (error) {
        console.warn(
            "Помилка читання результатів тесту.",
            error
        );

        return { answers: {} };
    }
}

function saveQuizState(state) {
    localStorage.setItem(
        QUIZ_STORAGE_KEY,
        JSON.stringify(state)
    );
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
                        ${
                            selectedAnswer === option.value
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
                <summary>Підказка</summary>
                <p>${question.hint}</p>
            </details>

            <p
                class="quiz-feedback"
                hidden
            ></p>
        </fieldset>
    `;
}

export function initializeQuiz() {
    const section =
        document.querySelector("#questions");

    if (!section) {
        return;
    }

    const readiness =
        section.querySelector("#quiz-readiness");

    const readinessTitle =
        section.querySelector(
            "#quiz-readiness-title"
        );

    const readinessText =
        section.querySelector(
            "#quiz-readiness-text"
        );

    const workspace =
        section.querySelector("#quiz-workspace");

    const form =
        section.querySelector("#quiz-form");

    const list =
        section.querySelector("#quiz-list");

    const result =
        section.querySelector("#quiz-result");

    const resetButton =
        section.querySelector("#reset-quiz");

    let state = readQuizState();

    if (
        !state.answers ||
        typeof state.answers !== "object"
    ) {
        state.answers = {};
    }

    function renderQuestions() {
        list.innerHTML = QUESTIONS
            .map((question, index) =>
                renderQuestion(
                    question,
                    index + 1,
                    state.answers[question.id]
                )
            )
            .join("");
    }

    function clearEvaluation() {
        list
            .querySelectorAll(".quiz-question")
            .forEach((questionElement) => {
                questionElement.classList.remove(
                    "is-correct",
                    "is-incorrect"
                );

                const feedback =
                    questionElement.querySelector(
                        ".quiz-feedback"
                    );

                feedback.hidden = true;
                feedback.textContent = "";
            });
    }

    function evaluateAnswers(
        saveResult = true
    ) {
        let score = 0;

        QUESTIONS.forEach((question) => {
            const selectedValue =
                state.answers[question.id];

            const selectedOption =
                question.options.find(
                    (option) =>
                        option.value === selectedValue
                );

            const correctOption =
                question.options.find(
                    (option) =>
                        option.value === question.correct
                );

            const questionElement =
                list.querySelector(
                    `[data-question-id="${question.id}"]`
                );

            const feedback =
                questionElement.querySelector(
                    ".quiz-feedback"
                );

            const isCorrect =
                selectedValue === question.correct;

            if (isCorrect) {
                score += 1;
            }

            questionElement.classList.toggle(
                "is-correct",
                isCorrect
            );

            questionElement.classList.toggle(
                "is-incorrect",
                !isCorrect
            );

            feedback.hidden = false;

            if (isCorrect) {
                feedback.textContent =
                    selectedOption.feedback;
            } else {
                feedback.textContent =
                    `${selectedOption.feedback} ` +
                    `Правильна відповідь: ` +
                    `${correctOption.label}.`;
            }
        });

        const passed =
            score >= PASSING_SCORE;

        result.dataset.type =
            passed ? "success" : "error";

        if (passed) {
            result.textContent =
                `Тест пройдено: ${score} із ` +
                `${QUESTIONS.length}. ` +
                `Лабораторну роботу завершено.`;

            localStorage.setItem(
                QUIZ_COMPLETED_KEY,
                "true"
            );
        } else {
            result.textContent =
                `Результат: ${score} із ` +
                `${QUESTIONS.length}. ` +
                `Для проходження потрібно ` +
                `щонайменше ${PASSING_SCORE} ` +
                `правильних відповідей.`;

            localStorage.removeItem(
                QUIZ_COMPLETED_KEY
            );
        }

        if (saveResult) {
            state.score = score;
            state.passed = passed;
            state.checkedAt =
                new Date().toISOString();

            saveQuizState(state);
        }
    }

    function renderReadiness() {
        const analysisCompleted =
            localStorage.getItem(
                ANALYSIS_COMPLETED_KEY
            ) === "true";

        readiness.classList.toggle(
            "is-ready",
            analysisCompleted
        );

        workspace.hidden =
            !analysisCompleted;

        if (analysisCompleted) {
            readinessTitle.textContent =
                "Можна переходити до тесту";

            readinessText.textContent =
                "Висновки збережено. " +
                "Дайте відповідь на всі " +
                "контрольні питання.";
        } else {
            readinessTitle.textContent =
                "Спочатку завершіть аналіз";

            readinessText.textContent =
                "Заповніть і збережіть три " +
                "висновки в розділі 9.";
        }
    }

    form.addEventListener(
        "change",
        (event) => {
            const target = event.target;

            if (
                !target.matches(
                    'input[type="radio"]'
                )
            ) {
                return;
            }

            state.answers[target.name] =
                target.value;

            delete state.score;
            delete state.passed;
            delete state.checkedAt;

            saveQuizState(state);

            localStorage.removeItem(
                QUIZ_COMPLETED_KEY
            );

            const questionElement =
                target.closest(
                    ".quiz-question"
                );

            questionElement.classList.remove(
                "is-correct",
                "is-incorrect"
            );

            const feedback =
                questionElement.querySelector(
                    ".quiz-feedback"
                );

            feedback.hidden = true;
            feedback.textContent = "";

            result.dataset.type = "default";
            result.textContent =
                "Відповідь змінено. " +
                "Після завершення перевірте тест.";
        }
    );

    form.addEventListener(
        "submit",
        (event) => {
            event.preventDefault();

            const answeredCount =
                QUESTIONS.filter(
                    (question) =>
                        Boolean(
                            state.answers[
                                question.id
                            ]
                        )
                ).length;

            if (
                answeredCount <
                QUESTIONS.length
            ) {
                result.dataset.type = "error";

                result.textContent =
                    `Дано відповідей: ` +
                    `${answeredCount} із ` +
                    `${QUESTIONS.length}. ` +
                    `Заповніть усі питання.`;

                const unanswered =
                    QUESTIONS.find(
                        (question) =>
                            !state.answers[
                                question.id
                            ]
                    );

                const unansweredElement =
                    list.querySelector(
                        `[data-question-id="${unanswered.id}"]`
                    );

                unansweredElement.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

                return;
            }

            evaluateAnswers();
        }
    );

    resetButton.addEventListener(
        "click",
        () => {
            const shouldReset =
                window.confirm(
                    "Почати тест заново?"
                );

            if (!shouldReset) {
                return;
            }

            state = {
                answers: {}
            };

            localStorage.removeItem(
                QUIZ_STORAGE_KEY
            );

            localStorage.removeItem(
                QUIZ_COMPLETED_KEY
            );

            renderQuestions();
            clearEvaluation();

            result.dataset.type = "default";
            result.textContent =
                "Дайте відповідь на всі 8 запитань.";
        }
    );

    window.addEventListener(
        "lab06:analysis-completed",
        renderReadiness
    );

    window.addEventListener(
        "lab06:analysis-invalidated",
        renderReadiness
    );

    renderQuestions();
    renderReadiness();

    const allAnswersSaved =
        QUESTIONS.every(
            (question) =>
                Boolean(
                    state.answers[question.id]
                )
        );

    if (
        state.checkedAt &&
        allAnswersSaved
    ) {
        evaluateAnswers(false);
    }
}