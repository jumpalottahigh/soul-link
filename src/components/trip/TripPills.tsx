import { useState } from 'react'
import { CalendarDays, Pencil, Plus, Trash2 } from 'lucide-react'
import type { Trip } from '../../lib/trip/types'
import { ActionsMenu } from '../ActionsMenu'

interface Props {
  trips: Trip[]
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onRename: () => void
  onAdjustDates: () => void
  onDelete: (id: string) => void
}

function TripActions({
  trip,
  onRename,
  onAdjustDates,
  onDelete
}: Pick<Props, 'onRename' | 'onAdjustDates' | 'onDelete'> & { trip: Trip }) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <ActionsMenu
      label={`Trip options for ${trip.name}`}
      onClose={() => setConfirmDelete(false)}
      items={[
        { label: 'Rename', icon: Pencil, onSelect: onRename },
        {
          label: 'Adjust trip dates',
          icon: CalendarDays,
          onSelect: onAdjustDates
        },
        {
          id: 'delete',
          label: confirmDelete ? 'Delete trip and its events?' : 'Delete',
          icon: Trash2,
          destructive: true,
          keepOpen: !confirmDelete,
          onSelect: () => {
            if (confirmDelete) onDelete(trip.id)
            else setConfirmDelete(true)
          }
        }
      ]}
    />
  )
}

export function TripPills({
  trips,
  activeId,
  onSelect,
  onNew,
  onRename,
  onAdjustDates,
  onDelete
}: Props) {
  return (
    <div className='hide-scrollbar flex items-center gap-2 overflow-x-auto pb-1'>
      {trips.map((trip) => (
        <div
          key={trip.id}
          className={`flex max-w-[60vw] shrink-0 items-center rounded-full border text-sm font-medium transition-colors ${
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
          <button
            type='button'
            aria-pressed={trip.id === activeId}
            onClick={() => onSelect(trip.id)}
            className='min-w-0 cursor-pointer truncate rounded-full px-4 py-1.5'
            title={trip.name}
          >
            {trip.name}
          </button>
          {trip.id === activeId && (
            <TripActions
              trip={trip}
              onRename={onRename}
              onAdjustDates={onAdjustDates}
              onDelete={onDelete}
            />
          )}
        </div>
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
  )
}
