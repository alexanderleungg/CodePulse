## The idea

A hash table turns a key into an array index. It runs the key through a **hash function**, takes the result modulo the number of buckets, and stores the value in that bucket. Looking a key up repeats the same math and jumps straight there, so there is no scanning.

```diagram
Buckets
```

In Python I almost never build one myself. `dict` maps keys to values and `set` stores keys only. Both give O(1) average time for insert, delete, and lookup.

The whole topic comes down to one trade: **spend O(n) memory to turn an O(n) search into an O(1) lookup.** Whenever I catch myself writing a nested loop that asks "have I seen this before?", a hash table can usually remove the inner loop.

## The Python toolkit

```python
seen = set()                     # membership only
seen.add(x); x in seen           # O(1) average

idx = {}                         # value -> something
idx.get(x, -1)                   # lookup with a default, no KeyError
idx.setdefault(key, []).append(v)

from collections import Counter, defaultdict
count = Counter("banana")        # {'a': 3, 'n': 2, 'b': 1}
count.most_common(2)             # [('a', 3), ('n', 2)]
groups = defaultdict(list)       # missing keys start as []
groups[key].append(word)
```

> **Tip:** Keys must be hashable, meaning they can't change. Strings, numbers, and tuples work. Lists don't, so convert with `tuple(my_list)` when I need a list as a key.

## Pattern 1: complement lookup

Two Sum asks for two numbers that add to `target`. For each number `x`, the partner I need is `target - x`. Instead of scanning for it, check a dict of everything I've already passed.

```diagram
TwoSum
```

```python title="1. Two Sum"
class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        seen = {}                          # value -> index where we saw it
        for i, x in enumerate(nums):
            need = target - x
            if need in seen:               # its partner came earlier
                return [seen[need], i]
            seen[x] = i                    # store AFTER checking, so x can't pair with itself
        return []
```

Checking before storing matters: with `nums = [3, 3]` and `target = 6`, the first 3 isn't in `seen` yet, gets stored, and the second 3 finds it.

## Pattern 2: counting

When a problem talks about frequencies, anagrams, or "at most k of each", count with a `Counter`.

```python title="242. Valid Anagram"
from collections import Counter

class Solution:
    def isAnagram(self, s: str, t: str) -> bool:
        # anagrams use exactly the same letters the same number of times
        return Counter(s) == Counter(t)
```

With only lowercase letters, a list of 26 counts works too and is a little faster: `ord(ch) - ord('a')` gives the slot.

## Pattern 3: grouping by a signature

Pick a **signature** that is equal for items that belong together, then use it as the key. For anagrams, the sorted letters are the signature.

```diagram
GroupAnagrams
```

```python title="49. Group Anagrams"
from collections import defaultdict

class Solution:
    def groupAnagrams(self, strs: list[str]) -> list[list[str]]:
        groups = defaultdict(list)
        for word in strs:
            key = "".join(sorted(word))    # "tea" -> "aet"
            groups[key].append(word)
        return list(groups.values())
```

Sorting each word costs O(k log k). A faster signature is a tuple of 26 letter counts, which is O(k) per word.

## Pattern 4: a set for instant membership

Longest Consecutive Sequence wants O(n), which rules out sorting. Put every number in a set, then only start counting from numbers that begin a run.

```diagram
ConsecutiveStarts
```

```python title="128. Longest Consecutive Sequence"
class Solution:
    def longestConsecutive(self, nums: list[int]) -> int:
        s = set(nums)
        best = 0
        for x in s:
            if x - 1 in s:          # not the start of a run, the start will count it
                continue
            length = 1
            while x + length in s:  # walk forward through the run
                length += 1
            best = max(best, length)
        return best
```

It looks like a nested loop, but the `while` only runs from run starts, so every number is stepped over once in total. That's O(n).

## Pattern 5: prefix sums plus a dict

"Count subarrays with sum k" combines a running total with a dict of how often each running total has appeared. That one has its own page: see the [Prefix Sum](#/notes/prefix-sum) note.

## Complexity

| Operation | Average | Worst case |
|---|---|---|
| insert, delete, lookup | O(1) | O(n) if everything collides |
| iterate all keys | O(n) | O(n) |
| memory | O(n) | O(n) |

The worst case almost never happens with Python's built in hashing, so interviews treat dict and set operations as O(1).

## Practice

```problems
217 | Contains Duplicate | contains-duplicate | Easy | a set in one line
1 | Two Sum | two-sum | Easy | complement lookup
242 | Valid Anagram | valid-anagram | Easy | counting
205 | Isomorphic Strings | isomorphic-strings | Easy | two maps, both directions
49 | Group Anagrams | group-anagrams | Medium | signature as the key
347 | Top K Frequent Elements | top-k-frequent-elements | Medium | count, then bucket or heap
128 | Longest Consecutive Sequence | longest-consecutive-sequence | Medium | only count from run starts
560 | Subarray Sum Equals K | subarray-sum-equals-k | Medium | prefix sum + dict
380 | Insert Delete GetRandom O(1) | insert-delete-getrandom-o1 | Medium | dict of indexes + list
```
