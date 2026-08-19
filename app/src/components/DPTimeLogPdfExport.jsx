import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, useState, useEffect } from 'react'

// A4 @ 96 CSS px/inch, matching the @page rule in index.css.
const MM_TO_PX = 96 / 25.4
const PAGE_MARGIN_MM = 14
const PAGE_HEIGHT_PX = 297 * MM_TO_PX
// Buffered below the true printable height to absorb font-metric rounding
// differences between on-screen measurement and the browser's print renderer.
const USABLE_HEIGHT_PX = Math.floor((PAGE_HEIGHT_PX - PAGE_MARGIN_MM * 2 * MM_TO_PX) * 0.93)
const PAGE_CONTENT_WIDTH_PX = 680

const TABLE_COLUMNS = [
  { key: 'period', label: 'Period', width: '8%' },
  { key: 'vessel', label: 'Vessel', width: '11%' },
  { key: 'vesselType', label: 'Vessel Type', width: '8%' },
  { key: 'date', label: 'Date', width: '10%' },
  { key: 'ap', label: 'A/P', width: '5%' },
  { key: 'hours', label: 'Hours', width: '6%' },
  { key: 'dpClass', label: 'DP Class', width: '8%' },
  { key: 'activity', label: 'Activity', width: '8%' },
  { key: 'rank', label: 'Rank', width: '8%' },
  { key: 'notes', label: 'Notes', width: '28%' },
]

