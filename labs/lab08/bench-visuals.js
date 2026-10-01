// Візуальні елементи ЛР8. Усі покази надходять із simulation.js.
const svg = (viewBox, name, content) =>
    `<svg class="bench-svg" xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="${name}">${content}</svg>`;

function source() {
    return svg("0 0 160 150", "Мережа 220 В, 50 Гц", `
        <rect x="8" y="8" width="144" height="132" rx="12" fill="#283c42" stroke="#87999b" stroke-width="3"/>
        <rect x="21" y="22" width="118" height="84" rx="7" fill="#e1e9df" stroke="#647b7e"/>
        <path d="M31 64q13-25 26 0t26 0t26 0t26 0" fill="none" stroke="#287488" stroke-width="4"/>
        <text x="80" y="94" fill="#294850" font-size="15" text-anchor="middle" font-family="sans-serif">220 В · 50 Гц</text>
        <circle cx="38" cy="122" r="7" fill="#9c5b49" stroke="#dce4e1"/>
        <circle cx="122" cy="122" r="7" fill="#37474b" stroke="#dce4e1"/>
    `);
}

function switchSvg({active = false} = {}) {
    return svg("0 0 150 150", "Мережевий вимикач", `
        <rect x="17" y="11" width="116" height="128" rx="12" fill="#26383e" stroke="#93a5a5" stroke-width="3"/>
        <rect x="41" y="26" width="68" height="95" rx="7" fill="#111e23" stroke="#61767a"/>
        <rect data-switch-rocker x="46" y="${active ? 34 : 75}" width="58" height="38" fill="${active ? '#3b725f' : '#516369'}" stroke="#c4d0cd" stroke-width="2"/>
        <path d="M53 78h44" stroke="#d7e1df" opacity=".65"/>
        <text x="75" y="61" fill="#eef6f0" font-family="sans-serif" font-size="16" text-anchor="middle">I</text>
        <text x="75" y="109" fill="#edf0ef" font-family="sans-serif" font-size="16" text-anchor="middle">O</text>
    `);
}

function latr() {
    return svg("0 0 170 160", "Поворотний регулятор ЛАТР", `
        <defs><radialGradient id="lab08-bench-latr-metal"><stop stop-color="#f0f3ed"/><stop offset="1" stop-color="#82989b"/></radialGradient>
        <radialGradient id="lab08-bench-latr-knob" cx=".36" cy=".25"><stop stop-color="#7a888b"/><stop offset="1" stop-color="#18292f"/></radialGradient></defs>
        <circle cx="85" cy="81" r="62" fill="url(#lab08-bench-latr-metal)" stroke="#637b80" stroke-width="2"/>
        <circle cx="85" cy="81" r="49" fill="#d6e1dd" stroke="#829498"/>
        <path d="M85 12v12M33 33l9 9M16 81h12M33 129l9-9M137 33l-9 9M154 81h-12M137 129l-9-9" stroke="#36535a" stroke-width="3"/>
        <g class="bench-latr-knob"><circle cx="85" cy="81" r="40" fill="url(#lab08-bench-latr-knob)" stroke="#13252c" stroke-width="2"/>
        <path d="M85 47v19" stroke="#e5efee" stroke-width="5" stroke-linecap="round"/></g>
        <circle cx="85" cy="81" r="9" fill="#44575b" stroke="#a5b3b4"/>
        <text x="85" y="155" text-anchor="middle" fill="#28434a" font-size="12" font-family="sans-serif">0–260 В</text>
    `);
}

function analyzer({live = false} = {}) {
    const value = (id, y, fallback) => `<text ${id ? `id="${id}"` : ""} x="275" y="${y}" text-anchor="end" fill="#263f32" font-size="22" font-family="monospace">${fallback}</text>`;
    return svg("0 0 340 265", "Аналізатор мережі DIRIS A20", `
        <defs><linearGradient id="lab08-bench-diris-case" x2=".8" y2="1"><stop stop-color="#5a666b"/><stop offset=".2" stop-color="#303b40"/><stop offset="1" stop-color="#172126"/></linearGradient></defs>
        <rect x="13" y="8" width="314" height="241" rx="10" fill="#182529"/>
        <rect x="17" y="5" width="306" height="238" rx="9" fill="url(#lab08-bench-diris-case)" stroke="#7a898e"/>
        <text x="37" y="34" font-size="14" letter-spacing="1.7" fill="#d8e2e1" font-family="sans-serif">DIRIS A20</text>
        <text x="304" y="34" font-size="9" text-anchor="end" fill="#97aeb2" font-family="sans-serif">МАКЕТ</text>
        <rect x="35" y="48" width="270" height="139" rx="4" fill="#111d20" stroke="#667a7d"/>
        <rect x="42" y="55" width="256" height="126" rx="2" fill="#abbba8"/>
        <path d="M44 57H296L44 114Z" fill="#fff" opacity=".13"/>
        <text x="58" y="73" font-size="10" fill="#263f32" font-family="sans-serif">ЕЛЕКТРИЧНІ ПАРАМЕТРИ</text>
        <g fill="#263f32" font-size="13" font-family="monospace"><text x="65" y="101">U</text><text x="65" y="133">I</text><text x="65" y="164">P</text></g>
        ${value(live ? "experiment-voltage-reading" : "", 103, "0 В")}
        ${value(live ? "experiment-current-reading" : "", 135, "0,0 А")}
        ${value(live ? "experiment-power-reading" : "", 166, "0,00 кВт")}
        ${[70,136,202,268].map(x => `<rect x="${x-20}" y="204" width="40" height="19" rx="4" fill="#728488" stroke="#111d21"/><path d="M${x-9} 212H${x+9}" stroke="#d4dfdc"/>`).join("")}
    `);
}

