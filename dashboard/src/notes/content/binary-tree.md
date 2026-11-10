## The idea

The [Tree Traversal](#/notes/tree) note covers the walk itself: three positions and two ways of thinking. This note is about the **patterns** that keep showing up in binary tree interview problems. Almost all of them answer one question: **which direction does information flow?**

| Information flows | Position | Signature | Examples |
|---|---|---|---|
| **Up** from the children | postorder | the function returns something | height, diameter, balanced, LCA, max path sum |
| **Down** from the parent | preorder | extra arguments | depth, path sum, max so far, valid range |
| **Across** a level | BFS with a queue | loop over levels | level order, right side view, zigzag |

## Pattern 1: return info up, track the answer on the side

Many problems need two different things at every node: one value to **return** to the parent, and a different value that might be the **final answer**. Diameter is the classic: each call returns its height, but the diameter through a node is left height + right height.

```diagram
Diameter
```

```python title="543. Diameter of Binary Tree"
class Solution:
    def diameterOfBinaryTree(self, root) -> int:
        best = 0

        def height(node):
            nonlocal best
            if not node:
                return 0
            left = height(node.left)
            right = height(node.right)
            best = max(best, left + right)   # the longest path that turns at this node
            return 1 + max(left, right)      # what the parent needs: my height

        height(root)
        return best
```

Balanced Binary Tree (110) uses the same shape and returns `-1` as a signal meaning "already unbalanced, stop". Binary Tree Maximum Path Sum (124) returns "the best path going down from here" and tracks "the best path turning here" on the side, dropping negative branches with `max(0, ...)`.

```python title="110. Balanced Binary Tree"
class Solution:
    def isBalanced(self, root) -> bool:
        def height(node):
            if not node:
                return 0
            left = height(node.left)
            right = height(node.right)
            if left == -1 or right == -1 or abs(left - right) > 1:
                return -1                    # unbalanced somewhere below: pass the signal up
            return 1 + max(left, right)
        return height(root) != -1
```

## Pattern 2: pass info down as arguments

When a node's answer depends on its **ancestors**, pass what it needs down as a parameter.

```diagram
GoodNodes
```

```python title="1448. Count Good Nodes in Binary Tree"
class Solution:
    def goodNodes(self, root) -> int:
        def count(node, max_above):
            if not node:
                return 0
            good = 1 if node.val >= max_above else 0
            new_max = max(max_above, node.val)       # what my children will see above them
            return good + count(node.left, new_max) + count(node.right, new_max)
        return count(root, root.val)
```

Path Sum (112) passes the remaining target down. Validate BST (98) passes the allowed `(low, high)` range down. Sum Root to Leaf Numbers (129) passes the number built so far.

## Pattern 3: level by level

When the question mentions **levels, rows, or what I see from the side**, use a queue and process one level per loop iteration.

```diagram
RightSideView
```

```python title="102. Binary Tree Level Order Traversal"
from collections import deque

class Solution:
    def levelOrder(self, root) -> list[list[int]]:
        if not root:
            return []
        res = []
        queue = deque([root])
        while queue:
            level = []
            for _ in range(len(queue)):    # exactly the nodes on this level
                node = queue.popleft()
                level.append(node.val)
                if node.left:
                    queue.append(node.left)
                if node.right:
                    queue.append(node.right)
            res.append(level)
        return res
```

Right Side View (199) keeps `level[-1]`. Zigzag (103) reverses every other level. Average of Levels (637) averages each one. Same loop every time.

## Pattern 4: lowest common ancestor

Let each call return **p or q if it found one below it**, otherwise `None`. The first node that gets something back from **both** sides is the answer.

```diagram
LCA
```

```python title="236. Lowest Common Ancestor of a Binary Tree"
class Solution:
    def lowestCommonAncestor(self, root, p, q):
        if root is None or root is p or root is q:
            return root                      # found one (or hit the bottom)
        left = self.lowestCommonAncestor(root.left, p, q)
        right = self.lowestCommonAncestor(root.right, p, q)
        if left and right:
            return root                      # p on one side, q on the other: this is the meeting point
        return left or right                 # pass up whichever side found something
```

If p is an ancestor of q, the search returns p as soon as it reaches it and never looks deeper, which is correct because a node counts as its own ancestor.

## Pattern 5: build a tree from traversals

Preorder tells me the **root** (it comes first). Inorder tells me **what's left and right** of the root. Together they pin down the whole tree.

```diagram
BuildTree
```

```python title="105. Construct Binary Tree from Preorder and Inorder Traversal"
class Solution:
    def buildTree(self, preorder: list[int], inorder: list[int]):
        index = {v: i for i, v in enumerate(inorder)}   # O(1) "where is the root in inorder?"
        pre = iter(preorder)                            # roots come out in preorder

        def build(lo, hi):                  # build the subtree made of inorder[lo..hi]
            if lo > hi:
                return None
            root = TreeNode(next(pre))      # the next preorder value is this subtree's root
            mid = index[root.val]
            root.left = build(lo, mid - 1)  # left must be built first: that's preorder's order
            root.right = build(mid + 1, hi)
            return root

        return build(0, len(inorder) - 1)
```

## Practice

```problems
543 | Diameter of Binary Tree | diameter-of-binary-tree | Easy | return height, track diameter
110 | Balanced Binary Tree | balanced-binary-tree | Easy | -1 as a signal
112 | Path Sum | path-sum | Easy | pass the remaining target down
102 | Binary Tree Level Order Traversal | binary-tree-level-order-traversal | Medium | queue, one level per loop
199 | Binary Tree Right Side View | binary-tree-right-side-view | Medium | last of each level
1448 | Count Good Nodes in Binary Tree | count-good-nodes-in-binary-tree | Medium | pass the max down
236 | Lowest Common Ancestor of a Binary Tree | lowest-common-ancestor-of-a-binary-tree | Medium | both sides found one
105 | Construct Binary Tree from Preorder and Inorder Traversal | construct-binary-tree-from-preorder-and-inorder-traversal | Medium | root from preorder, split by inorder
103 | Binary Tree Zigzag Level Order Traversal | binary-tree-zigzag-level-order-traversal | Medium | reverse every other level
124 | Binary Tree Maximum Path Sum | binary-tree-maximum-path-sum | Hard | diameter with values
297 | Serialize and Deserialize Binary Tree | serialize-and-deserialize-binary-tree | Hard | preorder with null markers
```
