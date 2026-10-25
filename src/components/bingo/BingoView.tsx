import { useState } from 'react'
import {
  Check,
  Grid3X3,
  Pencil,
  Play,
  Plus,
  RotateCw,
  Trash2
} from 'lucide-react'
import { useAuth } from '../../contexts/useAuth'
import { useBingo } from '../../hooks/useBingo'
import { countBingos, nameInitial } from '../../lib/bingo'
import { BingoDialog } from './BingoDialog'
import { ActionsMenu } from '../ActionsMenu'

const iconButtonClass =
  'flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-card text-text-soft hover:text-text disabled:opacity-50'

export function BingoView() {
  const { user, profile, partnerProfile } = useAuth()
  const bingo = useBingo()
  const [mode, setMode] = useState<'play' | 'edit'>('play')
  const [dialog, setDialog] = useState<{
    kind: 'create' | 'rename' | 'cell' | 'delete'
    id?: string
    value?: string
  } | null>(null)
  const players = [
    {
      id: user!.id,
      name: profile?.display_name || 'You',
      badge: 'bg-accent-soft text-text border-accent',
      own: true
    },
    {
      id: partnerProfile!.id,
      name: partnerProfile?.display_name || 'Partner',
      badge: 'bg-success text-success-text border-success-text',
      own: false
    }
  ]

  return (
    <div className='space-y-4 pb-24 animate-fade-in'>
      <div className='flex items-center justify-between gap-2'>
        <h2 className='flex shrink-0 items-center gap-2 text-lg font-bold'>
          <Grid3X3 size={20} className='text-accent' />
          Bingo
        </h2>
        {!bingo.loading && bingo.activeBoard && (
          <div
            className='flex shrink-0 rounded-lg border border-border bg-input p-1'
            role='group'
            aria-label='Bingo mode'
          >
            {(['play', 'edit'] as const).map((option) => (
              <button
                key={option}
                type='button'
                title={option === 'play' ? 'Play' : 'Edit'}
                aria-label={option === 'play' ? 'Play' : 'Edit'}
                disabled={bingo.busy}
                aria-pressed={mode === option}
                className={`flex min-h-9 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-sm font-medium ${mode === option ? 'bg-card text-accent shadow-sm' : 'text-text-soft'}`}
                onClick={() => setMode(option)}
              >
                {option === 'play' ? <Play size={14} /> : <Pencil size={14} />}
                <span className='hidden min-[390px]:inline'>
                  {option === 'play' ? 'Play' : 'Edit'}
                </span>
              </button>
            ))}
          </div>
        )}
        <button
          type='button'
          title='New bingo'
          aria-label='New bingo'
          disabled={bingo.loading || bingo.busy}
          className={iconButtonClass}
          onClick={() => setDialog({ kind: 'create' })}
        >
          <Plus size={20} />
        </button>
      </div>

      {bingo.error && (
        <div
          role='alert'
          className='flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-500'
        >
          <span className='min-w-0 flex-1 break-words'>{bingo.error}</span>
          <button
            type='button'
            title='Retry'
            aria-label='Retry loading Bingo'
            disabled={bingo.busy}
            onClick={bingo.retry}
            className='flex size-10 shrink-0 cursor-pointer items-center justify-center'
          >
            <RotateCw size={18} />
          </button>
        </div>
      )}

      {bingo.loading ? (
        <p role='status' className='py-8 text-center text-sm text-text-soft'>
          Loading bingo...
        </p>
      ) : !bingo.activeBoard ? (
        <div className='space-y-4 border-y border-border py-8 text-center'>
          <Grid3X3 size={40} className='mx-auto text-accent' />
          <h3 className='font-medium'>
            {bingo.error ? 'Bingo is unavailable' : 'Your first bingo'}
          </h3>
          {!bingo.error && (
            <button
              type='button'
              onClick={() => setDialog({ kind: 'create' })}
              className='mx-auto flex cursor-pointer items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white'
            >
              <Plus size={16} />
              New bingo
            </button>
          )}
        </div>
      ) : (
        <>
          <div
            className='hide-scrollbar flex items-center gap-2 overflow-x-auto pb-1'
            aria-label='Bingo boards'
          >
            {bingo.boards.map((board) => (
              <div
                key={board.id}
                className={`flex max-w-[60vw] shrink-0 items-center rounded-full border text-sm font-medium ${board.id === bingo.activeBoard?.id ? 'border-active-border bg-active-bg text-accent' : 'border-border bg-card text-text-soft'}`}
              >
                <button
                  type='button'
                  title={board.name}
                  disabled={bingo.busy}
                  aria-pressed={board.id === bingo.activeBoard?.id}
                  className='min-w-0 cursor-pointer truncate rounded-full px-4 py-2 disabled:opacity-50'
                  onClick={() => {
                    bingo.selectBoard(board.id)
                    setMode('play')
                  }}
                >
                  {board.name}
                </button>
                {board.id === bingo.activeBoard?.id && (
                  <ActionsMenu
                    label={`Bingo options for ${board.name}`}
                    disabled={bingo.busy}
                    items={[
                      {
                        label: 'Rename',
                        icon: Pencil,
                        onSelect: () =>
                          setDialog({
                            kind: 'rename',
                            id: board.id,
                            value: board.name
                          })
                      },
                      {
                        label: 'Delete',
                        icon: Trash2,
                        destructive: true,
                        onSelect: () =>
                          setDialog({
                            kind: 'delete',
                            id: board.id,
                            value: board.name
                          })
                      }
                    ]}
                  />
                )}
              </div>
            ))}
          </div>
          <div
            className='grid grid-cols-2 gap-3 border-y border-border py-3'
            aria-live='polite'
          >
            {players.map((player) => {
              const count = countBingos(bingo.cells, bingo.marks, player.id)
              return (
                <div
                  key={player.id}
                  className='flex min-w-0 items-center gap-2'
                >
                  <span
                    aria-hidden='true'
                    className={`flex size-7 shrink-0 items-center justify-center border text-xs font-bold ${player.own ? 'rounded-full' : 'rounded-sm'} ${player.badge}`}
                  >
                    {nameInitial(player.name)}
                  </span>
                  <div className='min-w-0 text-xs'>
                    <p className='truncate font-medium' title={player.name}>
                      {player.name}
                      {player.own ? ' (you)' : ''}
                    </p>
                    <p className='text-text-soft'>
                      {count} {count === 1 ? 'bingo' : 'bingos'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
          <div
            className='grid grid-cols-5 gap-1.5'
            role='group'
            aria-label={`${bingo.activeBoard.name} bingo board`}
            aria-busy={bingo.busy}
          >
            {bingo.cells.map((cell) => {
              const completed = players.map((player) =>
                bingo.marks.some(
                  (mark) =>
                    mark.cell_id === cell.id &&
                    mark.user_id === player.id &&
                    mark.completed
                )
              )
              const hasMarks = completed.some(Boolean)
              const label = cell.text || `Empty cell ${cell.position + 1}`
              return (
                <button
                  key={cell.id}
                  type='button'
                  title={label}
                  aria-label={`${label}. ${players.map((player, index) => `${player.name}: ${completed[index] ? 'completed' : 'not completed'}`).join('. ')}. ${mode === 'edit' ? 'Edit item' : 'Toggle your checkmark'}`}
                  aria-pressed={mode === 'play' ? completed[0] : undefined}
                  disabled={bingo.busy || (mode === 'play' && !cell.text)}
                  className={`relative flex aspect-[4/5] min-w-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border p-1 text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-default ${completed[0] ? 'border-accent bg-accent-soft' : completed[1] ? 'border-success-text bg-success' : 'border-border bg-card'} ${mode === 'edit' ? 'hover:border-accent' : ''}`}
                  onClick={() => {
                    if (mode === 'edit')
                      setDialog({ kind: 'cell', id: cell.id, value: cell.text })
                    else void bingo.toggleCell(cell)
                  }}
                >
                  <span className='flex min-h-0 w-full items-center justify-center overflow-hidden'>
                    {cell.text ? (
                      <span
                        className={`w-full text-[11px] leading-tight font-medium [overflow-wrap:anywhere] ${hasMarks ? 'line-clamp-1 min-[390px]:line-clamp-2 min-[440px]:line-clamp-3' : 'line-clamp-3'}`}
                      >
                        {cell.text}
                      </span>
                    ) : mode === 'edit' ? (
                      <Plus
                        size={16}
                        aria-hidden='true'
                        className='text-text-soft'
                      />
                    ) : null}
                  </span>
                  {hasMarks && (
                    <span
                      className='absolute inset-x-1 bottom-1 flex h-4 items-center justify-center gap-0.5'
                      aria-hidden='true'
                    >
                      {players.map(
                        (player, index) =>
                          completed[index] && (
                            <span
                              key={player.id}
                              className={`flex size-4 items-center justify-center border text-[9px] font-bold ${player.own ? 'rounded-full' : 'rounded-sm'} ${player.badge}`}
                            >
                              {nameInitial(player.name)}
                            </span>
                          )
                      )}
                      {mode === 'play' && completed[0] && !completed[1] && (
                        <Check size={10} className='text-text' />
                      )}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          <div
            role='status'
            className='min-h-4 text-right text-xs text-text-soft'
          >
            {bingo.busy ? 'Saving...' : ''}
          </div>
        </>
      )}
      {dialog && (
        <BingoDialog
          key={`${dialog.kind}-${dialog.id ?? 'new'}`}
          kind={dialog.kind}
          initialValue={dialog.value}
          onClose={() => setDialog(null)}
          onSave={async (value) => {
            if (dialog.kind === 'create') {
              const saved = await bingo.createBoard(value)
              if (saved) setMode('edit')
              return saved
            }
            if (dialog.kind === 'rename')
              return bingo.renameBoard(dialog.id!, value)
            if (dialog.kind === 'delete') {
              const saved = await bingo.deleteBoard(dialog.id!)
              if (saved) setMode('play')
              return saved
            }
            return bingo.saveCell(dialog.id!, value)
          }}
        />
      )}
    </div>
  )
}
