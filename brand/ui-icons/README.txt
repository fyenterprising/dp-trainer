DPTrainer UI icons
=====================================================================
Inline SVGs for every icon used in the app UI, rendered through the
shared Icon component (app/src/components/Icon.jsx). Imported with
?raw and inlined into the DOM — never <img> — so stroke="currentColor"
picks up the surrounding text colour and follows day/night theme
changes for free.

=====================================================================
Screen icons                Stroke width 1.75
  arrow.svg                 "Back" (mirrored with a CSS scaleX(-1))
                             and "Next" / "Next Task" buttons.
  tick.svg                  Saved-session badge on the summary screen.
                             Screen only — see tick-print.svg below.
  box.svg                   Unchecked state of the pre-session
                             checklist items, and the on-screen
                             professional-standard list on the summary
                             screen.
  chevron.svg               History list expand/collapse control.
                             Rotated 180° with a CSS transform for the
                             open state — one file, two orientations.
  cross.svg                 Delete-row control in the DP time log
                             table. Coloured var(--red) regardless of
                             theme.
  moon.svg / sun.svg        Theme toggle button (shows the icon for
                             the mode you'd switch TO).

Print icons                 Stroke width 2
  box-print.svg             Professional-standard checklist, but only
                             in the printed/exported session record —
                             the on-screen copy of the same list uses
                             box.svg. Both are rendered together and
                             toggled with a screen/print CSS pair
                             (.icon-screen-variant / .icon-print-variant),
                             the same show/hide mechanism as the
                             existing .no-print / .print-only classes.
  tick-print.svg            Currently unused. The only on-screen tick
                             (the saved-session badge) sits inside a
                             .no-print block and never reaches a
                             printed page, so there's nothing today to
                             pair it with. Kept in case a tick is ever
                             needed in a printed document — the DP
                             time log PDF or the session record — so
                             that spot isn't stuck with the thinner
                             screen stroke.

  Why stroke width differs: 1.75 reads cleanly on screen at 14-16px
  next to Inter. Printed and photocopied output loses fine detail, so
  every print variant is drawn heavier (2) to stay legible off the
  page — same reasoning as newsprint or engraved type running bolder
  than its on-screen equivalent.

Combined control
  box-checked.svg           Checked state of the pre-session checklist
                             items (stroke width 2, matching the print
                             weight — it's rendered larger, at 20px,
                             where the extra weight reads better).
                             Draws the whole checked control as one
                             shape — rounded-rect box plus tick in a
                             single path set — rather than layering
                             tick.svg over box.svg. Replaces what was
                             previously a CSS-bordered box with a
                             unicode tick floated inside it.

=====================================================================
Geometry
  All ten icons share a 24x24 viewBox, fill="none",
  stroke="currentColor", round caps and joins. box.svg / box-print.svg
  / box-checked.svg use the same 16x16 rounded rect (x4 y4, rx1.5) so
  the checked and unchecked states of a checklist item line up
  exactly.

Sizing
  Rendered at 14-16px inline in buttons (Icon defaults to 15px),
  20px for the larger pre-session checklist boxes. Sits on a
  vertical-align nudge (see .icon in index.css) to align with the
  Inter text baseline rather than the icon's own bounding box.
