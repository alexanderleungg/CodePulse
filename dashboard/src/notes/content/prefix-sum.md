## The idea

If I'm going to ask "what's the sum of this range?" many times, add everything up **once** ahead of time. A prefix sum array stores the running total, and then any range sum is one subtraction.

```diagram
RangeSum
```

The convention that avoids off by one bugs: make `prefix` one longer than `nums`, with `prefix[0] = 0`. Then:

- `prefix[i]` is the sum of the first `i` numbers, `nums[0..i-1]`
- `sum(nums[l..r])` is `prefix[r + 1] - prefix[l]`

## The template

```python title="303. Range Sum Query - Immutable"
class NumArray:
    def __init__(self, nums: list[int]):
        # prefix[i] = sum of nums[0..i-1], so prefix[0] = 0 and prefix has n + 1 slots
        self.prefix = [0]
        for x in nums:
            self.prefix.append(self.prefix[-1] + x)

    def sumRange(self, left: int, right: int) -> int:
        # everything up to right, minus everything before left
        return self.prefix[right + 1] - self.prefix[left]
```

Building is O(n) once, then every query is O(1). `itertools.accumulate(nums, initial=0)` builds the same list in one line.

## Pattern: prefix sums plus a hash map

This is the version that shows up most in interviews. **Subarray Sum Equals K** asks how many contiguous subarrays add up to `k`, and the numbers can be negative, so a sliding window won't work.

Flip it around. A subarray `nums[j..i]` sums to `k` exactly when `prefix[i + 1] - prefix[j] = k`, which means `prefix[j] = prefix[i + 1] - k`. So while walking, keep a count of every prefix sum seen so far, and at each step ask: **how many earlier prefixes equal `running_sum - k`?**

```diagram
SubarraySumK
```

```python title="560. Subarray Sum Equals K"
from collections import defaultdict

class Solution:
    def subarraySum(self, nums: list[int], k: int) -> int:
        counts = defaultdict(int)
        counts[0] = 1          # the empty prefix, so subarrays starting at index 0 count
        running = 0
        total = 0
        for x in nums:
            running += x
            total += counts[running - k]    # every earlier prefix that leaves exactly k
            counts[running] += 1            # record AFTER counting, so a subarray can't be empty
        return total
```

The same "remember prefixes in a dict" shape handles a family of problems. Only what I store changes:

| Problem | Store | Ask at each step |
|---|---|---|
| Subarray Sum Equals K (560) | count of each prefix sum | how many prefixes equal `sum - k`? |
| Contiguous Array (525) | first index of each prefix sum, with 0 counted as -1 | seen this sum before? the gap is balanced |
| Continuous Subarray Sum (523) | first index of each `sum % k` | same remainder at least 2 apart? |
| Subarray Sums Divisible by K (974) | count of each `sum % k` | how many with the same remainder? |

The modulo versions work because if two prefixes leave the same remainder, the numbers between them add to a multiple of `k`.

## 2D prefix sums

The same idea works on a grid. `P[r][c]` stores the sum of the rectangle from the top left corner to `(r - 1, c - 1)`. Any sub rectangle is then four lookups: the big rectangle, minus the strip above, minus the strip to the left, plus the corner that got subtracted twice.

```diagram
Prefix2D
```

```python title="304. Range Sum Query 2D - Immutable"
class NumMatrix:
    def __init__(self, matrix: list[list[int]]):
        rows, cols = len(matrix), len(matrix[0])
        # one extra row and column of zeros, same reason as prefix[0] = 0
        self.P = [[0] * (cols + 1) for _ in range(rows + 1)]
        for r in range(rows):
            for c in range(cols):
                self.P[r + 1][c + 1] = (matrix[r][c]
                                        + self.P[r][c + 1]     # everything above
                                        + self.P[r + 1][c]     # everything to the left
                                        - self.P[r][c])        # the overlap, counted twice

    def sumRegion(self, r1: int, c1: int, r2: int, c2: int) -> int:
        P = self.P
        return P[r2 + 1][c2 + 1] - P[r1][c2 + 1] - P[r2 + 1][c1] + P[r1][c1]
```

## The reverse: difference arrays

Prefix sums make range **queries** fast. A difference array makes range **updates** fast. Mark where an update starts and where it stops, then run one prefix sum pass at the end to get the real values.

```diagram
DifferenceArray
```

```python title="1109. Corporate Flight Bookings"
class Solution:
    def corpFlightBookings(self, bookings: list[list[int]], n: int) -> list[int]:
        diff = [0] * (n + 1)              # one extra slot so "stop" never goes out of range
        for first, last, seats in bookings:
            diff[first - 1] += seats      # flights are 1 indexed
            diff[last] -= seats           # stop adding after `last`
        res, running = [], 0
        for i in range(n):
            running += diff[i]            # the prefix pass turns marks into totals
            res.append(running)
        return res
```

Car Pooling (1094) is the same trick with pickups adding passengers and drop offs removing them.

## Common mistakes

1. Forgetting `counts[0] = 1` in the hash map version, which misses subarrays that start at index 0.
2. Recording the current prefix **before** counting, which lets a subarray of length zero sneak in when `k = 0`.
3. Mixing up whether `prefix[i]` includes `nums[i]`. Pick the `n + 1` convention and stick to it.
4. Reaching for a sliding window when the numbers can be negative. Windows need "adding makes it bigger"; prefix sums don't.

## Practice

```problems
1480 | Running Sum of 1d Array | running-sum-of-1d-array | Easy | build the prefix array
303 | Range Sum Query - Immutable | range-sum-query-immutable | Easy | the template
724 | Find Pivot Index | find-pivot-index | Easy | left sum vs right sum
560 | Subarray Sum Equals K | subarray-sum-equals-k | Medium | prefix + dict of counts
525 | Contiguous Array | contiguous-array | Medium | 0 counts as -1
523 | Continuous Subarray Sum | continuous-subarray-sum | Medium | remainders
974 | Subarray Sums Divisible by K | subarray-sums-divisible-by-k | Medium | count remainders
304 | Range Sum Query 2D - Immutable | range-sum-query-2d-immutable | Medium | inclusion and exclusion
1109 | Corporate Flight Bookings | corporate-flight-bookings | Medium | difference array
```
