## The idea

Binary search looks at the middle of a range, decides which half can't contain the answer, and throws that half away. Each step halves the range, so a million items take about 20 steps: **O(log n)**.

It needs one thing: a way to look at `mid` and know which side the answer is on. Sorted arrays give me that for free, but so do many problems that don't look like searching at all.

```diagram
Exact
```

## Template 1: find an exact value

```python title="704. Binary Search"
class Solution:
    def search(self, nums: list[int], target: int) -> int:
        lo, hi = 0, len(nums) - 1          # the answer is somewhere in [lo, hi]
        while lo <= hi:                    # <= because a one element range still needs checking
            mid = (lo + hi) // 2
            if nums[mid] == target:
                return mid
            if nums[mid] < target:
                lo = mid + 1               # mid is too small, and so is everything left of it
            else:
                hi = mid - 1               # mid is too big, and so is everything right of it
        return -1
```

## Template 2: lower bound (learn this one)

Most real problems don't ask "is it here?" They ask "where does it **start**?" or "what's the **smallest** value that works?". The lower bound template finds the **first index where a condition becomes true**, and it's the one worth memorizing.

```diagram
LowerBound
```

```python title="lower bound: first index i with nums[i] >= target"
def lower_bound(nums, target):
    lo, hi = 0, len(nums)            # hi = len(nums): "nothing qualifies" is a possible answer
    while lo < hi:                   # stop when the range is a single spot
        mid = (lo + hi) // 2
        if nums[mid] < target:
            lo = mid + 1             # mid fails, the answer is strictly right of it
        else:
            hi = mid                 # mid works, but something left of it might too
    return lo                        # lo == hi: the first index that works
```

Three facts make it safe: the range `[lo, hi)` always contains the answer, `lo = mid + 1` and `hi = mid` both shrink the range, and the loop stops exactly when one candidate is left.

With it, "first and last position" is two calls:

```python title="34. Find First and Last Position of Element in Sorted Array"
class Solution:
    def searchRange(self, nums: list[int], target: int) -> list[int]:
        def lower_bound(t):
            lo, hi = 0, len(nums)
            while lo < hi:
                mid = (lo + hi) // 2
                if nums[mid] < t:
                    lo = mid + 1
                else:
                    hi = mid
            return lo

        first = lower_bound(target)
        if first == len(nums) or nums[first] != target:
            return [-1, -1]                       # target isn't in the array
        last = lower_bound(target + 1) - 1        # one before the first bigger value
        return [first, last]
```

Python has these built in: `bisect.bisect_left(nums, x)` is the lower bound, and `bisect.bisect_right(nums, x)` is the first index with `nums[i] > x`.

## Template 3: binary search on the answer

This is the big one for interviews. When the question is "find the **minimum** speed / capacity / time that works", and making it bigger never makes a working answer fail, the answers themselves are sorted: false, false, ..., true, true. Binary search over the **answer range**, not over an array.

```diagram
OnAnswer
```

```python title="875. Koko Eating Bananas"
import math

class Solution:
    def minEatingSpeed(self, piles: list[int], h: int) -> int:
        def can_finish(k):
            # hours needed at speed k: each pile takes ceil(pile / k) hours
            return sum(math.ceil(p / k) for p in piles) <= h

        lo, hi = 1, max(piles)        # speed max(piles) always works (one pile per hour)
        while lo < hi:                # lower bound on "can_finish"
            mid = (lo + hi) // 2
            if can_finish(mid):
                hi = mid              # works, but maybe a slower speed works too
            else:
                lo = mid + 1          # too slow
        return lo
```

The recipe for any "minimize the maximum" or "smallest value that works" problem:

1. Write `feasible(x)`: can it be done with value `x`? (Usually a greedy O(n) check.)
2. Make sure bigger `x` never breaks feasibility.
3. Pick `lo` (surely too small or the smallest possible) and `hi` (surely enough).
4. Lower bound on `feasible`.

Capacity To Ship Packages (1011), Split Array Largest Sum (410), and Minimum Number of Days to Make m Bouquets (1482) are all this recipe.

## Rotated sorted arrays

```diagram
Rotated
```

```python title="33. Search in Rotated Sorted Array"
class Solution:
    def search(self, nums: list[int], target: int) -> int:
        lo, hi = 0, len(nums) - 1
        while lo <= hi:
            mid = (lo + hi) // 2
            if nums[mid] == target:
                return mid
            if nums[lo] <= nums[mid]:                  # left half lo..mid is sorted
                if nums[lo] <= target < nums[mid]:
                    hi = mid - 1                       # target is inside the sorted left half
                else:
                    lo = mid + 1
            else:                                      # right half mid..hi is sorted
                if nums[mid] < target <= nums[hi]:
                    lo = mid + 1                       # target is inside the sorted right half
                else:
                    hi = mid - 1
        return -1
```

Find Minimum in Rotated Sorted Array (153) compares `nums[mid]` with `nums[hi]`: if `nums[mid] > nums[hi]`, the drop (and the minimum) is to the right of mid.

## Common mistakes

1. **Infinite loops.** With `while lo < hi`, never write `lo = mid`; `mid` rounds down, so `lo` could stop moving. Use `lo = mid + 1`.
2. **Mixing templates.** `hi = len(nums) - 1` with `while lo <= hi` goes with `hi = mid - 1`. `hi = len(nums)` with `while lo < hi` goes with `hi = mid`. Don't mix the pairs.
3. **Wrong `hi` on answer searches.** Make sure `hi` definitely works, or the loop returns a wrong answer at the edge.
4. Forgetting that the lower bound can return `len(nums)` when nothing qualifies.

## Practice

```problems
704 | Binary Search | binary-search | Easy | exact template
35 | Search Insert Position | search-insert-position | Easy | literally lower bound
34 | Find First and Last Position of Element in Sorted Array | find-first-and-last-position-of-element-in-sorted-array | Medium | two lower bounds
74 | Search a 2D Matrix | search-a-2d-matrix | Medium | treat it as one list
153 | Find Minimum in Rotated Sorted Array | find-minimum-in-rotated-sorted-array | Medium | compare with hi
33 | Search in Rotated Sorted Array | search-in-rotated-sorted-array | Medium | one half is always sorted
162 | Find Peak Element | find-peak-element | Medium | walk uphill
875 | Koko Eating Bananas | koko-eating-bananas | Medium | search on the answer
1011 | Capacity To Ship Packages Within D Days | capacity-to-ship-packages-within-d-days | Medium | same recipe
981 | Time Based Key-Value Store | time-based-key-value-store | Medium | bisect on timestamps
4 | Median of Two Sorted Arrays | median-of-two-sorted-arrays | Hard | binary search the partition
```
