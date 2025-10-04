import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, Edit, Trash2, Eye } from 'lucide-react';

interface Column<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  searchable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface FilterOption {
  field: string;
  label: string;
  options: { value: string; label: string }[];
}

interface ReusableTableProps<T> {
  data: T[];
  columns: Column<T>[];
  title?: string;
  searchPlaceholder?: string;
  filters?: FilterOption[];
  actions?: {
    view?: (item: T) => void;
    edit?: (item: T) => void;
    delete?: (item: T) => void;
    custom?: Array<{
      label: string;
      icon?: React.ReactNode;
      onClick: (item: T) => void;
      variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive';
    }>;
  };
  isLoading?: boolean;
  emptyMessage?: string;
  showSearch?: boolean;
  showFilters?: boolean;
  showPagination?: boolean;
  addButton?: React.ReactNode;
  headerActions?: React.ReactNode;
  
  // Table hooks integration
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  filters_values?: Record<string, string>;
  onFilterChange?: (field: string, value: string) => void;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  
  // Pagination
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  itemsPerPage?: number;
  totalItems?: number;
  startIndex?: number;
  endIndex?: number;
}

export function ReusableTable<T extends { id: string }>({
  data,
  columns,
  title,
  searchPlaceholder = 'البحث...',
  filters = [],
  actions,
  isLoading = false,
  emptyMessage = 'لا توجد بيانات للعرض',
  showSearch = true,
  showFilters = true,
  showPagination = true,
  addButton,
  headerActions,
  searchTerm = '',
  onSearchChange,
  filters_values = {},
  onFilterChange,
  sortField,
  sortDirection,
  onSort,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  itemsPerPage = 10,
  totalItems = 0,
  startIndex = 1,
  endIndex = 0
}: ReusableTableProps<T>) {

  const getSortIcon = (columnKey: string) => {
    if (sortField !== columnKey) return <ArrowUpDown className="w-4 h-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  const renderCell = (column: Column<T>, item: T) => {
    const value = item[column.key];
    
    if (column.render) {
      return column.render(value, item);
    }
    
    if (typeof value === 'boolean') {
      return (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'نشط' : 'غير نشط'}
        </Badge>
      );
    }
    
    if (value instanceof Date) {
      return value.toLocaleDateString('ar-EG');
    }
    
    return value?.toString() || '-';
  };

  const renderActions = (item: T) => {
    if (!actions) return null;
    
    return (
      <div className="flex items-center gap-2">
        {actions.view && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => actions.view!(item)}
            title="عرض"
          >
            <Eye className="w-4 h-4" />
          </Button>
        )}
        {actions.edit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => actions.edit!(item)}
            title="تعديل"
          >
            <Edit className="w-4 h-4" />
          </Button>
        )}
        {actions.delete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => actions.delete!(item)}
            title="حذف"
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
        {actions.custom?.map((action, index) => (
          <Button
            key={index}
            variant={action.variant || 'ghost'}
            size="sm"
            onClick={() => action.onClick(item)}
            title={action.label}
          >
            {action.icon}
          </Button>
        ))}
      </div>
    );
  };

  return (
    <Card className="w-full">
      {(title || addButton || headerActions) && (
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-2xl font-bold">{title}</CardTitle>
          <div className="flex items-center gap-2">
            {headerActions}
            {addButton}
          </div>
        </CardHeader>
      )}
      
      <CardContent className="space-y-4">
        {/* Search and Filters */}
        {(showSearch || showFilters) && (
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              {showSearch && (
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    className="text-right pl-4 pr-10"
                  />
                </div>
              )}
              
              {showFilters && filters.length > 0 && (
                <div className="flex gap-2 items-center">
                  <Filter className="w-4 h-4 text-gray-500" />
                  {filters.map((filter) => (
                    <Select
                      key={filter.field}
                      value={filters_values[filter.field] || 'all'}
                      onValueChange={(value) => onFilterChange?.(filter.field, value)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder={filter.label} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">الكل</SelectItem>
                        {filter.options.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead
                    key={column.key.toString()}
                    className={`text-${column.align || 'right'} ${column.width ? `w-${column.width}` : ''}`}
                  >
                    {column.sortable ? (
                      <Button
                        variant="ghost"
                        onClick={() => onSort?.(column.key.toString())}
                        className="flex items-center gap-2 p-0 h-auto font-medium"
                      >
                        {column.label}
                        {getSortIcon(column.key.toString())}
                      </Button>
                    ) : (
                      column.label
                    )}
                  </TableHead>
                ))}
                {actions && (
                  <TableHead className="text-center w-32">الإجراءات</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell 
                    colSpan={columns.length + (actions ? 1 : 0)} 
                    className="text-center py-8"
                  >
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span className="mr-2">جاري التحميل...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell 
                    colSpan={columns.length + (actions ? 1 : 0)} 
                    className="text-center py-8 text-muted-foreground"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item, index) => (
                  <TableRow key={item.id || index}>
                    {columns.map((column) => (
                      <TableCell 
                        key={column.key.toString()}
                        className={`text-${column.align || 'right'}`}
                      >
                        {renderCell(column, item)}
                      </TableCell>
                    ))}
                    {actions && (
                      <TableCell className="text-center">
                        {renderActions(item)}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {showPagination && totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              عرض {startIndex} إلى {endIndex} من {totalItems} عنصر
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                السابق
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNumber = Math.max(1, currentPage - 2) + i;
                  if (pageNumber > totalPages) return null;
                  
                  return (
                    <Button
                      key={pageNumber}
                      variant={currentPage === pageNumber ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onPageChange?.(pageNumber)}
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                التالي
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}