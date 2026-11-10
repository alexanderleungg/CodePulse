import { ArrayViz, TreeViz, Figure, Stepper } from "../kit"

const fmt = a => `[${a.join(",")}]`

// the recursion tree of merge sort: split in half until single elements, then merge back up
function splitTree(arr) {
    const sorted = [...arr].sort((a, b) => a - b)
    if (arr.length === 1) return { v: fmt(arr), s: "active", children: [] }
    const mid = Math.floor(arr.length / 2)
    return {
        v: fmt(arr),
        note: `-> ${fmt(sorted)}`,
        noteColor: "green",
        children: [splitTree(arr.slice(0, mid)), splitTree(arr.slice(mid))],
    }
}

export function MergeSortTree() {
    return (
        <Figure
            caption="Merge sort splits the list in half until every piece has one element (already sorted), then merges pieces back together on the way up. The green text under each node is what that call returns. There are log n levels and each level does O(n) merging work, so O(n log n) total."
            legend={[{ s: "active", label: "one element: sorted by definition" }, { color: "green", label: "result after merging" }]}
        >
            <TreeViz root={splitTree([5, 2, 4, 6, 1, 3])} binary={false} dx={70} dy={84} label="merge sort recursion tree" />
        </Figure>
    )
}

function mergeFrames() {
    const a = [2, 4, 5]
    const b = [1, 3, 6]
    const out = []
    const frames = []
    let i = 0
    let j = 0
    const snap = caption => frames.push({
        caption,
        view: (
            <div style={{ width: "fit-content", margin: "0 auto" }}>
                <ArrayViz items={a} title="left " align="left" states={Object.fromEntries(a.map((_, k) => [k, k < i ? "muted" : k === i ? "active" : "default"]))} pointers={i < a.length ? [{ i, label: "i" }] : []} />
                <ArrayViz items={b} title="right" align="left" states={Object.fromEntries(b.map((_, k) => [k, k < j ? "muted" : k === j ? "active" : "default"]))} pointers={j < b.length ? [{ i: j, label: "j", color: "violet" }] : []} />
                <ArrayViz items={[...out, ...Array(6 - out.length).fill("")]} title="out  " align="left" showIndex={false} states={Object.fromEntries(out.map((_, k) => [k, k === out.length - 1 ? "done" : "window"]))} />
            </div>
        ),
    })
    snap("Both halves are already sorted. i and j point at the smallest remaining value in each.")
    while (i < a.length && j < b.length) {
        if (a[i] <= b[j]) { out.push(a[i]); i++; snap(`${a[i - 1]} <= ${b[j]}: take from the left.`) }
        else { out.push(b[j]); j++; snap(`${b[j - 1]} < ${a[i]}: take from the right.`) }
    }
    while (i < a.length) { out.push(a[i]); i++ }
    while (j < b.length) { out.push(b[j]); j++ }
    snap("One side ran out, so copy the rest of the other side. Each element was looked at once: merging is O(n).")
    return frames
}

export function MergeStep() {
    return (
        <Stepper
            title="Merging two sorted halves"
            frames={mergeFrames()}
            legend={[{ s: "active", label: "compared" }, { s: "done", label: "just placed" }]}
        />
    )
}

// Lomuto partition: everything smaller than the pivot is swapped into the region left of `store`
function partitionFrames() {
    const a = [3, 2, 1, 5, 6, 4]
    const hi = a.length - 1
    const pivot = a[hi]
    const frames = []
    let store = 0
    const snap = (j, caption) => frames.push({
        caption,
        view: (
            <ArrayViz
                items={[...a]}
                states={Object.fromEntries(a.map((_, k) => [k, k === hi && j <= hi - 1 ? "found" : k < store ? "done" : k === j ? "active" : k < j ? "bad" : "default"]))}
                pointers={[{ i: Math.min(store, hi), label: "store", color: "green" }, ...(j < hi ? [{ i: j, label: "j" }] : [])]}
            />
        ),
    })
    snap(0, `Pivot = last element = ${pivot}. store marks where the next "smaller than pivot" value goes.`)
    for (let j = 0; j < hi; j++) {
        if (a[j] < pivot) {
            ;[a[store], a[j]] = [a[j], a[store]]
            store++
            snap(j, `${a[store - 1]} < ${pivot}: swap it into the small side and move store right.`)
        } else {
            snap(j, `${a[j]} >= ${pivot}: leave it on the big side.`)
        }
    }
    ;[a[store], a[hi]] = [a[hi], a[store]]
    frames.push({
        caption: `Finally swap the pivot into slot store = ${store}. Now ${pivot} is exactly where it belongs in sorted order: everything left is smaller, everything right is bigger.`,
        view: <ArrayViz items={[...a]} states={Object.fromEntries(a.map((_, k) => [k, k < store ? "done" : k === store ? "found" : "bad"]))} pointers={[{ i: store, label: "pivot's final spot", color: "yellow" }]} />,
    })
    return frames
}

export function Partition() {
    return (
        <Stepper
            title="Partition around a pivot (quicksort and quickselect)"
            frames={partitionFrames()}
            legend={[{ s: "done", label: "< pivot" }, { s: "bad", label: ">= pivot" }, { s: "found", label: "pivot" }]}
        />
    )
}

function flagFrames() {
    const a = [2, 0, 2, 1, 1, 0]
    const frames = []
    let low = 0
    let mid = 0
    let high = a.length - 1
    const color = v => (v === 0 ? "bad" : v === 1 ? "default" : "active")
    const snap = caption => frames.push({
        caption,
        view: (
            <ArrayViz
                items={[...a]}
                states={Object.fromEntries(a.map((v, k) => [k, k < low || k > high ? color(v) : k === mid ? "found" : "muted"]))}
                pointers={[{ i: low, label: "low", color: "red" }, { i: Math.min(mid, a.length - 1), label: "mid", color: "yellow" }, { i: Math.max(high, 0), label: "high", color: "blue" }]}
            />
        ),
    })
    snap("0s go left of low, 2s go right of high, 1s stay between. mid scans the unknown middle part.")
    while (mid <= high) {
        if (a[mid] === 0) { ;[a[low], a[mid]] = [a[mid], a[low]]; low++; mid++; snap("a[mid] = 0: swap it to low, move low and mid right.") }
        else if (a[mid] === 1) { mid++; snap("a[mid] = 1: already in the middle zone, just move mid.") }
        else { ;[a[mid], a[high]] = [a[high], a[mid]]; high--; snap("a[mid] = 2: swap it to high and move high left. Don't move mid: the value swapped in hasn't been checked yet.") }
    }
    frames[frames.length - 1].caption += " mid passed high, so everything is placed. One pass, O(1) space."
    return frames
}

export function DutchFlag() {
    return (
        <Stepper
            title="75. Sort Colors (Dutch national flag)"
            frames={flagFrames()}
            legend={[{ s: "bad", label: "0" }, { s: "default", label: "1" }, { s: "active", label: "2" }, { s: "found", label: "mid, being checked" }]}
        />
    )
}
