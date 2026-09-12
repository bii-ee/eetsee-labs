const STORAGE_PREFIX = "eetsee";
const memoryStorage = new Map();

function isLocalStorageAvailable() {
    try {
        const testKey = `${STORAGE_PREFIX}:storage-test`;

        window.localStorage.setItem(testKey, "1");
        window.localStorage.removeItem(testKey);

        return true;
    } catch {
        return false;
    }
}

const hasLocalStorage = isLocalStorageAvailable();

function createFullKey(namespace, key) {
    return `${STORAGE_PREFIX}:${namespace}:${key}`;
}

export function createStorage(namespace) {
    if (!namespace || typeof namespace !== "string") {
        throw new Error("Для сховища необхідно вказати назву простору.");
    }

    return {
        get(key, fallbackValue = null) {
            const fullKey = createFullKey(namespace, key);

            try {
                const storedValue = hasLocalStorage
                    ? window.localStorage.getItem(fullKey)
                    : memoryStorage.get(fullKey);

                if (storedValue === null || storedValue === undefined) {
                    return fallbackValue;
                }

                return JSON.parse(storedValue);
            } catch (error) {
                console.warn(
                    `Не вдалося прочитати значення зі сховища: ${fullKey}`,
                    error
                );

                return fallbackValue;
            }
        },

        set(key, value) {
            const fullKey = createFullKey(namespace, key);

            try {
                const serializedValue = JSON.stringify(value);

                if (hasLocalStorage) {
                    window.localStorage.setItem(
                        fullKey,
                        serializedValue
                    );
                } else {
                    memoryStorage.set(fullKey, serializedValue);
                }

                return true;
            } catch (error) {
                console.warn(
                    `Не вдалося зберегти значення: ${fullKey}`,
                    error
                );

                return false;
            }
        },

        remove(key) {
            const fullKey = createFullKey(namespace, key);

            if (hasLocalStorage) {
                window.localStorage.removeItem(fullKey);
            } else {
                memoryStorage.delete(fullKey);
            }
        },

        clear() {
            const namespacePrefix =
                `${STORAGE_PREFIX}:${namespace}:`;

            if (hasLocalStorage) {
                const keysToRemove = [];

                for (
                    let index = 0;
                    index < window.localStorage.length;
                    index += 1
                ) {
                    const key = window.localStorage.key(index);

                    if (
                        key &&
                        key.startsWith(namespacePrefix)
                    ) {
                        keysToRemove.push(key);
                    }
                }

                keysToRemove.forEach((key) => {
                    window.localStorage.removeItem(key);
                });
            } else {
                for (const key of memoryStorage.keys()) {
                    if (key.startsWith(namespacePrefix)) {
                        memoryStorage.delete(key);
                    }
                }
            }
        }
    };
}