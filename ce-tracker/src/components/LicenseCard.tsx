import type { License } from '../types'
import { formatDate } from '../lib/dates'
import { STATUS_LABEL, formatHours, licenseLabel, type LicenseProgress } from '../lib/progress'

interface Props {
  license: License
  progress: LicenseProgress
  onEdit: () => void
  onLogCourse: () => void
  onRenewed: () => void
}

function daysLeftText(days: number): string {
  if (days < 0) return `${-days} day${days === -1 ? '' : 's'} ago`
  if (days === 0) return 'today'
  return `in ${days} day${days === 1 ? '' : 's'}`
}

export function LicenseCard({ license, progress, onEdit, onLogCourse, onRenewed }: Props) {
  const percent = license.totalHours > 0 ? Math.min(100, (progress.earned / license.totalHours) * 100) : 100

  return (
    <article className={`card license-card status-${progress.status}`}>
      <header className="license-header">
        <div>
          <h3>{licenseLabel(license)}</h3>
          {license.number && <p className="muted">#{license.number}</p>}
        </div>
        <span className="badge">{STATUS_LABEL[progress.status]}</span>
      </header>

      <div className="hours">
        <strong>{formatHours(progress.earned)}</strong>
        <span className="muted"> of {formatHours(license.totalHours)}</span>
      </div>
      <div
        className="progress"
        role="progressbar"
        aria-label="CE hours completed"
        aria-valuemin={0}
        aria-valuemax={license.totalHours}
        aria-valuenow={progress.earned}
      >
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <p className="muted small">
        {progress.remaining > 0 ? `${formatHours(progress.remaining)} to go · ` : 'All hours done · '}
        renews {formatDate(license.expiresOn)} ({daysLeftText(progress.daysLeft)})
      </p>

      {progress.topics.length > 0 && (
        <ul className="topics">
          {progress.topics.map((t) => (
            <li key={t.requirement.id} className={t.remaining === 0 ? 'topic done' : 'topic'}>
              <span aria-hidden="true">{t.remaining === 0 ? '✓' : '○'}</span>
              {t.requirement.topic}
              <span className="muted">
                {formatHours(Math.min(t.earned, t.requirement.hours))} / {formatHours(t.requirement.hours)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <footer className="card-actions">
        <button type="button" className="button primary small" onClick={onLogCourse}>
          Log a course
        </button>
        <button type="button" className="button small" onClick={onEdit}>
          Edit
        </button>
        {(progress.status === 'complete' || progress.status === 'expired') && (
          <button type="button" className="button small" onClick={onRenewed}>
            I renewed
          </button>
        )}
      </footer>
    </article>
  )
}
