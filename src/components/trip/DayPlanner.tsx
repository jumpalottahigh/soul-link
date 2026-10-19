import { useCallback, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { EventDraft, Planner, PlannerEvent } from '../../lib/trip/types'
import { addDays, daySpan, formatDay, isWeekend } from '../../lib/trip/dates'
import {
  DAY_WIDTH,
  END_MINUTE,
  HOURS,
  HOUR_HEIGHT,
  TIME_WIDTH,
  formatTime,
  placeEvents
} from '../../lib/trip/schedule'
import { EventBlock } from './EventBlock'

interface Props {
  planner: Planner
  onAdd: (draft: EventDraft) => void
  onEdit: (event: PlannerEvent) => void
  onCommit: (event: PlannerEvent) => void
}

export function DayPlanner({ planner, onAdd, onEdit, onCommit }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [preview, setPreview] = useState<PlannerEvent | null>(null)
  const days = useMemo(
    () =>
      Array.from(
        { length: daySpan(planner.startDate, planner.endDate) },
        (_, index) => addDays(planner.startDate, index)
      ),
    [planner.startDate, planner.endDate]
  )
  const visibleEvents = useMemo(
    () =>
      planner.events
        .map((event) => (event.id === preview?.id ? preview : event))
        .filter(
          (event) =>
            event.date >= planner.startDate && event.date <= planner.endDate
        ),
    [planner, preview]
  )
  const placements = useMemo(() => placeEvents(visibleEvents), [visibleEvents])
  const onPreview = useCallback(
    (event: PlannerEvent | null) => setPreview(event),
    []
  )
  const dimensions = {
    '--day-width': `${DAY_WIDTH}px`,
    '--hour-height': `${HOUR_HEIGHT}px`,
    '--time-width': `${TIME_WIDTH}px`,
    '--days-width': `${days.length * DAY_WIDTH}px`
  } as CSSProperties

  return (
    <div
      ref={scrollerRef}
      className='relative overflow-auto max-h-[min(70vh,900px)] min-h-[360px] bg-card border border-border rounded-2xl'
      style={dimensions}
      aria-label='Daily trip schedule'
    >
      <div className='w-[calc(var(--time-width)+var(--days-width))] pb-6'>
        <div className='sticky top-0 z-[5] flex h-14 bg-card border-b border-border'>
          <div className='sticky left-0 z-[6] flex w-[var(--time-width)] shrink-0 items-center justify-center bg-card border-r border-border text-[10px] font-semibold uppercase tracking-wider text-text-soft'>
            Hour
          </div>
          {days.map((date) => (
            <div
              key={date}
              className={`flex w-[var(--day-width)] shrink-0 flex-col items-center justify-center gap-0.5 border-r border-border text-sm font-semibold ${isWeekend(date) ? 'bg-muted/50' : ''}`}
            >
              <span>{formatDay(date)}</span>
              <small className='text-[11px] font-normal text-text-soft'>
                {date.slice(0, 4)}
              </small>
            </div>
          ))}
        </div>
        <div className='relative flex'>
          <div className='sticky left-0 z-[4] w-[var(--time-width)] shrink-0 bg-card border-r border-border'>
            {HOURS.map((minute) => (
              <div
                key={minute}
                className='h-[var(--hour-height)] border-t border-border pt-2 text-center text-xs tabular-nums text-text-soft'
              >
                {formatTime(minute)}
              </div>
            ))}
            <div className='absolute -bottom-[19px] w-full text-center text-xs text-text-soft'>
              {formatTime(END_MINUTE)}
            </div>
          </div>
          <div className='relative w-[var(--days-width)]'>
            <div className='flex'>
              {days.map((date) => (
                <div
                  key={date}
                  className={`w-[var(--day-width)] shrink-0 border-r border-border ${isWeekend(date) ? 'bg-muted/50' : ''}`}
                >
                  {HOURS.map((minute) => (
                    <button
                      key={minute}
                      className='group block h-[var(--hour-height)] w-full cursor-pointer border-0 border-t border-border p-0 text-accent hover:bg-accent-soft focus-visible:bg-accent-soft'
                      type='button'
                      aria-label={`Add event on ${date} at ${formatTime(minute)}`}
                      title={`Add event at ${formatTime(minute)}`}
                      onClick={() =>
                        onAdd({
                          title: 'New event',
                          date,
                          startMinute: minute,
                          endMinute: minute + 60
                        })
                      }
                    >
                      <span
                        className='text-2xl opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
                        aria-hidden='true'
                      >
                        +
                      </span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
            <div className='pointer-events-none absolute inset-0'>
              {visibleEvents.map((event) => {
                const placement = placements.get(event.id)
                return (
                  placement && (
                    <EventBlock
                      key={event.id}
                      event={event}
                      placement={placement}
                      startDate={planner.startDate}
                      endDate={planner.endDate}
                      scrollerRef={scrollerRef}
                      onPreview={onPreview}
                      onCommit={onCommit}
                      onEdit={onEdit}
                    />
                  )
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
