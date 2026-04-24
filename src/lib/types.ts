export type Theme = 'default' | 'dark' | 'cute'

export const THEMES: { key: Theme; label: string; icon: string }[] = [
  { key: 'default', label: 'Rose', icon: '🌸' },
  { key: 'dark', label: 'Night', icon: '🌙' },
  { key: 'cute', label: 'Cute', icon: '🍬' }
]

export interface MoodOption {
  emoji: string
  label: string
}

export interface Invite {
  id: string
  activity: string
  time: string
  status: 'pending' | 'accepted' | 'declined'
  sender: string
}

export const MOOD_OPTIONS: MoodOption[] = [
  { emoji: '👩‍💻', label: 'Work Mode' },
  { emoji: '🍓', label: 'Thinking of you' },
  { emoji: '😫', label: 'Stressed' },
  { emoji: '🔋', label: 'Low Battery' },
  { emoji: '🥰', label: 'Feeling Loved' },
  { emoji: '🏃‍♂️', label: 'Active' }
]

export interface Point {
  x: number
  y: number
}

export interface Stroke {
  points: Point[]
}

export type Drawing = Stroke[]

export type Gender = 'male' | 'female' | 'other'

export const GENDER_OPTIONS: { key: Gender; emoji: string; label: string }[] = [
  { key: 'female', emoji: '👩', label: 'Female' },
  { key: 'male', emoji: '👨', label: 'Male' },
  { key: 'other', emoji: '🧑', label: 'Other' }
]

export interface Profile {
  id: string
  display_name: string
  mood_emoji: string
  mood_label: string
  drawing: Drawing
  gender: Gender
  partner_id: string | null
  invite_code: string | null
}

export const SUGGESTIONS = [
  'eat strawberries in Eira',
  'take a quick walk',
  'grab a coffee',
  'movie night',
  'just cuddle'
]
