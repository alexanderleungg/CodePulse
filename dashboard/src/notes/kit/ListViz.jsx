import { Svg, Tag, ArrowDefs } from "./Svg"
import { useArrowBase, markerUrl } from "./arrows"
import { INK, state, hue } from "./colors"

/**
 * a singly linked list.
 *   nodes     [{ v, s }] or plain values
 *   links     per gap between node i and i+1: "right" (default), "left" (reversed), "none" (cut), or a state name for a colored right arrow
 *   pointers  [{ i, label, color }] labels under nodes, e.g. prev / curr / next. i = -1 or n means "null" slots
 *   cycleTo   index the last node points back to (draws a loop)
 *   nullEnd   draw "null" after the last node (default true)
 *   nullStart draw a "null" slot before the first node (for reversal diagrams)
 *   headToNull draw the head's arrow pointing left into that null (the head has been reversed)
 */
export function ListViz({ nodes, links = [], pointers = [], cycleTo, nullEnd = true, nullStart = false, headToNull = false, label = "linked list" }) {
    const items = nodes.map(n => (typeof n === "object" ? n : { v: n }))
    const W = 52
    const H = 36
    const GAP = 40
    const pad = 16
    const offset = nullStart ? 1 : 0
    const slots = items.length + offset + (nullEnd ? 1 : 0)
    const x = i => pad + (i + offset) * (W + GAP)
    const top = pad + (cycleTo !== undefined ? 34 : 4)
    const stackAt = {}
    const placed = pointers.map(p => {
        const level = stackAt[p.i] || 0
        stackAt[p.i] = level + 1
        return { ...p, level }
    })
    const levels = placed.length ? Math.max(...placed.map(p => p.level)) + 1 : 0
    const width = pad * 2 + slots * W + (slots - 1) * GAP
    const height = top + H + 16 + levels * 20 + pad
    const colors = [INK.text3, hue("blue"), hue("green"), hue("red"), hue("yellow"), hue("violet")]
    const arrowColors = colors
    const base = useArrowBase()
    const marker = c => markerUrl(base, hue(c))

    const nullBox = i => (
        <text key={`null${i}`} x={x(i) + W / 2} y={top + H / 2} fontSize={12} fill={INK.faint} textAnchor="middle" dominantBaseline="central">null</text>
    )

    return (
        <Svg width={width} height={height} label={label}>
            <ArrowDefs base={base} colors={arrowColors} />
            {nullStart && nullBox(-1)}
            {items.map((n, i) => {
                const s = state(n.s)
                return (
                    <g key={i}>
                        <rect x={x(i)} y={top} width={W} height={H} rx={8} fill={n.s ? s.fill : "#141417"} stroke={s.stroke} strokeWidth={1.5} />
                        <text x={x(i) + W / 2} y={top + H / 2} fontSize={14} fill={s.text} textAnchor="middle" dominantBaseline="central">{n.v}</text>
                    </g>
                )
            })}
            {nullEnd && nullBox(items.length)}

            {/* arrows between neighbours (including to the trailing null) */}
            {Array.from({ length: items.length - (nullEnd ? 0 : 1) }, (_, i) => {
                const kind = links[i] || "right"
                if (kind === "none") return null
                const y = top + H / 2
                const a = x(i) + W + 3
                const b = x(i + 1) - 3
                const colored = !["right", "left"].includes(kind) ? state(kind).stroke : INK.text3
                if (kind === "left") {
                    const c = hue("green")
                    return <line key={i} x1={b} y1={y} x2={a + 2} y2={y} stroke={c} strokeWidth={2} markerEnd={marker(c)} />
                }
                if (i === items.length - 1 && cycleTo !== undefined) return null
                return <line key={i} x1={a} y1={y} x2={b - 2} y2={y} stroke={colored} strokeWidth={kind === "right" ? 1.5 : 2} markerEnd={marker(colored)} />
            })}
            {/* null before the head, for reversal: the head's arrow can point left into it */}
            {nullStart && headToNull && (() => {
                const y = top + H / 2
                const c = hue("green")
                return <line x1={x(0) - 3} y1={y} x2={x(-1) + W - 1} y2={y} stroke={c} strokeWidth={2} markerEnd={marker(c)} />
            })()}

            {cycleTo !== undefined && (() => {
                const last = items.length - 1
                const x1 = x(last) + W / 2
                const x2 = x(cycleTo) + W / 2
                const c = hue("yellow")
                return (
                    <g>
                        <path d={`M ${x1} ${top - 2} C ${x1} ${top - 34}, ${x2} ${top - 34}, ${x2} ${top - 4}`} fill="none" stroke={c} strokeWidth={2} markerEnd={marker(c)} />
                        <Tag x={(x1 + x2) / 2} y={top - 26} text="cycle" color="yellow" size={10} />
                    </g>
                )
            })()}

            {placed.map((p, k) => {
                const cx = x(p.i) + W / 2
                const y = top + H + 16 + p.level * 20
                return <text key={k} x={cx} y={y} fontSize={11.5} fill={hue(p.color || "blue")} textAnchor="middle" fontWeight={500}>{p.label}</text>
            })}
        </Svg>
    )
}
