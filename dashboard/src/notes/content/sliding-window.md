## The idea

A sliding window is a range `[left, right]` over an array or string that I move forward instead of rebuilding. Move `right` to **grow** the window, move `left` to **shrink** it, and keep some running state (a sum, or counts of what's inside) up to date as elements enter and leave.

Use it when the problem asks about a **contiguous** subarray or substring: longest, shortest, count, or "does one exist". The brute force checks every start and end, O(n²). The window touches each element twice at most (once entering, once leaving), so it's O(n).

## The template

```python title="variable size window"
def sliding_window(s):
    window = {}          # state of what's inside: counts, a sum, a set...
    left = 0
    best = 0
    for right, x in enumerate(s):
        # 1. grow: bring s[right] into the window
        window[x] = window.get(x, 0) + 1

        # 2. shrink: while the window breaks the rule, push s[left] out
        while window_is_invalid(window):
            out = s[left]
            window[out] -= 1
            left += 1

        # 3. the window [left, right] is valid now, so update the answer
        best = max(best, right - left + 1)
    return best
```

Answer these three questions and the template fills itself in:

1. What do I track about the window? (counts, sum, number of distinct items)
2. When is the window **invalid**? (a repeat, too many distinct letters, sum too big)
3. Where do I update the answer? (after shrinking for "longest", inside the shrink loop for "shortest")

## Longest valid window

```diagram
LongestUnique
```

```python title="3. Longest Substring Without Repeating Characters"
class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        count = {}
        left = 0
        best = 0
        for right, ch in enumerate(s):
            count[ch] = count.get(ch, 0) + 1
            while count[ch] > 1:              # invalid: ch now appears twice
                count[s[left]] -= 1
                left += 1
            best = max(best, right - left + 1)
        return best
```

Longest Repeating Character Replacement (424) is the same loop with a different rule: the window is invalid when `window length - count of its most common letter > k`, because that's how many letters I'd need to replace.

## Shortest valid window

When the question is "the **shortest** window that satisfies something", flip where the answer is recorded: shrink **while the window is valid**, and record inside that loop, since each shrink might give a shorter valid window.

```diagram
ShortestValid
```

```python title="209. Minimum Size Subarray Sum"
class Solution:
    def minSubArrayLen(self, target: int, nums: list[int]) -> int:
        left = 0
        total = 0
        best = float("inf")
        for right, x in enumerate(nums):
            total += x
            while total >= target:            # valid: record, then try to shrink it
                best = min(best, right - left + 1)
                total -= nums[left]
                left += 1
        return 0 if best == float("inf") else best
```

Minimum Window Substring (76) is this shape with counts: the window is valid once it contains every needed letter often enough. Track `need` counts and a `formed` counter of how many letters are fully covered, so checking "is it valid?" stays O(1).

```python title="76. Minimum Window Substring"
from collections import Counter

class Solution:
    def minWindow(self, s: str, t: str) -> str:
        need = Counter(t)
        missing = len(t)             # letters of t still not covered by the window
        left = 0
        best = (float("inf"), 0, 0)  # (length, start, end)
        for right, ch in enumerate(s):
            if need[ch] > 0:
                missing -= 1         # this letter was actually needed
            need[ch] -= 1            # extra letters go negative, meaning "spare"
            while missing == 0:      # window covers all of t: try shrinking
                if right - left + 1 < best[0]:
                    best = (right - left + 1, left, right)
                need[s[left]] += 1
                if need[s[left]] > 0:
                    missing += 1     # we just gave up a letter we needed
                left += 1
        return "" if best[0] == float("inf") else s[best[1]:best[2] + 1]
```

## Fixed size windows

When the window size `k` is given, there's no shrink loop. Add the entering element, remove the one that fell off the left.

```diagram
FixedWindow
```

```python title="643. Maximum Average Subarray I"
class Solution:
    def findMaxAverage(self, nums: list[int], k: int) -> float:
        total = sum(nums[:k])                # the first window
        best = total
        for right in range(k, len(nums)):
            total += nums[right] - nums[right - k]   # one in, one out
            best = max(best, total)
        return best / k
```

Permutation in String (567) and Find All Anagrams (438) are fixed size windows over **letter counts**: slide a window of `len(p)` across `s` and compare the two 26 slot count lists.

## When a window won't work

The window only works if growing it can break the rule and shrinking can fix it, in a predictable direction. With **negative numbers**, adding an element can make a sum smaller, so "shrink while the sum is too big" stops being correct. For "subarray sum equals k" with negatives, use [prefix sums with a hash map](#/notes/prefix-sum).

For "maximum of every window of size k" (239), the window state has to answer "what's the max?" as elements leave, which needs a [monotonic deque](#/notes/monotonic-stack).

## Practice

```problems
643 | Maximum Average Subarray I | maximum-average-subarray-i | Easy | fixed size
3 | Longest Substring Without Repeating Characters | longest-substring-without-repeating-characters | Medium | the classic
424 | Longest Repeating Character Replacement | longest-repeating-character-replacement | Medium | length minus top count
1004 | Max Consecutive Ones III | max-consecutive-ones-iii | Medium | at most k zeros inside
567 | Permutation in String | permutation-in-string | Medium | fixed window of counts
438 | Find All Anagrams in a String | find-all-anagrams-in-a-string | Medium | same, collect every match
209 | Minimum Size Subarray Sum | minimum-size-subarray-sum | Medium | shortest valid window
76 | Minimum Window Substring | minimum-window-substring | Hard | counts + missing counter
239 | Sliding Window Maximum | sliding-window-maximum | Hard | monotonic deque
```
