import { Svg } from "./Svg"
import { INK, state, hue } from "./colors"

/**
 * a vertical stack, bottom item first: items = ["a", "b", "c"] draws c on top.
 *   states    { index: state }
 *   incoming  { v, s, label } an item beside the stack, e.g. { v: "5", label: "push" }
 *   popped    list of values that just came off, shown faded to the right
 *   title     caption under the stack
 */
export function StackViz({ items, states = {}, incoming, popped = [], title = "stack", width: boxW = 76, slots }) {
    const h = 34
    const gap = 4
    const n = Math.max(slots || items.length, items.length, 1)
    const pad = 14
    const sideW = incoming || popped.length ? 120 : 0
    const width = pad * 2 + boxW + 20 + sideW + 40
    const bodyH = n * (h + gap) + 10
    const height = pad + bodyH + 30
    const left = pad + 40
    const bottom = pad + bodyH

    return (
        <Svg width={width} height={height} label={title}>
            {/* the container: open at the top, like a cup */}
            <path
                d={`M ${left - 6} ${pad} V ${bottom} H ${left + boxW + 6} V ${pad}`}
                fill="none" stroke={INK.line} strokeWidth={1.5}
            />
            {items.map((v, i) => {
                const s = state(states[i])
                const y = bottom - 5 - (i + 1) * (h + gap) + gap
                return (
                    <g key={i}>
                        <rect x={left} y={y} width={boxW} height={h} rx={6} fill={s.fill} stroke={s.stroke} strokeWidth={1.5} />
                        <text x={left + boxW / 2} y={y + h / 2} fontSize={13} fill={s.text} textAnchor="middle" dominantBaseline="central">{v}</text>
                        {i === items.length - 1 && (
                            <text x={left - 12} y={y + h / 2} fontSize={10.5} fill={INK.text3} textAnchor="end" dominantBaseline="central">top</text>
                        )}
                    </g>
                )
            })}
            {incoming && (() => {
                const s = state(incoming.s || "active")
                const y = pad + 4
                const x = left + boxW + 36
                return (
                    <g>
                        <rect x={x} y={y} width={boxW} height={h} rx={6} fill={s.fill} stroke={s.stroke} strokeWidth={1.5} />
                        <text x={x + boxW / 2} y={y + h / 2} fontSize={13} fill={s.text} textAnchor="middle" dominantBaseline="central">{incoming.v}</text>
                        <text x={x + boxW / 2} y={y + h + 14} fontSize={10.5} fill={s.stroke} textAnchor="middle">{incoming.label || "push"}</text>
                    </g>
                )
            })()}
            {popped.length > 0 && (
                <g>
                    {popped.map((v, k) => {
                        const x = left + boxW + 36
                        const y = pad + (incoming ? 64 : 4) + k * (h + gap)
                        const s = state("bad")
                        return (
                            <g key={k} opacity={0.85}>
                                <rect x={x} y={y} width={boxW} height={h} rx={6} fill={s.fill} stroke={s.stroke} strokeWidth={1.25} strokeDasharray="4 3" />
                                <text x={x + boxW / 2} y={y + h / 2} fontSize={13} fill={s.text} textAnchor="middle" dominantBaseline="central">{v}</text>
                            </g>
                        )
                    })}
                    <text x={left + boxW + 36 + boxW / 2} y={pad + (incoming ? 64 : 4) + popped.length * (h + gap) + 10} fontSize={10.5} fill={hue("red")} textAnchor="middle">popped</text>
                </g>
            )}
            <text x={left + boxW / 2} y={bottom + 18} fontSize={11} fill={INK.text3} textAnchor="middle">{title}</text>
        </Svg>
    )
}
