import {
    createLaboratoryEventNames
} from "../../common/js/lab-events.js";

export const LAB08_CONFIG = Object.freeze({
    id: "lab08",

    namespace: "lab08",

    number: 8,

    configVersion: 1,

    title:
        "Дослідження електричних та енергетичних характеристик індукційної плити «МЕРИДІАН ПП-3» у різних режимах роботи",

    sectionFiles: Object.freeze([
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
    ]),

    storage: Object.freeze({
        safety:
            "lab08:safety",

        stand:
            "lab08:stand",

        experiment:
            "lab08:experiment",

        calculations:
            "lab08:calculations",

        analysis:
            "lab08:analysis",

        quiz:
            "lab08:quiz",

        report:
            "lab08:report"
    }),

    variants: Object.freeze({
        count: 30,
        minimum: 1,
        maximum: 30
    }),

    duration: Object.freeze({
        targetMinutes: 45
    }),

    experiment: Object.freeze({
        cyclicRunCount: 6,

        comparativeTrialCount: 9,

        requiredOperations: 15
    }),

    quiz: Object.freeze({
        questionCount: 8,
        passingScore: 6
    })
});

export const LAB08_SCOPED_EVENTS =
    createLaboratoryEventNames(
        LAB08_CONFIG.namespace
    );

export const LAB08_EVENTS =
    Object.freeze({
        ...LAB08_SCOPED_EVENTS,

        experimentUpdated:
            "laboratory:experiment-progress",

        experimentCompleted:
            "laboratory:experiment-completed",

        experimentReset:
            "laboratory:experiment-reset",

        calculationsCompleted:
            "laboratory:calculations-completed",

        calculationsInvalidated:
            "laboratory:calculations-invalidated",

        analysisCompleted:
            "laboratory:analysis-completed",

        analysisInvalidated:
            "laboratory:analysis-invalidated",

        quizCompleted:
            "laboratory:quiz-completed",

        quizInvalidated:
            "laboratory:quiz-invalidated"
    });