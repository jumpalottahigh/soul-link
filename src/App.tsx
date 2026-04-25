import { useState, useEffect, useRef, useCallback } from 'react'
import { Heart, CalendarClock, Settings } from 'lucide-react'
import type { MoodOption, Invite, Theme, Drawing, Gender } from './lib/types'
import { get, set } from './lib/storage'
import { supabase } from './lib/supabase'
import { useAuth } from './contexts/AuthContext'
import {
  updateMyMood,
  updateMyDrawing,
  updateMyGender,
  updateDisplayName,
  fetchInvites,
  mapDbInviteToInvite,
  addToRecentMoods
} from './lib/db'
import { AuthScreen } from './components/AuthScreen'
import { PairingScreen } from './components/PairingScreen'
import { MoodView } from './components/MoodView'
import { InvitesView } from './components/InvitesView'
import { SettingsModal } from './components/SettingsModal'
import { CustomMoodModal } from './components/CustomMoodModal'

export default function App() {
  const { session, profile, partnerProfile, loading } = useAuth()

  // Theme is always local
  const [theme, setTheme] = useState<Theme>(
    () =>
      get<Theme>('theme') ??
      (window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'default')
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

  if (!profile?.partner_id || !partnerProfile) {
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
  const { user, profile, partnerProfile, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<'mood' | 'invites'>('mood')
  const [showSettings, setShowSettings] = useState(false)
  const [showCustomMood, setShowCustomMood] = useState(false)

  // Gender state
  const [myGender, setMyGender] = useState<Gender>(profile!.gender ?? 'other')
  const [partnerGender, setPartnerGender] = useState<Gender>(
    partnerProfile!.gender ?? 'other'
  )

  // Display name state
  const [displayName, setDisplayName] = useState(profile!.display_name ?? '')

  function handleDisplayNameChange(name: string) {
    setDisplayName(name)
    updateDisplayName(user!.id, name).catch(console.error)
  }

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
    emoji: profile!.mood_emoji || '❓',
    label: profile!.mood_label || 'Pick a mood below!'
  })
  const [partnerMood, setPartnerMood] = useState<MoodOption>({
    emoji: partnerProfile!.mood_emoji || '❓',
    label: partnerProfile!.mood_label || 'No mood yet'
  })
  const [recentMoods, setRecentMoods] = useState<MoodOption[]>(
    profile!.recent_moods ?? []
  )

  // Drawing state — initialized from Supabase profile
  const [myDrawing, setMyDrawing] = useState<Drawing>(profile!.drawing ?? [])
  const [partnerDrawing, setPartnerDrawing] = useState<Drawing>(
    partnerProfile!.drawing ?? []
  )

  // Invites — fetched from Supabase
  const [invites, setInvites] = useState<Invite[]>([])

  // Fetch invites on mount
  useEffect(() => {
    if (!user?.id) return
    fetchInvites(user.id)
      .then((rows) =>
        setInvites(rows.map((r: any) => mapDbInviteToInvite(r, user.id)))
      )
      .catch(console.error)
  }, [user?.id])

  // Realtime: invites changes
  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel('invites-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invites'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const mapped = mapDbInviteToInvite(payload.new, user.id)
            setInvites((prev) => [
              mapped,
              ...prev.filter((i) => i.id !== mapped.id)
            ])
          } else if (payload.eventType === 'UPDATE') {
            const mapped = mapDbInviteToInvite(payload.new, user.id)
            setInvites((prev) =>
              prev.map((inv) => (inv.id === mapped.id ? mapped : inv))
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  // Mood change → optimistic update + DB write
  function handleMoodChange(mood: MoodOption) {
    const updatedRecents = addToRecentMoods(recentMoods, mood)
    setMyMood(mood)
    setRecentMoods(updatedRecents)
    updateMyMood(user!.id, mood, updatedRecents).catch(console.error)
  }

  function handleCustomMood(mood: MoodOption) {
    setShowCustomMood(false)
    handleMoodChange(mood)
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
          if (p.mood_emoji !== undefined) {
            setPartnerMood({ emoji: p.mood_emoji || '❓', label: p.mood_label || 'No mood yet' })
          }
          if (p.drawing !== undefined) {
            setPartnerDrawing(p.drawing ?? [])
          }
          if (p.gender) setPartnerGender(p.gender)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [partnerProfile?.id])

  return (
    <div className='min-h-screen bg-page flex justify-center text-text font-sans'>
      <div className='w-full max-w-md bg-page relative h-screen flex flex-col shadow-2xl overflow-hidden sm:border-x sm:border-border'>
        {/* Header */}
        <header className='pt-10 pb-2 px-6 bg-card border-b border-border-accent/30 flex items-center justify-between z-10 sticky top-0'>
          <div>
            <h1 className='flex items-center gap-2 text-xl font-bold'>
              <img
                src='/favicon.png'
                alt='Soul Link logo'
                className='w-5 h-5 rounded-sm'
              />
              <span className='bg-gradient-to-r from-gradient-from to-gradient-to bg-clip-text text-transparent'>
                Soul Link
              </span>
            </h1>
            <p className='text-xs text-text-soft font-medium'>
              <em>
                {partnerGender === 'female'
                  ? 'Linked with Her'
                  : partnerGender === 'male'
                    ? 'Linked with Him'
                    : 'Linked with Partner'}
                {partnerProfile?.display_name
                  ? ` \u00b7 ${partnerProfile.display_name}`
                  : ''}
              </em>
            </p>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className='w-9 h-9 rounded-full bg-accent-soft flex items-center justify-center text-accent transition-all hover:scale-105 active:scale-95'
            title='Settings'
          >
            <Settings size={16} />
          </button>
        </header>

        {/* Main Content */}
        <main className='flex-1 overflow-y-auto p-6'>
          {activeTab === 'mood' ? (
            <MoodView
              myMood={myMood}
              partnerMood={partnerMood}
              onMoodChange={handleMoodChange}
              recentMoods={recentMoods}
              onCustomMoodClick={() => setShowCustomMood(true)}
              myDrawing={myDrawing}
              partnerDrawing={partnerDrawing}
              onDrawingChange={handleDrawingChange}
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
            <InvitesView
              invites={invites}
              userId={user!.id}
              partnerId={profile!.partner_id!}
            />
          )}
        </main>

        {/* Bottom Navigation */}
        <nav
          className='absolute bottom-0 w-full bg-card border-t border-border px-6 py-2 flex justify-around pb-6 z-10'
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
            <div className='relative'>
              <CalendarClock
                size={24}
                className={activeTab === 'invites' ? 'fill-accent-soft' : ''}
              />
              {invites.some(
                (i) => i.status === 'pending' && i.sender === 'partner'
              ) && (
                <span className='absolute -top-1 -right-1 w-2.5 h-2.5 bg-accent rounded-full border-2 border-card' />
              )}
            </div>
            <span className='text-[10px] font-medium'>Invites</span>
          </button>
        </nav>
      </div>

      {showSettings && (
        <SettingsModal
          displayName={displayName}
          onDisplayNameChange={handleDisplayNameChange}
          gender={myGender}
          onGenderChange={handleGenderChange}
          theme={theme}
          onThemeChange={setTheme}
          onSignOut={signOut}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showCustomMood && (
        <CustomMoodModal
          onClose={() => setShowCustomMood(false)}
          onConfirm={handleCustomMood}
        />
      )}
    </div>
  )
}
