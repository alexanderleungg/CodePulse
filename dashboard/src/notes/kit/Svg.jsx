import { hue, MONO } from "./colors"

// shared <svg> wrapper: scales down on small screens but never grows past its natural size.
// align="left" pins it to the left edge (for rows that should line up, like a staircase of arrays)
export function Svg({ width, height, label, children, align = "center" }) {
    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            // centered: fill the figure up to the natural width. left aligned rows sit inside a
            // fit-content wrapper, where a % width would shrink each row by a different amount,
            // so they use their natural pixel width and only scale down if the screen is too narrow
            width={align === "left" ? width : "100%"}
            style={{ maxWidth: align === "left" ? "100%" : width, display: "block", margin: align === "left" ? "0" : "0 auto", overflow: "visible" }}
            role="img"
            aria-label={label}
            fontFamily={MONO}
        >
            {children}
        </svg>
    )
}

// the <defs> block holding one arrowhead per color (see arrows.js for how lines reference them)
export function ArrowDefs({ base, colors }) {
    return (
        <defs>
            {colors.map(c => (
                <marker
                    key={c}
                    id={`${base}-${hue(c).replace("#", "")}`}
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth="7"
                    markerHeight="7"
                    orient="auto-start-reverse"
                >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill={hue(c)} />
                </marker>
            ))}
        </defs>
    )
}

// a small label with a dark backing so it stays readable when it sits on top of lines
export function Tag({ x, y, text, color, size = 11, anchor = "middle" }) {
    const w = String(text).length * size * 0.62 + 8
    const x0 = anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w : x
    return (
        <g>
            <rect x={x0} y={y - size * 0.75} width={w} height={size * 1.5} rx={4} fill="#111113" />
            <text x={x0 + w / 2} y={y} fontSize={size} fill={hue(color)} textAnchor="middle" dominantBaseline="central">
                {text}
            </text>
        </g>
    )
}
