import { Svg, Tag, ArrowDefs } from "./Svg"
import { useArrowBase, markerUrl } from "./arrows"
import { INK, BACKING, state, hue } from "./colors"

/**
 * a graph drawn from explicit coordinates (in "grid units", scaled by `unit`).
 *   nodes  [{ id, x, y, s, note, badge }]   id is also the text shown unless `v` is given
 *   edges  [{ a, b, s, label, dir }]        dir: true draws an arrow a -> b (defaults to the graph's `directed`)
 *   curve  on an edge bends it, handy when a -> b and b -> a both exist
 *   r      node radius, raise it for longer labels
 */
export function GraphViz({ nodes, edges, directed = false, unit = 78, r: R = 18, label = "graph" }) {
    const byId = Object.fromEntries(nodes.map(n => [n.id, n]))
    const colors = [...new Set(["line", ...edges.map(e => (e.s ? state(e.s).stroke : "line"))])]
    const arrowColors = colors.map(c => (c === "line" ? INK.text3 : c))
    const base = useArrowBase()
    const marker = c => markerUrl(base, hue(c))
    const pad = 34
    const maxX = Math.max(...nodes.map(n => n.x))
    const maxY = Math.max(...nodes.map(n => n.y))
    const hasNotes = nodes.some(n => n.note)
    const width = maxX * unit + pad * 2
    const height = maxY * unit + pad * 2 + (hasNotes ? 18 : 0)
    const P = n => ({ x: pad + n.x * unit, y: pad + n.y * unit })

    return (
        <Svg width={width} height={height} label={label}>
            <ArrowDefs base={base} colors={arrowColors} />
            {edges.map((e, k) => {
                const a = P(byId[e.a])
                const b = P(byId[e.b])
                const dx = b.x - a.x
                const dy = b.y - a.y
                const len = Math.hypot(dx, dy)
                const ux = dx / len
                const uy = dy / len
                // start and end on the circle edges, not the centers
                const x1 = a.x + ux * R
                const y1 = a.y + uy * R
                const x2 = b.x - ux * (R + 2)
                const y2 = b.y - uy * (R + 2)
                const s = e.s ? state(e.s) : null
                const color = s ? s.stroke : INK.text3
                const arrow = e.dir ?? directed
                const bend = e.curve || 0
                const mx = (x1 + x2) / 2 - uy * bend
                const my = (y1 + y2) / 2 + ux * bend
                return (
                    <g key={k}>
                        <path
                            d={bend ? `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}` : `M ${x1} ${y1} L ${x2} ${y2}`}
                            fill="none"
                            stroke={s ? s.stroke : INK.line}
                            strokeWidth={s ? 2.25 : 1.5}
                            strokeDasharray={e.dashed ? "5 5" : undefined}
                            markerEnd={arrow ? marker(color) : undefined}
                        />
                        {e.label !== undefined && (
                            <Tag x={bend ? (mx + (x1 + x2) / 2) / 2 : mx} y={bend ? (my + (y1 + y2) / 2) / 2 : my} text={e.label} color={color} size={10.5} />
                        )}
                    </g>
                )
            })}
            {nodes.map(n => {
                const { x, y } = P(n)
                const s = state(n.s)
                return (
                    <g key={n.id}>
                        <circle cx={x} cy={y} r={R} fill={BACKING} />
                        <circle cx={x} cy={y} r={R} fill={n.s ? s.fill : "#141417"} stroke={s.stroke} strokeWidth={1.75} />
                        <text x={x} y={y} fontSize={13} fill={s.text} textAnchor="middle" dominantBaseline="central">{n.v ?? n.id}</text>
                        {n.badge !== undefined && (
                            <g>
                                <circle cx={x + 14} cy={y - 14} r={8.5} fill={hue(n.badgeColor || "yellow")} />
                                <text x={x + 14} y={y - 14} fontSize={10} fill="#111" textAnchor="middle" dominantBaseline="central" fontWeight={600}>{n.badge}</text>
                            </g>
                        )}
                        {n.note && (
                            <Tag x={x} y={y + R + 12} text={n.note} color={n.noteColor ? hue(n.noteColor) : INK.text3} size={10.5} />
                        )}
                    </g>
                )
            })}
        </Svg>
    )
}
