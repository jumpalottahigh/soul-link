import { supabase } from './supabase'
import type { MoodOption, Invite, Drawing, Gender } from './types'
import type { PlannerEvent, Trip } from './trip/types'

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

export async function updateMyMood(
  userId: string,
  mood: MoodOption,
  recentMoods: MoodOption[]
) {
  const { error } = await supabase
    .from('profiles')
    .update({
      mood_emoji: mood.emoji,
      mood_label: mood.label,
      recent_moods: recentMoods,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
  if (error) throw error
}

export function addToRecentMoods(
  current: MoodOption[],
  mood: MoodOption,
  max = 5
): MoodOption[] {
  const filtered = current.filter(
    (m) => !(m.emoji === mood.emoji && m.label === mood.label)
  )
  return [mood, ...filtered].slice(0, max)
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

export async function updateDisplayName(userId: string, displayName: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName, updated_at: new Date().toISOString() })
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
  return data as DbInvite[]
}

export async function createInvite(
  senderId: string,
  receiverId: string,
  activity: string,
  time: string
) {
  const { error } = await supabase
    .from('invites')
    .insert({ sender_id: senderId, receiver_id: receiverId, activity, time })
  if (error) throw error
}

export async function updateInviteStatus(
  inviteId: string,
  status: 'accepted' | 'declined'
) {
  const { error } = await supabase
    .from('invites')
    .update({ status })
    .eq('id', inviteId)
  if (error) throw error
}

export interface DbInvite {
  id: string
  sender_id: string
  receiver_id: string
  activity: string
  time: string
  status: Invite['status']
}

export function mapDbInviteToInvite(
  row: DbInvite,
  currentUserId: string
): Invite {
  return {
    id: row.id,
    activity: row.activity,
    time: row.time,
    status: row.status,
    sender: row.sender_id === currentUserId ? 'me' : 'partner'
  }
}

// --- Trip planner ---

export interface DbTrip {
  id: string
  name: string
  start_date: string
  end_date: string
}

export interface DbTripEvent {
  id: string
  trip_id: string
  title: string
  date: string
  start_minute: number
  end_minute: number
}

export async function fetchTrips() {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as DbTrip[]
}

export async function insertTrip(ownerId: string, trip: Trip) {
  const { error } = await supabase.from('trips').insert({
    id: trip.id,
    owner_id: ownerId,
    name: trip.name,
    start_date: trip.startDate,
    end_date: trip.endDate
  })
  if (error) throw error
}

export async function updateTrip(
  tripId: string,
  fields: Partial<Omit<Trip, 'id'>>
) {
  const { error } = await supabase
    .from('trips')
    .update({
      ...(fields.name !== undefined && { name: fields.name }),
      ...(fields.startDate !== undefined && { start_date: fields.startDate }),
      ...(fields.endDate !== undefined && { end_date: fields.endDate }),
      updated_at: new Date().toISOString()
    })
    .eq('id', tripId)
  if (error) throw error
}

export async function deleteTrip(tripId: string) {
  const { error } = await supabase.from('trips').delete().eq('id', tripId)
  if (error) throw error
}

export function mapDbTrip(row: DbTrip): Trip {
  return {
    id: row.id,
    name: row.name,
    startDate: row.start_date,
    endDate: row.end_date
  }
}

export async function fetchTripEvents(tripId: string) {
  const { data, error } = await supabase
    .from('trip_events')
    .select('*')
    .eq('trip_id', tripId)
  if (error) throw error
  return data as DbTripEvent[]
}

export async function upsertTripEvent(tripId: string, event: PlannerEvent) {
  const { error } = await supabase.from('trip_events').upsert({
    id: event.id,
    trip_id: tripId,
    title: event.title,
    date: event.date,
    start_minute: event.startMinute,
    end_minute: event.endMinute,
    updated_at: new Date().toISOString()
  })
  if (error) throw error
}

export async function deleteTripEvent(id: string) {
  const { error } = await supabase.from('trip_events').delete().eq('id', id)
  if (error) throw error
}

export function mapDbTripEvent(row: DbTripEvent): PlannerEvent {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    startMinute: row.start_minute,
    endMinute: row.end_minute
  }
}
