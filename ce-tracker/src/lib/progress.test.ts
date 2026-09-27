import { describe, expect, it } from 'vitest'
import type { Course, License } from '../types'
import { addMonths, daysBetween } from './dates'
import { buildReminderCalendar } from './ics'
import { cycleStart, getProgress } from './progress'
import { parseData } from './storage'

const license: License = {
  id: 'rn',
  profession: 'RN',
  state: 'CA',
  number: '123',
  expiresOn: '2027-06-30',
  cycleMonths: 24,
  totalHours: 30,
  requirements: [{ id: 'r1', topic: 'Implicit bias', hours: 1 }],
}

const course = (overrides: Partial<Course>): Course => ({
  id: crypto.randomUUID(),
  title: 'Course',
  provider: 'Provider',
  completedOn: '2026-01-15',
  hours: 5,
  topic: '',
  licenseIds: ['rn'],
  ...overrides,
})

describe('dates', () => {
  it('clamps to the end of shorter months', () => {
    expect(addMonths('2025-01-31', 1)).toBe('2025-02-28')
    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29')
    expect(addMonths('2027-06-30', -24)).toBe('2025-06-30')
  })

  it('counts days across a DST change without drift', () => {
    expect(daysBetween('2026-03-01', '2026-04-01')).toBe(31)
  })
})

describe('getProgress', () => {
  it('only counts courses in the current cycle for this license', () => {
    const courses = [
      course({ hours: 10 }),
      course({ hours: 4, completedOn: '2025-06-30' }), // last day of the previous cycle
      course({ hours: 3, licenseIds: ['other'] }),
      course({ hours: 2, completedOn: '2027-07-01' }), // after expiration
    ]
    const progress = getProgress(license, courses, '2026-02-01')
    expect(cycleStart(license)).toBe('2025-06-30')
    expect(progress.earned).toBe(10)
    expect(progress.remaining).toBe(20)
  })

  it('matches mandatory topics case-insensitively', () => {
    const progress = getProgress(license, [course({ hours: 1, topic: ' implicit BIAS ' })], '2026-02-01')
    expect(progress.topics[0].remaining).toBe(0)
    expect(progress.earned).toBe(1)
  })

  it('is complete only when total hours and every topic are met', () => {
    const allHours = [course({ hours: 30 })]
    expect(getProgress(license, allHours, '2026-02-01').status).toBe('on-track')
    const withTopic = [...allHours, course({ hours: 1, topic: 'Implicit bias' })]
    expect(getProgress(license, withTopic, '2026-02-01').status).toBe('complete')
  })

  it('flags licenses that are behind, due soon, or expired', () => {
    expect(getProgress(license, [], '2025-09-01').status).toBe('on-track')
    expect(getProgress(license, [], '2026-10-01').status).toBe('behind') // ~65% of cycle used, 0% done
    expect(getProgress(license, [course({ hours: 25, completedOn: '2027-01-01' })], '2027-04-15').status).toBe('behind')
    expect(getProgress(license, [], '2027-06-10').status).toBe('urgent')
    expect(getProgress(license, [], '2027-07-01').status).toBe('expired')
  })
})

describe('buildReminderCalendar', () => {
  it('creates reminders only for upcoming dates', () => {
    const ics = buildReminderCalendar([license], '2027-05-15', new Date('2027-05-15T12:00:00Z'))
    expect(ics).not.toContain('DTSTART;VALUE=DATE:20270331') // 90 days out, already past
    expect(ics).toContain('DTSTART;VALUE=DATE:20270531') // 30 days out
    expect(ics).toContain('SUMMARY:RN · CA license expires today')
    expect(ics.split('BEGIN:VEVENT')).toHaveLength(4)
  })
})

describe('parseData', () => {
  it('rejects malformed data', () => {
    expect(parseData({ licenses: [license], courses: [] })).not.toBeNull()
    expect(parseData({ licenses: [{ ...license, expiresOn: 'soon' }], courses: [] })).toBeNull()
    expect(parseData(null)).toBeNull()
  })
})
