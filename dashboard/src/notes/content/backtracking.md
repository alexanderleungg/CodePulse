## The idea

Backtracking is walking a **decision tree**. At every step I make a choice, go deeper, and when I come back I undo that choice so I can try the next one. Every complete path from the root to a stopping point is one candidate answer.

It is brute force with good manners. I still try everything, but I build each answer one piece at a time and throw away a branch the moment it can't work.

```diagram
PermutationTree
```

## The three things to find in every problem

Before writing any code, name these three things. If I can say them out loud, the code writes itself.

| Piece | Question to ask | Permutations of [1,2,3] |
|---|---|---|
| **Path** | What have I chosen so far? | the numbers picked, like `[1, 2]` |
| **Choices** | What can I pick next? | any number not used yet |
| **End condition** | When is the path a full answer? | `len(path) == len(nums)` |

## The template

```python title="backtracking template"
def solve(nums):
    res = []   # every complete answer
    path = []  # the choices made so far (one root to node path in the tree)

    def backtrack():
        # 1. end condition: the path is a complete answer
        if is_complete(path):
            res.append(path[:])   # save a COPY, path keeps changing after this
            return

        # 2. try every choice available from this node
        for choice in choices():
            path.append(choice)   # choose: walk down one edge
            backtrack()           # explore everything below that edge
            path.pop()            # undo: walk back up the same edge

    backtrack()
    return res
```

Three lines do all the work: **choose, explore, undo**. The undo is what makes it "back" tracking. When `backtrack()` returns, `path` is exactly what it was before the loop picked `choice`, so the next loop iteration starts clean.

## Why choose and undo sit inside the loop

An **edge** is the line connecting a parent node to a child node. It is not the node itself. Nodes are the states between choices, and edges are the choices themselves.

```diagram
ChooseUndo
```

Backtracking cares about edges. Choosing is walking down an edge and undoing is walking back up it. That is why the append and pop wrap the recursive call inside the `for` loop: each loop iteration is one edge out of the current node.

Compare this with a plain tree traversal, where the work happens at the node (preorder or postorder position). Backtracking does its work on the way into and out of each edge.

## Worked example: Permutations (46)

Order matters, and each number is used once. Since order matters, every level loops over **all** numbers from index 0, and a `used` array skips the ones already on the path.

```python title="46. Permutations"
class Solution:
    def permute(self, nums: list[int]) -> list[list[int]]:
        res, path = [], []
        used = [False] * len(nums)   # used[i] is True while nums[i] is on the path

        def backtrack():
            if len(path) == len(nums):      # used every number: one full permutation
                res.append(path[:])
                return
            for i in range(len(nums)):
                if used[i]:                 # already on the path, can't pick it twice
                    continue
                path.append(nums[i]); used[i] = True     # choose
                backtrack()                              # explore
                path.pop(); used[i] = False              # undo (both things!)

        backtrack()
        return res
```

Step through the first branch to watch `path` and `used` change together:

```diagram
PermutationSteps
```

> **Tip:** Keep `res`, `path`, and `used` in the outer function and give `backtrack` no parameters. Mixing `self.path` with a `path` parameter works by accident (they are the same list) but it is easy to lose track of which one I'm changing.

## Subsets (78): every node is an answer

For subsets, order doesn't matter, so `[1,2]` and `[2,1]` are the same answer. The fix is a `start` index: each node only offers numbers **to the right** of the last pick. That way every subset is built in one order only.

```diagram
SubsetTree
```

```python title="78. Subsets"
class Solution:
    def subsets(self, nums: list[int]) -> list[list[int]]:
        res, path = [], []

        def backtrack(start):
            res.append(path[:])              # record at EVERY node, no end condition needed
            for i in range(start, len(nums)):
                path.append(nums[i])
                backtrack(i + 1)             # only look forward, never reuse i
                path.pop()

        backtrack(0)
        return res
```

## Combinations (77): subsets with a size limit

Combinations of size `k` are just the subsets at depth `k`. Same tree, same `start` index, but only record when the path has `k` items, and stop there.

```diagram
CombinationTree
```

```python title="77. Combinations"
class Solution:
    def combine(self, n: int, k: int) -> list[list[int]]:
        res, path = [], []

        def backtrack(start):
            if len(path) == k:               # depth k: save and stop going deeper
                res.append(path[:])
                return
            for i in range(start, n + 1):    # numbers are 1..n here, not indexes
                path.append(i)
                backtrack(i + 1)
                path.pop()

        backtrack(1)
        return res
```

## Reuse allowed: Combination Sum (39)

When the same number can be picked again, recurse with `i` instead of `i + 1`. The child is allowed to pick the same number, but still never one to its left, so I don't get the same combination in two orders.

```python title="39. Combination Sum"
class Solution:
    def combinationSum(self, candidates: list[int], target: int) -> list[list[int]]:
        res, path = [], []

        def backtrack(start, remaining):
            if remaining == 0:               # hit the target exactly
                res.append(path[:])
                return
            if remaining < 0:                # overshot, this branch can't work
                return
            for i in range(start, len(candidates)):
                path.append(candidates[i])
                backtrack(i, remaining - candidates[i])   # i, not i + 1: reuse is allowed
                path.pop()

        backtrack(0, target)
        return res
```

