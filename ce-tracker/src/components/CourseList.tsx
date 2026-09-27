import type { Course, License } from '../types'
import { formatDate } from '../lib/dates'
import { formatHours, licenseLabel } from '../lib/progress'

interface Props {
  courses: Course[]
  licenses: License[]
  onEdit: (course: Course) => void
  onOpenCertificate: (course: Course) => void
}

export function CourseList({ courses, licenses, onEdit, onOpenCertificate }: Props) {
  if (courses.length === 0) {
    return <p className="muted empty-note">No courses logged yet. Add each course when you finish it and keep the certificate here.</p>
  }

  const labels = new Map(licenses.map((l) => [l.id, licenseLabel(l)]))
  const sorted = [...courses].sort((a, b) => b.completedOn.localeCompare(a.completedOn))

  return (
    <ul className="course-list">
      {sorted.map((c) => (
        <li key={c.id} className="card course">
          <button type="button" className="course-main" onClick={() => onEdit(c)}>
            <span className="course-title">{c.title}</span>
            <span className="muted small">
              {formatDate(c.completedOn)}
              {c.provider && ` · ${c.provider}`}
            </span>
            <span className="tags">
              {c.topic && <span className="tag topic-tag">{c.topic}</span>}
              {c.licenseIds.map((id) => labels.get(id) && <span key={id} className="tag">{labels.get(id)}</span>)}
            </span>
          </button>
          <div className="course-side">
            <strong>{formatHours(c.hours)}</strong>
            {c.certificate ? (
              <button type="button" className="link-button small" onClick={() => onOpenCertificate(c)}>
                Certificate
              </button>
            ) : (
              <span className="muted small">No certificate</span>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
