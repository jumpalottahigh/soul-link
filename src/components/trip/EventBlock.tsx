import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import interact from 'interactjs'
import type { PlannerEvent } from '../../lib/trip/types'
import { dayIndex } from '../../lib/trip/dates'
import type { Placement } from '../../lib/trip/schedule'
import {
  DAY_WIDTH,
  HOUR_HEIGHT,
  START_MINUTE,
  eventColor,
  formatTime,
  moveEvent,
  resizeEvent
} from '../../lib/trip/schedule'

interface Props {
  event: PlannerEvent
  startDate: string
  endDate: string
  placement: Placement
  scrollerRef: RefObject<HTMLDivElement | null>
  onPreview: (event: PlannerEvent | null) => void
  onCommit: (event: PlannerEvent) => void
  onEdit: (event: PlannerEvent) => void
}

const handleClass =
  "resize-handle absolute inset-x-0 h-[9px] cursor-ns-resize z-[1] after:content-[''] after:absolute after:w-[22px] after:h-0.5 after:left-[calc(50%-11px)] after:top-[3px] after:rounded-sm after:bg-black/25 after:opacity-0 group-hover:after:opacity-100 group-focus-visible:after:opacity-100"

export function EventBlock(props: Props) {
  const { event, startDate, placement, scrollerRef } = props
  const ref = useRef<HTMLDivElement>(null)
  const latest = useRef(props)
  useEffect(() => {
    latest.current = props
  })
  const [active, setActive] = useState(false)
  const moved = useRef(false)
  const gesture = useRef({
    original: event,
    next: event,
    x: 0,
    y: 0,
    scrollLeft: 0,
    scrollTop: 0,
    deltaX: 0,
    deltaY: 0
  })

  useEffect(() => {
    const el = ref.current
    const scroller = scrollerRef.current
    if (!el || !scroller) return

    const start = (x: number, y: number) => {
      const original = latest.current.event
      gesture.current = {
        original,
        next: original,
        x,
        y,
        scrollLeft: scroller.scrollLeft,
        scrollTop: scroller.scrollTop,
        deltaX: 0,
        deltaY: 0
      }
      moved.current = false
      setActive(true)
    }
    const preview = (next: PlannerEvent) => {
      gesture.current.next = next
      moved.current = true
      latest.current.onPreview(next)
    }
    const end = () => {
      const { original, next } = gesture.current
      setActive(false)
      latest.current.onPreview(null)
      if (
        original.date !== next.date ||
        original.startMinute !== next.startMinute ||
        original.endMinute !== next.endMinute
      ) {
        latest.current.onCommit(next)
      }
    }
    const inst = interact(el)
      .draggable({
        ignoreFrom: '.resize-handle',
        autoScroll: { container: scroller, margin: 40, speed: 400 },
        listeners: {
          start: (event) => start(event.clientX, event.clientY),
          move: (event) => {
            const state = gesture.current
            state.deltaX =
              event.clientX - state.x + scroller.scrollLeft - state.scrollLeft
            state.deltaY =
              event.clientY - state.y + scroller.scrollTop - state.scrollTop
            preview(
              moveEvent(
                state.original,
                state.deltaX / DAY_WIDTH,
                state.deltaY / HOUR_HEIGHT,
                dayIndex(state.original.date, latest.current.startDate),
                dayIndex(state.original.date, latest.current.endDate)
              )
            )
          },
          end
        }
      })
      .resizable({
        edges: { top: '.resize-handle.top', bottom: '.resize-handle.bottom' },
        autoScroll: { container: scroller, margin: 40, speed: 400 },
        listeners: {
          start: (event) => start(event.clientX, event.clientY),
          move: (event) => {
            const state = gesture.current
            const delta =
              event.clientY - state.y + scroller.scrollTop - state.scrollTop
            preview(
              resizeEvent(
                state.original,
                event.edges?.top ? 'start' : 'end',
                delta / HOUR_HEIGHT
              )
            )
          },
          end
        }
      })
    return () => {
      inst.unset()
    }
  }, [scrollerRef])

  const columnWidth = DAY_WIDTH / placement.columns
  return (
    <div
      ref={ref}
      role='button'
      tabIndex={0}
      className={`group absolute pointer-events-auto touch-none select-none rounded-[9px] px-2.5 pt-3 pb-2 text-[#1e293b] shadow-md overflow-hidden min-w-0 flex flex-col gap-1 hover:brightness-105 focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-text ${
        active
          ? 'z-[3] cursor-grabbing outline-2 outline-text shadow-xl'
          : 'cursor-grab'
      }`}
      data-event-id={event.id}
      aria-label={`${event.title}, ${event.date}, ${formatTime(event.startMinute)} to ${formatTime(event.endMinute)}. Edit event`}
      title={`${event.title}\n${event.date} · ${formatTime(event.startMinute)}–${formatTime(event.endMinute)}\nClick to edit; drag to move; drag top or bottom to resize.`}
      style={{
        left:
          dayIndex(startDate, event.date) * DAY_WIDTH +
          placement.column * columnWidth +
          4,
        top: ((event.startMinute - START_MINUTE) / 60) * HOUR_HEIGHT + 2,
        width: columnWidth - 8,
        height: ((event.endMinute - event.startMinute) / 60) * HOUR_HEIGHT - 4,
        background: eventColor(event.id)
      }}
      onClick={() => {
        if (moved.current) {
          moved.current = false
          return
        }
        latest.current.onEdit(latest.current.event)
      }}
      onKeyDown={(key) => {
        if (key.key === 'Enter' || key.key === ' ') {
          key.preventDefault()
          latest.current.onEdit(latest.current.event)
        }
      }}
    >
      <div className={`${handleClass} top top-0`} aria-hidden='true' />
      <strong className='text-[13px] leading-tight break-words shrink-0'>
        {event.title}
      </strong>
      <span className='text-[11px] opacity-85 tabular-nums'>
        {formatTime(event.startMinute)}–{formatTime(event.endMinute)}
      </span>
      <div className={`${handleClass} bottom bottom-0`} aria-hidden='true' />
    </div>
  )
}
