import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, useState, useEffect } from 'react'

// A4 @ 96 CSS px/inch. The @page rule in index.css uses margin:0 and each
// .pdf-page supplies its own padding instead, so the packing budget is the
// padded content box rather than the old margin box.
const MM_TO_PX = 96 / 25.4
const PAGE_HEIGHT_PX = 297 * MM_TO_PX
const PAGE_WIDTH_PX = 210 * MM_TO_PX
const PAGE_PADDING_Y_PX = 0.5 * 96 * 2
// Buffered below the true printable height to absorb font-metric rounding
// differences between on-screen measurement and the browser's print renderer.
// The same buffer covers the tfoot band, which is rendered only on the final
// table page and so is not part of the per-page budget below.
const USABLE_HEIGHT_PX = Math.floor((PAGE_HEIGHT_PX - PAGE_PADDING_Y_PX) * 0.93)

const TABLE_COLUMNS = [
  { key: 'num', label: '#', width: '4%' },
  { key: 'date', label: 'Date', width: '12%' },
  { key: 'vessel', label: 'Vessel', width: '22%' },
  { key: 'vesselType', label: 'Type', width: '6%' },
  { key: 'ap', label: 'A/P', width: '5%' },
  { key: 'hours', label: 'Hrs', width: '5%' },
  { key: 'dpClass', label: 'DP', width: '6%' },
  { key: 'activity', label: 'Activity', width: '10%' },
  { key: 'rank', label: 'Rank', width: '6%' },
  { key: 'notes', label: 'Notes', width: '24%' },
]

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDate(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

// "12 Mar 2025". The year is always printed — see the Period note in
// docs/pdf-styling-spec.md.
function formatDayMonthYear(iso) {
  if (!iso) return null
  const [y, m, d] = iso.split('-')
  return `${parseInt(d, 10)} ${MONTHS_SHORT[parseInt(m, 10) - 1]} ${y}`
}

function formatPeriod(firstDate, lastDate) {
  const from = formatDayMonthYear(firstDate)
  const to = formatDayMonthYear(lastDate)
  if (!from || !to) return '—'
  return `${from} – ${to}`
}

function BrandMark() {
  return (
    <svg className="pdf-brand-icon" viewBox="0 0 100 100" width="30" height="30" aria-hidden="true">
      <rect width="100" height="100" rx="22" fill="#003087" />
      <rect x="46.5" y="6" width="7" height="20" rx="3.5" fill="#0087c8" />
      <rect x="46.5" y="74" width="7" height="20" rx="3.5" fill="#0087c8" />
      <rect x="6" y="46.5" width="20" height="7" rx="3.5" fill="#0087c8" />
      <rect x="74" y="46.5" width="20" height="7" rx="3.5" fill="#0087c8" />
      <circle cx="50" cy="50" r="27" fill="none" stroke="#FFFFFF" strokeWidth="7" />
      <circle cx="50" cy="50" r="7.5" fill="#FFFFFF" />
    </svg>
  )
}

function PageHeader() {
  return (
    <div className="pdf-header">
      <div className="pdf-wordmark">
        <BrandMark />
        <span className="pdf-wordmark-text">
          <span className="pdf-wordmark-dp">DP</span><span className="pdf-wordmark-trainer">Trainer</span>
        </span>
      </div>
    </div>
  )
}

function PageFooter({ traineeName, rankLabel, generatedDate, pageNum, totalPages }) {
  const identity = [traineeName || 'Trainee name not set', rankLabel].filter(Boolean).join(' · ')
  return (
    <div className="pdf-footer">
      <span className="pdf-footer-id">{identity}</span>
      <span className="pdf-footer-note">Personal record produced by DPTrainer — not a certification document.</span>
      <span className="pdf-footer-meta">Generated {generatedDate} · Page {pageNum} of {totalPages}</span>
    </div>
  )
}

function SectionLabel({ children, aside }) {
  return (
    <div className="pdf-section-label">
      <span>{children}</span>
      {aside && <span className="pdf-section-aside">{aside}</span>}
    </div>
  )
}

function TitleBlock({ traineeName, rankLabel, period }) {
  return (
    <div className="pdf-title-block">
      <div>
        <h1 className="pdf-title">DP Time Log</h1>
        <div className="pdf-subtitle">Dynamic positioning sea time — cross-check record</div>
      </div>
      <div className="pdf-meta-grid">
        <span className="pdf-meta-label">Trainee</span>
        <span className="pdf-meta-value">{traineeName || 'Not set'}</span>
        <span className="pdf-meta-label">Rank</span>
        <span className="pdf-meta-value">{rankLabel || '—'}</span>
        <span className="pdf-meta-label">Period</span>
        <span className="pdf-meta-value">{period}</span>
      </div>
    </div>
  )
}

function RecordTotals({ totals, recordSummary }) {
  return (
    <>
      <div className="pdf-stat-grid">
        <div className="pdf-stat pdf-stat--lead">
          <div className="pdf-stat-value pdf-stat-value--navy">{totals.totalDays}</div>
          <div className="pdf-stat-label">Total DP days</div>
        </div>
        <div className="pdf-stat">
          <div className="pdf-stat-value">{totals.activeDays}</div>
          <div className="pdf-stat-label">Active days</div>
          <div className="pdf-stat-sub">{totals.activeHours} hours</div>
        </div>
        <div className="pdf-stat">
          <div className="pdf-stat-value">{totals.passiveDays}</div>
          <div className="pdf-stat-label">Passive days</div>
          <div className="pdf-stat-sub">{totals.passiveHours} hours</div>
        </div>
        <div className="pdf-stat">
          <div className="pdf-stat-value">{totals.totalHours}</div>
          <div className="pdf-stat-label">Total hours</div>
        </div>
      </div>
      <div className="pdf-stat-grid pdf-stat-grid--secondary">
        <div className="pdf-stat-row">
          <span className="pdf-stat-row-label">Days on DP1 vessels</span>
          <span className="pdf-stat-row-value">{recordSummary.dp1Days}</span>
        </div>
        <div className="pdf-stat-row">
          <span className="pdf-stat-row-label">Days on DP2 / DP3 vessels</span>
          <span className="pdf-stat-row-value">{recordSummary.dp23Days}</span>
        </div>
        <div className="pdf-stat-row">
          <span className="pdf-stat-row-label">Vessels served</span>
          <span className="pdf-stat-row-value">{recordSummary.vesselsServed}</span>
        </div>
      </div>
    </>
  )
}

function ProgressBar({ label, value, max, suffix, tone }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="pdf-bar">
      <div className="pdf-bar-head">
        <span className="pdf-bar-label">{label}</span>
        <span className="pdf-bar-value">{value} <span className="pdf-bar-max">of {max}{suffix ? ` ${suffix}` : ''}</span></span>
      </div>
      <div className="pdf-bar-track">
        <div className={`pdf-bar-fill pdf-bar-fill--${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function ProgressPanel({ ni, certStatusText }) {
  return (
    <div className="pdf-panel">
      <ProgressBar label="Total days toward certification" value={ni.totalDays} max={120} tone="navy" />
      <ProgressBar label="Passive days used" value={Math.min(ni.passiveDays, 30)} max={30} suffix="maximum" tone="sky" />
      <ProgressBar label="DP2 / DP3 days toward Unlimited certificate" value={ni.dp23Days} max={60} tone="sky" />
      <div className="pdf-panel-foot">
        <span className="pdf-panel-status">{certStatusText}</span>
        <span className="pdf-panel-caveat">
          Phase allocation is split by your Induction and Simulator Course dates — confirm against your logbook.
        </span>
      </div>
    </div>
  )
}

function EntryRow({ entry, rowNumber }) {
  return (
    <tr>
      <td className="pdf-col-num">{rowNumber}</td>
      <td className="pdf-col-date">{formatDate(entry.date)}</td>
      <td className="pdf-col-vessel">{entry.vesselName || '—'}</td>
      <td>{entry.vesselType || '—'}</td>
      <td className={`pdf-col-ap pdf-col-ap--${entry.type === 'A' ? 'active' : 'passive'}`}>{entry.type}</td>
      <td className="pdf-col-hrs">{entry.hours}</td>
      <td>{entry.dpClass || '—'}</td>
      <td>{entry.activityCode || '—'}</td>
      <td>{entry.rank || '—'}</td>
      <td className="pdf-col-notes">{entry.notes || '—'}</td>
    </tr>
  )
}

function EntryTable({ rows, startIndex, totals, showFoot }) {
  return (
    <table className="pdf-table">
      <colgroup>
        {TABLE_COLUMNS.map(c => <col key={c.key} style={{ width: c.width }} />)}
      </colgroup>
      <thead>
        <tr>
          {TABLE_COLUMNS.map(c => <th key={c.key} style={{ width: c.width }}>{c.label}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((e, idx) => <EntryRow key={e.id} entry={e} rowNumber={startIndex + idx + 1} />)}
      </tbody>
      {showFoot && (
        <tfoot>
          <tr>
            <td colSpan={5} className="pdf-tfoot-label">Total — {totals.totalDays} days</td>
            <td className="pdf-tfoot-hours">{totals.totalHours}</td>
            <td colSpan={4} className="pdf-tfoot-split">{totals.activeDays} active · {totals.passiveDays} passive</td>
          </tr>
        </tfoot>
      )}
    </table>
  )
}

function DeclarationPage() {
  return (
    <>
      <SectionLabel>Trainee declaration</SectionLabel>
      <p className="pdf-declaration-text">
        I certify that the DP sea time recorded in this document is a true and accurate record of time
        served on the DP desk, and that each day recorded represents a minimum of two hours on watch.
      </p>
      <div className="pdf-sig-grid">
        <div className="pdf-sig-field"><div className="pdf-sig-rule" /><div className="pdf-sig-caption">Name</div></div>
        <div className="pdf-sig-field"><div className="pdf-sig-rule" /><div className="pdf-sig-caption">Signature</div></div>
        <div className="pdf-sig-field"><div className="pdf-sig-rule" /><div className="pdf-sig-caption">Date</div></div>
      </div>
      <div className="pdf-callout">
        <div className="pdf-callout-label">Status of this document</div>
        <p className="pdf-callout-body">
          This is a personal record produced by DPTrainer to support cross-checking of DP sea time. It is
          not a certification document. The original signed NI logbook and company confirmation letters
          remain the required evidence for any application to The Nautical Institute. DPTrainer is not
          affiliated with or endorsed by The Nautical Institute.
        </p>
      </div>
    </>
  )
}

function paginateRows(entries, rowHeights, { headerH, summaryH, theadH }) {
  const pages = []
  let currentRows = []
  let currentHeight = headerH + summaryH + theadH

  entries.forEach((entry, idx) => {
    const rh = rowHeights[idx] || 0
    if (currentHeight + rh > USABLE_HEIGHT_PX && currentRows.length > 0) {
      pages.push(currentRows)
      currentRows = []
      currentHeight = headerH + theadH
    }
    currentRows.push(entry)
    currentHeight += rh
  })
  pages.push(currentRows)
  return pages
}

const DPTimeLogPdfExport = forwardRef(function DPTimeLogPdfExport(
  { entries, traineeName, rankLabel, generatedDate, totals, recordSummary, ni, certStatusText, onActiveChange },
  ref
) {
  const [phase, setPhase] = useState(null) // null | 'measuring' | 'ready'
  const [pages, setPages] = useState([])

  useEffect(() => {
    onActiveChange?.(phase !== null)
  }, [phase, onActiveChange])

  const headerMeasureRef = useRef(null)
  const footerMeasureRef = useRef(null)
  const summaryMeasureRef = useRef(null)
  const theadMeasureRef = useRef(null)
  const rowRefs = useRef([])

  useImperativeHandle(ref, () => ({
    run() {
      rowRefs.current = []
      setPhase('measuring')
    },
  }))

  useEffect(() => {
    const reset = () => { setPhase(null); setPages([]) }
    window.addEventListener('afterprint', reset)
    return () => window.removeEventListener('afterprint', reset)
  }, [])

  useLayoutEffect(() => {
    if (phase !== 'measuring') return
    // The running header and footer repeat on every page, so both come out of
    // the per-page budget before any rows are packed.
    const headerH = (headerMeasureRef.current?.offsetHeight ?? 0) + (footerMeasureRef.current?.offsetHeight ?? 0)
    const summaryH = summaryMeasureRef.current?.offsetHeight ?? 0
    const theadH = theadMeasureRef.current?.offsetHeight ?? 0
    const rowHeights = entries.map((_, idx) => rowRefs.current[idx]?.offsetHeight ?? 0)
    const computed = paginateRows(entries, rowHeights, { headerH, summaryH, theadH })
    setPages(computed)
    setPhase('ready')
  }, [phase, entries])

  useEffect(() => {
    if (phase !== 'ready') return
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print()
      })
    })
  }, [phase])

  if (!phase) return null

  const totalPages = phase === 'ready' ? pages.length + 1 : 1
  const period = formatPeriod(recordSummary.firstDate, recordSummary.lastDate)
  const entriesAside = `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} · dates dd/mm/yyyy · A active, P passive`
  const pageStyle = { width: PAGE_WIDTH_PX, height: PAGE_HEIGHT_PX }

  let rowOffset = 0

  return (
    <div className={`pdf-export-root${phase === 'ready' ? ' pdf-export-root--ready' : ''}`}>
      {phase === 'measuring' && (
        <div className="pdf-page" style={pageStyle}>
          <div ref={headerMeasureRef}><PageHeader /></div>
          <div className="pdf-page-body">
            <div ref={summaryMeasureRef}>
              <TitleBlock traineeName={traineeName} rankLabel={rankLabel} period={period} />
              <SectionLabel>Record totals</SectionLabel>
              <RecordTotals totals={totals} recordSummary={recordSummary} />
              <SectionLabel>NI New Offshore Scheme — Progress</SectionLabel>
              <ProgressPanel ni={ni} certStatusText={certStatusText} />
              <SectionLabel aside={entriesAside}>Entries</SectionLabel>
            </div>
            <table className="pdf-table">
              <colgroup>
                {TABLE_COLUMNS.map(c => <col key={c.key} style={{ width: c.width }} />)}
              </colgroup>
              <thead ref={theadMeasureRef}>
                <tr>
                  {TABLE_COLUMNS.map(c => <th key={c.key} style={{ width: c.width }}>{c.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {entries.map((e, idx) => (
                  <tr key={e.id} ref={el => { rowRefs.current[idx] = el }}>
                    <td className="pdf-col-num">{idx + 1}</td>
                    <td className="pdf-col-date">{formatDate(e.date)}</td>
                    <td className="pdf-col-vessel">{e.vesselName || '—'}</td>
                    <td>{e.vesselType || '—'}</td>
                    <td className="pdf-col-ap">{e.type}</td>
                    <td className="pdf-col-hrs">{e.hours}</td>
                    <td>{e.dpClass || '—'}</td>
                    <td>{e.activityCode || '—'}</td>
                    <td>{e.rank || '—'}</td>
                    <td className="pdf-col-notes">{e.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div ref={footerMeasureRef}>
            <PageFooter traineeName={traineeName} rankLabel={rankLabel} generatedDate={generatedDate} pageNum={1} totalPages={1} />
          </div>
        </div>
      )}

      {phase === 'ready' && pages.map((rows, i) => {
        const startIndex = rowOffset
        rowOffset += rows.length
        return (
          <div className="pdf-page" key={i} style={pageStyle}>
            <PageHeader />
            <div className="pdf-page-body">
              {i === 0 && (
                <>
                  <TitleBlock traineeName={traineeName} rankLabel={rankLabel} period={period} />
                  <SectionLabel>Record totals</SectionLabel>
                  <RecordTotals totals={totals} recordSummary={recordSummary} />
                  <SectionLabel>NI New Offshore Scheme — Progress</SectionLabel>
                  <ProgressPanel ni={ni} certStatusText={certStatusText} />
                  <SectionLabel aside={entriesAside}>Entries</SectionLabel>
                </>
              )}
              <EntryTable
                rows={rows}
                startIndex={startIndex}
                totals={totals}
                showFoot={i === pages.length - 1}
              />
            </div>
            <PageFooter traineeName={traineeName} rankLabel={rankLabel} generatedDate={generatedDate} pageNum={i + 1} totalPages={totalPages} />
          </div>
        )
      })}

      {phase === 'ready' && (
        <div className="pdf-page" style={pageStyle}>
          <PageHeader />
          <div className="pdf-page-body">
            <DeclarationPage />
          </div>
          <PageFooter traineeName={traineeName} rankLabel={rankLabel} generatedDate={generatedDate} pageNum={totalPages} totalPages={totalPages} />
        </div>
      )}
    </div>
  )
})

export default DPTimeLogPdfExport
