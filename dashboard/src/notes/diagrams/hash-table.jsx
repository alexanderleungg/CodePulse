import { ArrayViz, GridViz, GraphViz, Figure, Stepper, Svg, ArrowDefs, useArrowBase, markerUrl, INK, state } from "../kit"

// keys go through the hash function to a bucket index; colliding keys share a bucket (a short chain)
export function Buckets() {
    const keys = [
        { k: '"cat"', b: 1 },
        { k: '"dog"', b: 4 },
        { k: '"owl"', b: 1 },
        { k: '"fox"', b: 3 },
    ]
    const base = useArrowBase()
    const arrow = INK.text3
    const bx = 250
    const bw = 46
    const bh = 38
    const by = i => 18 + i * (bh + 8)
    const ky = i => 40 + i * 58
    const chain = { 1: ['"cat"', '"owl"'], 3: ['"fox"'], 4: ['"dog"'] }
    return (
        <Figure
            caption={'hash(key) % 6 picks a bucket. Lookup jumps straight to that bucket instead of scanning everything. "cat" and "owl" collide in bucket 1, so that bucket holds a short list; a good hash function keeps these lists tiny, which is why lookups are O(1) on average.'}
            legend={[{ s: "active", label: "bucket with one key" }, { s: "found", label: "collision: two keys, one bucket" }]}
        >
            <Svg width={560} height={Math.max(by(6), ky(3) + 40) + 6} label="hash table buckets">
                <ArrowDefs base={base} colors={[arrow]} />
                {keys.map((key, i) => (
                    <g key={key.k}>
                        <rect x={10} y={ky(i) - 16} width={70} height={32} rx={8} fill="#141417" stroke={INK.cellBorder} />
                        <text x={45} y={ky(i)} fontSize={13} fill={INK.text} textAnchor="middle" dominantBaseline="central">{key.k}</text>
                        <text x={45} y={ky(i) + 28} fontSize={10} fill={INK.text3} textAnchor="middle">hash % 6 = {key.b}</text>
                        <line x1={84} y1={ky(i)} x2={bx - 6} y2={by(key.b) + bh / 2} stroke={arrow} strokeWidth={1.25} markerEnd={markerUrl(base, arrow)} />
                    </g>
                ))}
                {Array.from({ length: 6 }, (_, i) => {
                    const items = chain[i] || []
                    const s = state(items.length > 1 ? "found" : items.length ? "active" : undefined)
                    return (
                        <g key={i}>
                            <rect x={bx} y={by(i)} width={bw} height={bh} rx={7} fill={s.fill} stroke={s.stroke} strokeWidth={1.25} />
                            <text x={bx + bw / 2} y={by(i) + bh / 2} fontSize={12} fill={INK.text3} textAnchor="middle" dominantBaseline="central">{i}</text>
                            {items.map((v, j) => {
                                const x = bx + bw + 30 + j * 96
                                return (
                                    <g key={v}>
                                        <line x1={x - 28} y1={by(i) + bh / 2} x2={x - 4} y2={by(i) + bh / 2} stroke={arrow} strokeWidth={1.25} markerEnd={markerUrl(base, arrow)} />
                                        <rect x={x} y={by(i) + 4} width={70} height={bh - 8} rx={7} fill="#141417" stroke={s.stroke} />
                                        <text x={x + 35} y={by(i) + bh / 2} fontSize={12} fill={INK.text} textAnchor="middle" dominantBaseline="central">{v}</text>
                                    </g>
                                )
                            })}
                        </g>
                    )
                })}
            </Svg>
        </Figure>
    )
}

// Two Sum: for each number, check whether its complement is already in `seen`, then add the number
function twoSumFrames() {
    const nums = [3, 8, 11, 2, 7]
    const target = 9
    const seen = []
    const frames = []
    const table = () => (seen.length
        ? <GridViz grid={[seen.map(s => s.v), seen.map(s => s.i)]} rowHeaders={["key", "idx"]} cell={42} label="seen dict" />
        : <div className="fig-sub">seen = {"{}"}</div>)
    for (let i = 0; i < nums.length; i++) {
        const need = target - nums[i]
        const hit = seen.find(s => s.v === need)
        frames.push({
            caption: hit
                ? `nums[${i}] = ${nums[i]} needs ${need}. ${need} is in seen at index ${hit.i}, so the answer is [${hit.i}, ${i}].`
                : `nums[${i}] = ${nums[i]} needs ${need}. Not in seen yet, so store ${nums[i]} -> ${i} and keep going.`,
            view: (
                <div>
                    <ArrayViz
                        items={nums}
                        title="nums"
                        states={{ [i]: hit ? "done" : "active", ...(hit ? { [hit.i]: "done" } : {}) }}
                        pointers={[{ i, label: `need ${need}` }]}
                    />
                    <div style={{ marginTop: 6 }}>{table()}</div>
                </div>
            ),
        })
        if (hit) break
        seen.push({ v: nums[i], i })
    }
    return frames
}

export function TwoSum() {
    return (
        <Stepper
            title="1. Two Sum, target = 9"
            frames={twoSumFrames()}
            legend={[{ s: "active", label: "current number" }, { s: "done", label: "the pair" }]}
        />
    )
}

export function GroupAnagrams() {
    const words = ["eat", "tea", "tan", "ate", "nat", "bat"]
    const keyOf = w => w.split("").sort().join("")
    const keys = [...new Set(words.map(keyOf))]
    const color = { aet: "active", ant: "found", abt: "window" }
    return (
        <Figure
            caption={'Words that are anagrams of each other sort to the same string. Use that sorted string as the dict key and every word lands in its group: {"aet": [eat, tea, ate], "ant": [tan, nat], "abt": [bat]}.'}
        >
            <GraphViz
                directed
                unit={70}
                r={22}
                nodes={[
                    ...words.map((w, i) => ({ id: w, x: 0, y: i * 0.8, s: color[keyOf(w)] })),
                    ...keys.map((k, i) => ({ id: `k${k}`, v: k, x: 3, y: 0.4 + i * 1.6, s: color[k], note: `key "${k}"` })),
                ]}
                edges={words.map(w => ({ a: w, b: `k${keyOf(w)}`, s: color[keyOf(w)] }))}
                label="group anagrams by sorted key"
            />
        </Figure>
    )
}

export function ConsecutiveStarts() {
    return (
        <Figure
            caption="Longest Consecutive Sequence: put everything in a set. Only start counting from numbers whose left neighbour (x - 1) is missing, because those are the starts of runs. 1 starts the run 1, 2, 3, 4; 100 and 200 are runs of length 1. Each number is visited at most twice, so it's O(n)."
            legend={[{ s: "done", label: "start of a run (x - 1 not in set)" }, { s: "muted", label: "skipped as a start (x - 1 is in the set)" }]}
        >
            <div>
                <ArrayViz items={[100, 4, 200, 1, 3, 2]} title="nums" states={{ 0: "done", 1: "muted", 2: "done", 3: "done", 4: "muted", 5: "muted" }} />
                <ArrayViz items={[1, 2, 3, 4]} title="run " showIndex={false} states={{ 0: "done", 1: "window", 2: "window", 3: "window" }} ranges={[{ from: 0, to: 3, label: "length 4", color: "green" }]} />
            </div>
        </Figure>
    )
}
