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

export const SUGGESTIONS = [
  'eat strawberries in Eira',
  'take a quick walk',
  'grab a coffee',
  'movie night',
  'just cuddle'
]
