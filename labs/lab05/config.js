import {
    createLaboratoryEventNames
} from "../../common/js/lab-events.js";

export const LAB05_CONFIG = Object.freeze({
    id: "lab05",

    namespace: "lab05",

    number: 5,

    configVersion: 1,

    title:
        "Дослідження параметрів роботи електродного нагрівача",

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

    variants: Object.freeze({
        count: 30,
        minimum: 1,
        maximum: 30
    }),

    duration: Object.freeze({
        targetMinutes: 45
    }),

    experiment: Object.freeze({
        heaterCount: 2,

        voltageLevels: Object.freeze([
            100,
            150,
            200
        ]),

        requiredRuns: 6
    }),

    quiz: Object.freeze({
        questionCount: 8,
        passingScore: 6
    })
});

export const LAB05_EVENTS =
    createLaboratoryEventNames(
        LAB05_CONFIG.namespace
    );