// build a binary tree from LeetCode's level order list, e.g. [3, 9, 20, null, null, 15, 7]
export function bt(values, states = {}) {
    if (!values.length || values[0] === null) return null
    const make = (v, i) => ({ v: String(v), s: states[v], children: [null, null], _i: i })
    const root = make(values[0], 0)
    const queue = [root]
    let i = 1
    while (queue.length && i < values.length) {
        const node = queue.shift()
        for (const side of [0, 1]) {
            if (i < values.length && values[i] !== null && values[i] !== undefined) {
                node.children[side] = make(values[i], i)
                queue.push(node.children[side])
            }
            i++
        }
    }
    return root
}

// map over every node, handy for coloring: mapTree(root, n => n.v === "5" ? { ...n, s: "done" } : n)
export function mapTree(node, fn) {
    if (!node) return null
    const next = fn(node)
    return { ...next, children: (next.children || []).map(c => mapTree(c, fn)) }
}
