import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdvancedDataTable, AdvancedColumn, BulkAction, QuickFilter } from '@/components/ui/advanced-data-table';
import { WarehouseForm, ProductForm, CategoryForm, TransferForm } from '@/components/ui/management-forms';
import { TransferDetails } from '@/components/ui/transfer-details';
import { DeleteConfirmation } from '@/components/ui/delete-confirmation';
import { QuickStats, SystemHealth } from '@/components/ui/quick-stats';
import { QuickActions, RecentActivities } from '@/components/ui/quick-actions';
import { toast } from '@/hooks/use-toast';
import { Warehouse, Inventory, Product, Category, PartsTransfer, User } from '../../../shared/schema';

// API Functions
const api = {
  warehouses: {
    getAll: () => fetch('/api/warehouses').then(res => res.json()),
    create: (data: Partial<Warehouse>) => fetch('/api/warehouses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json()),
    update: (id: string, data: Partial<Warehouse>) => fetch(`/api/warehouses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json()),
    delete: (id: string) => fetch(`/api/warehouses/${id}`, { method: 'DELETE' })
  },
  inventory: {
    getAll: () => fetch('/api/inventory').then(res => res.json()),
    create: (data: Partial<Inventory>) => fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json()),
    update: (id: string, data: Partial<Inventory>) => fetch(`/api/inventory/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json()),
    delete: (id: string) => fetch(`/api/inventory/${id}`, { method: 'DELETE' })
  },
  products: {
    getAll: () => fetch('/api/products').then(res => res.json()),
    create: (data: Partial<Product>) => fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json()),
    update: (id: string, data: Partial<Product>) => fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json()),
    delete: (id: string) => fetch(`/api/products/${id}`, { method: 'DELETE' })
  },
  categories: {
    getAll: () => fetch('/api/categories').then(res => res.json()),
    create: (data: Partial<Category>) => fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json()),
    update: (id: string, data: Partial<Category>) => fetch(`/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json()),
    delete: (id: string) => fetch(`/api/categories/${id}`, { method: 'DELETE' })
  },
  transfers: {
    getAll: () => fetch('/api/parts-transfers').then(res => res.json()),
    create: (data: Partial<PartsTransfer>) => fetch('/api/parts-transfers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json()),
    update: (id: string, data: Partial<PartsTransfer>) => fetch(`/api/parts-transfers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json()),
    approve: (id: string) => fetch(`/api/parts-transfers/${id}/approve`, {
      method: 'POST'
    }).then(res => res.json()),
    execute: (id: string) => fetch(`/api/parts-transfers/${id}/execute`, {
      method: 'POST'
    }).then(res => res.json())
  }
};

