import { BitsViz, GridViz, Figure } from "../kit"

export function Operators() {
    return (
        <Figure caption="The three operators work column by column. AND keeps a 1 only where both have one. OR keeps a 1 where either has one. XOR keeps a 1 where they're DIFFERENT, which is why x ^ x = 0 and x ^ 0 = x.">
            <div className="fig-row">
                <div><BitsViz bits={6} rows={[{ label: "x = 12", value: 12 }, { label: "y = 10", value: 10, op: "&" }, { label: "x & y", value: 12 & 10, s: "done" }]} rule={2} /><div className="fig-sub">AND</div></div>
                <div><BitsViz bits={6} rows={[{ label: "x = 12", value: 12 }, { label: "y = 10", value: 10, op: "|" }, { label: "x | y", value: 12 | 10, s: "found" }]} rule={2} /><div className="fig-sub">OR</div></div>
                <div><BitsViz bits={6} rows={[{ label: "x = 12", value: 12 }, { label: "y = 10", value: 10, op: "^" }, { label: "x ^ y", value: 12 ^ 10, s: "window" }]} rule={2} /><div className="fig-sub">XOR</div></div>
            </div>
        </Figure>
    )
}

export function ClearLowest() {
    return (
        <Figure
            caption="x & (x - 1) removes the lowest 1 bit. Subtracting 1 flips the lowest 1 to 0 and every 0 below it to 1. ANDing with the original wipes out exactly that block. Repeat until x is 0 and I've counted the 1 bits, one per loop (Number of 1 Bits). If x has only ONE 1 bit, the result is 0 immediately: that's the power of two check."
            legend={[{ s: "bad", label: "the lowest 1 bit and everything below it" }]}
        >
            <BitsViz
                bits={8}
                rows={[
                    { label: "x = 44", value: 44, bitStates: { 2: "bad", 1: "default", 0: "default" } },
                    { label: "x - 1 = 43", value: 43, op: "&", bitStates: { 2: "bad", 1: "bad", 0: "bad" } },
                    { label: "result", value: 44 & 43, s: "done" },
                ]}
                rule={2}
            />
        </Figure>
    )
}

export function SingleNumber() {
    const nums = [4, 1, 2, 1, 2]
    let acc = 0
    const rows = nums.map((v, i) => {
        acc ^= v
        return { label: i === 0 ? `${v}` : `^ ${v}`, value: v }
    })
    rows.push({ label: "result", value: acc, s: "done" })
    return (
        <Figure caption="Single Number on [4, 1, 2, 1, 2]: XOR everything together. Order doesn't matter for XOR, so pair things up: 1 ^ 1 = 0 and 2 ^ 2 = 0, leaving 4 ^ 0 ^ 0 = 4. Every duplicate cancels itself out, with O(1) extra space.">
            <BitsViz bits={4} rows={rows} rule={nums.length} />
        </Figure>
    )
}

export function Subsets() {
    const items = ["a", "b", "c"]
    const grid = Array.from({ length: 8 }, (_, mask) => [
        mask,
        mask.toString(2).padStart(3, "0"),
        `{${items.filter((_, i) => mask & (1 << i)).join(",")}}`,
    ])
    const states = {}
    grid.forEach((_, r) => { if (r === 5) { states[`${r},0`] = "found"; states[`${r},1`] = "found"; states[`${r},2`] = "found" } })
    return (
        <Figure caption="Every number from 0 to 2ⁿ - 1 is one subset: bit i says whether item i is in. For n = 3 there are 8 masks. Mask 5 is 101 in binary, so bits 0 and 2 are on: {a, c}. Looping over masks lists every subset without recursion, handy when n is small (up to about 20).">
            <GridViz grid={grid} states={states} colHeaders={["mask", "bits", "subset"]} cell={70} label="bitmask subsets" />
        </Figure>
    )
}
