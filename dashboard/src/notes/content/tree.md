## The idea

A tree is nodes connected by edges with no loops: every node except the root has exactly one parent. A binary tree node has at most two children, `left` and `right`.

```python
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right
```

Almost every tree problem is solved by **recursion**, because a tree is recursive by definition: a node plus a left subtree plus a right subtree. If I can answer the question for the two subtrees, I can usually answer it for the whole tree.

## One walk, three positions

Here is the skeleton of every binary tree traversal. It visits every node, and every node gets **three moments** where I can run code:

```python title="the traversal framework"
def traverse(root):
    if root is None:
        return
    # PREORDER position: just arrived at root, children not visited yet
    traverse(root.left)
    # INORDER position: left subtree finished, right not started
    traverse(root.right)
    # POSTORDER position: both subtrees finished
```

Preorder, inorder, and postorder aren't three different algorithms. They're three **places** in the same walk. Step through it and watch when each list gets its next value:

```diagram
ThreePositions
```

```diagram
OrderBadges
```

What each position is good for:

| Position | What I know there | Use it for |
|---|---|---|
| **Preorder** | only what was passed down from above | passing info down: depth so far, path so far, copying a tree |
| **Inorder** | the left subtree is done | BSTs, where inorder is sorted order |
| **Postorder** | both subtrees are done and can return answers | anything computed from children: height, size, diameter, balance |

> **Tip:** If a problem needs information from the subtrees (heights, sums, "is it balanced?"), the work belongs in the postorder position.

## Two ways to think

Every tree problem can be approached one of two ways. Pick whichever makes the problem simpler.

**1. Traverse:** walk the tree once with the framework above and update some outside variable as I go. The function returns nothing.

**2. Decompose:** define what the function **returns** for a subtree, and build the answer for a node from its children's answers. Trust the recursive call to be correct.

Here's Maximum Depth solved both ways:

```python title="104. Maximum Depth of Binary Tree"
class Solution:
    def maxDepth(self, root) -> int:
        # decompose: the depth of a tree is 1 + the deeper of its two subtrees
        if root is None:
            return 0
        return 1 + max(self.maxDepth(root.left), self.maxDepth(root.right))
```

```python title="max depth, traverse style"
def max_depth(root):
    best = 0
    def traverse(node, depth):          # depth = how deep `node` is
        nonlocal best
        if node is None:
            return
        best = max(best, depth)         # preorder: record the depth we reached
        traverse(node.left, depth + 1)
        traverse(node.right, depth + 1)
    traverse(root, 1)
    return best
```

```diagram
Decompose
```

The decompose version is shorter here, but some problems (like "collect every root to leaf path") are easier as a traversal with a `path` list, which is exactly [backtracking](#/notes/backtracking). Backtracking is the traverse mindset applied to a decision tree.

## The three traversal orders as code

```python title="94. Binary Tree Inorder Traversal"
class Solution:
    def inorderTraversal(self, root) -> list[int]:
        res = []
        def traverse(node):
            if not node:
                return
            traverse(node.left)
            res.append(node.val)     # move this line up for preorder, down for postorder
            traverse(node.right)
        traverse(root)
        return res
```

Interviewers sometimes ask for the **iterative** version. Inorder with an explicit stack: go left as far as possible, then visit, then turn right.

```python title="inorder without recursion"
def inorder(root):
    res, stack = [], []
    node = root
    while node or stack:
        while node:                  # push the whole left spine
            stack.append(node)
            node = node.left
        node = stack.pop()           # leftmost unvisited node
        res.append(node.val)
        node = node.right            # then its right subtree
    return res
```

## Small examples of each mindset

```python title="226. Invert Binary Tree"
class Solution:
    def invertTree(self, root):
        if root is None:
            return None
        # preorder: swap this node's children, then fix each subtree the same way
        root.left, root.right = root.right, root.left
        self.invertTree(root.left)
        self.invertTree(root.right)
        return root
```

```python title="101. Symmetric Tree"
class Solution:
    def isSymmetric(self, root) -> bool:
        def mirror(a, b):
            # decompose: two trees mirror each other if the roots match
            # and a's outside matches b's outside, a's inside matches b's inside
            if not a and not b:
                return True
            if not a or not b or a.val != b.val:
                return False
            return mirror(a.left, b.right) and mirror(a.right, b.left)
        return mirror(root.left, root.right)
```

## Level order

Visiting the tree **level by level** isn't a depth first walk at all. It uses a queue. That template lives in the [BFS](#/notes/bfs) note, and the [Binary Tree Patterns](#/notes/binary-tree) note uses it for right side views and zigzags.

## N-ary trees

With more than two children, there's still a preorder (before the loop over children) and a postorder (after it), but no single "inorder" moment, because the walk switches between children more than once.

```python
def traverse(node):
    if not node:
        return
    # preorder
    for child in node.children:
        traverse(child)
    # postorder
```

## Complexity

Every traversal visits each node once: **O(n) time**. The recursion stack is as deep as the tree is tall: **O(h) space**, which is O(log n) for a balanced tree and O(n) for a tree shaped like a linked list.

## Practice

```problems
144 | Binary Tree Preorder Traversal | binary-tree-preorder-traversal | Easy | preorder position
94 | Binary Tree Inorder Traversal | binary-tree-inorder-traversal | Easy | also try it iteratively
145 | Binary Tree Postorder Traversal | binary-tree-postorder-traversal | Easy | postorder position
104 | Maximum Depth of Binary Tree | maximum-depth-of-binary-tree | Easy | both mindsets
226 | Invert Binary Tree | invert-binary-tree | Easy | preorder swap
101 | Symmetric Tree | symmetric-tree | Easy | compare two trees at once
100 | Same Tree | same-tree | Easy | decompose
589 | N-ary Tree Preorder Traversal | n-ary-tree-preorder-traversal | Easy | loop over children
257 | Binary Tree Paths | binary-tree-paths | Easy | traverse with a path
```
