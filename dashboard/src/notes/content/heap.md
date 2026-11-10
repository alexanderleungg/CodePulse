## The idea

A heap answers one question fast: **what's the smallest thing right now?** It's a binary tree where every parent is smaller than (or equal to) its children, so the minimum is always at the root. It doesn't keep everything sorted, just enough to find and remove the minimum quickly.

| Operation | Cost |
|---|---|
| peek the minimum `heap[0]` | O(1) |
| push | O(log n) |
| pop the minimum | O(log n) |
| build from a list, `heapify` | O(n) |

Use a heap whenever I repeatedly need the smallest (or largest) item **while items keep arriving**: top k, merging sorted streams, scheduling by time, Dijkstra.

## How it's stored

```diagram
Layout
```

Because the tree is always complete (filled level by level), it fits in a list with no gaps and no pointers.

## Push and pop

Push adds at the end and **sifts up**. Pop takes the root, moves the last item to the top, and **sifts down**. Each swap moves one level, so both are O(log n).

```diagram
Push
```

```diagram
Pop
```

I won't implement these in an interview. Python's `heapq` does it on a plain list:

```python
import heapq

heap = []
heapq.heappush(heap, 5)
heapq.heappush(heap, 1)
smallest = heap[0]              # peek: 1
smallest = heapq.heappop(heap)  # remove: 1
heapq.heapify(nums)             # turn a list into a heap in place, O(n)
heapq.heappushpop(heap, x)      # push x then pop the min, faster than both
heapq.nlargest(3, nums)         # quick one liners for small k
```

> **Tip:** `heapq` is a **min** heap only. For a max heap, push negated values (`-x`) and negate again when I pop. For objects, push tuples: `(priority, tie_breaker, item)`. The tie breaker (like an index) stops Python from comparing items that can't be compared.

## Pattern 1: top k with a size k heap

To keep the k **largest** items, use a **min** heap of size k. That sounds backwards, but the root is the weakest of my top k, which is exactly the one to compare against and throw out.

```diagram
TopK
```

```python title="215. Kth Largest Element in an Array"
import heapq

class Solution:
    def findKthLargest(self, nums: list[int], k: int) -> int:
        heap = []
        for x in nums:
            heapq.heappush(heap, x)
            if len(heap) > k:
                heapq.heappop(heap)       # drop the smallest: it can't be in the top k
        return heap[0]                    # the smallest of the k largest = the k-th largest
```

Top K Frequent Elements (347) and K Closest Points to Origin (973) are the same thing with a different priority: `(count, num)` or `(-distance, point)`.

## Pattern 2: merge k sorted things

Keep the **front** of each list in a heap. Pop the smallest, then push the next item from the list it came from.

```python title="23. Merge k Sorted Lists"
import heapq

class Solution:
    def mergeKLists(self, lists):
        heap = []
        for i, node in enumerate(lists):
            if node:
                heapq.heappush(heap, (node.val, i, node))   # i breaks ties: nodes can't be compared
        dummy = tail = ListNode()
        while heap:
            _, i, node = heapq.heappop(heap)
            tail.next = node
            tail = node
            if node.next:
                heapq.heappush(heap, (node.next.val, i, node.next))
        return dummy.next
```

With n total nodes and k lists, the heap never holds more than k items: O(n log k).

## Pattern 3: two heaps for a running median

```diagram
TwoHeaps
```

```python title="295. Find Median from Data Stream"
import heapq

class MedianFinder:
    def __init__(self):
        self.small = []    # max heap (stored negated): the smaller half
        self.large = []    # min heap: the larger half

    def addNum(self, num: int) -> None:
        heapq.heappush(self.small, -num)
        # move the biggest small value across, so everything in small <= everything in large
        heapq.heappush(self.large, -heapq.heappop(self.small))
        if len(self.large) > len(self.small):       # keep small the same size or one bigger
            heapq.heappush(self.small, -heapq.heappop(self.large))

    def findMedian(self) -> float:
        if len(self.small) > len(self.large):
            return -self.small[0]
        return (-self.small[0] + self.large[0]) / 2
```

## Pattern 4: always take the best available

Greedy problems often mean "repeatedly take the biggest / cheapest / earliest thing". A heap makes each of those picks O(log n).

```python title="1046. Last Stone Weight"
import heapq

class Solution:
    def lastStoneWeight(self, stones: list[int]) -> int:
        heap = [-s for s in stones]      # negate for a max heap
        heapq.heapify(heap)
        while len(heap) > 1:
            a = -heapq.heappop(heap)     # heaviest
            b = -heapq.heappop(heap)     # second heaviest
            if a != b:
                heapq.heappush(heap, -(a - b))
        return -heap[0] if heap else 0
```

Task Scheduler (621), Reorganize String (767), and IPO (502) follow this shape, and so does Dijkstra's shortest path in the [Graphs](#/notes/graph) note.

## Practice

```problems
703 | Kth Largest Element in a Stream | kth-largest-element-in-a-stream | Easy | size k min heap
1046 | Last Stone Weight | last-stone-weight | Easy | negate for max heap
215 | Kth Largest Element in an Array | kth-largest-element-in-an-array | Medium | top k
347 | Top K Frequent Elements | top-k-frequent-elements | Medium | heap of (count, num)
973 | K Closest Points to Origin | k-closest-points-to-origin | Medium | heap by distance
621 | Task Scheduler | task-scheduler | Medium | most frequent first
767 | Reorganize String | reorganize-string | Medium | two most frequent at a time
23 | Merge k Sorted Lists | merge-k-sorted-lists | Hard | heap of list fronts
295 | Find Median from Data Stream | find-median-from-data-stream | Hard | two heaps
```
