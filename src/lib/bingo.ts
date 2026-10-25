export interface BingoBoard {
  id: string
  name: string
}

export interface BingoCell {
  id: string
  board_id: string
  position: number
  text: string
}

export interface BingoMark {
  id: string
  cell_id: string
  user_id: string
  completed: boolean
}

export function countBingos(
  cells: BingoCell[],
  marks: BingoMark[],
  userId: string
) {
  const completedIds = new Set(
    marks
      .filter((mark) => mark.user_id === userId && mark.completed)
      .map((mark) => mark.cell_id)
  )
  const positions = new Set(
    cells
      .filter((cell) => cell.text.trim() && completedIds.has(cell.id))
      .map((cell) => cell.position)
  )
  const lines = Array.from({ length: 5 }, (_, index) => [
    Array.from({ length: 5 }, (_, column) => index * 5 + column),
    Array.from({ length: 5 }, (_, row) => row * 5 + index)
  ]).flat()
  lines.push([0, 6, 12, 18, 24], [4, 8, 12, 16, 20])
  return lines.filter((line) =>
    line.every((position) => positions.has(position))
  ).length
}

export function nameInitial(name: string) {
  return Array.from(name.trim())[0]?.toLocaleUpperCase() ?? '?'
}
