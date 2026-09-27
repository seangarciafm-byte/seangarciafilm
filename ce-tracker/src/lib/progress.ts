import type { Course, License, Requirement } from '../types'
import { addMonths, daysBetween } from './dates'

export type Status = 'complete' | 'on-track' | 'behind' | 'urgent' | 'expired'

export interface TopicProgress {
  requirement: Requirement
  earned: number
  remaining: number
}

export interface LicenseProgress {
  cycleStart: string
  courses: Course[]
  earned: number
  remaining: number
  topics: TopicProgress[]
  daysLeft: number
  status: Status
}

export const STATUS_LABEL: Record<Status, string> = {
  complete: 'Ready to renew',
  'on-track': 'On track',
  behind: 'Falling behind',
  urgent: 'Due soon',
  expired: 'Past renewal date',
}

const normalize = (topic: string) => topic.trim().toLowerCase()
const sumHours = (courses: Course[]) => Math.round(courses.reduce((total, c) => total + c.hours, 0) * 100) / 100

export function topicMatches(course: Course, requirement: Requirement): boolean {
  return course.topic.trim() !== '' && normalize(course.topic) === normalize(requirement.topic)
}

export function cycleStart(license: License): string {
  return addMonths(license.expiresOn, -license.cycleMonths)
}

/**
 * Courses that count toward the license's current cycle. The start date is
 * exclusive because it is also the previous cycle's expiration date.
 */
export function coursesInCycle(license: License, courses: Course[]): Course[] {
  const start = cycleStart(license)
  return courses
    .filter((c) => c.licenseIds.includes(license.id) && c.completedOn > start && c.completedOn <= license.expiresOn)
    .sort((a, b) => b.completedOn.localeCompare(a.completedOn))
}

export function getProgress(license: License, courses: Course[], today: string): LicenseProgress {
  const start = cycleStart(license)
  const counted = coursesInCycle(license, courses)
  const earned = sumHours(counted)
  const remaining = Math.max(0, license.totalHours - earned)
  const topics = license.requirements.map((requirement) => {
    const topicEarned = sumHours(counted.filter((c) => topicMatches(c, requirement)))
    return { requirement, earned: topicEarned, remaining: Math.max(0, requirement.hours - topicEarned) }
  })
  const daysLeft = daysBetween(today, license.expiresOn)
  const done = remaining === 0 && topics.every((t) => t.remaining === 0)

  let status: Status
  if (daysLeft < 0) {
    status = 'expired'
  } else if (done) {
    status = 'complete'
  } else if (daysLeft <= 30) {
    status = 'urgent'
  } else {
    // Behind when renewal is close, or when much more of the cycle has passed
    // than the share of hours completed.
    const cycleDays = Math.max(1, daysBetween(start, license.expiresOn))
    const timeUsed = Math.min(1, Math.max(0, 1 - daysLeft / cycleDays))
    const hoursDone = license.totalHours > 0 ? Math.min(1, earned / license.totalHours) : 1
    status = daysLeft <= 90 || timeUsed - hoursDone > 1 / 3 ? 'behind' : 'on-track'
  }

  return { cycleStart: start, courses: counted, earned, remaining, topics, daysLeft, status }
}

export function formatHours(hours: number): string {
  return `${Number.isInteger(hours) ? hours : hours.toFixed(2).replace(/0$/, '')} hr${hours === 1 ? '' : 's'}`
}

export function licenseLabel(license: License): string {
  return [license.profession, license.state].filter(Boolean).join(' · ')
}
