import type { AppData } from '../types'
import { formatDate } from '../lib/dates'
import { formatHours, getProgress, licenseLabel } from '../lib/progress'

interface Props {
  data: AppData
  today: string
  onBack: () => void
}

/** Print-ready summary of each license's current cycle, for audits and renewals. */
export function AuditReport({ data, today, onBack }: Props) {
  return (
    <main className="report">
      <div className="report-toolbar no-print">
        <button type="button" className="button" onClick={onBack}>
          ← Back
        </button>
        <button type="button" className="button primary" onClick={() => window.print()}>
          Print or save as PDF
        </button>
      </div>

      <h1>Continuing education record</h1>
      <p className="muted">Prepared {formatDate(today)}</p>

      {data.licenses.map((license) => {
        const p = getProgress(license, data.courses, today)
        return (
          <section key={license.id} className="report-section">
            <h2>
              {licenseLabel(license)}
              {license.number && <span className="muted"> · #{license.number}</span>}
            </h2>
            <p>
              Cycle {formatDate(p.cycleStart)} – {formatDate(license.expiresOn)} · {formatHours(p.earned)} of{' '}
              {formatHours(license.totalHours)} completed
            </p>
            {p.topics.length > 0 && (
              <p>
                Mandatory topics:{' '}
                {p.topics
                  .map((t) => `${t.requirement.topic} ${t.remaining === 0 ? '(met)' : `(${formatHours(t.remaining)} needed)`}`)
                  .join(', ')}
              </p>
            )}
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Course</th>
                  <th>Provider</th>
                  <th>Topic</th>
                  <th className="num">Hours</th>
                  <th>Certificate</th>
                </tr>
              </thead>
              <tbody>
                {p.courses.map((c) => (
                  <tr key={c.id}>
                    <td>{formatDate(c.completedOn)}</td>
                    <td>{c.title}</td>
                    <td>{c.provider}</td>
                    <td>{c.topic}</td>
                    <td className="num">{c.hours}</td>
                    <td>{c.certificate ? 'On file' : 'Missing'}</td>
                  </tr>
                ))}
                {p.courses.length === 0 && (
                  <tr>
                    <td colSpan={6} className="muted">
                      No courses logged in this cycle.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        )
      })}
    </main>
  )
}
