## The idea

A topological order lists the nodes of a directed graph so that **every edge points forward**: if `a -> b` means "a must come before b", then a appears before b in the list. It's the answer to "in what order can I do these tasks, given the prerequisites?"

It only exists when the graph has **no cycles** (a DAG, directed acyclic graph). If A needs B and B needs A, no order works. So topological sort doubles as a cycle detector.

## Kahn's algorithm (BFS)

The idea: anything with **no remaining prerequisites** can go next. Take it, cross it off everyone's prerequisite list, and repeat.

```diagram
Kahn
```

```python title="210. Course Schedule II"
from collections import deque

class Solution:
    def findOrder(self, numCourses: int, prerequisites: list[list[int]]) -> list[int]:
        graph = [[] for _ in range(numCourses)]
        indeg = [0] * numCourses              # how many prerequisites each course still waits on
        for course, pre in prerequisites:     # [a, b] means "take b before a": edge b -> a
            graph[pre].append(course)
            indeg[course] += 1

        queue = deque(c for c in range(numCourses) if indeg[c] == 0)
        order = []
        while queue:
            c = queue.popleft()
            order.append(c)
            for nxt in graph[c]:
                indeg[nxt] -= 1               # one fewer prerequisite
                if indeg[nxt] == 0:
                    queue.append(nxt)         # all prerequisites done: ready

        return order if len(order) == numCourses else []   # leftovers = a cycle
```

> **Tip:** Read the edge direction carefully. In Course Schedule, `[a, b]` means "b before a", so the edge goes **b -> a**. Getting it backwards gives a reversed (wrong) order.

## Why a cycle stops it

```diagram
Stuck
```

Course Schedule (207) asks only "is it possible?", which is the same code returning `len(order) == numCourses`.

## The DFS version

Topological order is also **reverse postorder** of a DFS. A node finishes (postorder) only after everything that depends on it has finished, so reversing the finish order puts prerequisites first. The three color cycle check from the [Graphs](#/notes/graph) note slots straight in.

```python title="topological sort with DFS"
def topo_sort(n, graph):
    UNVISITED, ON_PATH, DONE = 0, 1, 2
    state = [UNVISITED] * n
    finished = []

    def dfs(u):
        state[u] = ON_PATH
        for v in graph[u]:
            if state[v] == ON_PATH:
                return False                  # cycle
            if state[v] == UNVISITED and not dfs(v):
                return False
        state[u] = DONE
        finished.append(u)                    # postorder: u is done after everything it points to
        return True

    for u in range(n):
        if state[u] == UNVISITED and not dfs(u):
            return []
    return finished[::-1]                     # reverse postorder = topological order
```

Both are O(V + E). Kahn's is usually easier to get right and naturally gives "levels" (everything in the queue at once could be done in parallel), which is handy for "minimum number of semesters" style questions.

## Where it shows up

- prerequisites, build systems, task scheduling
- "is this set of rules consistent?" (cycle check)
- ordering letters from a sorted list of words (Alien Dictionary)
- dependency chains in recipes and supplies (Find All Possible Recipes, 2115)
- trimming leaves layer by layer, a Kahn's style idea on undirected trees (Minimum Height Trees, 310)

## Practice

```problems
207 | Course Schedule | course-schedule | Medium | is there a cycle?
210 | Course Schedule II | course-schedule-ii | Medium | return the order
1462 | Course Schedule IV | course-schedule-iv | Medium | prerequisites of prerequisites
802 | Find Eventual Safe States | find-eventual-safe-states | Medium | reverse graph + Kahn
2115 | Find All Possible Recipes from Given Supplies | find-all-possible-recipes-from-given-supplies | Medium | ingredients as prerequisites
310 | Minimum Height Trees | minimum-height-trees | Medium | peel leaves layer by layer
```
