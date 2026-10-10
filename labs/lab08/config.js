import {
    createLaboratoryEventNames
} from "../../common/js/lab-events.js";

import {
    variantStorageNamespace
} from "../../common/js/student-variants.js";

export const LAB08_CONFIG = Object.freeze({
    id: "lab08",

    namespace: "lab08",

    number: 8,

    configVersion: 4,

    title:
        "Дослідження параметрів роботи побутових індукційних плит",

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
            variantStorageNamespace("lab08:experiment.v4"),

        calculations:
            variantStorageNamespace("lab08:calculations.v4"),

        analysis:
            variantStorageNamespace("lab08:analysis.v4"),

        quiz:
            variantStorageNamespace("lab08:quiz.v4"),

        report:
            variantStorageNamespace("lab08:report.v4")
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
        initialCyclicRows: 6,
        maximumCyclicRunCount: 60,

        comparativeTrialCount: 9
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
