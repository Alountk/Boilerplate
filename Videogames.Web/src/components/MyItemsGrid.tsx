'use client';

import Link from 'next/link';
import { EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { Videogame } from '@/domain/models/Videogame';
import VideogameCover from './VideogameCover';
import TechCard, { type TechCardBadgeTone } from './theme/TechCard';

/**
 * Blueprint status derivation.
 *
 * Design decision (verified against the API domain model): `Videogame` has no
 * sold/status field, so a listed item's status is derived as ACTIVO only.
 * VENDIDO is NOT derivable without a backend change and is out of scope. Kept
 * pure and exported so it can be tested directly and extended when the data
 * model gains a status field.
 */
export function getItemStatus(item: Videogame): { label: string; tone: TechCardBadgeTone } {
  void item;
  return { label: 'ACTIVO', tone: 'success' };
}

interface MyItemsGridProps {
  items: Videogame[];
  isLoading?: boolean;
  /** Called when a user confirms deletion of a listing. */
  onDelete?: (id: string) => void;
  className?: string;
  emptyLabel?: string;
}

function coverFor(item: Videogame) {
  return (
    <VideogameCover
      title={item.englishName}
      images={item.images}
      urlImg={item.urlImg}
      imgClassName="aspect-square w-full object-cover"
      fallbackClassName="aspect-square w-full"
    />
  );
}

/**
 * MyItemsGrid — Blueprint 2-column TechCard grid for the dashboard ("Panel de
 * control"). Replaces the overflow-prone table (design D4). Controlled: it
 * receives `items` and renders card cover, `[CMP-xx]` code, name, console,
 * ACTIVO status badge and view/edit/delete actions.
 *
 * The dashboard page wires this component in a later slice; filters, stats and
 * the MyItemsSortHeader contract stay owned by the page and are passed through.
 */
export default function MyItemsGrid({
  items,
  isLoading = false,
  onDelete,
  className = '',
  emptyLabel = 'No tienes items creados',
}: MyItemsGridProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-12 w-12 rounded-full border-t-2 border-secondary" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="mb-4 text-on-surface-muted">{emptyLabel}</p>
        <Link
          href="/create"
          className="inline-flex items-center justify-center px-6 py-3 border border-secondary text-secondary font-mono uppercase tracking-widest text-sm hover:bg-secondary/10 transition-colors"
        >
          Crear tu primer item
        </Link>
      </div>
    );
  }

  return (
    <div data-testid="my-items-grid" className={`grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 ${className}`}>
      {items.map((item, index) => {
        const status = getItemStatus(item);
        return (
          <TechCard
            key={item.id}
            code={`CMP-${String(index + 1).padStart(2, '0')}`}
            title={item.englishName}
            sub={item.console}
            price={item.ownPrice}
            badge={status}
            cover={coverFor(item)}
            actions={
              <div className="flex items-center gap-1">
                <Link
                  href={`/product/${item.id}`}
                  className="p-2 text-secondary hover:bg-secondary/10 rounded-sm transition-colors"
                  title="Ver detalles"
                  aria-label={`Ver detalles de ${item.englishName}`}
                >
                  <EyeIcon className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href={`/create?id=${item.id}`}
                  className="p-2 text-on-surface-muted hover:text-secondary hover:bg-secondary/10 rounded-sm transition-colors"
                  title="Editar"
                  aria-label={`Editar ${item.englishName}`}
                >
                  <PencilIcon className="h-4 w-4" aria-hidden="true" />
                </Link>
                {onDelete ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('¿Estás seguro de que quieres eliminar este item?')) {
                        onDelete(item.id);
                      }
                    }}
                    className="p-2 text-error hover:bg-error/10 rounded-sm transition-colors"
                    title="Eliminar"
                    aria-label={`Eliminar ${item.englishName}`}
                  >
                    <TrashIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            }
          />
        );
      })}
    </div>
  );
}
