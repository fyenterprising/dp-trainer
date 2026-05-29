import { useState, useEffect } from 'react'

const VESSEL_TYPES = ['PSV', 'Research', 'AHTS', 'CSV', 'MPSV', 'Other']
const DP_CLASSES = ['DP1', 'DP2', 'DP3']
const ACTIVITY_CODES = [
  { code: 'A', label: 'Audits/Testing/Trials' },
  { code: 'ACCOM', label: 'Accommodation' },
  { code: 'AH', label: 'Anchor Handling' },
  { code: 'CL', label: 'Cable Laying' },
  { code: 'CR', label: 'Cable Repair' },
  { code: 'D', label: 'Diving' },
  { code: 'DREDGE', label: 'Dredging' },
  { code: 'DRILL', label: 'Drilling' },
  { code: 'FL', label: 'Flexilay' },
  { code: 'HL', label: 'Heavy Lift' },
  { code: 'OLT', label: 'Offshore Loading Tanker' },
  { code: 'OT', label: 'Other' },
  { code: 'PD', label: 'Pile Drive' },
  { code: 'PL', label: 'Pipelay' },
  { code: 'RD', label: 'Rock Dumping' },
  { code: 'ROV', label: 'ROV Support' },
  { code: 'SB', label: 'Standby' },
  { code: 'SU', label: 'Supply' },
  { code: 'SUR', label: 'Surveying' },
  { code: 'TR', label: 'Trenching' },
  { code: 'WK', label: 'Wreck Removal' },
  { code: 'WS', label: 'Well Stimulation' },
]

const STORAGE_KEY = 'dp-time-log'

function blankEntry(nextPeriod) {
  return {
    id: Date.now().toString(),
    period: nextPeriod,
    vesselName: '',
    vesselType: 'PSV',
    date: new Date().toISOString().slice(0, 10),
    type: 'A',
    hours: 8,
    dpClass: 'DP2',
    activityCode: 'SB',
    notes: '',
    rank: '2/O',
  }
}

