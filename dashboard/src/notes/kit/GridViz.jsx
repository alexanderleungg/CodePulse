import { Svg, ArrowDefs } from "./Svg"
import { useArrowBase, markerUrl } from "./arrows"
import { INK, BACKING, state, hue } from "./colors"

/**
 * a 2D grid, also used for DP tables.
 *   grid        2D array of values (use "" for blank cells)
 *   states      { "r,c": state }
 *   rowHeaders  labels down the left side (DP: characters of string 1, or item names)
 *   colHeaders  labels across the top
 *   arrows      [{ from: [r, c], to: [r, c], color }]  e.g. DP dependencies or BFS moves
 *   path        [[r, c], ...] draws a line through cell centers in order
 */
export function GridViz({ grid, states = {}, rowHeaders, colHeaders, arrows = [], path, cell = 40, label = "grid", badges = {} }) {
    const rows = grid.length
    const cols = grid[0].length
    const colors = [...new Set(arrows.map(a => a.color || "blue").concat(path ? ["yellow"] : []))]
    const arrowColors = colors.map(hue)
    const base = useArrowBase()
    const marker = c => markerUrl(base, hue(c))
    const pad = 10
    const left = pad + (rowHeaders ? 30 : 0)
    const top = pad + (colHeaders ? 26 : 0)
    const width = left + cols * cell + pad
    const height = top + rows * cell + pad
    const cx = c => left + c * cell + cell / 2
    const cy = r => top + r * cell + cell / 2

    return (
        <Svg width={width} height={height} label={label}>
            <ArrowDefs base={base} colors={arrowColors} />
            {colHeaders && colHeaders.map((h, c) => (
                <text key={c} x={cx(c)} y={pad + 10} fontSize={12} fill={INK.text3} textAnchor="middle" dominantBaseline="central">{h}</text>
            ))}
            {rowHeaders && rowHeaders.map((h, r) => (
                <text key={r} x={pad + 12} y={cy(r)} fontSize={12} fill={INK.text3} textAnchor="middle" dominantBaseline="central">{h}</text>
            ))}
            {/* three passes so the path line runs between the cell boxes and the text on top of it */}
            {grid.map((row, r) => row.map((v, c) => {
                const s = state(states[`${r},${c}`])
                return (
                    <rect
                        key={`${r},${c}`}
                        x={left + c * cell + 1.5} y={top + r * cell + 1.5}
                        width={cell - 3} height={cell - 3} rx={6}
                        fill={s.fill} stroke={s.stroke} strokeWidth={1.25}
                    />
                )
            }))}
            {path && (
                <polyline
                    points={path.map(([r, c]) => `${cx(c)},${cy(r)}`).join(" ")}
                    fill="none" stroke={hue("yellow")} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" opacity={0.55}
                />
            )}
            {grid.map((row, r) => row.map((v, c) => {
                const s = state(states[`${r},${c}`])
                return (
                    <g key={`t${r},${c}`}>
                        {path && v !== "" && <rect x={cx(c) - 9} y={cy(r) - 8} width={18} height={16} rx={4} fill={BACKING} opacity={0.85} />}
                        <text x={cx(c)} y={cy(r)} fontSize={String(v).length > 2 ? 11 : 13} fill={s.text} textAnchor="middle" dominantBaseline="central">{v}</text>
                        {badges[`${r},${c}`] !== undefined && (
                            <text x={left + c * cell + cell - 6} y={top + r * cell + 9} fontSize={8.5} fill={INK.text3} textAnchor="end" dominantBaseline="central">
                                {badges[`${r},${c}`]}
                            </text>
                        )}
                    </g>
                )
            }))}
            {arrows.map((a, k) => {
                const [r1, c1] = a.from
                const [r2, c2] = a.to
                const x1 = cx(c1), y1 = cy(r1), x2 = cx(c2), y2 = cy(r2)
                const len = Math.hypot(x2 - x1, y2 - y1)
                const shrink = cell * 0.3
                const ux = (x2 - x1) / len, uy = (y2 - y1) / len
                const color = hue(a.color || "blue")
                return (
                    <line
                        key={k}
                        x1={x1 + ux * shrink} y1={y1 + uy * shrink}
                        x2={x2 - ux * shrink} y2={y2 - uy * shrink}
                        stroke={color} strokeWidth={2} markerEnd={marker(color)}
                    />
                )
            })}
        </Svg>
    )
}
