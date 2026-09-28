export function renderStandProgress({
    visitedCount,
    totalCount,
    ready,
    label,
    progressText,
    progressPercent,
    progressTrack,
    progressBar,
    readyButton
}) {
    const percentage = Math.round((visitedCount / totalCount) * 100);

    progressText.textContent = `Переглянуто ${visitedCount} із ${totalCount} ${label}`;
    progressPercent.textContent = `${percentage}%`;
    progressBar.style.width = `${percentage}%`;
    progressTrack.setAttribute("aria-valuemax", String(totalCount));
    progressTrack.setAttribute("aria-valuenow", String(visitedCount));
    readyButton.disabled = visitedCount !== totalCount || ready;
    readyButton.textContent = ready
        ? "Готовність підтверджено"
        : "Підтвердити готовність стенда";
}
