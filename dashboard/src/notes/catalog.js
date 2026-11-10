// the table of contents for the notes: order, grouping, and which LeetCode tag each note covers.
// `topic` must match the tag name in ml/topics.py so the notes can show my solve counts.
// the note text itself lives in content/<slug>.md

export const GROUPS = [
    {
        name: "Arrays and Hashing",
        notes: [
            { slug: "array", topic: "Array", title: "Arrays", summary: "Indexing, in place tricks, and the patterns every other topic builds on." },
            { slug: "hash-table", topic: "Hash Table", title: "Hash Tables", summary: "Trade memory for O(1) lookups: counting, grouping, and complement search." },
            { slug: "string", topic: "String", title: "Strings", summary: "Immutable arrays of characters: building, comparing, and palindromes." },
            { slug: "prefix-sum", topic: "Prefix Sum", title: "Prefix Sum", summary: "Precompute running totals so any range sum is one subtraction." },
            { slug: "sorting", topic: "Sorting", title: "Sorting", summary: "When sorting first makes the problem easy, plus merge sort and quickselect." },
            { slug: "matrix", topic: "Matrix", title: "Matrix", summary: "2D grids: directions, boundaries, rotation, and spiral order." },
        ],
    },
    {
        name: "Pointers and Windows",
        notes: [
            { slug: "two-pointers", topic: "Two Pointers", title: "Two Pointers", summary: "Two indexes moving with a rule, so one pass replaces a nested loop." },
            { slug: "sliding-window", topic: "Sliding Window", title: "Sliding Window", summary: "Grow the right edge, shrink the left edge, track what is inside." },
        ],
    },
    {
        name: "Stacks, Searching, Lists",
        notes: [
            { slug: "stack", topic: "Stack", title: "Stack", summary: "Last in, first out: matching, undo, and evaluating expressions." },
            { slug: "monotonic-stack", topic: "Monotonic Stack", title: "Monotonic Stack", summary: "Keep the stack sorted to answer next greater and next smaller in O(n)." },
            { slug: "binary-search", topic: "Binary Search", title: "Binary Search", summary: "Halve the search space each step, on arrays and on answers." },
            { slug: "linked-list", topic: "Linked List", title: "Linked List", summary: "Pointer rewiring, dummy heads, and fast and slow pointers." },
        ],
    },
    {
        name: "Trees",
        notes: [
            { slug: "tree", topic: "Tree", title: "Tree Traversal", summary: "Preorder, inorder, postorder positions and the two ways to think recursively." },
            { slug: "binary-tree", topic: "Binary Tree", title: "Binary Tree Patterns", summary: "Depth, diameter, level order, LCA, and building trees." },
            { slug: "binary-search-tree", topic: "Binary Search Tree", title: "Binary Search Tree", summary: "Left smaller, right bigger: search, validate, and sorted inorder." },
            { slug: "heap", topic: "Heap (Priority Queue)", title: "Heap", summary: "Always know the min or max: top k, merging, and two heaps." },
            { slug: "trie", topic: "Trie", title: "Trie", summary: "A tree of characters for fast prefix lookups." },
        ],
    },
    {
        name: "Graphs",
        notes: [
            { slug: "dfs", topic: "Depth-First Search", title: "Depth-First Search", summary: "Go deep first: islands, paths, and connected pieces." },
            { slug: "bfs", topic: "Breadth-First Search", title: "Breadth-First Search", summary: "Go level by level: shortest paths in unweighted graphs and grids." },
            { slug: "graph", topic: "Graph Theory", title: "Graphs", summary: "Building adjacency lists, cycle detection, and Dijkstra." },
            { slug: "topological-sort", topic: "Topological Sort", title: "Topological Sort", summary: "Order tasks so every prerequisite comes first." },
            { slug: "union-find", topic: "Union-Find", title: "Union-Find", summary: "Track which items are connected, with near O(1) merges." },
        ],
    },
    {
        name: "Recursion and Optimization",
        notes: [
            { slug: "recursion", topic: "Recursion", title: "Recursion", summary: "Base case, trust the call, combine the result." },
            { slug: "backtracking", topic: "Backtracking", title: "Backtracking", summary: "Walk a decision tree: choose, explore, undo." },
            { slug: "dynamic-programming", topic: "Dynamic Programming", title: "Dynamic Programming", summary: "Recursion plus a memo, then the same thing as a table." },
            { slug: "greedy", topic: "Greedy", title: "Greedy", summary: "Take the best local choice when I can prove it never hurts." },
            { slug: "bit-manipulation", topic: "Bit Manipulation", title: "Bit Manipulation", summary: "XOR tricks, masks, and counting bits." },
        ],
    },
]

export const NOTES = GROUPS.flatMap(g => g.notes.map(n => ({ ...n, group: g.name })))

export const noteBySlug = slug => NOTES.find(n => n.slug === slug)
export const noteForTopic = topic => NOTES.find(n => n.topic === topic)
