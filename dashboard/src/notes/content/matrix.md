## The idea

A matrix is a list of rows: `grid[r][c]` is row `r`, column `c`. Row numbers go down, column numbers go right, and `(0, 0)` is the top left corner. Most matrix problems are one of three things:

1. **Walking the grid in a special order** (spiral, diagonals, layers).
2. **Transforming it in place** (rotate, set zeroes, game of life).
3. **Treating it as a graph** where each cell connects to its neighbours (islands, shortest path). Those live in the [DFS](#/notes/dfs) and [BFS](#/notes/bfs) notes.

## Setup I'll write every time

```python
rows, cols = len(grid), len(grid[0])
DIRS = [(-1, 0), (1, 0), (0, -1), (0, 1)]     # up, down, left, right

def inside(r, c):
    return 0 <= r < rows and 0 <= c < cols

for dr, dc in DIRS:
    nr, nc = r + dr, c + dc
    if inside(nr, nc):
        ...                                    # look at the neighbour
```

```diagram
Neighbors
```

Add `(-1, -1), (-1, 1), (1, -1), (1, 1)` to `DIRS` when diagonal neighbours count too (Game of Life uses all 8).

## Diagonals have a key

```diagram
Diagonals
```

This is how N-Queens checks "is this diagonal already attacked?" in O(1): keep sets of used `r - c` and `r + c` values.

## Pattern 1: shrinking boundaries (spiral order)

Keep four walls and walk just inside them. After finishing a side, move that wall inward. The two `if` checks stop me from walking the same row or column twice when the matrix isn't square.

```diagram
Spiral
```

```python title="54. Spiral Matrix"
class Solution:
    def spiralOrder(self, matrix: list[list[int]]) -> list[int]:
        res = []
        top, bottom = 0, len(matrix) - 1
        left, right = 0, len(matrix[0]) - 1
        while top <= bottom and left <= right:
            for c in range(left, right + 1):          # top row, left to right
                res.append(matrix[top][c])
            top += 1
            for r in range(top, bottom + 1):          # right column, top to bottom
                res.append(matrix[r][right])
            right -= 1
            if top <= bottom:                         # a row is still left
                for c in range(right, left - 1, -1):  # bottom row, right to left
                    res.append(matrix[bottom][c])
                bottom -= 1
            if left <= right:                         # a column is still left
                for r in range(bottom, top - 1, -1):  # left column, bottom to top
                    res.append(matrix[r][left])
                left += 1
        return res
```

## Pattern 2: rotate with transpose and reverse

```diagram
Rotate
```

```python title="48. Rotate Image"
class Solution:
    def rotate(self, matrix: list[list[int]]) -> None:
        n = len(matrix)
        for r in range(n):
            for c in range(r + 1, n):                 # only above the diagonal, or I swap twice
                matrix[r][c], matrix[c][r] = matrix[c][r], matrix[r][c]
        for row in matrix:
            row.reverse()
```

Counterclockwise is the mirror image: transpose, then reverse each **column** (or reverse the rows first, then transpose).

## Pattern 3: use the matrix as its own scratch space

Set Matrix Zeroes wants O(1) extra space. The trick is to store the markers in the first row and first column: `matrix[0][c] = 0` means "zero out column c later". The first row and column need one extra flag each, because they're being used as markers.

```python title="73. Set Matrix Zeroes"
class Solution:
    def setZeroes(self, matrix: list[list[int]]) -> None:
        rows, cols = len(matrix), len(matrix[0])
        first_row_zero = any(matrix[0][c] == 0 for c in range(cols))
        first_col_zero = any(matrix[r][0] == 0 for r in range(rows))

        # 1. record zeros in the first row and column
        for r in range(1, rows):
            for c in range(1, cols):
                if matrix[r][c] == 0:
                    matrix[r][0] = 0
                    matrix[0][c] = 0

        # 2. zero the inner cells using those markers
        for r in range(1, rows):
            for c in range(1, cols):
                if matrix[r][0] == 0 or matrix[0][c] == 0:
                    matrix[r][c] = 0

        # 3. finally the first row and column themselves
        if first_row_zero:
            for c in range(cols):
                matrix[0][c] = 0
        if first_col_zero:
            for r in range(rows):
                matrix[r][0] = 0
```

Game of Life (289) uses the same idea with extra states: encode "was alive, now dead" as 2 and "was dead, now alive" as 3 so I can still read the old value while writing the new one.

## Pattern 4: sorted matrices

If every row and every column is sorted, start at the **top right** corner. Going left makes values smaller, going down makes them bigger, so each comparison throws away a whole row or column: O(rows + cols).

```python title="240. Search a 2D Matrix II"
class Solution:
    def searchMatrix(self, matrix: list[list[int]], target: int) -> bool:
        r, c = 0, len(matrix[0]) - 1          # top right corner
        while r < len(matrix) and c >= 0:
            if matrix[r][c] == target:
                return True
            if matrix[r][c] > target:
                c -= 1                         # everything below in this column is even bigger
            else:
                r += 1                         # everything left in this row is even smaller
        return False
```

If the whole matrix reads as one sorted list row after row (Search a 2D Matrix, 74), binary search it directly with `mid // cols` and `mid % cols` as the row and column.

## Common mistakes

1. Mixing up `rows` and `cols` in loops for non square grids.
2. Building a 2D list with `[[0] * cols] * rows` (every row is the same list).
3. Transposing the whole matrix instead of just above the diagonal, which swaps everything back.
4. Changing cells while I still need their old values (use markers or a copy).

## Practice

```problems
1572 | Matrix Diagonal Sum | matrix-diagonal-sum | Easy | r == c and r + c == n - 1
54 | Spiral Matrix | spiral-matrix | Medium | four shrinking walls
48 | Rotate Image | rotate-image | Medium | transpose, then reverse rows
73 | Set Matrix Zeroes | set-matrix-zeroes | Medium | first row and column as markers
36 | Valid Sudoku | valid-sudoku | Medium | sets per row, column, and box
289 | Game of Life | game-of-life | Medium | encode old and new state together
74 | Search a 2D Matrix | search-a-2d-matrix | Medium | binary search as one list
240 | Search a 2D Matrix II | search-a-2d-matrix-ii | Medium | staircase from the top right
```
