import { useState } from 'react'
import { CalendarClock, Send, Check, X } from 'lucide-react'
import { SUGGESTIONS } from '../lib/types'
import type { Invite } from '../lib/types'
import { createInvite, updateInviteStatus } from '../lib/db'

interface Props {
  invites: Invite[]
  userId: string
  partnerId: string
}

export function InvitesView({ invites, userId, partnerId }: Props) {
  const [newActivity, setNewActivity] = useState('')
  const [newTime, setNewTime] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!newActivity.trim() || sending) return

    setSending(true)
    try {
      await createInvite(userId, partnerId, newActivity, newTime || 'Whenever!')
      setNewActivity('')
      setNewTime('')
    } catch (err) {
      console.error('Failed to send invite:', err)
    }
    setSending(false)
  }

  async function handleResponse(id: string, newStatus: 'accepted' | 'declined') {
    try {
      await updateInviteStatus(id, newStatus)
    } catch (err) {
      console.error('Failed to update invite:', err)
    }
  }

  return (
    <div className='space-y-6 animate-fade-in flex flex-col h-full'>
      {/* Invite Form */}
      <div className='bg-card p-5 rounded-3xl shadow-sm border border-border-accent'>
        <h3 className='text-accent font-medium text-sm mb-3'>
          Send a cute invite 💌
        </h3>
        <form onSubmit={handleSend} className='space-y-3'>
          <div>
            <input
              type='text'
              placeholder='e.g. eat strawberries in Eira'
              value={newActivity}
              onChange={(e) => setNewActivity(e.target.value)}
              className='w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-soft focus:outline-none focus:ring-2 focus:ring-ring transition-all'
            />
            {/* Quick Suggestions */}
            <div className='flex flex-wrap gap-2 mt-2'>
              {SUGGESTIONS.map((sug, idx) => (
                <button
                  key={idx}
                  type='button'
                  onClick={() => setNewActivity(sug)}
                  className='text-xs bg-accent-soft text-accent px-3 py-1.5 rounded-full hover:bg-accent-mid transition-colors'
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          <div className='flex gap-2'>
            <input
              type='text'
              placeholder='Time (e.g. sunset)'
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className='flex-1 bg-input border border-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-soft focus:outline-none focus:ring-2 focus:ring-ring transition-all'
            />
            <button
              type='submit'
              disabled={!newActivity.trim() || sending}
              className='bg-accent text-white p-3 rounded-xl hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            >
              <Send size={20} />
            </button>
          </div>
        </form>
      </div>

      {/* Invites List */}
      <div className='flex-1 overflow-y-auto space-y-3 pb-24'>
        <h3 className='text-text-soft font-medium text-xs uppercase tracking-wider ml-2'>
          Recent Invites
        </h3>
        {invites.length === 0 ? (
          <div className='text-center text-text-soft text-sm py-8'>
            No invites yet. Send one!
          </div>
        ) : (
          invites.map((invite) => (
            <div
              key={invite.id}
              className='bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center justify-between'
            >
              <div>
                <div className='font-medium text-text'>
                  {invite.activity}
                </div>
                <div className='text-sm text-text-soft flex items-center gap-1 mt-0.5'>
                  <CalendarClock size={14} />
                  {invite.time}
                </div>
              </div>

              <div className='flex gap-2'>
                {invite.status === 'pending' && invite.sender === 'partner' ? (
                  <>
                    <button
                      onClick={() => handleResponse(invite.id, 'declined')}
                      className='p-2 text-text-soft hover:bg-muted rounded-full transition-colors'
                    >
                      <X size={18} />
                    </button>
                    <button
                      onClick={() => handleResponse(invite.id, 'accepted')}
                      className='p-2 text-accent bg-accent-soft hover:bg-accent-mid rounded-full transition-colors'
                    >
                      <Check size={18} />
                    </button>
                  </>
                ) : invite.status === 'pending' ? (
                  <span className='text-xs font-medium px-3 py-1 rounded-full bg-muted text-muted-text'>
                    Pending
                  </span>
                ) : (
                  <span
                    className={`text-xs font-medium px-3 py-1 rounded-full ${
                      invite.status === 'accepted'
                        ? 'bg-success text-success-text'
                        : 'bg-muted text-muted-text'
                    }`}
                  >
                    {invite.status.charAt(0).toUpperCase() +
                      invite.status.slice(1)}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
