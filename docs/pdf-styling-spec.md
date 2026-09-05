# DP Time Log PDF — styling spec

Restyle `DPTimeLogPdfExport.jsx` to match this. Pagination, page packing, header repeat
and "Page X of Y" stay exactly as they are — this is a visual pass only.

Reference render: `docs/DP Time Log Export.pdf`.

---

## Foundations

Typeface: **Inter**, weights 300 / 400 / 500 / 600. Nothing else.
If Inter isn't already bundled for print, load weights 300–600.

| Token | Hex | Used for |
|---|---|---|
| navy | `#003087` | rules, table header fill, stat numbers, emphasis |
| sky | `#0087c8` | "Trainer" in the wordmark, secondary progress bars |
| accent | `#0069b4` | section labels only |
| ink | `#1a2d4a` | body text |
| muted | `#6b87a0` | labels, secondary values, footer text, row numbers, "of 120" |
| hairline | `#eaf0f6` | table row separators |
| border | `#d0dbe8` | panel borders, signature rules |
| tint | `#f4f7fb` | stat panel, tfoot, status callout |
| zebra | `#f8fafc` | even table rows |

No night-mode variant — the PDF is always light. **Hide the theme toggle in print CSS.**

One secondary tier only. An earlier draft used a lighter `#8fa6b8` for footer text, row numbers
and the progress denominators; at 2.5:1 on white it fails legibility at 9.5–12.5px, and it isn't
in your palette. Everything secondary uses `muted` — hierarchy comes from size and weight, not
from a third, weaker grey. "of 120" in particular is what gives the certification figure meaning.

---

## Running header (repeats every page)

Left: 30px 3A icon + "DPTrainer" at 19px, `DP` 700 navy / `Trainer` 300 sky, `letter-spacing:-0.02em`.
Nothing on the right — trainee identification lives in the footer instead, so it doesn't sit
directly above the Trainee/Rank/Period grid on page 1 and read as a duplicate.
Bottom border `2px solid navy`, 9px above it, 26px below.

Icon file: `brand/icon/3a-primary/icon-3a-primary-rounded.svg`.

## Running footer (repeats every page)

Three parts, `space-between`, 9.5px, `1px solid border` top rule, 9px padding-top, 26px margin-top.
Left: trainee name · rank, 500 weight, muted, `nowrap` — this is the only per-page identification,
so a page separated from the set can still be traced to a person.
Centre: "Personal record produced by DPTrainer — not a certification document.", muted.
Right: generation date, long form — "Generated 5 September 2026", muted, `nowrap`.

Your existing "Page X of Y" goes at the right end, before or after the date.

---

## Title block (page 1 only)

`h1` 32px/600, `letter-spacing:-0.025em`, line-height 1. Subtitle 14px/300 muted:
"Dynamic positioning sea time — cross-check record".

Right-aligned 2-column meta grid, 12px, `gap:3px 16px`: Trainee / Rank / Period,
labels in muted, values 500–600 ink. 30px below the block.

**Period formatting — one unconditional format.** Always print the year on BOTH dates:
"12 Mar 2025 – 11 Jun 2026", and "12 Mar 2026 – 11 Jun 2026" when they share a year.
Never collapse to a single trailing year. This is a cross-check record — unambiguous beats
concise, and a single format removes a conditional that can fail at a year boundary.
Table rows are `dd/mm/yyyy` and already carry their own year, so only this line is at risk.

## Section labels

Every section opens with: 10.5px, 600, `letter-spacing:0.16em`, uppercase, **accent**.
11px gap to its content, 28px between sections.

## Record totals

Four equal cells in a 1px-gap grid on a `border` background, `border-radius:7px`, overflow hidden
(gives hairline dividers without double borders). First cell `tint`, rest white.
Each: number 31px/600 `letter-spacing:-0.03em` (first one navy, rest ink), then
10px/600 `0.1em` uppercase muted label, then optional 11px muted sub-value.

Cells: Total DP days · Active days (+hours) · Passive days (+hours) · Total hours.

