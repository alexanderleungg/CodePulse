## The idea

A recursive function solves a problem by calling itself on a **smaller version** of the same problem. Every recursive function has two parts:

1. **Base case:** an input small enough to answer directly, which stops the recursion.
2. **Recursive case:** shrink the input, call myself, and use that answer to build mine.

The mental trick that makes recursion click: **trust the recursive call.** When writing `fact(n)`, assume `fact(n - 1)` already works and returns the right answer. My only job is to use it correctly and make sure the base case is right. Don't try to trace every level in my head.

```python title="the shape of every recursive function"
def solve(problem):
    if is_small(problem):                # base case: small enough to answer directly
        return direct_answer(problem)
    smaller = shrink(problem)            # make progress toward the base case
    sub_answer = solve(smaller)          # trust it
    return combine(problem, sub_answer)  # build my answer from it
```

## What actually happens: the call stack

Each call gets its own **frame** on the call stack, holding its own variables. A call that needs a sub answer waits on the stack until that sub call returns. Then the stack unwinds, newest call first.

```diagram
CallStack
```

```python
def fact(n):
    if n <= 1:
        return 1              # base case
    return n * fact(n - 1)    # waits for fact(n - 1), then multiplies
```

This is why recursion uses **O(depth)** extra memory, and why Python raises `RecursionError` past about 1000 nested calls.

## Three common shapes

**1. Shrink by one.** Handle the first piece myself, recurse on the rest. Lists and strings are the typical input.

```python title="206. Reverse Linked List (recursive)"
class Solution:
    def reverseList(self, head):
        if head is None or head.next is None:
            return head                   # empty or one node: already reversed
        new_head = self.reverseList(head.next)   # trust: the rest comes back reversed
        head.next.next = head             # the node after me should now point back at me
        head.next = None
        return new_head
```

**2. Split in half.** Divide the input and recurse on a half (or both halves, like merge sort). Halving gives O(log n) depth.

```diagram
PowHalving
```

```python title="50. Pow(x, n)"
class Solution:
    def myPow(self, x: float, n: int) -> float:
        if n < 0:
            return 1 / self.myPow(x, -n)
        if n == 0:
            return 1.0
        half = self.myPow(x, n // 2)      # ONE call, reused twice
        return half * half if n % 2 == 0 else half * half * x
```

**3. Branch.** Make several recursive calls per level: trees, [backtracking](#/notes/backtracking), and recursive definitions like Fibonacci. This is where the cost can explode.

## When branching repeats work

```diagram
FibTree
```

```python title="509. Fibonacci Number"
from functools import cache

class Solution:
    def fib(self, n: int) -> int:
        @cache                       # remember every answer: each fib(k) is computed once
        def f(k):
            if k < 2:
                return k             # fib(0) = 0, fib(1) = 1
            return f(k - 1) + f(k - 2)
        return f(n)
```

`@cache` (from `functools`) stores each result the first time it's computed. That one line turns O(2ⁿ) into O(n). This is **memoization**, the first half of [dynamic programming](#/notes/dynamic-programming).

## How to analyze recursion

- **Time** ≈ (number of calls) × (work per call). Draw the call tree and count the nodes.
- **Space** = maximum depth of the call stack (plus anything I store).

| Recursion | Calls | Time | Depth |
|---|---|---|---|
| shrink by one, O(1) work | n | O(n) | O(n) |
| halve, one call (pow, binary search) | log n | O(log n) | O(log n) |
| halve, two calls, O(n) merge (merge sort) | ~2n | O(n log n) | O(log n) |
| two branches, no memo (naive fib) | ~2ⁿ | O(2ⁿ) | O(n) |
| two branches, memoized | n | O(n) | O(n) |

## Common mistakes

1. **No base case, or one that's never reached**, so the recursion never stops.
2. **Not shrinking the input**, like calling `solve(n)` from inside `solve(n)`.
3. **Ignoring the returned value**: writing `self.helper(node.left)` when I needed `x = self.helper(node.left)`.
4. **Recomputing the same subproblem** in a branching recursion without memoization.
5. **Mutable default arguments** like `def f(x, seen=[])`, which are shared across calls. Pass `None` and create the list inside.

## Practice

```problems
509 | Fibonacci Number | fibonacci-number | Easy | memoize the branches
70 | Climbing Stairs | climbing-stairs | Easy | fib in disguise
206 | Reverse Linked List | reverse-linked-list | Easy | shrink by one
21 | Merge Two Sorted Lists | merge-two-sorted-lists | Easy | recursive merge
24 | Swap Nodes in Pairs | swap-nodes-in-pairs | Medium | handle two, recurse on the rest
50 | Pow(x, n) | powx-n | Medium | halve the exponent
779 | K-th Symbol in Grammar | k-th-symbol-in-grammar | Medium | recurse on the parent row
1823 | Find the Winner of the Circular Game | find-the-winner-of-the-circular-game | Medium | Josephus recurrence
```
