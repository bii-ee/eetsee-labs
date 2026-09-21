import {
    initializeLaboratoryShell
} from "../../common/js/lab-shell.js";

import {
    LAB06_CONFIG
} from "./config.js";

import {
    initializeSafetyModule
} from "../../common/js/safety.js";

import {
    initializeStand
} from "./stand.js";

import {
    initializeExperiment
} from "./simulation.js";

import {
    initializeCalculations
} from "./calculations.js";

import {
    initializeAnalysis
} from "./charts.js";

import {
    initializeQuiz
} from "./quiz.js";

import {
    initializeReport
} from "./report.js";

function initializeLaboratoryModules({
    root = document
} = {}) {
    const options = {
        root,
        namespace:
            LAB06_CONFIG.namespace
    };

    initializeSafetyModule(
        options
    );

    initializeStand(
        options
    );

    initializeExperiment(
        options
    );

    initializeCalculations(
        options
    );

    initializeAnalysis(
        options
    );

    initializeQuiz(
        options
    );

    initializeReport(
        options
    );
}

initializeLaboratoryShell({
    root: document,

    sectionFiles:
        LAB06_CONFIG.sectionFiles,

    initializeModules:
        initializeLaboratoryModules
}).catch(
    (error) => {
        console.error(
            "Не вдалося ініціалізувати ЛР6:",
            error
        );
    }
);