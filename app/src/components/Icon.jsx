import arrowRaw from '../../../brand/ui-icons/arrow.svg?raw'
import tickRaw from '../../../brand/ui-icons/tick.svg?raw'
import tickPrintRaw from '../../../brand/ui-icons/tick-print.svg?raw'
import boxRaw from '../../../brand/ui-icons/box.svg?raw'
import boxPrintRaw from '../../../brand/ui-icons/box-print.svg?raw'
import boxCheckedRaw from '../../../brand/ui-icons/box-checked.svg?raw'
import crossRaw from '../../../brand/ui-icons/cross.svg?raw'
import moonRaw from '../../../brand/ui-icons/moon.svg?raw'
import sunRaw from '../../../brand/ui-icons/sun.svg?raw'
import chevronRaw from '../../../brand/ui-icons/chevron.svg?raw'

// The brand SVGs carry a c2pa provenance block that is ~88% of the file and inert
// once the markup is inlined, so keep it out of the DOM.
const stripProvenance = svg => svg.replace(/<metadata>[\s\S]*?<\/metadata>/, '')

const ICONS = {
  arrow: stripProvenance(arrowRaw),
  tick: stripProvenance(tickRaw),
  'tick-print': stripProvenance(tickPrintRaw),
  box: stripProvenance(boxRaw),
  'box-print': stripProvenance(boxPrintRaw),
  'box-checked': stripProvenance(boxCheckedRaw),
  cross: stripProvenance(crossRaw),
  moon: stripProvenance(moonRaw),
  sun: stripProvenance(sunRaw),
  chevron: stripProvenance(chevronRaw),
}

// Inlined (not <img>) so the SVG's stroke="currentColor" picks up the
// surrounding text colour and follows day/night theme changes for free.
export default function Icon({ name, size = 15, className = '' }) {
  const svg = ICONS[name]
  if (!svg) return null
  return (
    <span
      className={`icon${className ? ` ${className}` : ''}`}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
