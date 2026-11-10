import { Svg, Tag } from "./Svg"
import { INK, BACKING, state, hue } from "./colors"

/**
 * tree node shape used by every tree diagram:
 *   { v: "5", s: "active", es: "done", edge: "pick 2", note: "pre #1", badge: 3, children: [node | null, ...] }
 *   v        text inside the node
 *   s        node state (colors, see colors.js)
 *   es       state of the edge coming INTO this node from its parent
 *   edge     label on that edge (decision trees: the choice made)
 *   note     small text under the node
 *   badge    small number in a bubble at the top right (traversal order etc.)
 */

const nodeWidth = v => (String(v).length <= 2 ? 34 : String(v).length * 8 + 18)

/**
 * layout: binary trees place nodes by in-order rank (so a lone right child sits to the right),
 * general trees put leaves side by side and center each parent over its children
 */
function layout(root, binary, dx, dy) {
    let slot = 0
    const nodes = []
    const edges = []
    const place = (node, depth) => {
        const kids = node.children || []
        let x
        let placedKids = []
        if (binary) {
            const [l, r] = [kids[0], kids[1]]
            const pl = l ? place(l, depth + 1) : null
            x = slot++
            const pr = r ? place(r, depth + 1) : null
            placedKids = [pl, pr].filter(Boolean)
        } else {
            const real = kids.filter(Boolean)
            if (!real.length) x = slot++
            else {
                placedKids = real.map(k => place(k, depth + 1))
                x = (placedKids[0].x + placedKids[placedKids.length - 1].x) / 2
            }
        }
        const me = { node, x, y: depth }
        nodes.push(me)
        placedKids.forEach(k => edges.push({ a: me, b: k }))
        return me
    }
    place(root, 0)
    const depth = Math.max(...nodes.map(n => n.y))
    nodes.forEach(n => { n.px = n.x * dx; n.py = n.y * dy })
    return { nodes, edges, cols: slot, depth }
}

export function TreeViz({ root, binary = true, dx = 50, dy = 66, label = "tree", extra }) {
    const { nodes, edges, cols, depth } = layout(root, binary, dx, dy)
    const padX = 40
    const padTop = 30
    const hasNotes = nodes.some(n => n.node.note)
    const width = (cols - 1) * dx + padX * 2
    const height = depth * dy + padTop + (hasNotes ? 50 : 34)
    const X = px => px + padX
    const Y = py => py + padTop

    return (
        <Svg width={Math.max(width, 120)} height={height} label={label}>
            {edges.map(({ a, b }, k) => {
                const s = b.node.es ? state(b.node.es) : null
                return (
                    <line
                        key={k}
                        x1={X(a.px)} y1={Y(a.py)} x2={X(b.px)} y2={Y(b.py)}
                        stroke={s ? s.stroke : INK.line}
                        strokeWidth={s ? 2.25 : 1.5}
                    />
                )
            })}
            {edges.map(({ a, b }, k) => b.node.edge && (
                <Tag
                    key={`t${k}`}
                    x={(X(a.px) + X(b.px)) / 2}
                    y={(Y(a.py) + Y(b.py)) / 2}
                    text={b.node.edge}
                    color={b.node.es ? state(b.node.es).stroke : INK.text3}
                    size={10}
                />
            ))}
            {nodes.map(({ node, px, py }, k) => {
                const s = state(node.s)
                const w = nodeWidth(node.v)
                return (
                    <g key={k}>
                        {/* opaque backing first, so edge lines never show through the tinted fill */}
                        <rect x={X(px) - w / 2} y={Y(py) - 17} width={w} height={34} rx={17} fill={BACKING} />
                        <rect
                            x={X(px) - w / 2} y={Y(py) - 17} width={w} height={34} rx={17}
                            fill={node.s ? s.fill : "#141417"} stroke={s.stroke} strokeWidth={1.75}
                        />
                        <text x={X(px)} y={Y(py)} fontSize={String(node.v).length > 3 ? 11 : 14} fill={s.text} textAnchor="middle" dominantBaseline="central">
                            {node.v}
                        </text>
                        {node.badge !== undefined && (
                            <g>
                                <circle cx={X(px) + w / 2 - 2} cy={Y(py) - 16} r={8.5} fill={hue(node.badgeColor || "yellow")} />
                                <text x={X(px) + w / 2 - 2} y={Y(py) - 16} fontSize={10} fill="#111" textAnchor="middle" dominantBaseline="central" fontWeight={600}>
                                    {node.badge}
                                </text>
                            </g>
                        )}
                        {/* the note gets a dark backing (Tag) so an edge running under it doesn't cut through the text */}
                        {node.note && (
                            <Tag x={X(px)} y={Y(py) + 28} text={node.note} color={node.noteColor ? hue(node.noteColor) : INK.text3} size={10.5} />
                        )}
                    </g>
                )
            })}
            {extra && extra({ X, Y, nodes })}
        </Svg>
    )
}
