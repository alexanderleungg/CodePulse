import { TreeViz, ArrayViz, Figure, bt, mapTree } from "../kit"

export function Diameter() {
    // tree [1,2,null,4,5,8,null,null,9]: the longest path 8-4-2-5-9 turns at 2 and never touches the root
    const height = { 8: 1, 9: 1, 4: 2, 5: 2, 2: 3, 1: 4 }
    const onPath = new Set(["8", "4", "2", "5", "9"])
    const root = mapTree(bt([1, 2, null, 4, 5, 8, null, null, 9]), n => ({
        ...n,
        s: n.v === "2" ? "found" : onPath.has(n.v) ? "done" : undefined,
        es: onPath.has(n.v) && n.v !== "2" ? "done" : undefined,
        note: `h=${height[n.v]}`,
    }))
    return (
        <Figure
            caption="Diameter: the longest path between any two nodes, counted in edges. Every path has a highest node where it turns, and there its length is left height + right height. At node 2 that's 2 + 2 = 4. At the root it's only 3 + 0 = 3, so the longest path doesn't go through the root. Each call RETURNS its height and UPDATES the best diameter on the side."
            legend={[{ s: "found", label: "where the longest path turns" }, { s: "done", label: "the longest path (4 edges)" }]}
        >
            <TreeViz root={root} dx={52} label="diameter of binary tree" />
        </Figure>
    )
}

export function GoodNodes() {
    // pass the max seen on the path down; a node is good if nothing above it is bigger
    const node = (v, above, children = [null, null]) => ({
        v,
        s: above === "none" || Number(v) >= above ? "done" : "bad",
        note: `max above: ${above}`,
        children,
    })
    const tree = node("3", "none", [
        node("1", 3, [node("3", 3), null]),
        node("4", 3, [node("1", 4), node("5", 4)]),
    ])
    return (
        <Figure
            caption="Count Good Nodes: a node is good if no node on the path from the root down to it is bigger. Pass the maximum seen so far DOWN as an argument (preorder), and compare each node against it. Here 4 nodes are good."
            legend={[{ s: "done", label: "good (>= everything above it)" }, { s: "bad", label: "not good" }]}
        >
            <TreeViz root={tree} dx={60} label="good nodes" />
        </Figure>
    )
}

export function RightSideView() {
    const levels = { 1: 0, 2: 1, 3: 1, 5: 2, 4: 2, 7: 3 }
    const rightmost = new Set(["1", "3", "4", "7"])
    const root = mapTree(bt([1, 2, 3, null, 5, null, 4, 7]), n => ({
        ...n,
        s: rightmost.has(n.v) ? "found" : undefined,
        note: `level ${levels[n.v]}`,
    }))
    return (
        <Figure
            caption="Right Side View: go level by level with a queue (BFS) and keep the LAST node of each level. Note that 7 is visible from the right even though it's a left child, because nothing else is on its level."
            legend={[{ s: "found", label: "last node of its level: what I see from the right" }]}
        >
            <TreeViz root={root} dx={52} label="right side view" />
        </Figure>
    )
}

export function LCA() {
    // p = 7, q = 4: both live under node 2, one on each side, so 2 is where their paths up to the root meet
    const notes = {
        7: "p",
        4: "q",
        2: "LCA",
        5: "gets 2",
        3: "gets 2",
        6: "None",
        1: "None",
    }
    const root = mapTree(bt([3, 5, 1, 6, 2, 0, 8, null, null, 7, 4]), n => ({
        ...n,
        s: n.v === "2" ? "found" : n.v === "7" || n.v === "4" ? "active" : ["5", "3"].includes(n.v) ? "window" : undefined,
        es: ["7", "4", "2", "5"].includes(n.v) ? "active" : undefined,
        note: notes[n.v],
        noteColor: n.v === "2" ? "yellow" : undefined,
    }))
    return (
        <Figure
            caption="Lowest Common Ancestor of p = 7 and q = 4. Each call returns p or q if it finds one in its subtree, otherwise None. Node 2 gets 7 back from its left and 4 back from its right, so 2 is the lowest node with one on each side: the answer. Above it, each node just passes that answer up."
            legend={[{ s: "active", label: "p and q" }, { s: "found", label: "LCA: non None from both sides" }, { s: "window", label: "passing the answer up" }]}
        >
            <TreeViz root={root} dx={58} dy={72} label="lowest common ancestor" />
        </Figure>
    )
}

export function BuildTree() {
    return (
        <Figure
            caption="Build from preorder + inorder. Preorder's first value is the root (3). Find 3 in inorder: everything left of it (9) is the left subtree, everything right (15, 20, 7) is the right subtree. The sizes also say how to split preorder. Recurse on each half."
            legend={[{ s: "found", label: "root" }, { s: "active", label: "left subtree" }, { s: "window", label: "right subtree" }]}
        >
            <div className="fig-row">
                <div style={{ width: "fit-content" }}>
                    <ArrayViz items={[3, 9, 20, 15, 7]} title="preorder" align="left" states={{ 0: "found", 1: "active", 2: "window", 3: "window", 4: "window" }} />
                    <ArrayViz items={[9, 3, 15, 20, 7]} title="inorder " align="left" states={{ 1: "found", 0: "active", 2: "window", 3: "window", 4: "window" }} />
                </div>
                <TreeViz root={mapTree(bt([3, 9, 20, null, null, 15, 7]), n => ({ ...n, s: n.v === "3" ? "found" : n.v === "9" ? "active" : "window" }))} label="rebuilt tree" />
            </div>
        </Figure>
    )
}
