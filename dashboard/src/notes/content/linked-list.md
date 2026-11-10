## The idea

A linked list is a chain of nodes where each node knows only the **next** one. There's no index, so reaching the 5th node means walking 5 steps. What I get in return: inserting or removing a node I'm already standing at is O(1), just rewire a pointer.

```python
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next
```

Almost every linked list problem is **pointer rewiring**, and the bugs are always the same: losing the rest of the list, or forgetting the head changed. Two habits prevent both:

1. **Save `next` before I overwrite it.**
2. **Use a dummy node** in front of the head, so the head is never a special case.

## The dummy node

When the head itself might be removed or replaced, put a fake node before it and return `dummy.next` at the end.

```python title="21. Merge Two Sorted Lists"
class Solution:
    def mergeTwoLists(self, list1, list2):
        dummy = ListNode()          # the result list hangs off this, so no "is it empty?" checks
        tail = dummy                # last node of the result so far
        while list1 and list2:
            if list1.val <= list2.val:
                tail.next = list1
                list1 = list1.next
            else:
                tail.next = list2
                list2 = list2.next
            tail = tail.next
        tail.next = list1 or list2  # attach whatever is left
        return dummy.next
```

## Reversing a list

Walk the list and point each node back at the one before it. Three pointers: `prev` (the reversed part), `curr` (the node being flipped), and `next` (saved so the rest isn't lost).

```diagram
Reverse
```

```python title="206. Reverse Linked List"
class Solution:
    def reverseList(self, head):
        prev, curr = None, head
        while curr:
            nxt = curr.next     # 1. save the rest of the list
            curr.next = prev    # 2. flip this node's arrow
            prev = curr         # 3. step both pointers forward
            curr = nxt
        return prev             # the old tail is the new head
```

Reversal is a building block. Palindrome Linked List (234) reverses the second half and compares. Reorder List (143) finds the middle, reverses the second half, then weaves the two halves together. Reverse Nodes in k-Group (25) reverses one chunk at a time.

## Fast and slow pointers

Move `slow` one step and `fast` two steps per turn. When fast hits the end, slow is at the middle.

```diagram
Middle
```

```python title="876. Middle of the Linked List"
class Solution:
    def middleNode(self, head):
        slow = fast = head
        while fast and fast.next:      # fast needs two steps of room
            slow = slow.next
            fast = fast.next.next
        return slow                    # for even lengths, this is the second middle
```

The same two runners detect a **cycle**: if there's a loop, fast eventually laps slow.

```diagram
Cycle
```

```python title="141. Linked List Cycle"
class Solution:
    def hasCycle(self, head) -> bool:
        slow = fast = head
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
            if slow is fast:           # same NODE, not just the same value
                return True
        return False                   # fast reached the end: no loop
```

To find **where** the cycle starts (142): after they meet, move one pointer back to the head and step both one at a time. They meet again exactly at the cycle's entrance. (The distance from the head to the entrance equals the distance from the meeting point to the entrance, going around the loop.)

## Keep a gap between two pointers

To find the n-th node from the end in one pass, give `fast` a head start of `n` steps, then move both together.

```diagram
NthFromEnd
```

```python title="19. Remove Nth Node From End of List"
class Solution:
    def removeNthFromEnd(self, head, n: int):
        dummy = ListNode(0, head)      # in case the head is the one removed
        slow = fast = dummy
        for _ in range(n):
            fast = fast.next           # open a gap of n nodes
        while fast.next:               # stop with fast on the LAST node
            slow = slow.next
            fast = fast.next
        slow.next = slow.next.next     # slow is right before the target: skip over it
        return dummy.next
```

## Linked lists inside designs

A **doubly linked list** plus a hash map gives O(1) "move this item to the front" and "drop the oldest item", which is exactly an LRU cache.

```python title="146. LRU Cache"
class Node:
    def __init__(self, key=0, val=0):
        self.key, self.val = key, val
        self.prev = self.next = None

class LRUCache:
    def __init__(self, capacity: int):
        self.cap = capacity
        self.map = {}                          # key -> node
        self.head, self.tail = Node(), Node()  # dummies: most recent after head, oldest before tail
        self.head.next, self.tail.prev = self.tail, self.head

    def _remove(self, node):
        node.prev.next, node.next.prev = node.next, node.prev

    def _add_front(self, node):
        node.prev, node.next = self.head, self.head.next
        self.head.next.prev = node
        self.head.next = node

    def get(self, key: int) -> int:
        if key not in self.map:
            return -1
        node = self.map[key]
        self._remove(node)                     # used just now: move to the front
        self._add_front(node)
        return node.val

    def put(self, key: int, value: int) -> None:
        if key in self.map:
            self._remove(self.map[key])
        node = Node(key, value)
        self.map[key] = node
        self._add_front(node)
        if len(self.map) > self.cap:
            oldest = self.tail.prev            # least recently used sits before the tail dummy
            self._remove(oldest)
            del self.map[oldest.key]
```

In Python, `collections.OrderedDict` with `move_to_end` does the same in a few lines, but interviewers usually want to see the linked list.

## Common mistakes

1. Overwriting `curr.next` before saving it, which loses the rest of the list.
2. Checking `fast.next.next` without first checking `fast` and `fast.next`.
3. Returning `head` after the head changed (use a dummy and return `dummy.next`).
4. Comparing values instead of nodes (`slow is fast`) in cycle detection.

## Practice

```problems
206 | Reverse Linked List | reverse-linked-list | Easy | prev, curr, next
21 | Merge Two Sorted Lists | merge-two-sorted-lists | Easy | dummy + tail
876 | Middle of the Linked List | middle-of-the-linked-list | Easy | fast and slow
141 | Linked List Cycle | linked-list-cycle | Easy | fast laps slow
234 | Palindrome Linked List | palindrome-linked-list | Easy | middle + reverse half
19 | Remove Nth Node From End of List | remove-nth-node-from-end-of-list | Medium | gap of n
143 | Reorder List | reorder-list | Medium | middle, reverse, weave
2 | Add Two Numbers | add-two-numbers | Medium | carry + dummy
142 | Linked List Cycle II | linked-list-cycle-ii | Medium | where the cycle starts
146 | LRU Cache | lru-cache | Medium | hash map + doubly linked list
23 | Merge k Sorted Lists | merge-k-sorted-lists | Hard | heap of heads
25 | Reverse Nodes in k-Group | reverse-nodes-in-k-group | Hard | reverse one chunk at a time
```
