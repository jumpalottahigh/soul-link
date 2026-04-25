import { useState } from 'react'
import { X } from 'lucide-react'
import type { MoodOption } from '../lib/types'

const EMOJI_GRID = [
  '😊', '😍', '🥰', '😴', '😢', '😤',
  '🤗', '😎', '🤔', '😩', '🥺', '😌',
  '💕', '🔥', '✨', '💪', '🎉', '🌈',
  '☕', '🍕', '🏠', '📚', '🎮', '🎵',
  '🏃', '🧘', '💻', '🌙', '☀️', '🤒'
]

interface Props {
  onClose: () => void
  onConfirm: (mood: MoodOption) => void
}

function getFirstEmoji(str: string): string {
  const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' })
  const segments = segmenter.segment(str)
  for (const seg of segments) {
    return seg.segment
  }
  return ''
}

export function CustomMoodModal({ onClose, onConfirm }: Props) {
  const [emoji, setEmoji] = useState('')
  const [label, setLabel] = useState('')

  const canConfirm = emoji.trim().length > 0 && label.trim().length > 0

  function handleConfirm() {
    if (!canConfirm) return
    onConfirm({ emoji: emoji.trim(), label: label.trim() })
  }

  function handleEmojiInput(value: string) {
    if (value === '') {
      setEmoji('')
      return
    }
    setEmoji(getFirstEmoji(value))
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-6'>
      <div className='absolute inset-0 bg-black/40' onClick={onClose} />
      <div className='relative bg-card rounded-3xl border border-border-accent p-6 w-full max-w-sm space-y-5 max-h-[85vh] overflow-y-auto'>
        <div className='flex items-center justify-between'>
          <h2 className='text-base font-bold text-text'>Custom Mood</h2>
          <button
            onClick={onClose}
            className='p-1.5 text-text-soft hover:text-text rounded-full hover:bg-muted transition-colors'
          >
            <X size={18} />
          </button>
        </div>

        {/* Emoji Grid */}
        <div>
          <span className='text-sm font-medium text-text-soft block mb-2'>
            Pick an emoji
          </span>
          <div className='grid grid-cols-6 gap-1.5'>
            {EMOJI_GRID.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`text-xl p-2 rounded-xl transition-all ${
                  emoji === e
                    ? 'bg-active-bg border border-active-border scale-110'
                    : 'hover:bg-card-alt border border-transparent'
                }`}
                style={
                  emoji === e
                    ? { boxShadow: 'var(--color-active-shadow)' }
                    : undefined
                }
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Custom emoji text input */}
        <div>
          <span className='text-sm font-medium text-text-soft block mb-2'>
            Or type your own
          </span>
          <input
            type='text'
            value={emoji}
            onChange={(e) => handleEmojiInput(e.target.value)}
            placeholder='Paste or type an emoji'
            className='w-full text-center text-3xl p-3 rounded-2xl bg-input border border-border focus:border-accent focus:outline-none transition-colors'
          />
        </div>

        {/* Label input */}
        <div>
          <span className='text-sm font-medium text-text-soft block mb-2'>
            Label
          </span>
          <input
            type='text'
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder='e.g. Feeling cozy'
            maxLength={24}
            className='w-full text-sm p-3 rounded-2xl bg-input border border-border focus:border-accent focus:outline-none transition-colors text-text placeholder:text-text-soft'
          />
        </div>

        <button
          onClick={handleConfirm}
          disabled={!canConfirm}
          className='w-full py-3 rounded-xl text-sm font-medium transition-colors bg-accent text-white hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed'
        >
          Set Mood
        </button>
      </div>
    </div>
  )
}
