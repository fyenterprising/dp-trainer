/*
 * Curriculum review documents — .docx generator
 * =============================================
 *
 * Builds the four curriculum review documents into docs/curriculum/ as editable
 * Word files, so instructors can comment on them and mark them up with tracked
 * changes.
 *
 *   00-cover-page.docx        The cover sheet on its own.
 *   01-complete-reference.docx  Every task, every field, every variant.
 *   02-review-copy.docx       Reduced fields, for marking up.
 *   03-model-answers.docx     The review copy plus model answers and expected
 *                             outcomes, with the reference vessel on page 2.
 *
 * Run it with:  node scripts/build-curriculum-docs.js
 *
 * This is a SCRIPT, not app code. Nothing here is imported by the web app, and
 * nothing here should be — the documents are a periodic output, not a feature.
 * What it does share with the app is the content itself, read through
 * app/src/data/content.js, so a task edited in content/domains/ shows up in the
 * next build of these documents without anything being kept in step by hand.
 *
 *
 * WHY content.js IS BUNDLED BEFORE IT IS IMPORTED
 * -----------------------------------------------
 * content.js imports twenty .json files the way Vite allows and bare Node does
 * not — Node requires an explicit `with { type: 'json' }` import attribute and
 * throws ERR_IMPORT_ATTRIBUTE_MISSING without it. Rather than push Vite-hostile
 * syntax into app code to suit a script, the script runs content.js through
 * esbuild (already present, as a Vite dependency) into a temp bundle and imports
 * that. The app file stays exactly as the app needs it.
 *
 *
 * PAGE COUNT
 * ----------
 * A .docx has no page count of its own — Word decides where pages break when it
 * renders, from the fonts and the printer metrics on the machine opening it. So
 * this script cannot report one; it reports what it can actually count. See
 * docs/curriculum-export-spec.md for the counts measured by rendering the files
 * in Word, and treat them as being for that machine.
 *
 *
 * FORMATTING
 * ----------
 * Deliberately plain: black on white, one standard font, no brand marks. Word's
 * built-in Heading 1/2/3 styles are used rather than hand-rolled bold paragraphs,
 * because that is what populates the navigation pane — the only practical way to
 * move around a 90-page document.
 */

import { writeFileSync, mkdirSync, rmSync, statSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak,
  Table, TableRow, TableCell, WidthType, PageNumber, Footer, BorderStyle,
} from 'docx'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const OUT_DIR = join(ROOT, 'docs', 'curriculum')

/* ── CONTENT ────────────────────────────────────────────────────────────────── */

async function loadContent() {
  const esbuild = await import('esbuild')
  const tmp = join(tmpdir(), `dptrainer-content-${process.pid}.mjs`)
  await esbuild.build({
    entryPoints: [join(ROOT, 'app', 'src', 'data', 'content.js')],
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile: tmp,
    logLevel: 'silent',
  })
  try {
    return await import(pathToFileURL(tmp).href)
  } finally {
    rmSync(tmp, { force: true })
  }
}

/* ── COPY ───────────────────────────────────────────────────────────────────── */

// Mirrors the `source_reference` and `sources` fields carried by the domain
// files. Curated rather than derived: those fields name chapters and sections,
// and the cover wants the documents.
const SOURCE_DOCUMENTS = [
  'The Nautical Institute — DP Operator’s Certification Scheme (New Offshore Scheme), logbook task sections 1–12',
  'DP Operator’s Handbook, 3rd Edition — Bray, Daniels, Fiander, Foster (The Nautical Institute)',
  'IMCA M117 Rev. 3.3 — The Training and Experience of Key DP Personnel',
  'IMCA M220 Rev. 3.0 (Jan 2025) — Recommended Practice on Operational Activity Planning (ASOG, CAM/TAM, TAGOS)',
  'IMCA M249 Rev. 1 — DP Practitioner Accreditation Scheme Handbook',
  'IMCA M273 (Jan 2026) — A Guide to Conducting DP Drills and Ensuring Preparedness for DP Failures',
  'IMO MSC.1/Circ.1580 (Jun 2017) — Guidelines for vessels and units with dynamic positioning (DP) systems',
]

