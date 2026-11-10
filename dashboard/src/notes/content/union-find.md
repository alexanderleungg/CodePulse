## The idea

Union-Find (also called a disjoint set union, or DSU) keeps track of which items are in the same group, and it supports two operations, both nearly O(1):

- **find(x)**: which group is x in? (returns the group's representative, its **root**)
- **union(a, b)**: merge a's group and b's group

Each group is stored as a tree where every node points to its parent, and the root points to itself. Two items are in the same group exactly when they have the same root.

Use it when connections arrive **one at a time** and I keep asking "are these connected now?", or when I need to spot the edge that closes a cycle.

```diagram
Unions
```

## Keeping the trees flat

Without care, unions can build a long chain and `find` becomes O(n). Two small tricks fix that:

1. **Union by size**: attach the smaller tree under the bigger one, so trees stay shallow.
2. **Path compression**: during `find`, point every node on the path straight at the root.

```diagram
Compression
```

## The template

```python title="union find"
class UnionFind:
    def __init__(self, n):
        self.parent = list(range(n))   # everyone starts as their own root
        self.size = [1] * n
        self.groups = n                # number of separate sets

    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])   # path compression
        return self.parent[x]

    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return False               # already connected (this edge would make a cycle)
        if self.size[ra] < self.size[rb]:
            ra, rb = rb, ra            # make ra the bigger tree
        self.parent[rb] = ra           # hang the smaller tree under it
        self.size[ra] += self.size[rb]
        self.groups -= 1
        return True
```

Returning `True` or `False` from `union` is the useful trick: `False` means "these were already connected".

## Counting groups

Every successful union merges two groups into one, so the group count just goes down by one each time.

```python title="547. Number of Provinces (union find version)"
class Solution:
    def findCircleNum(self, isConnected: list[list[int]]) -> int:
        n = len(isConnected)
        parent = list(range(n))

        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]   # path halving: a short iterative compression
                x = parent[x]
            return x

        groups = n
        for i in range(n):
            for j in range(i + 1, n):
                if isConnected[i][j]:
                    ri, rj = find(i), find(j)
                    if ri != rj:
                        parent[ri] = rj
                        groups -= 1
        return groups
```

## Finding the edge that makes a cycle

In an undirected graph, adding an edge between two nodes that are **already connected** closes a loop.

```diagram
Redundant
```

```python title="684. Redundant Connection"
class Solution:
    def findRedundantConnection(self, edges: list[list[int]]) -> list[int]:
        parent = list(range(len(edges) + 1))   # nodes are numbered 1..n

        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x

        for a, b in edges:
            ra, rb = find(a), find(b)
            if ra == rb:
                return [a, b]                  # already connected: this edge is the extra one
            parent[ra] = rb
        return []
```

This is also the heart of **Kruskal's algorithm** for minimum spanning trees: sort edges by weight and keep every edge whose `union` succeeds.

## Grouping by something other than edges

The items don't have to be graph nodes. Anything with an "these two belong together" rule works: accounts sharing an email (721), variables forced equal (990), stones sharing a row or column (947). Map each item to an index (or use a dict for `parent`) and union whenever the rule says so.

```python title="990. Satisfiability of Equality Equations"
class Solution:
    def equationsPossible(self, equations: list[str]) -> bool:
        parent = {c: c for c in "abcdefghijklmnopqrstuvwxyz"}

        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x

        for eq in equations:                 # first: merge everything that must be equal
            if eq[1] == "=":
                parent[find(eq[0])] = find(eq[3])
        for eq in equations:                 # then: no "!=" may join two members of one group
            if eq[1] == "!" and find(eq[0]) == find(eq[3]):
                return False
        return True
```

## Union-Find or DFS?

Both answer connectivity questions. Pick Union-Find when **edges arrive over time** and I query in between, when I need "which edge closed a cycle", or for Kruskal. Pick DFS/BFS when the graph is given all at once and I also need paths or distances.

## Practice

```problems
1971 | Find if Path Exists in Graph | find-if-path-exists-in-graph | Easy | same root?
547 | Number of Provinces | number-of-provinces | Medium | count groups
684 | Redundant Connection | redundant-connection | Medium | union that fails
1319 | Number of Operations to Make Network Connected | number-of-operations-to-make-network-connected | Medium | groups - 1 cables
990 | Satisfiability of Equality Equations | satisfiability-of-equality-equations | Medium | union first, then check
721 | Accounts Merge | accounts-merge | Medium | union by shared email
947 | Most Stones Removed with Same Row or Column | most-stones-removed-with-same-row-or-column | Medium | stones - groups
1584 | Min Cost to Connect All Points | min-cost-to-connect-all-points | Medium | Kruskal
```
