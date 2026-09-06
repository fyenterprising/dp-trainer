import { useState, useEffect, useRef, useMemo } from 'react'
import DPTimeLogPdfExport from '../components/DPTimeLogPdfExport.jsx'

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
const SIM_COURSE_KEY = 'dp-sim-course-date'

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

// NI New Offshore Scheme: a DP day requires a minimum of two hours on the DP
// desk. Anything shorter is not a DP day for any purpose, so every count in the
// app and in the PDF is taken over this same filtered set.
const MIN_DP_HOURS = 2

function qualifyingEntries(entries) {
  return entries.filter(e => (parseFloat(e.hours) || 0) >= MIN_DP_HOURS)
}

// The NI counts days, not entries: one date is one DP day however many entries
// it carries. Every day count in the app and in the PDF is taken over this index.
// A date with any qualifying active time is an active day — a day on which active
// work was also done must not consume the 30-day passive allowance.
function indexQualifyingDays(entries) {
  const days = new Map()
  qualifyingEntries(entries).forEach(e => {
    if (!e.date) return
    const day = days.get(e.date) ?? { date: e.date, active: false, entryCount: 0 }
    if (e.type === 'A') day.active = true
    day.entryCount += 1
    days.set(e.date, day)
  })
  return days
}

function computeTotals(entries) {
  const qualifying = qualifyingEntries(entries)
  // Hours sum every qualifying entry — two entries on one date is one day but
  // two lots of hours.
  let activeHours = 0, passiveHours = 0
  qualifying.forEach(e => {
    const h = parseFloat(e.hours) || 0
    if (e.type === 'A') activeHours += h
    else passiveHours += h
  })

  const days = indexQualifyingDays(entries)
  let activeDays = 0, passiveDays = 0, multiEntryDates = 0
  days.forEach(day => {
    if (day.active) activeDays += 1
    else passiveDays += 1
    if (day.entryCount > 1) multiEntryDates += 1
  })

  return {
    activeDays,
    activeHours: Math.round(activeHours * 10) / 10,
    passiveDays,
    passiveHours: Math.round(passiveHours * 10) / 10,
    totalDays: days.size,
    totalHours: Math.round((activeHours + passiveHours) * 10) / 10,
    shortEntries: entries.length - qualifying.length,
    multiEntryDates,
  }
}

// Advisory lines shown below the stat cards on screen and below Record totals in
// the PDF, so both surfaces explain the same gap between entry count and day count.
function countingNotes(totals) {
  const notes = []
  if (totals.shortEntries === 1) notes.push('1 entry under 2 hours is not counted as a DP day.')
  else if (totals.shortEntries > 1) notes.push(`${totals.shortEntries} entries under 2 hours are not counted as DP days.`)
  if (totals.multiEntryDates === 1) notes.push('1 date has multiple entries and is counted as one DP day.')
  else if (totals.multiEntryDates > 1) notes.push(`${totals.multiEntryDates} dates have multiple entries and are counted as one DP day each.`)
  return notes
}

// Record-level counts for the PDF's "Record totals" block, over the same
// qualifying set as everything else. Defined here so the PDF and the screen
// share one definition and cannot drift.
function computeRecordSummary(entries) {
  const dp1Dates = new Set()
  const dp23Dates = new Set()
  const vessels = new Set()
  qualifyingEntries(entries).forEach(e => {
    if (e.dpClass === 'DP1') dp1Dates.add(e.date)
    else if (e.dpClass === 'DP2' || e.dpClass === 'DP3') dp23Dates.add(e.date)
    if (e.vesselName) vessels.add(e.vesselName.trim().toLowerCase())
  })
  const dates = entries.map(e => e.date).filter(Boolean).sort()
  return {
    dp1Days: dp1Dates.size,
    dp23Days: dp23Dates.size,
    vesselsServed: vessels.size,
    firstDate: dates[0] ?? null,
    lastDate: dates[dates.length - 1] ?? null,
  }
}