const REFERENCE_VESSEL = [
  ['Vessel', 'Generic DP2 PSV'],
  ['Heading', '000° True unless a task states otherwise'],
  ['Thrusters', 'Two bow tunnel, one stern tunnel, two main azimuth aft'],
  ['Power', 'Two switchboards, bus tie normally open, each board carrying one bow tunnel and one main'],
  ['References', 'Two DGPS'],
  ['Sensors', 'Two gyros, two wind, two VRU'],
]

const REFERENCE_VESSEL_NOTE =
  'Model answers are written against this reference vessel. Actual values will differ by vessel and conditions — the reasoning is what matters.'

const REVIEWER_INSTRUCTION =
  'Please mark anything unrealistic, missing, or wrongly placed within the 30 days. Marginal notes are more useful than a summary.'

const ABOUT_DPTRAINER =
  'DPTrainer is a structured session companion for Trainee Dynamic Positioning Operators undertaking Nautical Institute passive simulator days. It gives a TDPO a task to work through, a standard to meet, fields to record against, and questions to answer, for each of the 30 days the scheme allows. It is not a training provider. It does not instruct, assess, certify or sign off. The supervising DPO does all of that; DPTrainer only structures the time.'

/* ── FIELD FORMATTING ───────────────────────────────────────────────────────── */

function humanise(key) {
  const s = String(key).replace(/_/g, ' ').trim()
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function formatScalar(v) {
  if (v === true) return 'yes'
  if (v === false) return 'no'
  if (v === null || v === undefined) return '—'
  return String(v)
}

// Environment blocks and variant `changes` are free-form objects in the content
// files: mostly the six wind/wave/current keys, but also arrays of per-run
// conditions, `ramp_to` escalations and one-off keys used by a single task.
// Flatten any shape to labelled pairs rather than matching a fixed key list, so
// nothing is silently dropped from the document that claims to print everything.
function flattenPairs(value, prefix = '') {
  if (value === null || value === undefined) return []
  if (Array.isArray(value)) {
    return value.flatMap((v, i) => {
      const label = prefix ? `${prefix} ${i + 1}` : `Item ${i + 1}`
      return typeof v === 'object' && v !== null ? flattenPairs(v, label) : [[label, formatScalar(v)]]
    })
  }
  if (typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) => {
      const label = prefix ? `${prefix} — ${humanise(k)}` : humanise(k)
      return typeof v === 'object' && v !== null ? flattenPairs(v, label) : [[label, formatScalar(v)]]
    })
  }
  return [[prefix || 'Value', formatScalar(value)]]
}

const STANDARD_ENV_KEYS = new Set([
  'wind_speed_kts', 'wind_dir_deg', 'wave_height_m', 'wave_dir_deg',
  'current_speed_kts', 'current_dir_deg',
])

function summariseEnvironment(env) {
  if (!env || typeof env !== 'object' || Array.isArray(env)) return null
  const deg = d => String(d).padStart(3, '0')
  const parts = []
  if (env.wind_speed_kts !== undefined) {
    parts.push(`Wind ${env.wind_speed_kts} kt${env.wind_dir_deg !== undefined ? ` @ ${deg(env.wind_dir_deg)}°` : ''}`)
  }
  if (env.wave_height_m !== undefined) {
    parts.push(`Sea ${env.wave_height_m} m${env.wave_dir_deg !== undefined ? ` @ ${deg(env.wave_dir_deg)}°` : ''}`)
  }
  if (env.current_speed_kts !== undefined) {
    parts.push(`Current ${env.current_speed_kts} kt${env.current_dir_deg !== undefined ? ` @ ${deg(env.current_dir_deg)}°` : ''}`)
  }
  return parts.length ? parts.join(' · ') : null
}

function extraEnvironmentPairs(env) {
  if (!env || typeof env !== 'object' || Array.isArray(env)) return flattenPairs(env)
  return Object.entries(env)
    .filter(([k]) => !STANDARD_ENV_KEYS.has(k))
    .flatMap(([k, v]) => (typeof v === 'object' && v !== null
      ? flattenPairs(v, humanise(k))
      : [[humanise(k), formatScalar(v)]]))
}

