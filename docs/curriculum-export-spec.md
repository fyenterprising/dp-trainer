# Curriculum export documents — spec

> The in-app export screen was removed after the documents were generated. This
> spec records what they contain.
>
> The documents now ship as editable Word files in `docs/curriculum/`, generated
> by `scripts/build-curriculum-docs.js`. See **Word documents** below.

Four printable documents built from `content/curriculum.json` and the 19 files in
`content/domains/`, for sending the curriculum out to be marked up by an
experienced DPO.

The generator lived at `app/src/components/CurriculumPdfExport.jsx` (document and
pagination) and `app/src/screens/CurriculumExportScreen.jsx` (the four buttons),
with `.cx-*` rules in `app/src/index.css`. All three were removed once the
documents had been generated; the curriculum/domain join they used,
`app/src/data/content.js`, remains and is still used by `App.jsx`. Everything
below describes the documents themselves, and the pagination notes at the end are
kept for whoever rebuilds the generator.

**These are review mocks.** Plain black on white, one standard font
(Helvetica/Arial), no brand marks, no colour. Styling is a later pass. Do not
import the DP Time Log's palette into them.

---

## Word documents

Generated as .docx files so instructors can edit them and comment with tracked
changes:

| File | Contents |
|---|---|
| `docs/curriculum/00-cover-page.docx` | The cover sheet on its own |
| `docs/curriculum/01-complete-reference.docx` | Every task, every field, every variant |
| `docs/curriculum/02-review-copy.docx` | Reduced fields, for marking up |
| `docs/curriculum/02a-review-copy-days-1-10.docx` | The review copy, training days 1–10 |
| `docs/curriculum/02b-review-copy-days-11-20.docx` | The review copy, training days 11–20 |
| `docs/curriculum/02c-review-copy-days-21-30.docx` | The review copy, training days 21–30 |
| `docs/curriculum/03-model-answers.docx` | The review copy plus model answers and expected outcomes, reference vessel on page 2 |

The three split copies exist because length decides whether a document gets read:
an instructor handed 55 pages on Monday reads them, handed 164 he skims. Each is a
standalone document with the full cover, the day range stated on that cover and in
the footer. The full review copy stays for anyone who wants the whole thing.

### Regenerating them

```
node scripts/build-curriculum-docs.js
```

Run it whenever `content/curriculum.json` or a file in `content/domains/` changes.
It overwrites every file in `docs/curriculum/` and prints a summary. It reads the
content through `app/src/data/content.js`, the same join the web app uses, so the
documents cannot drift from the curriculum the app serves.

The script bundles `content.js` through esbuild before importing it. That is not
incidental: `content.js` imports twenty .json files the way Vite allows and bare
Node does not — Node wants an explicit `with { type: 'json' }` attribute and
throws `ERR_IMPORT_ATTRIBUTE_MISSING` without it. Bundling keeps the Vite-shaped
syntax in the app file where it belongs, instead of bending app code to suit a
script.

The cover prepends every document, so each one stands alone when a reviewer is
sent only one of them.

### Two formatting profiles

Formatting follows what a document is FOR, not house style. Both are defined as
`PROFILES` at the top of the script.

| | `reference` | `annotated` |
|---|---|---|
| Used by | `01-complete-reference` | `00`, `02`, `02a`–`02c`, `03` |
| Margins | 1in all round | 1in, right margin 2.25in |
| Line spacing | 1.15 | 1.4 |
| Page break before each day | no — days run on continuously | yes |
| Paragraph gap | 3pt | 6pt |
| Heading before/after (H1/H2/H3) | 12/6, 9/4, 6/3 pt | 18/8, 14/6, 10/4 pt |
| Gap after a table | ~4pt | a full blank line |

`01-complete-reference` is for looking things up, not for writing in. Every line
of whitespace spent on annotation room is a line wasted, so it gets normal
margins, near-normal leading, and continuous days. The documents that actually get
marked up keep the wide comment margin, the loose leading, and a page break
between days so a reviewer can work through one day and hand back a page.

The difference is worth well over a hundred pages on the complete reference: 273
pages on the annotated profile, 192 on this one.

