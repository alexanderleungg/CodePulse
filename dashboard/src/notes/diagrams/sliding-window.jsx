import { ArrayViz, Stepper } from "../kit"

// 3. Longest Substring Without Repeating Characters on "abcabcbb"
function longestFrames() {
    const s = "abcabcbb".split("")
    const frames = []
    const inside = new Map()
    let left = 0
    let best = 0
    let bestRange = null
    const snap = (right, caption, bad) => frames.push({
        caption,
        view: (
            <div>
                <ArrayViz
                    items={s}
                    states={Object.fromEntries(s.map((_, i) => [i, i === bad ? "bad" : i >= left && i <= right ? "window" : i < left ? "muted" : "default"]))}
                    ranges={bestRange ? [{ from: bestRange[0], to: bestRange[1], label: `best = ${best}`, color: "green" }] : []}
                    pointers={[{ i: left, label: "left", color: "green" }, ...(right >= 0 ? [{ i: right, label: "right" }] : [])]}
                />
                <div className="fig-sub">window counts: {inside.size ? [...inside.entries()].map(([k, v]) => `${k}:${v}`).join("  ") : "empty"}</div>
            </div>
        ),
    })
    snap(-1, "The window is s[left..right]. Grow it by moving right; whenever a letter repeats, shrink from the left until it doesn't.")
    for (let right = 0; right < s.length; right++) {
        const ch = s[right]
        inside.set(ch, (inside.get(ch) || 0) + 1)
        if (inside.get(ch) > 1) {
            snap(right, `Add '${ch}'. Now '${ch}' appears twice, so the window is invalid.`, right)
            while (inside.get(ch) > 1) {
                const out = s[left]
                inside.set(out, inside.get(out) - 1)
                if (!inside.get(out)) inside.delete(out)
                left++
            }
            snap(right, `Shrink: move left past the old '${ch}'. Valid again with length ${right - left + 1}.`)
        } else {
            if (right - left + 1 > best) { best = right - left + 1; bestRange = [left, right] }
            snap(right, `Add '${ch}'. No repeats, window length ${right - left + 1}. best = ${best}.`)
        }
    }
    frames[frames.length - 1].caption += ` Each letter entered once and left at most once: O(n). Answer: ${best}.`
    return frames
}

export function LongestUnique() {
    return (
        <Stepper
            title={'3. Longest Substring Without Repeating Characters on "abcabcbb"'}
            frames={longestFrames()}
            legend={[{ s: "window", label: "the window" }, { s: "bad", label: "the repeat" }, { s: "muted", label: "already left the window" }]}
        />
    )
}

// 209. Minimum Size Subarray Sum: shortest window with sum >= target
function shortestFrames() {
    const nums = [2, 3, 1, 2, 4, 3]
    const target = 7
    const frames = []
    let left = 0
    let sum = 0
    let best = Infinity
    let bestRange = null
    const snap = (right, caption) => frames.push({
        caption,
        view: (
            <ArrayViz
                items={nums}
                states={Object.fromEntries(nums.map((_, i) => [i, i >= left && i <= right ? (sum >= target ? "done" : "window") : i < left ? "muted" : "default"]))}
                ranges={bestRange ? [{ from: bestRange[0], to: bestRange[1], label: `shortest = ${best}`, color: "green" }] : []}
                pointers={[{ i: left, label: "left", color: "green" }, { i: Math.max(right, 0), label: `right (sum ${sum})` }]}
            />
        ),
    })
    for (let right = 0; right < nums.length; right++) {
        sum += nums[right]
        if (sum < target) {
            snap(right, `Add ${nums[right]}. sum = ${sum} < ${target}: not valid yet, keep growing.`)
            continue
        }
        while (sum >= target) {
            if (right - left + 1 < best) { best = right - left + 1; bestRange = [left, right] }
            snap(right, `sum = ${sum} >= ${target}: valid, length ${right - left + 1}. Record it, then try shrinking from the left.`)
            sum -= nums[left]
            left++
        }
        snap(right, `After shrinking, sum = ${sum} < ${target} again. Go back to growing.`)
    }
    frames[frames.length - 1].caption += ` Answer: ${best} ([4, 3]).`
    return frames
}

export function ShortestValid() {
    return (
        <Stepper
            title="209. Minimum Size Subarray Sum, target = 7"
            frames={shortestFrames()}
            legend={[{ s: "window", label: "window, not valid yet" }, { s: "done", label: "window is valid" }]}
        />
    )
}

// fixed size k = 4: slide by adding the new right element and removing the old left one
function fixedFrames() {
    const nums = [1, 12, -5, -6, 50, 3]
    const k = 4
    const frames = []
    let sum = nums.slice(0, k).reduce((a, b) => a + b, 0)
    let best = sum
    frames.push({
        caption: `First window of size ${k}: sum = ${sum}.`,
        view: <ArrayViz items={nums} states={Object.fromEntries([0, 1, 2, 3].map(i => [i, "window"]))} ranges={[{ from: 0, to: k - 1, label: `sum ${sum}` }]} />,
    })
    for (let right = k; right < nums.length; right++) {
        const left = right - k
        sum += nums[right] - nums[left]
        best = Math.max(best, sum)
        frames.push({
            caption: `Slide: add ${nums[right]} on the right, subtract ${nums[left]} that fell off the left. sum = ${sum}, best = ${best}. O(1) per step instead of re-adding all ${k}.`,
            view: (
                <ArrayViz
                    items={nums}
                    states={Object.fromEntries(nums.map((_, i) => [i, i === left ? "bad" : i === right ? "done" : i > left && i < right ? "window" : "default"]))}
                    ranges={[{ from: left + 1, to: right, label: `sum ${sum}` }]}
                />
            ),
        })
    }
    return frames
}

export function FixedWindow() {
    return (
        <Stepper
            title="643. Maximum Average Subarray I, k = 4"
            frames={fixedFrames()}
            legend={[{ s: "done", label: "entering" }, { s: "bad", label: "leaving" }, { s: "window", label: "window" }]}
        />
    )
}
