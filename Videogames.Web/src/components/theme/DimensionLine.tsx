/**
 * DimensionLine — drawing dimension/callout line, e.g. `←——— 390px ———→`.
 *
 * Technical measurement line rendered with dashed rules and mono measure,
 * matching the design's dimension-line vocabulary.
 */
interface DimensionLineProps {
  /** The measurement text, e.g. "390px". */
  measure: string;
  className?: string;
}

export default function DimensionLine({ measure, className = '' }: DimensionLineProps) {
  return (
    <div className={`flex items-center gap-2 text-secondary ${className}`}>
      <span aria-hidden="true">←</span>
      <span className="h-px flex-1 border-t border-dashed border-secondary/60" aria-hidden="true" />
      <span className="font-mono text-[10px] uppercase tracking-[0.08em] whitespace-nowrap">
        {measure}
      </span>
      <span className="h-px flex-1 border-t border-dashed border-secondary/60" aria-hidden="true" />
      <span aria-hidden="true">→</span>
    </div>
  );
}