The last three rows of that table matter more than they look. There are ~976
headings and ~750 table gaps in the complete reference, so the whitespace around
them is not a rounding error — margins, line spacing and dropping the per-day page
break together got it from 273 to 217, and those three rows took it to 201.
Restructuring task metadata (below) took the last nine.

What is left is genuine content, not whitespace.

One consequence to remember when editing: the `reference` profile does not break
the page on Heading 1, so that document needs an explicit page break after its
cover. The `annotated` documents must NOT have one — their Heading 1 breaks
already, and a second break leaves a blank page after the cover.

### Shared formatting

- Word's built-in **Heading 1 / 2 / 3** styles — Heading 1 per training day,
  Heading 2 per task slot, Heading 3 per section within a task. These populate the
  navigation pane, which is the only practical way to move around a document this
  long. They are restyled but **not renamed**; renaming them is what breaks the
  navigation pane.
- Body text 11pt Calibri. A4.
- Footer on every page: `DPTrainer curriculum — [document name] — generated
  [date]`, with `Page X of Y` beneath it. The split copies carry their day range
  in the document name.
- Tables for NI task references, observe-and-record field lists, variant changes,
  expected outcomes and task metadata. Table cells opt out of the body line
  spacing — inherited into ~475 tables it added well over a hundred pages to the
  complete reference.
- The cover is deliberately held to a single page. That is what puts the reference
  vessel on page 2 of the model answers document: its Heading 1 carries
  `pageBreakBefore`, so with a one-page cover it necessarily starts page 2. If the
  cover ever grows to two pages, that guarantee goes with it.

### Page count

A .docx has no page count of its own. Word decides where pages break when it
renders, using the fonts and printer metrics of the machine opening the file, so
the script cannot report one and does not try — it reports word, heading and
table counts instead.

Measured by rendering each file in Microsoft Word for Mac:

| Document | Pages | Words |
|---|---|---|
| `00-cover-page.docx` | 1 | 223 |
| `01-complete-reference.docx` | 192 | 40,687 |
| `02-review-copy.docx` | 149 | 26,190 |
| `02a-review-copy-days-1-10.docx` | 64 | 11,745 |
| `02b-review-copy-days-11-20.docx` | 56 | 10,111 |
| `02c-review-copy-days-21-30.docx` | 31 | 4,807 |
| `03-model-answers.docx` | 157 | 27,408 |

The three splits are uneven because the curriculum is: days 1–10 carry 48 task
slots, days 11–20 carry 39, and days 21–30 carry only 20 task slots against 9
buffer slots. The back third of the curriculum is much thinner than the front,
which is worth a reviewer's attention in its own right.

Those figures are for that machine; another machine with different fonts or a
different default printer may paginate differently.

---

## Ordering

Every edition walks the curriculum in the same order: **day ascending, then slot
order ascending**.

A task scheduled on more than one day is printed **once per scheduled slot**, not
once per task. 25 of the 72 tasks are scheduled more than once; the question a
reviewer is answering is whether a task sits right on *that* day, which cannot be
asked of a de-duplicated list.

The 19 `buffer_*` slots have no task record behind them. They are printed as a
one-line buffer entry carrying the slot's own `description`, so the shape of the
day is honest rather than quietly short.

---

## Page count at time of writing

| Edition | Pages |
|---|---|
| Cover page only | 1 |
| Everything | 116 |
| Review edition | 91 |
| Cheat sheet | 96 |

Measured in Chrome against the content as committed. The count is also shown on
the exports screen after each export runs.

---

## 1. Cover page

Prepends **every** edition, and is the whole of the "Cover page only" export.

- Title: DPTrainer — Curriculum Review
- One paragraph on what DPTrainer is: a structured session companion for TDPOs
  undertaking NI passive simulator days. Not a training provider; does not
  instruct, assess, certify or sign off.
- The source documents behind the curriculum, listed (see below)
- Scope: counted live from the content files, not written down — currently
  19 domains, 72 tasks, 30 training days
- The reviewer instruction, in a ruled box:
  > Please mark anything unrealistic, missing, or wrongly placed within the 30
  > days. Marginal notes are more useful than a summary.
- Ruled space for reviewer name, position, organisation and date
- Footer (repeats on every page of every edition): personal record, not a
  certification document, not affiliated with The Nautical Institute

### Source documents listed on the cover

