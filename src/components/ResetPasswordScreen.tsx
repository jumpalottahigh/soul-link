import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export function ResetPasswordScreen() {
  const { updatePassword, signOut } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    const err = await updatePassword(password)
    setSubmitting(false)
    if (err) setError(err)
  }

  return (
    <div className='h-screen bg-page flex items-center justify-center p-6 text-text font-sans overflow-hidden'>
      <div className='w-full max-w-sm'>
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold bg-gradient-to-r from-gradient-from to-gradient-to bg-clip-text text-transparent'>
            Soul Link
          </h1>
          <p className='text-sm text-text-soft mt-1'>Choose a new password</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className='bg-card p-6 rounded-3xl border border-border-accent space-y-4'
        >
          <input
            type='password'
            placeholder='New password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className='w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-soft focus:outline-none focus:ring-2 focus:ring-ring transition-all'
          />
          <input
            type='password'
            placeholder='Confirm new password'
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
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
            {submitting ? '...' : 'Update password'}
          </button>
        </form>

        <p className='text-center text-sm text-text-soft mt-4'>
          <button
            onClick={() => signOut()}
            className='text-accent font-medium hover:underline'
          >
            Cancel
          </button>
        </p>
      </div>
    </div>
  )
}
