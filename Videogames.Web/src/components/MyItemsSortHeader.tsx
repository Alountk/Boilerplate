'use client';

import { ChevronUpDownIcon } from '@heroicons/react/24/outline';

export type MyItemsSortColumn = 'name' | 'price' | 'date' | 'state';
export type MyItemsSortOrder = 'asc' | 'desc';

interface MyItemsSortHeaderProps {
  column: MyItemsSortColumn;
  label: string;
  sortBy: MyItemsSortColumn;
  sortOrder: MyItemsSortOrder;
  onSort: (column: MyItemsSortColumn) => void;
}

export default function MyItemsSortHeader({
  column,
  label,
  sortBy,
  sortOrder,
  onSort,
}: MyItemsSortHeaderProps) {
  const isActive = sortBy === column;

  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      className="flex items-center gap-2 font-semibold text-on-surface hover:text-primary transition-colors"
      aria-label={`Ordenar por ${label}`}
      aria-pressed={isActive}
    >
      {label}
      {isActive && (
        <ChevronUpDownIcon
          className={`h-4 w-4 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`}
        />
      )}
    </button>
  );
}
