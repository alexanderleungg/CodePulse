import { ArrayViz, GridViz, TreeViz, Figure, Stepper } from "../kit"

// House Robber on [2, 7, 9, 3, 1]: dp[i] = best loot using houses 0..i
function robberFrames() {
    const houses = [2, 7, 9, 3, 1]
    const dp = []
    const frames = []
    houses.forEach((h, i) => {
        let caption
        const prev1 = i >= 1 ? dp[i - 1] : 0
        const prev2 = i >= 2 ? dp[i - 2] : 0
        const rob = prev2 + h
        const skip = prev1
        dp.push(Math.max(rob, skip))
        if (i === 0) caption = `dp[0]: only one house, rob it. dp[0] = ${h}.`
        else caption = `dp[${i}] = max(skip house ${i} → dp[${i - 1}] = ${skip},  rob it → ${i >= 2 ? `dp[${i - 2}]` : "0"} + ${h} = ${rob}) = ${dp[i]}. ${rob >= skip ? "Robbing wins." : "Skipping wins."}`
        frames.push({
            caption,
            view: (
                <div style={{ width: "fit-content", margin: "0 auto" }}>
                    <ArrayViz items={houses} title="house" align="left" states={{ [i]: "active" }} />
                    <ArrayViz
                        items={houses.map((_, k) => (k < dp.length ? dp[k] : ""))}
                        title="dp   "
                        align="left"
                        showIndex={false}
                        states={{ [i]: "done", ...(i >= 1 ? { [i - 1]: rob >= skip ? "muted" : "found" } : {}), ...(i >= 2 ? { [i - 2]: rob >= skip ? "found" : "muted" } : {}) }}
                    />
                </div>
            ),
        })
    })
    frames[frames.length - 1].caption += ` Answer: dp[4] = ${dp[4]} (houses 0, 2, 4).`
    return frames
}

export function HouseRobber() {
    return (
        <Stepper
            title="198. House Robber: fill dp left to right"
            frames={robberFrames()}
            legend={[{ s: "active", label: "current house" }, { s: "found", label: "the earlier answer we built on" }, { s: "done", label: "just filled" }]}
        />
    )
}

export function MemoTree() {
    // fib(5) with memoization: only the leftmost chain is actually computed, every other call is a cache hit
    const tree = {
        v: "f(5)", s: "active", children: [
            { v: "f(4)", s: "active", children: [
                { v: "f(3)", s: "active", children: [
                    { v: "f(2)", s: "active", children: [{ v: "f(1)", s: "done", children: [] }, { v: "f(0)", s: "done", children: [] }] },
                    { v: "f(1)", s: "found", note: "cached", children: [] },
                ] },
                { v: "f(2)", s: "found", note: "cached", children: [] },
            ] },
            { v: "f(3)", s: "found", note: "cached", children: [] },
        ],
    }
    return (
        <Figure
            caption="fib(5) with a memo. The first time each f(k) is needed, it's computed (blue) and saved. Every later call is answered from the memo instantly (yellow), so its whole subtree is never built. n distinct subproblems, O(1) work each: O(n)."
            legend={[{ s: "active", label: "computed once" }, { s: "found", label: "answered from the memo" }, { s: "done", label: "base case" }]}
        >
            <TreeViz root={tree} binary={false} dx={58} dy={62} label="memoized fib tree" />
        </Figure>
    )
}

