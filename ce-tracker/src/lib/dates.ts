// All dates are ISO calendar strings (YYYY-MM-DD) handled in UTC so that
// time zones and daylight-saving changes never shift a deadline by a day.

const DAY_MS = 86_400_000

const pad = (n: number) => String(n).padStart(2, '0')

export function parseDate(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

function toISO(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

/** Today's date in the user's local time zone. */
export function todayISO(now = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function addDays(iso: string, days: number): string {
  return toISO(parseDate(iso) + days * DAY_MS)
}

/** Adds calendar months, clamping to the last day of the month (Jan 31 + 1 month = Feb 28/29). */
export function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const index = m - 1 + months
  const year = y + Math.floor(index / 12)
  const month = ((index % 12) + 12) % 12
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  return toISO(Date.UTC(year, month, Math.min(d, lastDay)))
}

export function daysBetween(from: string, to: string): number {
  return Math.round((parseDate(to) - parseDate(from)) / DAY_MS)
}

export function formatDate(iso: string): string {
  return new Date(parseDate(iso)).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function isISODate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parseDate(value))
}
