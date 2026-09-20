async function loadSection(
    filePath,
    cacheMode = "no-store"
) {
    const response = await fetch(
        filePath,
        {
            cache: cacheMode
        }
    );

    if (!response.ok) {
        throw new Error(
            `Не вдалося завантажити файл: ${filePath}`
        );
    }

    return response.text();
}

function showLoadingError(
    container,
    error
) {
    console.error(
        "Помилка завантаження лабораторної роботи:",
        error
    );

    container.innerHTML = `
        <div
            class="error-panel"
            role="alert"
        >
            <strong>
                Помилка завантаження матеріалів
            </strong>

            <p>
                Перевірте структуру папки sections і запустіть
                сторінку через локальний HTTP-сервер.
            </p>
        </div>
    `;
}

export async function loadLaboratorySections({
    root = document,
    containerSelector = "#sections-root",
    sectionFiles = [],
    cacheMode = "no-store"
} = {}) {
    const container = root.querySelector(
        containerSelector
    );

    if (!container) {
        throw new Error(
            `Не знайдено контейнер ${containerSelector}.`
        );
    }

    if (
        !Array.isArray(sectionFiles) ||
        sectionFiles.length === 0
    ) {
        throw new Error(
            "Не вказано файли розділів лабораторної роботи."
        );
    }

    container.setAttribute(
        "aria-busy",
        "true"
    );

    try {
        const sectionContent = await Promise.all(
            sectionFiles.map(
                (filePath) =>
                    loadSection(
                        filePath,
                        cacheMode
                    )
            )
        );

        container.innerHTML =
            sectionContent.join("");

        return container;
    } catch (error) {
        showLoadingError(
            container,
            error
        );

        throw error;
    } finally {
        container.removeAttribute(
            "aria-busy"
        );
    }
}

export function initializeLaboratoryNavigation({
    root = document,
    sectionSelector = ".content-section[id]",
    linkSelector = ".navigation-link",
    activeClass = "is-active"
} = {}) {
    const sections = Array.from(
        root.querySelectorAll(
            sectionSelector
        )
    );

    const navigationLinks = Array.from(
        root.querySelectorAll(
            linkSelector
        )
    );

    if (
        sections.length === 0 ||
        navigationLinks.length === 0
    ) {
        return null;
    }

    function setActiveSection(
        sectionId
    ) {
        navigationLinks.forEach(
            (link) => {
                const isCurrent =
                    link.getAttribute("href") ===
                    `#${sectionId}`;

                link.classList.toggle(
                    activeClass,
                    isCurrent
                );

                if (isCurrent) {
                    link.setAttribute(
                        "aria-current",
                        "location"
                    );
                } else {
                    link.removeAttribute(
                        "aria-current"
                    );
                }
            }
        );
    }

    const observer = new IntersectionObserver(
        (entries) => {
            const visibleEntries = entries
                .filter(
                    (entry) =>
                        entry.isIntersecting
                )
                .sort(
                    (first, second) =>
                        first.boundingClientRect.top -
                        second.boundingClientRect.top
                );

            const currentEntry =
                visibleEntries[0];

            if (!currentEntry) {
                return;
            }

            setActiveSection(
                currentEntry.target.id
            );
        },
        {
            rootMargin:
                "-20% 0px -65% 0px",

            threshold: [
                0,
                0.1,
                0.25,
                0.5
            ]
        }
    );

    sections.forEach(
        (section) => {
            observer.observe(
                section
            );
        }
    );

    return observer;
}

export async function initializeLaboratoryShell({
    root = document,
    sectionFiles = [],
    initializeModules
} = {}) {
    const container =
        await loadLaboratorySections({
            root,
            sectionFiles
        });

    const navigationObserver =
        initializeLaboratoryNavigation({
            root
        });

    if (
        typeof initializeModules ===
        "function"
    ) {
        await initializeModules({
            root,
            container
        });
    }

    return {
        container,
        navigationObserver
    };
}