Second row, same construction, three cells, `11px 17px` padding: label 12px muted left,
value 15px/600 right — Days on DP1 / Days on DP2-DP3 / Vessels served.

## Progress

One bordered panel, `17px 19px`, `border-radius:7px`, 13px between bars.
Per bar: label 12.5px/500 left, value 12.5px/600 navy right with the "of N" part 400 muted.
Track 6px tall, `border-radius:3px`, `#e6edf5`. Fill navy for total days, sky for the other two.
Footer line above a `1px solid hairline` rule, 11px padding-top: remaining-days in 12.5px/600 navy,
then the phase-allocation caveat in 11.5px muted.

## Entries table

11.5px body, `table-layout:fixed`, column widths as percentages on the header row:

`# 4 · Date 12 · Vessel 22 · Type 6 · A/P 5 · Hrs 5 · DP 6 · Activity 10 · Rank 6 · Notes 24`

Date needs 12% — `dd/mm/yyyy` at 11.5px Inter is ~59px of glyphs plus 14px padding, and cells
overflow visibly rather than clipping, so an under-declared Date runs into the vessel name.
Activity carries short codes (SB, SU, WS, ROV), not full words, so 10% is ample — the surplus
goes to Notes, the only free-text column and the one that wraps if starved.
Keep the percentages summing to 100.

Header row: navy fill, white text, 9.5px/600, `0.09em` uppercase, `8px 7px` padding.
Body cells `7px`, `1px solid hairline` bottom. Even rows `zebra`.
Vessel cell 500 weight + `white-space:nowrap`. Row numbers muted, right-aligned.
`A` is 600 navy; `P` is 600 muted — that contrast is how the eye finds passive days.
Right-align Hrs, centre A/P.

tfoot: `tint` fill, `2px solid navy` top. Label cell spans the first five columns —
"TOTAL — {n} DAYS" in 11px/600 `0.09em` uppercase navy. Then the hours total in 600 under Hrs.
Then a 4-column cell, 11px muted: "{active} active · {passive} passive".
All figures derive from the data — the reference render shows 16 / 117 / 13 / 3 because the
sample is 16 rows. Nothing here is a constant.
Do not put a day count under A/P — only A or P is legal there.

## Declarations (last page)

**Trainee declaration only.** Do not add a Master or Senior DPO verification block —
this is a personal record, not a certification document. The NI logbook and company
confirmation letters are the countersigned evidence, and printing a verifier signature
block risks the document being mistaken for an official form.

13.5px/1.65 statement, `max-width:44em`, `text-wrap:pretty`, then a signature grid of
three equal columns, `gap:22px 34px`, 9px above. Each field is a 34px-tall box with `1px solid muted` bottom rule and a
10.5px/600 `0.1em` uppercase muted caption *below* the rule.

Fields: **Name · Signature · Date** only.
No discharge book / CDC number — it isn't needed on a personal record.

## Status callout (closes the document)

`tint` background, `3px solid navy` left border, `border-radius:0 6px 6px 0`, `15px 18px`.
Label 10.5px/600 `0.14em` uppercase navy: "Status of this document".
Body 12px/1.6 `#4a6b85`, `max-width:52em` — the existing not-a-certification / not-affiliated text.

---

## Figures must match the screen

Before shipping, export the live 78-entry record and reconcile against the on-screen panel:

- tfoot day count and hours total
- active / passive split
- every figure in Record totals (total DP days, active days + hours, passive days + hours,
  total hours, DP1 days, DP2/DP3 days, vessels served)
- the three progress values and the remaining-days line

The PDF and the screen read from the same data, so any disagreement is a bug in one of them.
**Report the mismatch — do not reconcile it in the PDF layer.** A cross-check record that quietly
disagrees with the app is worse than one that fails loudly.

---

## Print CSS

```css
@media print {
  @page { margin: 0; }
  .theme-toggle { display: none !important; }

  /* @page margin:0 removes ALL paper margin, so every page container must
     supply its own or content prints to the sheet edge and gets clipped. */
  .pdf-page {
    box-sizing: border-box;
    padding: 0.5in 0.55in;   /* top/bottom, left/right */
  }
}
```

