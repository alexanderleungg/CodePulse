import { Svg, Tag } from "./Svg"
import { INK, state, hue } from "./colors"

/**
 * values as vertical bars (heights, prices, histograms).
 *   values    [3, 1, 4, 1, 5]
 *   states    { index: state }
 *   water     optional [0, 2, 0, ...] extra fill drawn on top of each bar (trapping rain water)
 *   pointers  [{ i, label, color }] under the bars
 *   arrows    [{ from, to, color }] curved arrow from bar `from` to bar `to` ("next greater" links)
 *   band      { from, to, height, label } a see-through rectangle behind the bars (a container's water)
 *   labels    text above each bar instead of the value (e.g. draw heights offset but show real temperatures)
 */
export function BarsViz({ values, states = {}, water, pointers = [], arrows = [], band, labels, unit = 22, barW = 30, label = "bars" }) {
    const n = values.length
    const gap = 8
    const pad = 14
    const max = Math.max(...values.map((v, i) => v + (water ? water[i] : 0)), 1)
    const arrowSpace = arrows.length ? 40 : 10
    const top = pad + arrowSpace
    const base = top + max * unit
    const width = pad * 2 + n * barW + (n - 1) * gap
    const height = base + 18 + (pointers.length ? 22 : 0) + pad
    const x = i => pad + i * (barW + gap)

    return (
        <Svg width={width} height={height} label={label}>
            <line x1={pad - 4} x2={width - pad + 4} y1={base} y2={base} stroke={INK.line} />
            {values.map((v, i) => {
                const s = state(states[i] || "active")
                const h = v * unit
                const wv = water ? water[i] * unit : 0
                return (
                    <g key={i}>
                        {wv > 0 && (
                            <rect x={x(i)} y={base - h - wv} width={barW} height={wv} fill="rgba(124,180,255,0.28)" stroke={hue("blue")} strokeDasharray="3 3" strokeWidth={1} />
                        )}
                        <rect x={x(i)} y={base - h} width={barW} height={Math.max(h, 1)} rx={4} fill={states[i] ? s.fill : "#1f1f24"} stroke={states[i] ? s.stroke : "#34343b"} strokeWidth={1.25} />
                        <text x={x(i) + barW / 2} y={base - h - wv - 8} fontSize={11} fill={states[i] ? s.stroke : INK.text2} textAnchor="middle">{labels ? labels[i] : v}</text>
                        <text x={x(i) + barW / 2} y={base + 12} fontSize={9.5} fill={INK.faint} textAnchor="middle">{i}</text>
                    </g>
                )
            })}
            {/* drawn after the bars: see-through, so the bars inside still show */}
            {band && (
                <g>
                    <rect
                        x={x(band.from) + barW} y={base - band.height * unit}
                        width={x(band.to) - x(band.from) - barW} height={band.height * unit}
                        fill="rgba(124,180,255,0.18)" stroke={hue("blue")} strokeDasharray="4 4" strokeWidth={1}
                    />
                    {band.label && (
                        <Tag x={(x(band.from) + x(band.to) + barW) / 2} y={base - band.height * unit / 2} text={band.label} color="blue" />
                    )}
                </g>
            )}
            {arrows.map((a, k) => {
                const x1 = x(a.from) + barW / 2
                const x2 = x(a.to) + barW / 2
                const y1 = base - values[a.from] * unit - 20
                const y2 = base - values[a.to] * unit - 20
                const peak = Math.min(y1, y2) - 22
                const c = hue(a.color || "green")
                return (
                    <g key={k}>
                        <path d={`M ${x1} ${y1} C ${x1} ${peak}, ${x2} ${peak}, ${x2} ${y2}`} fill="none" stroke={c} strokeWidth={1.75} />
                        <circle cx={x2} cy={y2} r={3} fill={c} />
                    </g>
                )
            })}
            {pointers.map((p, k) => (
                <text key={k} x={x(p.i) + barW / 2} y={base + 30} fontSize={11.5} fill={hue(p.color || "blue")} textAnchor="middle" fontWeight={500}>{p.label}</text>
            ))}
        </Svg>
    )
}
