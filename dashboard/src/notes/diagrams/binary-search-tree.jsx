import { TreeViz, Figure, Stepper, bt, mapTree } from "../kit"

const BST = [8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13]

function searchFrames() {
    const target = 7
    const path = ["8", "3", "6", "7"]
    const reasons = {
        8: "7 < 8, so it can only be in the LEFT subtree. The whole right side is skipped.",
        3: "7 > 3, go right.",
        6: "7 > 6, go right.",
        7: "Found 7. That took 4 checks, one per level: O(height).",
    }
    return path.map((v, k) => {
        const seen = new Set(path.slice(0, k + 1))
        const root = mapTree(bt(BST), n => ({
            ...n,
            s: n.v === v ? (Number(v) === target ? "done" : "active") : seen.has(n.v) ? "window" : k >= 1 && ["10", "14", "13"].includes(n.v) ? "muted" : k >= 2 && n.v === "1" ? "muted" : k >= 3 && n.v === "4" ? "muted" : undefined,
            es: seen.has(n.v) && n.v !== "8" ? "active" : undefined,
        }))
        return { caption: `At ${v}: ${reasons[v]}`, view: <TreeViz root={root} dx={46} label="searching a BST" /> }
    })
}

export function Search() {
    return (
        <Stepper
            title="Searching for 7"
            frames={searchFrames()}
            legend={[{ s: "active", label: "current node" }, { s: "window", label: "path so far" }, { s: "muted", label: "skipped without looking" }]}
        />
    )
}

export function InvalidBST() {
    const root = mapTree(bt([5, 1, 6, null, null, 3, 7]), n => ({
        ...n,
        s: n.v === "3" ? "bad" : n.v === "5" ? "found" : undefined,
        note: { 5: "(-inf, inf)", 1: "(-inf, 5)", 6: "(5, inf)", 3: "(5, 6): 3 is out!", 7: "(6, inf)" }[n.v],
        noteColor: n.v === "3" ? "red" : undefined,
    }))
    return (
        <Figure
            caption="The classic trap. Every parent and child pair looks fine: 3 < 6 as a left child should be. But 3 sits in 5's RIGHT subtree, so it must be bigger than 5. Checking only direct children misses this. Pass the allowed range (low, high) down instead: going left tightens high, going right tightens low."
            legend={[{ s: "bad", label: "breaks the rule for an ancestor" }]}
        >
            <TreeViz root={root} dx={58} label="invalid BST" />
        </Figure>
    )
}

export function Delete() {
    const before = mapTree(bt([5, 3, 8, 2, 4, 7, 9, null, null, null, null, 6]), n => ({
        ...n,
        s: n.v === "5" ? "bad" : n.v === "6" ? "found" : undefined,
        note: n.v === "5" ? "delete" : n.v === "6" ? "successor" : undefined,
    }))
    const after = mapTree(bt([6, 3, 8, 2, 4, 7, 9]), n => ({ ...n, s: n.v === "6" ? "found" : undefined }))
    return (
        <Figure caption="Deleting a node with two children: replace its value with its inorder successor (the smallest value in its right subtree: go right once, then left all the way), then delete that successor from the right subtree. The successor has no left child, so removing it is easy.">
            <div className="fig-row">
                <div><TreeViz root={before} dx={44} label="before delete" /><div className="fig-sub">delete 5</div></div>
                <div><TreeViz root={after} dx={44} label="after delete" /><div className="fig-sub">6 takes its place</div></div>
            </div>
        </Figure>
    )
}

export function Shape() {
    const balanced = bt([4, 2, 6, 1, 3, 5, 7])
    const chain = { v: "1", children: [null, { v: "2", children: [null, { v: "3", children: [null, { v: "4", children: [null, { v: "5", children: [null, null] }] }] }] }] }
    return (
        <Figure caption="Same kind of values, very different speed. Inserting 4, 2, 6, 1, 3, 5, 7 builds a balanced tree (height 3, searches take ~log n steps). Inserting 1, 2, 3, 4, 5 in sorted order builds a chain (height n, searches take n steps, no better than a list). Self balancing trees (AVL, red black) exist to prevent the chain.">
            <div className="fig-row">
                <div><TreeViz root={balanced} dx={40} label="balanced BST" /><div className="fig-sub">balanced: O(log n)</div></div>
                <div><TreeViz root={chain} dx={40} dy={50} label="degenerate BST" /><div className="fig-sub">sorted inserts: O(n)</div></div>
            </div>
        </Figure>
    )
}
