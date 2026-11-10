import { Svg } from "./Svg"
import { INK, state, hue } from "./colors"

const CELL = 44
const GAP = 6
const PAD = 12

/**
 * a row of array cells.
 *   items     values to show, e.g. [2, 7, 11, 15]
 *   states    { index: "active" | "done" | "window" | "found" | "bad" | "muted" }
 *   pointers  [{ i, label, color }]  arrows under a cell, e.g. { i: 0, label: "L", color: "blue" }
 *   ranges    [{ from, to, label, color }]  a bracket over cells from..to (inclusive)
 *   showIndex print the index under each cell (default true)
 *   title     small caption on the left, e.g. "nums"
 *   align     "left" to line several arrays up on their left edge
 */
export function ArrayViz({ items, states = {}, pointers = [], ranges = [], showIndex = true, title, cell = CELL, align }) {
    const n = items.length
    const titleW = title ? title.length * 7.5 + 16 : 0
    const x0 = PAD + titleW
    const rangeRows = ranges.length ? Math.max(...ranges.map(r => r.row || 0)) + 1 : 0
    const top = PAD + rangeRows * 24
    const cellX = i => x0 + i * (cell + GAP)

    // several pointers on one cell stack downward instead of overlapping
    const stackAt = {}
    const placed = pointers.map(p => {
        const level = stackAt[p.i] || 0
        stackAt[p.i] = level + 1
        return { ...p, level }
    })
    const maxLevel = placed.length ? Math.max(...placed.map(p => p.level)) + 1 : 0
    const indexY = top + cell + 14
    const pointerTop = top + cell + (showIndex ? 26 : 8)
    const height = pointerTop + maxLevel * 30 + PAD
    const width = x0 + n * cell + (n - 1) * GAP + PAD

    return (
        <Svg width={width} height={height} label={title ? `array ${title}` : "array"} align={align}>
            {title && (
                <text x={PAD} y={top + cell / 2} fontSize={12} fill={INK.text3} dominantBaseline="central">{title}</text>
            )}

            {ranges.map((r, k) => {
                const y = PAD + (rangeRows - 1 - (r.row || 0)) * 24 + 8
                const xa = cellX(r.from) + 4
                const xb = cellX(r.to) + cell - 4
                const c = hue(r.color || "violet")
                return (
                    <g key={k}>
                        <path d={`M ${xa} ${y + 8} V ${y} H ${xb} V ${y + 8}`} fill="none" stroke={c} strokeWidth={1.5} />
                        {r.label && (
                            <text x={(xa + xb) / 2} y={y - 5} fontSize={11} fill={c} textAnchor="middle">{r.label}</text>
                        )}
                    </g>
                )
            })}

            {items.map((v, i) => {
                const s = state(states[i])
                return (
                    <g key={i}>
                        <rect x={cellX(i)} y={top} width={cell} height={cell} rx={8} fill={s.fill} stroke={s.stroke} strokeWidth={1.5} />
                        <text x={cellX(i) + cell / 2} y={top + cell / 2} fontSize={String(v).length > 3 ? 12 : 15} fill={s.text} textAnchor="middle" dominantBaseline="central">
                            {v}
                        </text>
                        {showIndex && (
                            <text x={cellX(i) + cell / 2} y={indexY} fontSize={10} fill={INK.faint} textAnchor="middle" dominantBaseline="central">{i}</text>
                        )}
                    </g>
                )
            })}

            {placed.map((p, k) => {
                const cx = cellX(p.i) + cell / 2
                const y = pointerTop + p.level * 30
                const c = hue(p.color || "blue")
                return (
                    <g key={k}>
                        {p.level === 0 && <path d={`M ${cx} ${y} l -5 8 h 10 z`} fill={c} />}
                        <text x={cx} y={y + 18} fontSize={12} fill={c} textAnchor="middle" fontWeight={500}>{p.label}</text>
                    </g>
                )
            })}
        </Svg>
    )
}
