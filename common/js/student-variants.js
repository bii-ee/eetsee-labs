export const STUDENT_VARIANT_COUNT = 30;

export function getStudentVariant(search = globalThis.location?.search ?? "") {
    const value = new URLSearchParams(search).get("variant");

    if (value === null) return 1;
    if (!/^(?:[1-9]|[12][0-9]|30)$/.test(value)) return 1;

    return Number(value);
}

export function variantStorageNamespace(namespace, variant = getStudentVariant()) {
    if (!Number.isInteger(variant) || variant < 1 || variant > STUDENT_VARIANT_COUNT) {
        throw new RangeError("Номер варіанта має бути від 1 до 30.");
    }

    return `${namespace}.variant-${String(variant).padStart(2, "0")}`;
}

export function selectStudentVariant(variant, location = globalThis.location) {
    if (!Number.isInteger(variant) || variant < 1 || variant > STUDENT_VARIANT_COUNT) {
        throw new RangeError("Номер варіанта має бути від 1 до 30.");
    }

    const url = new URL(location.href);
    url.searchParams.set("variant", String(variant));
    location.assign(url.href);
}
