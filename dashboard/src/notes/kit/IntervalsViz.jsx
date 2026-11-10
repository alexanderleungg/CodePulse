import { Svg } from "./Svg"
import { INK, state } from "./colors"

/**
 * intervals on a number line, one per row.
 *   intervals  [{ s: 1, e: 3, state, label }]
 *   range      [min, max] of the axis
 *   marks      [{ x, label, color }] vertical dashed lines (e.g. "arrow shot here", "current end")
 */
export function IntervalsViz({ intervals, range, marks = [], unit = 36, label = "intervals" }) {
    const [lo, hi] = range
    const pad = 16
    const labelW = 70
    const rowH = 28
    const left = pad + labelW
    const width = left + (hi - lo) * unit + pad + 10
    const top = pad
    const axisY = top + intervals.length * rowH + 8
    const height = axisY + 30
    const X = v => left + (v - lo) * unit

    return (
        <Svg width={width} height={height} label={label}>
            {marks.map((m, k) => (
                <g key={`m${k}`}>
                    <line x1={X(m.x)} x2={X(m.x)} y1={top - 6} y2={axisY} stroke={state(m.s || "found").stroke} strokeDasharray="4 4" strokeWidth={1.25} />
                    {m.label && <text x={X(m.x)} y={axisY + 26} fontSize={10.5} fill={state(m.s || "found").stroke} textAnchor="middle">{m.label}</text>}
                </g>
            ))}
            {intervals.map((iv, r) => {
                const s = state(iv.state || "active")
                const y = top + r * rowH
                return (
                    <g key={r}>
                        <text x={pad} y={y + 10} fontSize={11} fill={iv.state === "muted" ? INK.faint : INK.text2} dominantBaseline="central">
                            {iv.label || `[${iv.s},${iv.e}]`}
                        </text>
                        <rect x={X(iv.s)} y={y + 2} width={Math.max((iv.e - iv.s) * unit, 4)} height={16} rx={8} fill={s.fill} stroke={s.stroke} strokeWidth={1.5} />
                    </g>
                )
            })}
            <line x1={X(lo)} x2={X(hi)} y1={axisY} y2={axisY} stroke={INK.line} />
            {Array.from({ length: hi - lo + 1 }, (_, k) => lo + k).map(v => (
                <g key={v}>
                    <line x1={X(v)} x2={X(v)} y1={axisY} y2={axisY + 4} stroke={INK.line} />
                    <text x={X(v)} y={axisY + 14} fontSize={9.5} fill={INK.faint} textAnchor="middle">{v}</text>
                </g>
            ))}
        </Svg>
    )
}
