'use client';

import { Videogame } from '@/domain/models/Videogame';
import { TrashIcon, PencilIcon, EyeIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import VideogameCover from './VideogameCover';

interface MyItemsTableProps {
  items: Videogame[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  sortBy: 'name' | 'price' | 'date' | 'state';
  setSortBy: (sort: 'name' | 'price' | 'date' | 'state') => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;
}

export default function MyItemsTable({
  items,
  isLoading,
  onDelete,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
}: MyItemsTableProps) {
  const handleSort = (column: 'name' | 'price' | 'date' | 'state') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const SortHeader = ({ column, label }: { column: 'name' | 'price' | 'date' | 'state'; label: string }) => (
    <button
      onClick={() => handleSort(column)}
      className="flex items-center gap-2 font-semibold text-on-surface hover:text-primary transition-colors"
    >
      {label}
      {sortBy === column && (
        <ChevronUpDownIcon className={`h-4 w-4 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
      )}
    </button>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-on-surface-variant text-lg mb-4">No tienes items creados</p>
        <Link
          href="/create"
          className="inline-flex items-center justify-center px-6 py-3 bg-primary text-on-primary rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          Crear tu primer item
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-outline-variant/20 rounded-lg">
      <table className="w-full">
        <thead className="bg-surface-container border-b border-outline-variant/20">
          <tr>
            <th className="px-6 py-4 text-left">
              <SortHeader column="name" label="Nombre" />
            </th>
            <th className="px-6 py-4 text-left">
              <SortHeader column="price" label="Precio" />
            </th>
            <th className="px-6 py-4 text-left">
              <SortHeader column="state" label="Estado" />
            </th>
            <th className="px-6 py-4 text-left">
              <SortHeader column="date" label="Fecha Creación" />
            </th>
            <th className="px-6 py-4 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/20">
          {items.map((item) => (
            <tr
              key={item.id}
              className="hover:bg-surface-container/50 transition-colors"
            >
              {/* Nombre */}
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded bg-surface-container-lowest shrink-0 overflow-hidden">
                    <VideogameCover
                      title={item.englishName}
                      images={item.images}
                      urlImg={item.urlImg}
                      imgClassName="w-full h-full object-cover"
                      fallbackClassName="w-full h-full"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-on-surface truncate">
                      {item.englishName}
                    </p>
                    <p className="text-xs text-on-surface-variant truncate">
                      {item.console}
                    </p>
                  </div>
                </div>
              </td>

              {/* Precio */}
              <td className="px-6 py-4">
                <p className="text-sm font-semibold text-on-surface">
                  ${item.ownPrice.toFixed(2)}
                </p>
              </td>

              {/* Estado */}
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    item.generalState >= 8 ? 'bg-success' : item.generalState >= 5 ? 'bg-warning' : 'bg-error'
                  }`} />
                  <span className="text-sm text-on-surface">
                    {item.generalState.toFixed(1)}/10
                  </span>
                </div>
              </td>

              {/* Fecha Creación */}
              <td className="px-6 py-4 text-sm text-on-surface-variant">
                {new Date(item.releaseDate).toLocaleDateString('es-ES')}
              </td>

              {/* Acciones */}
              <td className="px-6 py-4">
                <div className="flex justify-center items-center gap-2">
                  {/* Ver Detalles */}
                  <Link
                    href={`/product/${item.id}`}
                    className="inline-flex items-center justify-center p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="Ver detalles"
                    aria-label="Ver detalles del item"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </Link>

                  {/* Editar */}
                  <Link
                    href={`/create?id=${item.id}`}
                    className="inline-flex items-center justify-center p-2 text-on-surface-variant hover:bg-primary/10 hover:text-primary rounded-lg transition-colors"
                    title="Editar"
                    aria-label="Editar el item"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </Link>

                  {/* Eliminar */}
                  <button
                    onClick={() => {
                      if (window.confirm('¿Estás seguro de que quieres eliminar este item?')) {
                        onDelete(item.id);
                      }
                    }}
                    className="inline-flex items-center justify-center p-2 text-error hover:bg-error/10 rounded-lg transition-colors"
                    title="Eliminar"
                    aria-label="Eliminar el item"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
