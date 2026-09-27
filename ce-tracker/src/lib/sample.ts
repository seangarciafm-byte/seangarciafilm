import type { AppData } from '../types'
import { addDays, addMonths } from './dates'

/** Demo data so a first-time visitor can see a filled-in dashboard. Not real board requirements. */
export function sampleData(today: string): AppData {
  const rn = crypto.randomUUID()
  const np = crypto.randomUUID()
  return {
    licenses: [
      {
        id: rn,
        profession: 'RN',
        state: 'CA',
        number: 'EXAMPLE',
        expiresOn: addMonths(today, 7),
        cycleMonths: 24,
        totalHours: 30,
        requirements: [{ id: crypto.randomUUID(), topic: 'Implicit bias', hours: 1 }],
      },
      {
        id: np,
        profession: 'APRN / NP',
        state: 'TX',
        number: 'EXAMPLE',
        expiresOn: addDays(today, 75),
        cycleMonths: 24,
        totalHours: 20,
        requirements: [
          { id: crypto.randomUUID(), topic: 'Jurisprudence & ethics', hours: 2 },
          { id: crypto.randomUUID(), topic: 'Prescribing controlled substances', hours: 3 },
        ],
      },
    ],
    courses: [
      {
        id: crypto.randomUUID(),
        title: 'Sepsis recognition and early management',
        provider: 'Example CE Co.',
        completedOn: addDays(today, -40),
        hours: 6,
        topic: '',
        licenseIds: [rn, np],
      },
      {
        id: crypto.randomUUID(),
        title: 'Implicit bias in healthcare',
        provider: 'Example CE Co.',
        completedOn: addDays(today, -120),
        hours: 1,
        topic: 'Implicit bias',
        licenseIds: [rn],
      },
      {
        id: crypto.randomUUID(),
        title: 'Nursing jurisprudence and ethics',
        provider: 'Example CE Co.',
        completedOn: addDays(today, -200),
        hours: 2,
        topic: 'Jurisprudence & ethics',
        licenseIds: [np],
      },
      {
        id: crypto.randomUUID(),
        title: 'Pain management update',
        provider: 'Example CE Co.',
        completedOn: addDays(today, -300),
        hours: 8,
        topic: '',
        licenseIds: [rn, np],
      },
    ],
  }
}
