import { ArrayViz, Figure, Stepper } from "../kit"

export function IndexAccess() {
    return (
        <Figure
            caption="An array is one block of memory. The address of nums[i] is start + i × size, so reading any index is one multiplication away: O(1), no matter how long the array is."
            legend={[{ s: "active", label: "nums[3], found directly" }]}
        >
            <ArrayViz items={[8, 3, 5, 9, 1, 6, 2]} title="nums" states={{ 3: "active" }} pointers={[{ i: 3, label: "nums[3]" }]} />
        </Figure>
    )
}

export function InsertShift() {
    // insert 7 at index 2 of [4, 1, 9, 3, 5]: everything from index 2 onward moves one slot right, starting from the end
    const frames = [
        { items: [4, 1, 9, 3, 5, ""], states: { 5: "muted" }, caption: "Insert 7 at index 2. Python's list grows by one slot at the end first." },
        { items: [4, 1, 9, 3, 5, 5], states: { 4: "found", 5: "active" }, caption: "Shift from the back so nothing gets overwritten: 5 moves right." },
        { items: [4, 1, 9, 3, 3, 5], states: { 3: "found", 4: "active" }, caption: "3 moves right." },
        { items: [4, 1, 9, 9, 3, 5], states: { 2: "found", 3: "active" }, caption: "9 moves right. Index 2 is now free." },
        { items: [4, 1, 7, 9, 3, 5], states: { 2: "done" }, caption: "Write 7. Every element after the insert point moved, so insert(i, x) is O(n). Same for pop(i) and del nums[i]." },
    ]
    return (
        <Stepper
            title="nums.insert(2, 7)"
            frames={frames.map(f => ({ caption: f.caption, view: <ArrayViz items={f.items} states={f.states} title="nums" /> }))}
            legend={[{ s: "found", label: "copied from" }, { s: "active", label: "copied to" }, { s: "done", label: "inserted" }]}
        />
    )
}

// Move Zeroes: read pointer r scans everything, write pointer w marks where the next non zero belongs
function moveZeroesFrames() {
    const nums = [0, 1, 0, 3, 12]
    const frames = []
    let w = 0
    const snap = (r, caption) => frames.push({
        caption,
        view: (
            <ArrayViz
                items={[...nums]}
                title="nums"
                states={Object.fromEntries(nums.map((_, i) => [i, i < w ? "done" : i === r ? "active" : "default"]))}
                pointers={[...(r < nums.length ? [{ i: r, label: "r", color: "blue" }] : []), { i: Math.min(w, nums.length - 1), label: w < nums.length ? "w" : "w (end)", color: "green" }]}
            />
        ),
    })
    snap(0, "w marks the next slot for a non zero value. r reads every value once.")
    for (let r = 0; r < nums.length; r++) {
        if (nums[r] !== 0) {
            ;[nums[w], nums[r]] = [nums[r], nums[w]]
            w++
            snap(r, `nums[r] is non zero, so swap it into slot w and move w forward. Everything left of w is finished.`)
        } else {
            snap(r, `nums[r] is 0, skip it. w stays put, waiting for the next non zero.`)
        }
    }
    snap(nums.length, "r reached the end. All non zeros kept their order on the left, zeros ended up on the right. One pass, O(1) extra space.")
    return frames
}

export function WritePointer() {
    return (
        <Stepper
            title="283. Move Zeroes with a read and write pointer"
            frames={moveZeroesFrames()}
            legend={[{ s: "done", label: "finished (left of w)" }, { s: "active", label: "r is reading" }]}
        />
    )
}

// Kadane: best sum of a subarray ending at i is either nums[i] alone or nums[i] + best ending at i - 1
function kadaneFrames() {
    const nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]
    const frames = []
    let cur = 0
    let best = -Infinity
    let start = 0
    let bestRange = [0, 0]
    const ending = []
    for (let i = 0; i < nums.length; i++) {
        const restart = cur + nums[i] < nums[i]
        if (restart) { cur = nums[i]; start = i } else cur += nums[i]
        ending.push(cur)
        if (cur > best) { best = cur; bestRange = [start, i] }
        frames.push({
            caption: i === 0
                ? `i = 0: the only subarray ending here is [${nums[0]}]. cur = ${cur}, best = ${best}`
                : restart
                ? `i = ${i}: the running sum would be ${ending[i - 1] ?? 0} + ${nums[i]}, worse than ${nums[i]} alone, so start fresh at i. best = ${best}`
                : `i = ${i}: extend the current subarray. cur = ${cur}, best = ${best}`,
            view: (
                <div>
                    <ArrayViz
                        items={nums}
                        title="nums"
                        states={Object.fromEntries(nums.map((_, k) => [k, k === i ? "active" : k >= start && k < i ? "window" : "default"]))}
                        ranges={[{ from: bestRange[0], to: bestRange[1], label: `best = ${best}`, color: "green" }]}
                    />
                    <ArrayViz items={nums.map((_, k) => (k < ending.length ? ending[k] : ""))} title="cur" showIndex={false} states={{ [i]: "active" }} />
                </div>
            ),
        })
    }
    return frames
}

export function Kadane() {
    return (
        <Stepper
            title="53. Maximum Subarray (Kadane's algorithm)"
            frames={kadaneFrames()}
            legend={[{ s: "active", label: "current index" }, { s: "window", label: "current subarray" }, { color: "green", label: "best so far" }]}
        />
    )
}

export function ProductExceptSelf() {
    const nums = [1, 2, 3, 4]
    const left = [1, 1, 2, 6]
    const right = [24, 12, 4, 1]
    const answer = [24, 12, 8, 6]
    return (
        <Figure
            caption="answer[i] = (product of everything left of i) × (product of everything right of i). For i = 2: left is 1 × 2 = 2, right is 4, so answer[2] = 8. No division needed."
            legend={[{ s: "window", label: "left part" }, { s: "found", label: "right part" }, { s: "done", label: "answer[2]" }]}
        >
            <div>
                <ArrayViz items={nums} title="nums  " states={{ 0: "window", 1: "window", 3: "found" }} />
                <ArrayViz items={left} title="left  " showIndex={false} states={{ 2: "window" }} />
                <ArrayViz items={right} title="right " showIndex={false} states={{ 2: "found" }} />
                <ArrayViz items={answer} title="answer" showIndex={false} states={{ 2: "done" }} />
            </div>
        </Figure>
    )
}
