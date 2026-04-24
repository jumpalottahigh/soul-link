import { useState } from 'react'
import { Copy, Link } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { generatePairCode, updateInviteCode, pairWithCode } from '../lib/db'

export function PairingScreen() {
  const { profile, user, refreshProfile } = useAuth()
  const [code, setCode] = useState(profile?.invite_code ?? '')
  const [partnerCode, setPartnerCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleGenerate() {
    if (!user) return
    const newCode = generatePairCode()
    try {
      await updateInviteCode(user.id, newCode)
      setCode(newCode)
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handlePair(e: React.FormEvent) {
    e.preventDefault()
    if (!partnerCode.trim()) return
    setError(null)
    setSubmitting(true)

    try {
      const result = await pairWithCode(partnerCode.toUpperCase().trim())
      if (result.error) {
        setError(result.error)
      } else {
        await refreshProfile()
      }
    } catch (err: any) {
      setError(err.message)
    }
    setSubmitting(false)
  }

  return (
    <div className='min-h-screen bg-page flex items-center justify-center p-6 text-text font-sans'>
      <div className='w-full max-w-sm space-y-6'>
        <div className='text-center'>
          <h1 className='text-3xl font-bold bg-gradient-to-r from-gradient-from to-gradient-to bg-clip-text text-transparent'>
            Soul Link
          </h1>
          <p className='text-sm text-text-soft mt-1'>
            Link with your partner to get started
          </p>
        </div>

        {/* Share Your Code */}
        <div className='bg-card p-6 rounded-3xl border border-border-accent space-y-3'>
          <h3 className='text-accent font-medium text-sm'>Share Your Code</h3>
          {code ? (
            <div className='flex items-center gap-2'>
              <span className='flex-1 text-center text-2xl font-bold tracking-[0.3em] text-text'>
                {code}
              </span>
              <button
                onClick={handleCopy}
                className='p-2 text-accent bg-accent-soft hover:bg-accent-mid rounded-xl transition-colors'
                title='Copy code'
              >
                <Copy size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleGenerate}
              className='w-full bg-accent text-white py-3 rounded-xl font-medium hover:bg-accent-hover transition-colors'
            >
              Generate Code
            </button>
          )}
          {copied && <p className='text-xs text-accent text-center'>Copied!</p>}
          <p className='text-xs text-text-soft text-center'>
            Share this code with your partner so they can link with you
          </p>
        </div>

        {/* Enter Partner's Code */}
        <div className='bg-card p-6 rounded-3xl border border-border-accent space-y-3'>
          <h3 className='text-accent font-medium text-sm'>
            Enter Partner's Code
          </h3>
          <form onSubmit={handlePair} className='flex gap-2'>
            <input
              type='text'
              placeholder='e.g. A3X9K2'
              value={partnerCode}
              onChange={(e) => setPartnerCode(e.target.value)}
              maxLength={6}
              className='flex-1 bg-input border border-border rounded-xl px-4 py-3 text-sm text-text text-center tracking-[0.2em] uppercase placeholder:text-text-soft placeholder:tracking-normal placeholder:normal-case focus:outline-none focus:ring-2 focus:ring-ring transition-all'
            />
            <button
              type='submit'
              disabled={submitting || partnerCode.trim().length < 6}
              className='bg-accent text-white p-3 rounded-xl hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            >
              <Link size={20} />
            </button>
          </form>
          {error && <p className='text-sm text-red-500 text-center'>{error}</p>}
        </div>
      </div>
    </div>
  )
}
