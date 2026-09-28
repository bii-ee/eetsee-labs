import {
    createLaboratoryEventNames
} from "../../common/js/lab-events.js";

import {
    variantStorageNamespace
} from "../../common/js/student-variants.js";

export const LAB07_CONFIG = Object.freeze({
    id: "lab07",

    namespace: "lab07",

    number: 7,

    configVersion: 2,

    title:
        "Дослідження параметрів роботи побутових двоконфоркових електроплит із біметалевим терморезистором",

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
            "lab07:safety",

        stand:
            "lab07:stand",

        experiment:
            variantStorageNamespace("lab07:cyclic-experiment.v2"),

        calculations:
            variantStorageNamespace("lab07:calculations.v2"),

        analysis:
            variantStorageNamespace("lab07:analysis.v2"),

        quiz:
            variantStorageNamespace("lab07:quiz.v2"),

        report:
            variantStorageNamespace("lab07:report.v2")
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
        burnerCount: 2,

        modeCount: 3,

        cyclesPerMode: 3,

        requiredCycles: 9
    }),

    quiz: Object.freeze({
        questionCount: 8,
        passingScore: 6
    })
});

const BASE_LAB07_EVENTS =
    createLaboratoryEventNames(
        LAB07_CONFIG.namespace
    );

export const LAB07_EVENTS =
    Object.freeze({
        ...BASE_LAB07_EVENTS,

        experimentUpdated:
            "lab07:cyclic-experiment-updated",

        experimentCompleted:
            "lab07:cyclic-experiment-completed",

        experimentReset:
            "lab07:cyclic-experiment-reset"
    });