function formatDate(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function computeTotals(entries) {
  let activeHours = 0, passiveHours = 0
  const activeDates = new Set(), passiveDates = new Set()
  entries.forEach(e => {
    const h = parseFloat(e.hours) || 0
    if (e.type === 'A') { activeHours += h; activeDates.add(e.date) }
    else { passiveHours += h; passiveDates.add(e.date) }
  })
  return {
    activeDays: activeDates.size,
    activeHours: Math.round(activeHours * 10) / 10,
    passiveDays: passiveDates.size,
    passiveHours: Math.round(passiveHours * 10) / 10,
    totalDays: activeDates.size + passiveDates.size,
    totalHours: Math.round((activeHours + passiveHours) * 10) / 10,
  }
}

function EntryForm({ initial, onSave, onCancel, nextPeriod }) {
  const [form, setForm] = useState(initial ?? blankEntry(nextPeriod))

  function set(key, val) { setForm(prev => ({ ...prev, [key]: val })) }

  return (
    <div className="dplog-form">
      <div className="dplog-form-grid">
        <div className="dplog-field">
          <label>Period #</label>
          <input type="number" value={form.period} onChange={e => set('period', e.target.value)} />
        </div>
        <div className="dplog-field">
          <label>Vessel Name</label>
          <input type="text" value={form.vesselName} onChange={e => set('vesselName', e.target.value)} placeholder="Vessel name" />
        </div>
        <div className="dplog-field">
          <label>Vessel Type</label>
          <select value={form.vesselType} onChange={e => set('vesselType', e.target.value)}>
            {VESSEL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="dplog-field">
          <label>Date</label>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
        </div>
        <div className="dplog-field">
          <label>Type</label>
          <select value={form.type} onChange={e => set('type', e.target.value)}>
            <option value="A">A — Active</option>
            <option value="P">P — Passive</option>
          </select>
        </div>
        <div className="dplog-field">
          <label>Hours</label>
          <input type="number" min="0.5" max="24" step="0.5" value={form.hours} onChange={e => set('hours', e.target.value)} />
        </div>
        <div className="dplog-field">
          <label>DP Class</label>
          <select value={form.dpClass} onChange={e => set('dpClass', e.target.value)}>
            {DP_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="dplog-field">
          <label>Activity</label>
          <select value={form.activityCode} onChange={e => set('activityCode', e.target.value)}>
            {ACTIVITY_CODES.map(a => (
              <option key={a.code} value={a.code}>{a.code} — {a.label}</option>
            ))}
          </select>
        </div>
        <div className="dplog-field">
          <label>Rank</label>
          <input type="text" value={form.rank} onChange={e => set('rank', e.target.value)} placeholder="2/O" />
        </div>
        <div className="dplog-field dplog-field--wide">
          <label>Notes</label>
          <input type="text" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional" />
        </div>
      </div>
      <div className="dplog-form-actions">
        <button className="btn-primary" onClick={() => onSave(form)}>Save Entry</button>
        <button className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

function ThresholdBar({ label, value, max, note }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  const done = value >= max
  return (
    <div className="dplog-threshold">
      <div className="dplog-threshold-label">
        <span>{label}</span>
        <span className={done ? 'thresh-done' : 'thresh-partial'}>{value} of {max}{note ? ` — ${note}` : ''}</span>
      </div>
      <div className="dplog-bar-track">
        <div className={`dplog-bar-fill${done ? ' dplog-bar-fill--done' : ''}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function DPTimeLogScreen({ onBack }) {
  const [entries, setEntries] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editEntry, setEditEntry] = useState(null)
  const [printDate] = useState(() => new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }))

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    setEntries(stored)
  }, [])

  function save(updated) {
    setEntries(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  function handleSaveEntry(form) {
    let updated
    if (editEntry) {
      updated = entries.map(e => e.id === editEntry.id ? { ...form, id: editEntry.id } : e)
    } else {
      updated = [{ ...form, id: Date.now().toString() }, ...entries]
    }
    save(updated)
    setShowForm(false)
    setEditEntry(null)
  }

  function handleDelete(id) {
    if (!window.confirm('Delete this entry?')) return
    save(entries.filter(e => e.id !== id))
  }

  function handleEdit(entry) {
    setEditEntry(entry)
    setShowForm(true)
  }

  function handleAddNew() {
    setEditEntry(null)
    setShowForm(true)
  }

  function handleCancelForm() {
    setShowForm(false)
    setEditEntry(null)
  }

  const nextPeriod = entries.length > 0 ? Math.max(...entries.map(e => parseInt(e.period) || 0)) + 1 : 1
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date))
  const totals = computeTotals(entries)

  const traineeName = (() => {
    try {
      const profiles = JSON.parse(localStorage.getItem('dp-vessel-profiles') ?? '[]')
      const id = localStorage.getItem('dp-active-profile-id')
      const found = id ? profiles.find(p => p.id === id) : profiles[0]
      return found?.traineeName ?? ''
    } catch { return '' }
  })()

  return (
    <div className="screen dplog-screen">

      {/* PRINT HEADER */}
      <div className="print-header print-only">
        <div className="print-logo">DPTrainer</div>
        <div className="print-doc-title">DP Time Log{traineeName ? ` — ${traineeName}` : ''}</div>
        <div className="print-doc-date">Generated: {printDate}</div>
      </div>

      {/* SCREEN HEADER */}
      <div className="history-header no-print">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <h1>DP Time Log</h1>
      </div>

      {/* TOTALS */}
      <div className="dplog-totals">
        <div className="dplog-totals-grid">
          <div className="dplog-stat">
            <div className="dplog-stat-value">{totals.activeDays}</div>
            <div className="dplog-stat-label">Active Days</div>
          </div>
          <div className="dplog-stat">
            <div className="dplog-stat-value">{totals.activeHours}</div>
            <div className="dplog-stat-label">Active Hours</div>
          </div>
          <div className="dplog-stat">
            <div className="dplog-stat-value">{totals.passiveDays}</div>
            <div className="dplog-stat-label">Passive Days</div>
          </div>
          <div className="dplog-stat">
            <div className="dplog-stat-value">{totals.passiveHours}</div>
            <div className="dplog-stat-label">Passive Hours</div>
          </div>
          <div className="dplog-stat">
            <div className="dplog-stat-value">{totals.totalDays}</div>
            <div className="dplog-stat-label">Total Days</div>
          </div>
          <div className="dplog-stat">
            <div className="dplog-stat-value">{totals.totalHours}</div>
            <div className="dplog-stat-label">Total Hours</div>
          </div>
        </div>

        <div className="dplog-thresholds">
          <div className="dplog-thresh-heading">NI Certification Thresholds</div>
          <ThresholdBar label="Passive days (max 30)" value={totals.passiveDays} max={30} note="Basic → Advanced" />
          <ThresholdBar label="Active days (min 30)" value={totals.activeDays} max={30} note="Basic → Advanced" />
          <ThresholdBar label="Active days toward Full" value={totals.activeDays} max={60} note="Advanced → Full (30–60 required)" />
        </div>
      </div>

      {/* ADD ENTRY / EXPORT */}
      <div className="dplog-toolbar no-print">
        <button className="btn-primary" onClick={handleAddNew}>+ Add Entry</button>
        <button className="btn-secondary" onClick={() => window.print()}>Export PDF</button>
      </div>

      {/* INLINE FORM */}
      {showForm && (
        <EntryForm
          initial={editEntry}
          onSave={handleSaveEntry}
          onCancel={handleCancelForm}
          nextPeriod={nextPeriod}
        />
      )}

      {/* EMPTY STATE */}
      {entries.length === 0 && (
        <div className="history-empty">
          <p className="no-tasks">No entries yet. Add your first DP time log entry to start tracking your progress toward NI certification thresholds.</p>
        </div>
      )}

      {/* TABLE */}
      {entries.length > 0 && (
        <div className="dplog-table-wrap">
          <table className="dplog-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Vessel</th>
                <th>Type</th>
                <th>Date</th>
                <th>A/P</th>
                <th>Hrs</th>
                <th>DP</th>
                <th>Activity</th>
                <th>Rank</th>
                <th>Notes</th>
                <th className="no-print">Edit</th>
                <th className="no-print">Del</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(e => (
                <tr key={e.id}>
                  <td>{e.period}</td>
                  <td>{e.vesselName}</td>
                  <td>{e.vesselType}</td>
                  <td>{formatDate(e.date)}</td>
                  <td className={e.type === 'A' ? 'dplog-active' : 'dplog-passive'}>{e.type}</td>
                  <td>{e.hours}</td>
                  <td>{e.dpClass}</td>
                  <td>{e.activityCode}</td>
                  <td>{e.rank}</td>
                  <td>{e.notes}</td>
                  <td className="no-print">
                    <button className="dplog-btn-edit" onClick={() => handleEdit(e)}>Edit</button>
                  </td>
                  <td className="no-print">
                    <button className="dplog-btn-delete" onClick={() => handleDelete(e.id)}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PRINT FOOTER */}
      <div className="print-footer print-only">
        <div className="print-footer-disclaimer">
          This record was generated by DPTrainer. DPTrainer is not affiliated with or endorsed by the Nautical Institute. The original signed logbook remains the official NI submission record.
        </div>
      </div>
    </div>
  )
}
