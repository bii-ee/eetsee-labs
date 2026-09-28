const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

export function createSvgElement(name, attributes = {}) {
    const element = document.createElementNS(SVG_NAMESPACE, name);

    Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, String(value));
    });

    return element;
}