Mirrors the `source_reference` and `sources` fields carried by the domain files.
Held as a curated list in `CurriculumPdfExport.jsx` because the domain fields name
chapters and sections, and the cover wants the documents.

- The Nautical Institute — DP Operator's Certification Scheme (New Offshore
  Scheme), logbook task sections 1–12
- DP Operator's Handbook, 3rd Edition — Bray, Daniels, Fiander, Foster (The
  Nautical Institute)
- IMCA M117 Rev. 3.3 — The Training and Experience of Key DP Personnel
- IMCA M220 Rev. 3.0 (Jan 2025) — Recommended Practice on Operational Activity
  Planning (ASOG, CAM/TAM, TAGOS)
- IMCA M249 Rev. 1 — DP Practitioner Accreditation Scheme Handbook
- IMCA M273 (Jan 2026) — A Guide to Conducting DP Drills and Ensuring
  Preparedness for DP Failures
- IMO MSC.1/Circ.1580 (Jun 2017) — Guidelines for vessels and units with dynamic
  positioning (DP) systems

---

## 2. Everything edition

Every task, every field, every variant.

Grouped by training day under a day heading showing the **day number**, the
**focus**, and the **total minutes** (summed from the slots, with the day's
`target_duration_minutes` alongside it).

### Where task metadata lives

Day, slot, task id and title are carried by the **headings**, not by a table — the
Heading 1 reads `Day 4 — <focus>` and the Heading 2 beneath it reads
`Slot 2 · jc_001 — Pure Drift Stop`. No edition repeats them in a table.

Below the Heading 2:

- **Complete edition** — a metadata table of Domain, Competency, Difficulty,
  Duration, Task type (where present) and Vessel modes.
- **Review and model editions** — no table. A single italic strapline instead:
  `Stopping and speed management · 20 min`. It is a separate paragraph, never part
  of the Heading 2 text: the navigation pane prints heading text verbatim, and
  folding competency and duration into it would make the document map unreadable
  at ~107 entries. It carries `keepNext` so it cannot be split from the first
  section heading below it.

Removing the five-row metadata table from the reduced editions took 107 tables out
of the review copy and 15 pages off it.

Per task:

| Printed | Source | Where |
|---|---|---|
| Day and slot | curriculum slot | Heading 1 / Heading 2 |
| Task ID | `task.id` | Heading 2 |
| Title | `task.title` | Heading 2 |
| Domain | domain file `title` |  |
| Competency | `task.competency` |
| Difficulty | `task.difficulty`, as "n of 5" |
| Duration | slot `duration_minutes`, falling back to the task's |
| Task type | `task.task_type` where present |
| NI task references | union of the slot's `ni_task_ref` and the task's |
| Vessel modes | `vessel_mode_start` → `vessel_mode_execute`, or `vessel_mode` |
| Environment | `task.environment` |
| Setup | `task.setup` |
| Execute | `task.execute` |
| Professional standard | `task.professional_standard`, one bullet each |
| Observe and record | `task.observe_and_record`, field label and type |
| Debrief questions | `task.debrief_questions`, numbered |
| Variants | `task.variants` — id, title, every change, and `note_to_tdpo` |

Environment and variant `changes` are free-form objects in the content files —
mostly the six wind/wave/current keys, but also arrays of per-run conditions,
`ramp_to` escalations, and one-off keys used by a single task. They are flattened
to labelled key/value lines rather than matched against a fixed key list, so
nothing is silently dropped from the edition that claims to print everything.

`observe_and_record` has two shapes in the content files and both are handled: a
flat `fields` list, and `runs` + `fields_per_run` where the same fields are
recorded once per run.

---

## 3. Review edition

Same ordering, reduced fields, for marking up by hand.

Per task: **day, task ID, title, competency, duration, NI task references, setup,
execute, professional standard, debrief questions.** Day, task ID and title come
from the headings, and competency and duration from the strapline beneath them —
see *Where task metadata lives* above.

Omitted: domain, difficulty, vessel modes, environment, observe-and-record field
lists, and variants.

Where a task has variants, one line is printed in their place:

> `[N variants omitted from this edition]`

**Layout for annotation.** A 2.3in right margin measured from the sheet edge, and
line spacing of 1.95. The margin is applied to the page body only, so the running
header rule and the footer still span the full sheet.

