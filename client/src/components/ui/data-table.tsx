import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Default pagination settings
export const DEFAULT_PAGINATION_CONFIG = {
  totalItemsToFetch: 100,
  defaultItemsPerPage: 15,
  itemsPerPageOptions: [10, 15, 25, 50, 100]
};

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  searchable?: boolean;
}

export interface PaginationConfig {
  totalItemsToFetch?: number;
  defaultItemsPerPage?: number;
  itemsPerPageOptions?: number[];
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKeys?: string[];
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  pagination?: PaginationConfig;
  onItemClick?: (item: T) => void;
  emptyMessage?: string;
  className?: string;
}

function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  searchable = true,
  searchPlaceholder = "البحث...",
  searchKeys = [],
  filters,
  actions,
  pagination = DEFAULT_PAGINATION_CONFIG,
  onItemClick,
  emptyMessage = "لا توجد بيانات للعرض",
  className = ""
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(
    pagination.defaultItemsPerPage || DEFAULT_PAGINATION_CONFIG.defaultItemsPerPage
  );

  const config = { ...DEFAULT_PAGINATION_CONFIG, ...pagination };

  // Filter data based on search term
  const filteredData = data?.filter((item) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    // If specific search keys are provided, search only in those fields
    if (searchKeys.length > 0) {
      return searchKeys.some(key => {
        const value = item[key];
        return value && value.toString().toLowerCase().includes(searchLower);
      });
    }
    
    // Otherwise, search in all searchable columns
    const searchableColumns = columns.filter(col => col.searchable !== false);
    return searchableColumns.some(col => {
      const value = item[col.key];
      return value && value.toString().toLowerCase().includes(searchLower);
    });
  }) || [];

  // Pagination calculations
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Reset to first page when search or items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderPaginationItems = () => {
    const items = [];
    
    // Previous button
    items.push(
      <PaginationItem key="prev">
        <PaginationPrevious 
          href="#"
          onClick={(e) => {
            e.preventDefault();
            if (currentPage > 1) handlePageChange(currentPage - 1);
          }}
          className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
        />
      </PaginationItem>
    );

    // First page
    if (currentPage > 2) {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(1); }}>
            1
          </PaginationLink>
        </PaginationItem>
      );
      if (currentPage > 3) {
        items.push(<PaginationEllipsis key="ellipsis1" />);
      }
    }

    // Current and adjacent pages
    const pagesToShow = Array.from({ length: totalPages }, (_, i) => i + 1)
      .filter(page => 
        page === currentPage || 
        page === currentPage - 1 || 
        page === currentPage + 1
      );

    pagesToShow.forEach(page => {
      items.push(
        <PaginationItem key={page}>
          <PaginationLink
            href="#"
            isActive={page === currentPage}
            onClick={(e) => { e.preventDefault(); handlePageChange(page); }}
          >
            {page}
          </PaginationLink>
        </PaginationItem>
      );
    });

    // Last page
    if (currentPage < totalPages - 1) {
      if (currentPage < totalPages - 2) {
        items.push(<PaginationEllipsis key="ellipsis2" />);
      }
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(totalPages); }}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Next button
    items.push(
      <PaginationItem key="next">
        <PaginationNext 
          href="#"
          onClick={(e) => {
            e.preventDefault();
            if (currentPage < totalPages) handlePageChange(currentPage + 1);
          }}
          className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
        />
      </PaginationItem>
    );

    return items;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with search and actions */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4 items-center">
          {searchable && (
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          )}
          {filters}
        </div>
        {actions}
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {columns.map((column) => (
                <TableHead key={column.key} className="text-right font-semibold">
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    جارٍ تحميل البيانات...
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item, index) => (
                <TableRow 
                  key={index} 
                  className={`hover:bg-muted/20 ${onItemClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onItemClick?.(item)}
                >
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {column.render ? column.render(item) : item[column.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Info and Controls */}
      {totalItems > 0 && (
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              عرض {totalItems > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, totalItems)} من {totalItems} عنصر
              {data.length >= config.totalItemsToFetch && (
                <span className="text-amber-600 mr-2">
                  (محدود بـ {config.totalItemsToFetch} عنصر)
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">عرض</span>
              <Select 
                value={itemsPerPage.toString()} 
                onValueChange={(value) => setItemsPerPage(Number(value))}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {config.itemsPerPageOptions.map(option => (
                    <SelectItem key={option} value={option.toString()}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">سطر</span>
            </div>
          </div>
          
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                {renderPaginationItems()}
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}
    </div>
  );
}

export default DataTable;