function formatDate(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function computeRecordSummary(entries) {
  const dp1Dates = new Set()
  const dp23Dates = new Set()
  entries.forEach(e => {
    if (e.dpClass === 'DP1') dp1Dates.add(e.date)
    else if (e.dpClass === 'DP2' || e.dpClass === 'DP3') dp23Dates.add(e.date)
  })
  const dates = entries.map(e => e.date).filter(Boolean).sort()
  return {
    dp1Days: dp1Dates.size,
    dp23Days: dp23Dates.size,
    firstDate: dates[0] ?? null,
    lastDate: dates[dates.length - 1] ?? null,
  }
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

function PageHeader({ traineeName, generatedDate, pageNum, totalPages }) {
  return (
    <div className="pdf-header">
      <div className="pdf-header-row">
        <div className="pdf-header-title">DP Time Log</div>
        <div className="pdf-header-page">Page {pageNum} of {totalPages}</div>
      </div>
      <div className="pdf-header-meta">
        <span>{traineeName || 'Trainee name not set'}</span>
        <span>Generated: {generatedDate}</span>
      </div>
      <div className="pdf-header-rule" />
    </div>
  )
}

function EntryTable({ rows }) {
  return (
    <table className="pdf-table">
      <colgroup>
        {TABLE_COLUMNS.map(c => <col key={c.key} style={{ width: c.width }} />)}
      </colgroup>
      <thead>
        <tr>
          {TABLE_COLUMNS.map(c => <th key={c.key}>{c.label}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map(e => (
          <tr key={e.id}>
            <td>{e.period}</td>
            <td>{e.vesselName}</td>
            <td>{e.vesselType}</td>
            <td>{formatDate(e.date)}</td>
            <td>{e.type}</td>
            <td>{e.hours}</td>
            <td>{e.dpClass}</td>
            <td>{e.activityCode}</td>
            <td>{e.rank}</td>
            <td>{e.notes}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function SummaryBlock({ entries, totals, ni, certStatusText }) {
  const recordSummary = computeRecordSummary(entries)
  return (
    <div className="pdf-summary">
      <div className="pdf-summary-col">
        <div className="pdf-summary-heading">Record Totals</div>
        <div className="pdf-summary-row"><span>Total DP days</span><span>{totals.totalDays}</span></div>
        <div className="pdf-summary-row"><span>Active days</span><span>{totals.activeDays} ({totals.activeHours} hrs)</span></div>
        <div className="pdf-summary-row"><span>Passive days</span><span>{totals.passiveDays} ({totals.passiveHours} hrs)</span></div>
        <div className="pdf-summary-row"><span>Days on DP1 vessels</span><span>{recordSummary.dp1Days}</span></div>
        <div className="pdf-summary-row"><span>Days on DP2/DP3 vessels</span><span>{recordSummary.dp23Days}</span></div>
        <div className="pdf-summary-row"><span>First entry</span><span>{formatDate(recordSummary.firstDate)}</span></div>
        <div className="pdf-summary-row"><span>Last entry</span><span>{formatDate(recordSummary.lastDate)}</span></div>
      </div>
      <div className="pdf-summary-col">
        <div className="pdf-summary-heading">NI New Offshore Scheme Progress</div>
        <div className="pdf-summary-row"><span>Total days toward certification</span><span>{ni.totalDays} of 120</span></div>
        <div className="pdf-summary-row"><span>Passive days used</span><span>{Math.min(ni.passiveDays, 30)} of 30 maximum</span></div>
        <div className="pdf-summary-row"><span>DP2/DP3 days</span><span>{ni.dp23Days} of 60 for Unlimited</span></div>
        <div className="pdf-summary-cert">{certStatusText}</div>
      </div>
    </div>
  )
}

function DeclarationPage() {
  return (
    <>
      <div className="pdf-declaration">
        <div className="pdf-declaration-heading">Trainee Declaration</div>
        <p className="pdf-declaration-text">
          I certify that the DP sea time recorded in this document is a true and accurate record of time
          served on the DP desk, and that each day recorded represents a minimum of two hours on watch.
        </p>
        <div className="pdf-sig-block">
          <div className="pdf-sig-line"><span className="pdf-sig-label">Name:</span><span className="pdf-sig-fill" /></div>
          <div className="pdf-sig-line"><span className="pdf-sig-label">Signature:</span><span className="pdf-sig-fill" /></div>
          <div className="pdf-sig-line"><span className="pdf-sig-label">Date:</span><span className="pdf-sig-fill" /></div>
        </div>
      </div>
      <div className="pdf-doc-footer">
        <p>
          This document is a personal record produced by DPTrainer to support cross-checking of DP sea
          time. It is not a certification document. The original signed NI logbook and company
          confirmation letters remain the required evidence for any application to The Nautical Institute.
        </p>
        <p>DPTrainer is not affiliated with or endorsed by The Nautical Institute.</p>
      </div>
    </>
  )
}

const DPTimeLogPdfExport = forwardRef(function DPTimeLogPdfExport(
  { entries, traineeName, generatedDate, totals, ni, certStatusText, onActiveChange },
  ref
) {
  const [phase, setPhase] = useState(null) // null | 'measuring' | 'ready'
  const [pages, setPages] = useState([])

  useEffect(() => {
    onActiveChange?.(phase !== null)
  }, [phase, onActiveChange])

  const headerMeasureRef = useRef(null)
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
    const headerH = headerMeasureRef.current?.offsetHeight ?? 0
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

  return (
    <div className={`pdf-export-root${phase === 'ready' ? ' pdf-export-root--ready' : ''}`}>
      {phase === 'measuring' && (
        <div className="pdf-page" style={{ width: PAGE_CONTENT_WIDTH_PX }}>
          <div ref={headerMeasureRef}>
            <PageHeader traineeName={traineeName} generatedDate={generatedDate} pageNum={1} totalPages={1} />
          </div>
          <div ref={summaryMeasureRef}>
            <SummaryBlock entries={entries} totals={totals} ni={ni} certStatusText={certStatusText} />
          </div>
          <table className="pdf-table">
            <colgroup>
              {TABLE_COLUMNS.map(c => <col key={c.key} style={{ width: c.width }} />)}
            </colgroup>
            <thead ref={theadMeasureRef}>
              <tr>
                {TABLE_COLUMNS.map(c => <th key={c.key}>{c.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {entries.map((e, idx) => (
                <tr key={e.id} ref={el => { rowRefs.current[idx] = el }}>
                  <td>{e.period}</td>
                  <td>{e.vesselName}</td>
                  <td>{e.vesselType}</td>
                  <td>{formatDate(e.date)}</td>
                  <td>{e.type}</td>
                  <td>{e.hours}</td>
                  <td>{e.dpClass}</td>
                  <td>{e.activityCode}</td>
                  <td>{e.rank}</td>
                  <td>{e.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {phase === 'ready' && pages.map((rows, i) => (
        <div className="pdf-page" key={i} style={{ width: PAGE_CONTENT_WIDTH_PX }}>
          <PageHeader traineeName={traineeName} generatedDate={generatedDate} pageNum={i + 1} totalPages={totalPages} />
          {i === 0 && <SummaryBlock entries={entries} totals={totals} ni={ni} certStatusText={certStatusText} />}
          <EntryTable rows={rows} />
        </div>
      ))}

      {phase === 'ready' && (
        <div className="pdf-page" style={{ width: PAGE_CONTENT_WIDTH_PX }}>
          <PageHeader traineeName={traineeName} generatedDate={generatedDate} pageNum={totalPages} totalPages={totalPages} />
          <DeclarationPage />
        </div>
      )}
    </div>
  )
})

export default DPTimeLogPdfExport
