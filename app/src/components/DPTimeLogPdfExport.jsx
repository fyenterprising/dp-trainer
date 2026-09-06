/*
 * DP Time Log — PDF export
 * ========================
 *
 * A paginated print document for the DP Time Log. It builds its own pages in the
 * DOM rather than handing a long table to the browser and letting `@page` break
 * it up.
 *
 *
 * WHY NOT JUST window.print()?
 * ----------------------------
 * Every one of these needs the page breaks to be known BEFORE the markup is
 * rendered, and CSS gives us no way to ask where they will fall:
 *
 *   - The table header repeats at the top of each page. (`thead` repeat is
 *     patchy across print engines and cannot be combined with the rest below.)
 *   - A row is never split down the middle by a page break.
 *   - "Page X of Y" is accurate — Y is not knowable until the rows are packed.
 *   - The declaration and status callout always land on their own final page.
 *   - The tfoot totals row appears exactly once, at the end of the last table
 *     page, not repeated on every page.
 *
 * So the component measures first and lays out second.
 *
 *
 * THE SEQUENCE
 * ------------
 * `run()` (via the imperative ref) starts a three-phase cycle:
 *
 *   1. phase 'measuring'  Everything — running header, running footer, the page-1
 *                         intro block, the table head, and every single row — is
 *                         rendered once into a hidden off-canvas page. Refs are
 *                         attached so the browser's real laid-out heights can be
 *                         read back. Nothing is guessed from font metrics.
 *
 *   2. paginateRows()     Rows are packed greedily into explicit page containers
 *                         against USABLE_HEIGHT_PX, using the heights measured in
 *                         step 1.
 *
 *   3. phase 'ready'      Each packed page renders as its own `.pdf-page` element,
 *                         with the running header and footer repeated, and CSS
 *                         `page-break-after: always` forcing one element per sheet.
 *                         Two rAFs later, window.print() fires.
 *
 * The 'afterprint' event resets back to phase null and unmounts the whole thing.
 *
 *
 * THE PAGE-HEIGHT BUDGET
 * ----------------------
 * USABLE_HEIGHT_PX is what rows are packed against, and it is derived from three
 * things that live partly in this file and partly in index.css:
 *
 *     paper height (A4, 297mm)
 *   − the vertical padding `.pdf-page` sets in print CSS (0.5in top + bottom)
 *   − the running header band and the running footer band (both measured)
 *
 * `@page` uses `margin: 0` — that is what strips the browser's own URL/timestamp
 * chrome — so ALL of the paper margin comes from `.pdf-page`'s own padding.
 *
 * Change the paper size, that padding, or the height of the header or footer, and
 * the number of rows that fit per page changes with it. Get it wrong in the
 * generous direction and pages over-pack: rows fall off the bottom of the sheet or
 * orphan onto a page of their own. Nothing in the UI will tell you — it only shows
 * up in the printed output at scale.
 *
 *
 * SAFE TO CHANGE
 * --------------
 *   - Visual styling: colours, type, spacing, borders (mostly in index.css).
 *   - Column widths and labels in TABLE_COLUMNS, as long as they still sum to 100%.
 *   - What each section renders — which stats, which progress bars, wording.
 *   - Adding or removing a section from the page-1 intro block.
 *
 * NOT SAFE TO CHANGE without re-testing pagination on a large record
 * ------------------------------------------------------------------
 *   - The measure-then-pack sequence, or the phase state machine that drives it.
 *   - USABLE_HEIGHT_PX, its buffer, or anything feeding the height budget above —
 *     including `.pdf-page` padding and the header/footer band heights.
 *   - Which elements carry measurement refs, and the assumption that a row's
 *     measured height equals its height on the final page (it does today because
 *     the measuring pass and the real pages use identical width and CSS — the
 *     `.pdf-*` rules are deliberately NOT inside `@media print` for this reason).
 *
 * Test with a few hundred entries and long free-text notes, and check the last
 * table page, where the tfoot lands. See the comment on USABLE_HEIGHT_PX below.
 *
 *
 * docs/pdf-styling-spec.md is the authority on every visual value here — colours,
 * sizes, spacing, column widths, and which figures each section shows. Change the
 * spec in the same pass as the code so the two do not drift.
 */

import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, useState, useEffect } from 'react'

