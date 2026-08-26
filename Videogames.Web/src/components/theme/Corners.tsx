/**
 * Corners — Blueprint registration-mark crosshairs (+).
 *
 * Decorates the corners of a `position: relative` ancestor with crosshair
 * marks. Pure presentational; the crosshair glyph comes from the `.bp-crosshair`
 * base utility (defined in globals.css). Zero images, tokens only.
 */
const CORNER_CLASSES: Array<{ key: string; cls: string }> = [
  { key: 'tl', cls: 'top-1 left-1' },
  { key: 'tr', cls: 'top-1 right-1' },
  { key: 'bl', cls: 'bottom-1 left-1' },
  { key: 'br', cls: 'bottom-1 right-1' },
];

interface CornersProps {
  className?: string;
}

export default function Corners({ className = '' }: CornersProps) {
  return (
    <span className={`pointer-events-none absolute inset-0 z-0 ${className}`} aria-hidden="true">
      {CORNER_CLASSES.map(({ key, cls }) => (
        <span key={key} className={`bp-crosshair absolute ${cls}`} />
      ))}
    </span>
  );
}