// A slot carries the NI references for the day it is scheduled on; a task may
// also carry its own. They overlap but neither is a superset, so print the union.
function niRefsFor(slot, task) {
  return [...new Set([...(slot?.ni_task_ref ?? []), ...(task?.ni_task_ref ?? [])])]
}

function vesselModes(task) {
  if (task.vessel_mode_start || task.vessel_mode_execute) {
    return `${task.vessel_mode_start ?? '—'} → ${task.vessel_mode_execute ?? '—'}`
  }
  return task.vessel_mode ?? null
}

// Both observe_and_record shapes in the content files: a flat `fields` list, or
// `runs` + `fields_per_run` where the same fields are recorded once per run.
function observeFieldGroups(task) {
  const or = task.observe_and_record
  if (!or) return []
  if (Array.isArray(or.fields)) return [{ label: null, fields: or.fields }]
  if (Array.isArray(or.fields_per_run)) {
    const runs = Array.isArray(or.runs) ? or.runs : [1]
    return runs.map(r => ({ label: `Run ${r}`, fields: or.fields_per_run }))
  }
  return []
}

/* ── DOCX BUILDING BLOCKS ───────────────────────────────────────────────────── */

const BODY_SIZE = 22          // 11pt, in half-points

// Formatting follows what a document is FOR, not house style.
//
// `reference` is for looking things up: normal margins, near-normal leading, days
// running on continuously. Nobody writes in it, so every line of whitespace spent
// on annotation room is a line wasted.
//
// `annotated` is for marking up: a wide right margin for Word's comment balloons,
// loose leading to write between lines, and a page break before each training day
// so a reviewer can work through one day at a time and hand back a page.
//
// The difference is not cosmetic — it is worth well over a hundred pages on the
// complete reference. Line spacing is in 240ths of a line.
const PROFILES = {
  reference: {
    margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
    line: 276,          // 1.15
    dayPageBreak: false,
    paraAfter: 60,      // 3pt
    heading: { h1: [240, 120], h2: [180, 80], h3: [120, 60] },
  },
  annotated: {
    margin: { top: 1440, bottom: 1440, left: 1440, right: 3240 },
    line: 340,          // ~1.4
    dayPageBreak: true,
    paraAfter: 120,     // 6pt
    heading: { h1: [360, 160], h2: [280, 120], h3: [200, 80] },
  },
}
const HAIRLINE = { style: BorderStyle.SINGLE, size: 4, color: '999999' }
const CELL_BORDERS = { top: HAIRLINE, bottom: HAIRLINE, left: HAIRLINE, right: HAIRLINE }

const h1 = text => new Paragraph({ text, heading: HeadingLevel.HEADING_1 })
const h2 = text => new Paragraph({ text, heading: HeadingLevel.HEADING_2 })
const h3 = text => new Paragraph({ text, heading: HeadingLevel.HEADING_3 })

const para = (text, opts = {}) => new Paragraph({
  children: [new TextRun({ text, bold: opts.bold, italics: opts.italics, size: opts.size })],
  alignment: opts.alignment,
  spacing: opts.spacing,
  keepNext: opts.keepNext,
})

const bullet = text => new Paragraph({ text, bullet: { level: 0 } })
const spacer = () => new Paragraph({ text: '' })
// Separates one table from whatever follows it — two tables with nothing between
// them merge into one in Word. In a reference document the full empty line is
// dead height: there are roughly 750 of these in the complete reference, so the
// compact form is worth about a dozen pages. It still breaks the tables apart.
const compactSpacer = () => new Paragraph({
  children: [new TextRun({ text: '', size: 8 })],
  spacing: { line: 240, after: 0 },
})
const pageBreak = () => new Paragraph({ children: [new PageBreak()] })

