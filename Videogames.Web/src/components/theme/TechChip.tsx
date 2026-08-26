/**
 * TechChip — square mono chip with a technical border.
 *
 * Used for category/facet chips and status tags. `active` flips the chip to
 * the secondary (cyan) "live edge". Touch-friendly: the whole surface is a
 * ≥48px-ish target via padded padding where used as a control.
 */
interface TechChipProps {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function TechChip({ label, active = false, disabled = false, onClick, className = '' }: TechChipProps) {
  const base =
    'inline-flex items-center justify-center px-3 py-1 font-mono text-xs uppercase tracking-widest border transition-colors';
  const edge = active
    ? 'border-secondary text-secondary'
    : 'border-outline text-on-surface-muted';
  const interactive = onClick ? 'cursor-pointer active:border-secondary active:text-secondary' : '';
  const state = disabled ? 'opacity-50 cursor-not-allowed' : '';

  const common = `${base} ${edge} ${interactive} ${state} ${className}`;

  if (onClick) {
    return (
      <button type="button" onClick={onClick} disabled={disabled} className={common}>
        {label}
      </button>
    );
  }

  return <span className={common}>{label}</span>;
}
