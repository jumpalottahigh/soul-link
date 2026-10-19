import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { Profile } from '../lib/types'
import { supabase } from '../lib/supabase'
import { fetchProfile, fetchPartnerProfile } from '../lib/db'
import { AuthContext } from './useAuth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [partnerProfile, setPartnerProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [recoveryMode, setRecoveryMode] = useState(false)

  const user = session?.user ?? null

  async function loadProfile(userId: string) {
    try {
      const p = await fetchProfile(userId)
      setProfile(p)
      if (p.partner_id) {
        const partner = await fetchPartnerProfile(p.partner_id)
        setPartnerProfile(partner)
      } else {
        setPartnerProfile(null)
      }
    } catch (err) {
      console.error('Failed to load profile:', err)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      if (s?.user) {
        loadProfile(s.user.id).then(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true)
      }
      if (s?.user) {
        loadProfile(s.user.id)
      } else {
        setProfile(null)
        setPartnerProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signUp(email: string, password: string, displayName: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } }
    })
    return error?.message ?? null
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return error?.message ?? null
  }

  async function signOut() {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
    setPartnerProfile(null)
    setRecoveryMode(false)
  }

  async function refreshProfile() {
    if (user) await loadProfile(user.id)
  }

  async function sendPasswordReset(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    })
    return error?.message ?? null
  }

  async function updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return error.message
    setRecoveryMode(false)
    return null
  }

  function exitRecoveryMode() {
    setRecoveryMode(false)
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        partnerProfile,
        loading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
        sendPasswordReset,
        updatePassword,
        recoveryMode,
        exitRecoveryMode
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
