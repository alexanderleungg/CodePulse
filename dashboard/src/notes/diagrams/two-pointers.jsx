import { ArrayViz, GridViz, BarsViz, Figure, Stepper } from "../kit"

const NUMS = [1, 3, 4, 6, 8, 11]
const TARGET = 10

// every cell (i, j) with i < j is one pair. each pointer move rules out a whole row or column of pairs
function pairGrid(l, r, dead) {
    const n = NUMS.length
    const grid = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (j > i ? NUMS[i] + NUMS[j] : "")))
    const states = {}
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (j <= i) states[`${i},${j}`] = "muted"
            else if (dead(i, j)) states[`${i},${j}`] = "muted"
        }
    }
    states[`${l},${r}`] = NUMS[l] + NUMS[r] === TARGET ? "done" : "active"
    return <GridViz grid={grid} states={states} rowHeaders={NUMS} colHeaders={NUMS} cell={40} label="all pairs" />
}

function twoSumFrames() {
    const frames = []
    let l = 0
    let r = NUMS.length - 1
    const ruled = [] // functions (i, j) => bool for pairs already eliminated
    const dead = (i, j) => ruled.some(f => f(i, j))
    const snap = caption => frames.push({
        caption,
        view: (
            <div className="fig-row">
                <ArrayViz items={NUMS} states={{ [l]: "active", [r]: "active" }} pointers={[{ i: l, label: "L" }, { i: r, label: "R", color: "violet" }]} />
                {pairGrid(l, r, dead)}
            </div>
        ),
    })
    snap(`Sorted input, target ${TARGET}. The grid shows every pair's sum; L and R start at the smallest and largest.`)
    while (l < r) {
        const s = NUMS[l] + NUMS[r]
        if (s === TARGET) { snap(`${NUMS[l]} + ${NUMS[r]} = ${TARGET}. Found it.`); break }
        if (s > TARGET) {
            const rr = r
            ruled.push((i, j) => j === rr)
            r--
            snap(`${s} is too big. ${NUMS[rr]} plus even the smallest remaining number is too big, so no pair using ${NUMS[rr]} can work: the whole column is ruled out. Move R left.`)
        } else {
            const ll = l
            ruled.push(i => i === ll)
            l++
            snap(`${s} is too small. ${NUMS[ll]} plus even the largest remaining number is too small, so the whole row for ${NUMS[ll]} is ruled out. Move L right.`)
        }
    }
    return frames
}

export function WhyItWorks() {
    return (
        <Stepper
            title="167. Two Sum II: why moving a pointer is safe"
            frames={twoSumFrames()}
            legend={[{ s: "active", label: "the pair being checked" }, { s: "muted", label: "ruled out" }, { s: "done", label: "answer" }]}
        />
    )
}

function containerFrames() {
    const h = [1, 8, 6, 2, 5, 4, 8, 3, 7]
    const frames = []
    let l = 0
    let r = h.length - 1
    let best = 0
    while (l < r) {
        const area = Math.min(h[l], h[r]) * (r - l)
        best = Math.max(best, area)
        const moveLeft = h[l] < h[r]
        frames.push({
            caption: `width ${r - l} × height min(${h[l]}, ${h[r]}) = ${area}. best = ${best}. The ${moveLeft ? "left" : "right"} wall is shorter, and a narrower container can't beat it with that same short wall, so move ${moveLeft ? "L right" : "R left"}.`,
            view: (
                <BarsViz
                    values={h}
                    band={{ from: l, to: r, height: Math.min(h[l], h[r]), label: `area ${area}` }}
                    states={{ [l]: "found", [r]: "window" }}
                    pointers={[{ i: l, label: "L" }, { i: r, label: "R", color: "violet" }]}
                    unit={20}
                />
            ),
        })
        if (moveLeft) l++
        else r--
    }
    frames[frames.length - 1].caption += " The pointers met. Answer: 49."
    return frames
}

export function Container() {
    return (
        <Stepper
            title="11. Container With Most Water"
            frames={containerFrames()}
            legend={[{ s: "found", label: "left wall" }, { s: "window", label: "right wall" }, { color: "blue", label: "water held (inner bars don't block it)" }]}
        />
    )
}

export function MergeFromBack() {
    return (
        <Figure
            caption="Merge Sorted Array: nums1 has empty slots at the end. Fill from the BACK with the larger of the two last values. Writing at the end never overwrites a value I still need, so no extra array is required."
            legend={[{ s: "active", label: "compared" }, { s: "done", label: "already placed" }, { s: "muted", label: "empty slots" }]}
        >
            <div style={{ width: "fit-content", margin: "0 auto" }}>
                <ArrayViz items={[1, 2, 3, "", "", 6]} title="nums1" align="left" states={{ 2: "active", 3: "muted", 4: "muted", 5: "done" }} pointers={[{ i: 2, label: "i" }, { i: 4, label: "write", color: "green" }]} />
                <ArrayViz items={[2, 5, 6]} title="nums2" align="left" states={{ 1: "active", 2: "done" }} pointers={[{ i: 1, label: "j", color: "violet" }]} />
            </div>
        </Figure>
    )
}
