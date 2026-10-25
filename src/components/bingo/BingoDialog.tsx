import { useEffect, useRef, useState } from 'react'
import { Save, Trash2, X } from 'lucide-react'

interface Props {
  kind: 'create' | 'rename' | 'cell' | 'delete'
  initialValue?: string
  onSave: (value: string) => Promise<boolean>
  onClose: () => void
}

export function BingoDialog({
  kind,
  initialValue = '',
  onSave,
  onClose
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [value, setValue] = useState(initialValue)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const title =
    kind === 'create'
      ? 'New bingo'
      : kind === 'rename'
        ? 'Rename bingo'
        : kind === 'delete'
          ? 'Delete bingo?'
          : 'Bingo item'

  useEffect(() => {
    const dialog = dialogRef.current
    dialog?.showModal()
    dialog
      ?.querySelector<HTMLInputElement | HTMLTextAreaElement>('input, textarea')
      ?.focus()
    return () => dialog?.close()
  }, [])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby='bingo-dialog-title'
      className={`max-h-[calc(100dvh-env(safe-area-inset-top)-32px)] w-[min(380px,calc(100vw-32px))] overflow-auto rounded-lg border border-border bg-card p-5 text-text shadow-xl backdrop:bg-black/40 ${kind === 'rename' || kind === 'cell' ? 'mx-auto mb-auto mt-[calc(env(safe-area-inset-top)+1rem)]' : 'm-auto'}`}
      onCancel={(event) => {
        event.preventDefault()
        if (!saving) onClose()
      }}
    >
      <form
        className='space-y-4'
        onSubmit={async (event) => {
          event.preventDefault()
          const trimmed = value.trim()
          if (
            (kind === 'create' || kind === 'rename') &&
            (!trimmed || trimmed.length > 60)
          ) {
            setError('Enter a name between 1 and 60 characters.')
            return
          }
          setSaving(true)
          setError(null)
          if (await onSave(trimmed)) onClose()
          else setError('Could not save. Please try again.')
          setSaving(false)
        }}
      >
        <div className='flex items-center justify-between gap-3'>
          <h2 id='bingo-dialog-title' className='text-base font-bold'>
            {title}
          </h2>
          <button
            type='button'
            aria-label='Close'
            title='Close'
            disabled={saving}
            onClick={onClose}
            className='flex size-9 cursor-pointer items-center justify-center rounded-lg hover:bg-muted disabled:opacity-50'
          >
            <X size={18} />
          </button>
        </div>
        {kind === 'delete' ? (
          <p className='break-words text-sm'>
            Delete &ldquo;{initialValue}&rdquo; and all its items and
            checkmarks? This cannot be undone.
          </p>
        ) : (
          <label className='block space-y-2 text-sm font-medium'>
            <span>{kind === 'cell' ? 'Item text' : 'Bingo name'}</span>
            {kind === 'cell' ? (
              <textarea
                autoFocus
                rows={4}
                maxLength={200}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                className='block w-full resize-y rounded-lg border border-border bg-input p-3 text-text focus:outline-none focus:ring-2 focus:ring-ring'
              />
            ) : (
              <input
                autoFocus
                maxLength={60}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                className='block w-full rounded-lg border border-border bg-input p-3 text-text focus:outline-none focus:ring-2 focus:ring-ring'
              />
            )}
          </label>
        )}
        {kind === 'cell' && !value.trim() && initialValue && (
          <p className='text-sm text-text-soft'>
            Clearing this item also removes both checkmarks.
          </p>
        )}
        {error && (
          <p role='alert' className='text-sm text-red-500'>
            {error}
          </p>
        )}
        <div className='flex justify-end gap-2'>
          <button
            type='button'
            disabled={saving}
            onClick={onClose}
            className='cursor-pointer rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-50'
          >
            Cancel
          </button>
          <button
            type='submit'
            disabled={saving}
            className={`flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${kind === 'delete' ? 'bg-red-600' : 'bg-accent hover:bg-accent-hover'}`}
          >
            {kind === 'delete' ? <Trash2 size={16} /> : <Save size={16} />}
            {saving
              ? 'Saving...'
              : kind === 'delete'
                ? 'Delete bingo'
                : kind === 'create'
                  ? 'Create bingo'
                  : 'Save'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