// A4 @ 96 CSS px/inch. The @page rule in index.css uses margin:0 and each
// .pdf-page supplies its own padding instead, so the packing budget is the
// padded content box rather than the old margin box.
const MM_TO_PX = 96 / 25.4
const PAGE_HEIGHT_PX = 297 * MM_TO_PX
const PAGE_WIDTH_PX = 210 * MM_TO_PX
// Must stay in step with the `.pdf-page` padding in index.css (0.5in top + bottom).
const PAGE_PADDING_Y_PX = 0.5 * 96 * 2
// The row-packing budget: printable height inside the page padding, less a 7%
// buffer. The buffer absorbs two things — font-metric rounding between the
// on-screen measurement pass and the browser's print renderer, and the tfoot
// band, which renders only on the final table page and so is deliberately left
// out of the per-page budget below rather than costing every page a row.
// Raising the 0.93 fits more rows per page and eats into both margins of safety.
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

function RecordTotals({ totals, recordSummary, notes }) {
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
      {notes?.length > 0 && (
        <div className="pdf-stat-notes">
          {notes.map(note => <div key={note}>{note}</div>)}
        </div>
      )}
    </>
  )
}

function ProgressBar({ label, value, max, suffix, tone, note }) {
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
      {note && <div className="pdf-bar-note">{note}</div>}
    </div>
  )
}

// The bar list is built by the screen and passed down whole, so the panel here
// always shows exactly what the on-screen thresholds panel shows — four bars
// without a Simulator Course date, six with one.
function ProgressPanel({ bars, certStatusText, phaseNote }) {
  return (
    <div className="pdf-panel">
      {bars.map(bar => (
        <ProgressBar
          key={bar.key}
          label={bar.label}
          value={bar.value}
          max={bar.max}
          suffix={bar.suffix}
          note={bar.note}
          tone={bar.key === 'total' ? 'navy' : 'sky'}
        />
      ))}
      <div className="pdf-panel-foot">
        <span className="pdf-panel-status">{certStatusText}</span>
        <span className="pdf-panel-caveat">{phaseNote}</span>
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

// Greedy first-fit packing over the measured row heights: walk the rows in order,
// adding each to the current page until one would overflow the budget, then start
// a new page. Rows are never reordered or split.
//
// `headerH` is the fixed per-page overhead — running header plus running footer,
// summed by the caller, since both repeat on every page. `summaryH` is the page-1
// intro block (title, record totals, progress panel, section labels), so it is
// charged to the first page only and dropped when a page breaks. `theadH` is
// charged to every page because the table head repeats.
//
// The `currentRows.length > 0` guard is what stops a single row taller than the
// whole budget from looping forever: such a row is placed anyway and overflows,
// which is visible in the output rather than silently swallowed.
function paginateRows(entries, rowHeights, { headerH, summaryH, theadH }) {
  const pages = []
  let currentRows = []
  let currentHeight = headerH + summaryH + theadH

  entries.forEach((entry, idx) => {
    const rh = rowHeights[idx] || 0
    if (currentHeight + rh > USABLE_HEIGHT_PX && currentRows.length > 0) {
      pages.push(currentRows)
      currentRows = []
      // Page 2 onward: no intro block, but the header/footer and thead recur.
      currentHeight = headerH + theadH
    }
    currentRows.push(entry)
    currentHeight += rh
  })
  // The trailing partial page always ships, even when empty — an empty record
  // still needs one table page so that "Page X of Y" and the declaration line up.
  pages.push(currentRows)
  return pages
}

const DPTimeLogPdfExport = forwardRef(function DPTimeLogPdfExport(
  { entries, traineeName, rankLabel, generatedDate, totals, recordSummary, countingNotes, progressBars, certStatusText, phaseNote, onActiveChange },
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

  // Measurement step. useLayoutEffect (not useEffect) so this runs after the
  // browser has laid the hidden page out but before it paints — the offsetHeight
  // reads below are the real rendered heights, including however many lines a
  // long Notes cell actually wrapped to. Nothing here is estimated from font
  // metrics, which is the whole reason the measuring pass exists.
  useLayoutEffect(() => {
    if (phase !== 'measuring') return
    // Header and footer are summed into one figure: both repeat on every page, so
    // to the packer they are a single fixed per-page overhead.
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
              <RecordTotals totals={totals} recordSummary={recordSummary} notes={countingNotes} />
              <SectionLabel>NI New Offshore Scheme — Progress</SectionLabel>
              <ProgressPanel bars={progressBars} certStatusText={certStatusText} phaseNote={phaseNote} />
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
                  <RecordTotals totals={totals} recordSummary={recordSummary} notes={countingNotes} />
                  <SectionLabel>NI New Offshore Scheme — Progress</SectionLabel>
                  <ProgressPanel bars={progressBars} certStatusText={certStatusText} phaseNote={phaseNote} />
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
