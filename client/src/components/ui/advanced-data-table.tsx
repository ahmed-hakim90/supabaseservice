import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export interface AdvancedColumn<T> {
  key: string;
  title: string;
  render?: (value: any, item: T) => React.ReactNode;
  sortable?: boolean;
  searchable?: boolean;
  width?: string;
  className?: string;
}

export interface BulkAction<T> {
  key: string;
  label: string;
  icon?: string;
  action: (selectedItems: T[]) => void | Promise<void>;
  variant?: 'default' | 'destructive';
  requiresConfirmation?: boolean;
}

export interface QuickFilter {
  key: string;
  label: string;
  filter: (item: any) => boolean;
  count?: number;
}

interface AdvancedDataTableProps<T> {
  data: T[];
  columns: AdvancedColumn<T>[];
  loading?: boolean;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onCreate?: () => void;
  onView?: (item: T) => void;
  bulkActions?: BulkAction<T>[];
  searchPlaceholder?: string;
  title?: string;
  emptyMessage?: string;
  rowKey?: keyof T;
  selectable?: boolean;
  quickFilters?: QuickFilter[];
  customActions?: React.ReactNode;
  showStats?: boolean;
}

export function AdvancedDataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  onEdit,
  onDelete,
  onCreate,
  onView,
  bulkActions = [],
  searchPlaceholder = "البحث...",
  title,
  emptyMessage = "لا توجد بيانات",
  rowKey = 'id' as keyof T,
  selectable = false,
  quickFilters = [],
  customActions,
  showStats = true
}: AdvancedDataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState<T[]>([]);
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [activeFilter, setActiveFilter] = useState<string>("");

  // Apply quick filter first
  const quickFilteredData = activeFilter 
    ? data.filter(quickFilters.find(f => f.key === activeFilter)?.filter || (() => true))
    : data;

  // Then apply search
  const filteredData = quickFilteredData.filter((item) => {
    if (!searchTerm) return true;
    
    return columns
      .filter(col => col.searchable !== false)
      .some(col => {
        const value = item[col.key];
        return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
      });
  });

  // Sort data
  const sortedData = sortColumn ? 
    [...filteredData].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      const result = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDirection === 'desc' ? -result : result;
    }) : filteredData;

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedItems(checked ? sortedData : []);
  };

  const handleSelectItem = (item: T, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, item]);
    } else {
      setSelectedItems(selectedItems.filter(selected => selected[rowKey] !== item[rowKey]));
    }
  };

  const isSelected = (item: T) => {
    return selectedItems.some(selected => selected[rowKey] === item[rowKey]);
  };

  const handleBulkAction = async (action: BulkAction<T>) => {
    if (action.requiresConfirmation && !confirm(`هل أنت متأكد من ${action.label}؟`)) {
      return;
    }
    
    try {
      await action.action(selectedItems);
      setSelectedItems([]);
    } catch (error) {
      console.error('Bulk action error:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                  <i className="bi bi-collection text-primary"></i>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي العناصر</p>
                  <p className="text-xl font-bold">{data.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center mr-3">
                  <i className="bi bi-check-circle text-green-500"></i>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">عناصر مفلترة</p>
                  <p className="text-xl font-bold">{sortedData.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center mr-3">
                  <i className="bi bi-ui-checks text-blue-500"></i>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">عناصر محددة</p>
                  <p className="text-xl font-bold">{selectedItems.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center mr-3">
                  <i className="bi bi-search text-orange-500"></i>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">البحث نشط</p>
                  <p className="text-xl font-bold">{searchTerm ? 'نعم' : 'لا'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Filters */}
      {quickFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeFilter === "" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter("")}
          >
            الكل ({data.length})
          </Button>
          {quickFilters.map((filter) => {
            const count = data.filter(filter.filter).length;
            return (
              <Button
                key={filter.key}
                variant={activeFilter === filter.key ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(filter.key)}
              >
                {filter.label} ({count})
              </Button>
            );
          })}
        </div>
      )}

      {/* Main Table Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {title && <CardTitle>{title}</CardTitle>}
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              
              {/* Bulk Actions */}
              {selectedItems.length > 0 && bulkActions.length > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    تم تحديد {selectedItems.length} عنصر
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <i className="bi bi-three-dots"></i>
                        إجراءات
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {bulkActions.map((action) => (
                        <DropdownMenuItem
                          key={action.key}
                          onClick={() => handleBulkAction(action)}
                          className={action.variant === 'destructive' ? 'text-destructive' : ''}
                        >
                          {action.icon && <i className={`bi ${action.icon} mr-2`}></i>}
                          {action.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {customActions}
              {onCreate && (
                <Button onClick={onCreate}>
                  <i className="bi bi-plus mr-2"></i>
                  إضافة جديد
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <div className="loading-spinner"></div>
                <span>جاري التحميل...</span>
              </div>
            </div>
          ) : sortedData.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="bi bi-inbox text-2xl text-muted-foreground"></i>
              </div>
              <p className="text-muted-foreground">{emptyMessage}</p>
              {searchTerm && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchTerm("")}
                  className="mt-2"
                >
                  مسح البحث
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {selectable && (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedItems.length === sortedData.length && sortedData.length > 0}
                        onCheckedChange={(checked) => handleSelectAll(checked === true)}
                      />
                    </TableHead>
                  )}
                  {columns.map((column) => (
                    <TableHead
                      key={column.key}
                      className={`${column.className || ''} ${column.sortable !== false ? 'cursor-pointer hover:bg-muted/50' : ''}`}
                      style={{ width: column.width }}
                      onClick={() => column.sortable !== false && handleSort(column.key)}
                    >
                      <div className="flex items-center gap-2">
                        {column.title}
                        {column.sortable !== false && sortColumn === column.key && (
                          <i className={`bi bi-chevron-${sortDirection === 'asc' ? 'up' : 'down'}`}></i>
                        )}
                      </div>
                    </TableHead>
                  ))}
                  {(onEdit || onDelete || onView) && (
                    <TableHead className="w-40 text-center">الإجراءات</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((item, index) => (
                  <TableRow 
                    key={item[rowKey]} 
                    className={`${isSelected(item) ? 'bg-muted/50' : ''} hover:bg-muted/30 transition-colors`}
                  >
                    {selectable && (
                      <TableCell>
                        <Checkbox
                          checked={isSelected(item)}
                          onCheckedChange={(checked) => handleSelectItem(item, checked === true)}
                        />
                      </TableCell>
                    )}
                    {columns.map((column) => (
                      <TableCell key={column.key} className={column.className}>
                        {column.render 
                          ? column.render(item[column.key], item)
                          : item[column.key]
                        }
                      </TableCell>
                    ))}
                    {(onEdit || onDelete || onView) && (
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          {onView && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onView(item)}
                              title="عرض"
                            >
                              <i className="bi bi-eye"></i>
                            </Button>
                          )}
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(item)}
                              title="تعديل"
                            >
                              <i className="bi bi-pencil"></i>
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDelete(item)}
                              className="text-destructive hover:text-destructive"
                              title="حذف"
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}