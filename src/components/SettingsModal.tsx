import { useState } from 'react'
import { LogOut, X } from 'lucide-react'
import { GENDER_OPTIONS, THEMES } from '../lib/types'
import type { Gender, Theme } from '../lib/types'

interface Props {
  displayName: string
  onDisplayNameChange: (name: string) => void
  gender: Gender
  onGenderChange: (gender: Gender) => void
  theme: Theme
  onThemeChange: (theme: Theme) => void
  onSignOut: () => void
  onClose: () => void
}

export function SettingsModal({
  displayName,
  onDisplayNameChange,
  gender,
  onGenderChange,
  theme,
  onThemeChange,
  onSignOut,
  onClose
}: Props) {
  const [name, setName] = useState(displayName)

  function handleNameBlur() {
    const trimmed = name.trim()
    if (trimmed && trimmed !== displayName) {
      onDisplayNameChange(trimmed)
    }
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-6'>
      <div className='absolute inset-0 bg-black/40' onClick={onClose} />
      <div className='relative bg-card rounded-3xl border border-border-accent p-6 w-full max-w-sm space-y-5'>
        <div className='flex items-center justify-between'>
          <h2 className='text-base font-bold text-text'>Settings</h2>
          <button
            onClick={onClose}
            className='p-1.5 text-text-soft hover:text-text rounded-full hover:bg-muted transition-colors'
          >
            <X size={18} />
          </button>
        </div>

        {/* Display Name */}
        <div>
          <span className='text-sm font-medium text-text-soft block mb-2'>
            Display Name
          </span>
          <input
            type='text'
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
            maxLength={24}
            className='w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-soft focus:outline-none focus:ring-2 focus:ring-ring transition-all'
          />
        </div>

        {/* Gender */}
        <div>
          <span className='text-sm font-medium text-text-soft block mb-2'>
            I am
          </span>
          <div className='flex gap-2'>
            {GENDER_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => onGenderChange(opt.key)}
                className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${
                  gender === opt.key
                    ? 'bg-active-bg border border-active-border scale-105'
                    : 'bg-input border border-border hover:bg-card'
                }`}
                style={
                  gender === opt.key
                    ? { boxShadow: 'var(--color-active-shadow)' }
                    : undefined
                }
              >
                <span className='text-xl'>{opt.emoji}</span>
                <span className='text-[10px] font-medium text-text'>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div>
          <span className='text-sm font-medium text-text-soft block mb-2'>
            Theme
          </span>
          <div className='flex gap-2'>
            {THEMES.map((t) => (
              <button
                key={t.key}
                onClick={() => onThemeChange(t.key)}
                className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${
                  theme === t.key
                    ? 'bg-active-bg border border-active-border scale-105'
                    : 'bg-input border border-border hover:bg-card'
                }`}
                style={
                  theme === t.key
                    ? { boxShadow: 'var(--color-active-shadow)' }
                    : undefined
                }
              >
                <span className='text-xl'>{t.icon}</span>
                <span className='text-[10px] font-medium text-text'>
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={onSignOut}
          className='w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors'
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </div>
  )
}
