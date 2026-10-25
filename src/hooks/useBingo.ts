import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/useAuth'
import type { BingoBoard, BingoCell, BingoMark } from '../lib/bingo'
import {
  createBingoBoard,
  deleteBingoBoard,
  fetchBingo,
  renameBingoBoard,
  saveBingoCell,
  setBingoMark
} from '../lib/db'
import { errorMessage } from '../lib/errors'
import { get, set } from '../lib/storage'
import { supabase } from '../lib/supabase'

export function useBingo() {
  const { user } = useAuth()
  const [data, setData] = useState<{
    boards: BingoBoard[]
    cells: BingoCell[]
    marks: BingoMark[]
  }>({ boards: [], cells: [], marks: [] })
  const [preferredId, setPreferredId] = useState<string | null>(() =>
    get<string>('active-bingo')
  )
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reload, setReload] = useState(0)
  const pending = useRef(false)
  const activeBoard =
    data.boards.find((board) => board.id === preferredId) ??
    data.boards[0] ??
    null

  useEffect(() => {
    let cancelled = false
    fetchBingo()
      .then((result) => {
        if (!cancelled && !pending.current) {
          setData(result)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(`Could not load Bingo. ${errorMessage(err)}`)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [reload])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const refresh = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        if (!pending.current) setReload((value) => value + 1)
      }, 100)
    }
    const channel = supabase
      .channel('bingo')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bingo_boards' },
        refresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bingo_cells' },
        refresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bingo_marks' },
        refresh
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') refresh()
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setError('Live updates disconnected. Retry to reload your boards.')
        }
      })
    return () => {
      clearTimeout(timer)
      supabase.removeChannel(channel)
    }
  }, [])

  function selectBoard(id: string) {
    setPreferredId(id)
    set('active-bingo', id)
  }

  async function mutate(
    action: string,
    optimistic: () => void,
    write: () => Promise<void>
  ) {
    if (pending.current) return false
    pending.current = true
    setBusy(true)
    setError(null)
    const previous = data
    optimistic()
    try {
      await write()
      return true
    } catch (err: unknown) {
      setData(previous)
      setError(`Could not ${action}. ${errorMessage(err)}`)
      return false
    } finally {
      pending.current = false
      setBusy(false)
      setReload((value) => value + 1)
    }
  }

  async function createBoard(name: string) {
    const trimmed = name.trim()
    if (!user || !trimmed || trimmed.length > 60) return false
    const board = { id: crypto.randomUUID(), name: trimmed }
    const cells = Array.from({ length: 25 }, (_, position) => ({
      id: crypto.randomUUID(),
      board_id: board.id,
      position,
      text: ''
    }))
    const saved = await mutate(
      'create the board',
      () => {
        setData((previous) => ({
          ...previous,
          boards: [...previous.boards, board],
          cells: [...previous.cells, ...cells]
        }))
        selectBoard(board.id)
      },
      () =>
        createBingoBoard(
          board.id,
          trimmed,
          cells.map((cell) => cell.id)
        )
    )
    return saved
  }

  function renameBoard(id: string, name: string) {
    const trimmed = name.trim()
    if (!trimmed || trimmed.length > 60) return Promise.resolve(false)
    return mutate(
      'rename the board',
      () => {
        setData((previous) => ({
          ...previous,
          boards: previous.boards.map((board) =>
            board.id === id ? { ...board, name: trimmed } : board
          )
        }))
      },
      () => renameBingoBoard(id, trimmed)
    )
  }

  function deleteBoard(id: string) {
    return mutate(
      'delete the board',
      () => {
        setData((previous) => ({
          ...previous,
          boards: previous.boards.filter((board) => board.id !== id)
        }))
      },
      () => deleteBingoBoard(id)
    )
  }

  function saveCell(id: string, text: string) {
    const trimmed = text.trim()
    if (trimmed.length > 200) return Promise.resolve(false)
    return mutate(
      'save the item',
      () => {
        setData((previous) => ({
          ...previous,
          cells: previous.cells.map((cell) =>
            cell.id === id ? { ...cell, text: trimmed } : cell
          ),
          marks: previous.marks.map((mark) =>
            !trimmed && mark.cell_id === id
              ? { ...mark, completed: false }
              : mark
          )
        }))
      },
      () => saveBingoCell(id, trimmed)
    )
  }

  function toggleCell(cell: BingoCell) {
    if (!user || !cell.text) return
    const existing = data.marks.find(
      (mark) => mark.cell_id === cell.id && mark.user_id === user.id
    )
    const mark: BingoMark = {
      id: existing?.id ?? crypto.randomUUID(),
      cell_id: cell.id,
      user_id: user.id,
      completed: !existing?.completed
    }
    return mutate(
      'save your checkmark',
      () => {
        setData((previous) => ({
          ...previous,
          marks: [
            ...previous.marks.filter(
              (item) => item.cell_id !== cell.id || item.user_id !== user.id
            ),
            mark
          ]
        }))
      },
      () => setBingoMark(cell.id, mark.completed)
    )
  }

  return {
    boards: data.boards,
    activeBoard,
    cells: data.cells
      .filter((cell) => cell.board_id === activeBoard?.id)
      .sort((first, second) => first.position - second.position),
    marks: data.marks,
    loading,
    busy,
    error,
    selectBoard,
    createBoard,
    renameBoard,
    deleteBoard,
    saveCell,
    toggleCell,
    retry: () => {
      setError(null)
      setReload((value) => value + 1)
    }
  }
}
