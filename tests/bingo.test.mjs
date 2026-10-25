import assert from 'node:assert/strict'
import test from 'node:test'
import { countBingos, nameInitial } from '../src/lib/bingo.ts'

const cells = Array.from({ length: 25 }, (_, position) => ({
  id: String(position),
  board_id: 'board',
  position,
  text: `Item ${position + 1}`
}))

function marksFor(positions, userId = 'me') {
  return positions.map((position) => ({
    id: `${userId}-${position}`,
    cell_id: String(position),
    user_id: userId,
    completed: true
  }))
}

test('counts each row, column, and diagonal', () => {
  for (let index = 0; index < 5; index++) {
    const row = Array.from({ length: 5 }, (_, column) => index * 5 + column)
    const column = Array.from({ length: 5 }, (_, row) => row * 5 + index)
    assert.equal(countBingos(cells, marksFor(row), 'me'), 1)
    assert.equal(countBingos(cells, marksFor(column), 'me'), 1)
  }
  assert.equal(countBingos(cells, marksFor([0, 6, 12, 18, 24]), 'me'), 1)
  assert.equal(countBingos(cells, marksFor([4, 8, 12, 16, 20]), 'me'), 1)
})

test('counts a full board as twelve bingos', () => {
  assert.equal(
    countBingos(cells, marksFor(cells.map((cell) => cell.position)), 'me'),
    12
  )
})

test('keeps partner progress independent', () => {
  const marks = [...marksFor([0, 1, 2]), ...marksFor([3, 4], 'partner')]
  assert.equal(countBingos(cells, marks, 'me'), 0)
  assert.equal(countBingos(cells, marks, 'partner'), 0)
  assert.equal(
    countBingos(cells, marksFor([0, 1, 2, 3, 4], 'partner'), 'me'),
    0
  )
})

test('does not count empty cells or unchecked marks', () => {
  const marks = marksFor([0, 1, 2, 3, 4])
  assert.equal(
    countBingos(
      cells.map((cell) =>
        cell.position === 2 ? { ...cell, text: ' ' } : cell
      ),
      marks,
      'me'
    ),
    0
  )
  assert.equal(
    countBingos(
      cells,
      marks.map((mark) => ({ ...mark, completed: false })),
      'me'
    ),
    0
  )
  assert.equal(countBingos([], marks, 'me'), 0)
})

test('uses initials with whitespace and empty-name fallbacks', () => {
  assert.equal(nameInitial(' Alex '), 'A')
  assert.equal(nameInitial('avery'), 'A')
  assert.equal(nameInitial(' '), '?')
})
