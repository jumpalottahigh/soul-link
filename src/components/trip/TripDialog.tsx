import { useEffect, useRef, useState } from 'react'
import { addDays, isISODate, todayISO } from '../../lib/trip/dates'

interface Props {
  mode: 'create' | 'rename' | 'dates'
  initialName?: string
  initialStartDate?: string
  initialEndDate?: string
  onCreate: (name: string, startDate: string, endDate: string) => void
  onRename: (name: string) => void
  onAdjustDates: (startDate: string, endDate: string) => boolean
  onClose: () => void
}

const inputClass =
  'w-full min-w-0 bg-input border border-border rounded-xl px-4 py-3 text-sm font-normal text-text focus:outline-none focus:ring-2 focus:ring-ring transition-all'
const labelClass = 'flex flex-col gap-1.5 text-sm font-medium text-text-soft'

export function TripDialog({
  mode,
  initialName = '',
  initialStartDate,
  initialEndDate,
  onCreate,
  onRename,
  onAdjustDates,
  onClose
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(initialName)
  const [start, setStart] = useState(() => initialStartDate ?? todayISO())
  const [end, setEnd] = useState(() => initialEndDate ?? addDays(todayISO(), 6))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    dialog?.showModal()
    dialog?.querySelector<HTMLInputElement>('input')?.focus()
    nameRef.current?.select()
    return () => dialog?.close()
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className={`w-[min(380px,calc(100vw-48px))] overflow-auto rounded-3xl border border-border-accent bg-card p-6 text-text shadow-2xl backdrop:bg-black/40 ${mode !== 'create' ? 'mx-auto mb-auto mt-[calc(env(safe-area-inset-top)+1rem)] max-h-[calc(100dvh-env(safe-area-inset-top)-32px)]' : 'm-auto max-h-[calc(100dvh-48px)]'}`}
      aria-labelledby='trip-dialog-title'
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
    >
      <form
        className='flex flex-col gap-4'
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          const trimmed = name.trim()
          if (mode !== 'dates' && (trimmed.length < 1 || trimmed.length > 60)) {
            setError('Enter a trip name between 1 and 60 characters.')
            return
          }
          if (mode === 'rename') {
            onRename(trimmed)
          } else {
            if (!isISODate(start) || !isISODate(end) || start > end) {
              setError(
                'Enter valid trip dates with the end on or after the start.'
              )
              return
            }
            if (mode === 'dates') {
              if (!onAdjustDates(start, end)) {
                setError('Dates were not saved. Please try again.')
                return
              }
            } else {
              onCreate(trimmed, start, end)
            }
          }
          onClose()
        }}
      >
        <h2 id='trip-dialog-title' className='text-base font-bold'>
          {mode === 'create'
            ? 'New trip'
            : mode === 'dates'
              ? 'Adjust trip dates'
              : 'Rename trip'}
        </h2>
        {mode !== 'dates' && (
          <label className={labelClass}>
            Trip name
            <input
              ref={nameRef}
              className={inputClass}
              autoFocus
              value={name}
              maxLength={60}
              placeholder='e.g. Lisbon in May'
              onChange={(event) => setName(event.target.value)}
            />
          </label>
        )}
        {mode !== 'rename' && (
          <div className='flex gap-3'>
            <label className={`${labelClass} flex-1`}>
              Trip start
              <input
                type='date'
                className={inputClass}
                value={start}
                onChange={(event) => setStart(event.target.value)}
              />
            </label>
            <label className={`${labelClass} flex-1`}>
              Trip end
              <input
                type='date'
                className={inputClass}
                value={end}
                onChange={(event) => setEnd(event.target.value)}
              />
            </label>
          </div>
        )}
        {error && (
          <p className='text-sm text-red-500' role='alert'>
            {error}
          </p>
        )}
        <div className='flex justify-end gap-2'>
          <button
            type='button'
            className='cursor-pointer rounded-xl border border-border bg-input px-4 py-2.5 text-sm font-medium text-text transition-colors hover:bg-muted'
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type='submit'
            className='cursor-pointer rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover'
          >
            {mode === 'create' ? 'Create trip' : 'Save'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
