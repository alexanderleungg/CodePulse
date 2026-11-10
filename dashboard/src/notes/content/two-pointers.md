## The idea

Two pointers means keeping two indexes and moving one of them each step according to a rule. A nested loop checks every pair, O(n²). Two pointers check only the pairs that could still matter, O(n), because **every move safely rules out a whole group of pairs**.

There are three shapes:

| Shape | Pointers start | Typical use |
|---|---|---|
| **Opposite ends** | `l = 0`, `r = n - 1`, move inward | sorted pair sums, palindromes, containers |
| **Same direction** | both at the start, one runs ahead | remove in place, fast and slow pointers |
| **Two sequences** | one pointer per list | merge sorted lists, subsequence checks |

## Opposite ends: why it's safe

In a **sorted** array looking for two numbers that add to `target`, look at the smallest and largest. If their sum is too big, the largest number is useless: even paired with the smallest remaining value it's too big. So drop it. If the sum is too small, the smallest number is useless for the same reason. Each step deletes a whole row or column of the pair table:

```diagram
WhyItWorks
```

```python title="167. Two Sum II - Input Array Is Sorted"
class Solution:
    def twoSum(self, numbers: list[int], target: int) -> list[int]:
        l, r = 0, len(numbers) - 1
        while l < r:
            s = numbers[l] + numbers[r]
            if s == target:
                return [l + 1, r + 1]      # this problem uses 1 indexed answers
            if s < target:
                l += 1                     # need bigger: drop the smallest
            else:
                r -= 1                     # need smaller: drop the largest
        return []
```

## The opposite ends template

```python title="opposite ends"
l, r = 0, len(nums) - 1
while l < r:
    # 1. look at the pair (nums[l], nums[r]) and update the answer
    # 2. decide which pointer can't be part of anything better, and move it
    if should_move_left:
        l += 1
    else:
        r -= 1
```

The hard part is always step 2: **which side can be thrown away?** Say the reason out loud before coding.

## Container With Most Water

The area is `width × min(left height, right height)`. Start with the widest container. Moving the **taller** wall inward can't help, because the area is still capped by the shorter wall and the width shrinks. So always move the shorter wall.

```diagram
Container
```

```python title="11. Container With Most Water"
class Solution:
    def maxArea(self, height: list[int]) -> int:
        l, r = 0, len(height) - 1
        best = 0
        while l < r:
            area = (r - l) * min(height[l], height[r])
            best = max(best, area)
            if height[l] < height[r]:
                l += 1             # the short wall limits every narrower container, drop it
            else:
                r -= 1
        return best
```

## 3Sum: fix one, two pointer the rest

For triplets, loop over the first number and run the two pointer search on everything to its right. Sorting first also makes duplicate skipping easy.

```python title="15. 3Sum"
class Solution:
    def threeSum(self, nums: list[int]) -> list[list[int]]:
        nums.sort()
        res = []
        for i in range(len(nums) - 2):
            if i > 0 and nums[i] == nums[i - 1]:
                continue                      # same first number as last time, same triplets
            if nums[i] > 0:
                break                         # smallest number positive: nothing sums to 0
            l, r = i + 1, len(nums) - 1
            while l < r:
                s = nums[i] + nums[l] + nums[r]
                if s < 0:
                    l += 1
                elif s > 0:
                    r -= 1
                else:
                    res.append([nums[i], nums[l], nums[r]])
                    l += 1
                    r -= 1
                    while l < r and nums[l] == nums[l - 1]:
                        l += 1                # skip duplicate second numbers
        return res
```

This is O(n²), which is the best I can do for 3Sum. 3Sum Closest (16) and 4Sum (18) are the same loop with one more layer or a different check.

## Same direction

When both pointers move forward, one usually **reads** and the other **writes** or lags behind. The [Arrays](#/notes/array) note covers read and write pointers (Move Zeroes, Remove Duplicates). The [Linked List](#/notes/linked-list) note covers fast and slow pointers (cycle detection, finding the middle). A [sliding window](#/notes/sliding-window) is also this shape: `right` grows the window and `left` shrinks it.

## Two sequences

One pointer per input, and each step advances whichever pointer "loses".

```python title="392. Is Subsequence"
class Solution:
    def isSubsequence(self, s: str, t: str) -> bool:
        i = 0                         # next character of s we still need
        for ch in t:                  # t's pointer moves every step
            if i < len(s) and s[i] == ch:
                i += 1                # matched, look for the next one
        return i == len(s)
```

Merging into an array that has spare room at the end works best **from the back**, so nothing gets overwritten:

```diagram
MergeFromBack
```

```python title="88. Merge Sorted Array"
class Solution:
    def merge(self, nums1: list[int], m: int, nums2: list[int], n: int) -> None:
        i, j, write = m - 1, n - 1, m + n - 1
        while j >= 0:                          # once nums2 is used up, nums1 is already in place
            if i >= 0 and nums1[i] > nums2[j]:
                nums1[write] = nums1[i]
                i -= 1
            else:
                nums1[write] = nums2[j]
                j -= 1
            write -= 1
```

## When two pointers won't work

The opposite ends trick needs a reason to throw one side away, which usually means **sorted** data. If the input isn't sorted and I need the original indexes (the original Two Sum), use a hash map instead. If sorting is allowed and indexes don't matter, sort first.

## Practice

```problems
977 | Squares of a Sorted Array | squares-of-a-sorted-array | Easy | biggest squares are at the ends
392 | Is Subsequence | is-subsequence | Easy | two sequences
88 | Merge Sorted Array | merge-sorted-array | Easy | fill from the back
167 | Two Sum II - Input Array Is Sorted | two-sum-ii-input-array-is-sorted | Medium | the core pattern
11 | Container With Most Water | container-with-most-water | Medium | move the shorter wall
15 | 3Sum | 3sum | Medium | fix one, two pointer the rest
16 | 3Sum Closest | 3sum-closest | Medium | track the closest sum
42 | Trapping Rain Water | trapping-rain-water | Hard | move the side with the lower max
```
