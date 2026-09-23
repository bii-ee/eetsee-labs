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

    const sectionIds = new Set(
        sections.map(
            (section) => section.id
        )
    );

    let frameId = null;
    let lockedSectionId = "";
    let unlockTimerId = null;

    function setActiveSection(sectionId) {
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

    function getHashSectionId() {
        const hash =
            window.location.hash.slice(1);

        if (!hash) {
            return "";
        }

        try {
            return decodeURIComponent(hash);
        } catch {
            return hash;
        }
    }

    function updateActiveSection() {
        frameId = null;

        if (lockedSectionId) {
            setActiveSection(
                lockedSectionId
            );

            return;
        }

        const reachedPageBottom =
            window.scrollY +
            window.innerHeight >=
            document.documentElement.scrollHeight - 4;

        if (reachedPageBottom) {
            setActiveSection(
                sections.at(-1).id
            );

            return;
        }

        const activationLine =
            Math.min(
                180,
                Math.max(
                    110,
                    window.innerHeight * 0.18
                )
            );

        let activeSection =
            sections[0];

        sections.forEach(
            (section) => {
                const sectionTop =
                    section
                        .getBoundingClientRect()
                        .top;

                if (
                    sectionTop <=
                    activationLine
                ) {
                    activeSection =
                        section;
                }
            }
        );

        setActiveSection(
            activeSection.id
        );
    }

    function scheduleUpdate() {
        if (frameId !== null) {
            return;
        }

        frameId =
            window.requestAnimationFrame(
                updateActiveSection
            );
    }

    function unlockNavigation() {
        lockedSectionId = "";
        scheduleUpdate();
    }

    function handleNavigationClick(event) {
        const link =
            event.currentTarget;

        const sectionId =
            link.hash.slice(1);

        if (!sectionIds.has(sectionId)) {
            return;
        }

        lockedSectionId =
            sectionId;

        setActiveSection(
            sectionId
        );

        window.clearTimeout(
            unlockTimerId
        );

        unlockTimerId =
            window.setTimeout(
                unlockNavigation,
                1000
            );
    }

    function handleHashChange() {
        const sectionId =
            getHashSectionId();

        if (sectionIds.has(sectionId)) {
            setActiveSection(
                sectionId
            );
        }

        scheduleUpdate();
    }

    navigationLinks.forEach(
        (link) => {
            link.addEventListener(
                "click",
                handleNavigationClick
            );
        }
    );

    window.addEventListener(
        "scroll",
        scheduleUpdate,
        {
            passive: true
        }
    );

    window.addEventListener(
        "resize",
        scheduleUpdate
    );

    window.addEventListener(
        "hashchange",
        handleHashChange
    );

    const resizeObserver =
        typeof ResizeObserver ===
        "function"
            ? new ResizeObserver(
                scheduleUpdate
            )
            : null;

    sections.forEach(
        (section) => {
            resizeObserver?.observe(
                section
            );
        }
    );

    const initialSectionId =
        getHashSectionId();

    if (sectionIds.has(initialSectionId)) {
        setActiveSection(
            initialSectionId
        );
    }

    scheduleUpdate();

    return {
        disconnect() {
            navigationLinks.forEach(
                (link) => {
                    link.removeEventListener(
                        "click",
                        handleNavigationClick
                    );
                }
            );

            window.removeEventListener(
                "scroll",
                scheduleUpdate
            );

            window.removeEventListener(
                "resize",
                scheduleUpdate
            );

            window.removeEventListener(
                "hashchange",
                handleHashChange
            );

            resizeObserver?.disconnect();

            window.clearTimeout(
                unlockTimerId
            );

            if (frameId !== null) {
                window.cancelAnimationFrame(
                    frameId
                );
            }
        }
    };
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