'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { VideogameService } from '@/infrastructure/services/VideogameService';
import { Videogame } from '@/domain/models/Videogame';
import MyItemsTable from '@/components/MyItemsTable';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

type SortType = 'name' | 'price' | 'date' | 'state';
type SortOrder = 'asc' | 'desc';
type StateFilter = 'all' | 'good' | 'fair' | 'poor';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [videogameService] = useState(() => new VideogameService());

  // State
  const [items, setItems] = useState<Videogame[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState<StateFilter>('all');
  const [sortBy, setSortBy] = useState<SortType>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Fetch items
  const fetchItems = useCallback(async (page: number) => {
    try {
      setIsLoading(true);
      const result = await videogameService.getMyItems(page, pageSize);
      let filteredItems = result.items;

      // Apply search filter (client-side)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredItems = filteredItems.filter(
          (item) =>
            item.englishName.toLowerCase().includes(query) ||
            item.console.toLowerCase().includes(query)
        );
      }

      // Apply state filter (client-side)
      if (selectedState !== 'all') {
        filteredItems = filteredItems.filter((item) => {
          if (selectedState === 'good') return item.generalState >= 8;
          if (selectedState === 'fair') return item.generalState >= 5 && item.generalState < 8;
          if (selectedState === 'poor') return item.generalState < 5;
          return true;
        });
      }

      // Apply sorting (client-side)
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

  // Load items on mount and when filters change
  useEffect(() => {
    if (user) {
      fetchItems(currentPage);
    }
  }, [user, currentPage, fetchItems]);

  // Handle delete
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

  // Calculate statistics
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-surface-container border-b border-outline-variant/20 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-on-surface mb-2">Mi Dashboard</h1>
          <p className="text-on-surface-variant">Gestiona todos tus items listados</p>
        </div>
      </div>

      {/* Statistics */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-surface-container rounded-lg p-6 border border-outline-variant/20">
            <p className="text-on-surface-variant text-sm mb-1">Total de Items</p>
            <p className="text-3xl font-bold text-primary">{stats.total}</p>
          </div>
          <div className="bg-surface-container rounded-lg p-6 border border-outline-variant/20">
            <p className="text-on-surface-variant text-sm mb-1">Precio Promedio</p>
            <p className="text-3xl font-bold text-on-surface">${stats.averagePrice}</p>
          </div>
          <div className="bg-surface-container rounded-lg p-6 border border-outline-variant/20">
            <p className="text-on-surface-variant text-sm mb-1">Valor Total</p>
            <p className="text-3xl font-bold text-on-surface">${stats.totalValue}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-surface-container rounded-lg p-6 border border-outline-variant/20 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-on-surface-variant" />
              <input
                type="text"
                placeholder="Buscar por nombre o consola..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 bg-background border border-outline-variant/30 rounded-lg text-on-surface placeholder-on-surface-variant focus:border-primary focus:outline-none transition-colors"
              />
            </div>

            {/* State Filter */}
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value as StateFilter);
                setCurrentPage(1);
              }}
              className="px-4 py-2 bg-background border border-outline-variant/30 rounded-lg text-on-surface focus:border-primary focus:outline-none transition-colors"
            >
              <option value="all">Todos los estados</option>
              <option value="good">Bueno (8-10)</option>
              <option value="fair">Regular (5-7)</option>
              <option value="poor">Malo (&lt;5)</option>
            </select>

            {/* Clear Filters */}
            {(searchQuery || selectedState !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedState('all');
                  setCurrentPage(1);
                }}
                className="px-4 py-2 bg-outline/10 text-on-surface rounded-lg hover:bg-outline/20 transition-colors font-medium"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-surface-container rounded-lg border border-outline-variant/20">
          <MyItemsTable
            items={items}
            isLoading={isLoading}
            onDelete={handleDelete}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
          />
        </div>

        {/* Pagination */}
        {totalCount > pageSize && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-on-surface-variant">
              Mostrando {items.length} de {totalCount} items
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              <span className="px-4 py-2 text-on-surface">Página {currentPage}</span>
              <button
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={!hasMore}
                className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