---

## 4. Cheat sheet edition

The review edition, plus model answers, plus the reference vessel page.

- **Reference vessel** on its own page, immediately after the cover (this edition
  only — see below).
- **Model answers** printed directly beneath each debrief question, matched by
  index. A question is never separated from its answer by a page break.
- **Expected outcome — reference vessel**, from `model_outcome`, printed after the
  debrief questions. Field labels are resolved back through
  `observe_and_record` so the row reads with the label the TDPO records against.
- Where a task has no model answers yet:

  > `[Model answers not yet written]`

Same reduced field set and same annotation layout as the review edition.

---

## Schema additions

Two optional fields on a task, both currently written for `setup_001` only as the
worked example. Everything else prints the not-yet-written line.

### `model_answers`

An array of strings matching `debrief_questions` **by index**. Each is a short
paragraph giving what a good answer contains — not a script to be read back.

```json
"debrief_questions": [
  "Which sensor is most critical for DP position keeping and why?"
],
"model_answers": [
  "Position reference is what DP cannot run without — with no accepted reference …"
]
```

If the array is shorter than `debrief_questions`, the questions past its end
print with no answer beneath them. An empty or absent array prints the
not-yet-written line once, under the question list.

### `model_outcome`

An object mirroring `observe_and_record`, keyed by the same field `key`, giving
the expected value or range for that field **on the reference vessel**. Fields
with no modelled outcome are omitted rather than printed empty.

```json
"model_outcome": {
  "time_to_complete_minutes": "10–15 for a competent first pass; under 10 by the end of the 30 days",
  "steady_state_result": "Stable: position held within 1 m and heading within 0.5° over the 3 minutes …"
}
```

Values are free text, not numbers — a range with its reasoning is more use to a
TDPO than a figure.

---

## Reference vessel

Printed on a page immediately after the cover, **in the cheat sheet edition only**.
Also shown on the exports screen for reference.

| | |
|---|---|
| Vessel | Generic DP2 PSV |
| Heading | 000° True unless a task states otherwise |
| Thrusters | Two bow tunnel, one stern tunnel, two main azimuth aft |
| Power | Two switchboards, bus tie normally open, each board carrying one bow tunnel and one main |
| References | Two DGPS |
| Sensors | Two gyros, two wind, two VRU |

With the note:

> Model answers are written against this reference vessel. Actual values will
> differ by vessel and conditions — the reasoning is what matters.

---

## Pagination

Same measure-then-pack engine as `DPTimeLogPdfExport.jsx` — read that file's
header comment first, the sequence and the page-height budget both still apply.
The differences are recorded in the header comment of
`CurriculumPdfExport.jsx`; in short:

- The document is flattened into small **blocks** (one bullet, one question, one
  variant), each measured individually. A block is never split, so the smallest
  safe unit is the right unit.
- A block may carry `keep`, meaning it must not be the last block on a page. The
  packer walks back from the break point and moves any trailing run of `keep`
  blocks to the next page. Only two things carry it: **headings**, which must drag
  their first item along, and a **debrief question that has a model answer**,
  which must not be split from it. Setting it on every item of a list makes the
  whole list atomic and costs roughly 150px of dead space at the foot of most
  task pages.
- The **annotated editions change the text width**, which changes how everything
  wraps and therefore every measured height. The hidden measuring page carries
  the same edition modifier class as the real pages for exactly this reason.
- Spacing between blocks is **padding, never margin**. The packer measures with
  `offsetHeight`, which excludes margins — a margin between blocks is height the
  packer cannot see, and pages silently over-pack. The running header and footer
  sit inside band wrappers for the same reason.

### Verifying a change

Re-check output at full length (all 30 days) after touching the packer, the
`keep` flags, `.cx-page` padding, or `USABLE_HEIGHT_PX`. What to look for:

- no page whose `.cx-page-body` `scrollHeight` exceeds its `clientHeight`
  (over-packed — content falls off the sheet),
- no page whose last block is a heading (`.cx-label`, `.cx-day`,
  `.cx-task-head`, `.cx-sublabel`),
- no page ending on a debrief question whose model answer starts the next page.

All three were clean across all four editions at the counts in the table above.
