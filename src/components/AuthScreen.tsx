import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export function AuthScreen() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const err =
      mode === 'login'
        ? await signIn(email, password)
        : await signUp(email, password, displayName)

    if (err) setError(err)
    setSubmitting(false)
  }

  return (
    <div className='min-h-screen bg-page flex items-center justify-center p-6 text-text font-sans'>
      <div className='w-full max-w-sm'>
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold bg-gradient-to-r from-gradient-from to-gradient-to bg-clip-text text-transparent'>
            Soul Link
          </h1>
          <p className='text-sm text-text-soft mt-1'>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </p>
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
          <input
            type='password'
            placeholder='Password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className='w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-soft focus:outline-none focus:ring-2 focus:ring-ring transition-all'
          />

          {error && <p className='text-sm text-red-500 text-center'>{error}</p>}

          <button
            type='submit'
            disabled={submitting}
            className='w-full bg-accent text-white py-3 rounded-xl font-medium hover:bg-accent-hover disabled:opacity-50 transition-colors'
          >
            {submitting ? '...' : mode === 'login' ? 'Log in' : 'Sign up'}
          </button>
        </form>

        <p className='text-center text-sm text-text-soft mt-4'>
          {mode === 'login'
            ? "Don't have an account? "
            : 'Already have an account? '}
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login')
              setError(null)
            }}
            className='text-accent font-medium hover:underline'
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  )
}
