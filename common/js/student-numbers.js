// Числа можна вводити з десятковою комою або крапкою.
export function parseStudentNumber(value) {
    const normalized = String(value ?? "")
        .trim()
        .replace(/\s+/g, "")
        .replace(",", ".");

    if (normalized === "") {
        return null;
    }

    const number = Number(normalized);
    return Number.isFinite(number) ? number : null;
}
