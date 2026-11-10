import { TreeViz, ArrayViz, GraphViz, Figure, Stepper } from "../kit"

const fmt = path => `[${path.join(",")}]`

// the full permutation decision tree for nums, every node labelled with its path so far
function permTree(nums, path = [], color = () => ({})) {
    const node = { v: fmt(path), ...color(path) }
    if (path.length === nums.length) return { ...node, children: [] }
    node.children = nums
        .filter(x => !path.includes(x))
        .map(x => ({ ...permTree(nums, [...path, x], color), edge: `+${x}` }))
    return node
}

export function PermutationTree() {
    const tree = permTree([1, 2, 3], [], path => (path.length === 3 ? { s: "done" } : {}))
    return (
        <Figure
            caption="Every root to leaf path is one permutation. The label on each edge is the choice made; the label on each node is the path so far."
            legend={[{ s: "done", label: "leaf = complete answer, saved to res" }]}
        >
            <TreeViz root={tree} binary={false} dx={84} dy={78} label="permutation decision tree for [1,2,3]" />
        </Figure>
    )
}

// simulate backtrack() on [1,2,3] and record a frame for every choose / save / undo,
// stopping once the search is back at the root after finishing the "1" branch
function permutationFrames() {
    const nums = [1, 2, 3]
    const frames = []
    const saved = []
    const path = []
    const used = [false, false, false]
    let done = false

    const snapshot = caption => {
        const onPath = p => p.length <= path.length && p.every((x, i) => x === path[i])
        const tree = permTree(nums, [], p => {
            const key = fmt(p)
            if (saved.includes(key)) return { s: "done", es: onPath(p) ? "active" : "done" }
            if (onPath(p)) return { s: "active", es: "active" }
            return { s: "muted" }
        })
        frames.push({
            caption,
            view: (
                <div>
                    <TreeViz root={tree} binary={false} dx={84} dy={74} label="decision tree" />
                    <div className="fig-row" style={{ marginTop: 8 }}>
                        <ArrayViz items={path.length ? [...path] : ["-"]} title="path" showIndex={false} states={Object.fromEntries(path.map((_, i) => [i, "active"]))} />
                        <ArrayViz items={used.map(u => (u ? "T" : "F"))} title="used" showIndex={false} states={Object.fromEntries(used.map((u, i) => [i, u ? "found" : "default"]))} />
                        <ArrayViz items={saved.length ? [...saved] : ["-"]} title="res" showIndex={false} cell={62} states={Object.fromEntries(saved.map((_, i) => [i, "done"]))} />
                    </div>
                </div>
            ),
        })
    }

    snapshot("Start at the root: path is empty, nothing is used.")
    const backtrack = () => {
        if (done) return
        if (path.length === nums.length) {
            saved.push(fmt(path))
            snapshot(`End condition: path has 3 numbers, so save a copy ${fmt(path)} to res.`)
            return
        }
        for (let i = 0; i < nums.length; i++) {
            if (used[i] || done) continue
            path.push(nums[i]); used[i] = true
            snapshot(`Choose ${nums[i]}: walk down the edge. path = ${fmt(path)}, used[${i}] = True.`)
            backtrack()
            if (done) return
            path.pop(); used[i] = false
            snapshot(`Undo ${nums[i]}: walk back up the edge. path = ${fmt(path)}, used[${i}] = False.`)
            if (path.length === 0) {
                done = true
                frames[frames.length - 1].caption += " The branch starting with 1 is done. The same thing now repeats for 2 and 3."
            }
        }
    }
    backtrack()
    return frames
}

export function PermutationSteps() {
    return (
        <Stepper
            title="backtrack() on [1, 2, 3], first branch"
            frames={permutationFrames()}
            legend={[
                { s: "active", label: "current path" },
                { s: "done", label: "saved answer" },
                { s: "found", label: "used[i] = True" },
            ]}
        />
    )
}

export function ChooseUndo() {
    return (
        <Figure caption="The choose and undo lines wrap the recursive call. Choosing walks down one edge, undoing walks back up the same edge, so the path is exactly what it was before the loop tried this option.">
            <GraphViz
                directed
                unit={190}
                r={26}
                nodes={[
                    { id: "a", v: "[1]", x: 0, y: 0, s: "active", note: "before" },
                    { id: "b", v: "[1,2]", x: 1.4, y: 0, s: "active", note: "after choosing 2" },
                ]}
                edges={[
                    { a: "a", b: "b", curve: -38, label: "path.append(2)", s: "done" },
                    { a: "b", b: "a", curve: -38, label: "path.pop()", s: "bad" },
                ]}
                label="choose and undo along one edge"
            />
        </Figure>
    )
}

// subsets: children only use elements AFTER the last one picked (the `start` index)
function subsetTree(nums, start = 0, path = [], color = () => ({})) {
    return {
        v: fmt(path),
        ...color(path),
        children: nums.slice(start).map((x, k) => ({
            ...subsetTree(nums, start + k + 1, [...path, x], color),
            edge: `+${x}`,
        })),
    }
}

export function SubsetTree() {
    return (
        <Figure
            caption="Subsets of [1, 2, 3]. Every node is an answer, not just the leaves. Each node only offers numbers to the right of its last pick, which is why [2,1] never appears."
            legend={[{ s: "done", label: "every node is saved" }]}
        >
            <TreeViz root={subsetTree([1, 2, 3], 0, [], () => ({ s: "done" }))} binary={false} dx={76} dy={74} label="subset tree" />
        </Figure>
    )
}

export function CombinationTree() {
    return (
        <Figure
            caption="Combinations of size k = 2 from [1, 2, 3, 4]: the same tree as subsets, but only nodes at depth 2 are saved. The search stops there, so deeper nodes are never built."
            legend={[{ s: "done", label: "depth k: save and return" }, { s: "muted", label: "never visited" }]}
        >
            <TreeViz
                root={subsetTree([1, 2, 3, 4], 0, [], p => (p.length === 2 ? { s: "done" } : p.length > 2 ? { s: "muted" } : {}))}
                binary={false}
                dx={64}
                dy={70}
                label="combination tree"
            />
        </Figure>
    )
}

export function DuplicateSkip() {
    // subsets of [1, 2, 2]: at the same level, a second 2 would build exactly the same subtree as the first 2
    const tree = {
        v: "[]",
        children: [
            {
                v: "[1]", edge: "+1", children: [
                    { v: "[1,2]", edge: "+2", children: [{ v: "[1,2,2]", edge: "+2", children: [] }] },
                    { v: "[1,2]", edge: "+2 again", s: "bad", es: "bad", children: [] },
                ],
            },
            { v: "[2]", edge: "+2", children: [{ v: "[2,2]", edge: "+2", children: [] }] },
            { v: "[2]", edge: "+2 again", s: "bad", es: "bad", children: [] },
        ],
    }
    return (
        <Figure
            caption="Subsets of the sorted list [1, 2, 2]. Two siblings that pick the same value grow identical subtrees, so the second one is skipped. Going deeper with a second 2, like [2] to [2,2], is fine because that is a different level."
            legend={[{ s: "bad", label: "skipped: same value as the sibling before it" }]}
        >
            <TreeViz root={tree} binary={false} dx={82} dy={74} label="duplicate pruning" />
        </Figure>
    )
}
