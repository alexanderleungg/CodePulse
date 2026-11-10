## The idea

An array stores values side by side in one block of memory. Because every slot is the same size, the computer can jump straight to any index with a little arithmetic. That one fact explains almost everything about arrays: reading by index is instant, but anything that shifts elements around is slow.

```diagram
IndexAccess
```

Python's `list` is a **dynamic array**. It keeps some spare room at the end, so `append` is usually O(1). When the spare room runs out it copies everything into a bigger block, but that happens rarely enough that append is still O(1) on average ("amortized").

## What each operation costs

| Operation | Cost | Why |
|---|---|---|
| `nums[i]`, `nums[i] = x` | O(1) | jump straight to the slot |
| `nums.append(x)`, `nums.pop()` | O(1) | work at the end, nothing shifts |
| `nums.insert(i, x)`, `nums.pop(i)` | O(n) | everything after `i` shifts |
| `x in nums`, `nums.index(x)` | O(n) | has to scan |
| `nums[a:b]` | O(b - a) | slicing makes a copy |
| `nums.sort()` | O(n log n) | Timsort |

Inserting in the middle is slow because every later element has to move over by one:

```diagram
InsertShift
```

> **Tip:** `pop(0)` is O(n) for the same reason. If I need to pop from the front a lot (like BFS), use `collections.deque`, which does it in O(1).

## Pattern 1: read pointer, write pointer

Many "modify the array in place" problems use two indexes moving the same direction. The **read** pointer `r` looks at every element once. The **write** pointer `w` marks where the next kept element should go. Everything left of `w` is the finished answer.

```diagram
WritePointer
```

```python title="283. Move Zeroes"
class Solution:
    def moveZeroes(self, nums: list[int]) -> None:
        w = 0                                  # next slot for a non zero value
        for r in range(len(nums)):             # r reads every element once
            if nums[r] != 0:
                nums[w], nums[r] = nums[r], nums[w]   # move it into the finished part
                w += 1
```

The same shape solves Remove Element (27) and Remove Duplicates from Sorted Array (26). Only the "should I keep this one?" check changes:

```python title="26. Remove Duplicates from Sorted Array"
class Solution:
    def removeDuplicates(self, nums: list[int]) -> int:
        w = 1                                  # nums[0] is always kept
        for r in range(1, len(nums)):
            if nums[r] != nums[w - 1]:         # keep it only if it differs from the last kept value
                nums[w] = nums[r]
                w += 1
        return w                               # the first w slots are the answer
```

## Pattern 2: running state in one pass (Kadane)

Maximum Subarray asks for the contiguous subarray with the largest sum. The key question at each index is: **is the best subarray ending here an extension of the previous one, or should it start fresh?** If the running sum has gone negative, it can only hurt, so drop it.

```diagram
Kadane
```

```python title="53. Maximum Subarray"
class Solution:
    def maxSubArray(self, nums: list[int]) -> int:
        cur = 0              # best sum of a subarray that ENDS at the current index
        best = nums[0]       # best sum seen anywhere
        for x in nums:
            cur = max(x, cur + x)   # start fresh at x, or extend the previous subarray
            best = max(best, cur)
        return best
```

This "carry one number forward and decide at each step" idea is the simplest form of dynamic programming. Best Time to Buy and Sell Stock (121) is the same shape: carry the lowest price seen so far.

## Pattern 3: prefix and suffix passes

When the answer at `i` depends on "everything to the left" and "everything to the right", compute each side in its own pass.

```diagram
ProductExceptSelf
```

```python title="238. Product of Array Except Self"
class Solution:
    def productExceptSelf(self, nums: list[int]) -> list[int]:
        n = len(nums)
        answer = [1] * n

        left = 1                         # product of everything left of i
        for i in range(n):
            answer[i] = left
            left *= nums[i]

        right = 1                        # product of everything right of i
        for i in range(n - 1, -1, -1):
            answer[i] *= right
            right *= nums[i]
        return answer
```

Storing the left products straight into `answer` and folding in the right products on the way back keeps extra space at O(1).

## Pattern 4: the index is a hash key

If values fall in the range `1..n`, the array itself can act as a hash table: value `v` belongs at index `v - 1`. I can mark "I have seen v" by flipping the sign of `nums[v - 1]`, with no extra memory.

```python title="448. Find All Numbers Disappeared in an Array"
class Solution:
    def findDisappearedNumbers(self, nums: list[int]) -> list[int]:
        for v in nums:
            i = abs(v) - 1                 # abs because this slot may already be flipped
            nums[i] = -abs(nums[i])        # negative means "the value i + 1 exists"
        return [i + 1 for i, v in enumerate(nums) if v > 0]
```

First Missing Positive (41) is the hard version of the same idea.

## Python habits that save time

```python
for i, x in enumerate(nums): ...        # index and value together
for a, b in zip(nums, nums[1:]): ...     # every adjacent pair
nums[::-1]                               # reversed copy
nums.sort(key=lambda p: p[1])            # sort by a field
grid = [[0] * cols for _ in range(rows)] # a real 2D list
```

> **Warning:** `[[0] * cols] * rows` looks right but makes `rows` references to the **same** inner list. Changing one row changes all of them. Always use the list comprehension.

## Practice

```problems
1 | Two Sum | two-sum | Easy | the one everyone starts with
283 | Move Zeroes | move-zeroes | Easy | read and write pointers
26 | Remove Duplicates from Sorted Array | remove-duplicates-from-sorted-array | Easy | write pointer
121 | Best Time to Buy and Sell Stock | best-time-to-buy-and-sell-stock | Easy | carry the minimum forward
53 | Maximum Subarray | maximum-subarray | Medium | Kadane
238 | Product of Array Except Self | product-of-array-except-self | Medium | prefix and suffix passes
189 | Rotate Array | rotate-array | Medium | reverse three times
448 | Find All Numbers Disappeared in an Array | find-all-numbers-disappeared-in-an-array | Easy | index as a hash key
41 | First Missing Positive | first-missing-positive | Hard | same trick, harder
```
