## The idea

Dynamic programming is **recursion that remembers**. It applies when a problem breaks into smaller subproblems, and the same subproblems come up again and again. Solve each one once, store the answer, and reuse it.

Two signs that a problem is DP:

1. **It asks for a best, a count, or a yes/no over many choices**: "minimum coins", "number of ways", "longest", "can I reach".
2. **A brute force recursion would recompute the same thing**, like `fib(3)` showing up in several branches.

```diagram
MemoTree
```

## The recipe

Every DP solution answers the same four questions. Write them down before any code.

| Step | Question | House Robber example |
|---|---|---|
| **1. State** | What does `dp[i]` mean, in words? | best loot from houses `0..i` |
| **2. Transition** | How is `dp[i]` built from smaller states? | `max(dp[i-1], dp[i-2] + nums[i])`: skip house i, or rob it |
| **3. Base cases** | Which states are known without the rule? | `dp[0] = nums[0]` |
| **4. Answer** | Which state is the final answer? | `dp[n-1]` |

> **Tip:** Step 1 is the hard part. If the transition won't come, the state is probably missing information. Add a dimension (like "index **and** remaining capacity") and try again.

## Top down vs bottom up

Both are DP. Top down is usually faster to write; bottom up is easier to optimize for space.

```python title="198. House Robber (top down: recursion + memo)"
from functools import cache

class Solution:
    def rob(self, nums: list[int]) -> int:
        @cache
        def best(i):                  # best loot from houses 0..i
            if i < 0:
                return 0
            return max(best(i - 1),               # skip house i
                       best(i - 2) + nums[i])     # rob house i, so i - 1 is off limits
        return best(len(nums) - 1)
```

```diagram
HouseRobber
```

```python title="198. House Robber (bottom up, O(1) space)"
class Solution:
    def rob(self, nums: list[int]) -> int:
        prev2, prev1 = 0, 0             # dp[i-2] and dp[i-1]; only two values are ever needed
        for x in nums:
            prev2, prev1 = prev1, max(prev1, prev2 + x)
        return prev1
```

The bottom up version fills the table in an order where every value it needs is already there. When `dp[i]` only looks back a fixed number of steps, keep just those values instead of the whole array.

## Pattern 1: one dimension

The state is a position or an amount. Climbing Stairs (70), House Robber (198), Decode Ways (91), and Word Break (139) are all "`dp[i]` from a few earlier `dp` values".

Coin Change is the classic "minimum over choices": the last coin used could be any coin, so try each one.

```diagram
CoinChange
```

```python title="322. Coin Change"
class Solution:
    def coinChange(self, coins: list[int], amount: int) -> int:
        INF = float("inf")
        dp = [0] + [INF] * amount          # dp[a] = fewest coins that make amount a
        for a in range(1, amount + 1):
            for c in coins:
                if c <= a:
                    dp[a] = min(dp[a], dp[a - c] + 1)   # use coin c last
        return dp[amount] if dp[amount] != INF else -1
```

## Pattern 2: a grid

The state is a cell, and the transition looks at the cells I could have come from.

```diagram
UniquePaths
```

```python title="62. Unique Paths"
class Solution:
    def uniquePaths(self, m: int, n: int) -> int:
        dp = [[1] * n for _ in range(m)]        # first row and column: one way each
        for r in range(1, m):
            for c in range(1, n):
                dp[r][c] = dp[r - 1][c] + dp[r][c - 1]   # from above + from the left
        return dp[m - 1][n - 1]
```

Minimum Path Sum (64) swaps `+` for `min(...) + grid[r][c]`.

## Pattern 3: two sequences

With two strings, the state is `dp[i][j]`: the answer for the first `i` characters of one and the first `j` of the other. The transition always asks "do the current characters match?"

```diagram
LCSTable
```

