## The idea

Depth-first search explores as far as it can down one path before backing up and trying the next. On a tree that's just the preorder walk. On a graph or grid I need one extra thing: a **visited** set, because unlike a tree, a graph can lead me back to where I've already been.

Use DFS when I need to **reach everything connected** to a starting point: count islands, find connected components, check if a path exists, copy a graph, or explore all possibilities (which is [backtracking](#/notes/backtracking)). If I need the **shortest** path in steps, use [BFS](#/notes/bfs) instead.

## The graph template

```python title="dfs on an adjacency list"
def dfs(node, graph, visited):
    if node in visited:
        return
    visited.add(node)                 # mark BEFORE recursing, or cycles loop forever
    # ... do something with node ...
    for neighbor in graph[node]:
        dfs(neighbor, graph, visited)
```

```diagram
GraphOrder
```

Most graph problems hand me edges, not an adjacency list. Build one first:

```python
from collections import defaultdict
graph = defaultdict(list)
for a, b in edges:
    graph[a].append(b)
    graph[b].append(a)        # leave this line out for a directed graph
```

## Counting connected pieces

Loop over every node. Each time I find one that isn't visited yet, I've found a new component; run DFS to mark all of it.

```python title="547. Number of Provinces"
class Solution:
    def findCircleNum(self, isConnected: list[list[int]]) -> int:
        n = len(isConnected)
        visited = set()

        def dfs(city):
            visited.add(city)
            for other in range(n):
                if isConnected[city][other] and other not in visited:
                    dfs(other)

        provinces = 0
        for city in range(n):
            if city not in visited:     # a city nobody reached yet: a new province
                provinces += 1
                dfs(city)
        return provinces
```

## DFS on a grid

A grid is a graph where each cell connects to its 4 neighbours. I don't need to build the graph, just step with `(dr, dc)`. A common trick is to **mark visited cells in the grid itself** (like turning land into water) so no separate set is needed.

```diagram
Islands
```

```python title="200. Number of Islands"
class Solution:
    def numIslands(self, grid: list[list[str]]) -> int:
        rows, cols = len(grid), len(grid[0])

        def sink(r, c):
            # stop at the edge of the grid, at water, or at land we already sank
            if r < 0 or c < 0 or r >= rows or c >= cols or grid[r][c] != "1":
                return
            grid[r][c] = "0"                  # mark visited by sinking it
            sink(r + 1, c); sink(r - 1, c)
            sink(r, c + 1); sink(r, c - 1)

        count = 0
        for r in range(rows):
            for c in range(cols):
                if grid[r][c] == "1":         # unvisited land: a new island
                    count += 1
                    sink(r, c)
        return count
```

Returning a value turns this into Max Area of Island (695): `return 1 + sink(...) + sink(...) + ...`.

## Start from the border

Sometimes checking each region directly is awkward. **Reverse the question** and search from the places that are definitely safe.

```diagram
BorderDFS
```

```python title="130. Surrounded Regions"
class Solution:
    def solve(self, board: list[list[str]]) -> None:
        rows, cols = len(board), len(board[0])

        def mark_safe(r, c):
            if r < 0 or c < 0 or r >= rows or c >= cols or board[r][c] != "O":
                return
            board[r][c] = "S"                 # S = connected to the border
            mark_safe(r + 1, c); mark_safe(r - 1, c)
            mark_safe(r, c + 1); mark_safe(r, c - 1)

        for r in range(rows):                 # left and right columns
            mark_safe(r, 0); mark_safe(r, cols - 1)
        for c in range(cols):                 # top and bottom rows
            mark_safe(0, c); mark_safe(rows - 1, c)

        for r in range(rows):
            for c in range(cols):
                if board[r][c] == "O":
                    board[r][c] = "X"         # never reached from the border: captured
                elif board[r][c] == "S":
                    board[r][c] = "O"         # restore the safe ones
```

Pacific Atlantic Water Flow (417) is the same idea twice: DFS uphill from the Pacific edges, DFS uphill from the Atlantic edges, and answer with the cells both searches reached.

## Iterative DFS

Deep recursion can hit Python's recursion limit (about 1000 calls) on big grids. An explicit stack does the same job:

```python title="dfs with a stack"
def dfs_iterative(start, graph):
    visited = {start}
    stack = [start]
    while stack:
        node = stack.pop()
        # ... do something with node ...
        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)     # mark when pushing, so nothing is pushed twice
                stack.append(neighbor)
    return visited
```

> **Tip:** On LeetCode I can also raise the limit with `sys.setrecursionlimit(10**6)`, but the stack version is the safer habit.

## Copying a graph

Clone Graph (133) is DFS plus a dict from original node to its copy. The dict doubles as the visited set.

```python title="133. Clone Graph"
class Solution:
    def cloneGraph(self, node):
        copies = {}                              # original -> clone

        def clone(n):
            if n in copies:
                return copies[n]                 # already made (also handles cycles)
            copy = Node(n.val)
            copies[n] = copy                     # register BEFORE cloning neighbours
            copy.neighbors = [clone(nb) for nb in n.neighbors]
            return copy

        return clone(node) if node else None
```

## Complexity

Every node and edge is handled once: **O(V + E)** for graphs, **O(rows × cols)** for grids. Space is the visited set plus the recursion depth, up to O(V).

## Practice

```problems
733 | Flood Fill | flood-fill | Easy | the simplest grid DFS
463 | Island Perimeter | island-perimeter | Easy | count water neighbours
200 | Number of Islands | number-of-islands | Medium | sink each island
695 | Max Area of Island | max-area-of-island | Medium | DFS returns a size
547 | Number of Provinces | number-of-provinces | Medium | components in a matrix
841 | Keys and Rooms | keys-and-rooms | Medium | can I reach everything?
133 | Clone Graph | clone-graph | Medium | dict of copies
130 | Surrounded Regions | surrounded-regions | Medium | DFS from the border
417 | Pacific Atlantic Water Flow | pacific-atlantic-water-flow | Medium | two border searches
1020 | Number of Enclaves | number-of-enclaves | Medium | border DFS, then count
```
