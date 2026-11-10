import { GraphViz, GridViz, ArrayViz, Figure, Stepper } from "../kit"

export function Representations() {
    const nodes = [
        { id: "0", x: 0, y: 0 },
        { id: "1", x: 1.3, y: 0 },
        { id: "2", x: 0, y: 1.2 },
        { id: "3", x: 1.3, y: 1.2 },
    ]
    const edges = [{ a: "0", b: "1" }, { a: "0", b: "2" }, { a: "1", b: "3" }, { a: "2", b: "3" }, { a: "1", b: "2" }]
    const matrix = [
        [0, 1, 1, 0],
        [1, 0, 1, 1],
        [1, 1, 0, 1],
        [0, 1, 1, 0],
    ]
    const ms = {}
    matrix.forEach((row, r) => row.forEach((v, c) => { if (v) ms[`${r},${c}`] = "active" }))
    return (
        <Figure caption="One graph, three ways to write it down. Interview inputs usually arrive as an EDGE LIST; I almost always convert it to an ADJACENCY LIST (each node -> its neighbours), because that's what DFS and BFS want. An ADJACENCY MATRIX (1 = connected) is O(1) to check one pair but always costs V² memory.">
            <div className="fig-row">
                <div><GraphViz nodes={nodes} edges={edges} unit={90} label="the graph" /><div className="fig-sub">the graph</div></div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.9 }}>
                    <div style={{ color: "var(--text-3)" }}>edge list</div>
                    <div>[[0,1], [0,2], [1,3], [2,3], [1,2]]</div>
                    <div style={{ color: "var(--text-3)", marginTop: 10 }}>adjacency list</div>
                    <div>0: [1, 2]</div>
                    <div>1: [0, 3, 2]</div>
                    <div>2: [0, 3, 1]</div>
                    <div>3: [1, 2]</div>
                </div>
                <div><GridViz grid={matrix} states={ms} rowHeaders={[0, 1, 2, 3]} colHeaders={[0, 1, 2, 3]} cell={36} label="adjacency matrix" /><div className="fig-sub">adjacency matrix</div></div>
            </div>
        </Figure>
    )
}

export function ThreeColors() {
    const nodes = [
        { id: "A", x: 0, y: 0, s: "found", note: "on path" },
        { id: "B", x: 1.3, y: 0, s: "found", note: "on path" },
        { id: "C", x: 2.6, y: 0, s: "found", note: "on path" },
        { id: "D", x: 2.6, y: 1.3, s: "found", note: "on path (current)" },
        { id: "F", x: 0, y: 1.3, s: "done", note: "done" },
        { id: "E", x: 1.3, y: 2.3, note: "unvisited" },
    ]
    const edges = [
        { a: "A", b: "F", s: "done" },
        { a: "A", b: "B", s: "found" },
        { a: "B", b: "C", s: "found" },
        { a: "C", b: "D", s: "found" },
        { a: "D", b: "B", s: "bad", label: "into the path: cycle!" },
        { a: "D", b: "F", dashed: true, label: "into a done node: fine" },
        { a: "E", b: "D" },
    ]
    return (
        <Figure
            caption="Cycle detection in a DIRECTED graph uses three states: unvisited, on the current DFS path, and done. DFS went A → F (finished, so F is done), then A → B → C → D. From D, the edge to F is harmless: two paths meeting at a finished node isn't a loop. The edge from D back to B is the problem, because B is still on the current path. That's a cycle."
            legend={[{ s: "found", label: "on the current DFS path (gray)" }, { s: "done", label: "fully explored (black)" }, { s: "bad", label: "edge back into the path: cycle" }]}
        >
            <GraphViz nodes={nodes} edges={edges} directed unit={120} label="three color cycle detection" />
        </Figure>
    )
}

