// colors for the note diagrams. SVG attributes can't read CSS variables in every browser,
// so the diagram palette lives here as plain values that match the tokens in index.css

export const INK = {
    text: "#ededef",
    text2: "#a8a8b0",
    text3: "#7d7d86",
    faint: "#4a4a52",
    line: "#3a3a42",
    cell: "#17171a",
    cellBorder: "#2c2c31",
}

export const HUE = {
    blue: "#7cb4ff",
    green: "#22c55e",
    yellow: "#eab308",
    red: "#f87171",
    violet: "#a78bfa",
    orange: "#fb923c",
}

// every shape in a diagram has a "state" that picks its colors.
// fill is a see-through tint of the stroke so text stays readable on top
const tint = (hex, a) => {
    const n = parseInt(hex.slice(1), 16)
    return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

export const STATE = {
    default: { fill: INK.cell, stroke: INK.cellBorder, text: INK.text },
    active: { fill: tint(HUE.blue, 0.16), stroke: HUE.blue, text: "#dbeafe" },
    done: { fill: tint(HUE.green, 0.16), stroke: HUE.green, text: "#dcfce7" },
    window: { fill: tint(HUE.violet, 0.16), stroke: HUE.violet, text: "#ede9fe" },
    found: { fill: tint(HUE.yellow, 0.18), stroke: HUE.yellow, text: "#fef9c3" },
    bad: { fill: tint(HUE.red, 0.16), stroke: HUE.red, text: "#fee2e2" },
    extra: { fill: tint(HUE.orange, 0.16), stroke: HUE.orange, text: "#ffedd5" },
    muted: { fill: "transparent", stroke: "#26262b", text: INK.faint },
}

export const state = s => STATE[s] || STATE.default

// a named color for lines/labels: accepts "blue", "green", ... or any hex
export const hue = c => HUE[c] || c || INK.text2

// the figure background, drawn under see-through shapes so lines behind them are hidden
export const BACKING = "#0e0e10"

export const MONO = "'DM Mono', ui-monospace, Menlo, monospace"
export const SANS = "'DM Sans', system-ui, sans-serif"
