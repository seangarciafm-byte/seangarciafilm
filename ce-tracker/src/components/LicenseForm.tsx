import { useState, type FormEvent } from 'react'
import type { License, Requirement } from '../types'
import { CYCLE_OPTIONS, PROFESSIONS, STATES } from '../lib/constants'
import { Modal } from './Modal'

interface Props {
  license?: License
  onSave: (license: License) => void
  onDelete?: () => void
  onClose: () => void
}

export function LicenseForm({ license, onSave, onDelete, onClose }: Props) {
  const [profession, setProfession] = useState(license?.profession ?? '')
  const [state, setState] = useState(license?.state ?? '')
  const [number, setNumber] = useState(license?.number ?? '')
  const [expiresOn, setExpiresOn] = useState(license?.expiresOn ?? '')
  const [cycleMonths, setCycleMonths] = useState(license?.cycleMonths ?? 24)
  const [totalHours, setTotalHours] = useState(license ? String(license.totalHours) : '')
  const [requirements, setRequirements] = useState<Requirement[]>(license?.requirements ?? [])

  const updateRequirement = (id: string, patch: Partial<Requirement>) =>
    setRequirements((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSave({
      id: license?.id ?? crypto.randomUUID(),
      profession: profession.trim(),
      state,
      number: number.trim(),
      expiresOn,
      cycleMonths,
      totalHours: Number(totalHours) || 0,
      requirements: requirements.filter((r) => r.topic.trim()).map((r) => ({ ...r, topic: r.topic.trim() })),
    })
  }

  return (
    <Modal title={license ? 'Edit license' : 'Add a license'} onClose={onClose}>
      <form onSubmit={submit} className="form">
        <div className="field-row">
          <label className="field">
            <span>Profession</span>
            <input
              list="professions"
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              placeholder="RN"
              required
              autoFocus
            />
            <datalist id="professions">
              {PROFESSIONS.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </label>
          <label className="field field-narrow">
            <span>State</span>
            <select value={state} onChange={(e) => setState(e.target.value)} required>
              <option value="" disabled>
                Select
              </option>
              {STATES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="field">
          <span>
            License number <em>optional</em>
          </span>
          <input value={number} onChange={(e) => setNumber(e.target.value)} />
        </label>

        <div className="field-row">
          <label className="field">
            <span>Expires on</span>
            <input type="date" value={expiresOn} onChange={(e) => setExpiresOn(e.target.value)} required />
          </label>
          <label className="field">
            <span>Renewal cycle</span>
            <select value={cycleMonths} onChange={(e) => setCycleMonths(Number(e.target.value))}>
              {CYCLE_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  Every {m / 12} year{m > 12 ? 's' : ''}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="field">
          <span>CE hours required per cycle</span>
          <input
            type="number"
            min="0"
            step="0.25"
            inputMode="decimal"
            value={totalHours}
            onChange={(e) => setTotalHours(e.target.value)}
            placeholder="30"
            required
          />
        </label>

        <fieldset className="field">
          <legend>Mandatory topics</legend>
          <p className="hint">
            Specific courses your board requires, like implicit bias or ethics. Check your board's website, since rules
            change.
          </p>
          {requirements.map((r) => (
            <div key={r.id} className="requirement-row">
              <input
                aria-label="Topic"
                placeholder="Topic"
                value={r.topic}
                onChange={(e) => updateRequirement(r.id, { topic: e.target.value })}
              />
              <input
                aria-label="Hours"
                type="number"
                min="0"
                step="0.25"
                inputMode="decimal"
                value={r.hours}
                onChange={(e) => updateRequirement(r.id, { hours: Number(e.target.value) || 0 })}
              />
              <span className="unit">hrs</span>
              <button
                type="button"
                className="icon-button"
                aria-label={`Remove ${r.topic || 'topic'}`}
                onClick={() => setRequirements((rs) => rs.filter((x) => x.id !== r.id))}
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            className="link-button"
            onClick={() => setRequirements((rs) => [...rs, { id: crypto.randomUUID(), topic: '', hours: 1 }])}
          >
            + Add a mandatory topic
          </button>
        </fieldset>

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
            Save license
          </button>
        </footer>
      </form>
    </Modal>
  )
}
