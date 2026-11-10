import { BarsViz, StackViz, ArrayViz, Figure, Stepper } from "../kit"

// 739. Daily Temperatures: keep a stack of days still waiting for a warmer day (temps decreasing from bottom to top)
function tempsFrames() {
    const t = [73, 74, 75, 71, 69, 72, 76, 73]
    const answer = Array(t.length).fill("")
    const stack = []
    const arrows = []
    const frames = []
    const snap = (i, caption, popped = []) => frames.push({
        caption,
        view: (
            <div>
                <div className="fig-row">
                    <BarsViz
                        values={t.map(v => v - 66)}
                        labels={t.map(v => `${v}°`)}
                        unit={14}
                        states={Object.fromEntries(t.map((_, k) => [k, k === i ? "active" : stack.includes(k) ? "found" : k < i ? "done" : undefined]).filter(([, v]) => v))}
                        arrows={arrows.map(([a, b]) => ({ from: a, to: b, color: "green" }))}
                        pointers={i >= 0 && i < t.length ? [{ i, label: "i" }] : []}
                        label="temperatures"
                    />
                    <StackViz items={stack.map(k => `${k}: ${t[k]}°`)} slots={4} popped={popped} states={stack.length ? { [stack.length - 1]: "found" } : {}} title="stack (index: temp)" width={86} />
                </div>
                <ArrayViz items={[...answer]} title="answer" showIndex={false} cell={38} states={Object.fromEntries(answer.map((v, k) => [k, v !== "" ? "done" : "default"]))} />
            </div>
        ),
    })
    snap(-1, "Bars show temperatures (73° to 76°). The stack holds days still waiting for a warmer day. Their temperatures only go DOWN from bottom to top.")
    for (let i = 0; i < t.length; i++) {
        const popped = []
        while (stack.length && t[i] > t[stack[stack.length - 1]]) {
            const j = stack.pop()
            answer[j] = i - j
            arrows.push([j, i])
            popped.push(`${j}: ${t[j]}°`)
        }
        stack.push(i)
        snap(i, popped.length
            ? `Day ${i} is ${t[i]}°, warmer than the top of the stack. Pop every waiting day it beats (${popped.join(", ")}) and record how long each waited. Then push day ${i}.`
            : `Day ${i} is ${t[i]}°, not warmer than the top of the stack, so nobody's wait ends. Push day ${i}.`, popped)
    }
    frames[frames.length - 1].caption += " Days left on the stack never get a warmer day, so they stay 0. Every day is pushed once and popped at most once: O(n)."
    return frames
}

export function DailyTemps() {
    return (
        <Stepper
            title="739. Daily Temperatures"
            frames={tempsFrames()}
            legend={[{ s: "active", label: "today" }, { s: "found", label: "waiting on the stack" }, { color: "green", label: "found its next warmer day" }]}
        />
    )
}

export function Histogram() {
    const h = [2, 1, 5, 6, 2, 3]
    return (
        <Figure
            caption="Largest Rectangle in Histogram: for each bar, the widest rectangle at its height stretches left and right until it hits a SHORTER bar. For the bar of height 5 at index 2, the previous smaller is index 1 and the next smaller is index 4, so the width is 4 - 1 - 1 = 2 and the area is 10, the answer. A monotonic increasing stack finds both walls for every bar in one pass."
            legend={[{ s: "found", label: "the bar setting the height" }, { s: "bad", label: "previous and next smaller: the walls" }, { color: "blue", label: "the rectangle" }]}
        >
            <BarsViz
                values={h}
                states={{ 2: "found", 1: "bad", 4: "bad" }}
                band={{ from: 1, to: 4, height: 5, label: "5 × 2 = 10" }}
                unit={22}
                label="histogram"
            />
        </Figure>
    )
}
