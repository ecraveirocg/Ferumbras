import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSilver(amount: number): string {
  return amount.toLocaleString('de-DE')
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

export function silverPerHour(silver: number, durationMinutes: number): number {
  if (durationMinutes === 0) return 0
  return Math.round((silver / durationMinutes) * 60)
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
  KNIGHT: 'Knight',
  ELITE_KNIGHT: 'Elite Knight',
  PALADIN: 'Paladin',
  ROYAL_PALADIN: 'Royal Paladin',
  SORCERER: 'Sorcerer',
  MASTER_SORCERER: 'Master Sorcerer',
  DRUID: 'Druid',
  ELDER_DRUID: 'Elder Druid',
}

export const SEX_LABELS: Record<string, string> = {
  MALE: 'Male',
  FEMALE: 'Female',
}

export const VOCATION_COLORS: Record<string, string> = {
  KNIGHT: '#ef4444',
  ELITE_KNIGHT: '#f97316',
  PALADIN: '#eab308',
  ROYAL_PALADIN: '#84cc16',
  SORCERER: '#06b6d4',
  MASTER_SORCERER: '#3b82f6',
  DRUID: '#8b5cf6',
  ELDER_DRUID: '#d946ef',
}

export const CHART_COLORS = [
  '#3b82f6',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#f97316',
  '#d946ef',
  '#84cc16',
  '#14b8a6',
]
