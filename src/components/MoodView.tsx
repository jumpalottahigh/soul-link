import { Plus } from 'lucide-react'
import { DEFAULT_MOODS } from '../lib/types'
import type { MoodOption, Drawing } from '../lib/types'
import { DrawingCanvas } from './DrawingCanvas'
import { DrawingPreview } from './DrawingPreview'

interface Props {
  myMood: MoodOption
  partnerMood: MoodOption
  onMoodChange: (mood: MoodOption) => void
  recentMoods: MoodOption[]
  onCustomMoodClick: () => void
  myDrawing: Drawing
  partnerDrawing: Drawing
  onDrawingChange: (drawing: Drawing) => void
  partnerMoodLabel?: string
  drawLabel?: string
}

function getDisplayMoods(recentMoods: MoodOption[]): MoodOption[] {
  if (recentMoods.length >= 5) return recentMoods.slice(0, 5)
  const moods = [...recentMoods]
  for (const d of DEFAULT_MOODS) {
    if (moods.length >= 5) break
    if (!moods.some((m) => m.emoji === d.emoji && m.label === d.label)) {
      moods.push(d)
    }
  }
  return moods
}

export function MoodView({
  myMood,
  partnerMood,
  onMoodChange,
  recentMoods,
  onCustomMoodClick,
  myDrawing,
  partnerDrawing,
  onDrawingChange,
  partnerMoodLabel,
  drawLabel
}: Props) {
  const displayMoods = getDisplayMoods(recentMoods)

  return (
    <div className='space-y-6 animate-fade-in'>
      {/* Partner's Mood Card */}
      <div className='bg-card p-6 rounded-3xl shadow-sm border border-border-accent flex flex-col items-center'>
        <span className='text-sm font-medium text-accent mb-2'>
          {partnerMoodLabel ?? "Partner's Mood"}
        </span>
        <div className='text-6xl mb-2'>{partnerMood.emoji}</div>
        <span className='text-text-soft font-medium'>{partnerMood.label}</span>
        <DrawingPreview drawing={partnerDrawing} />
      </div>

      {/* My Mood Selector */}
      <div className='bg-card-alt p-4 rounded-3xl border border-border-accent'>
        <span className='text-xs font-medium text-accent mb-2 block text-center'>
          Set Your Mood
        </span>
        <div className='grid grid-cols-3 gap-2'>
          {displayMoods.map((mood, idx) => (
            <button
              key={idx}
              onClick={() => onMoodChange(mood)}
              className={`p-2 rounded-2xl flex flex-col items-center gap-0.5 transition-all
                ${
                  myMood.emoji === mood.emoji && myMood.label === mood.label
                    ? 'bg-active-bg border border-active-border scale-105'
                    : 'hover:bg-card/60 text-text-soft'
                }`}
              style={
                myMood.emoji === mood.emoji && myMood.label === mood.label
                  ? { boxShadow: 'var(--color-active-shadow)' }
                  : undefined
              }
            >
              <span className='text-xl'>{mood.emoji}</span>
              <span className='text-[9px] font-medium text-center'>
                {mood.label}
              </span>
            </button>
          ))}

          {/* Custom Mood Button */}
          <button
            onClick={onCustomMoodClick}
            className='p-2 rounded-2xl flex flex-col items-center gap-0.5 transition-all border border-dashed border-border hover:border-accent hover:bg-card/60 text-text-soft'
          >
            <Plus size={20} className='text-accent' />
            <span className='text-[9px] font-medium text-center'>Custom</span>
          </button>
        </div>
      </div>

      {/* Drawing Canvas */}
      <DrawingCanvas
        drawing={myDrawing}
        onChange={onDrawingChange}
        drawLabel={drawLabel}
      />

      <div className='h-20' />
    </div>
  )
}