// Cell paragraphs opt out of the document's body spacing. The 1.4 line height
// and 6pt paragraph gap are there to leave room to write between lines of prose;
// inherited into a table cell they just inflate every row, and across the ~475
// tables in the complete reference that came to well over a hundred pages.
function cell(text, { bold = false, width } = {}) {
  return new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text, bold })],
      spacing: { line: 240, after: 0 },
    })],
    borders: CELL_BORDERS,
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    margins: { top: 40, bottom: 40, left: 110, right: 110 },
  })
}

// Two-column table. `header` is optional; when given it becomes a bold first row
// that repeats if the table breaks across pages.
function table(rows, { header, widths = [32, 68] } = {}) {
  const body = rows.map(([a, b]) => new TableRow({
    children: [cell(a, { width: widths[0] }), cell(b, { width: widths[1] })],
  }))
  const head = header
    ? [new TableRow({
        children: [cell(header[0], { bold: true, width: widths[0] }), cell(header[1], { bold: true, width: widths[1] })],
        tableHeader: true,
      })]
    : []
  return new Table({
    rows: [...head, ...body],
    width: { size: 100, type: WidthType.PERCENTAGE },
  })
}

// Single-column table, used for the NI task reference list so a reviewer can
// attach a comment to one reference rather than to the whole line.
function listTable(header, values) {
  return new Table({
    rows: [
      new TableRow({ children: [cell(header, { bold: true, width: 100 })], tableHeader: true }),
      ...values.map(v => new TableRow({ children: [cell(v, { width: 100 })] })),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
  })
}

/* ── DOCUMENT SECTIONS ──────────────────────────────────────────────────────── */

// The cover has to come in at exactly one page: it is a cover, and in the model
// answers document it is what makes the reference vessel the SECOND page. The
// heading styles already carry their own `before` spacing, so this block spaces
// with that rather than with empty paragraphs — a spacer() between each section
// is about six lines of dead height, which is the difference between one page
// and two at this margin width.
function coverChildren(scope, generatedDate, dayRange) {
  // Single-spaced, unlike the body. The 1.4 line height exists to leave room to
  // write between lines, and nobody annotates the cover — at body spacing this
  // page runs to two, which would also push the reference vessel off page 2 of
  // the model answers document.
  const flow = { line: 250, after: 100 }
  const listed = { line: 250, after: 40 }
  return [
    new Paragraph({ text: 'DPTrainer — Curriculum Review', heading: HeadingLevel.TITLE }),
    para(ABOUT_DPTRAINER, { spacing: flow }),

    h2('Source documents behind the curriculum'),
    ...SOURCE_DOCUMENTS.map(text => new Paragraph({ text, bullet: { level: 0 }, spacing: listed })),

    h2('Scope'),
    para(`${scope.domains} domains · ${scope.tasks} tasks · ${scope.days} training days`, { bold: true, spacing: flow }),
    // Split copies say so on the cover as well as in the footer: the whole point
    // of them is that the reviewer knows at a glance this is a tenth of the
    // curriculum and not the lot.
    ...(dayRange
      ? [para(`This copy covers training days ${dayRange[0]}–${dayRange[1]} of ${scope.days}.`, { bold: true, spacing: flow })]
      : []),

    h2('Reviewer instruction'),
    para(REVIEWER_INSTRUCTION, { bold: true, spacing: flow }),

    h2('Reviewer'),
    table([['Name', ''], ['Position', ''], ['Organisation', ''], ['Date', '']], { widths: [28, 72] }),
    para(`Generated ${generatedDate}`, { italics: true, spacing: { before: 160, line: 250 } }),
  ]
}

function referenceVesselChildren() {
  return [
    h1('Reference vessel'),
    para('Every model answer in this document is written against the vessel below. It is a generic arrangement, not any particular ship.'),
    spacer(),
    table(REFERENCE_VESSEL, { widths: [24, 76] }),
    spacer(),
    para(REFERENCE_VESSEL_NOTE, { italics: true }),
  ]
}

// One task, rendered for the given edition.
//   'complete' — every field, every variant
//   'review'   — reduced fields, variants noted but omitted
//   'model'    — the review fields plus model answers and expected outcomes
function taskChildren({ slot, task, domain, edition, compact }) {
  const out = []
  const gap = compact ? compactSpacer : spacer
  const full = edition === 'complete'
  const modelled = edition === 'model'
  const refs = niRefsFor(slot, task)

  const duration = `${slot.duration_minutes ?? task.duration_minutes} min`

  out.push(h2(`Slot ${slot.order} · ${task.id} — ${task.title}`))

  // The day, the slot and the task id are all stated in the two headings above,
  // so no edition repeats them in a table.
  if (full) {
    const meta = []
    if (domain) meta.push(['Domain', domain.title])
    meta.push(['Competency', humanise(task.competency)])
    meta.push(['Difficulty', `${task.difficulty} of 5`])
    meta.push(['Duration', duration])
    if (task.task_type) meta.push(['Task type', humanise(task.task_type)])
    const modes = vesselModes(task)
    if (modes) meta.push(['Vessel modes', modes])
    out.push(table(meta, { widths: [24, 76] }), gap())
  } else {
    // Competency and duration are all the reduced editions carried, so they get a
    // one-line strapline rather than a five-row table. It is a separate paragraph
    // and NOT part of the Heading 2 text: the navigation pane prints heading text
    // verbatim, and folding these into it would make the document map unreadable
    // at ~107 entries. keepNext holds it against the section heading below.
    out.push(para(`${humanise(task.competency)} · ${duration}`, { italics: true, keepNext: true }))
  }

  out.push(h3('NI task references'))
  out.push(refs.length ? listTable('Reference', refs) : para('None recorded.', { italics: true }))
  out.push(gap())

  if (full && task.environment) {
    out.push(h3('Environment'))
    const summary = summariseEnvironment(task.environment)
    if (summary) out.push(para(summary))
    const extras = extraEnvironmentPairs(task.environment)
    if (extras.length) out.push(table(extras, { header: ['Setting', 'Value'] }), gap())
    else if (summary) out.push(gap())
  }

  out.push(h3('Setup'), para(task.setup))
  out.push(h3('Execute'), para(task.execute))

  const standard = task.professional_standard ?? []
  if (standard.length) out.push(h3('Professional standard'), ...standard.map(bullet))

  if (full) {
    const groups = observeFieldGroups(task)
    if (groups.length) {
      out.push(h3('Observe and record'))
      groups.forEach(group => {
        if (group.label) out.push(para(group.label, { bold: true }))
        out.push(table(group.fields.map(f => [f.label ?? humanise(f.key), f.type]), { header: ['Field', 'Type'] }), gap())
      })
    }
  }

  const questions = task.debrief_questions ?? []
  if (questions.length) {
    out.push(h3('Debrief questions'))
    const answers = modelled ? (task.model_answers ?? []) : []
    questions.forEach((q, i) => {
      out.push(para(`${i + 1}. ${q}`))
      if (answers[i]) out.push(para(answers[i], { italics: true }))
    })
    if (modelled && answers.length === 0) out.push(para('[Model answers not yet written]', { italics: true }))
  }

  if (modelled && task.model_outcome) {
    // Mirrors observe_and_record: the expected value or range for each recorded
    // field on the reference vessel. Field labels are resolved back through
    // observe_and_record so the row reads with the label the TDPO records
    // against. Fields with no modelled outcome are omitted, not printed empty.
    const labelByKey = {}
    observeFieldGroups(task).forEach(g => g.fields.forEach(f => { labelByKey[f.key] = f.label ?? humanise(f.key) }))
    const rows = Object.entries(task.model_outcome).map(([k, v]) => [labelByKey[k] ?? humanise(k), formatScalar(v)])
    if (rows.length) {
      out.push(h3('Expected outcome — reference vessel'))
      out.push(table(rows, { header: ['Field', 'Expected on reference vessel'], widths: [34, 66] }), gap())
    }
  }

  const variants = task.variants ?? []
  if (variants.length) {
    if (full) {
      out.push(h3(`Variants (${variants.length})`))
      variants.forEach(v => {
        out.push(para(`${v.id} — ${v.title}`, { bold: true }))
        const changes = flattenPairs(v.changes)
        if (changes.length) out.push(table(changes, { header: ['Change', 'Value'] }), gap())
        if (v.note_to_tdpo) out.push(para(v.note_to_tdpo))
      })
    } else {
      out.push(para(`[${variants.length} variant${variants.length === 1 ? '' : 's'} omitted from this edition]`, { italics: true }))
    }
  }

  out.push(gap())
  return out
}

// Curriculum order throughout: day ascending, then slot order ascending. A task
// scheduled on more than one day appears once per scheduled slot, not once per
// task, so its placement can be questioned at each point it occurs.
function bodyChildren({ curriculum, taskById, domainByTaskId, edition, dayRange, compact }) {
  const out = []
  const gap = compact ? compactSpacer : spacer
  const days = dayRange
    ? curriculum.filter(d => d.day >= dayRange[0] && d.day <= dayRange[1])
    : curriculum
  days.forEach(day => {
    const slots = [...day.slots].sort((a, b) => a.order - b.order)
    const minutes = slots.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0)

    out.push(h1(`Day ${day.day} — ${day.focus}`))
    out.push(para(
      `${minutes} min across ${slots.length} slot${slots.length === 1 ? '' : 's'}` +
      (day.target_duration_minutes ? ` · target ${day.target_duration_minutes} min` : ''),
      { italics: true }
    ))
    out.push(gap())

    slots.forEach(slot => {
      const task = taskById[slot.task_id]
      if (!task) {
        // A buffer slot: scheduled time with no task record behind it. It is part
        // of the shape of the day, so a reviewer judging the 30-day layout has to
        // see it rather than find the day quietly short.
        out.push(h2(`Slot ${slot.order} · ${slot.task_id} — buffer`))
        out.push(para(`Buffer slot · ${slot.duration_minutes} min — ${slot.description ?? 'unstructured practice time'}`, { italics: true }))
        out.push(gap())
        return
      }
      out.push(...taskChildren({ slot, task, domain: domainByTaskId[slot.task_id], edition, compact }))
    })
  })
  return out
}

