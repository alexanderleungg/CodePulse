import { Svg } from "./Svg"
import { INK, state } from "./colors"

/**
 * numbers written out in binary, one per row, so bit operations can be read column by column.
 *   rows   [{ label: "x", value: 12, s, bitStates: { bitIndex: state }, op: "&" }]
 *          bitIndex 0 is the rightmost (least significant) bit
 *   bits   how many bits to show (default 8)
 *   rule   draw a line above the row at this index (the "result" of the rows above)
 */
export function BitsViz({ rows, bits = 8, rule, label = "bits" }) {
    const cell = 30
    const pad = 14
    const labelW = 96
    const opW = 20
    const left = pad + labelW + opW
    const rowH = cell + 8
    const width = left + bits * cell + 60 + pad
    const height = pad * 2 + rows.length * rowH + 16

    return (
        <Svg width={width} height={height} label={label}>
            {Array.from({ length: bits }, (_, k) => (
                <text key={k} x={left + k * cell + cell / 2} y={pad + 4} fontSize={9} fill={INK.faint} textAnchor="middle">{bits - 1 - k}</text>
            ))}
            {rows.map((row, r) => {
                const y = pad + 14 + r * rowH
                const bin = (row.value >>> 0).toString(2).padStart(bits, "0").slice(-bits)
                return (
                    <g key={r}>
                        {rule === r && <line x1={left - opW} x2={left + bits * cell} y1={y - 5} y2={y - 5} stroke={INK.text3} strokeWidth={1.25} />}
                        <text x={pad} y={y + cell / 2} fontSize={12} fill={INK.text2} dominantBaseline="central">{row.label}</text>
                        {row.op && <text x={left - opW / 2} y={y + cell / 2} fontSize={14} fill={INK.text} textAnchor="middle" dominantBaseline="central">{row.op}</text>}
                        {bin.split("").map((b, k) => {
                            const bitIndex = bits - 1 - k
                            const st = row.bitStates?.[bitIndex] || (b === "1" ? row.s || "active" : undefined)
                            const s = state(st)
                            return (
                                <g key={k}>
                                    <rect x={left + k * cell + 2} y={y} width={cell - 4} height={cell} rx={5} fill={st ? s.fill : "transparent"} stroke={st ? s.stroke : "#26262b"} strokeWidth={1.25} />
                                    <text x={left + k * cell + cell / 2} y={y + cell / 2} fontSize={13} fill={b === "1" ? s.text : INK.faint} textAnchor="middle" dominantBaseline="central">{b}</text>
                                </g>
                            )
                        })}
                        <text x={left + bits * cell + 14} y={y + cell / 2} fontSize={12} fill={INK.text3} dominantBaseline="central">= {row.value}</text>
                    </g>
                )
            })}
        </Svg>
    )
}
