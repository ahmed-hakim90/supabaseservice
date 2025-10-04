import { useState, useMemo } from 'react';

interface UseDataTableOptions<T> {
  data: T[];
  searchFields: (keyof T)[];
  filterFields?: {
    field: keyof T;
    options: { value: string; label: string }[];
  }[];
  sortField?: keyof T;
  sortDirection?: 'asc' | 'desc';
  itemsPerPage?: number;
}

export function useDataTable<T>(options: UseDataTableOptions<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof T | null>(options.sortField || null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(options.sortDirection || 'asc');
  
  // Initialize filters based on provided filter fields
  const [filters, setFilters] = useState<Record<string, string>>(() => {
    const initialFilters: Record<string, string> = {};
    options.filterFields?.forEach(filter => {
      initialFilters[filter.field as string] = 'all';
    });
    return initialFilters;
  });

  const itemsPerPage = options.itemsPerPage || 10;

  // Filtered and sorted data
  const filteredData = useMemo(() => {
    let filtered = [...options.data];

    // Apply search
    if (searchTerm.trim()) {
      filtered = filtered.filter(item =>
        options.searchFields.some(field => {
          const value = item[field];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(searchTerm.toLowerCase());
          }
          if (typeof value === 'number') {
            return value.toString().includes(searchTerm);
          }
          return false;
        })
      );
    }

    // Apply filters
    Object.entries(filters).forEach(([field, value]) => {
      if (value !== 'all') {
        filtered = filtered.filter(item => {
          const itemValue = item[field as keyof T];
          if (typeof itemValue === 'string') {
            return itemValue === value;
          }
          if (typeof itemValue === 'boolean') {
            return itemValue.toString() === value;
          }
          return itemValue === value;
        });
      }
    });

    // Apply sorting
    if (sortField) {
      filtered.sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc' 
            ? aValue.localeCompare(bValue) 
            : bValue.localeCompare(aValue);
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        if (aValue instanceof Date && bValue instanceof Date) {
          return sortDirection === 'asc' 
            ? aValue.getTime() - bValue.getTime() 
            : bValue.getTime() - aValue.getTime();
        }
        
        return 0;
      });
    }

    return filtered;
  }, [options.data, searchTerm, filters, sortField, sortDirection, options.searchFields]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Helper functions
  const setFilter = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleSort = (field: keyof T) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchTerm('');
    const resetFilters: Record<string, string> = {};
    options.filterFields?.forEach(filter => {
      resetFilters[filter.field as string] = 'all';
    });
    setFilters(resetFilters);
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);

  return {
    // Data
    data: paginatedData,
    filteredData,
    totalItems: filteredData.length,
    
    // Search
    searchTerm,
    setSearchTerm,
    
    // Filters
    filters,
    setFilter,
    resetFilters,
    
    // Sorting
    sortField,
    sortDirection,
    handleSort,
    
    // Pagination
    currentPage,
    totalPages,
    itemsPerPage,
    goToPage,
    nextPage,
    prevPage,
    canGoNext: currentPage < totalPages,
    canGoPrev: currentPage > 1,
    
    // Stats
    startIndex: startIndex + 1,
    endIndex: Math.min(endIndex, filteredData.length),
  };
}