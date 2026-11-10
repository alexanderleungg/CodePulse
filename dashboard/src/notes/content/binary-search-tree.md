## The idea

A binary search tree adds one rule to a binary tree: for every node, **everything in its left subtree is smaller and everything in its right subtree is bigger**. Not just its children, the entire subtrees.

That rule gives me two superpowers:

1. **Search like binary search.** At each node I know which side the target must be on, so I only walk one path from the root: O(height).
2. **Inorder traversal is sorted.** Left, node, right visits values smallest to largest.

```diagram
Search
```

## Search, insert, and the BST loop

Because I only ever go one way, BST operations are usually a simple loop instead of full recursion.

```python title="700. Search in a Binary Search Tree"
class Solution:
    def searchBST(self, root, val: int):
        node = root
        while node and node.val != val:
            node = node.left if val < node.val else node.right   # the rule picks the side
        return node
```

```python title="701. Insert into a Binary Search Tree"
class Solution:
    def insertIntoBST(self, root, val: int):
        if root is None:
            return TreeNode(val)                # found the empty spot where val belongs
        if val < root.val:
            root.left = self.insertIntoBST(root.left, val)
        else:
            root.right = self.insertIntoBST(root.right, val)
        return root
```

## Validating: the range trick

```diagram
InvalidBST
```

```python title="98. Validate Binary Search Tree"
class Solution:
    def isValidBST(self, root) -> bool:
        def valid(node, low, high):
            # every value in this subtree must be strictly between low and high
            if not node:
                return True
            if not (low < node.val < high):
                return False
            return (valid(node.left, low, node.val) and     # left side: now capped by node.val
                    valid(node.right, node.val, high))      # right side: now floored by node.val
        return valid(root, float("-inf"), float("inf"))
```

Another correct approach: do an inorder traversal and check every value is bigger than the one before it.

## Using the sorted order

Anything about ranks or order is an inorder traversal in disguise.

```python title="230. Kth Smallest Element in a BST"
class Solution:
    def kthSmallest(self, root, k: int) -> int:
        stack = []
        node = root
        while True:
            while node:                # go as far left (as small) as possible
                stack.append(node)
                node = node.left
            node = stack.pop()         # the next smallest value
            k -= 1
            if k == 0:
                return node.val
            node = node.right
```

The iterative version can stop the moment it reaches the k-th value, instead of building the whole sorted list.

## Lowest common ancestor in a BST

In a BST I don't need to search both sides. If p and q are both smaller than the node, the answer is on the left. Both bigger, on the right. Otherwise they split here, and this node is the answer.

```python title="235. Lowest Common Ancestor of a Binary Search Tree"
class Solution:
    def lowestCommonAncestor(self, root, p, q):
        node = root
        while node:
            if p.val < node.val and q.val < node.val:
                node = node.left
            elif p.val > node.val and q.val > node.val:
                node = node.right
            else:
                return node            # they split (or one of them is this node)
```

## Deleting

Leaves and single child nodes are easy: return the other child to the parent. Two children needs a replacement that keeps the rule, and the **inorder successor** does.

```diagram
Delete
```

```python title="450. Delete Node in a BST"
class Solution:
    def deleteNode(self, root, key: int):
        if not root:
            return None
        if key < root.val:
            root.left = self.deleteNode(root.left, key)
        elif key > root.val:
            root.right = self.deleteNode(root.right, key)
        else:
            if not root.left:
                return root.right              # zero or one child: the child takes over
            if not root.right:
                return root.left
            succ = root.right                  # two children: find the smallest on the right
            while succ.left:
                succ = succ.left
            root.val = succ.val                # copy it up...
            root.right = self.deleteNode(root.right, succ.val)   # ...and delete the original
        return root
```

## Height is everything

```diagram
Shape
```

Every BST operation is O(height). That's O(log n) only when the tree is balanced. Interview problems usually give me a BST as is, but it's worth saying out loud that the bound is O(h).

> **Tip:** Python has no built in balanced BST. For "sorted structure with inserts" in Python, use `bisect.insort` on a list (O(n) inserts, fine for small inputs) or `sortedcontainers.SortedList`, which LeetCode supports.

## Practice

```problems
700 | Search in a Binary Search Tree | search-in-a-binary-search-tree | Easy | one path
108 | Convert Sorted Array to Binary Search Tree | convert-sorted-array-to-binary-search-tree | Easy | middle as the root
98 | Validate Binary Search Tree | validate-binary-search-tree | Medium | pass the range down
230 | Kth Smallest Element in a BST | kth-smallest-element-in-a-bst | Medium | inorder, stop at k
235 | Lowest Common Ancestor of a Binary Search Tree | lowest-common-ancestor-of-a-binary-search-tree | Medium | find the split
701 | Insert into a Binary Search Tree | insert-into-a-binary-search-tree | Medium | walk to the empty spot
450 | Delete Node in a BST | delete-node-in-a-bst | Medium | inorder successor
173 | Binary Search Tree Iterator | binary-search-tree-iterator | Medium | iterative inorder, paused
```
