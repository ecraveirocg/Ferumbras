import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatGold(amount: number): string {
  return amount.toLocaleString('de-DE')
}

export function formatGoldShort(amount: number): string {
  if (amount >= 1_000_000_000) return (amount / 1_000_000_000).toFixed(2) + ' KKK'
  if (amount >= 1_000_000)     return (amount / 1_000_000).toFixed(1)     + ' KK'
  if (amount >= 1_000)         return (amount / 1_000).toFixed(1)         + ' K'
  return String(amount)
}

export function formatHours(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function formatHoursDecimal(minutes: number): string {
  return (minutes / 60).toFixed(1)
}

export function goldPerHour(gold: number, durationMinutes: number): number {
  if (durationMinutes === 0) return 0
  return Math.round((gold / durationMinutes) * 60)
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const VOCATION_LABELS: Record<string, string> = {
  ELITE_KNIGHT:    'Elite Knight',
  ROYAL_PALADIN:   'Royal Paladin',
  MASTER_SORCERER: 'Master Sorcerer',
  ELDER_DRUID:     'Elder Druid',
  EXALTED_MONK:    'Exalted Monk',
}

export const SEX_LABELS: Record<string, string> = {
  MALE: 'Male',
  FEMALE: 'Female',
}

export const VOCATION_COLORS: Record<string, string> = {
  ELITE_KNIGHT:    '#f97316',
  ROYAL_PALADIN:   '#84cc16',
  MASTER_SORCERER: '#3b82f6',
  ELDER_DRUID:     '#d946ef',
  EXALTED_MONK:    '#facc15',
}

export const CHART_COLORS = [
  '#ef4444',
  '#f59e0b',
  '#22c55e',
  '#3b82f6',
  '#8b5cf6',
  '#06b6d4',
  '#f97316',
  '#d946ef',
  '#84cc16',
  '#14b8a6',
]
