import { GridViz, GraphViz, Figure, Stepper } from "../kit"

// "#" = wall, S = start, T = target
const MAZE = [
    ["S", ".", ".", "#", "."],
    [".", "#", ".", "#", "."],
    [".", "#", ".", ".", "."],
    [".", ".", "#", "#", "."],
    ["#", ".", ".", ".", "T"],
]

function waveFrames() {
    const rows = MAZE.length
    const cols = MAZE[0].length
    const dist = {}
    const parent = {}
    dist["0,0"] = 0
    let frontier = [[0, 0]]
    const frames = []
    const view = (level, path) => {
        const grid = MAZE.map((row, r) => row.map((v, c) => (v === "#" ? "" : dist[`${r},${c}`] !== undefined ? dist[`${r},${c}`] : v === "." ? "" : v)))
        const states = {}
        MAZE.forEach((row, r) => row.forEach((v, c) => {
            const k = `${r},${c}`
            if (v === "#") states[k] = "muted"
            else if (dist[k] === level) states[k] = "active"
            else if (dist[k] !== undefined) states[k] = "window"
        }))
        if (path) path.forEach(([r, c]) => { states[`${r},${c}`] = "done" })
        return <GridViz grid={grid} states={states} path={path} cell={46} label="bfs wavefront" />
    }
    frames.push({ caption: "Start at S with distance 0. The queue holds the current frontier: every cell exactly this many steps away.", view: view(0) })
    let level = 0
    let found = false
    while (frontier.length && !found) {
        level++
        const next = []
        for (const [r, c] of frontier) {
            for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const nr = r + dr
                const nc = c + dc
                const k = `${nr},${nc}`
                if (nr < 0 || nc < 0 || nr >= rows || nc >= cols || MAZE[nr][nc] === "#" || dist[k] !== undefined) continue
                dist[k] = level
                parent[k] = [r, c]
                next.push([nr, nc])
                if (MAZE[nr][nc] === "T") found = true
            }
        }
        frontier = next
        frames.push({
            caption: found
                ? `Level ${level} reaches T. BFS reaches cells in order of distance, so the first time it touches T is the shortest path: ${level} steps.`
                : `Level ${level}: every unvisited open neighbour of the last level gets distance ${level}. The wave spreads one step at a time in every direction.`,
            view: view(level),
        })
    }
    // trace the path back through the parent links
    const path = [[4, 4]]
    let k = "4,4"
    while (parent[k]) { const p = parent[k]; path.unshift(p); k = p.join(",") }
    frames.push({ caption: "Follow each cell's parent (the cell it was discovered from) back to S to recover the actual path.", view: view(-1, path) })
    return frames
}

export function Wavefront() {
    return (
        <Stepper
            title="Shortest path in a grid, one level at a time"
            frames={waveFrames()}
            legend={[{ s: "active", label: "the newest level" }, { s: "window", label: "reached earlier" }, { s: "muted", label: "wall" }, { s: "done", label: "shortest path" }]}
        />
    )
}

export function Layers() {
    const nodes = [
        { id: "A", x: 0, y: 1, s: "active", note: "dist 0" },
        { id: "B", x: 1, y: 0.2, s: "found", note: "dist 1" },
        { id: "C", x: 1, y: 1.8, s: "found", note: "dist 1" },
        { id: "D", x: 2, y: 0.2, s: "window", note: "dist 2" },
        { id: "E", x: 2, y: 1.8, s: "window", note: "dist 2" },
        { id: "F", x: 3, y: 1, s: "done", note: "dist 3" },
    ]
    const edges = [
        { a: "A", b: "B" }, { a: "A", b: "C" }, { a: "B", b: "C" },
        { a: "B", b: "D" }, { a: "C", b: "E" }, { a: "D", b: "E" }, { a: "D", b: "F" }, { a: "E", b: "F" },
    ]
    return (
        <Figure
            caption="BFS from A visits the graph in rings: first everything 1 edge away, then 2, then 3. Nothing at distance 3 is touched until every distance 2 node is done, which is why the first time BFS reaches a node is along a shortest path."
            legend={[{ s: "active", label: "start" }, { s: "found", label: "level 1" }, { s: "window", label: "level 2" }, { s: "done", label: "level 3" }]}
        >
            <GraphViz nodes={nodes} edges={edges} unit={110} label="bfs layers" />
        </Figure>
    )
}

export function Rotting() {
    const minutes = [
        [0, 1, 2],
        [1, 2, ""],
        ["", 3, 4],
    ]
    const states = { "0,0": "bad", "0,1": "extra", "1,0": "extra", "0,2": "found", "1,1": "found", "2,1": "window", "2,2": "done", "1,2": "muted", "2,0": "muted" }
    return (
        <Figure
            caption="Rotting Oranges: start the queue with EVERY rotten orange at once (multi-source BFS). Each level of the BFS is one minute. The numbers show the minute each orange rots; the answer is the last level, 4. If a fresh orange is never reached, return -1."
            legend={[{ s: "bad", label: "rotten at the start" }, { s: "extra", label: "minute 1" }, { s: "found", label: "minute 2" }, { s: "window", label: "minute 3" }, { s: "done", label: "minute 4" }, { s: "muted", label: "empty cell" }]}
        >
            <GridViz grid={minutes} states={states} cell={50} label="rotting oranges" />
        </Figure>
    )
}
