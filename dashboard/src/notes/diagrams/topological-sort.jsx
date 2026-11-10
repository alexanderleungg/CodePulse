import { GraphViz, ArrayViz, Figure, Stepper } from "../kit"

// courses and prerequisites: an edge a -> b means "take a before b" (DS = data structures, Disc = discrete math)
const POS = {
    Intro: [0, 1],
    Math: [0, 2.4],
    DS: [1.4, 0.4],
    Disc: [1.4, 2],
    Algo: [2.8, 1.2],
    ML: [4.2, 1.2],
}
const EDGES = [
    ["Intro", "DS"],
    ["Intro", "Disc"],
    ["Math", "Disc"],
    ["DS", "Algo"],
    ["Disc", "Algo"],
    ["Algo", "ML"],
    ["Math", "ML"],
]

function kahnFrames() {
    const indeg = Object.fromEntries(Object.keys(POS).map(k => [k, 0]))
    EDGES.forEach(([, b]) => { indeg[b]++ })
    const queue = Object.keys(POS).filter(k => indeg[k] === 0)
    const order = []
    const removed = new Set()
    const frames = []
    const snap = (current, caption) => {
        const nodes = Object.entries(POS).map(([id, [x, y]]) => ({
            id, x, y,
            s: id === current ? "active" : removed.has(id) ? "done" : queue.includes(id) ? "found" : undefined,
            badge: removed.has(id) ? undefined : indeg[id],
            badgeColor: indeg[id] === 0 ? "#22c55e" : "#eab308",
        }))
        const edges = EDGES.map(([a, b]) => ({ a, b, s: removed.has(a) ? "muted" : a === current ? "active" : undefined, dashed: removed.has(a) }))
        frames.push({
            caption,
            view: (
                <div>
                    <GraphViz nodes={nodes} edges={edges} directed unit={96} r={22} label="course graph" />
                    <div className="fig-row" style={{ marginTop: 4 }}>
                        <ArrayViz items={queue.length ? [...queue] : ["empty"]} title="queue" showIndex={false} cell={64} states={queue.length ? { 0: "found" } : {}} />
                        <ArrayViz items={order.length ? [...order] : ["-"]} title="order" showIndex={false} cell={64} states={Object.fromEntries(order.map((_, i) => [i, "done"]))} />
                    </div>
                </div>
            ),
        })
    }
    snap(null, "Badges show each course's in degree: how many prerequisites it still waits on. Courses at 0 can be taken now, so they start in the queue.")
    while (queue.length) {
        const u = queue.shift()
        order.push(u)
        removed.add(u)
        const unlocked = []
        EDGES.forEach(([a, b]) => {
            if (a !== u) return
            indeg[b]--
            if (indeg[b] === 0) { queue.push(b); unlocked.push(b) }
        })
        snap(u, `Take ${u} and add it to the order. Every course that needed it loses one from its in degree.${unlocked.length ? ` ${unlocked.join(" and ")} just hit 0, so ${unlocked.length === 1 ? "it joins" : "they join"} the queue.` : ""}`)
    }
    frames[frames.length - 1].caption += " The queue is empty and all 6 courses are in the order, so there's no cycle."
    return frames
}

export function Kahn() {
    return (
        <Stepper
            title="Kahn's algorithm: peel off courses with no remaining prerequisites"
            frames={kahnFrames()}
            legend={[{ s: "found", label: "ready (in queue)" }, { s: "active", label: "just taken" }, { s: "done", label: "in the order" }]}
        />
    )
}

export function Stuck() {
    const nodes = [
        { id: "A", x: 0, y: 0.6, badge: 0, badgeColor: "#22c55e", s: "done" },
        { id: "B", x: 1.3, y: 0, badge: 1, s: "bad" },
        { id: "C", x: 2.6, y: 0.6, badge: 1, s: "bad" },
        { id: "D", x: 1.3, y: 1.2, badge: 1, s: "bad" },
    ]
    const edges = [
        { a: "A", b: "B", s: "muted", dashed: true },
        { a: "B", b: "C", s: "bad" },
        { a: "C", b: "D", s: "bad" },
        { a: "D", b: "B", s: "bad" },
    ]
    return (
        <Figure
            caption="With a cycle, Kahn's algorithm gets stuck. After taking A, B still waits on D, D waits on C, and C waits on B. None of them ever reaches in degree 0, so the queue empties with only 1 of 4 courses in the order. 'Fewer nodes in the order than in the graph' is the cycle check."
            legend={[{ s: "done", label: "taken" }, { s: "bad", label: "stuck in a cycle: in degree never hits 0" }]}
        >
            <GraphViz nodes={nodes} edges={edges} directed unit={100} label="cycle blocks topological sort" />
        </Figure>
    )
}
