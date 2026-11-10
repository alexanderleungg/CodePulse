import { ArrayViz, GridViz, Figure, Stepper } from "../kit"

export function ConcatCost() {
    const word = "hello"
    return (
        <Figure
            caption="Strings can't change, so s += c builds a brand new string and copies every character so far. Adding n characters one at a time copies 1 + 2 + ... + n characters, which is O(n²). Appending to a list and calling ''.join once at the end copies each character once: O(n)."
            legend={[{ s: "found", label: "copied again" }, { s: "active", label: "the new character" }]}
        >
            <div style={{ width: "fit-content", margin: "0 auto" }}>
                {word.split("").map((_, k) => (
                    <ArrayViz
                        key={k}
                        items={word.slice(0, k + 1).split("")}
                        title={`step ${k + 1}`}
                        showIndex={false}
                        cell={34}
                        align="left"
                        states={Object.fromEntries(word.slice(0, k + 1).split("").map((_, i) => [i, i === k ? "active" : "found"]))}
                    />
                ))}
            </div>
        </Figure>
    )
}

// Valid Palindrome: skip anything that isn't a letter or digit, compare lowercase letters from both ends
function palindromeFrames() {
    const s = "Race, car!".split("")
    const ok = ch => /[a-z0-9]/i.test(ch)
    const frames = []
    let l = 0
    let r = s.length - 1
    const snap = caption => frames.push({
        caption,
        view: (
            <ArrayViz
                items={s.map(c => (c === " " ? "␣" : c))}
                cell={38}
                states={Object.fromEntries(s.map((c, i) => [i, !ok(c) ? "muted" : i < l || i > r ? "done" : i === l || i === r ? "active" : "default"]))}
                pointers={l === r ? [{ i: l, label: "L = R" }] : [{ i: l, label: "L" }, { i: r, label: "R", color: "violet" }]}
            />
        ),
    })
    snap("L starts at the front, R at the back.")
    while (l < r) {
        if (!ok(s[l])) { l++; snap(`s[L] isn't a letter or digit, skip it.`); continue }
        if (!ok(s[r])) { r--; snap(`s[R] isn't a letter or digit, skip it.`); continue }
        const same = s[l].toLowerCase() === s[r].toLowerCase()
        const msg = `'${s[l]}' vs '${s[r]}': ${same ? "same letter (ignoring case), move both inward." : "different, not a palindrome."}`
        l++; r--
        snap(msg)
    }
    frames[frames.length - 1].caption += " The pointers met, so every pair matched: it's a palindrome."
    return frames
}

export function TwoEnds() {
    return (
        <Stepper
            title={'125. Valid Palindrome on "Race, car!"'}
            frames={palindromeFrames()}
            legend={[{ s: "active", label: "being compared" }, { s: "done", label: "matched" }, { s: "muted", label: "ignored" }]}
        />
    )
}

// expand around a center until the characters stop matching
function expandFrames() {
    const s = "cbabad".split("")
    const frames = []
    const view = (l, r, center, best) => (
        <ArrayViz
            items={s}
            states={Object.fromEntries(s.map((_, i) => [i, i >= l && i <= r ? (i === center ? "active" : "window") : "default"]))}
            ranges={best ? [{ from: best[0], to: best[1], label: `best "${s.slice(best[0], best[1] + 1).join("")}"`, color: "green" }] : []}
            pointers={[{ i: l, label: "L" }, { i: r, label: "R", color: "violet" }]}
        />
    )
    frames.push({ caption: "Every palindrome mirrors around a center. Try center 2 ('a'): start with L = R = 2.", view: view(2, 2, 2) })
    frames.push({ caption: "s[1] = 'b' and s[3] = 'b' match, so expand: \"bab\" is a palindrome.", view: view(1, 3, 2, [1, 3]) })
    frames.push({ caption: "s[0] = 'c' and s[4] = 'a' don't match. Stop. The longest palindrome centered at 2 is \"bab\".", view: view(1, 3, 2, [1, 3]) })
    frames.push({ caption: "Center 3 ('b'): 'a' and 'a' match, giving \"aba\". Then 'b' vs 'd' fails. Same length as before.", view: view(2, 4, 3, [1, 3]) })
    frames.push({ caption: "Even length palindromes center BETWEEN two letters, so also try L = i, R = i + 1 for every i. Here none of those match. Answer: \"bab\".", view: view(1, 3, 2, [1, 3]) })
    return frames
}

export function ExpandCenter() {
    return (
        <Stepper
            title={'5. Longest Palindromic Substring on "cbabad"'}
            frames={expandFrames()}
            legend={[{ s: "active", label: "center" }, { s: "window", label: "current palindrome" }]}
        />
    )
}

export function CommonPrefix() {
    const words = ["flower", "flow", "flight"]
    const width = 6
    const grid = words.map(w => w.padEnd(width, " ").split("").map(c => (c === " " ? "" : c)))
    const states = {}
    words.forEach((w, r) => {
        for (let c = 0; c < width; c++) {
            if (c < 2) states[`${r},${c}`] = "done"
            else if (c === 2) states[`${r},${c}`] = "bad"
            else if (c < w.length) states[`${r},${c}`] = "muted"
        }
    })
    return (
        <Figure
            caption={'Longest Common Prefix: stack the words and read down each column. Columns 0 and 1 agree on "f" and "l". Column 2 has "o", "o", "i", so stop. The answer is "fl".'}
            legend={[{ s: "done", label: "column matches" }, { s: "bad", label: "first mismatch" }]}
        >
            <GridViz grid={grid} states={states} rowHeaders={["1", "2", "3"]} colHeaders={[0, 1, 2, 3, 4, 5]} cell={42} label="common prefix columns" />
        </Figure>
    )
}
