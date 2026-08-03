import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

type Mode = 'login' | 'signup' | 'forgot'

export function AuthScreen() {
  const { signIn, signUp, sendPasswordReset } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setSubmitting(true)

    let err: string | null = null
    if (mode === 'login') {
      err = await signIn(email, password)
    } else if (mode === 'signup') {
      err = await signUp(email, password, displayName)
    } else {
      err = await sendPasswordReset(email)
      if (!err) setInfo('Check your email for a password reset link.')
    }

    if (err) setError(err)
    setSubmitting(false)
  }

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setInfo(null)
  }

  const title =
    mode === 'login'
      ? 'Welcome back'
      : mode === 'signup'
        ? 'Create your account'
        : 'Reset your password'

  const submitLabel =
    mode === 'login' ? 'Log in' : mode === 'signup' ? 'Sign up' : 'Send reset link'

  return (
    <div className='h-screen bg-page flex items-center justify-center p-6 text-text font-sans overflow-hidden'>
      <div className='w-full max-w-sm'>
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold bg-gradient-to-r from-gradient-from to-gradient-to bg-clip-text text-transparent'>
            Soul Link
          </h1>
          <p className='text-sm text-text-soft mt-1'>{title}</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className='bg-card p-6 rounded-3xl border border-border-accent space-y-4'
        >
          {mode === 'signup' && (
            <input
              type='text'
              placeholder='Display name'
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className='w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-soft focus:outline-none focus:ring-2 focus:ring-ring transition-all'
            />
          )}
          <input
            type='email'
            placeholder='Email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className='w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-soft focus:outline-none focus:ring-2 focus:ring-ring transition-all'
          />
          {mode !== 'forgot' && (
            <input
              type='password'
              placeholder='Password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className='w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-soft focus:outline-none focus:ring-2 focus:ring-ring transition-all'
            />
          )}

          {mode === 'login' && (
            <div className='text-right'>
              <button
                type='button'
                onClick={() => switchMode('forgot')}
                className='text-xs text-accent hover:underline'
              >
                Forgot password?
              </button>
            </div>
          )}

          {error && <p className='text-sm text-red-500 text-center'>{error}</p>}
          {info && <p className='text-sm text-accent text-center'>{info}</p>}

          <button
            type='submit'
            disabled={submitting}
            className='w-full bg-accent text-white py-3 rounded-xl font-medium hover:bg-accent-hover disabled:opacity-50 transition-colors'
          >
            {submitting ? '...' : submitLabel}
          </button>
        </form>

        <p className='text-center text-sm text-text-soft mt-4'>
          {mode === 'login' && (
            <>
              Don't have an account?{' '}
              <button
                onClick={() => switchMode('signup')}
                className='text-accent font-medium hover:underline'
              >
                Sign up
              </button>
            </>
          )}
          {mode === 'signup' && (
            <>
              Already have an account?{' '}
              <button
                onClick={() => switchMode('login')}
                className='text-accent font-medium hover:underline'
              >
                Log in
              </button>
            </>
          )}
          {mode === 'forgot' && (
            <>
              Remembered it?{' '}
              <button
                onClick={() => switchMode('login')}
                className='text-accent font-medium hover:underline'
              >
                Back to log in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
