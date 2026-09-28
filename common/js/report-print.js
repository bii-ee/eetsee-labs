export function createPrintCopy(reportDocument) {
    document.querySelector("#lab-print-root")?.remove();

    const printRoot = document.createElement("div");
    const reportCopy = reportDocument.cloneNode(true);

    printRoot.id = "lab-print-root";
    reportCopy.hidden = false;
    reportCopy.removeAttribute("hidden");
    printRoot.append(reportCopy);
    document.body.append(printRoot);

    return printRoot;
}
