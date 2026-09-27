import { useEffect, useMemo, useRef, useState } from 'react'
import type { AppData, Course, License } from './types'
import { addMonths, formatDate, todayISO } from './lib/dates'
import { buildReminderCalendar } from './lib/ics'
import { STATUS_LABEL, formatHours, getProgress, licenseLabel } from './lib/progress'
import { sampleData } from './lib/sample'
import { createBackup, deleteFile, getFile, loadData, putFile, restoreBackup, saveData } from './lib/storage'
import { AuditReport } from './components/AuditReport'
import { CourseForm } from './components/CourseForm'
import { CourseList } from './components/CourseList'
import { LicenseCard } from './components/LicenseCard'
import { LicenseForm } from './components/LicenseForm'

type Editing =
  | { kind: 'license'; license?: License }
  | { kind: 'course'; course?: Course; licenseIds?: string[] }
  | null

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function App() {
  const [data, setData] = useState<AppData>(loadData)
  const [editing, setEditing] = useState<Editing>(null)
  const [view, setView] = useState<'dashboard' | 'report'>('dashboard')
  const [notice, setNotice] = useState('')
  const restoreInput = useRef<HTMLInputElement>(null)
  const today = todayISO()

  useEffect(() => {
    if (!saveData(data)) setNotice("Couldn't save to this browser. Check that site storage is allowed.")
  }, [data])

  const progress = useMemo(
    () => new Map(data.licenses.map((l) => [l.id, getProgress(l, data.courses, today)])),
    [data, today],
  )

  const nextUp = [...data.licenses]
    .filter((l) => progress.get(l.id)!.status !== 'complete')
    .sort((a, b) => a.expiresOn.localeCompare(b.expiresOn))[0]

  const saveLicense = (license: License) => {
    setData((d) => ({
      ...d,
      licenses: d.licenses.some((l) => l.id === license.id)
        ? d.licenses.map((l) => (l.id === license.id ? license : l))
        : [...d.licenses, license],
    }))
    setEditing(null)
  }

  const deleteLicense = (license: License) => {
    if (!confirm(`Delete ${licenseLabel(license)}? Your logged courses stay.`)) return
    setData((d) => ({
      licenses: d.licenses.filter((l) => l.id !== license.id),
      courses: d.courses.map((c) => ({ ...c, licenseIds: c.licenseIds.filter((id) => id !== license.id) })),
    }))
    setEditing(null)
  }

  const markRenewed = (license: License) => {
    const next = addMonths(license.expiresOn, license.cycleMonths)
    if (!confirm(`Start the next cycle for ${licenseLabel(license)}? New expiration: ${formatDate(next)}.`)) return
    saveLicense({ ...license, expiresOn: next })
  }

  const saveCourse = async (course: Course, file: File | null | undefined) => {
    try {
      if (file) await putFile(course.id, file)
      else if (file === null) await deleteFile(course.id)
    } catch {
      setNotice("Couldn't save the certificate file in this browser. The course was saved without it.")
      course = { ...course, certificate: undefined }
    }
    setData((d) => ({
      ...d,
      courses: d.courses.some((c) => c.id === course.id)
        ? d.courses.map((c) => (c.id === course.id ? course : c))
        : [...d.courses, course],
    }))
    setEditing(null)
  }

  const deleteCourse = async (course: Course) => {
    if (!confirm(`Delete "${course.title}"?`)) return
    setData((d) => ({ ...d, courses: d.courses.filter((c) => c.id !== course.id) }))
    setEditing(null)
    await deleteFile(course.id).catch(() => {})
  }

  const openCertificate = async (course: Course) => {
    // Open the tab synchronously so pop-up blockers allow it, then point it at the file.
    const tab = window.open('', '_blank')
    const file = await getFile(course.id).catch(() => undefined)
    if (!file) {
      tab?.close()
      setNotice('That certificate file is missing from this browser.')
      return
    }
    const url = URL.createObjectURL(file)
    if (tab) tab.location.href = url
    else window.location.href = url
  }

  const downloadReminders = () => {
    download(new Blob([buildReminderCalendar(data.licenses, today)], { type: 'text/calendar' }), 'ce-renewal-reminders.ics')
    setNotice('Reminders downloaded. Open the file to add them to your calendar.')
  }

  const backup = async () => {
    download(await createBackup(data), `renewready-backup-${today}.json`)
  }

  const restore = async (file: File) => {
    if (data.licenses.length + data.courses.length > 0 && !confirm('Replace everything here with this backup?')) return
    try {
      setData(await restoreBackup(file))
      setNotice('Backup restored.')
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Could not read that backup file.')
    }
  }

  if (view === 'report') return <AuditReport data={data} today={today} onBack={() => setView('dashboard')} />

  const isEmpty = data.licenses.length === 0 && data.courses.length === 0

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden="true">
            ✓
          </span>
          RenewReady
        </div>
        {!isEmpty && (
          <button type="button" className="button primary" onClick={() => setEditing({ kind: 'course' })}>
            + Log a course
          </button>
        )}
      </header>

      <main className="container">
        {notice && (
          <div className="notice" role="status">
            <span>{notice}</span>
            <button type="button" className="icon-button" aria-label="Dismiss" onClick={() => setNotice('')}>
              ×
            </button>
          </div>
        )}

        {isEmpty ? (
          <section className="hero">
            <h1>Never scramble for CE hours at renewal time.</h1>
            <p>
              Track every license, the hours you've earned, the mandatory topics you still owe, and keep your certificates
              in one place, ready for an audit.
            </p>
            <div className="hero-actions">
              <button type="button" className="button primary large" onClick={() => setEditing({ kind: 'license' })}>
                Add your first license
              </button>
              <button type="button" className="button large" onClick={() => setData(sampleData(today))}>
                Try with example data
              </button>
            </div>
            <p className="muted small">Your records stay on this device. No account needed.</p>
          </section>
        ) : (
          <>
            {nextUp && (
              <p className="summary">
                Next up: <strong>{licenseLabel(nextUp)}</strong> renews {formatDate(nextUp.expiresOn)}.{' '}
                {progress.get(nextUp.id)!.remaining > 0
                  ? `${formatHours(progress.get(nextUp.id)!.remaining)} to go.`
                  : 'All hours done, just the mandatory topics left.'}{' '}
                <span className="muted">({STATUS_LABEL[progress.get(nextUp.id)!.status]})</span>
              </p>
            )}

            <section aria-labelledby="licenses-heading">
              <div className="section-header">
                <h2 id="licenses-heading">Licenses</h2>
                <button type="button" className="link-button" onClick={() => setEditing({ kind: 'license' })}>
                  + Add license
                </button>
              </div>
              {data.licenses.length === 0 ? (
                <p className="muted empty-note">Add a license to see your progress toward renewal.</p>
              ) : (
                <div className="license-grid">
                  {data.licenses.map((l) => (
                    <LicenseCard
                      key={l.id}
                      license={l}
                      progress={progress.get(l.id)!}
                      onEdit={() => setEditing({ kind: 'license', license: l })}
                      onLogCourse={() => setEditing({ kind: 'course', licenseIds: [l.id] })}
                      onRenewed={() => markRenewed(l)}
                    />
                  ))}
                </div>
              )}
            </section>

            <section aria-labelledby="courses-heading">
              <div className="section-header">
                <h2 id="courses-heading">Courses</h2>
              </div>
              <CourseList
                courses={data.courses}
                licenses={data.licenses}
                onEdit={(course) => setEditing({ kind: 'course', course })}
                onOpenCertificate={openCertificate}
              />
            </section>

            <section className="tools" aria-label="Tools">
              <button type="button" className="button" onClick={downloadReminders} disabled={!data.licenses.length}>
                Add reminders to calendar
              </button>
              <button type="button" className="button" onClick={() => setView('report')} disabled={!data.licenses.length}>
                Audit report
              </button>
              <button type="button" className="button" onClick={backup}>
                Back up
              </button>
              <button type="button" className="button" onClick={() => restoreInput.current?.click()}>
                Restore
              </button>
            </section>
          </>
        )}

        <input
          ref={restoreInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file) void restore(file)
          }}
        />
      </main>

      <footer className="site-footer muted small">
        RenewReady keeps your records in this browser. Always confirm current requirements with your licensing board.
      </footer>

      {editing?.kind === 'license' && (
        <LicenseForm
          license={editing.license}
          onSave={saveLicense}
          onDelete={editing.license ? () => deleteLicense(editing.license!) : undefined}
          onClose={() => setEditing(null)}
        />
      )}
      {editing?.kind === 'course' && (
        <CourseForm
          course={editing.course}
          licenses={data.licenses}
          defaultLicenseIds={editing.licenseIds ?? data.licenses.map((l) => l.id)}
          onSave={saveCourse}
          onDelete={editing.course ? () => deleteCourse(editing.course!) : undefined}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}
