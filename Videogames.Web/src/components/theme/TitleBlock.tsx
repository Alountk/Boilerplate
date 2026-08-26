/**
 * TitleBlock — blueprints' "cajetín" (title block).
 *
 * Top strip showing the system drawing code (e.g. VMKT-BP-001), REV and date,
 * as on a real engineering drawing. Mono uppercase with wide tracking.
 */
interface TitleBlockProps {
  /** System drawing/section code, e.g. "VMKT-BP-001". */
  code: string;
  /** Revision letter, e.g. "C". */
  rev?: string;
  /** ISO or display date, e.g. "26/08". */
  date?: string;
  className?: string;
}

export default function TitleBlock({ code, rev, date, className = '' }: TitleBlockProps) {
  return (
    <header
      className={`flex items-center justify-between gap-3 border border-outline bg-surface-1/40 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.08em] text-on-surface-muted ${className}`}
    >
      <span lang="en">+ {code}</span>
      {rev ? <span>REV {rev}</span> : null}
      {date ? <span>{date}</span> : null}
    </header>
  );
}