// Rank is stored as free text per entry. The PDF header and footer print a full
// title where the abbreviation is one we recognise, and the stored string verbatim
// otherwise.
const RANK_LABELS = {
  'MASTER': 'Master',
  'C/O': 'Chief Officer',
  'CO': 'Chief Officer',
  'CHIEF OFFICER': 'Chief Officer',
  '1/O': 'First Officer',
  '2/O': 'Second Officer',
  '3/O': 'Third Officer',
  'SDPO': 'Senior DPO',
  'DPO': 'DPO',
  'TRAINEE': 'Trainee DPO',
  'TRAINEE DPO': 'Trainee DPO',
  'CADET': 'Cadet',
}

// The most recent entry carries the trainee's current rank.
function currentRankLabel(sortedEntries) {
  for (let i = sortedEntries.length - 1; i >= 0; i--) {
    const raw = (sortedEntries[i].rank ?? '').trim()
    if (raw) return RANK_LABELS[raw.toUpperCase()] ?? raw
  }
  return ''
}

// ── NI NEW OFFSHORE SCHEME: PHASE B / PHASE D ──
//
// Phase B is DP sea time logged before the DP Simulator Course; Phase D is on or
// after it (an entry dated the same day as the course counts as Phase D).
//
// Phase B requires 60 days, of which at most 30 may be passive. Phase D requires
// 60 days, of which at least 30 must be dated after the course — the other 30 may
// be carried forward from surplus Phase B days. That caps what pre-course time can
// ever be worth at 90 days: 60 for Phase B plus 30 carried forward. Days beyond 90
// logged before the course cannot count, because Phase D's remaining 30 must fall
// after it.
const PHASE_B_DAYS_REQUIRED = 60
const PASSIVE_DAYS_CAP = 30
const CARRY_FORWARD_CAP = 30
const PHASE_D_AFTER_COURSE_MIN = 30
const TOTAL_DAYS_REQUIRED = 120
const DP23_DAYS_FOR_UNLIMITED = 60
const PRE_COURSE_USABLE_MAX = PHASE_B_DAYS_REQUIRED + CARRY_FORWARD_CAP

function computePhaseProgress(entries, courseDate) {
  const hasCourseDate = Boolean(courseDate)
  const days = indexQualifyingDays(entries)

  let phaseBDays = 0, phaseDDays = 0, phaseBPassiveDays = 0
  days.forEach(day => {
    // ISO dates compare lexicographically, so a plain >= is the phase test.
    if (hasCourseDate && day.date >= courseDate) phaseDDays += 1
    else {
      phaseBDays += 1
      if (!day.active) phaseBPassiveDays += 1
    }
  })

  const dp23Dates = new Set()
  qualifyingEntries(entries).forEach(e => {
    if (e.date && (e.dpClass === 'DP2' || e.dpClass === 'DP3')) dp23Dates.add(e.date)
  })

  const qualifyingDays = days.size
  const surplus = Math.max(0, phaseBDays - PHASE_B_DAYS_REQUIRED)
  const carriedForward = Math.min(surplus, CARRY_FORWARD_CAP)
  const beyondCarryForward = surplus - carriedForward

  return {
    hasCourseDate,
    courseDate: courseDate || null,
    phaseBDays,
    phaseDDays,
    phaseBPassiveDays,
    carriedForward,
    beyondCarryForward,
    qualifyingDays,
    dp23Days: dp23Dates.size,
    // Without a course date the split is unknown, so the raw qualifying total is
    // shown and the 90-day ceiling is raised as a warning instead of applied.
    totalDays: hasCourseDate
      ? Math.min(phaseBDays, PHASE_B_DAYS_REQUIRED) + carriedForward + phaseDDays
      : qualifyingDays,
  }
}

