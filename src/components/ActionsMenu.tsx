import { useId, useRef } from 'react'
import { Ellipsis } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Props {
  label: string
  disabled?: boolean
  items: {
    id?: string
    label: string
    icon: LucideIcon
    onSelect: () => void
    destructive?: boolean
    keepOpen?: boolean
  }[]
  onClose?: () => void
}

export function ActionsMenu({
  label,
  disabled = false,
  items,
  onClose
}: Props) {
  const menuId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  return (
    <>
      <button
        ref={triggerRef}
        type='button'
        title={label}
        aria-label={label}
        aria-haspopup='menu'
        popoverTarget={menuId}
        disabled={disabled}
        className='flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-accent hover:bg-muted focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50'
      >
        <Ellipsis size={18} />
      </button>
      <div
        ref={menuRef}
        id={menuId}
        popover='auto'
        role='menu'
        aria-label={label}
        className='fixed m-0 w-60 max-w-[calc(100vw-32px)] rounded-lg border border-border bg-card p-1 text-text shadow-xl'
        onToggle={(event) => {
          if (event.newState !== 'open') {
            onClose?.()
            return
          }
          const menu = menuRef.current
          const trigger = triggerRef.current
          if (!menu || !trigger) return
          const bounds = trigger.getBoundingClientRect()
          const container = trigger.closest('main')?.getBoundingClientRect()
          const left = Math.max(16, (container?.left ?? 0) + 16)
          const right = Math.min(
            window.innerWidth - 16,
            (container?.right ?? window.innerWidth) - 16
          )
          menu.style.maxWidth = `${Math.max(0, right - left)}px`
          menu.style.left = `${Math.max(left, Math.min(bounds.right - menu.offsetWidth, right - menu.offsetWidth))}px`
          menu.style.top = `${Math.max(16, Math.min(bounds.bottom + 8, window.innerHeight - menu.offsetHeight - 16))}px`
          menu.querySelector('button')?.focus()
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            menuRef.current?.hidePopover()
            triggerRef.current?.focus()
            return
          }
          if (event.key === 'Tab') {
            menuRef.current?.hidePopover()
            return
          }
          const buttons = Array.from(
            event.currentTarget.querySelectorAll('button')
          )
          const index = buttons.findIndex(
            (button) => button === document.activeElement
          )
          let next: number
          if (event.key === 'ArrowDown') next = (index + 1) % buttons.length
          else if (event.key === 'ArrowUp')
            next = (index - 1 + buttons.length) % buttons.length
          else if (event.key === 'Home') next = 0
          else if (event.key === 'End') next = buttons.length - 1
          else return
          event.preventDefault()
          buttons[next]?.focus()
        }}
      >
        {items.map((item) => (
          <button
            key={item.id ?? item.label}
            type='button'
            role='menuitem'
            tabIndex={-1}
            className={`flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-3 text-left text-sm transition-colors hover:bg-muted focus:bg-muted focus:outline-none ${item.destructive ? 'text-red-500' : 'text-text'}`}
            onClick={() => {
              if (!item.keepOpen) menuRef.current?.hidePopover()
              item.onSelect()
            }}
          >
            <item.icon size={16} className='shrink-0' />
            {item.label}
          </button>
        ))}
      </div>
    </>
  )
}
