import { useState, type FormEvent } from 'react'
import type { Course, License } from '../types'
import { todayISO } from '../lib/dates'
import { licenseLabel } from '../lib/progress'
import { Modal } from './Modal'

const MAX_FILE_BYTES = 15 * 1024 * 1024

interface Props {
  course?: Course
  licenses: License[]
  defaultLicenseIds: string[]
  /** `file` is a new certificate, `null` removes the existing one, `undefined` leaves it unchanged. */
  onSave: (course: Course, file: File | null | undefined) => void
  onDelete?: () => void
  onClose: () => void
}

export function CourseForm({ course, licenses, defaultLicenseIds, onSave, onDelete, onClose }: Props) {
  const [title, setTitle] = useState(course?.title ?? '')
  const [provider, setProvider] = useState(course?.provider ?? '')
  const [completedOn, setCompletedOn] = useState(course?.completedOn ?? todayISO())
  const [hours, setHours] = useState(course ? String(course.hours) : '')
  const [topic, setTopic] = useState(course?.topic ?? '')
  const [licenseIds, setLicenseIds] = useState<string[]>(course?.licenseIds ?? defaultLicenseIds)
  const [file, setFile] = useState<File | null | undefined>(undefined)
  const [error, setError] = useState('')

  const topics = [
    ...new Set(licenses.filter((l) => licenseIds.includes(l.id)).flatMap((l) => l.requirements.map((r) => r.topic))),
  ]
  const certificateName = file === undefined ? course?.certificate?.name : file?.name

  const toggleLicense = (id: string) =>
    setLicenseIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (licenses.length > 0 && licenseIds.length === 0) {
      setError('Choose at least one license this course counts toward.')
      return
    }
    const certificate =
      file === undefined ? course?.certificate : file ? { name: file.name, type: file.type, size: file.size } : undefined
    onSave(
      {
        id: course?.id ?? crypto.randomUUID(),
        title: title.trim(),
        provider: provider.trim(),
        completedOn,
        hours: Number(hours) || 0,
        topic: topic.trim(),
        licenseIds,
        certificate,
      },
      file,
    )
  }

  return (
    <Modal title={course ? 'Edit course' : 'Log a course'} onClose={onClose}>
      <form onSubmit={submit} className="form">
        <label className="field">
          <span>Course title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
        </label>
        <label className="field">
          <span>
            Provider <em>optional</em>
          </span>
          <input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="e.g. NetCE, CEUfast" />
        </label>
        <div className="field-row">
          <label className="field">
            <span>Completed on</span>
            <input type="date" value={completedOn} onChange={(e) => setCompletedOn(e.target.value)} required />
          </label>
          <label className="field field-narrow">
            <span>Hours</span>
            <input
              type="number"
              min="0.25"
              step="0.25"
              inputMode="decimal"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              required
            />
          </label>
        </div>

        {licenses.length > 0 && (
          <fieldset className="field">
            <legend>Counts toward</legend>
            <div className="chips">
              {licenses.map((l) => (
                <label key={l.id} className="chip-toggle">
                  <input type="checkbox" checked={licenseIds.includes(l.id)} onChange={() => toggleLicense(l.id)} />
                  <span>{licenseLabel(l)}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <label className="field">
          <span>
            Mandatory topic <em>optional</em>
          </span>
          <input
            list="topics"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={topics.length ? `e.g. ${topics[0]}` : 'Leave blank for general hours'}
          />
          <datalist id="topics">
            {topics.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </label>

        <div className="field">
          <span>
            Certificate <em>optional</em>
          </span>
          {certificateName ? (
            <div className="file-pill">
              <span className="file-name">{certificateName}</span>
              <button type="button" className="link-button" onClick={() => setFile(null)}>
                Remove
              </button>
            </div>
          ) : (
            <label className="upload">
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => {
                  const picked = e.target.files?.[0]
                  if (!picked) return
                  if (picked.size > MAX_FILE_BYTES) {
                    setError('That file is over 15 MB. Try a smaller PDF or photo.')
                    return
                  }
                  setError('')
                  setFile(picked)
                }}
              />
              <span>Upload a PDF or take a photo</span>
            </label>
          )}
        </div>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <footer className="form-actions">
          {onDelete && (
            <button type="button" className="button danger" onClick={onDelete}>
              Delete
            </button>
          )}
          <span className="spacer" />
          <button type="button" className="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="button primary">
            Save course
          </button>
        </footer>
      </form>
    </Modal>
  )
}
