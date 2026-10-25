import { useState } from 'react'
import type { EventDraft } from '../../lib/trip/types'
import { useTripPlanner } from '../../hooks/useTripPlanner'
import { DayPlanner } from './DayPlanner'
import { EventEditor } from './EventEditor'
import { PlannerHeader } from './PlannerHeader'
import { TripDialog } from './TripDialog'
import { TripPills } from './TripPills'

const secondaryButtonClass =
  'cursor-pointer rounded-xl border border-border bg-input px-4 py-2.5 text-sm font-medium text-text transition-colors hover:bg-muted'
const cardClass =
  'space-y-3 rounded-3xl border border-border-accent bg-card p-6'

export function TripPlanner() {
  const {
    trips,
    activeTripId,
    planner,
    loading,
    error,
    selectTrip,
    createTrip,
    renameTrip,
    deleteTrip,
    saveEvent,
    deleteEvent,
    updateRange,
    retry
  } = useTripPlanner()
  const activeTrip = trips.find((trip) => trip.id === activeTripId)
  const [editor, setEditor] = useState<{
    draft: EventDraft
    id?: string
  } | null>(null)
  const [tripDialog, setTripDialog] = useState<
    'create' | 'rename' | 'dates' | null
  >(null)
  const hidden =
    planner?.events.filter(
      (event) => event.date < planner.startDate || event.date > planner.endDate
    ).length ?? 0

  function renderPlanner() {
    if (!planner) {
      return error ? (
        <section className={cardClass}>
          <h3 className='font-medium text-text'>
            This trip could not be loaded
          </h3>
          <button className={secondaryButtonClass} onClick={retry}>
            Retry loading
          </button>
        </section>
      ) : (
        <p className='py-8 text-center text-sm text-text-soft'>
          Loading trip...
        </p>
      )
    }

    return (
      <>
        <PlannerHeader
          startDate={planner.startDate}
          endDate={planner.endDate}
        />
        <div className='space-y-1 px-1 text-xs text-text-soft'>
          <p>
            Tap an empty hour to add an event. Drag to move; pull the top or
            bottom edge to resize.
          </p>
          {planner.events.length === 0 && (
            <p className='text-accent'>
              Your days, your pace. Start with one event.
            </p>
          )}
        </div>
        {hidden > 0 && (
          <p
            className='rounded-2xl border border-border bg-card px-4 py-3 text-sm text-text-soft'
            role='status'
          >
            {hidden} {hidden === 1 ? 'event is' : 'events are'} outside the
            displayed dates, still saved. Extend the trip dates to see{' '}
            {hidden === 1 ? 'it' : 'them'} again.
          </p>
        )}
        <DayPlanner
          planner={planner}
          onAdd={(draft) => setEditor({ draft })}
          onEdit={(event) => setEditor({ draft: event, id: event.id })}
          onCommit={(event) => {
            saveEvent(event, event.id)
          }}
        />
        <p className='text-center text-[11px] text-text-soft'>
          Local times · Overlaps welcome · Tap an event to edit its details
        </p>
        {editor && (
          <EventEditor
            draft={editor.draft}
            id={editor.id}
            startDate={planner.startDate}
            endDate={planner.endDate}
            onSave={saveEvent}
            onDelete={deleteEvent}
            onClose={() => setEditor(null)}
          />
        )}
      </>
    )
  }

  return (
    <div className='space-y-4 animate-fade-in'>
      <div className='flex items-end justify-between gap-3 px-1'>
        <div>
          <p className='text-[11px] font-medium uppercase tracking-wider text-text-soft'>
            Make room for the good things
          </p>
          <h2 className='text-lg font-bold text-text'>Trip Planner</h2>
        </div>
        <span className='text-xs text-text-soft'>Shared with your partner</span>
      </div>

      {error && (
        <div
          className='rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-500'
          role='alert'
        >
          {error}
        </div>
      )}

      {loading ? (
        <p className='py-8 text-center text-sm text-text-soft'>
          Loading trips...
        </p>
      ) : trips.length === 0 ? (
        <section className={cardClass}>
          {error ? (
            <>
              <h3 className='font-medium text-text'>
                Your trips could not be loaded
              </h3>
              <p className='text-sm text-text-soft'>
                Check your connection and try again.
              </p>
              <button className={secondaryButtonClass} onClick={retry}>
                Retry loading
              </button>
            </>
          ) : (
            <>
              <h3 className='font-medium text-text'>Plan your first trip</h3>
              <p className='text-sm text-text-soft'>
                Trips are shared with your partner, so you can plan together.
              </p>
              <button
                className='cursor-pointer rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover'
                onClick={() => setTripDialog('create')}
              >
                New trip
              </button>
            </>
          )}
        </section>
      ) : (
        <>
          <TripPills
            trips={trips}
            activeId={activeTripId}
            onSelect={selectTrip}
            onNew={() => setTripDialog('create')}
            onRename={() => setTripDialog('rename')}
            onAdjustDates={() => setTripDialog('dates')}
            onDelete={deleteTrip}
          />
          {renderPlanner()}
        </>
      )}

      {tripDialog && (
        <TripDialog
          key={`${tripDialog}_${activeTripId}`}
          mode={tripDialog}
          initialName={tripDialog !== 'create' ? activeTrip?.name : ''}
          initialStartDate={
            tripDialog !== 'create' ? activeTrip?.startDate : undefined
          }
          initialEndDate={
            tripDialog !== 'create' ? activeTrip?.endDate : undefined
          }
          onCreate={createTrip}
          onRename={renameTrip}
          onAdjustDates={updateRange}
          onClose={() => setTripDialog(null)}
        />
      )}

      <div className='h-20' />
    </div>
  )
}
