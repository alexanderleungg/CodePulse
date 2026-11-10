import { ListViz, Figure, Stepper } from "../kit"

// 206. Reverse Linked List: after k steps, the first k nodes point backwards
function reverseFrames() {
    const vals = [1, 2, 3, 4, 5]
    const n = vals.length
    const frames = []
    for (let k = 0; k <= n; k++) {
        const links = vals.map((_, i) => {
            if (i >= n - 1) return "right"      // last node -> null (drawn as the trailing arrow)
            if (i < k - 1) return "left"        // already reversed: node i+1 points back to node i
            if (i === k - 1) return "none"      // the cut: curr now points back, not forward
            return "right"
        })
        // the trailing arrow (last node -> null) disappears once the last node is reversed
        if (k === n) links[n - 1] = "none"
        const pointers = []
        pointers.push({ i: k - 1, label: "prev", color: "green" })
        if (k < n) pointers.push({ i: k, label: "curr" })
        if (k < n) pointers.push({ i: k + 1, label: "next", color: "violet" })
        const states = Object.fromEntries(vals.map((_, i) => [i, i < k ? "done" : i === k ? "active" : "default"]))
        frames.push({
            caption: k === 0
                ? "prev starts as null, curr at the head. The loop: save next, point curr back at prev, then step prev and curr forward."
                : k < n
                    ? `Node ${vals[k - 1]} now points back to ${k === 1 ? "null" : vals[k - 2]}. We saved next before flipping, so the rest of the list isn't lost. Step forward.`
                    : "curr fell off the end. prev is the old tail, which is the new head. Return prev.",
            view: (
                <ListViz
                    nodes={vals.map((v, i) => ({ v, s: states[i] }))}
                    links={links}
                    nullStart
                    headToNull={k >= 1}
                    nullEnd
                    pointers={pointers}
                    label="reversing a linked list"
                />
            ),
        })
    }
    return frames
}

export function Reverse() {
    return (
        <Stepper
            title="206. Reverse Linked List"
            frames={reverseFrames()}
            legend={[{ s: "done", label: "reversed" }, { s: "active", label: "curr" }, { color: "green", label: "flipped arrow" }]}
        />
    )
}

function middleFrames() {
    const vals = [1, 2, 3, 4, 5]
    const frames = []
    let slow = 0
    let fast = 0
    const snap = caption => frames.push({
        caption,
        view: (
            <ListViz
                nodes={vals.map((v, i) => ({ v, s: i === slow ? "active" : i === fast ? "window" : undefined }))}
                pointers={[{ i: slow, label: "slow", color: "blue" }, { i: fast, label: "fast", color: "violet" }]}
                label="fast and slow pointers"
            />
        ),
    })
    snap("Both start at the head. slow moves 1 step per turn, fast moves 2.")
    while (fast + 2 < vals.length + 1 && fast + 1 < vals.length) {
        slow += 1
        fast += 2
        snap(`slow at ${vals[slow]}, fast at ${vals[fast]}. fast covers twice the distance.`)
        if (fast === vals.length - 1) break
    }
    frames[frames.length - 1].caption += " fast is at the last node, so slow is exactly in the middle."
    return frames
}

export function Middle() {
    return (
        <Stepper
            title="876. Middle of the Linked List"
            frames={middleFrames()}
            legend={[{ s: "active", label: "slow (1 step)" }, { s: "window", label: "fast (2 steps)" }]}
        />
    )
}

export function Cycle() {
    return (
        <Figure
            caption="If the list loops back on itself, fast never reaches null. Once both pointers are inside the loop, fast gains one node on slow every turn, so it must land on slow eventually, like a faster runner lapping a slower one on a track."
            legend={[{ s: "active", label: "slow" }, { s: "window", label: "fast" }, { color: "yellow", label: "the link that makes the cycle" }]}
        >
            <ListViz
                nodes={[{ v: 3 }, { v: 2, s: "active" }, { v: 0 }, { v: -4, s: "window" }]}
                cycleTo={1}
                nullEnd={false}
                pointers={[{ i: 1, label: "slow" }, { i: 3, label: "fast", color: "violet" }]}
                label="linked list with a cycle"
            />
        </Figure>
    )
}

export function NthFromEnd() {
    return (
        <Figure
            caption="Remove the 2nd node from the end: move fast n = 2 steps ahead first, then move both together. When fast reaches the last node, slow is right BEFORE the node to delete, so slow.next = slow.next.next cuts it out. The dummy node in front handles deleting the head."
            legend={[{ s: "bad", label: "the node to remove" }, { s: "active", label: "slow" }, { s: "window", label: "fast" }]}
        >
            <ListViz
                nodes={[{ v: "dummy" }, { v: 1 }, { v: 2 }, { v: 3, s: "active" }, { v: 4, s: "bad" }, { v: 5, s: "window" }]}
                pointers={[{ i: 3, label: "slow" }, { i: 5, label: "fast", color: "violet" }]}
                label="remove nth node from end"
            />
        </Figure>
    )
}
