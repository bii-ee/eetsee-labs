const SHARED_EVENT_NAMES = Object.freeze({
    safetyPassed:
        "laboratory:safety-passed",

    safetyReset:
        "laboratory:safety-reset",

    standReady:
        "laboratory:stand-ready",

    standReset:
        "laboratory:stand-reset"
});

const SCOPED_EVENT_SUFFIXES = Object.freeze({
    experimentUpdated:
        "experiment-updated",

    experimentCompleted:
        "experiment-completed",

    experimentReset:
        "experiment-reset",

    calculationsCompleted:
        "calculations-completed",

    calculationsInvalidated:
        "calculations-invalidated",

    analysisCompleted:
        "analysis-completed",

    analysisInvalidated:
        "analysis-invalidated",

    quizCompleted:
        "quiz-completed",

    quizInvalidated:
        "quiz-invalidated"
});

export function createLaboratoryEventNames(
    namespace
) {
    if (
        typeof namespace !== "string" ||
        namespace.trim() === ""
    ) {
        throw new Error(
            "Необхідно вказати простір назв лабораторної роботи."
        );
    }

    const normalizedNamespace =
        namespace.trim();

    const scopedEventNames =
        Object.fromEntries(
            Object.entries(
                SCOPED_EVENT_SUFFIXES
            ).map(
                ([key, suffix]) => [
                    key,
                    `${normalizedNamespace}:${suffix}`
                ]
            )
        );

    return Object.freeze({
        ...SHARED_EVENT_NAMES,
        ...scopedEventNames
    });
}