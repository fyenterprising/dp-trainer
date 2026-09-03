DPTrainer brand assets
=====================================================================
Colours
  NI deep navy   #003087    icon tile, "DP" on light backgrounds
  Sky            #0087c8    thrusters, "Trainer"
  White          #ffffff    ring + centre dot, "DP" on dark backgrounds
  Muted text     #6b87a0 light bg  /  #5a82a0 dark bg
  Hairline rule  #d0dbe8 light bg  /  #1e3a5f dark bg

=====================================================================
/icon/3a-primary/          THE icon. Navy tile, sky thrusters, white ring.
                           Use this everywhere unless you have a reason not to.
  favicon.ico              16/32/48 bundle - site root
  icon-*-rounded.svg       rounded tile, master file
  icon-*-square.svg        square tile - iOS and Android apply their own mask
  icon-*-maskable.svg      10% inset - Android adaptive icons, safe from cropping
  icon-*-mark-only.svg     transparent, no tile - place over your own navy panel
  png/                     16 32 48 64 128 180 256 512 1024
                           + maskable-192 / maskable-512

/icon/3c-mono/             Alternate colourway. Sky ring and dot, no white.
                           Softer, quieter. Good for a secondary product,
                           a disabled/inactive state, or a watermark.
                           Same file set as 3a. Slightly less legible under 32px.

=====================================================================
Every logo comes in -light-bg and -dark-bg, SVG plus 1x/2x/3x PNG.

/logo/4a-wordmark/     614x60   Name, hairline rule, tagline on one line.
                                Email signatures, letterheads, page footers,
                                wide hero bands. No icon. Min width 340px.

/logo/4b-horizontal/   357x60   PRIMARY LOCKUP. Icon + name, tagline beneath.
                                Site header, marketing pages, certificates,
                                PDF covers. Min width 240px.

/logo/4c-compact/      135x30   Icon + name only. App chrome, nav bars,
                                mobile header, tight toolbars. Min width 120px.

/logo/4d-stacked/      340x164  Icon above centred name + small-caps tagline.
                                Splash screen, login, title slides, print covers.
                                Min width 180px.

Below the minimum width, drop the wordmark and use the icon alone.
Clear space: keep at least the icon's own height clear on all sides.

=====================================================================
/icon/1-colour/            Single-colour builds. No sky, no white.
  *-navy-solid.svg         mark in #003087 on transparent
  *-white-solid.svg        mark in white on transparent (for navy panels)
  *-black-solid.svg        mark in black - fax, photocopy, laser engraving
  *-navy-tile-knockout.svg solid navy tile with the mark punched OUT
  *-black-tile-knockout.svg same in black
  png/                     64 / 256 / 1024
  Use these for rubber stamps, embroidery, etched plaques, single-plate
  print, and anything that will be photocopied or faxed.

/logo/1-colour/            Wordmark only, one colour, no tagline.
  wordmark-1col-navy / -white / -black   SVG + 1x/2x/3x PNG (navy, black)

=====================================================================
/social/
  og-image-light-1200x630.png   Link previews - LinkedIn, Slack, Twitter,
  og-image-dark-1200x630.png    Facebook, WhatsApp. Pick one and stick to it.
  square-light-1200x1200.png    Instagram, WhatsApp profile, avatars.
  square-dark-1200x1200.png

  Add to <head>:
    <meta property="og:image" content="https://YOURDOMAIN/og-image.png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:title" content="DPTrainer">
    <meta property="og:description" content="Structured simulator training for trainee DPOs">
    <meta name="twitter:card" content="summary_large_image">

/email/
  signature-40px-*.png   small - sits beside a name
  signature-56px-*.png   standard - recommended
  signature-72px-*.png   large - for a signature block with several lines
  -onwhite      flat white background. Use this one by default; it survives
                Outlook, which ignores transparency and can render it black.
  -transparent  only when you know the client handles alpha (Apple Mail, Gmail web).

  Each file is rendered at 2x the stated height. In your signature HTML set
  the DISPLAYED height to the name in the filename so it stays crisp:
    <img src="signature-56px-onwhite.png" height="56" alt="DPTrainer">
  Email clients ignore SVG - always use these PNGs, never an SVG logo.

/brand-sheet.pdf         One-page reference: marks, lockups, colour, type,
                         do/don't, and where every file lives. Hand this to
                         anyone producing DPTrainer material.

=====================================================================
/web/
  site.webmanifest       Ready to use. Paths assume /icons/ at your site root -
                         adjust if you put them elsewhere.
  head-snippet.html      The <link> and <meta> tags to paste into <head>.

=====================================================================
Notes
  TYPEFACE: Inter, matching the app. The SVGs use live text with the stack
  Inter -> Helvetica Neue -> Arial, so make sure Inter is loaded on any page
  that renders an SVG logo inline. The PNGs are already rendered in Inter and
  need no font at all - use them in email, slides, and anywhere you are not
  sure Inter is present.

  Weights used: DP 700, Trainer 300, tagline 300 (4d subtitle 400).

  Before sending anything to a commercial printer, convert text to outlines.
