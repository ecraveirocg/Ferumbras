export type Sex = 'MALE' | 'FEMALE'

export type Vocation =
  | 'ELITE_KNIGHT'
  | 'ROYAL_PALADIN'
  | 'MASTER_SORCERER'
  | 'ELDER_DRUID'
  | 'EXALTED_MONK'

export interface Character {
  id: number
  name: string
  sex: Sex
  level: number
  vocation: Vocation
  world: string
  createdAt: string
  updatedAt: string
}

export interface Spot {
  id: number
  name: string
}

export interface HuntSession {
  id: number
  characterId: number
  character: Character
  spotId: number
  spot: Spot
  startedAt: string
  duration: number
  goldEarned: number
  xpGained: number
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface SummaryData {
  totalGold: number
  avgGoldPerHour: number
  totalHours: number
  totalXp: number
  daysActive: number
  currentStreak: number
  longestStreak: number
  sessionsBySpot: SpotSummary[]
  sessionsByClass: ClassSummary[]
  sessionsByDate: DateSummary[]
  recentSessions: HuntSession[]
}

export interface SpotSummary {
  spotId: number
  spotName: string
  totalGold: number
  totalXp: number
  totalMinutes: number
  sessionCount: number
  goldPerHour: number
  xpPerHour: number
}

export interface ClassSummary {
  vocation: Vocation
  totalGold: number
  totalXp: number
  totalMinutes: number
  sessionCount: number
  goldPerHour: number
  xpPerHour: number
}

export interface DateSummary {
  date: string
  totalGold: number
  totalXp: number
  totalMinutes: number
  sessionCount: number
  goldPerHour: number
  xpPerHour: number
}

export type TimeFilter = 'all' | '7d' | '30d' | '90d'
export type ViewTab = 'spot' | 'class' | 'overtime'