```python title="1143. Longest Common Subsequence"
class Solution:
    def longestCommonSubsequence(self, text1: str, text2: str) -> int:
        m, n = len(text1), len(text2)
        dp = [[0] * (n + 1) for _ in range(m + 1)]    # row/column 0 = empty prefix
        for i in range(1, m + 1):
            for j in range(1, n + 1):
                if text1[i - 1] == text2[j - 1]:
                    dp[i][j] = dp[i - 1][j - 1] + 1   # match: extend the LCS of both shorter prefixes
                else:
                    dp[i][j] = max(dp[i - 1][j],      # drop a letter from text1
                                   dp[i][j - 1])      # or from text2
        return dp[m][n]
```

Edit Distance (72) is the same table with three moves (insert, delete, replace) and `min` instead of `max`.

## Pattern 4: knapsack (pick or skip each item)

Each item is used at most once and there's a capacity. The state needs **both** "which items so far" and "how much capacity is used". Partition Equal Subset Sum asks: can some subset add up to exactly half the total?

```python title="416. Partition Equal Subset Sum"
class Solution:
    def canPartition(self, nums: list[int]) -> bool:
        total = sum(nums)
        if total % 2:
            return False                   # an odd total can't split evenly
        target = total // 2
        dp = [False] * (target + 1)        # dp[s] = can some subset of the items seen so far sum to s?
        dp[0] = True                       # the empty subset
        for x in nums:
            for s in range(target, x - 1, -1):   # go BACKWARDS so x is used at most once
                dp[s] = dp[s] or dp[s - x]       # skip x, or take x on top of a sum that makes s - x
        return dp[target]
```

The backwards loop matters: going forwards, `dp[s - x]` might already include `x` from this same round, which would let one item be used twice. (That forwards loop is exactly right for **unlimited** items, like Coin Change II, 518.)

## Pattern 5: longest increasing subsequence

`dp[i]` = length of the longest increasing subsequence that **ends at** `i`. Look at every earlier, smaller value.

```python title="300. Longest Increasing Subsequence"
class Solution:
    def lengthOfLIS(self, nums: list[int]) -> int:
        dp = [1] * len(nums)               # every element alone is a subsequence of length 1
        for i in range(len(nums)):
            for j in range(i):
                if nums[j] < nums[i]:
                    dp[i] = max(dp[i], dp[j] + 1)   # extend the best one ending at j
        return max(dp)
```

This is O(n²). There's an O(n log n) version that keeps, for each length, the smallest possible tail and binary searches it (`bisect_left`), which is worth knowing as a follow up.

## Which pattern is it?

| The problem talks about... | Try |
|---|---|
| a line of items, decide at each step | 1D: `dp[i]` |
| moving through a grid | 2D grid: `dp[r][c]` |
| two strings or arrays compared | `dp[i][j]` over prefixes |
| choosing items under a limit | knapsack: `dp[capacity]` |
| a range or interval that shrinks (palindromes, bursting balloons) | `dp[l][r]`, filled by length |
| states like "holding stock / cooling down" | a few dp arrays, one per state |

## Practice

```problems
70 | Climbing Stairs | climbing-stairs | Easy | the gentlest 1D dp
746 | Min Cost Climbing Stairs | min-cost-climbing-stairs | Easy | min instead of sum
198 | House Robber | house-robber | Medium | skip or take
213 | House Robber II | house-robber-ii | Medium | a circle: run it twice
322 | Coin Change | coin-change | Medium | min over choices
139 | Word Break | word-break | Medium | dp over prefixes
62 | Unique Paths | unique-paths | Medium | grid dp
1143 | Longest Common Subsequence | longest-common-subsequence | Medium | two strings
300 | Longest Increasing Subsequence | longest-increasing-subsequence | Medium | ends at i
416 | Partition Equal Subset Sum | partition-equal-subset-sum | Medium | 0/1 knapsack
91 | Decode Ways | decode-ways | Medium | one or two digits
152 | Maximum Product Subarray | maximum-product-subarray | Medium | track max and min
72 | Edit Distance | edit-distance | Medium | three moves
```