## Duplicates in the input (90, 40, 47)

If the input has repeated values, like `[1, 2, 2]`, two sibling branches that pick the same value grow the exact same subtree. Sort first so equal values sit next to each other, then skip a value if it equals the sibling right before it.

```diagram
DuplicateSkip
```

```python title="the duplicate skip, for subsets and combinations"
nums.sort()                     # equal values must be neighbours for the check to work

def backtrack(start):
    res.append(path[:])
    for i in range(start, len(nums)):
        # i > start means "not the first option at this level".
        # the first 2 at a level is fine, a second 2 at the SAME level is a repeat
        if i > start and nums[i] == nums[i - 1]:
            continue
        path.append(nums[i])
        backtrack(i + 1)
        path.pop()
```

It has to be `i > start`, not `i > 0`. With `i > 0` I would also block going deeper with the second 2, which would lose `[2, 2]`.

Permutations with duplicates (47) use `used` instead of `start`, so the rule changes shape:

```python title="47. Permutations II: the skip rule"
nums.sort()
# skip nums[i] if the same value right before it is NOT currently on the path.
# that forces equal values to always be placed in their original order,
# so two identical 2s can never swap places and make a duplicate permutation
if i > 0 and nums[i] == nums[i - 1] and not used[i - 1]:
    continue
```

## The knobs

Every problem in this family is one skeleton with a few settings changed.

| The problem has... | Change |
|---|---|
| order matters | permutation: loop from `0`, use a `used` array |
| order doesn't matter | subset or combination: loop from `start`, recurse with `i + 1` |
| element reuse allowed (39) | recurse with `i` instead of `i + 1` |
| duplicates in input (90, 40) | sort first, then `if i > start and nums[i] == nums[i-1]: continue` |
| duplicates in permutations (47) | sort first, then `if i > 0 and nums[i] == nums[i-1] and not used[i-1]: continue` |

## All in one template

Two tree shapes (subset or permutation) times three element rules (unique, duplicates, reuse). Fill in the four capital words and I get any of the eight classic problems.

```python title="all in one"
def backtrack(start):
    if END:                            # subset: always record (and don't return)
        res.append(path[:])            # combination: len(path) == k
        return                         # permutation: len(path) == len(nums)

    for i in range(START, len(nums)):  # subset / combination: start
                                       # permutation: 0
        if SKIP:                       # permutation: used[i]
            continue                   # duplicates: nums[i] == nums[i-1] check

        path.append(nums[i])           # choose
        backtrack(NEXT)                # no reuse: i + 1
                                       # reuse: i
        path.pop()                     # undo
```

## Beyond subsets

The same choose, explore, undo loop solves problems that look very different at first:

- **Generate Parentheses (22):** path is the string so far, choices are `(` if I still have opens left and `)` if it wouldn't close more than I opened.
- **Letter Combinations of a Phone Number (17):** each level is one digit, choices are that digit's letters.
- **Word Search (79):** path is the cells used so far, choices are the 4 neighbours. Mark a cell as visited before going deeper and unmark it after.
- **N-Queens (51):** each level is one row, choices are the columns that aren't attacked.
- **Palindrome Partitioning (131):** choices are every palindrome that starts at the current index.

## Complexity

Time is roughly **(number of answers) × (cost to copy one answer)**. I can't beat the number of answers, because I have to produce every one.

| Problem | Time | Why |
|---|---|---|
| Subsets | O(n · 2ⁿ) | 2ⁿ subsets, each copied in O(n) |
| Combinations | O(k · C(n, k)) | C(n, k) answers of length k |
| Permutations | O(n · n!) | n! orderings of length n |

Space is O(n) for the recursion depth and the path, not counting the output.

## Common mistakes

1. **`res.append(path)` instead of `res.append(path[:])`.** Every saved answer points at the same list, which is empty by the end.
2. **Forgetting half of the undo.** In permutations, both `path.pop()` and `used[i] = False` have to happen.
3. **Skipping duplicates without sorting.** The `nums[i] == nums[i-1]` check only works if equal values are next to each other.
4. **`i > 0` instead of `i > start`** in the subset duplicate check, which throws away valid answers like `[2, 2]`.

## Practice

Suggested order: the three base shapes first, then reuse, then duplicates.

```problems
46 | Permutations | permutations | Medium | the base template, with used
78 | Subsets | subsets | Medium | every node is an answer
77 | Combinations | combinations | Medium | subsets that stop at depth k
39 | Combination Sum | combination-sum | Medium | reuse: recurse with i
90 | Subsets II | subsets-ii | Medium | sort + skip duplicates
40 | Combination Sum II | combination-sum-ii | Medium | duplicates and no reuse
47 | Permutations II | permutations-ii | Medium | the not used[i-1] rule
22 | Generate Parentheses | generate-parentheses | Medium | choices depend on counts
17 | Letter Combinations of a Phone Number | letter-combinations-of-a-phone-number | Medium | one level per digit
79 | Word Search | word-search | Medium | backtracking on a grid
131 | Palindrome Partitioning | palindrome-partitioning | Medium | choices are substrings
51 | N-Queens | n-queens | Hard | the classic
```
