import { StackViz, TreeViz, Figure, Stepper } from "../kit"

function factorialFrames() {
    const frames = []
    const stack = []
    const snap = (caption, popped) => frames.push({
        caption,
        view: <StackViz items={[...stack]} slots={5} popped={popped ? [popped] : []} states={stack.length ? { [stack.length - 1]: "active" } : {}} title="call stack" width={150} />,
    })
    for (let n = 4; n >= 1; n--) {
        stack.push(n === 1 ? "fact(1)" : `fact(${n}) = ${n} × ?`)
        snap(n === 1
            ? "fact(1) is the BASE CASE: it returns 1 without calling anything. This is what stops the recursion."
            : `fact(${n}) can't finish yet: it needs fact(${n - 1}) first, so a new frame goes on top of the stack and fact(${n}) waits.`)
    }
    let value = 1
    stack.pop()
    snap("fact(1) returns 1 and its frame is removed. Now the waiting calls can finish, newest first.", "fact(1) → 1")
    for (let n = 2; n <= 4; n++) {
        value *= n
        stack.pop()
        snap(`fact(${n}) gets its answer back and returns ${n} × ${value / n} = ${value}.`, `fact(${n}) → ${value}`)
    }
    frames[frames.length - 1].caption += " The stack is empty and the final answer is 24. The stack grew to depth 4, which is the O(n) space recursion uses."
    return frames
}

export function CallStack() {
    return (
        <Stepper
            title="fact(4) on the call stack"
            frames={factorialFrames()}
            legend={[{ s: "active", label: "the call running right now" }, { s: "bad", label: "just returned" }]}
        />
    )
}

// fib(5) call tree; repeated calls highlighted so the wasted work is visible
function fibTree(n, seen) {
    const key = `fib(${n})`
    const repeat = seen.has(n)
    seen.add(n)
    return {
        v: key,
        s: repeat ? "bad" : n <= 1 ? "done" : undefined,
        children: n <= 1 ? [] : [fibTree(n - 1, seen), fibTree(n - 2, seen)],
    }
}

export function FibTree() {
    return (
        <Figure
            caption="The call tree for fib(5). Red calls were already computed somewhere else in the tree: fib(3) is computed twice, fib(2) three times, and the base cases even more. The tree roughly doubles each level, which is O(2ⁿ). Remember each answer the first time (memoization) and every red subtree disappears: O(n). That's the jump from recursion to dynamic programming."
            legend={[{ s: "bad", label: "repeated work" }, { s: "done", label: "base case" }]}
        >
            <TreeViz root={fibTree(5, new Set())} binary={false} dx={56} dy={62} label="fib 5 call tree" />
        </Figure>
    )
}

export function PowHalving() {
    const tree = {
        v: "pow(2, 10)", note: "= 32 × 32", children: [{
            v: "pow(2, 5)", note: "= 2 × 4 × 4", children: [{
                v: "pow(2, 2)", note: "= 2 × 2", children: [{
                    v: "pow(2, 1)", note: "= 2 × 1 × 1", children: [{ v: "pow(2, 0)", s: "done", note: "= 1", children: [] }],
                }],
            }],
        }],
    }
    return (
        <Figure caption="Fast power: x¹⁰ = (x⁵)², and x⁵ = x × (x²)². Each call HALVES n and makes just one recursive call, whose result it squares. So pow(2, 10) takes 5 calls instead of 10 multiplications, and in general O(log n).">
            <TreeViz root={tree} binary={false} dy={62} label="fast power recursion" />
        </Figure>
    )
}
