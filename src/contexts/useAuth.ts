import { createContext, useContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import type { Profile } from '../lib/types'

export interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: Profile | null
  partnerProfile: Profile | null
  loading: boolean
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<string | null>
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<string | null>
  updatePassword: (newPassword: string) => Promise<string | null>
  recoveryMode: boolean
  exitRecoveryMode: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
