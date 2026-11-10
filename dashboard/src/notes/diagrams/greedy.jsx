import { ArrayViz, IntervalsViz, Figure, Stepper } from "../kit"

export function GreedyFails() {
    return (
        <Figure
            caption="Greedy isn't always right. Make 6 from coins [1, 3, 4]. 'Take the biggest coin that fits' grabs 4, then 1, then 1: three coins. The real best is 3 + 3: two coins. Taking the 4 felt best in the moment but ruled out the better answer. Coin Change needs DP; greedy only works when I can argue that the local choice never hurts."
            legend={[{ s: "bad", label: "greedy: 3 coins" }, { s: "done", label: "optimal: 2 coins" }]}
        >
            <div style={{ width: "fit-content", margin: "0 auto" }}>
                <ArrayViz items={[4, 1, 1]} title="greedy " align="left" showIndex={false} states={{ 0: "bad", 1: "bad", 2: "bad" }} />
                <ArrayViz items={[3, 3]} title="optimal" align="left" showIndex={false} states={{ 0: "done", 1: "done" }} />
            </div>
        </Figure>
    )
}

// 435. Non-overlapping Intervals: sort by END, keep every interval that starts after the last kept one ends
const IVS = [
    { s: 1, e: 3 }, { s: 2, e: 4 }, { s: 3, e: 5 }, { s: 1, e: 6 }, { s: 5, e: 7 }, { s: 6, e: 9 }, { s: 8, e: 10 },
]

function scheduleFrames() {
    const sorted = [...IVS].sort((a, b) => a.e - b.e)
    const status = sorted.map(() => undefined)
    const frames = []
    let end = -Infinity
    const snap = (caption, mark) => frames.push({
        caption,
        view: (
            <IntervalsViz
                intervals={sorted.map((iv, k) => ({ ...iv, state: status[k] || "window" }))}
                range={[0, 11]}
                marks={end > -Infinity ? [{ x: end, label: `last end = ${end}`, s: "found" }] : mark ? [mark] : []}
                label="interval scheduling"
            />
        ),
    })
    snap("Sorted by END time. Picking the interval that ends earliest leaves the most room for everything after it.")
    sorted.forEach((iv, k) => {
        if (iv.s >= end) {
            status[k] = "done"
            end = iv.e
            snap(`[${iv.s},${iv.e}] starts at or after the last kept end, so keep it. The line moves to ${iv.e}.`)
        } else {
            status[k] = "muted"
            snap(`[${iv.s},${iv.e}] starts before ${end}, so it overlaps something we kept: remove it.`)
        }
    })
    const removed = status.filter(s => s === "muted").length
    frames[frames.length - 1].caption += ` Kept ${sorted.length - removed}, removed ${removed}: that's the minimum removals.`
    return frames
}

export function Schedule() {
    return (
        <Stepper
            title="435. Non-overlapping Intervals"
            frames={scheduleFrames()}
            legend={[{ s: "done", label: "kept" }, { s: "muted", label: "removed" }, { s: "window", label: "not decided yet" }]}
        />
    )
}

function jumpFrames() {
    const nums = [2, 3, 1, 1, 0, 4]
    const frames = []
    let reach = 0
    for (let i = 0; i < nums.length; i++) {
        if (i > reach) {
            frames.push({
                caption: `Index ${i} is past the farthest reachable index (${reach}). Stuck: the answer is False.`,
                view: <ArrayViz items={nums} states={Object.fromEntries(nums.map((_, k) => [k, k <= reach ? "window" : k === i ? "bad" : "default"]))} ranges={[{ from: 0, to: reach, label: `reach = ${reach}`, color: "violet" }]} pointers={[{ i, label: "i" }]} />,
            })
            return frames
        }
        const before = reach
        reach = Math.max(reach, i + nums[i])
        frames.push({
            caption: `Index ${i} is reachable. From here I can jump up to ${nums[i]}, reaching ${i + nums[i]}. Farthest reach ${reach > before ? `grows to ${reach}` : `stays ${reach}`}.${reach >= nums.length - 1 ? " That covers the last index: True." : ""}`,
            view: (
                <ArrayViz
                    items={nums}
                    states={Object.fromEntries(nums.map((_, k) => [k, k === i ? "active" : k <= reach ? "window" : "default"]))}
                    ranges={[{ from: 0, to: Math.min(reach, nums.length - 1), label: `reach = ${reach}`, color: "violet" }]}
                    pointers={[{ i, label: "i" }]}
                />
            ),
        })
        if (reach >= nums.length - 1) break
    }
    return frames
}

export function JumpGame() {
    return (
        <Stepper
            title="55. Jump Game on [2, 3, 1, 1, 0, 4]"
            frames={jumpFrames()}
            legend={[{ s: "active", label: "current index" }, { s: "window", label: "reachable so far" }]}
        />
    )
}

export function PartitionLabels() {
    const s = "ababcbacadefegdehijhklij".split("")
    const last = {}
    s.forEach((ch, i) => { last[ch] = i })
    const parts = [[0, 8], [9, 15], [16, 23]]
    const states = {}
    parts.forEach(([a, b], k) => { for (let i = a; i <= b; i++) states[i] = ["active", "found", "window"][k] })
    return (
        <Figure
            caption={'Partition Labels: each letter must live in exactly one part. Record the LAST index of every letter, then scan: a part must stretch at least to the last occurrence of every letter inside it. When the scan reaches that stretched end, cut. "a" last appears at 8, so the first part is at least 0..8, and nothing inside pushes it further.'}
            legend={[{ s: "active", label: "part 1 (9 letters)" }, { s: "found", label: "part 2 (7)" }, { s: "window", label: "part 3 (8)" }]}
        >
            <ArrayViz items={s} cell={26} states={states} showIndex={false} ranges={parts.map(([a, b]) => ({ from: a, to: b, label: `${b - a + 1}`, color: "green" }))} />
        </Figure>
    )
}
