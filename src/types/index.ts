export type Sex = 'MALE' | 'FEMALE'

export type Vocation =
  | 'KNIGHT'
  | 'ELITE_KNIGHT'
  | 'PALADIN'
  | 'ROYAL_PALADIN'
  | 'SORCERER'
  | 'MASTER_SORCERER'
  | 'DRUID'
  | 'ELDER_DRUID'

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
  silverEarned: number
  xpGained: number
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface SummaryData {
  totalSilver: number
  avgSilverPerHour: number
  totalHours: number
  sessionsBySpot: SpotSummary[]
  sessionsByClass: ClassSummary[]
  sessionsByDate: DateSummary[]
  recentSessions: HuntSession[]
}

export interface SpotSummary {
  spotId: number
  spotName: string
  totalSilver: number
  totalMinutes: number
  sessionCount: number
  silverPerHour: number
}

export interface ClassSummary {
  vocation: Vocation
  totalSilver: number
  totalMinutes: number
  sessionCount: number
  silverPerHour: number
}

export interface DateSummary {
  date: string
  totalSilver: number
  totalMinutes: number
  sessionCount: number
  silverPerHour: number
}

export type TimeFilter = 'all' | '7d' | '30d' | '90d'
export type ViewTab = 'spot' | 'class' | 'overtime'
