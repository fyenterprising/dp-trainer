import { useState, useEffect, useRef, useMemo } from 'react'

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

const CSV_HEADER = ['Period', 'Vessel', 'Vessel Type', 'Date', 'A/P', 'Hours', 'DP Class', 'Activity', 'Notes', 'Rank']

const TEMPLATE_CSV = [
  CSV_HEADER.join(','),
  '1,Example Vessel,PSV,22/02/2024,A,6,DP2,SU,,2/O',
  '2,Example Vessel,PSV,02/03/2024,P,2,DP2,,,2/O',
].join('\r\n')

const IMPORT_FIELDS = [
  { key: 'date', label: 'Date', required: true },
  { key: 'vessel', label: 'Vessel', required: true },
  { key: 'activePassive', label: 'Active/Passive', required: true },
  { key: 'hours', label: 'Hours', required: true },
  { key: 'vesselType', label: 'Vessel Type', required: false },
  { key: 'dpClass', label: 'DP Class', required: false },
  { key: 'activityCode', label: 'Activity Code', required: false },
  { key: 'notes', label: 'Notes', required: false },
  { key: 'rank', label: 'Rank', required: false },
  { key: 'period', label: 'Period Number', required: false },
]

const FIELD_PATTERNS = {
  date: ['date'],
  vessel: ['vessel name', 'ship name', 'vessel', 'ship'],
  activePassive: ['active/passive', 'active / passive', 'a/p', 'ap', 'active', 'passive', 'type'],
  hours: ['hours', 'hrs', 'hour'],
  vesselType: ['vessel type', 'ship type', 'vesseltype'],
  dpClass: ['dp class', 'dpclass', 'class'],
  activityCode: ['activity code', 'activity', 'code'],
  notes: ['notes', 'note', 'comments', 'comment', 'remarks'],
  rank: ['rank', 'position', 'role'],
  period: ['period number', 'period no', 'period', 'period#'],
}

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

// NI New Offshore Scheme: a DP day requires a minimum of 2 hours on the DP desk.
// The app has no record of Induction/Simulator Course dates, so it cannot split
// entries between Phase B and Phase D — it only tracks totals across both.
function computeNIProgress(entries) {
  const qualifying = entries.filter(e => (parseFloat(e.hours) || 0) >= 2)
  const activeDates = new Set()
  const passiveDates = new Set()
  const dp23Dates = new Set()
  qualifying.forEach(e => {
    if (e.type === 'A') activeDates.add(e.date)
    else passiveDates.add(e.date)
    if (e.dpClass === 'DP2' || e.dpClass === 'DP3') dp23Dates.add(e.date)
  })
  const totalDays = new Set([...activeDates, ...passiveDates]).size
  return {
    totalDays,
    passiveDays: passiveDates.size,
    dp23Days: dp23Dates.size,
  }
}

/* ── CSV EXPORT ── */

function csvEscape(value) {
  const str = String(value ?? '')
  if (/[",\r\n]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

function entriesToCSV(entries) {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  const lines = [CSV_HEADER.map(csvEscape).join(',')]
  sorted.forEach(e => {
    lines.push([
      e.period, e.vesselName, e.vesselType, formatDate(e.date), e.type,
      e.hours, e.dpClass, e.activityCode, e.notes, e.rank,
    ].map(csvEscape).join(','))
  })
  return lines.join('\r\n')
}

function todayISODate() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function downloadTextFile(text, filename, mimeType) {
  const blob = new Blob([text], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/* ── CSV PARSE ── */

function parseCSV(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ }
        else { inQuotes = false }
      } else {
        field += char
      }
      continue
    }
    if (char === '"') { inQuotes = true; continue }
    if (char === ',') { row.push(field); field = ''; continue }
    if (char === '\r') { continue }
    if (char === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue }
    field += char
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row) }
  return rows.filter(r => !(r.length === 1 && r[0].trim() === ''))
}

