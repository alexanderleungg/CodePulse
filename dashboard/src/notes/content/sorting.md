## The idea

In interviews I rarely write a sorting algorithm from scratch. What matters is noticing when **sorting first makes the rest of the problem easy**. After sorting:

- duplicates sit next to each other (skip them with `nums[i] == nums[i-1]`)
- two pointers from both ends work (3Sum, pair sums)
- binary search works
- intervals can be processed left to right (merge intervals, meeting rooms)
- greedy choices become obvious (assign the smallest cookie that fits)

Sorting costs O(n log n). If the brute force is O(n²), paying n log n to set things up is almost always worth it.

## Sorting in Python

```python
nums.sort()                           # in place, returns None
new = sorted(nums)                    # new list, original untouched
nums.sort(reverse=True)               # largest first
pairs.sort(key=lambda p: p[1])        # by the second field
people.sort(key=lambda p: (-p[0], p[1]))   # height descending, then k ascending
words.sort(key=len)                   # by length
```

Python's sort is **stable**: items that compare equal keep their original order. That lets me sort by several keys, either with a tuple key or by sorting twice (least important key first).

When the order depends on comparing two items directly, use `cmp_to_key`:

```python title="179. Largest Number"
from functools import cmp_to_key

class Solution:
    def largestNumber(self, nums: list[int]) -> str:
        strs = [str(x) for x in nums]
        # a should come before b if gluing them as a+b makes a bigger number than b+a
        def compare(a, b):
            if a + b > b + a:
                return -1        # a first
            if a + b < b + a:
                return 1         # b first
            return 0
        strs.sort(key=cmp_to_key(compare))
        result = "".join(strs)
        return "0" if result[0] == "0" else result   # [0, 0] should be "0", not "00"
```

## Merge sort: divide and conquer

Split in half, sort each half recursively, then merge the two sorted halves. This is the algorithm to know by heart, because the same split and merge idea shows up in Sort List (148), Count of Smaller Numbers After Self (315), and Merge k Sorted Lists (23).

```diagram
MergeSortTree
```

The merge step is two pointers, always taking the smaller front value:

```diagram
MergeStep
```

```python title="912. Sort an Array"
class Solution:
    def sortArray(self, nums: list[int]) -> list[int]:
        if len(nums) <= 1:
            return nums                      # base case: already sorted
        mid = len(nums) // 2
        left = self.sortArray(nums[:mid])    # trust the recursion to sort each half
        right = self.sortArray(nums[mid:])
        return self.merge(left, right)

    def merge(self, a, b):
        out = []
        i = j = 0
        while i < len(a) and j < len(b):
            if a[i] <= b[j]:                 # <= keeps equal items in order (stable)
                out.append(a[i]); i += 1
            else:
                out.append(b[j]); j += 1
        out.extend(a[i:])                    # one side is empty, copy the rest of the other
        out.extend(b[j:])
        return out
```

## Partitioning and quickselect

Quicksort picks a **pivot** and rearranges the array so everything smaller is on its left and everything bigger is on its right. After one partition, the pivot is in its final sorted position.

```diagram
Partition
```

I don't need the whole array sorted to find the k-th largest element. Partition once, see which side the answer is on, and only recurse into that side. That's **quickselect**, O(n) on average.

```python title="215. Kth Largest Element in an Array"
import random

class Solution:
    def findKthLargest(self, nums: list[int], k: int) -> int:
        target = len(nums) - k                  # k-th largest = this index in sorted order

        def partition(lo, hi):
            p = random.randint(lo, hi)          # random pivot avoids the O(n²) worst case
            nums[p], nums[hi] = nums[hi], nums[p]
            pivot, store = nums[hi], lo
            for j in range(lo, hi):
                if nums[j] < pivot:
                    nums[store], nums[j] = nums[j], nums[store]
                    store += 1
            nums[store], nums[hi] = nums[hi], nums[store]
            return store                        # the pivot's final index

        lo, hi = 0, len(nums) - 1
        while True:
            p = partition(lo, hi)
            if p == target:
                return nums[p]
            if p < target:
                lo = p + 1                      # answer is on the right side
            else:
                hi = p - 1                      # answer is on the left side
```

A heap of size k also works in O(n log k) and is easier to get right under pressure. See the [Heap](#/notes/heap) note.

## Counting instead of comparing

When values come from a tiny range, I can skip comparisons entirely. Sort Colors has only 0, 1, and 2, and the one pass version keeps three regions:

```diagram
DutchFlag
```

```python title="75. Sort Colors"
class Solution:
    def sortColors(self, nums: list[int]) -> None:
        low, mid, high = 0, 0, len(nums) - 1
        while mid <= high:
            if nums[mid] == 0:
                nums[low], nums[mid] = nums[mid], nums[low]
                low += 1
                mid += 1
            elif nums[mid] == 1:
                mid += 1
            else:
                nums[mid], nums[high] = nums[high], nums[mid]
                high -= 1          # don't move mid, the swapped in value is unchecked
```

Bucket sort is the same idea for frequencies: Top K Frequent Elements (347) puts each number in `buckets[count]` and reads the buckets from the top.

## Which sort, when

| Algorithm | Time | Space | Stable | Notes |
|---|---|---|---|---|
| Python `sort` (Timsort) | O(n log n) | O(n) | yes | use this by default |
| Merge sort | O(n log n) | O(n) | yes | great for linked lists |
| Quicksort | O(n log n) avg, O(n²) worst | O(log n) | no | random pivot in practice |
| Quickselect | O(n) avg | O(1) | no | only the k-th element |
| Heap sort | O(n log n) | O(1) | no | rarely asked |
| Counting / bucket | O(n + range) | O(range) | yes | small value range |

## Practice

```problems
912 | Sort an Array | sort-an-array | Medium | write merge sort once
75 | Sort Colors | sort-colors | Medium | three pointers
56 | Merge Intervals | merge-intervals | Medium | sort by start, then sweep
215 | Kth Largest Element in an Array | kth-largest-element-in-an-array | Medium | quickselect or heap
347 | Top K Frequent Elements | top-k-frequent-elements | Medium | bucket sort by count
179 | Largest Number | largest-number | Medium | custom comparator
973 | K Closest Points to Origin | k-closest-points-to-origin | Medium | sort by distance, or quickselect
148 | Sort List | sort-list | Medium | merge sort on a linked list
```