function coinFrames() {
    const coins = [1, 2, 5]
    const amount = 11
    const INF = Infinity
    const dp = [0, ...Array(amount).fill(INF)]
    const frames = []
    const show = v => (v === INF ? "∞" : v)
    for (let a = 1; a <= amount; a++) {
        const tried = []
        for (const c of coins) {
            if (c <= a && dp[a - c] + 1 < dp[a]) dp[a] = dp[a - c] + 1
            if (c <= a) tried.push(a - c)
        }
        const best = coins.filter(c => c <= a && dp[a - c] + 1 === dp[a])[0]
        if (a <= 6 || a === 10 || a === 11) {
            frames.push({
                caption: `dp[${a}]: try the last coin being ${coins.filter(c => c <= a).join(", ")}. That looks at dp[${tried.join("], dp[")}]. Best: a ${best} coin on top of dp[${a - best}] = ${dp[a - best]}, so dp[${a}] = ${dp[a]}.`,
                view: (
                    <ArrayViz
                        items={dp.map(show)}
                        cell={38}
                        states={{ ...Object.fromEntries(tried.map(t => [t, "found"])), [a - best]: "window", [a]: "done", ...Object.fromEntries(dp.map((_, k) => [k, k > a ? "muted" : undefined]).filter(([, v]) => v)) }}
                        pointers={[{ i: a, label: `amount ${a}` }]}
                    />
                ),
            })
        }
    }
    frames[frames.length - 1].caption += " Answer: 3 coins (5 + 5 + 1)."
    return frames
}

export function CoinChange() {
    return (
        <Stepper
            title="322. Coin Change, coins [1, 2, 5], amount 11"
            frames={coinFrames()}
            legend={[{ s: "found", label: "sub-answers looked at" }, { s: "window", label: "the one used" }, { s: "done", label: "just filled" }, { s: "muted", label: "not filled yet" }]}
        />
    )
}

export function UniquePaths() {
    const rows = 3
    const cols = 5
    const grid = Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => (r === 0 || c === 0 ? 1 : null)))
    for (let r = 1; r < rows; r++) for (let c = 1; c < cols; c++) grid[r][c] = grid[r - 1][c] + grid[r][c - 1]
    const states = {}
    for (let c = 0; c < cols; c++) states[`0,${c}`] = "muted"
    for (let r = 0; r < rows; r++) states[`${r},0`] = "muted"
    states["2,3"] = "found"
    states["1,4"] = "found"
    states["2,4"] = "done"
    return (
        <Figure
            caption="Unique Paths on a 3 × 5 grid (moves: right or down). The first row and column have exactly 1 way each. Any other cell can only be entered from above or from the left, so its count is the sum of those two. The bottom right cell 15 = 5 (from the left) + 10 (from above)."
            legend={[{ s: "muted", label: "base cases: 1 way" }, { s: "found", label: "the two cells it depends on" }, { s: "done", label: "the answer" }]}
        >
            <GridViz grid={grid} states={states} arrows={[{ from: [1, 4], to: [2, 4], color: "yellow" }, { from: [2, 3], to: [2, 4], color: "yellow" }]} cell={48} label="unique paths table" />
        </Figure>
    )
}

export function LCSTable() {
    const a = "abcde"
    const b = "ace"
    const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0))
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1])
        }
    }
    // cells where the characters match (diagonal +1 moves) on the path that builds the answer
    const states = { "1,1": "done", "3,2": "done", "5,3": "done" }
    for (let i = 0; i <= a.length; i++) states[`${i},0`] = "muted"
    for (let j = 0; j <= b.length; j++) states[`0,${j}`] = "muted"
    return (
        <Figure
            caption={'Longest Common Subsequence of "abcde" and "ace". dp[i][j] = LCS of the first i letters of one and the first j of the other. If the letters match, take the diagonal + 1 (green: a, c, e). If not, take the better of dropping a letter from either string: max(above, left). The bottom right corner, 3, is the answer.'}
            legend={[{ s: "muted", label: "empty string: 0" }, { s: "done", label: "a match: diagonal + 1" }]}
        >
            <GridViz
                grid={dp}
                states={states}
                rowHeaders={["", ...a.split("")]}
                colHeaders={["", ...b.split("")]}
                arrows={[{ from: [0, 0], to: [1, 1], color: "green" }, { from: [2, 1], to: [3, 2], color: "green" }, { from: [4, 2], to: [5, 3], color: "green" }]}
                cell={44}
                label="LCS table"
            />
        </Figure>
    )
}
