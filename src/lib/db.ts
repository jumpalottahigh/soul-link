import { supabase } from './supabase'
import type { MoodOption, Invite, Drawing, Gender } from './types'

// --- Profiles ---

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

export async function fetchPartnerProfile(partnerId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', partnerId)
    .single()
  if (error) throw error
  return data
}

export async function updateMyMood(userId: string, mood: MoodOption) {
  const { error } = await supabase
    .from('profiles')
    .update({ mood_emoji: mood.emoji, mood_label: mood.label, updated_at: new Date().toISOString() })
    .eq('id', userId)
  if (error) throw error
}

export async function updateMyDrawing(userId: string, drawing: Drawing) {
  const { error } = await supabase
    .from('profiles')
    .update({ drawing, updated_at: new Date().toISOString() })
    .eq('id', userId)
  if (error) throw error
}

export async function updateMyGender(userId: string, gender: Gender) {
  const { error } = await supabase
    .from('profiles')
    .update({ gender, updated_at: new Date().toISOString() })
    .eq('id', userId)
  if (error) throw error
}

// --- Pairing ---

export function generatePairCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function updateInviteCode(userId: string, code: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ invite_code: code })
    .eq('id', userId)
  if (error) throw error
}

export async function pairWithCode(code: string) {
  const { data, error } = await supabase.rpc('pair_with_code', { code })
  if (error) throw error
  return data as { success?: boolean; partner_id?: string; error?: string }
}

// --- Invites ---

export async function fetchInvites(userId: string) {
  const { data, error } = await supabase
    .from('invites')
    .select('*')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createInvite(senderId: string, receiverId: string, activity: string, time: string) {
  const { error } = await supabase
    .from('invites')
    .insert({ sender_id: senderId, receiver_id: receiverId, activity, time })
  if (error) throw error
}

export async function updateInviteStatus(inviteId: string, status: 'accepted' | 'declined') {
  const { error } = await supabase
    .from('invites')
    .update({ status })
    .eq('id', inviteId)
  if (error) throw error
}

export function mapDbInviteToInvite(row: any, currentUserId: string): Invite {
  return {
    id: row.id,
    activity: row.activity,
    time: row.time,
    status: row.status,
    sender: row.sender_id === currentUserId ? 'me' : 'partner',
  }
}
