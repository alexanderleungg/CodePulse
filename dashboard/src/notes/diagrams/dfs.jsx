import { GridViz, GraphViz, Figure, Stepper } from "../kit"

const GRID = [
    [1, 1, 0, 0, 0],
    [1, 1, 0, 0, 1],
    [0, 0, 0, 1, 1],
    [0, 0, 0, 0, 0],
    [1, 0, 1, 1, 0],
]
const ISLAND_COLORS = ["active", "found", "window", "extra"]

function islandFrames() {
    const rows = GRID.length
    const cols = GRID[0].length
    const seen = {}           // "r,c" -> island number
    const frames = []
    let islands = 0
    const view = (current, order) => {
        const states = {}
        const badges = {}
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const key = `${r},${c}`
                if (seen[key] !== undefined) states[key] = ISLAND_COLORS[seen[key] % ISLAND_COLORS.length]
                else if (GRID[r][c] === 0) states[key] = "muted"
            }
        }
        if (current) states[current] = "done"
        Object.entries(order || {}).forEach(([k, v]) => { badges[k] = v })
        return <GridViz grid={GRID} states={states} badges={badges} rowHeaders={[0, 1, 2, 3, 4]} colHeaders={[0, 1, 2, 3, 4]} cell={46} label="islands grid" />
    }
    frames.push({ caption: "Scan every cell. 1 is land, 0 is water. Whenever we hit land nobody has claimed yet, that's a new island: run DFS from it to claim the whole thing.", view: view() })
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (GRID[r][c] !== 1 || seen[`${r},${c}`] !== undefined) continue
            const id = islands++
            const order = {}
            let step = 0
            const dfs = (i, j) => {
                if (i < 0 || j < 0 || i >= rows || j >= cols) return
                if (GRID[i][j] !== 1 || seen[`${i},${j}`] !== undefined) return
                seen[`${i},${j}`] = id
                order[`${i},${j}`] = ++step
                dfs(i + 1, j); dfs(i - 1, j); dfs(i, j + 1); dfs(i, j - 1)
            }
            dfs(r, c)
            frames.push({
                caption: `(${r}, ${c}) is unclaimed land: island #${id + 1}. DFS spreads to every connected land cell (small numbers show the visit order: down, up, right, left). ${step} cell${step === 1 ? "" : "s"} claimed.`,
                view: view(null, order),
            })
        }
    }
    frames[frames.length - 1].caption += ` Scan finished: ${islands} islands. Every cell is visited at most once by the scan and once by a DFS: O(rows × cols).`
    return frames
}

export function Islands() {
    return (
        <Stepper
            title="200. Number of Islands"
            frames={islandFrames()}
            legend={[{ s: "active", label: "island 1" }, { s: "found", label: "island 2" }, { s: "window", label: "island 3" }, { s: "extra", label: "island 4" }, { s: "muted", label: "water" }]}
        />
    )
}

export function GraphOrder() {
    // adjacency: A: B, C   B: D, E   C: F   E: F
    const nodes = [
        { id: "A", x: 1.5, y: 0, badge: 1 },
        { id: "B", x: 0.5, y: 1, badge: 2 },
        { id: "C", x: 2.5, y: 1, badge: 6 },
        { id: "D", x: 0, y: 2, badge: 3 },
        { id: "E", x: 1, y: 2, badge: 4 },
        { id: "F", x: 2, y: 2.6, badge: 5 },
    ]
    const edges = [
        { a: "A", b: "B", s: "active" },
        { a: "A", b: "C", dashed: true },
        { a: "B", b: "D", s: "active" },
        { a: "B", b: "E", s: "active" },
        { a: "E", b: "F", s: "active" },
        { a: "C", b: "F", s: "active" },
    ]
    return (
        <Figure
            caption="DFS from A, trying neighbours in alphabetical order. It dives A → B → D, backs up to B, dives into E → F, and from F finds C. By the time A would try C, C is already visited, so that edge (dashed) is skipped. The yellow numbers are the visit order. Without the visited set, the cycle A, B, E, F, C, A would loop forever."
            legend={[{ s: "active", label: "edges DFS actually walked" }, { color: "#7d7d86", label: "dashed: skipped, already visited" }]}
        >
            <GraphViz nodes={nodes} edges={edges} unit={90} label="dfs visit order" />
        </Figure>
    )
}

export function BorderDFS() {
    const board = [
        ["X", "X", "X", "X", "X"],
        ["X", "O", "O", "X", "X"],
        ["X", "X", "O", "X", "X"],
        ["X", "O", "X", "O", "O"],
        ["X", "O", "X", "X", "X"],
    ]
    const safe = new Set(["3,3", "3,4", "3,1", "4,1"])
    const states = {}
    board.forEach((row, r) => row.forEach((v, c) => {
        const k = `${r},${c}`
        if (v === "O") states[k] = safe.has(k) ? "done" : "bad"
    }))
    return (
        <Figure
            caption="Surrounded Regions: instead of asking 'is this O region surrounded?' for every region, flip it. Start a DFS from every O on the BORDER and mark everything it reaches as safe. Whatever O is left unmarked can't reach the edge, so it gets captured."
            legend={[{ s: "done", label: "reached from the border: stays O" }, { s: "bad", label: "never reached: flipped to X" }]}
        >
            <GridViz grid={board} states={states} cell={44} label="surrounded regions" />
        </Figure>
    )
}
