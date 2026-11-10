import { ArrayViz, Figure, Stepper } from "../kit"

function exactFrames() {
    const nums = [1, 3, 5, 7, 9, 11, 13, 15, 17]
    const target = 13
    const frames = []
    let lo = 0
    let hi = nums.length - 1
    while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2)
        const v = nums[mid]
        const view = (
            <ArrayViz
                items={nums}
                states={Object.fromEntries(nums.map((_, k) => [k, k < lo || k > hi ? "muted" : k === mid ? (v === target ? "done" : "active") : "window"]))}
                pointers={[{ i: lo, label: "lo", color: "green" }, { i: mid, label: "mid" }, { i: hi, label: "hi", color: "violet" }]}
            />
        )
        if (v === target) {
            frames.push({ view, caption: `nums[mid] = ${v}: found ${target} at index ${mid}. ${frames.length + 1} checks for ${nums.length} numbers; a million numbers would take about 20.` })
            break
        }
        frames.push({
            view,
            caption: v < target
                ? `nums[${mid}] = ${v} < ${target}. The target can't be at mid or anywhere left of it, so lo = mid + 1. Half the range is gone.`
                : `nums[${mid}] = ${v} > ${target}. The target can't be at mid or anywhere right of it, so hi = mid - 1.`,
        })
        if (v < target) lo = mid + 1
        else hi = mid - 1
    }
    return frames
}

export function Exact() {
    return (
        <Stepper
            title="Searching for 13"
            frames={exactFrames()}
            legend={[{ s: "window", label: "still possible" }, { s: "active", label: "mid" }, { s: "muted", label: "ruled out" }]}
        />
    )
}

function lowerFrames() {
    const nums = [1, 2, 2, 2, 3, 5]
    const target = 2
    const frames = []
    let lo = 0
    let hi = nums.length
    const view = mid => (
        <ArrayViz
            items={[...nums, "end"]}
            states={Object.fromEntries([...nums, 0].map((_, k) => [k, k === nums.length ? "muted" : k < lo || k >= hi ? "muted" : k === mid ? "active" : "window"]))}
            pointers={[{ i: lo, label: "lo", color: "green" }, ...(mid !== undefined ? [{ i: mid, label: "mid" }] : []), { i: hi, label: "hi", color: "violet" }]}
        />
    )
    frames.push({ caption: "Find the FIRST index where nums[i] >= 2. The answer might be len(nums) (nothing is big enough), so hi starts at len(nums), one past the end.", view: view() })
    while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2)
        if (nums[mid] < target) {
            frames.push({ caption: `nums[${mid}] = ${nums[mid]} < ${target}: too small, the answer is to the right. lo = mid + 1.`, view: view(mid) })
            lo = mid + 1
        } else {
            frames.push({ caption: `nums[${mid}] = ${nums[mid]} >= ${target}: mid COULD be the answer, so keep it: hi = mid (not mid - 1).`, view: view(mid) })
            hi = mid
        }
    }
    frames.push({
        caption: `lo == hi == ${lo}: the range has shrunk to one spot, the first 2. This template never skips a possible answer and always ends.`,
        view: <ArrayViz items={[...nums, "end"]} states={{ [lo]: "done", 6: "muted" }} pointers={[{ i: lo, label: "lo = hi", color: "green" }]} />,
    })
    return frames
}

export function LowerBound() {
    return (
        <Stepper
            title="Lower bound: first index with nums[i] >= 2"
            frames={lowerFrames()}
            legend={[{ s: "window", label: "answer is somewhere in here" }, { s: "active", label: "mid" }, { s: "done", label: "answer" }]}
        />
    )
}

export function OnAnswer() {
    // Koko: piles [3, 6, 7, 11], h = 8. can she finish at speed k? false for k < 4, true for k >= 4
    const piles = [3, 6, 7, 11]
    const h = 8
    const speeds = Array.from({ length: 11 }, (_, i) => i + 1)
    const hours = k => piles.reduce((sum, p) => sum + Math.ceil(p / k), 0)
    return (
        <Figure
            caption={`Binary search on the answer. For Koko Eating Bananas (piles [3, 6, 7, 11], h = 8), ask "can she finish at speed k?" for every k. Slow speeds fail and fast speeds work, and once it works it keeps working. That sorted false...true pattern is all binary search needs: find the first true. Here that's k = 4 (${hours(4)} hours).`}
            legend={[{ s: "bad", label: "too slow" }, { s: "done", label: "fast enough" }, { s: "found", label: "the answer: first true" }]}
        >
            <div style={{ width: "fit-content", margin: "0 auto" }}>
                <ArrayViz items={speeds} title="speed k  " align="left" showIndex={false} cell={40} states={Object.fromEntries(speeds.map(k => [k - 1, k === 4 ? "found" : hours(k) <= h ? "done" : "bad"]))} />
                <ArrayViz items={speeds.map(hours)} title="hours    " align="left" showIndex={false} cell={40} />
                <ArrayViz items={speeds.map(k => (hours(k) <= h ? "T" : "F"))} title="ok (<= 8)" align="left" showIndex={false} cell={40} states={Object.fromEntries(speeds.map(k => [k - 1, k === 4 ? "found" : hours(k) <= h ? "done" : "bad"]))} />
            </div>
        </Figure>
    )
}

export function Rotated() {
    return (
        <Figure
            caption="A rotated sorted array is two sorted runs. Whatever mid lands on, at least ONE half (lo..mid or mid..hi) is fully sorted. Check whether the target falls inside that sorted half's range: if yes search there, if no search the other half."
            legend={[{ s: "done", label: "sorted half: nums[lo] <= nums[mid]" }, { s: "window", label: "the other half (contains the rotation point)" }, { s: "active", label: "mid" }]}
        >
            <ArrayViz
                items={[4, 5, 6, 7, 0, 1, 2]}
                states={{ 0: "done", 1: "done", 2: "done", 3: "active", 4: "window", 5: "window", 6: "window" }}
                pointers={[{ i: 0, label: "lo", color: "green" }, { i: 3, label: "mid" }, { i: 6, label: "hi", color: "violet" }]}
                ranges={[{ from: 0, to: 3, label: "4..7 sorted", color: "green" }, { from: 4, to: 6, label: "0..2", color: "violet" }]}
            />
        </Figure>
    )
}
