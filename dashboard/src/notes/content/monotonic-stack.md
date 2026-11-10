## The idea

A monotonic stack is a stack whose values stay **sorted** (only increasing, or only decreasing, from bottom to top). When a new element would break the order, I pop until it fits. The key insight: **every element I pop has just met its answer**. The new element is the first thing to its right that beats it.

That turns "for every element, find the next greater (or smaller) element" from O(n²) into O(n), because each element is pushed once and popped at most once.

## Watch it run

The stack holds days that are still waiting for a warmer day. Their temperatures go down from bottom to top: if a warmer day were sitting above a colder one, the colder one would already have its answer.

```diagram
DailyTemps
```

```python title="739. Daily Temperatures"
class Solution:
    def dailyTemperatures(self, temperatures: list[int]) -> list[int]:
        answer = [0] * len(temperatures)
        stack = []                       # indexes still waiting, temps decreasing bottom to top
        for i, t in enumerate(temperatures):
            # today beats every colder day on top of the stack: their wait is over
            while stack and t > temperatures[stack[-1]]:
                j = stack.pop()
                answer[j] = i - j
            stack.append(i)              # today waits too
        return answer                    # days left in the stack never warm up: 0
```

> **Tip:** Store **indexes** on the stack, not values. I can always look the value up, and the index gives me distances and a place to write the answer.

## The template

```python title="next greater element for every index"
def next_greater(nums):
    res = [-1] * len(nums)      # default when nothing to the right is bigger
    stack = []                  # indexes, their values decreasing bottom to top
    for i, x in enumerate(nums):
        while stack and x > nums[stack[-1]]:
            res[stack.pop()] = x     # x is the first bigger value to the right
        stack.append(i)
    return res
```

Flip the comparison and the direction to get the other three questions:

| Question | Stack order (bottom to top) | Pop while |
|---|---|---|
| next **greater** to the right | decreasing | `x > nums[top]` |
| next **smaller** to the right | increasing | `x < nums[top]` |
| previous greater to the left | decreasing | `x >= nums[top]`, then the top (if any) is the answer |
| previous smaller to the left | increasing | `x <= nums[top]`, then the top (if any) is the answer |

For a **circular** array (Next Greater Element II, 503), loop over the indexes twice with `i % n`, and only push during the first lap.

## Example: Final Prices With a Special Discount

Each item's discount is the next price to its right that is **less than or equal** to it: a "next smaller or equal" question.

```python title="1475. Final Prices With a Special Discount in a Shop"
class Solution:
    def finalPrices(self, prices: list[int]) -> list[int]:
        res = prices[:]                  # items that never find a discount keep their price
        stack = []                       # indexes waiting for a discount
        for i, price in enumerate(prices):
            while stack and price <= prices[stack[-1]]:
                prev_idx = stack.pop()   # this item's discount is `price`
                res[prev_idx] -= price
            stack.append(i)
        return res
```

Starting from `res = prices[:]` removes the final cleanup loop, and calling the popped value `prev_idx` makes it clear it's an index, not a price.

## Largest Rectangle in Histogram

A rectangle's height is set by its **shortest** bar. For every bar, the widest rectangle at exactly that height stretches until it hits a shorter bar on each side. Those two walls are the previous smaller and the next smaller: monotonic stack questions.

```diagram
Histogram
```

```python title="84. Largest Rectangle in Histogram"
class Solution:
    def largestRectangleArea(self, heights: list[int]) -> int:
        stack = []                            # indexes, heights increasing bottom to top
        best = 0
        for i, h in enumerate(heights + [0]): # the 0 at the end flushes every bar out
            while stack and h < heights[stack[-1]]:
                height = heights[stack.pop()] # this bar's rectangle ends here (i is the next smaller)
                left = stack[-1] if stack else -1   # the new top is the previous smaller
                best = max(best, height * (i - left - 1))
            stack.append(i)
        return best
```

When a bar is popped, the current index is its **next smaller** and the new top of the stack is its **previous smaller**, so one pop gives both walls.

## Monotonic deque: max of a sliding window

For "the maximum of every window of size k", the window loses elements from the **front** too, so use a `deque` that stays decreasing. The front is always the current window's max.

```python title="239. Sliding Window Maximum"
from collections import deque

class Solution:
    def maxSlidingWindow(self, nums: list[int], k: int) -> list[int]:
        dq = deque()                   # indexes, values decreasing front to back
        res = []
        for i, x in enumerate(nums):
            while dq and nums[dq[-1]] <= x:
                dq.pop()               # smaller values behind x can never be a max again
            dq.append(i)
            if dq[0] <= i - k:
                dq.popleft()           # the front slid out of the window
            if i >= k - 1:
                res.append(nums[dq[0]])
        return res
```

## How to spot it

- "next greater", "next smaller", "previous ...", "how many days until ..."
- "for each element, how far can it extend" (spans, rectangles, visible people)
- an O(n²) solution where the inner loop scans left or right looking for the first bigger or smaller value

## Practice

```problems
496 | Next Greater Element I | next-greater-element-i | Easy | the template + a dict
1475 | Final Prices With a Special Discount in a Shop | final-prices-with-a-special-discount-in-a-shop | Easy | next smaller or equal
739 | Daily Temperatures | daily-temperatures | Medium | distances instead of values
503 | Next Greater Element II | next-greater-element-ii | Medium | circular: loop twice
901 | Online Stock Span | online-stock-span | Medium | previous greater, streaming
402 | Remove K Digits | remove-k-digits | Medium | increasing stack, greedy
907 | Sum of Subarray Minimums | sum-of-subarray-minimums | Medium | both walls per element
84 | Largest Rectangle in Histogram | largest-rectangle-in-histogram | Hard | pop gives both walls
239 | Sliding Window Maximum | sliding-window-maximum | Hard | monotonic deque
```