function normalizeHeader(h) {
  return (h ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function guessColumnMap(headers) {
  const norm = headers.map(normalizeHeader)
  const candidates = []
  Object.entries(FIELD_PATTERNS).forEach(([field, patterns]) => {
    norm.forEach((h, idx) => {
      if (!h) return
      let best = 0
      patterns.forEach(p => {
        if (h === p) best = Math.max(best, 1000 + p.length)
        else if (h.includes(p)) best = Math.max(best, p.length)
      })
      if (best > 0) candidates.push({ field, idx, score: best })
    })
  })
  candidates.sort((a, b) => b.score - a.score)
  const map = {}
  const usedHeaders = new Set()
  const usedFields = new Set()
  candidates.forEach(c => {
    if (usedFields.has(c.field) || usedHeaders.has(c.idx)) return
    map[c.field] = c.idx
    usedFields.add(c.field)
    usedHeaders.add(c.idx)
  })
  IMPORT_FIELDS.forEach(f => { if (!(f.key in map)) map[f.key] = null })
  return map
}

function validateDateParts(y, mo, d) {
  const year = parseInt(y, 10), month = parseInt(mo, 10), day = parseInt(d, 10)
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  const daysInMonth = new Date(year, month, 0).getDate()
  if (day > daysInMonth) return null
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function parseImportDate(raw, slashFormat) {
  const s = String(raw ?? '').trim()
  if (!s) return null
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (m) return validateDateParts(m[1], m[2], m[3])
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m) {
    const [, first, second, year] = m
    return slashFormat === 'mdy'
      ? validateDateParts(year, first, second)
      : validateDateParts(year, second, first)
  }
  return null
}

// Scans every value in the mapped date column to resolve dd/mm vs mm/dd for the
// whole file at once, since the two are ambiguous on a single ≤12/≤12 row.
function detectSlashDateFormat(dataRows, dateIdx) {
  let sawFirstOver12 = false
  let sawSecondOver12 = false
  let hasSlashDates = false
  dataRows.forEach(row => {
    const raw = cellAt(row, dateIdx)
    const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (!m) return
    hasSlashDates = true
    if (parseInt(m[1], 10) > 12) sawFirstOver12 = true
    if (parseInt(m[2], 10) > 12) sawSecondOver12 = true
  })
  const format = sawFirstOver12 ? 'dmy' : sawSecondOver12 ? 'mdy' : 'dmy'
  return { format, hasSlashDates }
}

function parseActivePassive(raw) {
  const s = String(raw ?? '').trim().toLowerCase()
  if (s === 'a' || s === 'active') return 'A'
  if (s === 'p' || s === 'passive') return 'P'
  return null
}

function parseHoursValue(raw) {
  const s = String(raw ?? '').trim()
  if (!/^\d+(\.\d+)?$/.test(s)) return null
  const n = parseFloat(s)
  return isNaN(n) ? null : n
}

function cellAt(row, idx) {
  if (idx === null || idx === undefined || idx < 0) return ''
  return (row[idx] ?? '').trim()
}

function findDuplicateMappings(columnMap) {
  const byIndex = {}
  IMPORT_FIELDS.forEach(f => {
    const idx = columnMap[f.key]
    if (idx === null || idx === undefined) return
    if (!byIndex[idx]) byIndex[idx] = []
    byIndex[idx].push(f.label)
  })
  return Object.values(byIndex).filter(labels => labels.length > 1)
}

function processImportRows(dataRows, columnMap, nextPeriod) {
  const valid = []
  const problems = []
  let periodCounter = nextPeriod
  const periodMapped = columnMap.period !== null && columnMap.period !== undefined
  const { format: slashFormat, hasSlashDates } = detectSlashDateFormat(dataRows, columnMap.date)

  dataRows.forEach((row, i) => {
    const rowNumber = i + 2 // header row is line 1
    const dateRaw = cellAt(row, columnMap.date)
    const vesselRaw = cellAt(row, columnMap.vessel)
    const apRaw = cellAt(row, columnMap.activePassive)
    const hoursRaw = cellAt(row, columnMap.hours)

    const parsedDate = parseImportDate(dateRaw, slashFormat)
    const parsedAP = parseActivePassive(apRaw)
    const parsedHours = parseHoursValue(hoursRaw)

    const reasons = []
    if (!parsedDate) reasons.push(dateRaw ? `unparseable date "${dateRaw}"` : 'missing date')
    if (!vesselRaw) reasons.push('missing vessel')
    if (!parsedAP) reasons.push(apRaw ? `invalid A/P value "${apRaw}"` : 'missing A/P value')
    if (parsedHours === null) reasons.push(hoursRaw ? `hours not a number "${hoursRaw}"` : 'missing hours')

    if (reasons.length > 0) {
      problems.push({ rowNumber, reasons })
      return
    }

    const activityCodeRaw = cellAt(row, columnMap.activityCode)
    const activityUnrecognised = !!activityCodeRaw &&
      !ACTIVITY_CODES.some(a => a.code.toLowerCase() === activityCodeRaw.toLowerCase())

    let period
    if (periodMapped) {
      const periodRaw = cellAt(row, columnMap.period)
      period = /^\d+$/.test(periodRaw) ? parseInt(periodRaw, 10) : periodCounter++
    } else {
      period = periodCounter++
    }

    valid.push({
      period,
      vesselName: vesselRaw,
      vesselType: cellAt(row, columnMap.vesselType),
      date: parsedDate,
      activePassive: parsedAP,
      hours: parsedHours,
      dpClass: cellAt(row, columnMap.dpClass),
      activityCode: activityCodeRaw,
      activityUnrecognised,
      notes: cellAt(row, columnMap.notes),
      rank: cellAt(row, columnMap.rank),
    })
  })

  return { valid, problems, slashDateFormat: slashFormat, hasSlashDates }
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

function ThresholdBar({ label, value, max, statusText, statusTone }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  const done = value >= max
  return (
    <div className="dplog-threshold">
      <div className="dplog-threshold-label">
        <span>{label}</span>
        <span className={done ? 'thresh-done' : 'thresh-partial'}>{value} of {max}</span>
      </div>
      <div className="dplog-bar-track">
        <div className={`dplog-bar-fill${done ? ' dplog-bar-fill--done' : ''}`} style={{ width: `${pct}%` }} />
      </div>
      {statusText && (
        <div className={`dplog-thresh-status dplog-thresh-status--${statusTone || 'info'}`}>{statusText}</div>
      )}
    </div>
  )
}

export default function DPTimeLogScreen({ onBack }) {
  const [entries, setEntries] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editEntry, setEditEntry] = useState(null)
  const [printDate] = useState(() => new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }))

  const fileInputRef = useRef(null)
  const [importStage, setImportStage] = useState(null) // null | 'mapping' | 'preview'
  const [importHeaders, setImportHeaders] = useState([])
  const [importRows, setImportRows] = useState([])
  const [importError, setImportError] = useState('')
  const [mappingError, setMappingError] = useState('')
  const [columnMap, setColumnMap] = useState({})
  const [importResult, setImportResult] = useState('')

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
      updated = [...entries, { ...form, id: Date.now().toString() }]
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

  function handleExportCSV() {
    const csv = entriesToCSV(entries)
    downloadTextFile(csv, `dp-time-log-${todayISODate()}.csv`, 'text/csv;charset=utf-8;')
  }

  function handleDownloadTemplate() {
    downloadTextFile(TEMPLATE_CSV, 'dp-time-log-template.csv', 'text/csv;charset=utf-8;')
  }

  function handleImportClick() {
    setImportResult('')
    fileInputRef.current?.click()
  }

  function handleFileSelected(e) {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    setImportError('')
    setImportResult('')
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setImportError('Please choose a .csv file.')
      return
    }
    const reader = new FileReader()
    reader.onload = evt => {
      try {
        const text = String(evt.target.result || '').replace(/^\uFEFF/, '')
        const rows = parseCSV(text)
        if (rows.length === 0) {
          setImportError('The file appears to be empty.')
          return
        }
        const headers = rows[0].map(h => h.trim())
        if (headers.length === 0 || headers.every(h => h === '')) {
          setImportError('Could not read a header row from this file.')
          return
        }
        const dataRows = rows.slice(1).filter(r => r.some(c => c.trim() !== ''))
        if (dataRows.length === 0) {
          setImportError('No data rows found in this file.')
          return
        }
        setImportHeaders(headers)
        setImportRows(dataRows)
        setColumnMap(guessColumnMap(headers))
        setMappingError('')
        setImportStage('mapping')
      } catch {
        setImportError('This file could not be parsed as CSV.')
      }
    }
    reader.onerror = () => setImportError('Could not read the file.')
    reader.readAsText(file)
  }

  function setColumnMapField(key, value) {
    setColumnMap(prev => ({ ...prev, [key]: value === '' ? null : Number(value) }))
  }

  function handleContinueToPreview() {
    const missing = IMPORT_FIELDS.filter(f => f.required && (columnMap[f.key] === null || columnMap[f.key] === undefined))
    if (missing.length > 0) {
      setMappingError(`Please map the required field${missing.length > 1 ? 's' : ''}: ${missing.map(f => f.label).join(', ')}`)
      return
    }
    const duplicates = findDuplicateMappings(columnMap)
    if (duplicates.length > 0) {
      setMappingError(`The same column is mapped to more than one field: ${duplicates.map(labels => labels.join(' and ')).join('; ')}. Each field needs its own column.`)
      return
    }
    setMappingError('')
    setImportStage('preview')
  }

  function handleCancelImport() {
    setImportStage(null)
    setImportHeaders([])
    setImportRows([])
    setColumnMap({})
    setImportError('')
    setMappingError('')
  }

  function handleConfirmImport() {
    const newEntries = importProcessed.valid.map((v, idx) => ({
      id: `imp-${Date.now()}-${idx}`,
      period: v.period,
      vesselName: v.vesselName,
      vesselType: v.vesselType,
      date: v.date,
      type: v.activePassive,
      hours: v.hours,
      dpClass: v.dpClass,
      activityCode: v.activityCode,
      notes: v.notes,
      rank: v.rank,
    }))
    const updated = [...entries, ...newEntries]
    save(updated)
    setImportResult(`${newEntries.length} entries imported, ${importProcessed.problems.length} rows skipped.`)
    setImportStage(null)
    setImportHeaders([])
    setImportRows([])
    setColumnMap({})
  }

  const nextPeriod = entries.length > 0 ? Math.max(...entries.map(e => parseInt(e.period) || 0)) + 1 : 1
  const sorted = [...entries].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date)
    if (dateCompare !== 0) return dateCompare
    return (parseInt(a.period, 10) || 0) - (parseInt(b.period, 10) || 0)
  })
  const totals = computeTotals(entries)
  const ni = computeNIProgress(entries)

  let certStatusText, certStatusTone
  if (ni.dp23Days >= 60 && ni.totalDays >= 120) {
    certStatusText = 'On current record: Unlimited certificate'
    certStatusTone = 'success'
  } else if (ni.totalDays >= 120) {
    const needed = 60 - ni.dp23Days
    certStatusText = `On current record: Limited certificate. ${needed} more DP2/DP3 day${needed === 1 ? '' : 's'} needed for Unlimited.`
    certStatusTone = 'warning'
  } else {
    const remaining = 120 - ni.totalDays
    certStatusText = `${remaining} day${remaining === 1 ? '' : 's'} remaining to certification.`
    certStatusTone = 'info'
  }

  const importProcessed = useMemo(() => {
    if (!importRows.length) return { valid: [], problems: [], slashDateFormat: 'dmy', hasSlashDates: false }
    return processImportRows(importRows, columnMap, nextPeriod)
  }, [importRows, columnMap, nextPeriod])

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
          <div className="dplog-thresh-heading">NI New Offshore Scheme Progress</div>
          <ThresholdBar label="Phase B — DP sea time" value={ni.totalDays} max={60} />
          <ThresholdBar
            label="Phase B — passive days used"
            value={Math.min(ni.passiveDays, 30)}
            max={30}
            statusText={ni.passiveDays >= 30 ? 'Passive day limit reached — further passive days cannot be counted toward certification.' : null}
            statusTone="warning"
          />
          <ThresholdBar label="Total days toward certification" value={ni.totalDays} max={120} />
          <ThresholdBar
            label="DP2/DP3 days — Unlimited certificate"
            value={ni.dp23Days}
            max={60}
            statusText={certStatusText}
            statusTone={certStatusTone}
          />
        </div>
      </div>

      <p className="dplog-thresh-explainer">
        Phase B and Phase D are split by your Induction and Simulator Course dates. DPTrainer tracks your total days, passive day usage and DP class mix — confirm phase allocation against your logbook.
      </p>

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

      {/* ADD ENTRY / IMPORT / EXPORT */}
      <div className="dplog-toolbar no-print">
        <button className="btn-primary" onClick={handleAddNew}>+ Add Entry</button>
        <button className="btn-secondary" onClick={handleImportClick}>Import CSV</button>
        <button className="btn-secondary" onClick={handleExportCSV}>Export CSV</button>
        <button className="btn-secondary" onClick={() => window.print()}>Export PDF</button>
        <button className="btn-secondary" onClick={handleDownloadTemplate}>Download Template</button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="dplog-import-file-input no-print"
          onChange={handleFileSelected}
        />
      </div>
      <p className="dplog-csv-note no-print">
        Dates in dd/mm/yyyy. A for active, P for passive. Delete the example rows before importing.
      </p>

      {/* IMPORT: STEP 1 ERROR */}
      {importError && (
        <div className="dplog-import-error no-print">
          <p>{importError}</p>
          <button className="btn-secondary" onClick={() => setImportError('')}>Dismiss</button>
        </div>
      )}

      {/* IMPORT: STEP 2 — COLUMN MAPPING */}
      {importStage === 'mapping' && (
        <div className="dplog-form dplog-import no-print">
          <h2>Map CSV Columns</h2>
          <p className="dplog-import-hint">
            Match each DPTrainer field to a column from your file. Required fields are marked with an asterisk.
          </p>
          <div className="dplog-import-map-grid">
            {IMPORT_FIELDS.map(f => {
              const usedByOthers = new Set(
                IMPORT_FIELDS
                  .filter(other => other.key !== f.key && columnMap[other.key] !== null && columnMap[other.key] !== undefined)
                  .map(other => columnMap[other.key])
              )
              return (
                <div className="dplog-field" key={f.key}>
                  <label>{f.label}{f.required ? ' *' : ''}</label>
                  <select
                    value={columnMap[f.key] ?? ''}
                    onChange={e => setColumnMapField(f.key, e.target.value)}
                  >
                    <option value="">Not in file</option>
                    {importHeaders.map((h, idx) => (
                      <option key={idx} value={idx} disabled={usedByOthers.has(idx)}>
                        {h || `Column ${idx + 1}`}{usedByOthers.has(idx) ? ' (used)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )
            })}
          </div>
          {mappingError && <p className="dplog-import-error-text">{mappingError}</p>}
          <div className="dplog-form-actions">
            <button className="btn-primary" onClick={handleContinueToPreview}>Continue</button>
            <button className="btn-secondary" onClick={handleCancelImport}>Cancel</button>
          </div>
        </div>
      )}

      {/* IMPORT: STEP 3 — PREVIEW AND CONFIRM */}
      {importStage === 'preview' && (
        <div className="dplog-form dplog-import no-print">
          <h2>Preview Import</h2>
          <p className="dplog-import-hint">
            {importProcessed.valid.length} of {importRows.length} row{importRows.length === 1 ? '' : 's'} will be imported.
            {importProcessed.valid.length > 10 ? ' Showing first 10.' : ''}
          </p>
          {importProcessed.hasSlashDates && (
            <p className="dplog-import-hint dplog-import-date-format">
              Dates read as {importProcessed.slashDateFormat === 'mdy' ? 'mm/dd/yyyy' : 'dd/mm/yyyy'}.
            </p>
          )}
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
                </tr>
              </thead>
              <tbody>
                {importProcessed.valid.slice(0, 10).map((v, idx) => (
                  <tr key={idx}>
                    <td>{v.period}</td>
                    <td>{v.vesselName}</td>
                    <td>{v.vesselType}</td>
                    <td>{formatDate(v.date)}</td>
                    <td className={v.activePassive === 'A' ? 'dplog-active' : 'dplog-passive'}>{v.activePassive}</td>
                    <td>{v.hours}</td>
                    <td>{v.dpClass}</td>
                    <td>
                      {v.activityCode}
                      {v.activityUnrecognised && <span className="dplog-import-flag"> (unrecognised)</span>}
                    </td>
                    <td>{v.rank}</td>
                    <td>{v.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {importProcessed.problems.length > 0 && (
            <div className="dplog-import-problems">
              <div className="dplog-thresh-heading">Rows skipped ({importProcessed.problems.length})</div>
              <ul className="dplog-import-problem-list">
                {importProcessed.problems.map((p, idx) => (
                  <li key={idx}>Row {p.rowNumber}: {p.reasons.join(', ')}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="dplog-form-actions">
            <button className="btn-primary" onClick={handleConfirmImport} disabled={importProcessed.valid.length === 0}>
              Confirm Import
            </button>
            <button className="btn-secondary" onClick={handleCancelImport}>Cancel</button>
          </div>
        </div>
      )}

      {/* IMPORT: RESULT */}
      {importResult && (
        <div className="dplog-import-result no-print">
          <p>{importResult}</p>
          <button className="btn-secondary" onClick={() => setImportResult('')}>Dismiss</button>
        </div>
      )}

      {/* INLINE FORM */}
      {showForm && (
        <EntryForm
          initial={editEntry}
          onSave={handleSaveEntry}
          onCancel={handleCancelForm}
          nextPeriod={nextPeriod}
        />
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
