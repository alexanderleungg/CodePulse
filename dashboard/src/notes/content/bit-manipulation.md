## The idea

Every integer is stored as bits, and bit operators work on all of them at once. Bit tricks turn some problems that look like they need extra memory or loops into a single line. The problems are usually short, so the goal is to recognize a handful of tricks.

## The operators

| Operator | Name | Rule per bit | Example (12 = 1100, 10 = 1010) |
|---|---|---|---|
| `a & b` | AND | 1 if both are 1 | `12 & 10 = 8` (1000) |
| `a \| b` | OR | 1 if either is 1 | `12 \| 10 = 14` (1110) |
| `a ^ b` | XOR | 1 if they differ | `12 ^ 10 = 6` (0110) |
| `~a` | NOT | flip every bit | `~12 = -13` in Python |
| `a << k` | left shift | move bits left, multiply by 2ᵏ | `3 << 2 = 12` |
| `a >> k` | right shift | move bits right, floor divide by 2ᵏ | `12 >> 2 = 3` |

```diagram
Operators
```

## Single bit recipes

```python
(x >> i) & 1          # read bit i (0 or 1)
x | (1 << i)          # set bit i
x & ~(1 << i)         # clear bit i
x ^ (1 << i)          # flip bit i
x & (x - 1)           # remove the lowest 1 bit
x & -x                # keep ONLY the lowest 1 bit
x > 0 and x & (x - 1) == 0   # x is a power of two
bin(x).count("1")     # count 1 bits (or x.bit_count() in Python 3.10+)
```

## Trick 1: x & (x - 1)

```diagram
ClearLowest
```

```python title="191. Number of 1 Bits"
class Solution:
    def hammingWeight(self, n: int) -> int:
        count = 0
        while n:
            n &= n - 1        # drop the lowest 1 bit
            count += 1        # one loop per 1 bit, not per bit
        return count
```

```python title="231. Power of Two"
class Solution:
    def isPowerOfTwo(self, n: int) -> bool:
        return n > 0 and n & (n - 1) == 0    # powers of two have exactly one 1 bit
```

## Trick 2: XOR cancels pairs

Three facts make XOR special: `x ^ x = 0`, `x ^ 0 = x`, and order doesn't matter. So XOR over a list cancels every value that appears twice.

```diagram
SingleNumber
```

```python title="136. Single Number"
class Solution:
    def singleNumber(self, nums: list[int]) -> int:
        result = 0
        for x in nums:
            result ^= x       # pairs cancel, the lonely number survives
        return result
```

Missing Number (268) uses the same idea: XOR every index `0..n` and every value. Each number that's present appears twice and cancels, leaving the missing one.

```python title="268. Missing Number"
class Solution:
    def missingNumber(self, nums: list[int]) -> int:
        result = len(nums)                 # the index n has no slot in the loop, so start with it
        for i, x in enumerate(nums):
            result ^= i ^ x
        return result
```

## Trick 3: build from smaller numbers

`i >> 1` is `i` with its last bit dropped, which is a smaller number I've already solved. That makes counting bits for every number a tiny DP.

```python title="338. Counting Bits"
class Solution:
    def countBits(self, n: int) -> list[int]:
        bits = [0] * (n + 1)
        for i in range(1, n + 1):
            bits[i] = bits[i >> 1] + (i & 1)    # bits of i without its last bit, plus that last bit
        return bits
```

## Trick 4: a number as a set

With n items, an integer from `0` to `2ⁿ - 1` can represent any subset: bit `i` on means item `i` is in.

```diagram
Subsets
```

```python title="78. Subsets (bitmask version)"
class Solution:
    def subsets(self, nums: list[int]) -> list[list[int]]:
        n = len(nums)
        res = []
        for mask in range(1 << n):                           # 0 .. 2^n - 1
            res.append([nums[i] for i in range(n) if mask >> i & 1])
        return res
```

Bitmasks also compress state in DP and BFS, like "which cities have I visited" as one integer instead of a set.

## Python gotchas

Python integers never overflow and negative numbers behave as if they had infinitely many leading 1s. Problems written for 32 bit integers sometimes need a mask:

```python title="190. Reverse Bits"
class Solution:
    def reverseBits(self, n: int) -> int:
        result = 0
        for _ in range(32):                # exactly 32 bits, even if n is small
            result = (result << 1) | (n & 1)   # push n's lowest bit onto result
            n >>= 1
        return result
```

For Sum of Two Integers (371), where negatives matter, keep everything inside `0xFFFFFFFF` and convert back at the end with `x if x <= 0x7FFFFFFF else ~(x ^ 0xFFFFFFFF)`.

## Practice

```problems
191 | Number of 1 Bits | number-of-1-bits | Easy | x & (x - 1)
231 | Power of Two | power-of-two | Easy | exactly one 1 bit
136 | Single Number | single-number | Easy | XOR cancels pairs
268 | Missing Number | missing-number | Easy | XOR indexes and values
338 | Counting Bits | counting-bits | Easy | bits[i >> 1] + last bit
190 | Reverse Bits | reverse-bits | Easy | shift out, shift in
78 | Subsets | subsets | Medium | masks as sets
137 | Single Number II | single-number-ii | Medium | count each bit mod 3
371 | Sum of Two Integers | sum-of-two-integers | Medium | XOR is add without carry
```
