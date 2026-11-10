import { GraphViz, ArrayViz, Figure, Stepper } from "../kit"

// lay out a union find forest: every root on the top row, children below their parent.
// each edge points from a child UP to its parent, the direction find() walks
function forest(parent, states = {}, notes = {}) {
    const n = parent.length
    const kids = Array.from({ length: n }, () => [])
    const roots = []
    parent.forEach((p, i) => (p === i ? roots.push(i) : kids[p].push(i)))
    const pos = {}
    let slot = 0
    const place = (u, depth) => {
        if (!kids[u].length) pos[u] = [slot++, depth]
        else {
            kids[u].forEach(k => place(k, depth + 1))
            const xs = kids[u].map(k => pos[k][0])
            pos[u] = [(Math.min(...xs) + Math.max(...xs)) / 2, depth]
        }
    }
    roots.forEach(r => { place(r, 0); slot += 0.4 })   // a little gap between separate trees
    const nodes = Object.entries(pos).map(([id, [x, y]]) => ({
        id, x: x * 0.95, y: y * 0.95,
        s: states[id] || (parent[id] === Number(id) ? "found" : undefined),
        note: notes[id],
    }))
    const edges = parent.flatMap((p, i) => (p === i ? [] : [{ a: String(i), b: String(p), s: states[`e${i}`] }]))
    return { nodes, edges }
}

function view(parent, states, notes) {
    const { nodes, edges } = forest(parent, states, notes)
    return (
        <div>
            <GraphViz nodes={nodes} edges={edges} directed unit={70} label="union find forest" />
            <ArrayViz items={[...parent]} title="parent" cell={40} states={Object.fromEntries(parent.map((p, i) => [i, states[i] || (p === i ? "found" : "default")]))} />
        </div>
    )
}

function unionFrames() {
    const parent = [0, 1, 2, 3, 4, 5]
    const size = [1, 1, 1, 1, 1, 1]
    const find = x => { while (parent[x] !== x) x = parent[x]; return x }
    const frames = [{ caption: "Start: every element is its own set, so everyone is a root (parent[i] = i).", view: view(parent, {}) }]
    const union = (a, b) => {
        const rootA = find(a)
        const rootB = find(b)
        if (rootA === rootB) return
        // attach the smaller tree under the bigger one (ties: b's root goes under a's)
        const [big, small] = size[rootA] >= size[rootB] ? [rootA, rootB] : [rootB, rootA]
        const uneven = size[big] !== size[small]
        parent[small] = big
        size[big] += size[small]
        frames.push({
            caption: `union(${a}, ${b}): the roots are ${rootA} and ${rootB}. Point root ${small} at root ${big}.${uneven ? ` Root ${big}'s tree was bigger, so the smaller tree goes under it and the result stays shallow.` : ""}`,
            view: view(parent, { [small]: "active", [`e${small}`]: "active", [big]: "done" }),
        })
    }
    union(0, 1)
    union(2, 3)
    union(1, 3)
    union(4, 5)
    frames.push({
        caption: "Two sets now: {0, 1, 2, 3} and {4, 5}. Two elements are connected exactly when find() gives the same root: find(3) = 0 and find(1) = 0, so 1 and 3 are connected; find(5) = 4, so 5 isn't connected to them.",
        view: view(parent, { 3: "active", 1: "active", 5: "bad" }),
    })
    return frames
}

export function Unions() {
    return (
        <Stepper
            title="union and find"
            frames={unionFrames()}
            legend={[{ s: "found", label: "root (parent is itself)" }, { s: "active", label: "just linked" }, { s: "done", label: "the root it joined" }]}
        />
    )
}

export function Compression() {
    const before = [0, 0, 1, 2, 3]
    const after = [0, 0, 0, 0, 0]
    return (
        <Figure caption="Path compression: find(4) walks 4 → 3 → 2 → 1 → 0 to reach the root. On the way back, point every node it passed DIRECTLY at the root. The next find on any of them is one step. Together with union by size, each operation costs almost O(1) on average (technically O(α(n)), which is at most 4 for any realistic n).">
            <div className="fig-row">
                <div>{view(before, { 4: "active", e4: "active", e3: "active", e2: "active", e1: "active" })}<div className="fig-sub">before: find(4) takes 4 steps</div></div>
                <div>{view(after, { 4: "done", 3: "done", 2: "done" })}<div className="fig-sub">after: everyone points at the root</div></div>
            </div>
        </Figure>
    )
}

export function Redundant() {
    const nodes = [
        { id: "1", x: 0, y: 0, s: "done" },
        { id: "2", x: 1.2, y: 0, s: "done" },
        { id: "3", x: 1.2, y: 1.2, s: "done" },
        { id: "4", x: 0, y: 1.2, s: "done" },
        { id: "5", x: 2.4, y: 0.6 },
    ]
    const edges = [
        { a: "1", b: "2", s: "done", label: "1" },
        { a: "2", b: "3", s: "done", label: "2" },
        { a: "3", b: "4", s: "done", label: "3" },
        { a: "4", b: "1", s: "bad", label: "4: redundant" },
        { a: "2", b: "5", label: "5" },
    ]
    return (
        <Figure
            caption="Redundant Connection: add edges one at a time with union. Edges 1 to 3 each join two different sets. Edge 4 connects 4 and 1, but find(4) and find(1) already return the same root: they're connected through 2 and 3. Adding it would close a loop, so it's the answer."
            legend={[{ s: "done", label: "already one set" }, { s: "bad", label: "both ends in the same set: makes a cycle" }]}
        >
            <GraphViz nodes={nodes} edges={edges} unit={100} label="redundant connection" />
        </Figure>
    )
}
