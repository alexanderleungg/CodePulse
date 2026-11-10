## The idea

A greedy algorithm builds the answer one step at a time, always taking the choice that looks **best right now**, and never going back. When it works, it's the simplest and fastest solution: usually a sort plus one pass.

The catch is that it doesn't always work.

```diagram
GreedyFails
```

So a greedy solution has two parts: the rule, and a reason the rule is safe. I don't need a formal proof in an interview, but I should be able to say **why** the local choice never costs me the best answer.

## How to convince myself greedy is right

The usual argument is an **exchange argument**: take any optimal answer that doesn't follow my rule, and show I can swap in the greedy choice without making it worse. If that's always possible, greedy is optimal.

Example: in interval scheduling, suppose the best answer's first interval ends later than the one ending earliest. Swap it for the earliest ending one. It ends sooner, so it can't collide with anything the other one didn't, and the count stays the same. So "earliest end first" is always safe.

If I can build a small counterexample instead (like the coins above), it's a DP problem.

## Pattern 1: intervals, sorted by end

Sort by end time and keep every interval that starts after the last kept one ends. This maximizes how many non-overlapping intervals I keep, which is the same as minimizing how many I remove.

```diagram
Schedule
```

```python title="435. Non-overlapping Intervals"
class Solution:
    def eraseOverlapIntervals(self, intervals: list[list[int]]) -> int:
        intervals.sort(key=lambda iv: iv[1])     # earliest END first
        removed = 0
        last_end = float("-inf")
        for start, end in intervals:
            if start >= last_end:
                last_end = end                   # keep it
            else:
                removed += 1                     # overlaps a kept interval: drop it
        return removed
```

Minimum Number of Arrows to Burst Balloons (452) is the same loop: one arrow per kept interval, and it counts the kept ones.

**Merging** intervals is the other common task, and there I sort by **start**:

```python title="56. Merge Intervals"
class Solution:
    def merge(self, intervals: list[list[int]]) -> list[list[int]]:
        intervals.sort(key=lambda iv: iv[0])     # by START
        merged = [intervals[0]]
        for start, end in intervals[1:]:
            if start <= merged[-1][1]:                       # overlaps the last merged block
                merged[-1][1] = max(merged[-1][1], end)      # stretch it
            else:
                merged.append([start, end])                  # a gap: new block
        return merged
```

## Pattern 2: track the farthest I can reach

Jump Game doesn't need to try every jump. Just track the farthest index reachable so far. If I ever stand on an index beyond it, I'm stuck.

```diagram
JumpGame
```

```python title="55. Jump Game"
class Solution:
    def canJump(self, nums: list[int]) -> bool:
        reach = 0                          # farthest index reachable so far
        for i, jump in enumerate(nums):
            if i > reach:
                return False               # can't even get to i
            reach = max(reach, i + jump)
        return True
```

Jump Game II (45) counts jumps with the same idea, treating each jump as a "level" in BFS: the current jump covers indexes up to `end`, and while scanning them I find how far the next jump could go.

```python title="45. Jump Game II"
class Solution:
    def jump(self, nums: list[int]) -> int:
        jumps = 0
        end = 0          # last index reachable with `jumps` jumps
        farthest = 0     # farthest index reachable with one more jump
        for i in range(len(nums) - 1):
            farthest = max(farthest, i + nums[i])
            if i == end:              # used up this jump's range: must jump again
                jumps += 1
                end = farthest
        return jumps
```

## Pattern 3: reset when things go negative

Gas Station: if the tank goes negative between station `start` and station `i`, **none** of those stations can be the start (they'd arrive at `i` with even less gas). So jump the start to `i + 1`. If total gas covers total cost, the surviving start works.

```python title="134. Gas Station"
class Solution:
    def canCompleteCircuit(self, gas: list[int], cost: list[int]) -> int:
        if sum(gas) < sum(cost):
            return -1                      # not enough gas overall, no start can work
        tank = 0
        start = 0
        for i in range(len(gas)):
            tank += gas[i] - cost[i]
            if tank < 0:                   # can't get past i from `start`, or from anything in between
                start = i + 1
                tank = 0
        return start
```

Kadane's algorithm for Maximum Subarray (in the [Arrays](#/notes/array) note) is the same "drop the prefix when it goes negative" idea.

## Pattern 4: sort, then match smallest with smallest

When pairing things up, sorting both sides and matching in order is often optimal.

```python title="455. Assign Cookies"
class Solution:
    def findContentChildren(self, g: list[int], s: list[int]) -> int:
        g.sort()                  # greed factors
        s.sort()                  # cookie sizes
        child = 0
        for size in s:
            if child < len(g) and size >= g[child]:
                child += 1        # the smallest cookie that satisfies the least greedy child
        return child
```

Giving a child a bigger cookie than necessary can only hurt a greedier child later, which is the exchange argument in one sentence.

## Pattern 5: know where things end

```diagram
PartitionLabels
```

```python title="763. Partition Labels"
class Solution:
    def partitionLabels(self, s: str) -> list[int]:
        last = {ch: i for i, ch in enumerate(s)}   # last index of every letter
        sizes = []
        start = end = 0
        for i, ch in enumerate(s):
            end = max(end, last[ch])     # this part must reach at least here
            if i == end:                 # every letter so far is finished: cut
                sizes.append(end - start + 1)
                start = i + 1
        return sizes
```

## Greedy or DP?

| Signal | Leans |
|---|---|
| sorting makes the right choice obvious | greedy |
| I can explain why the local choice never hurts | greedy |
| a small counterexample breaks the obvious rule | DP |
| the choice now changes what's allowed later in complicated ways | DP |

## Practice

```problems
455 | Assign Cookies | assign-cookies | Easy | sort both, match in order
122 | Best Time to Buy and Sell Stock II | best-time-to-buy-and-sell-stock-ii | Medium | take every rise
55 | Jump Game | jump-game | Medium | farthest reach
45 | Jump Game II | jump-game-ii | Medium | jumps as levels
134 | Gas Station | gas-station | Medium | reset the start
435 | Non-overlapping Intervals | non-overlapping-intervals | Medium | sort by end
452 | Minimum Number of Arrows to Burst Balloons | minimum-number-of-arrows-to-burst-balloons | Medium | sort by end, count kept
56 | Merge Intervals | merge-intervals | Medium | sort by start
763 | Partition Labels | partition-labels | Medium | last occurrence
846 | Hand of Straights | hand-of-straights | Medium | always start from the smallest
```