/* ── DOCUMENT ASSEMBLY ──────────────────────────────────────────────────────── */

function buildDocument({ title, docName, generatedDate, children, profile }) {
  const footerLine = `DPTrainer curriculum — ${docName} — generated ${generatedDate}`
  return new Document({
    creator: 'DPTrainer',
    title,
    description: footerLine,
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: BODY_SIZE, color: '000000' },
          paragraph: { spacing: { line: profile.line, after: profile.paraAfter } },
        },
        // Word's built-in heading styles, restyled but not renamed — renaming
        // them is what breaks the navigation pane.
        title: {
          run: { font: 'Calibri', size: 48, bold: true, color: '000000' },
          paragraph: { spacing: { after: 240 } },
        },
        heading1: {
          run: { font: 'Calibri', size: 32, bold: true, color: '000000' },
          paragraph: {
            spacing: { before: profile.heading.h1[0], after: profile.heading.h1[1] },
            pageBreakBefore: profile.dayPageBreak,
          },
        },
        heading2: {
          run: { font: 'Calibri', size: 26, bold: true, color: '000000' },
          paragraph: { spacing: { before: profile.heading.h2[0], after: profile.heading.h2[1] }, keepNext: true },
        },
        heading3: {
          run: { font: 'Calibri', size: 22, bold: true, color: '000000' },
          paragraph: { spacing: { before: profile.heading.h3[0], after: profile.heading.h3[1] }, keepNext: true },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          // A4 in twips. The annotated profile widens the right margin so Word
          // has room to hang comment balloons beside the text.
          size: { width: 11906, height: 16838 },
          margin: profile.margin,
        },
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              children: [new TextRun({ text: footerLine, size: 16, color: '444444' })],
            }),
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({ text: 'Page ', size: 16, color: '444444' }),
                new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '444444' }),
                new TextRun({ text: ' of ', size: 16, color: '444444' }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: '444444' }),
              ],
            }),
          ],
        }),
      },
      children,
    }],
  })
}

