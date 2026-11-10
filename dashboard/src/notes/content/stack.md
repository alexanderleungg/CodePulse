## The idea

A stack is last in, first out: I only ever touch the **top**. In Python a plain list is a stack. `append` pushes, `pop()` pops, `stack[-1]` peeks, and all three are O(1).

Reach for a stack when the **most recent unfinished thing** is the one that matters next:

- a closing bracket must match the most recent unmatched opener
- an operator applies to the two most recent values
- a nested structure (`3[a2[c]]`, a folder path, a function call) finishes its innermost part first
- "undo" reverses the most recent action

```python
stack = []
stack.append(x)      # push
top = stack[-1]      # peek (check `if stack` first!)
x = stack.pop()      # pop
if not stack: ...    # empty check
```

## Pattern 1: matching pairs

Push every opener. On a closer, the top of the stack must be its partner.

```diagram
Parentheses
```

```python title="20. Valid Parentheses"
class Solution:
    def isValid(self, s: str) -> bool:
        partner = {")": "(", "]": "[", "}": "{"}
        stack = []
        for ch in s:
            if ch not in partner:           # an opener: remember it
                stack.append(ch)
            elif stack and stack[-1] == partner[ch]:
                stack.pop()                 # closes the most recent opener
            else:
                return False                # wrong closer, or nothing to close
        return not stack                    # leftover openers were never closed
```

The same "push, then cancel with the top" idea handles Remove All Adjacent Duplicates In String (1047), Backspace String Compare (844), and Asteroid Collision (735).

## Pattern 2: remember extra info at each level

A stack can store more than raw values. Min Stack stores the minimum so far next to each value, so it never has to search.

```diagram
MinStack
```

```python title="155. Min Stack"
class MinStack:
    def __init__(self):
        self.stack = []                     # pairs of (value, min of everything at or below)

    def push(self, val: int) -> None:
        current_min = min(val, self.stack[-1][1]) if self.stack else val
        self.stack.append((val, current_min))

    def pop(self) -> None:
        self.stack.pop()

    def top(self) -> int:
        return self.stack[-1][0]

    def getMin(self) -> int:
        return self.stack[-1][1]
```

## Pattern 3: evaluating expressions

In Reverse Polish Notation the operator comes after its two operands. Numbers wait on the stack until an operator uses them.

```diagram
RPN
```

```python title="150. Evaluate Reverse Polish Notation"
class Solution:
    def evalRPN(self, tokens: list[str]) -> int:
        stack = []
        for t in tokens:
            if t in "+-*/":
                b = stack.pop()             # the SECOND operand is on top
                a = stack.pop()
                if t == "+": stack.append(a + b)
                elif t == "-": stack.append(a - b)
                elif t == "*": stack.append(a * b)
                else: stack.append(int(a / b))   # truncate toward zero, not floor
            else:
                stack.append(int(t))
        return stack[0]
```

> **Tip:** The pop order matters for `-` and `/`. The top of the stack is the right hand operand.

## Pattern 4: nesting

When input nests, push the **outer context** when I enter a level and pop it when the level ends. Decode String (`3[a2[c]]` becomes `accaccacc`) saves the string built so far and the repeat count on every `[`.

```python title="394. Decode String"
class Solution:
    def decodeString(self, s: str) -> str:
        stack = []                 # (string before this bracket, repeat count)
        current = ""
        num = 0
        for ch in s:
            if ch.isdigit():
                num = num * 10 + int(ch)          # numbers can have several digits
            elif ch == "[":
                stack.append((current, num))      # save the outer level
                current, num = "", 0              # start fresh inside
            elif ch == "]":
                before, k = stack.pop()
                current = before + current * k    # finish this level, glue it back on
            else:
                current += ch
        return current
```

Simplify Path (71) is the gentle version: split on `/`, push folder names, pop on `..`, ignore `.` and empty pieces.

## Stacks and recursion

Every recursive function runs on the **call stack**. Anything recursive can be rewritten with my own stack, which is how iterative DFS and iterative tree traversals work. See the [Recursion](#/notes/recursion) and [DFS](#/notes/dfs) notes.

When a problem asks for "the next greater" or "the previous smaller" element, the stack needs to stay **sorted**. That special case has its own page: [Monotonic Stack](#/notes/monotonic-stack).

## Practice

```problems
20 | Valid Parentheses | valid-parentheses | Easy | matching pairs
682 | Baseball Game | baseball-game | Easy | push, pop, peek
1047 | Remove All Adjacent Duplicates In String | remove-all-adjacent-duplicates-in-string | Easy | cancel with the top
232 | Implement Queue using Stacks | implement-queue-using-stacks | Easy | two stacks
155 | Min Stack | min-stack | Medium | store the min at each level
150 | Evaluate Reverse Polish Notation | evaluate-reverse-polish-notation | Medium | operands wait on the stack
71 | Simplify Path | simplify-path | Medium | folders in, .. out
394 | Decode String | decode-string | Medium | save the outer level on [
735 | Asteroid Collision | asteroid-collision | Medium | collisions with the top
```
