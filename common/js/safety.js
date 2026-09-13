import { createStorage } from "./storage.js";

export function initializeSafetyModule({
    root = document,
    namespace = "laboratory"
} = {}) {
    const section = root.querySelector("#safety");

    if (!section || section.dataset.initialized === "true") {
        return;
    }

    const form = section.querySelector("#safety-admission-form");
    const checklistInputs = Array.from(
        section.querySelectorAll("[data-safety-check]")
    );
    const questionBlocks = Array.from(
        section.querySelectorAll("[data-safety-question]")
    );
    const submitButton = section.querySelector(
        "#safety-confirm-button"
    );
    const resetButton = section.querySelector(
        "#safety-reset-button"
    );
    const statusElement = section.querySelector(
        "#safety-status"
    );

    if (
        !form ||
        !submitButton ||
        !resetButton ||
        !statusElement
    ) {
        console.warn(
            "Не знайдено елементи модуля техніки безпеки."
        );

        return;
    }

    section.dataset.initialized = "true";

    const storage = createStorage(`${namespace}:safety`);
    const savedProgress = storage.get("progress", {
        checks: {},
        answers: {},
        passed: false
    });

    function getSelectedAnswer(questionBlock) {
        const checkedInput = questionBlock.querySelector(
            'input[type="radio"]:checked'
        );

        return checkedInput ? checkedInput.value : null;
    }

    function collectProgress() {
        const checks = {};
        const answers = {};

        checklistInputs.forEach((input) => {
            checks[input.id] = input.checked;
        });

        questionBlocks.forEach((questionBlock) => {
            const questionName =
                questionBlock.dataset.safetyQuestion;

            answers[questionName] =
                getSelectedAnswer(questionBlock);
        });

        return {
            checks,
            answers,
            passed:
                section.dataset.safetyPassed === "true"
        };
    }

    function saveProgress() {
        storage.set("progress", collectProgress());
    }

    function restoreProgress() {
        checklistInputs.forEach((input) => {
            input.checked =
                savedProgress.checks?.[input.id] === true;
        });

        questionBlocks.forEach((questionBlock) => {
            const questionName =
                questionBlock.dataset.safetyQuestion;
            const savedAnswer =
                savedProgress.answers?.[questionName];

            if (!savedAnswer) {
                return;
            }

            const input = questionBlock.querySelector(
                `input[value="${savedAnswer}"]`
            );

            if (input) {
                input.checked = true;
            }
        });
    }

    function allChecklistItemsSelected() {
        return checklistInputs.every(
            (input) => input.checked
        );
    }

    function allQuestionsAnswered() {
        return questionBlocks.every(
            (questionBlock) =>
                getSelectedAnswer(questionBlock) !== null
        );
    }

    function clearQuestionStates() {
        questionBlocks.forEach((questionBlock) => {
            questionBlock.classList.remove(
                "is-correct",
                "is-incorrect"
            );
        });
    }

    function showStatus(message, type = "neutral") {
        statusElement.textContent = message;
        statusElement.className =
            `safety-status safety-status-${type}`;
    }

    function setInputsDisabled(disabled) {
        form.querySelectorAll("input").forEach((input) => {
            input.disabled = disabled;
        });
    }

    function updateReadiness() {
        const ready =
            allChecklistItemsSelected() &&
            allQuestionsAnswered();

        submitButton.disabled = !ready;

        if (!ready) {
            showStatus(
                "Позначте всі пункти та дайте відповіді на три запитання."
            );
        } else {
            showStatus(
                "Усі поля заповнено. Можна перевірити відповіді.",
                "ready"
            );
        }
    }

    function markPassed(shouldSave = true) {
        section.dataset.safetyPassed = "true";
        section.classList.add("safety-passed");

        setInputsDisabled(true);

        submitButton.disabled = true;
        submitButton.textContent = "Допуск підтверджено";

        resetButton.hidden = false;

        showStatus(
            "Перевірку пройдено. Допуск до віртуального стенда підтверджено.",
            "success"
        );

        if (shouldSave) {
            saveProgress();
        }

        document.dispatchEvent(
            new CustomEvent("laboratory:safety-passed", {
                detail: {
                    namespace
                }
            })
        );
    }

    function resetModule() {
        setInputsDisabled(false);
        form.reset();

        section.dataset.safetyPassed = "false";
        section.classList.remove("safety-passed");

        clearQuestionStates();

        submitButton.textContent = "Перевірити та підтвердити";
        resetButton.hidden = true;

        storage.remove("progress");
        document.dispatchEvent(
            new CustomEvent("laboratory:safety-reset", {
                detail: {
                    namespace
                }
            })
        );
        updateReadiness();
    }

    form.addEventListener("change", () => {
        clearQuestionStates();
        section.dataset.safetyPassed = "false";

        updateReadiness();
        saveProgress();
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        let correctAnswerCount = 0;

        questionBlocks.forEach((questionBlock) => {
            const selectedAnswer =
                getSelectedAnswer(questionBlock);
            const correctAnswer =
                questionBlock.dataset.correctAnswer;
            const isCorrect =
                selectedAnswer === correctAnswer;

            questionBlock.classList.toggle(
                "is-correct",
                isCorrect
            );

            questionBlock.classList.toggle(
                "is-incorrect",
                !isCorrect
            );

            if (isCorrect) {
                correctAnswerCount += 1;
            }
        });

        if (
            correctAnswerCount ===
            questionBlocks.length
        ) {
            markPassed();
            return;
        }

        showStatus(
            `Правильних відповідей: ${correctAnswerCount} із ${questionBlocks.length}. Перегляньте правила та повторіть спробу.`,
            "error"
        );

        saveProgress();
    });

    resetButton.addEventListener("click", resetModule);

    restoreProgress();

    if (savedProgress.passed === true) {
        markPassed(false);
    } else {
        updateReadiness();
    }
}