import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import type { Trip } from '../../lib/trip/types'

interface Props {
  trips: Trip[]
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onRename: () => void
  onDelete: (id: string) => void
}

const actionClass =
  'flex cursor-pointer items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-text-soft transition-colors hover:bg-muted hover:text-text'

export function TripPills({
  trips,
  activeId,
  onSelect,
  onNew,
  onRename,
  onDelete
}: Props) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const confirmDelete = confirmingId !== null && confirmingId === activeId

  return (
    <div className='space-y-2'>
      <div className='hide-scrollbar flex gap-2 overflow-x-auto pb-1'>
        {trips.map((trip) => (
          <button
            key={trip.id}
            type='button'
            onClick={() => onSelect(trip.id)}
            className={`max-w-[60vw] shrink-0 cursor-pointer truncate rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              trip.id === activeId
                ? 'border-active-border bg-active-bg text-accent'
                : 'border-border bg-card text-text-soft hover:text-text'
            }`}
            style={
              trip.id === activeId
                ? { boxShadow: 'var(--color-active-shadow)' }
                : undefined
            }
          >
            {trip.name}
          </button>
        ))}
        <button
          type='button'
          onClick={onNew}
          className='flex shrink-0 cursor-pointer items-center gap-1 rounded-full border border-dashed border-border px-3 py-1.5 text-sm font-medium text-accent transition-colors hover:border-accent hover:bg-card'
        >
          <Plus size={14} />
          New trip
        </button>
      </div>
      {activeId && (
        <div className='flex items-center gap-1 px-1'>
          <button type='button' className={actionClass} onClick={onRename}>
            <Pencil size={12} />
            Rename
          </button>
          <button
            type='button'
            className={`${actionClass} ${confirmDelete ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-500' : ''}`}
            onClick={() => {
              if (!confirmDelete) {
                setConfirmingId(activeId)
                return
              }
              setConfirmingId(null)
              onDelete(activeId)
            }}
            onBlur={() => setConfirmingId(null)}
          >
            <Trash2 size={12} />
            {confirmDelete ? 'Delete trip and its events?' : 'Delete'}
          </button>
        </div>
      )}
    </div>
  )
}
