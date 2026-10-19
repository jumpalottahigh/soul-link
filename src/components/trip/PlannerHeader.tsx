import { useState } from 'react'
import { isISODate } from '../../lib/trip/dates'

interface Props {
  startDate: string
  endDate: string
  onChange: (start: string, end: string) => boolean
  onAdd: () => void
}

const inputClass =
  'w-full min-w-0 bg-input border border-border rounded-xl px-3 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-ring transition-all'
const labelClass =
  'flex flex-1 flex-col gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-soft'

// Parent remounts this component (via key) when the saved range changes.
export function PlannerHeader({ startDate, endDate, onChange, onAdd }: Props) {
  const [start, setStart] = useState(startDate)
  const [end, setEnd] = useState(endDate)
  const [error, setError] = useState<string | null>(null)

  return (
    <form
      className='flex flex-wrap items-end gap-3 bg-card border border-border-accent rounded-3xl p-4'
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        if (!isISODate(start) || !isISODate(end) || start > end) {
          setError('Enter valid trip dates with the end on or after the start.')
          return
        }
        setError(null)
        onChange(start, end)
      }}
    >
      <label className={labelClass}>
        Trip start
        <input
          type='date'
          className={inputClass}
          value={start}
          onChange={(event) => setStart(event.target.value)}
        />
      </label>
      <label className={labelClass}>
        Trip end
        <input
          type='date'
          className={inputClass}
          value={end}
          onChange={(event) => setEnd(event.target.value)}
        />
      </label>
      <button
        type='submit'
        className='cursor-pointer rounded-xl border border-border bg-input px-4 py-2.5 text-sm font-medium text-text transition-colors hover:bg-muted'
      >
        Apply dates
      </button>
      <span className='self-center text-xs text-text-soft'>
        07:00 – 23:00
        <span className='block text-[11px]'>1-hour steps</span>
      </span>
      <button
        type='button'
        className='ml-auto cursor-pointer rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover'
        onClick={onAdd}
      >
        + Add event
      </button>
      {error && (
        <p className='basis-full text-sm text-red-500' role='alert'>
          {error}
        </p>
      )}
    </form>
  )
}
