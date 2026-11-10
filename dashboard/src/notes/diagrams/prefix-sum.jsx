import { ArrayViz, GridViz, Figure, Stepper } from "../kit"

export function RangeSum() {
    const nums = [3, 1, 4, 1, 5, 9]
    const prefix = [0, 3, 4, 8, 9, 14, 23]
    return (
        <Figure
            caption="prefix has one extra slot: prefix[i] is the sum of the first i numbers, so prefix[0] = 0. The sum of nums[2..4] is prefix[5] - prefix[2] = 14 - 4 = 10. Everything up to index 4, minus everything before index 2."
            legend={[{ s: "window", label: "nums[2..4]" }, { s: "done", label: "prefix[5]: sum of the first 5" }, { s: "bad", label: "prefix[2]: sum of the first 2, subtract it" }]}
        >
            <div style={{ width: "fit-content", margin: "0 auto" }}>
                <ArrayViz items={nums} title="nums  " align="left" states={{ 2: "window", 3: "window", 4: "window" }} ranges={[{ from: 2, to: 4, label: "4 + 1 + 5 = 10" }]} />
                <ArrayViz items={prefix} title="prefix" align="left" states={{ 5: "done", 2: "bad" }} pointers={[{ i: 2, label: "l", color: "red" }, { i: 5, label: "r + 1", color: "green" }]} />
            </div>
        </Figure>
    )
}

// Subarray Sum Equals K: at each index, count how many earlier prefix sums equal (running sum - k)
function subarrayFrames() {
    const nums = [1, 2, 1, 2, 1]
    const k = 3
    const counts = new Map([[0, 1]])
    const frames = []
    let sum = 0
    let total = 0
    const table = hit => {
        const keys = [...counts.keys()]
        return (
            <GridViz
                grid={[keys, keys.map(key => counts.get(key))]}
                rowHeaders={["sum", "seen"]}
                states={Object.fromEntries(keys.map((key, c) => [`0,${c}`, key === hit ? "done" : "default"]).concat(keys.map((key, c) => [`1,${c}`, key === hit ? "done" : "default"])))}
                cell={40}
                label="prefix sum counts"
            />
        )
    }
    frames.push({
        caption: "Start with counts = {0: 1}: the empty prefix has sum 0. That lets a subarray starting at index 0 be counted.",
        view: <div><ArrayViz items={nums} title="nums" /><div style={{ marginTop: 6 }}>{table(null)}</div></div>,
    })
    nums.forEach((x, i) => {
        sum += x
        const need = sum - k
        const found = counts.get(need) || 0
        total += found
        frames.push({
            caption: `i = ${i}: running sum = ${sum}. A subarray ending here sums to ${k} if an earlier prefix summed to ${sum} - ${k} = ${need}. Seen ${found} time${found === 1 ? "" : "s"}, so total = ${total}. Then record sum ${sum}.`,
            view: (
                <div>
                    <ArrayViz items={nums} title="nums" states={Object.fromEntries(nums.map((_, j) => [j, j === i ? "active" : j < i ? "done" : "default"]))} pointers={[{ i, label: `sum ${sum}` }]} />
                    <div style={{ marginTop: 6 }}>{table(found ? need : null)}</div>
                </div>
            ),
        })
        counts.set(sum, (counts.get(sum) || 0) + 1)
    })
    frames[frames.length - 1].caption += ` Final answer: ${total} subarrays ([1,2], [2,1], [1,2], [2,1]).`
    return frames
}

export function SubarraySumK() {
    return (
        <Stepper
            title="560. Subarray Sum Equals K, k = 3"
            frames={subarrayFrames()}
            legend={[{ s: "active", label: "current index" }, { s: "done", label: "matching earlier prefix" }]}
        />
    )
}

export function Prefix2D() {
    // sum of the query rectangle rows 1..2, cols 1..2 = P[3][3] - P[1][3] - P[3][1] + P[1][1]
    const grid = [
        [3, 0, 1, 4],
        [5, 6, 3, 2],
        [1, 2, 0, 1],
        [4, 1, 0, 1],
    ]
    const states = {}
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            if (r >= 1 && r <= 2 && c >= 1 && c <= 2) states[`${r},${c}`] = "done"
            else if (r < 1 && c <= 2) states[`${r},${c}`] = "bad"
            else if (c < 1 && r <= 2) states[`${r},${c}`] = "found"
        }
    }
    states["0,0"] = "extra"
    return (
        <Figure
            caption="2D prefix sums: P[r][c] is the sum of the rectangle from (0,0) to (r-1,c-1). To get the green block, take the big rectangle, subtract the red strip above and the yellow strip to the left, then add back the orange corner, because it was subtracted twice."
            legend={[{ s: "done", label: "the query" }, { s: "bad", label: "minus the top" }, { s: "found", label: "minus the left" }, { s: "extra", label: "plus the corner back" }]}
        >
            <GridViz grid={grid} states={states} rowHeaders={[0, 1, 2, 3]} colHeaders={[0, 1, 2, 3]} cell={46} label="2D prefix sum regions" />
        </Figure>
    )
}

export function DifferenceArray() {
    return (
        <Figure
            caption="The reverse trick for range UPDATES. To add 5 to every index 1..3, write +5 at index 1 and -5 at index 4 in a difference array. After all updates, one prefix sum pass turns the marks into the real values. Each update is O(1) instead of O(length)."
            legend={[{ s: "done", label: "+5 starts here" }, { s: "bad", label: "-5 stops it" }, { s: "window", label: "result after the prefix pass" }]}
        >
            <div style={{ width: "fit-content", margin: "0 auto" }}>
                <ArrayViz items={[0, 5, 0, 0, -5, 0]} title="diff  " align="left" states={{ 1: "done", 4: "bad" }} />
                <ArrayViz items={[0, 5, 5, 5, 0, 0]} title="values" align="left" showIndex={false} states={{ 1: "window", 2: "window", 3: "window" }} ranges={[{ from: 1, to: 3, label: "+5 on 1..3" }]} />
            </div>
        </Figure>
    )
}
