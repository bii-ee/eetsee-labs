import {
    createLaboratoryEventNames
} from "../../common/js/lab-events.js";

import {
    variantStorageNamespace
} from "../../common/js/student-variants.js";

export const LAB06_CONFIG = Object.freeze({
    id: "lab06",

    namespace: "lab06",

    number: 6,

    configVersion: 3,

    title:
        "Дослідження енергетичних характеристик печей опору з тиристорними джерелами живлення",

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
            "lab06:safety",

        stand:
            "lab06:stand",

        experiment:
            variantStorageNamespace("eetsee.lab06.experiment.v3"),

        calculationsDraft:
            variantStorageNamespace("eetsee.lab06.calculations.v3"),

        calculationsVerified:
            variantStorageNamespace("eetsee.lab06.calculations.verified.v3"),

        calculationsCompleted:
            variantStorageNamespace("eetsee.lab06.calculations.completed.v3"),

        analysis:
            variantStorageNamespace("eetsee.lab06.analysis.v3"),

        analysisCompleted:
            variantStorageNamespace("eetsee.lab06.analysis.completed.v3"),

        quiz:
            variantStorageNamespace("eetsee.lab06.quiz.v3"),

        quizCompleted:
            variantStorageNamespace("eetsee.lab06.quiz.completed.v3"),

        reportStudent:
            variantStorageNamespace("eetsee.lab06.report.student.v3")
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
        modeCount: 3,

        requiredRuns: 3,

        controlAngles: Object.freeze([
            0,
            60,
            90
        ])
    }),

    quiz: Object.freeze({
        questionCount: 8,
        passingScore: 6
    })
});

export const LAB06_EVENTS =
    createLaboratoryEventNames(
        LAB06_CONFIG.namespace
    );
