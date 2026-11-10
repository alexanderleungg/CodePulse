import { TreeViz, ArrayViz, Figure, Stepper, bt, mapTree } from "../kit"

// the example tree used throughout:      1
//                                      /   \
//                                     2     5
//                                    / \     \
//                                   3   4     6
const VALUES = [1, 2, 5, 3, 4, null, 6]

function walkFrames() {
    const root = bt(VALUES)
    const pre = []
    const ino = []
    const post = []
    const frames = []
    const snap = (node, where, caption) => {
        const current = node ? node.v : null
        const colored = mapTree(root, n => ({
            ...n,
            s: n.v === current ? (where === "pre" ? "active" : where === "in" ? "found" : "done") : post.includes(n.v) ? "muted" : undefined,
        }))
        frames.push({
            caption,
            view: (
                <div className="fig-row">
                    <TreeViz root={colored} label="tree walk" />
                    <div style={{ width: "fit-content" }}>
                        <ArrayViz items={pre.length ? [...pre] : ["-"]} title="preorder " align="left" showIndex={false} cell={34} states={where === "pre" ? { [pre.length - 1]: "active" } : {}} />
                        <ArrayViz items={ino.length ? [...ino] : ["-"]} title="inorder  " align="left" showIndex={false} cell={34} states={where === "in" ? { [ino.length - 1]: "found" } : {}} />
                        <ArrayViz items={post.length ? [...post] : ["-"]} title="postorder" align="left" showIndex={false} cell={34} states={where === "post" ? { [post.length - 1]: "done" } : {}} />
                    </div>
                </div>
            ),
        })
    }
    const walk = node => {
        if (!node) return
        pre.push(node.v)
        snap(node, "pre", `Arrive at ${node.v}: PREORDER position, before visiting any children.`)
        walk(node.children[0])
        ino.push(node.v)
        snap(node, "in", `Back at ${node.v} after the left subtree: INORDER position, between the two children.`)
        walk(node.children[1])
        post.push(node.v)
        snap(node, "post", `Leaving ${node.v} after both subtrees: POSTORDER position. Everything below ${node.v} is finished.`)
    }
    walk(root)
    frames[frames.length - 1].caption += " Every node was visited at three moments; the three lists are just 'what order did each moment happen in'."
    return frames
}

export function ThreePositions() {
    return (
        <Stepper
            title="One walk, three positions"
            frames={walkFrames()}
            legend={[{ s: "active", label: "preorder moment" }, { s: "found", label: "inorder moment" }, { s: "done", label: "postorder moment" }, { s: "muted", label: "finished" }]}
        />
    )
}

export function OrderBadges() {
    const pre = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6 }
    const ino = { 3: 1, 2: 2, 4: 3, 1: 4, 5: 5, 6: 6 }
    const post = { 3: 1, 4: 2, 2: 3, 6: 4, 5: 5, 1: 6 }
    const tree = order => mapTree(bt(VALUES), n => ({ ...n, badge: order[n.v] }))
    return (
        <Figure caption="The same tree numbered three ways. Preorder puts the root first, postorder puts it last, and inorder puts it between its left and right subtrees (on a BST, that's sorted order).">
            <div className="fig-row">
                <div><TreeViz root={tree(pre)} dx={42} label="preorder numbering" /><div className="fig-sub">preorder: 1 2 3 4 5 6</div></div>
                <div><TreeViz root={tree(ino)} dx={42} label="inorder numbering" /><div className="fig-sub">inorder: 3 2 4 1 5 6</div></div>
                <div><TreeViz root={tree(post)} dx={42} label="postorder numbering" /><div className="fig-sub">postorder: 3 4 2 6 5 1</div></div>
            </div>
        </Figure>
    )
}

export function Decompose() {
    // max depth, decompose style: every node's answer is 1 + max(left answer, right answer)
    const depth = { 3: 1, 4: 1, 6: 1, 2: 2, 5: 2, 1: 3 }
    const root = mapTree(bt(VALUES), n => ({ ...n, note: `returns ${depth[n.v]}`, noteColor: "green", s: n.v === "1" ? "done" : undefined }))
    return (
        <Figure caption="Decompose thinking for max depth: each call returns the depth of ITS subtree. A leaf returns 1. Node 2 gets 1 from both children and returns 1 + max(1, 1) = 2. The root combines 2 and 2 into 3. The work happens in the postorder position, after the children answer.">
            <TreeViz root={root} dy={74} label="max depth by decomposition" />
        </Figure>
    )
}
