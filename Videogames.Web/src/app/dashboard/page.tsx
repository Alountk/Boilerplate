'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { VideogameService } from '@/infrastructure/services/VideogameService';
import { Videogame } from '@/domain/models/Videogame';
import MyItemsGrid from '@/components/MyItemsGrid';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import TechChip from '@/components/theme/TechChip';

type SortType = 'name' | 'price' | 'date' | 'state';
type SortOrder = 'asc' | 'desc';
type StateFilter = 'all' | 'good' | 'fair' | 'poor';

const SORT_OPTIONS: Array<{ value: SortType; label: string }> = [
  { value: 'name', label: 'NOMBRE' },
  { value: 'price', label: 'PRECIO' },
  { value: 'date', label: 'FECHA' },
  { value: 'state', label: 'ESTADO' },
];

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [videogameService] = useState(() => new VideogameService());

  const [items, setItems] = useState<Videogame[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState<StateFilter>('all');
  const [sortBy, setSortBy] = useState<SortType>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const fetchItems = useCallback(async (page: number) => {
    try {
      setIsLoading(true);
      const result = await videogameService.getMyItems(page, pageSize);
      let filteredItems = result.items;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredItems = filteredItems.filter(
          (item) =>
            item.englishName.toLowerCase().includes(query) ||
            item.console.toLowerCase().includes(query)
        );
      }

      if (selectedState !== 'all') {
        filteredItems = filteredItems.filter((item) => {
          if (selectedState === 'good') return item.generalState >= 8;
          if (selectedState === 'fair') return item.generalState >= 5 && item.generalState < 8;
          if (selectedState === 'poor') return item.generalState < 5;
          return true;
        });
      }

      const sorted = [...filteredItems].sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'name') {
          comparison = a.englishName.localeCompare(b.englishName);
        } else if (sortBy === 'price') {
          comparison = a.ownPrice - b.ownPrice;
        } else if (sortBy === 'date') {
          comparison = new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime();
        } else if (sortBy === 'state') {
          comparison = a.generalState - b.generalState;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });

      setItems(sorted);
      setTotalCount(result.totalCount);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setIsLoading(false);
    }
  }, [pageSize, searchQuery, selectedState, sortBy, sortOrder]);

  useEffect(() => {
    if (user) {
      fetchItems(currentPage);
    }
  }, [user, currentPage, fetchItems]);

  const toggleSort = (column: SortType) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setIsLoading(true);
      await videogameService.delete(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      setTotalCount((prev) => prev - 1);
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error al eliminar el item');
    } finally {
      setIsLoading(false);
    }
  };

  const stats = {
    total: items.length,
    averagePrice: items.length > 0
      ? (items.reduce((sum, item) => sum + item.ownPrice, 0) / items.length).toFixed(2)
      : '0.00',
    totalValue: items.length > 0
      ? items.reduce((sum, item) => sum + item.ownPrice, 0).toFixed(2)
      : '0.00',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="animate-spin h-12 w-12 rounded-full border-t-2 border-secondary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="border-b border-outline bg-surface py-8">
        <div className="mx-auto max-w-7xl px-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-secondary">SYS.02 — DASHBOARD</p>
          <h1 className="mt-2 mb-1 font-[family-name:var(--font-space-grotesk)] text-3xl font-bold text-on-surface">Mi Dashboard</h1>
          <p className="text-sm text-on-surface-muted">Gestiona todos tus items listados</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Statistics — tech cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="relative border border-outline bg-surface-1/40 p-5">
            <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-on-surface-muted">Total de Items</p>
            <p className="font-mono text-3xl font-bold text-secondary tabular-nums">{stats.total}</p>
          </div>
          <div className="relative border border-outline bg-surface-1/40 p-5">
            <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-on-surface-muted">Precio Promedio</p>
            <p className="font-mono text-3xl font-bold text-on-surface tabular-nums">${stats.averagePrice}</p>
          </div>
          <div className="relative border border-outline bg-surface-1/40 p-5">
            <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-on-surface-muted">Valor Total</p>
            <p className="font-mono text-3xl font-bold text-on-surface tabular-nums">${stats.totalValue}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 border border-outline bg-surface-1/40 p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="relative md:col-span-5">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-muted" />
              <input
                type="text"
                placeholder="Buscar por nombre o consola..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full border border-outline bg-surface-2/60 py-2 pl-10 pr-4 font-mono text-sm text-on-surface placeholder:text-on-surface-muted/50 outline-none transition-colors focus:border-secondary"
              />
            </div>

            <div className="md:col-span-3">
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value as StateFilter);
                  setCurrentPage(1);
                }}
                className="w-full border border-outline bg-surface-2/60 px-4 py-2 font-mono text-sm text-on-surface outline-none transition-colors focus:border-secondary"
              >
                <option value="all">Todos los estados</option>
                <option value="good">Bueno (8-10)</option>
                <option value="fair">Regular (5-7)</option>
                <option value="poor">Malo (&lt;5)</option>
              </select>
            </div>

            {/* Sort control */}
            <div className="md:col-span-2">
              <div className="flex flex-wrap gap-2">
                {SORT_OPTIONS.map((opt) => (
                  <TechChip
                    key={opt.value}
                    label={opt.label}
                    active={sortBy === opt.value}
                    onClick={() => toggleSort(opt.value)}
                    className="min-h-10"
                  />
                ))}
              </div>
            </div>

            {(searchQuery || selectedState !== 'all') && (
              <div className="md:col-span-2">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedState('all');
                    setCurrentPage(1);
                  }}
                  className="min-h-12 w-full border border-outline px-4 font-mono text-xs uppercase tracking-widest text-on-surface-muted transition-colors active:border-secondary active:text-secondary"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Item grid (replaces overflow-prone table) */}
        <MyItemsGrid
          items={items}
          isLoading={isLoading}
          onDelete={handleDelete}
        />

        {/* Pagination */}
        {totalCount > pageSize && (
          <div className="mt-6 flex items-center justify-between">
            <div className="font-mono text-xs uppercase tracking-widest text-on-surface-muted">
              Mostrando {items.length} de {totalCount} items
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="min-h-11 border border-secondary/40 px-4 font-mono text-xs uppercase tracking-widest text-secondary transition-colors active:bg-secondary/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="px-4 py-2 font-mono text-xs text-on-surface">Página {currentPage}</span>
              <button
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={!hasMore}
                className="min-h-11 border border-secondary/40 px-4 font-mono text-xs uppercase tracking-widest text-secondary transition-colors active:bg-secondary/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
