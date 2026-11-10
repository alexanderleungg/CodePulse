## The idea

A string is an array of characters with one big difference in Python: **it can't be changed**. `s[0] = "x"` is an error, and every "change" builds a new string. Most string problems are really array problems, so the array patterns (two pointers, sliding window, counting) all carry over. The new things to learn are how to build strings efficiently and a few palindrome tricks.

## Building strings the right way

```diagram
ConcatCost
```

```python
# slow: O(n²) in the worst case, every += copies the whole string so far
out = ""
for ch in s:
    out += ch.upper()

# fast: O(n), collect pieces in a list and join once
parts = []
for ch in s:
    parts.append(ch.upper())
out = "".join(parts)
```

When I need to edit characters in place (reversing, swapping), convert to a list first: `chars = list(s)`, edit, then `"".join(chars)`.

## Handy tools

```python
ord("a"), chr(97)          # 97, "a": character <-> number
ord(ch) - ord("a")         # 0..25, a slot in a 26 letter count array
ch.isalnum(), ch.isdigit() # letter or digit? digit?
s.lower(), s.strip()       # lowercase copy, trim spaces at both ends
s.split()                  # split on any whitespace, drops empty pieces
" ".join(words)            # glue a list back together
s[::-1]                    # reversed copy
s.startswith(p), s.find(p) # prefix check, index of p or -1
```

## Pattern 1: two pointers from both ends

A palindrome reads the same forwards and backwards, so compare the outside pair and move inward. Skip characters that don't count.

```diagram
TwoEnds
```

```python title="125. Valid Palindrome"
class Solution:
    def isPalindrome(self, s: str) -> bool:
        l, r = 0, len(s) - 1
        while l < r:
            if not s[l].isalnum():          # skip punctuation and spaces on the left
                l += 1
            elif not s[r].isalnum():        # and on the right
                r -= 1
            elif s[l].lower() != s[r].lower():
                return False                # a mismatched pair ends it
            else:
                l += 1
                r -= 1
        return True
```

This uses O(1) extra space. The shortcut `cleaned == cleaned[::-1]` works too but builds two new strings.

## Pattern 2: expand around the center

For "find the longest palindromic substring", flip the question around: every palindrome has a **center**. Try every center and expand outward while the two ends match.

```diagram
ExpandCenter
```

```python title="5. Longest Palindromic Substring"
class Solution:
    def longestPalindrome(self, s: str) -> str:
        def expand(l, r):
            # grow outward while both ends match, then return the last good window
            while l >= 0 and r < len(s) and s[l] == s[r]:
                l -= 1
                r += 1
            return l + 1, r - 1          # the loop went one step too far on each side

        best_l, best_r = 0, 0
        for i in range(len(s)):
            for l, r in (expand(i, i), expand(i, i + 1)):   # odd center, even center
                if r - l > best_r - best_l:
                    best_l, best_r = l, r
        return s[best_l:best_r + 1]
```

There are `2n - 1` centers and each expansion is O(n), so this is O(n²) time and O(1) space. Palindromic Substrings (647) is the same loop, but it counts every successful expansion instead of keeping the longest.

## Pattern 3: scan column by column

When comparing several strings position by position, line them up and read down the columns.

```diagram
CommonPrefix
```

```python title="14. Longest Common Prefix"
class Solution:
    def longestCommonPrefix(self, strs: list[str]) -> str:
        first = strs[0]
        for i, ch in enumerate(first):          # column i
            for word in strs[1:]:
                if i == len(word) or word[i] != ch:
                    return first[:i]            # this column breaks the prefix
        return first                            # the whole first word is shared
```

## Pattern 4: counting characters

Anagram style questions ("same letters, any order") are counting problems. With only lowercase letters, a fixed 26 slot list is the fastest counter.

```python title="383. Ransom Note"
class Solution:
    def canConstruct(self, ransomNote: str, magazine: str) -> bool:
        count = [0] * 26
        for ch in magazine:
            count[ord(ch) - ord("a")] += 1      # letters available
        for ch in ransomNote:
            i = ord(ch) - ord("a")
            count[i] -= 1                       # use one up
            if count[i] < 0:
                return False                    # needed more than the magazine has
        return True
```

When the letters must also be **next to each other** (like "find all anagrams of p inside s"), counting combines with a sliding window. See the [Sliding Window](#/notes/sliding-window) note.

## Common mistakes

1. Building with `+=` inside a loop on long inputs.
2. Forgetting even length centers in palindrome problems (`"abba"` has no middle letter).
3. Off by one when slicing: `s[a:b]` stops **before** index `b`.
4. Using `s.split(" ")` on text with repeated spaces. It keeps empty strings; `s.split()` doesn't.

## Practice

```problems
344 | Reverse String | reverse-string | Easy | two pointers, in place
125 | Valid Palindrome | valid-palindrome | Easy | skip and compare from both ends
14 | Longest Common Prefix | longest-common-prefix | Easy | column scan
383 | Ransom Note | ransom-note | Easy | 26 slot counting
151 | Reverse Words in a String | reverse-words-in-a-string | Medium | split, reverse, join
5 | Longest Palindromic Substring | longest-palindromic-substring | Medium | expand around center
647 | Palindromic Substrings | palindromic-substrings | Medium | count every expansion
438 | Find All Anagrams in a String | find-all-anagrams-in-a-string | Medium | counting + sliding window
```
