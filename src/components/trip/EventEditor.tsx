import { useEffect, useRef, useState } from 'react'
import type { EventDraft } from '../../lib/trip/types'
import {
  END_MINUTE,
  HOURS,
  eventError,
  formatTime
} from '../../lib/trip/schedule'

interface Props {
  draft: EventDraft
  id?: string
  startDate: string
  endDate: string
  onSave: (draft: EventDraft, id?: string) => boolean
  onDelete: (id: string) => boolean
  onClose: () => void
}

const inputClass =
  'w-full min-w-0 bg-input border border-border rounded-xl px-4 py-3 text-sm font-normal text-text focus:outline-none focus:ring-2 focus:ring-ring transition-all'
const labelClass = 'flex flex-col gap-1.5 text-sm font-medium text-text-soft'

export function EventEditor({
  draft,
  id,
  startDate,
  endDate,
  onSave,
  onDelete,
  onClose
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const [fields, setFields] = useState(draft)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    dialog?.showModal()
    titleRef.current?.select()
    return () => dialog?.close()
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className='m-auto w-[min(380px,calc(100vw-48px))] max-h-[calc(100dvh-48px)] overflow-auto rounded-3xl border border-border-accent bg-card p-6 text-text shadow-2xl backdrop:bg-black/40'
      aria-labelledby='editor-title'
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
          const failure =
            eventError(fields) ??
            (fields.date < startDate || fields.date > endDate
              ? 'Choose a date within the displayed trip.'
              : null)
          setError(failure)
          if (!failure) {
            if (onSave(fields, id)) onClose()
            else
              setError(
                'Changes were not saved. Please try again.'
              )
          }
        }}
      >
        <div className='flex items-center justify-between'>
          <h2 id='editor-title' className='text-base font-bold'>
            {id ? 'Edit event' : 'New event'}
          </h2>
          <button
            type='button'
            className='cursor-pointer rounded-full p-1.5 text-xl leading-none text-text-soft transition-colors hover:bg-muted hover:text-text'
            aria-label='Close editor'
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <label className={labelClass}>
          Event name
          <input
            ref={titleRef}
            className={inputClass}
            autoFocus
            value={fields.title}
            maxLength={200}
            onChange={(event) =>
              setFields({ ...fields, title: event.target.value })
            }
          />
        </label>
        <label className={labelClass}>
          Day
          <input
            type='date'
            className={inputClass}
            value={fields.date}
            min={startDate}
            max={endDate}
            onChange={(event) =>
              setFields({ ...fields, date: event.target.value })
            }
          />
        </label>
        <div className='flex gap-3'>
          <label className={`${labelClass} flex-1`}>
            Start
            <select
              className={inputClass}
              value={fields.startMinute}
              onChange={(event) =>
                setFields({
                  ...fields,
                  startMinute: Number(event.target.value)
                })
              }
            >
              {HOURS.map((minute) => (
                <option key={minute} value={minute}>
                  {formatTime(minute)}
                </option>
              ))}
            </select>
          </label>
          <label className={`${labelClass} flex-1`}>
            End
            <select
              className={inputClass}
              value={fields.endMinute}
              onChange={(event) =>
                setFields({ ...fields, endMinute: Number(event.target.value) })
              }
            >
              {[...HOURS.slice(1), END_MINUTE].map((minute) => (
                <option key={minute} value={minute}>
                  {formatTime(minute)}
                </option>
              ))}
            </select>
          </label>
        </div>
        {error && (
          <p className='text-sm text-red-500' role='alert'>
            {error}
          </p>
        )}
        <div className='flex flex-wrap justify-end gap-2'>
          {id && (
            <button
              type='button'
              className='mr-auto cursor-pointer rounded-xl bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/20'
              onClick={() => {
                if (!confirmDelete) {
                  setConfirmDelete(true)
                  return
                }
                if (onDelete(id)) onClose()
                else
                  setError(
                    'The event was not deleted. Please try again.'
                  )
              }}
            >
              {confirmDelete ? 'Confirm delete' : 'Delete'}
            </button>
          )}
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
            Save event
          </button>
        </div>
      </form>
    </dialog>
  )
}
