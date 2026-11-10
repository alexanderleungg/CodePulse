import { TreeViz, ArrayViz, Figure, Stepper, bt, mapTree } from "../kit"

// a min heap is a complete binary tree stored level by level in a list
function heapView(arr, states = {}, caption) {
    const root = bt(arr)
    // tag every tree node with its list index so the tree and the list share colors
    const tag = (node, i) => {
        if (!node) return null
        return { ...node, s: states[i], badge: i, badgeColor: "#a8a8b0", children: [tag(node.children[0], 2 * i + 1), tag(node.children[1], 2 * i + 2)] }
    }
    const tree = tag(root, 0)
    return {
        caption,
        view: (
            <div className="fig-row">
                <TreeViz root={tree} dx={42} label="heap as a tree" />
                <ArrayViz items={arr} states={states} title="list" cell={36} />
            </div>
        ),
    }
}

export function Layout() {
    const arr = [1, 3, 2, 7, 4, 5, 9]
    const f = heapView(arr, { 1: "active", 3: "found", 4: "found", 0: "window" })
    return (
        <Figure
            caption="The heap is a tree on paper but a plain list in memory, filled level by level. The small grey numbers are list indexes. For the node at index i: children are at 2i + 1 and 2i + 2, the parent is at (i - 1) // 2. Here index 1 (value 3) has children at 3 and 4 and its parent at 0."
            legend={[{ s: "active", label: "i = 1" }, { s: "found", label: "children 2i+1, 2i+2" }, { s: "window", label: "parent (i-1)//2" }]}
        >
            {f.view}
        </Figure>
    )
}

function pushFrames() {
    const arr = [2, 4, 3, 7, 8, 5]
    const frames = []
    arr.push(1)
    let i = arr.length - 1
    frames.push(heapView([...arr], { [i]: "active" }, "heappush(1): put it at the end of the list (the next open spot in the bottom level)."))
    while (i > 0) {
        const p = Math.floor((i - 1) / 2)
        if (arr[p] <= arr[i]) break
        ;[arr[p], arr[i]] = [arr[i], arr[p]]
        frames.push(heapView([...arr], { [p]: "active", [i]: "found" }, `${arr[p]} is smaller than its parent ${arr[i]}, so swap them ("sift up").`))
        i = p
    }
    frames[frames.length - 1].caption += " It reached the root. At most one swap per level: O(log n)."
    return frames
}

export function Push() {
    return <Stepper title="heappush: sift up" frames={pushFrames()} legend={[{ s: "active", label: "the new value" }, { s: "found", label: "swapped down" }]} />
}

function popFrames() {
    const arr = [1, 3, 2, 7, 4, 5, 9]
    const frames = []
    frames.push(heapView([...arr], { 0: "done" }, "heappop(): the smallest is always at index 0. Take it."))
    const last = arr.pop()
    arr[0] = last
    frames.push(heapView([...arr], { 0: "active" }, `Move the last value (${last}) to the root to keep the tree complete. Now the root is too big.`))
    let i = 0
    while (true) {
        const l = 2 * i + 1
        const r = 2 * i + 2
        let small = i
        if (l < arr.length && arr[l] < arr[small]) small = l
        if (r < arr.length && arr[r] < arr[small]) small = r
        if (small === i) break
        ;[arr[i], arr[small]] = [arr[small], arr[i]]
        frames.push(heapView([...arr], { [small]: "active", [i]: "found" }, `Swap with the SMALLER child (${arr[i]}), so the new parent is smaller than both children ("sift down").`))
        i = small
    }
    frames[frames.length - 1].caption += " No child is smaller now, so the heap is valid again: O(log n)."
    return frames
}

export function Pop() {
    return <Stepper title="heappop: sift down" frames={popFrames()} legend={[{ s: "done", label: "removed min" }, { s: "active", label: "the value sinking" }, { s: "found", label: "smaller child moved up" }]} />
}

export function TopK() {
    return (
        <Figure
            caption="The 3 largest of a stream: keep a MIN heap of size 3. Its root is the smallest of the current top 3, the one most likely to be kicked out. A new value only gets in if it beats that root. Each step is O(log k), so the whole thing is O(n log k), better than sorting when k is small."
            legend={[{ s: "found", label: "root: the weakest of the top 3" }, { s: "done", label: "the top 3 so far" }]}
        >
            <div className="fig-row">
                <div>
                    <ArrayViz items={[5, 1, 9, 3, 7, 6, 2]} title="stream" states={{ 2: "done", 4: "done", 5: "done", 0: "muted", 1: "muted", 3: "muted", 6: "muted" }} />
                    <div className="fig-sub">after the whole stream: 9, 7, 6 are in; 5 got pushed out by 6, and the rest never beat the root</div>
                </div>
                <TreeViz root={mapTree(bt([6, 9, 7]), n => ({ ...n, s: n.v === "6" ? "found" : "done" }))} label="size 3 min heap" />
            </div>
        </Figure>
    )
}

export function TwoHeaps() {
    return (
        <Figure
            caption="Running median with two heaps. A MAX heap holds the smaller half (its top is the largest small value), a MIN heap holds the larger half (its top is the smallest large value). Keep their sizes within 1 of each other and the median is always sitting at one or both tops."
            legend={[{ s: "window", label: "small half (max heap)" }, { s: "active", label: "large half (min heap)" }, { s: "found", label: "the tops: the median lives here" }]}
        >
            <div className="fig-row">
                <div>
                    <TreeViz root={mapTree(bt([5, 2, 4, 1]), n => ({ ...n, s: n.v === "5" ? "found" : "window" }))} label="max heap of the small half" />
                    <div className="fig-sub">small half: 1 2 4 5</div>
                </div>
                <div>
                    <TreeViz root={mapTree(bt([7, 8, 9]), n => ({ ...n, s: n.v === "7" ? "found" : "active" }))} label="min heap of the large half" />
                    <div className="fig-sub">large half: 7 8 9</div>
                </div>
            </div>
            <div className="fig-sub">7 numbers, the small side has one extra: the median is its top, 5</div>
        </Figure>
    )
}
