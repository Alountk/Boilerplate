'use client';

import type { ReactNode } from 'react';
import Corners from '../theme/Corners';

export type TechCardBadgeTone = 'success' | 'warning' | 'error';

interface TechCardProps {
  /** Component code label, e.g. "CMP-01". Rendered as `[CMP-01]`. */
  code: string;
  /** Card title (game/listing name). */
  title: string;
  /** Secondary line (e.g. console). */
  sub?: string;
  /** Price. Displayed as mono 700 with tabular-nums via `formatPrice`. */
  price: number;
  /** Optional status badge (e.g. ACTIVO). */
  badge?: { label: string; tone: TechCardBadgeTone };
  /** Card footer / action area. */
  actions?: ReactNode;
  /** Cover/media block to render under the header. */
  cover?: ReactNode;
  className?: string;
}

/**
 * Pure price formatter for Blueprint cards: USD with two decimals, mono 700,
 * tabular-nums. Kept pure and exported so copy edges (per-region format,
 * currency) are easy to test/change without touching markup.
 */
export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

const BADGE_EDGE: Record<TechCardBadgeTone, string> = {
  success: 'border-success text-success',
  warning: 'border-warning text-warning',
  error: 'border-error text-error',
};

export default function TechCard({
  code,
  title,
  sub,
  price,
  badge,
  actions,
  cover,
  className = '',
}: TechCardProps) {
  return (
    <article className={`relative border border-outline bg-surface-1/40 p-3 ${className}`}>
      <Corners />
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-secondary">
          [{code}]
        </span>
        {badge ? (
          <span
            className={`inline-flex items-center px-1.5 py-0.5 border font-mono text-[9px] uppercase tracking-widest ${BADGE_EDGE[badge.tone]}`}
          >
            {badge.label}
          </span>
        ) : null}
      </div>
      {cover ? <div className="mt-2">{cover}</div> : null}
      <h3 className="mt-2 font-[family-name:var(--font-space-grotesk)] text-sm font-bold leading-tight text-on-surface">
        {title}
      </h3>
      {sub ? <p className="mt-0.5 text-xs text-on-surface-muted">{sub}</p> : null}
      <p className="mt-2 font-mono text-sm font-bold text-secondary tabular-nums">
        {formatPrice(price)}
      </p>
      {actions ? <div className="mt-3">{actions}</div> : null}
    </article>
  );
}
