import { ArrayViz, StackViz, Figure, Stepper } from "../kit"

function parenFrames(input) {
    const s = input.split("")
    const pairs = { ")": "(", "]": "[", "}": "{" }
    const stack = []
    const frames = []
    const snap = (i, caption, extra = {}) => frames.push({
        caption,
        view: (
            <div className="fig-row">
                <ArrayViz items={s} states={Object.fromEntries(s.map((_, k) => [k, k < i ? "muted" : k === i ? (extra.bad ? "bad" : "active") : "default"]))} pointers={i < s.length ? [{ i, label: "i" }] : []} />
                <StackViz items={[...stack]} slots={3} popped={extra.popped ? [extra.popped] : []} states={stack.length ? { [stack.length - 1]: "active" } : {}} />
            </div>
        ),
    })
    for (let i = 0; i < s.length; i++) {
        const ch = s[i]
        if (!pairs[ch]) {
            stack.push(ch)
            snap(i, `'${ch}' opens something: push it. It must be closed before anything under it.`)
        } else if (stack.length && stack[stack.length - 1] === pairs[ch]) {
            const top = stack.pop()
            snap(i, `'${ch}' closes the most recent opener '${top}': they match, so pop it.`, { popped: top })
        } else {
            snap(i, `'${ch}' doesn't match the top of the stack, so the string is invalid.`, { bad: true })
            return frames
        }
    }
    frames.push({
        caption: stack.length ? "Leftover openers were never closed: invalid." : "End of the string and the stack is empty: every opener was closed in the right order. Valid.",
        view: (
            <div className="fig-row">
                <ArrayViz items={s} states={Object.fromEntries(s.map((_, k) => [k, "done"]))} />
                <StackViz items={[...stack]} slots={3} />
            </div>
        ),
    })
    return frames
}

export function Parentheses() {
    return (
        <Stepper
            title={'20. Valid Parentheses on "{[()]}"'}
            frames={parenFrames("{[()]}")}
            legend={[{ s: "active", label: "current character / top of stack" }, { s: "bad", label: "just popped" }]}
        />
    )
}

export function MinStack() {
    return (
        <Figure
            caption="Min Stack stores a pair at every level: (value, smallest value at or below this level). getMin is just the top pair's second number, O(1). Popping automatically restores the old minimum because it was saved one level down."
            legend={[{ s: "active", label: "top: getMin() reads min here" }]}
        >
            <div className="fig-row">
                <div>
                    <StackViz items={["5, 5", "3, 3", "7, 3", "2, 2"]} states={{ 3: "active" }} title="(val, min)" width={90} />
                    <div className="fig-sub">push 5, 3, 7, 2: getMin() = 2</div>
                </div>
                <div>
                    <StackViz items={["5, 5", "3, 3", "7, 3"]} states={{ 2: "active" }} popped={["2, 2"]} title="(val, min)" width={90} />
                    <div className="fig-sub">after pop(): getMin() = 3</div>
                </div>
            </div>
        </Figure>
    )
}

function rpnFrames() {
    const tokens = ["2", "1", "+", "3", "*"]
    const stack = []
    const frames = []
    tokens.forEach((t, i) => {
        let caption
        let popped = []
        if (["+", "-", "*", "/"].includes(t)) {
            const b = stack.pop()
            const a = stack.pop()
            const r = t === "+" ? a + b : t === "-" ? a - b : t === "*" ? a * b : Math.trunc(a / b)
            stack.push(r)
            popped = [b, a]
            caption = `Operator '${t}': pop the top two (${a} and ${b}), compute ${a} ${t} ${b} = ${r}, push the result.`
        } else {
            stack.push(Number(t))
            caption = `Number ${t}: push it.`
        }
        frames.push({
            caption: i === tokens.length - 1 ? `${caption} Done: the answer is the one value left, ${stack[0]}.` : caption,
            view: (
                <div className="fig-row">
                    <ArrayViz items={tokens} states={Object.fromEntries(tokens.map((_, k) => [k, k < i ? "muted" : k === i ? "active" : "default"]))} />
                    <StackViz items={[...stack]} slots={3} popped={popped} states={{ [stack.length - 1]: "active" }} />
                </div>
            ),
        })
    })
    return frames
}

export function RPN() {
    return (
        <Stepper title={'150. Evaluate Reverse Polish Notation: ["2","1","+","3","*"]'} frames={rpnFrames()} legend={[{ s: "active", label: "current token / result" }, { s: "bad", label: "popped operands" }]} />
    )
}