export function Bipartite() {
    const nodes = [
        { id: "0", x: 0, y: 0, s: "active" },
        { id: "1", x: 1.2, y: 0, s: "found" },
        { id: "2", x: 1.2, y: 1.2, s: "active" },
        { id: "3", x: 0, y: 1.2, s: "found" },
    ]
    const edges = [{ a: "0", b: "1" }, { a: "1", b: "2" }, { a: "2", b: "3" }, { a: "3", b: "0" }]
    const bad = [
        { id: "0", x: 0, y: 0, s: "active" },
        { id: "1", x: 1.2, y: 0, s: "found" },
        { id: "2", x: 0.6, y: 1.1, s: "bad", note: "needs both colors" },
    ]
    return (
        <Figure caption="Is Graph Bipartite: try to color every node with one of two colors so every edge joins different colors. BFS or DFS, giving each neighbour the opposite color. A square works. A triangle can't: the third node touches both colors. (A graph is bipartite exactly when it has no odd length cycle.)">
            <div className="fig-row">
                <div><GraphViz nodes={nodes} edges={edges} unit={90} label="bipartite square" /><div className="fig-sub">bipartite</div></div>
                <div><GraphViz nodes={bad} edges={[{ a: "0", b: "1" }, { a: "1", b: "2", s: "bad" }, { a: "2", b: "0", s: "bad" }]} unit={90} label="triangle" /><div className="fig-sub">not bipartite</div></div>
            </div>
        </Figure>
    )
}

// Dijkstra from A on a small weighted graph
const DNODES = { A: [0, 1], B: [1.2, 0], C: [1.2, 2], D: [2.4, 1], E: [3.6, 1] }
const DEDGES = [["A", "B", 4], ["A", "C", 1], ["C", "B", 2], ["B", "D", 1], ["C", "D", 5], ["D", "E", 3]]

function dijkstraFrames() {
    const dist = { A: 0, B: Infinity, C: Infinity, D: Infinity, E: Infinity }
    const prev = {}
    const done = new Set()
    let heap = [[0, "A"]]
    const frames = []
    const fmt = d => (d === Infinity ? "∞" : d)
    const snap = (current, caption, relaxed = []) => {
        const nodes = Object.entries(DNODES).map(([id, [x, y]]) => ({
            id, x, y,
            s: id === current ? "active" : done.has(id) ? "done" : dist[id] !== Infinity ? "found" : undefined,
            note: `dist ${fmt(dist[id])}`,
            noteColor: id === current ? "blue" : undefined,
        }))
        const edges = DEDGES.map(([a, b, w]) => ({
            a, b, label: w,
            s: relaxed.some(([x, y]) => (x === a && y === b) || (x === b && y === a)) ? "active" : prev[b] === a || prev[a] === b ? "done" : undefined,
        }))
        const sorted = [...heap].sort((p, q) => p[0] - q[0])
        frames.push({
            caption,
            view: (
                <div>
                    <GraphViz nodes={nodes} edges={edges} unit={100} label="dijkstra" />
                    <ArrayViz items={sorted.length ? sorted.map(([d, n]) => `${d},${n}`) : ["empty"]} title="heap (dist,node)" showIndex={false} cell={46} states={{ 0: "found" }} />
                </div>
            ),
        })
    }
    snap(null, "dist[A] = 0, every other distance is ∞. The heap holds (distance, node) pairs, smallest first.")
    while (heap.length) {
        heap.sort((p, q) => p[0] - q[0])
        const [d, u] = heap.shift()
        if (done.has(u)) {
            snap(null, `Pop (${d}, ${u}), but ${u} is already finalized with a shorter distance. Skip this stale entry.`)
            continue
        }
        done.add(u)
        const relaxed = []
        for (const [a, b, w] of DEDGES) {
            const v = a === u ? b : b === u ? a : null
            if (!v || done.has(v)) continue
            if (d + w < dist[v]) {
                dist[v] = d + w
                prev[v] = u
                heap.push([dist[v], v])
                relaxed.push([u, v])
            }
        }
        snap(u, `Pop (${d}, ${u}): the smallest distance in the heap, so ${u}'s distance is final. ${relaxed.length ? `Relax its edges: ${relaxed.map(([, v]) => `${v} improves to ${dist[v]}`).join(", ")}.` : "No neighbour improves."}`, relaxed)
    }
    frames[frames.length - 1].caption += " Heap empty: every distance is final. Notice B ended at 3 (A → C → B), not 4 (A → B directly)."
    return frames
}

export function Dijkstra() {
    return (
        <Stepper
            title="Dijkstra from A"
            frames={dijkstraFrames()}
            legend={[{ s: "active", label: "just popped / edges being relaxed" }, { s: "done", label: "final distance" }, { s: "found", label: "tentative distance" }]}
        />
    )
}
