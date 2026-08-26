import type { ReactNode } from 'react';
import Corners from './Corners';

/**
 * BlueprintGrid — 24px drafting grid overlay ("la firma visual").
 *
 * Wraps children with the CSS-gradient grid background (`.bp-grid` /
 * `.bp-grid-strong`, defined in globals.css) and optionally paints crosshair
 * registration marks at the corners. Zero images.
 */
interface BlueprintGridProps {
  /** Grid line strength. `default` = fine grid, `strong` = brighter lines. */
  variant?: 'default' | 'strong';
  /** Renders corner crosshair marks via <Corners>. */
  showCrosshairs?: boolean;
  className?: string;
  children?: ReactNode;
}

export default function BlueprintGrid({
  variant = 'default',
  showCrosshairs = false,
  className = '',
  children,
}: BlueprintGridProps) {
  return (
    <div
      className={`relative ${variant === 'strong' ? 'bp-grid-strong' : 'bp-grid'} ${className}`}
    >
      {showCrosshairs ? <Corners /> : null}
      {children}
    </div>
  );
}