export default function UnifiedManagement() {
  const [activeTab, setActiveTab] = useState('warehouses');
  const queryClient = useQueryClient();

  // Form states
  const [warehouseFormOpen, setWarehouseFormOpen] = useState(false);
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [transferFormOpen, setTransferFormOpen] = useState(false);
  const [transferDetailsOpen, setTransferDetailsOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingItem, setDeletingItem] = useState<any>(null);
  const [viewingTransfer, setViewingTransfer] = useState<PartsTransfer | null>(null);

  // Queries
  const warehousesQuery = useQuery({
    queryKey: ['warehouses'],
    queryFn: api.warehouses.getAll
  });

  const inventoryQuery = useQuery({
    queryKey: ['inventory'],
    queryFn: api.inventory.getAll
  });

  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: api.products.getAll
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: api.categories.getAll
  });

  const transfersQuery = useQuery({
    queryKey: ['transfers'],
    queryFn: api.transfers.getAll
  });

  // Mutations
  const createWarehouse = useMutation({
    mutationFn: api.warehouses.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast({ title: 'تم إنشاء المخزن بنجاح' });
    }
  });

  const updateWarehouse = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Warehouse> }) => 
      api.warehouses.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast({ title: 'تم تحديث المخزن بنجاح' });
    }
  });

  const deleteWarehouse = useMutation({
    mutationFn: api.warehouses.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast({ title: 'تم حذف المخزن بنجاح' });
    }
  });

  // Form handlers
  const handleCreateWarehouse = () => {
    setEditingItem(null);
    setWarehouseFormOpen(true);
  };

  const handleEditWarehouse = (warehouse: Warehouse) => {
    setEditingItem(warehouse);
    setWarehouseFormOpen(true);
  };

  const handleWarehouseSubmit = async (data: Partial<Warehouse>) => {
    if (editingItem) {
      await updateWarehouse.mutateAsync({ id: editingItem.id, data });
    } else {
      await createWarehouse.mutateAsync(data);
    }
  };

  const handleCreateProduct = () => {
    setEditingItem(null);
    setProductFormOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingItem(product);
    setProductFormOpen(true);
  };

  const handleProductSubmit = async (data: Partial<Product>) => {
    if (editingItem) {
      await api.products.update(editingItem.id, data);
    } else {
      await api.products.create(data);
    }
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  const handleCreateCategory = () => {
    setEditingItem(null);
    setCategoryFormOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingItem(category);
    setCategoryFormOpen(true);
  };

  const handleCategorySubmit = async (data: Partial<Category>) => {
    if (editingItem) {
      await api.categories.update(editingItem.id, data);
    } else {
      await api.categories.create(data);
    }
    queryClient.invalidateQueries({ queryKey: ['categories'] });
  };

  const handleCreateTransfer = () => {
    setEditingItem(null);
    setTransferFormOpen(true);
  };

  const handleEditTransfer = (transfer: PartsTransfer) => {
    setEditingItem(transfer);
    setTransferFormOpen(true);
  };

  const handleTransferSubmit = async (data: Partial<PartsTransfer>) => {
    if (editingItem) {
      await api.transfers.update(editingItem.id, data);
    } else {
      await api.transfers.create(data);
    }
    queryClient.invalidateQueries({ queryKey: ['transfers'] });
  };

  // Delete handlers
  const handleDeleteWarehouse = (warehouse: Warehouse) => {
    setDeletingItem(warehouse);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;
    
    try {
      switch (activeTab) {
        case 'warehouses':
          await deleteWarehouse.mutateAsync(deletingItem.id);
          break;
        case 'products':
          await api.products.delete(deletingItem.id);
          queryClient.invalidateQueries({ queryKey: ['products'] });
          break;
        case 'categories':
          await api.categories.delete(deletingItem.id);
          queryClient.invalidateQueries({ queryKey: ['categories'] });
          break;
      }
      setDeleteConfirmOpen(false);
      setDeletingItem(null);
    } catch (error) {
      toast({ 
        title: "خطأ في الحذف", 
        description: "حدث خطأ أثناء حذف العنصر",
        variant: "destructive"
      });
    }
  };

  // View handlers
  const handleViewTransfer = (transfer: PartsTransfer) => {
    setViewingTransfer(transfer);
    setTransferDetailsOpen(true);
  };

  const handleApproveTransfer = async (id: string) => {
    try {
      await api.transfers.approve(id);
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      toast({ title: 'تمت الموافقة على التحويل' });
    } catch (error) {
      toast({ 
        title: "خطأ في الموافقة", 
        description: "حدث خطأ أثناء الموافقة على التحويل",
        variant: "destructive"
      });
    }
  };

  const handleExecuteTransfer = async (id: string) => {
    try {
      await api.transfers.execute(id);
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      toast({ title: 'تم تنفيذ التحويل' });
    } catch (error) {
      toast({ 
        title: "خطأ في التنفيذ", 
        description: "حدث خطأ أثناء تنفيذ التحويل",
        variant: "destructive"
      });
    }
  };

  // Columns Definitions
  const warehouseColumns: AdvancedColumn<Warehouse>[] = [
    {
      key: 'name',
      title: 'اسم المخزن',
      sortable: true,
      searchable: true
    },
    {
      key: 'location',
      title: 'الموقع',
      sortable: true,
      searchable: true
    },
    {
      key: 'createdAt',
      title: 'تاريخ الإنشاء',
      render: (value) => new Date(value).toLocaleDateString('ar-SA')
    }
  ];

  const inventoryColumns: AdvancedColumn<Inventory>[] = [
    {
      key: 'productName',
      title: 'اسم المنتج',
      sortable: true,
      searchable: true
    },
    {
      key: 'warehouseName',
      title: 'المخزن',
      sortable: true
    },
    {
      key: 'currentQuantity',
      title: 'الكمية الحالية',
      render: (value, item) => (
        <div className="flex items-center gap-2">
          <span className={value <= (item.minQuantity || 0) ? 'text-red-500 font-bold' : ''}>{value}</span>
          {value <= (item.minQuantity || 0) && (
            <Badge variant="destructive" className="text-xs">نفدت</Badge>
          )}
        </div>
      )
    },
    {
      key: 'minQuantity',
      title: 'الحد الأدنى',
      render: (value) => value || 0
    },
    {
      key: 'unitPrice',
      title: 'سعر الوحدة',
      render: (value) => `${value} ريال`
    },
    {
      key: 'lastUpdated',
      title: 'آخر تحديث',
      render: (value) => new Date(value).toLocaleDateString('ar-SA')
    }
  ];

  const transferColumns: AdvancedColumn<PartsTransfer>[] = [
    {
      key: 'transferNumber',
      title: 'رقم التحويل',
      sortable: true,
      searchable: true,
      render: (value) => <code className="bg-muted px-2 py-1 rounded">{value}</code>
    },
    {
      key: 'fromWarehouseName',
      title: 'من مخزن'
    },
    {
      key: 'toWarehouseName',
      title: 'إلى مخزن'
    },
    {
      key: 'quantity',
      title: 'الكمية',
      render: (value) => <Badge variant="outline">{value}</Badge>
    },
    {
      key: 'status',
      title: 'الحالة',
      render: (value) => (
        <Badge variant={
          value === 'pending' ? 'secondary' :
          value === 'approved' ? 'default' :
          value === 'in_transit' ? 'outline' :
          value === 'completed' ? 'default' :
          value === 'cancelled' ? 'destructive' : 'secondary'
        }>
          {value === 'pending' ? 'في الانتظار' :
           value === 'approved' ? 'موافق عليه' :
           value === 'in_transit' ? 'في الطريق' :
           value === 'completed' ? 'مكتمل' :
           value === 'cancelled' ? 'ملغي' : value}
        </Badge>
      )
    },
    {
      key: 'createdAt',
      title: 'تاريخ الإنشاء',
      render: (value) => new Date(value).toLocaleDateString('ar-SA')
    }
  ];

  // Quick Filters
  const inventoryFilters: QuickFilter[] = [
    {
      key: 'low_stock',
      label: 'نفدت تقريباً',
      filter: (item) => item.currentQuantity <= (item.minQuantity || 0)
    },
    {
      key: 'in_stock',
      label: 'متوفرة',
      filter: (item) => item.currentQuantity > (item.minQuantity || 0)
    }
  ];

  const transferFilters: QuickFilter[] = [
    {
      key: 'pending',
      label: 'في الانتظار',
      filter: (item) => item.status === 'pending'
    },
    {
      key: 'approved',
      label: 'موافق عليها',
      filter: (item) => item.status === 'approved'
    },
    {
      key: 'in_transit',
      label: 'في الطريق',
      filter: (item) => item.status === 'in_transit'
    },
    {
      key: 'completed',
      label: 'مكتملة',
      filter: (item) => item.status === 'completed'
    }
  ];

  // Bulk Actions
  const warehouseBulkActions: BulkAction<Warehouse>[] = [
    {
      key: 'delete',
      label: 'حذف المخازن المحددة',
      icon: 'bi-trash',
      variant: 'destructive',
      requiresConfirmation: true,
      action: async (items) => {
        for (const item of items) {
          await deleteWarehouse.mutateAsync(item.id);
        }
      }
    }
  ];

  const transferBulkActions: BulkAction<PartsTransfer>[] = [
    {
      key: 'approve',
      label: 'موافقة على التحويلات',
      icon: 'bi-check-circle',
      action: async (items) => {
        for (const item of items) {
          if (item.status === 'pending') {
            await api.transfers.approve(item.id);
          }
        }
        queryClient.invalidateQueries({ queryKey: ['transfers'] });
      }
    },
    {
      key: 'cancel',
      label: 'إلغاء التحويلات',
      icon: 'bi-x-circle',
      variant: 'destructive',
      requiresConfirmation: true,
      action: async (items) => {
        for (const item of items) {
          await api.transfers.update(item.id, { status: 'cancelled' });
        }
        queryClient.invalidateQueries({ queryKey: ['transfers'] });
      }
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">الإدارة الموحدة</h1>
          <p className="text-muted-foreground">إدارة شاملة للمخازن والمخزون والتحويلات</p>
        </div>
        
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{warehousesQuery.data?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">مخازن</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{inventoryQuery.data?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">مخزون</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">{productsQuery.data?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">منتجات</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">{transfersQuery.data?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">تحويلات</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <QuickStats
            title="الإحصائيات السريعة"
            stats={[
              {
                label: 'مخازن نشطة',
                value: warehousesQuery.data?.length || 0,
                icon: 'bi-building',
                color: 'blue'
              },
              {
                label: 'عناصر نفدت',
                value: inventoryQuery.data?.filter((item: any) => 
                  item.currentQuantity <= (item.minQuantity || 0)
                ).length || 0,
                total: inventoryQuery.data?.length || 0,
                icon: 'bi-exclamation-triangle',
                color: 'red'
              },
              {
                label: 'تحويلات معلقة',
                value: transfersQuery.data?.filter((t: any) => t.status === 'pending').length || 0,
                icon: 'bi-clock',
                color: 'orange'
              }
            ]}
          />
          
          <SystemHealth
            data={{
              warehouses: warehousesQuery.data?.length || 0,
              inventory: inventoryQuery.data?.length || 0,
              lowStock: inventoryQuery.data?.filter((item: any) => 
                item.currentQuantity <= (item.minQuantity || 0)
              ).length || 0,
              pendingTransfers: transfersQuery.data?.filter((t: any) => t.status === 'pending').length || 0,
              completedTransfers: transfersQuery.data?.filter((t: any) => t.status === 'completed').length || 0,
              products: productsQuery.data?.length || 0,
              categories: categoriesQuery.data?.length || 0
            }}
          />
        </div>

        {/* Quick Actions Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <QuickActions
            actions={[
              {
                title: 'إضافة مخزن',
                description: 'إنشاء مخزن جديد',
                icon: 'bi-building-add',
                color: 'blue',
                onClick: handleCreateWarehouse
              },
              {
                title: 'إضافة منتج',
                description: 'منتج أو قطعة غيار',
                icon: 'bi-box-plus',
                color: 'green',
                onClick: handleCreateProduct
              },
              {
                title: 'طلب تحويل',
                description: 'تحويل بين المخازن',
                icon: 'bi-arrow-right-square',
                color: 'orange',
                onClick: handleCreateTransfer,
                count: transfersQuery.data?.filter((t: any) => t.status === 'pending').length || 0
              },
              {
                title: 'إضافة فئة',
                description: 'تصنيف جديد',
                icon: 'bi-tags-fill',
                color: 'purple',
                onClick: handleCreateCategory
              }
            ]}
          />
          
          <RecentActivities
            activities={[]}
            onViewAll={() => console.log('View all activities')}
          />
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="warehouses" className="flex items-center gap-2">
            <i className="bi bi-building"></i>
            المخازن
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <i className="bi bi-box-seam"></i>
            المخزون
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <i className="bi bi-bag"></i>
            المنتجات
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <i className="bi bi-tags"></i>
            الفئات
          </TabsTrigger>
          <TabsTrigger value="transfers" className="flex items-center gap-2">
            <i className="bi bi-arrow-left-right"></i>
            التحويلات
          </TabsTrigger>
        </TabsList>

        {/* Warehouses Tab */}
        <TabsContent value="warehouses">
          <AdvancedDataTable
            data={warehousesQuery.data || []}
            columns={warehouseColumns}
            loading={warehousesQuery.isLoading}
            title="إدارة المخازن"
            selectable={true}
            bulkActions={warehouseBulkActions}
            onEdit={handleEditWarehouse}
            onDelete={handleDeleteWarehouse}
            onCreate={handleCreateWarehouse}
            searchPlaceholder="البحث في المخازن..."
            emptyMessage="لا توجد مخازن مسجلة"
            customActions={
              <Button variant="outline" size="sm">
                <i className="bi bi-download mr-2"></i>
                تصدير
              </Button>
            }
          />
          
          <WarehouseForm
            warehouse={editingItem}
            open={warehouseFormOpen}
            onOpenChange={setWarehouseFormOpen}
            onSubmit={handleWarehouseSubmit}
          />
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory">
          <AdvancedDataTable
            data={inventoryQuery.data || []}
            columns={inventoryColumns}
            loading={inventoryQuery.isLoading}
            title="إدارة المخزون"
            selectable={true}
            quickFilters={inventoryFilters}
            onEdit={(item) => console.log('Edit inventory:', item)}
            onDelete={(item) => console.log('Delete inventory:', item)}
            onCreate={() => console.log('Add inventory')}
            searchPlaceholder="البحث في المخزون..."
            emptyMessage="لا توجد عناصر مخزون"
          />
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products">
          <AdvancedDataTable
            data={productsQuery.data || []}
            columns={[
              { key: 'name', title: 'اسم المنتج', sortable: true, searchable: true },
              { key: 'description', title: 'الوصف' },
              { key: 'model', title: 'الموديل' },
              { key: 'createdAt', title: 'تاريخ الإضافة', render: (value) => new Date(value).toLocaleDateString('ar-SA') }
            ]}
            loading={productsQuery.isLoading}
            title="إدارة المنتجات"
            onEdit={handleEditProduct}
            onDelete={(item) => { setDeletingItem(item); setDeleteConfirmOpen(true); }}
            onCreate={handleCreateProduct}
            searchPlaceholder="البحث في المنتجات..."
            emptyMessage="لا توجد منتجات مسجلة"
          />
          
          <ProductForm
            product={editingItem}
            categories={categoriesQuery.data || []}
            open={productFormOpen}
            onOpenChange={setProductFormOpen}
            onSubmit={handleProductSubmit}
          />
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories">
          <AdvancedDataTable
            data={categoriesQuery.data || []}
            columns={[
              { key: 'name', title: 'اسم الفئة', sortable: true, searchable: true },
              { key: 'description', title: 'الوصف' },
              { key: 'createdAt', title: 'تاريخ الإضافة', render: (value) => new Date(value).toLocaleDateString('ar-SA') }
            ]}
            loading={categoriesQuery.isLoading}
            title="إدارة الفئات"
            onEdit={handleEditCategory}
            onDelete={(item) => { setDeletingItem(item); setDeleteConfirmOpen(true); }}
            onCreate={handleCreateCategory}
            searchPlaceholder="البحث في الفئات..."
            emptyMessage="لا توجد فئات مسجلة"
          />
          
          <CategoryForm
            category={editingItem}
            open={categoryFormOpen}
            onOpenChange={setCategoryFormOpen}
            onSubmit={handleCategorySubmit}
          />
        </TabsContent>

        {/* Transfers Tab */}
        <TabsContent value="transfers">
          <AdvancedDataTable
            data={transfersQuery.data || []}
            columns={transferColumns}
            loading={transfersQuery.isLoading}
            title="إدارة التحويلات"
            selectable={true}
            quickFilters={transferFilters}
            bulkActions={transferBulkActions}
            onEdit={handleEditTransfer}
            onView={handleViewTransfer}
            onCreate={handleCreateTransfer}
            searchPlaceholder="البحث في التحويلات..."
            emptyMessage="لا توجد تحويلات مسجلة"
          />
          
          <TransferForm
            transfer={editingItem}
            warehouses={warehousesQuery.data || []}
            products={productsQuery.data || []}
            open={transferFormOpen}
            onOpenChange={setTransferFormOpen}
            onSubmit={handleTransferSubmit}
          />
        </TabsContent>
      </Tabs>
      
      {/* Global Modals */}
      <TransferDetails
        transfer={viewingTransfer}
        warehouses={warehousesQuery.data || []}
        products={productsQuery.data || []}
        open={transferDetailsOpen}
        onOpenChange={setTransferDetailsOpen}
        onEdit={(transfer) => {
          setEditingItem(transfer);
          setTransferFormOpen(true);
          setTransferDetailsOpen(false);
        }}
        onApprove={handleApproveTransfer}
        onExecute={handleExecuteTransfer}
        userRole="admin" // TODO: Get from auth context
      />
      
      <DeleteConfirmation
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="تأكيد الحذف"
        description={`هل أنت متأكد من حذف "${deletingItem?.name}"؟`}
        itemName={deletingItem?.name}
        onConfirm={confirmDelete}
        loading={deleteWarehouse.isPending}
      />
    </div>
  );
}