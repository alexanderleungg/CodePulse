import { GridViz, Figure, Stepper } from "../kit"

export function Neighbors() {
    const grid = [
        ["", "", "", "", ""],
        ["", "", "r-1", "", ""],
        ["", "c-1", "r,c", "c+1", ""],
        ["", "", "r+1", "", ""],
        ["", "", "", "", ""],
    ]
    return (
        <Figure
            caption="The four neighbours of (r, c). Moving up changes the row by -1, moving right changes the column by +1, and so on. Writing them as a list of (dr, dc) pairs turns four copy pasted blocks of code into one loop."
            legend={[{ s: "active", label: "current cell" }, { s: "found", label: "neighbours" }]}
        >
            <GridViz
                grid={grid}
                rowHeaders={[0, 1, 2, 3, 4]}
                colHeaders={[0, 1, 2, 3, 4]}
                states={{ "2,2": "active", "1,2": "found", "3,2": "found", "2,1": "found", "2,3": "found" }}
                arrows={[
                    { from: [2, 2], to: [1, 2], color: "yellow" },
                    { from: [2, 2], to: [3, 2], color: "yellow" },
                    { from: [2, 2], to: [2, 1], color: "yellow" },
                    { from: [2, 2], to: [2, 3], color: "yellow" },
                ]}
                cell={52}
                label="grid neighbours"
            />
        </Figure>
    )
}

export function Diagonals() {
    const n = 4
    const palette = ["bad", "extra", "found", "done", "active", "window", "default"]
    const grid = Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => r - c))
    const states = {}
    grid.forEach((row, r) => row.forEach((v, c) => { states[`${r},${c}`] = palette[v + n - 1] }))
    const grid2 = Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => r + c))
    const states2 = {}
    grid2.forEach((row, r) => row.forEach((v, c) => { states2[`${r},${c}`] = palette[v] }))
    return (
        <Figure caption="Every cell on the same ↘ diagonal has the same r - c, and every cell on the same ↙ anti diagonal has the same r + c. Use those as dict keys to group or check diagonals, like in N-Queens or Valid Sudoku style problems.">
            <div className="fig-row">
                <div>
                    <GridViz grid={grid} states={states} cell={44} label="r minus c" />
                    <div className="fig-sub">r - c</div>
                </div>
                <div>
                    <GridViz grid={grid2} states={states2} cell={44} label="r plus c" />
                    <div className="fig-sub">r + c</div>
                </div>
            </div>
        </Figure>
    )
}

function spiralFrames() {
    const n = 4
    const grid = Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => r * n + c + 1))
    let top = 0, bottom = n - 1, left = 0, right = n - 1
    const path = []
    const frames = []
    const snap = caption => {
        const states = {}
        path.forEach(([r, c]) => { states[`${r},${c}`] = "done" })
        if (path.length) states[path[path.length - 1].join(",")] = "active"
        frames.push({
            caption,
            view: <GridViz grid={grid} states={states} path={path.length > 1 ? [...path] : undefined} cell={48} label="spiral order" />,
        })
    }
    snap(`Four walls: top = 0, bottom = ${n - 1}, left = 0, right = ${n - 1}. Walk along the outside, then move the wall I just finished inward.`)
    while (top <= bottom && left <= right) {
        for (let c = left; c <= right; c++) path.push([top, c])
        top++
        snap(`Left to right along the top row, then top moves down to ${top}.`)
        for (let r = top; r <= bottom; r++) path.push([r, right])
        right--
        snap(`Top to bottom down the right column, then right moves in to ${right}.`)
        if (top <= bottom) {
            for (let c = right; c >= left; c--) path.push([bottom, c])
            bottom--
            snap(`Right to left along the bottom row (only if a row is left), then bottom moves up to ${bottom}.`)
        }
        if (left <= right) {
            for (let r = bottom; r >= top; r--) path.push([r, left])
            left++
            snap(`Bottom to top up the left column (only if a column is left), then left moves in to ${left}.`)
        }
    }
    frames[frames.length - 1].caption += " The walls crossed, so every cell has been visited once."
    return frames
}

export function Spiral() {
    return (
        <Stepper title="54. Spiral Matrix" frames={spiralFrames()} legend={[{ s: "done", label: "visited" }, { s: "active", label: "last cell" }]} />
    )
}

export function Rotate() {
    const a = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
    const t = [[1, 4, 7], [2, 5, 8], [3, 6, 9]]
    const r = [[7, 4, 1], [8, 5, 2], [9, 6, 3]]
    const diag = { "0,0": "found", "1,1": "found", "2,2": "found" }
    return (
        <Figure caption="Rotating 90° clockwise in place is two easy steps. Transpose (swap across the main diagonal, so row i becomes column i), then reverse each row. The first row 1, 2, 3 ends up as the last column.">
            <div className="fig-row">
                <div><GridViz grid={a} states={{ "0,0": "active", "0,1": "active", "0,2": "active" }} cell={42} label="original" /><div className="fig-sub">original</div></div>
                <div><GridViz grid={t} states={{ ...diag, "0,0": "active", "1,0": "active", "2,0": "active" }} cell={42} label="transposed" /><div className="fig-sub">transpose</div></div>
                <div><GridViz grid={r} states={{ "0,2": "active", "1,2": "active", "2,2": "active" }} cell={42} label="rows reversed" /><div className="fig-sub">reverse each row</div></div>
            </div>
        </Figure>
    )
}
