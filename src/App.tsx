import { useState, useEffect } from 'react'
import { Heart, CalendarClock } from 'lucide-react'
import { MOOD_OPTIONS, THEMES } from './lib/types'
import type { MoodOption, Invite, Theme, Drawing } from './lib/types'
import { get, set } from './lib/storage'
import { MoodView } from './components/MoodView'
import { InvitesView } from './components/InvitesView'

// Toggle to true to mirror your drawing into the partner's mood card for testing
const MIRROR_DRAWING = true

export default function App() {
  const [activeTab, setActiveTab] = useState<'mood' | 'invites'>('mood')

  const [theme, setTheme] = useState<Theme>(
    () => get<Theme>('theme') ?? 'default'
  )

  const [myMood, setMyMood] = useState<MoodOption>(
    () => get<MoodOption>('my-mood') ?? MOOD_OPTIONS[1]
  )
  const [partnerMood] = useState<MoodOption>(
    () => get<MoodOption>('partner-mood') ?? MOOD_OPTIONS[0]
  )
  const [invites, setInvites] = useState<Invite[]>(
    () => get<Invite[]>('invites') ?? []
  )
  const [myDrawing, setMyDrawing] = useState<Drawing>(
    () => get<Drawing>('my-drawing') ?? []
  )
  const [partnerDrawing] = useState<Drawing>(
    () => get<Drawing>('partner-drawing') ?? []
  )

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    set('theme', theme)
  }, [theme])

  useEffect(() => {
    set('my-mood', myMood)
  }, [myMood])

  useEffect(() => {
    set('invites', invites)
  }, [invites])

  useEffect(() => {
    set('my-drawing', myDrawing)
  }, [myDrawing])

  function cycleTheme() {
    const idx = THEMES.findIndex((t) => t.key === theme)
    setTheme(THEMES[(idx + 1) % THEMES.length].key)
  }

  const currentTheme = THEMES.find((t) => t.key === theme)!

  return (
    <div className='min-h-screen bg-page flex justify-center text-text font-sans'>
      <div className='w-full max-w-md bg-page relative h-screen flex flex-col shadow-2xl overflow-hidden sm:border-x sm:border-border'>
        {/* Header */}
        <header className='pt-12 pb-4 px-6 bg-card border-b border-border-accent/30 flex items-center justify-between z-10 sticky top-0'>
          <div>
            <h1 className='text-xl font-bold bg-gradient-to-r from-gradient-from to-gradient-to bg-clip-text text-transparent'>
              Soul Link
            </h1>
            <p className='text-xs text-text-soft font-medium'>
              <em>Syncing with Her...</em>
            </p>
          </div>
          <button
            onClick={cycleTheme}
            className='w-9 h-9 rounded-full bg-accent-soft flex items-center justify-center text-base transition-all hover:scale-105 active:scale-95'
            title={currentTheme.label}
          >
            {currentTheme.icon}
          </button>
        </header>

        {/* Main Content */}
        <main className='flex-1 overflow-y-auto p-6'>
          {activeTab === 'mood' ? (
            <MoodView
              myMood={myMood}
              partnerMood={partnerMood}
              onMoodChange={setMyMood}
              myDrawing={myDrawing}
              partnerDrawing={MIRROR_DRAWING ? myDrawing : partnerDrawing}
              onDrawingChange={setMyDrawing}
            />
          ) : (
            <InvitesView invites={invites} onInvitesChange={setInvites} />
          )}
        </main>

        {/* Bottom Navigation */}
        <nav
          className='absolute bottom-0 w-full bg-card border-t border-border px-6 py-4 flex justify-around pb-8 z-10'
          style={{ boxShadow: 'var(--nav-shadow)' }}
        >
          <button
            onClick={() => setActiveTab('mood')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'mood' ? 'text-accent' : 'text-text-soft hover:text-text'}`}
          >
            <Heart
              size={24}
              className={activeTab === 'mood' ? 'fill-accent-soft' : ''}
            />
            <span className='text-[10px] font-medium'>Mood</span>
          </button>

          <button
            onClick={() => setActiveTab('invites')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'invites' ? 'text-accent' : 'text-text-soft hover:text-text'}`}
          >
            <CalendarClock
              size={24}
              className={activeTab === 'invites' ? 'fill-accent-soft' : ''}
            />
            <span className='text-[10px] font-medium'>Invites</span>
          </button>
        </nav>
      </div>
    </div>
  )
}
