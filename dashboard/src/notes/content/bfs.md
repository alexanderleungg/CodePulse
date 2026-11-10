## The idea

Breadth-first search explores in **rings**: first everything one step from the start, then everything two steps away, and so on. It uses a **queue** (first in, first out), so nodes are processed in the order they were discovered.

That order gives BFS its superpower: in an unweighted graph or grid, **the first time BFS reaches a node, it got there by a shortest path**. Any time a problem says "minimum number of steps / moves / transformations", think BFS.

```diagram
Layers
```

## The template

```python title="bfs with levels"
from collections import deque

def bfs(start, target):
    queue = deque([start])
    visited = {start}             # mark when I ADD to the queue, not when I pop
    steps = 0
    while queue:
        for _ in range(len(queue)):       # process exactly one level
            node = queue.popleft()
            if node == target:
                return steps
            for nxt in neighbors(node):
                if nxt not in visited:
                    visited.add(nxt)
                    queue.append(nxt)
        steps += 1                        # finished a level: everything next is one step further
    return -1                             # target unreachable
```

Two details matter:

1. **Mark visited when enqueuing.** If I wait until popping, the same node can be added many times from different neighbours, which blows up the queue.
2. **`for _ in range(len(queue))`** processes one level at a time, so `steps` counts levels. Skip it when I don't need distances.

## Shortest path on a grid

```diagram
Wavefront
```

```python title="1091. Shortest Path in Binary Matrix"
from collections import deque

class Solution:
    def shortestPathBinaryMatrix(self, grid: list[list[int]]) -> int:
        n = len(grid)
        if grid[0][0] or grid[n - 1][n - 1]:
            return -1                               # start or end is blocked
        queue = deque([(0, 0)])
        grid[0][0] = 1                              # mark visited by writing the path length in
        while queue:
            r, c = queue.popleft()
            if (r, c) == (n - 1, n - 1):
                return grid[r][c]
            for dr in (-1, 0, 1):
                for dc in (-1, 0, 1):               # this problem allows 8 directions
                    nr, nc = r + dr, c + dc
                    if 0 <= nr < n and 0 <= nc < n and grid[nr][nc] == 0:
                        grid[nr][nc] = grid[r][c] + 1
                        queue.append((nr, nc))
        return -1
```

## Multi-source BFS

When there are **several starting points** spreading at the same speed, put all of them in the queue at the start. The levels then measure "distance to the nearest source".

```diagram
Rotting
```

```python title="994. Rotting Oranges"
from collections import deque

class Solution:
    def orangesRotting(self, grid: list[list[int]]) -> int:
        rows, cols = len(grid), len(grid[0])
        queue = deque()
        fresh = 0
        for r in range(rows):
            for c in range(cols):
                if grid[r][c] == 2:
                    queue.append((r, c))       # every rotten orange starts spreading at minute 0
                elif grid[r][c] == 1:
                    fresh += 1

        minutes = 0
        while queue and fresh:
            for _ in range(len(queue)):        # one minute = one level
                r, c = queue.popleft()
                for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nr, nc = r + dr, c + dc
                    if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1:
                        grid[nr][nc] = 2
                        fresh -= 1
                        queue.append((nr, nc))
            minutes += 1
        return minutes if fresh == 0 else -1
```

01 Matrix (542) is the same: start from every 0 and spread outward to fill in distances.

## BFS on an implicit graph

Sometimes the graph isn't given. The **states** are the nodes and a single allowed change is an edge. Word Ladder's nodes are words, and two words connect if they differ by one letter.

```python title="127. Word Ladder"
from collections import deque

class Solution:
    def ladderLength(self, beginWord: str, endWord: str, wordList: list[str]) -> int:
        words = set(wordList)
        if endWord not in words:
            return 0
        queue = deque([(beginWord, 1)])       # (word, how many words in the sequence so far)
        seen = {beginWord}
        while queue:
            word, length = queue.popleft()
            if word == endWord:
                return length
            for i in range(len(word)):
                for ch in "abcdefghijklmnopqrstuvwxyz":
                    nxt = word[:i] + ch + word[i + 1:]    # every word one letter away
                    if nxt in words and nxt not in seen:
                        seen.add(nxt)
                        queue.append((nxt, length + 1))
        return 0
```

Open the Lock (752) and Minimum Genetic Mutation (433) are this exact shape with different "one change" rules.

## BFS or DFS?

| Question | Use |
|---|---|
| fewest steps, shortest path (unweighted) | **BFS** |
| anything by level (tree levels, minutes, rounds) | **BFS** |
| is it connected, count components, flood fill | either (DFS is shorter to write) |
| explore every path or combination | **DFS** / backtracking |
| shortest path with **weights** | Dijkstra, see [Graphs](#/notes/graph) |

## Complexity

Each node enters the queue once and each edge is checked once: **O(V + E)**, or **O(rows × cols)** on a grid. The queue can hold a whole level at once, so space is O(V).

## Practice

```problems
102 | Binary Tree Level Order Traversal | binary-tree-level-order-traversal | Medium | BFS on a tree
1926 | Nearest Exit from Entrance in Maze | nearest-exit-from-entrance-in-maze | Medium | shortest path on a grid
1091 | Shortest Path in Binary Matrix | shortest-path-in-binary-matrix | Medium | 8 directions
994 | Rotting Oranges | rotting-oranges | Medium | multi-source
542 | 01 Matrix | 01-matrix | Medium | multi-source distances
752 | Open the Lock | open-the-lock | Medium | states as nodes
433 | Minimum Genetic Mutation | minimum-genetic-mutation | Medium | one letter changes
127 | Word Ladder | word-ladder | Hard | implicit graph of words
```
