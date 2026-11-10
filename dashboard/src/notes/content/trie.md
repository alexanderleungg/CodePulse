## The idea

A trie (pronounced "try", from re**trie**val) stores words as paths in a tree, one character per edge. Words that start the same way share the same path, so every prefix exists exactly once.

```diagram
Structure
```

It shines when the question is about **prefixes**: autocomplete, "does any word start with this?", or checking a grid against thousands of words at once. A hash set can tell me if a whole word exists; a trie can also tell me if I'm **on the way** to one.

## The template

```python title="208. Implement Trie (Prefix Tree)"
class TrieNode:
    def __init__(self):
        self.children = {}      # char -> TrieNode
        self.is_end = False     # True if a word ends exactly here

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word: str) -> None:
        node = self.root
        for ch in word:
            if ch not in node.children:
                node.children[ch] = TrieNode()    # create the path as needed
            node = node.children[ch]
        node.is_end = True                        # mark the last character

    def _walk(self, s):
        # follow s from the root, return the node where it ends (or None if the path breaks)
        node = self.root
        for ch in s:
            if ch not in node.children:
                return None
            node = node.children[ch]
        return node

    def search(self, word: str) -> bool:
        node = self._walk(word)
        return node is not None and node.is_end   # the path exists AND a word ends there

    def startsWith(self, prefix: str) -> bool:
        return self._walk(prefix) is not None     # the path existing is enough
```

```diagram
SearchVsPrefix
```

Every operation costs **O(L)** for a word of length L. Memory is O(total characters inserted), less when words share prefixes.

> **Tip:** Using a dict for `children` works for any characters. With only lowercase letters, `[None] * 26` indexed by `ord(ch) - ord('a')` is a bit faster, but the dict version is easier to write correctly.

## Wildcards: search with DFS

When a query can contain `.` meaning "any letter", one path turns into many. Try every child at a `.` and continue.

```python title="211. Design Add and Search Words Data Structure"
class WordDictionary:
    def __init__(self):
        self.root = {}                      # a dict of dicts; "$" marks a word end

    def addWord(self, word: str) -> None:
        node = self.root
        for ch in word:
            node = node.setdefault(ch, {})
        node["$"] = True

    def search(self, word: str) -> bool:
        def dfs(node, i):
            if i == len(word):
                return "$" in node
            ch = word[i]
            if ch == ".":
                # try every real child (skip the "$" end marker)
                return any(dfs(child, i + 1) for key, child in node.items() if key != "$")
            return ch in node and dfs(node[ch], i + 1)
        return dfs(self.root, 0)
```

The nested dict version (`node.setdefault(ch, {})`) is a common shortcut in Python when I don't need extra fields on each node.

## A trie plus backtracking

Word Search II gives a grid and a list of words and asks which words appear. Searching the grid once per word is too slow. Instead, put every word in a trie and run **one** backtracking search over the grid, following the trie as I go. The moment the current path isn't a prefix of any word, stop.

```python title="212. Word Search II"
class Solution:
    def findWords(self, board: list[list[str]], words: list[str]) -> list[str]:
        root = {}
        for w in words:
            node = root
            for ch in w:
                node = node.setdefault(ch, {})
            node["$"] = w                          # store the whole word at its end

        rows, cols = len(board), len(board[0])
        found = []

        def dfs(r, c, node):
            ch = board[r][c]
            if ch not in node:
                return                             # no word continues this way: prune
            nxt = node[ch]
            if "$" in nxt:
                found.append(nxt.pop("$"))         # pop so each word is reported once
            board[r][c] = "#"                      # mark visited (choose)
            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nr, nc = r + dr, c + dc
                if 0 <= nr < rows and 0 <= nc < cols and board[nr][nc] != "#":
                    dfs(nr, nc, nxt)
            board[r][c] = ch                       # unmark (undo)
            if not nxt:
                node.pop(ch)                       # prune finished branches so later searches skip them

        for r in range(rows):
            for c in range(cols):
                dfs(r, c, root)
        return found
```

## When to use a trie

- "starts with", "prefix", "autocomplete", "suggestions"
- many words checked against one input (a grid, a long string)
- replacing words by their shortest root (Replace Words, 648)
- XOR maximization over numbers, using a trie of **bits** (Maximum XOR of Two Numbers, 421)

If I only need "is this exact word present?", a `set` is simpler.

## Practice

```problems
208 | Implement Trie (Prefix Tree) | implement-trie-prefix-tree | Medium | the template
211 | Design Add and Search Words Data Structure | design-add-and-search-words-data-structure | Medium | DFS on wildcards
648 | Replace Words | replace-words | Medium | shortest root wins
1268 | Search Suggestions System | search-suggestions-system | Medium | autocomplete
720 | Longest Word in Dictionary | longest-word-in-dictionary | Medium | every prefix must be a word
212 | Word Search II | word-search-ii | Hard | trie + backtracking
421 | Maximum XOR of Two Numbers in an Array | maximum-xor-of-two-numbers-in-an-array | Medium | a trie of bits
```