`@page { margin: 0 }` is what removes the browser's own URL and timestamp chrome —
that's where `05/09/2026, 11:49` and `https://dptrainer.netlify.app` in the current export come from.

**It also removes every paper margin.** Set the two rules together, never `margin: 0` alone:
each page container needs `0.5in` top/bottom and `0.55in` left/right of its own padding, with
`box-sizing: border-box` so the padding sits inside your measured page height rather than
pushing the last row onto a new page. Most printers can't image the outer ~0.25in, so anything
below about `0.4in` risks clipping regardless.

Two knock-on effects for the existing pagination engine:

- The usable content height it packs rows into is the page height **minus** that vertical padding
  and minus the running header and footer bands. If it currently measures against full paper
  height, it will over-pack by roughly an inch and orphan rows.
- Check the first proof on real paper, not just a PDF viewer — edge clipping doesn't show on screen.

---

## Implementation notes

Decisions the spec above left open, recorded here so the document and the code stay in step.
**When future work changes what the PDF renders — the Phase B / Phase D threshold split is the
known one coming — update this file in the same pass as the code.**

### Data sources

Every figure is derived by the screen (`DPTimeLogScreen.jsx`) and passed down as a prop. The PDF
layer computes nothing that the screen also computes, so the two cannot drift:

| PDF figure | Source |
|---|---|
| Record totals row 1 | `computeTotals(entries)` — same object the on-screen stat tiles render |
| Days on DP1 / DP2-DP3, Vessels served | `computeRecordSummary(entries)` (record-level, unfiltered) |
| Progress bars, remaining-days line | `computeNIProgress(entries)` and `certStatusText` — same values and same string as the on-screen thresholds panel |
| tfoot day count / hours / split | `computeTotals(entries)` |

`computeRecordSummary` lives in the screen, not the PDF component, so "Days on DP2/DP3 vessels"
has one definition for both surfaces.

**Known definitional split (not a bug, but read the labels carefully).** Record totals counts
DP1/DP2-DP3 days across *all* entries; the progress panel's "DP2 / DP3 days toward Unlimited
certificate" counts only entries of 2 hours or more, because that is the NI qualifying threshold.
The two figures agree whenever every entry is ≥ 2 h and diverge otherwise. Both match their
on-screen counterparts exactly; the labels carry the distinction.

### Rank

The app stores rank as free text per entry (`2/O` by default); there is no rank field on the
vessel profile. The header and footer take the rank from the most recent entry and expand common
abbreviations to full titles (`2/O` → `Second Officer`) via `RANK_LABELS`, falling back to the
stored string verbatim for anything unrecognised. The Rank *column* prints the stored string
as-is.

### Entries caption

The `ENTRIES` section label carries a right-hand caption — "{n} entries · dates dd/mm/yyyy ·
A active, P passive" — matching the reference render. It is a legend, not a figure.

### Theme toggle selector

The live toggle button's class is `btn-theme-toggle`. The print rule targets both
`.btn-theme-toggle` and `.theme-toggle` so the spec's selector stays valid if the class is
renamed.

### Narrow numeric columns

`#` (4%) and `Hrs` (5%) are narrower than their widest values once the record grows: a 2–3 digit
row number or a 3-digit hours total wraps onto two lines and inflates the row. Both, and the
tfoot hours cell, carry `white-space: nowrap` so the glyphs overflow into the cell padding
instead — the behaviour the column-width note above already assumes. The percentages are
unchanged.

### Usable page height

`@page` moved from `margin: 14mm` to `margin: 0` plus per-page padding, so
`USABLE_HEIGHT_PX` is now measured against the padded content box
(`297mm − 2 × 0.5in`) instead of the old margin box. The packing algorithm, header repeat and
"Page X of Y" are unchanged; the running footer is measured like the running header and
subtracted from the per-page budget, because it did not exist before.