/* ── MAIN ───────────────────────────────────────────────────────────────────── */

async function main() {
  const { curriculum, taskById, domainByTaskId, SCOPE } = await loadContent()
  const generatedDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  mkdirSync(OUT_DIR, { recursive: true })

  const cover = dayRange => coverChildren(SCOPE, generatedDate, dayRange)
  const body = (edition, { dayRange, compact } = {}) =>
    bodyChildren({ curriculum, taskById, domainByTaskId, edition, dayRange, compact })

  // Ten days at a time. An instructor handed 55 pages on Monday reads them; handed
  // 164 he skims. The full review copy stays for anyone who wants the whole thing.
  const SPLITS = [
    { file: '02a-review-copy-days-1-10.docx', range: [1, 10] },
    { file: '02b-review-copy-days-11-20.docx', range: [11, 20] },
    { file: '02c-review-copy-days-21-30.docx', range: [21, 30] },
  ]

  const documents = [
    {
      file: '00-cover-page.docx',
      docName: 'Cover page',
      title: 'DPTrainer — Curriculum Review — Cover page',
      profile: PROFILES.annotated,
      children: cover(),
    },
    {
      file: '01-complete-reference.docx',
      docName: 'Complete reference',
      title: 'DPTrainer — Curriculum Review — Complete reference',
      profile: PROFILES.reference,
      // The cover prepends every document, so each stands alone when it reaches a
      // reviewer who was sent only one of them. This profile does not break the
      // page on Heading 1 — days run on continuously — so the cover needs its own
      // break here. The annotated documents below must NOT have one: their
      // Heading 1 breaks already, and a second break leaves a blank page.
      children: [...cover(), pageBreak(), ...body('complete', { compact: true })],
    },
    {
      file: '02-review-copy.docx',
      docName: 'Review copy',
      title: 'DPTrainer — Curriculum Review — Review copy',
      profile: PROFILES.annotated,
      children: [...cover(), ...body('review')],
    },
    ...SPLITS.map(({ file, range }) => ({
      file,
      docName: `Review copy — days ${range[0]}–${range[1]}`,
      title: `DPTrainer — Curriculum Review — Review copy, days ${range[0]}–${range[1]}`,
      profile: PROFILES.annotated,
      children: [...cover(range), ...body('review', { dayRange: range })],
    })),
    {
      file: '03-model-answers.docx',
      docName: 'Model answers',
      title: 'DPTrainer — Curriculum Review — Model answers',
      profile: PROFILES.annotated,
      // Reference vessel on page 2, immediately after the cover: every model
      // answer in the document is written against it.
      children: [...cover(), ...referenceVesselChildren(), ...body('model')],
    },
  ]

  const report = []
  for (const doc of documents) {
    const buffer = await Packer.toBuffer(buildDocument({ ...doc, generatedDate }))
    const path = join(OUT_DIR, doc.file)
    writeFileSync(path, buffer)
    report.push({ file: doc.file, ...inspectDocx(path), kb: Math.round(statSync(path).size / 1024) })
  }

  const slots = curriculum.reduce((n, d) => n + d.slots.length, 0)
  console.log(`\nDPTrainer curriculum documents — generated ${generatedDate}`)
  console.log(`${SCOPE.domains} domains · ${SCOPE.tasks} tasks · ${SCOPE.days} days · ${slots} scheduled slots\n`)
  console.table(report)
  console.log(`Written to ${OUT_DIR}`)
  console.log('Page count is decided by Word when it renders — see docs/curriculum-export-spec.md.\n')
}

// Counted by reading the file back rather than by walking the builder's objects:
// what matters is what landed in the document. Word is the authority on page
// count and this cannot substitute for it — see the header comment.
function inspectDocx(path) {
  try {
    const xml = execFileSync('unzip', ['-p', path, 'word/document.xml'], {
      encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
    })
    const text = (xml.match(/<w:t[^>]*>[^<]*<\/w:t>/g) ?? [])
      .map(m => m.replace(/<[^>]+>/g, ''))
      .join(' ')
    return {
      words: text.split(/\s+/).filter(Boolean).length,
      headings: (xml.match(/w:val="Heading[123]"/g) ?? []).length,
      tables: (xml.match(/<w:tbl>/g) ?? []).length,
    }
  } catch {
    return { words: null, headings: null, tables: null }
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