function plural(n, word) {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

const PASSIVE_CAP_NOTE = 'Passive day limit reached — further passive days cannot be counted toward certification.'

// One bar list, rendered by both the on-screen panel and the PDF, so the two
// surfaces cannot show different progress. `note` carries amber warnings only;
// the certificate status line is passed alongside and rendered separately.
function buildProgressBars(phase) {
  const passiveBar = {
    key: 'passive',
    label: 'Phase B — passive days used',
    value: Math.min(phase.phaseBPassiveDays, PASSIVE_DAYS_CAP),
    max: PASSIVE_DAYS_CAP,
    suffix: 'maximum',
    note: phase.phaseBPassiveDays >= PASSIVE_DAYS_CAP ? PASSIVE_CAP_NOTE : null,
  }

  if (!phase.hasCourseDate) {
    return [
      { key: 'phaseB', label: 'Phase B — DP sea time', value: phase.phaseBDays, max: PHASE_B_DAYS_REQUIRED },
      passiveBar,
      {
        key: 'total',
        label: 'Total days toward certification',
        value: phase.totalDays,
        max: TOTAL_DAYS_REQUIRED,
        note: phase.qualifyingDays > PRE_COURSE_USABLE_MAX
          ? `You have logged ${plural(phase.qualifyingDays, 'day')} before your Simulator Course. Only ${PRE_COURSE_USABLE_MAX} can count toward certification — ${PHASE_B_DAYS_REQUIRED} for Phase B and up to ${CARRY_FORWARD_CAP} carried forward. Days beyond ${PRE_COURSE_USABLE_MAX} will not count until the Simulator Course is completed.`
          : null,
      },
      { key: 'dp23', label: 'DP2/DP3 days — Unlimited certificate', value: phase.dp23Days, max: DP23_DAYS_FOR_UNLIMITED },
    ]
  }

  return [
    { key: 'phaseB', label: 'Phase B — days before Simulator Course', value: phase.phaseBDays, max: PHASE_B_DAYS_REQUIRED },
    passiveBar,
    {
      key: 'carry',
      label: 'Phase B surplus carried forward',
      value: phase.carriedForward,
      max: CARRY_FORWARD_CAP,
      note: phase.beyondCarryForward > 0
        ? `${plural(phase.beyondCarryForward, 'day')} beyond the ${CARRY_FORWARD_CAP}-day carry-forward limit will not count.`
        : null,
    },
    { key: 'phaseD', label: 'Phase D — days after Simulator Course', value: phase.phaseDDays, max: PHASE_D_AFTER_COURSE_MIN },
    { key: 'total', label: 'Total days toward certification', value: phase.totalDays, max: TOTAL_DAYS_REQUIRED },
    { key: 'dp23', label: 'DP2/DP3 days — Unlimited certificate', value: phase.dp23Days, max: DP23_DAYS_FOR_UNLIMITED },
  ]
}

const PROVISIONAL_SUFFIX = ' (provisional — set your Simulator Course date to confirm)'

function certificateStatus(phase) {
  // Without a course date the total bar still shows the raw count, but only 90
  // pre-course days can ever count — so the status line reads the capped figure
  // and says it is provisional, rather than contradicting the 90-day warning.
  const total = phase.hasCourseDate
    ? phase.totalDays
    : Math.min(phase.totalDays, PRE_COURSE_USABLE_MAX)
  const suffix = phase.hasCourseDate ? '' : PROVISIONAL_SUFFIX

  if (phase.dp23Days >= DP23_DAYS_FOR_UNLIMITED && total >= TOTAL_DAYS_REQUIRED) {
    return { text: 'On current record: Unlimited certificate' + suffix, tone: 'success' }
  }
  if (total >= TOTAL_DAYS_REQUIRED) {
    const needed = DP23_DAYS_FOR_UNLIMITED - phase.dp23Days
    return {
      text: `On current record: Limited certificate. ${plural(needed, 'more DP2/DP3 day')} needed for Unlimited.` + suffix,
      tone: 'warning',
    }
  }
  return { text: `${plural(TOTAL_DAYS_REQUIRED - total, 'day')} remaining to certification.` + suffix, tone: 'info' }
}

function phaseAllocationNote(phase) {
  return phase.hasCourseDate
    ? `Phase B and Phase D are split by your DP Simulator Course date, ${formatDate(phase.courseDate)}. Days on or after that date count toward Phase D. Confirm phase allocation against your logbook.`
    : 'Phase B and Phase D are split by your DP Simulator Course date, which is not yet set — all days currently count toward Phase B. Confirm phase allocation against your logbook.'
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

function ThresholdBar({ label, value, max, suffix, statusText, statusTone }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  const done = value >= max
  return (
    <div className="dplog-threshold">
      <div className="dplog-threshold-label">
        <span>{label}</span>
        <span className={done ? 'thresh-done' : 'thresh-partial'}>{value} of {max}{suffix ? ` ${suffix}` : ''}</span>
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
  const [printDateLong] = useState(() => new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }))

  const fileInputRef = useRef(null)
  const pdfExportRef = useRef(null)
  const [pdfExporting, setPdfExporting] = useState(false)
  const [importStage, setImportStage] = useState(null) // null | 'mapping' | 'preview'
  const [importHeaders, setImportHeaders] = useState([])
  const [importRows, setImportRows] = useState([])
  const [importError, setImportError] = useState('')
  const [mappingError, setMappingError] = useState('')
  const [columnMap, setColumnMap] = useState({})
  const [importResult, setImportResult] = useState('')
  const [simCourseDate, setSimCourseDate] = useState('')
  const [courseDraft, setCourseDraft] = useState('')

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    setEntries(stored)
    const course = localStorage.getItem(SIM_COURSE_KEY) ?? ''
    setSimCourseDate(course)
    setCourseDraft(course)
  }, [])

  function saveCourseDate() {
    const next = courseDraft || ''
    setSimCourseDate(next)
    if (next) localStorage.setItem(SIM_COURSE_KEY, next)
    else localStorage.removeItem(SIM_COURSE_KEY)
  }

  function clearCourseDate() {
    setSimCourseDate('')
    setCourseDraft('')
    localStorage.removeItem(SIM_COURSE_KEY)
  }

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
  const phase = computePhaseProgress(entries, simCourseDate)
  const progressBars = buildProgressBars(phase)
  const recordSummary = computeRecordSummary(entries)
  const rankLabel = currentRankLabel(sorted)
  const { text: certStatusText, tone: certStatusTone } = certificateStatus(phase)
  const dayCountNotes = countingNotes(totals)
  const phaseNote = phaseAllocationNote(phase)

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
    <div className={`screen dplog-screen${pdfExporting ? ' pdf-exporting' : ''}`}>

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

        {dayCountNotes.map(note => <p className="dplog-short-note" key={note}>{note}</p>)}

        <div className="dplog-course no-print">
          <div className="dplog-thresh-heading">DP Simulator Course completed</div>
          <div className="dplog-course-row">
            <input
              type="date"
              value={courseDraft}
              onChange={e => setCourseDraft(e.target.value)}
              aria-label="DP Simulator Course completion date"
            />
            <button className="btn-secondary" onClick={saveCourseDate}>Save</button>
            {simCourseDate && <button className="btn-secondary" onClick={clearCourseDate}>Clear</button>}
          </div>
          {!simCourseDate && (
            <p className="dplog-course-hint">
              Set your DP Simulator Course date to track Phase D separately. Until then all days count toward Phase B.
            </p>
          )}
        </div>

        <div className="dplog-thresholds">
          <div className="dplog-thresh-heading">NI New Offshore Scheme Progress</div>
          {progressBars.map(bar => (
            <ThresholdBar
              key={bar.key}
              label={bar.label}
              value={bar.value}
              max={bar.max}
              suffix={bar.suffix}
              statusText={bar.key === 'dp23' ? certStatusText : bar.note}
              statusTone={bar.key === 'dp23' ? certStatusTone : 'warning'}
            />
          ))}
        </div>
      </div>

      <p className="dplog-thresh-explainer">{phaseNote}</p>

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
        <button className="btn-secondary" onClick={() => pdfExportRef.current?.run()}>Export PDF</button>
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

      <DPTimeLogPdfExport
        ref={pdfExportRef}
        entries={sorted}
        traineeName={traineeName}
        rankLabel={rankLabel}
        generatedDate={printDateLong}
        totals={totals}
        recordSummary={recordSummary}
        countingNotes={dayCountNotes}
        progressBars={progressBars}
        certStatusText={certStatusText}
        phaseNote={phaseNote}
        onActiveChange={setPdfExporting}
      />
    </div>
  )
}
