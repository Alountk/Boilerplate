/**
 * RevisionStamp — blueprint revision stamp, e.g. `REV C · 26/08`.
 *
 * Renders a bordered revision tag in the drawing's technical voice.
 */
interface RevisionStampProps {
  /** Revision letter/hash, e.g. "C". */
  rev?: string;
  /** Date text, e.g. "26/08" or a full ISO date. */
  date?: string;
  className?: string;
}

export default function RevisionStamp({ rev = 'C', date, className = '' }: RevisionStampProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 border-2 border-secondary/70 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-secondary ${className}`}
    >
      REV {rev}
      {date ? <span aria-hidden="true">·</span> : null}
      {date}
    </span>
  );
}
