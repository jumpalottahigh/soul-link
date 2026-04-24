import { X } from 'lucide-react'
import { GENDER_OPTIONS } from '../lib/types'
import type { Gender } from '../lib/types'

interface Props {
  gender: Gender
  onGenderChange: (gender: Gender) => void
  onClose: () => void
}

export function SettingsModal({ gender, onGenderChange, onClose }: Props) {
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-6'>
      <div className='absolute inset-0 bg-black/40' onClick={onClose} />
      <div className='relative bg-card rounded-3xl border border-border-accent p-6 w-full max-w-sm space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-base font-bold text-text'>Settings</h2>
          <button
            onClick={onClose}
            className='p-1.5 text-text-soft hover:text-text rounded-full hover:bg-muted transition-colors'
          >
            <X size={18} />
          </button>
        </div>

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
      </div>
    </div>
  )
}
