## The idea

A graph is a set of **nodes** (vertices) connected by **edges**. Trees, grids, and linked lists are all special graphs. The general case adds three complications: edges can have a **direction**, they can have a **weight**, and there can be **cycles**.

Most graph problems are one of a handful of questions:

| Question | Tool |
|---|---|
| Can I reach X? How many connected pieces? | [DFS](#/notes/dfs), [BFS](#/notes/bfs), or [Union-Find](#/notes/union-find) |
| Fewest edges from A to B? | [BFS](#/notes/bfs) |
| Cheapest path when edges have weights? | **Dijkstra** (below) |
| Is there a cycle? | three color DFS (below), or [topological sort](#/notes/topological-sort) |
| What order satisfies all the dependencies? | [Topological sort](#/notes/topological-sort) |
| Can it be split into two groups? | bipartite coloring (below) |
| Cheapest way to connect everything? | minimum spanning tree (below) |

## Storing a graph

```diagram
Representations
```

```python title="edge list to adjacency list"
from collections import defaultdict

def build(n, edges, directed=False):
    graph = defaultdict(list)          # or [[] for _ in range(n)] when nodes are 0..n-1
    for a, b in edges:
        graph[a].append(b)
        if not directed:
            graph[b].append(a)         # undirected: the edge works both ways
    return graph

# weighted: store (neighbor, weight) pairs
# graph[a].append((b, w))
```

## Warm up: degrees

Some graph problems don't need a search at all, just counting edges per node. A node's **in degree** is how many edges point at it and its **out degree** is how many leave it.

```python title="997. Find the Town Judge"
class Solution:
    def findJudge(self, n: int, trust: list[list[int]]) -> int:
        score = [0] * (n + 1)
        for a, b in trust:
            score[a] -= 1      # a trusts someone: can't be the judge
            score[b] += 1      # b is trusted by one more person
        for person in range(1, n + 1):
            if score[person] == n - 1:     # trusted by everyone else, trusts nobody
                return person
        return -1
```

## Cycles in a directed graph

In an undirected graph, any edge back to an already visited node (other than the parent I came from) is a cycle. Directed graphs need more care, because two paths can meet at the same node without forming a loop.

```diagram
ThreeColors
```

```python title="cycle detection in a directed graph"
def has_cycle(n, graph):
    UNVISITED, ON_PATH, DONE = 0, 1, 2
    state = [UNVISITED] * n

    def dfs(u):
        state[u] = ON_PATH
        for v in graph[u]:
            if state[v] == ON_PATH:
                return True                  # walked back into our own path: a loop
            if state[v] == UNVISITED and dfs(v):
                return True
        state[u] = DONE                      # postorder: everything below u is clean
        return False

    return any(state[u] == UNVISITED and dfs(u) for u in range(n))
```

Course Schedule (207) is exactly this question: "can all courses be taken?" means "is the prerequisite graph free of cycles?"

## Two coloring (bipartite)

```diagram
Bipartite
```

```python title="785. Is Graph Bipartite?"
from collections import deque

class Solution:
    def isBipartite(self, graph: list[list[int]]) -> bool:
        color = {}
        for start in range(len(graph)):          # the graph may be in several pieces
            if start in color:
                continue
            color[start] = 0
            queue = deque([start])
            while queue:
                u = queue.popleft()
                for v in graph[u]:
                    if v not in color:
                        color[v] = 1 - color[u]  # the opposite color
                        queue.append(v)
                    elif color[v] == color[u]:
                        return False             # an edge inside one color group
        return True
```

## Weighted shortest paths: Dijkstra

BFS counts edges, so it breaks when edges have different costs. Dijkstra fixes that with a **min heap**: always expand the closest unfinished node. Once a node comes off the heap, its distance is final, because every other route to it would have to pass through something even farther away. This only holds when weights are **not negative**.

```diagram
Dijkstra
```

```python title="743. Network Delay Time"
import heapq
from collections import defaultdict

class Solution:
    def networkDelayTime(self, times: list[list[int]], n: int, k: int) -> int:
        graph = defaultdict(list)
        for u, v, w in times:
            graph[u].append((v, w))

        dist = {}                          # finalized distances
        heap = [(0, k)]                    # (distance so far, node)
        while heap:
            d, u = heapq.heappop(heap)
            if u in dist:
                continue                   # stale entry: u was already finalized cheaper
            dist[u] = d
            for v, w in graph[u]:
                if v not in dist:
                    heapq.heappush(heap, (d + w, v))

        return max(dist.values()) if len(dist) == n else -1
```

This "lazy" version pushes duplicates and skips stale ones on the way out, which is simpler than updating entries in place. It runs in O(E log E).

When the path is also limited to at most k edges (Cheapest Flights Within K Stops, 787), Dijkstra's "final once popped" rule breaks. Use Bellman-Ford style relaxation for k + 1 rounds, or BFS by levels.

## Connecting everything cheaply: minimum spanning tree

To connect all nodes with the smallest total edge weight, grow a tree from any node and always add the cheapest edge that reaches a new node (Prim's algorithm). It's Dijkstra's heap loop, except the priority is the **edge weight**, not the total distance.

```python title="1584. Min Cost to Connect All Points"
import heapq

class Solution:
    def minCostConnectPoints(self, points: list[list[int]]) -> int:
        n = len(points)
        in_tree = set()
        heap = [(0, 0)]                     # (cost to attach this point, point index)
        total = 0
        while len(in_tree) < n:
            cost, i = heapq.heappop(heap)
            if i in in_tree:
                continue
            in_tree.add(i)
            total += cost
            xi, yi = points[i]
            for j in range(n):
                if j not in in_tree:
                    xj, yj = points[j]
                    heapq.heappush(heap, (abs(xi - xj) + abs(yi - yj), j))
        return total
```

Kruskal's algorithm (sort edges, add each one unless it makes a cycle) is the other classic, and it uses [Union-Find](#/notes/union-find) for the cycle check.

## Practice

```problems
1971 | Find if Path Exists in Graph | find-if-path-exists-in-graph | Easy | build + DFS
997 | Find the Town Judge | find-the-town-judge | Easy | degrees only
797 | All Paths From Source to Target | all-paths-from-source-to-target | Medium | DFS on a DAG
785 | Is Graph Bipartite? | is-graph-bipartite | Medium | two coloring
207 | Course Schedule | course-schedule | Medium | directed cycle check
743 | Network Delay Time | network-delay-time | Medium | Dijkstra
1514 | Path with Maximum Probability | path-with-maximum-probability | Medium | Dijkstra with a max heap
787 | Cheapest Flights Within K Stops | cheapest-flights-within-k-stops | Medium | Bellman-Ford rounds
1584 | Min Cost to Connect All Points | min-cost-to-connect-all-points | Medium | Prim's MST
```