function transformer() {
    return svg("0 0 130 120", "Трансформатор струму TA", `
        <rect x="7" y="7" width="116" height="106" rx="10" fill="#25383e" stroke="#9aaba9" stroke-width="3"/>
        <circle cx="65" cy="61" r="35" fill="#c8d7d3" stroke="#708c8b" stroke-width="7"/>
        <circle cx="65" cy="61" r="17" fill="#fafbf8" stroke="#304e55" stroke-width="4"/>
        <path d="M65 27v68" stroke="#995c4b" stroke-width="6"/>
        <text x="112" y="22" text-anchor="end" fill="#dce9e5" font-size="13" font-family="sans-serif">TA</text>
    `);
}

function thermometer({live = false} = {}) {
    return svg("0 0 95 165", "Термометр води", `
        <rect x="39" y="8" width="18" height="123" rx="9" fill="#e5eeea" stroke="#789397" stroke-width="2"/>
        <rect x="45" y="17" width="6" height="105" rx="3" fill="#c4d3d0"/>
        <rect ${live ? 'id="bench-water-thermometer-fill"' : ""} x="45" y="102" width="6" height="20" rx="3" fill="#aa5441"/>
        <circle cx="48" cy="133" r="16" fill="#e5eeea" stroke="#789397" stroke-width="2"/>
        <circle cx="48" cy="133" r="10" fill="#aa5441"/>
        ${[26,41,56,71,86,101].map(y => `<path d="M57 ${y}h12" stroke="#69838a" stroke-width="2"/>`).join("")}
    `);
}

function scale() {
    return svg("0 0 160 150", "Електронні ваги для води", `
        <rect x="19" y="42" width="122" height="102" rx="11" fill="#d7e1de" stroke="#768e91" stroke-width="3"/>
        <path d="M32 43V27h96v16" fill="#ecf0e9" stroke="#708b8d" stroke-width="3"/>
        <rect x="39" y="65" width="82" height="48" rx="5" fill="#273c40"/>
        <rect x="45" y="72" width="70" height="33" rx="3" fill="#b5caae"/>
        <text x="80" y="96" text-anchor="middle" fill="#2b4939" font-size="19" font-family="monospace">0,500</text>
        <text x="116" y="130" text-anchor="end" fill="#3b5256" font-size="10" font-family="sans-serif">kg</text>
    `);
}

function stopwatch({live = false} = {}) {
    return svg("0 0 200 150", "Секундомір", `
        <defs><linearGradient id="lab08-bench-watch-case" x2=".9" y2="1"><stop stop-color="#5d7277"/><stop offset="1" stop-color="#1c333a"/></linearGradient></defs>
        <rect x="82" y="3" width="36" height="18" rx="4" fill="#859a9d" stroke="#435c60"/>
        <rect x="46" y="21" width="108" height="123" rx="25" fill="url(#lab08-bench-watch-case)" stroke="#9aadb3" stroke-width="3"/>
        <rect x="57" y="52" width="86" height="59" rx="6" fill="#a9beb4" stroke="#647c78" stroke-width="2"/>
        <text ${live ? 'id="experiment-time-reading"' : ""} x="100" y="89" text-anchor="middle" fill="#253e36" font-size="23" font-family="monospace">0,00</text>
        <circle cx="75" cy="125" r="6" fill="#889fa0"/><circle cx="125" cy="125" r="6" fill="#889fa0"/>
    `);
}

const visuals = {source, switch: switchSvg, latr, diris: analyzer, transformer, thermometer, scale, stopwatch};

export function mountBenchVisuals(section) {
    section.querySelectorAll("[data-bench-visual]").forEach((slot) => {
        const type = slot.dataset.benchVisual;
        const make = visuals[type];
        if (make) slot.innerHTML = make({live: section.id === "experiment"});
    });
}
