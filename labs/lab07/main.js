import {
    initializeLaboratoryApp
} from "../../common/js/lab-bootstrap.js";

import {
    LAB07_CONFIG
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

initializeLaboratoryApp({
    root: document,
    config: LAB07_CONFIG,
    modules: [
        initializeSafetyModule,
        initializeStand,
        initializeExperiment,
        initializeCalculations,
        initializeAnalysis,
        initializeQuiz,
        initializeReport
    ]
}).catch((error) => {
    console.error("Не вдалося ініціалізувати ЛР7:", error);
});
