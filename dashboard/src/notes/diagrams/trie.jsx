import { TreeViz, Figure } from "../kit"

const WORDS = ["car", "card", "care", "cat", "do", "dog"]

// build the trie as a tree for the diagram. color(prefix) picks a state per node
function trieTree(color = () => ({})) {
    const root = { v: "root", children: {} }
    for (const w of WORDS) {
        let node = root
        let prefix = ""
        for (const ch of w) {
            prefix += ch
            node.children[ch] = node.children[ch] || { v: ch, prefix, children: {} }
            node = node.children[ch]
        }
        node.end = true
    }
    const convert = node => ({
        v: node.v,
        note: node.end ? "end" : undefined,
        noteColor: "green",
        ...(node.end ? { s: "done" } : {}),
        ...color(node.prefix || ""),
        edge: undefined,
        children: Object.values(node.children).map(convert),
    })
    return convert(root)
}

export function Structure() {
    return (
        <Figure
            caption={'A trie for car, card, care, cat, do, dog. Each node is one character, and the path from the root spells a prefix. Words that share a start share a path: "car", "card", and "care" all reuse c → a → r. Green nodes are where a real word ENDS, which is how the trie knows "car" is a word but "ca" is not.'}
            legend={[{ s: "done", label: "is_end = True: a word ends here" }]}
        >
            <TreeViz root={trieTree()} binary={false} dx={46} dy={70} label="trie" />
        </Figure>
    )
}

export function SearchVsPrefix() {
    const search = trieTree(p => ("card".startsWith(p) && p ? { s: p === "card" ? "done" : "active", es: "active" } : {}))
    const prefix = trieTree(p => ("ca".startsWith(p) && p ? { s: "found", es: "found" } : {}))
    return (
        <Figure caption={'search("card") walks c → a → r → d and then checks that the last node is marked as an end. startsWith("ca") walks c → a and stops: reaching the node is enough, no end mark needed. Both take O(length of the word), no matter how many words are stored.'}>
            <div className="fig-row">
                <div><TreeViz root={search} binary={false} dx={40} dy={66} label="search card" /><div className="fig-sub">search("card"): True</div></div>
                <div><TreeViz root={prefix} binary={false} dx={40} dy={66} label="starts with ca" /><div className="fig-sub">startsWith("ca"): True</div></div>
            </div>
        </Figure>
    )
}
