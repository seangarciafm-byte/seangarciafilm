import type { License } from '../types'
import { addDays } from './dates'
import { licenseLabel } from './progress'

/** Days before expiration to remind, plus the expiration day itself. */
export const REMINDER_OFFSETS = [90, 30, 7, 0]

const escapeText = (text: string) =>
  text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')

const compact = (iso: string) => iso.replace(/-/g, '')

/** Builds an iCalendar file with all-day reminders for every upcoming renewal. */
export function buildReminderCalendar(licenses: License[], today: string, now = new Date()): string {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//RenewReady//CE Tracker//EN', 'CALSCALE:GREGORIAN']

  for (const license of licenses) {
    for (const offset of REMINDER_OFFSETS) {
      const date = addDays(license.expiresOn, -offset)
      if (date < today) continue
      const label = licenseLabel(license)
      const summary = offset === 0 ? `${label} license expires today` : `${label} license expires in ${offset} days`
      lines.push(
        'BEGIN:VEVENT',
        `UID:${license.id}-${license.expiresOn}-${offset}@renewready`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${compact(date)}`,
        `DTEND;VALUE=DATE:${compact(addDays(date, 1))}`,
        `SUMMARY:${escapeText(summary)}`,
        `DESCRIPTION:${escapeText(`Check your CE hours and mandatory topics before renewing. License ${license.number || ''}`.trim())}`,
        'END:VEVENT',
      )
    }
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n') + '\r\n'
}
