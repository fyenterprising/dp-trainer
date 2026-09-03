3E NAZAR - easter egg colourway. NOT part of the brand.
=====================================================================
The icon with the watch circle filled sky #0087c8 and the centre dot
darkened to #0a1628, so the mark reads as a nazar (evil eye) bead.
Same silhouette as 3a-primary, so at favicon size it swaps in unnoticed.

Same file set as 3a-primary:
  favicon.ico                    16/32/48 bundle
  icon-3e-nazar-rounded.svg     rounded tile, master
  icon-3e-nazar-square.svg      square tile
  icon-3e-nazar-maskable.svg    10% inset, Android adaptive
  icon-3e-nazar-mark-only.svg   transparent, no tile
  png/                           16 32 48 64 128 180 256 512 1024
                                 + maskable-192 / maskable-512

Swapping the favicon at runtime:
  document.querySelector('link[rel~="icon"]').href = '/icon-3e-nazar-rounded.svg';
Keep a handle on the original href so you can put it back on reload.

Temporary only. Never the default, never in the manifest, never on print,
a certificate, or anything going to a client.
