import type { ReactNode } from 'react';

/**
 * SpecLabel — mono uppercase technical label, e.g. `SPEC-NAME:`.
 *
 * Renders `<label>VALUE</label>` pairs in the blueprint spec-sheet language.
 * The label is always mono, uppercase, wide-tracked and secondary (cyan).
 */
interface SpecLabelProps {
  /** Label text WITHOUT the colon (the colon is appended), e.g. "SPEC-NAME". */
  label: string;
  /** The spec value rendered after the label. */
  children?: ReactNode;
  className?: string;
}

export default function SpecLabel({ label, children, className = '' }: SpecLabelProps) {
  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-secondary">
        {label}:
      </span>
      {children ?? null}
    </div>
  );
}
