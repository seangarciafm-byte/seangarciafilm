/** A mandatory topic the board requires each cycle, e.g. "Implicit bias" for 1 hour. */
export interface Requirement {
  id: string
  topic: string
  hours: number
}

export interface License {
  id: string
  profession: string
  state: string
  number: string
  /** ISO date (YYYY-MM-DD) the current license period ends. */
  expiresOn: string
  /** Length of one renewal cycle in months (usually 24). */
  cycleMonths: number
  /** Total CE / contact hours required per cycle. */
  totalHours: number
  requirements: Requirement[]
}

/** Metadata for a certificate file; the file itself lives in IndexedDB keyed by course id. */
export interface Certificate {
  name: string
  type: string
  size: number
}

export interface Course {
  id: string
  title: string
  provider: string
  /** ISO date (YYYY-MM-DD) the course was completed. */
  completedOn: string
  hours: number
  /** Mandatory topic this course satisfies, matched to requirements by name. Empty if general. */
  topic: string
  /** Licenses this course counts toward (one course often counts for several). */
  licenseIds: string[]
  certificate?: Certificate
}

export interface AppData {
  licenses: License[]
  courses: Course[]
}
