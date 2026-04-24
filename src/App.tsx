import { useState, useEffect, useRef, useCallback } from 'react'
import { Heart, CalendarClock, Settings } from 'lucide-react'
import { THEMES } from './lib/types'
import type { MoodOption, Invite, Theme, Drawing, Gender } from './lib/types'
import { get, set } from './lib/storage'
import { supabase } from './lib/supabase'
import { useAuth } from './contexts/AuthContext'
import { updateMyMood, updateMyDrawing, updateMyGender } from './lib/db'
import { AuthScreen } from './components/AuthScreen'
import { PairingScreen } from './components/PairingScreen'
import { MoodView } from './components/MoodView'
import { InvitesView } from './components/InvitesView'
import { SettingsModal } from './components/SettingsModal'

export default function App() {
  const { session, profile, loading } = useAuth()

  // Theme is always local
  const [theme, setTheme] = useState<Theme>(
    () => get<Theme>('theme') ?? 'default'
  )
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    set('theme', theme)
  }, [theme])

  if (loading) {
    return (
      <div className='min-h-screen bg-page flex items-center justify-center text-text font-sans'>
        <h1 className='text-xl font-bold bg-gradient-to-r from-gradient-from to-gradient-to bg-clip-text text-transparent animate-pulse'>
          Soul Link
        </h1>
      </div>
    )
  }

  if (!session) {
    return <AuthScreen />
  }

  if (!profile?.partner_id) {
    return <PairingScreen />
  }

  return <MainApp theme={theme} setTheme={setTheme} />
}

function MainApp({
  theme,
  setTheme
}: {
  theme: Theme
  setTheme: (t: Theme) => void
}) {
  const { user, profile, partnerProfile } = useAuth()
  const [activeTab, setActiveTab] = useState<'mood' | 'invites'>('mood')
  const [showSettings, setShowSettings] = useState(false)

  // Gender state
  const [myGender, setMyGender] = useState<Gender>(profile!.gender ?? 'other')
  const [partnerGender, setPartnerGender] = useState<Gender>(
    partnerProfile!.gender ?? 'other'
  )

  function handleGenderChange(gender: Gender) {
    setMyGender(gender)
    updateMyGender(user!.id, gender).catch(console.error)
  }

  // Derive partner mood label from partner's gender
  const partnerMoodLabel =
    partnerGender === 'female'
      ? 'Her Mood'
      : partnerGender === 'male'
        ? 'His Mood'
        : "Partner's Mood"

  // Mood state — initialized from Supabase profile
  const [myMood, setMyMood] = useState<MoodOption>({
    emoji: profile!.mood_emoji,
    label: profile!.mood_label
  })
  const [partnerMood, setPartnerMood] = useState<MoodOption>({
    emoji: partnerProfile!.mood_emoji,
    label: partnerProfile!.mood_label
  })

  // Drawing state — initialized from Supabase profile
  const [myDrawing, setMyDrawing] = useState<Drawing>(profile!.drawing ?? [])
  const [partnerDrawing, setPartnerDrawing] = useState<Drawing>(
    partnerProfile!.drawing ?? []
  )

  // Invites — still localStorage for now (Phase 5)
  const [invites, setInvites] = useState<Invite[]>(
    () => get<Invite[]>('invites') ?? []
  )

  useEffect(() => {
    set('invites', invites)
  }, [invites])

  // Mood change → optimistic update + DB write
  function handleMoodChange(mood: MoodOption) {
    setMyMood(mood)
    updateMyMood(user!.id, mood).catch(console.error)
  }

  // Drawing change → optimistic update + debounced DB write
  const drawingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleDrawingChange = useCallback(
    (drawing: Drawing) => {
      setMyDrawing(drawing)
      if (drawingTimer.current) clearTimeout(drawingTimer.current)
      drawingTimer.current = setTimeout(() => {
        updateMyDrawing(user!.id, drawing).catch(console.error)
      }, 500)
    },
    [user]
  )

  // Realtime: partner profile changes (mood + drawing)
  useEffect(() => {
    if (!partnerProfile?.id) return

    const channel = supabase
      .channel('partner-profile')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${partnerProfile.id}`
        },
        (payload) => {
          const p = payload.new
          setPartnerMood({ emoji: p.mood_emoji, label: p.mood_label })
          setPartnerDrawing(p.drawing ?? [])
          if (p.gender) setPartnerGender(p.gender)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [partnerProfile?.id])

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
              <em>
                {partnerGender === 'female'
                  ? 'Syncing with Her...'
                  : partnerGender === 'male'
                    ? 'Syncing with Him...'
                    : 'Syncing with Partner...'}
              </em>
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <button
              onClick={() => setShowSettings(true)}
              className='w-9 h-9 rounded-full bg-accent-soft flex items-center justify-center text-accent transition-all hover:scale-105 active:scale-95'
              title='Settings'
            >
              <Settings size={16} />
            </button>
            <button
              onClick={cycleTheme}
              className='w-9 h-9 rounded-full bg-accent-soft flex items-center justify-center text-base transition-all hover:scale-105 active:scale-95'
              title={currentTheme.label}
            >
              {currentTheme.icon}
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className='flex-1 overflow-y-auto p-6'>
          {activeTab === 'mood' ? (
            <MoodView
              myMood={myMood}
              partnerMood={partnerMood}
              onMoodChange={handleMoodChange}
              myDrawing={myDrawing}
              partnerDrawing={partnerDrawing}
              onDrawingChange={handleDrawingChange}
              partnerName={partnerProfile?.display_name}
              partnerMoodLabel={partnerMoodLabel}
              drawLabel={
                partnerGender === 'female'
                  ? 'Draw for Her'
                  : partnerGender === 'male'
                    ? 'Draw for Him'
                    : 'Draw for Partner'
              }
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

      {showSettings && (
        <SettingsModal
          gender={myGender}
          onGenderChange={handleGenderChange}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}
