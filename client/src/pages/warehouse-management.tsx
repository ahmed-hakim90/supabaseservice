import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost, apiPut, apiDelete } from "../lib/db";
import { useAuth } from "../lib/auth";
import { canCreate, canUpdate, canDelete } from "../lib/permissions";
import type { Warehouse, InsertWarehouse, ProductInventory, InsertProductInventory, Product } from "@shared/schema";
import { Warehouse as WarehouseIcon, Package, Plus, Edit, Trash2, AlertCircle, Search } from "lucide-react";

export default function WarehouseManagement() {
  const [activeTab, setActiveTab] = useState("warehouses");
  const [searchTerm, setSearchTerm] = useState("");
  const [centerFilter, setCenterFilter] = useState("all");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  
  // Warehouse states
  const [isWarehouseDialogOpen, setIsWarehouseDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [warehouseFormData, setWarehouseFormData] = useState<Partial<InsertWarehouse>>({});
  
  // Inventory states
  const [isInventoryDialogOpen, setIsInventoryDialogOpen] = useState(false);
  const [editingInventory, setEditingInventory] = useState<ProductInventory | null>(null);
  const [inventoryFormData, setInventoryFormData] = useState<Partial<InsertProductInventory>>({
    quantity: 0,
    minQuantity: 5
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  // Check permissions
  const canCreateWarehouses = currentUser ? canCreate(currentUser.role, 'warehouses') : false;
  const canUpdateWarehouses = currentUser ? canUpdate(currentUser.role, 'warehouses') : false;
  const canDeleteWarehouses = currentUser ? canDelete(currentUser.role, 'warehouses') : false;
  const canCreateInventory = currentUser ? canCreate(currentUser.role, 'inventory') : false;
  const canUpdateInventory = currentUser ? canUpdate(currentUser.role, 'inventory') : false;
  const canDeleteInventory = currentUser ? canDelete(currentUser.role, 'inventory') : false;

  // Data queries
  const { data: warehouses, isLoading: warehousesLoading } = useQuery({
    queryKey: ['/api/warehouses'],
    queryFn: () => apiGet('/api/warehouses'),
  });

  const { data: users } = useQuery({
    queryKey: ['/api/users'],
    queryFn: () => apiGet('/api/users'),
  });

  const { data: centers } = useQuery({
    queryKey: ['/api/service-centers'],
    queryFn: () => apiGet('/api/service-centers'),
  });

  const { data: products } = useQuery({
    queryKey: ['/api/products'],
    queryFn: () => apiGet('/api/products'),
  });

  const { data: inventory, isLoading: inventoryLoading } = useQuery({
    queryKey: ['/api/product-inventory', selectedWarehouse],
    queryFn: () => selectedWarehouse ? apiGet(`/api/product-inventory/${selectedWarehouse}`) : Promise.resolve([]),
    enabled: !!selectedWarehouse,
  });

  // Set first warehouse as default when warehouses load
  useEffect(() => {
    if (warehouses && warehouses.length > 0 && !selectedWarehouse) {
      setSelectedWarehouse(warehouses[0].id);
    }
  }, [warehouses, selectedWarehouse]);

  // Warehouse mutations
  const createWarehouseMutation = useMutation({
    mutationFn: (data: InsertWarehouse) => apiPost('/api/warehouses', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/warehouses'] });
      setIsWarehouseDialogOpen(false);
      setWarehouseFormData({});
      toast({ title: "تم إضافة المخزن بنجاح" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "فشل في إضافة المخزن" });
    },
  });

  const updateWarehouseMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Warehouse> }) =>
      apiPut(`/api/warehouses/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/warehouses'] });
      setEditingWarehouse(null);
      setWarehouseFormData({});
      toast({ title: "تم تحديث المخزن بنجاح" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "فشل في تحديث المخزن" });
    },
  });

  const deleteWarehouseMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/warehouses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/warehouses'] });
      toast({ title: "تم حذف المخزن بنجاح" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "فشل في حذف المخزن" });
    },
  });

  // Inventory mutations
  const createInventoryMutation = useMutation({
    mutationFn: (data: InsertProductInventory) => apiPost('/api/product-inventory', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/product-inventory', selectedWarehouse] });
      setIsInventoryDialogOpen(false);
      setInventoryFormData({ quantity: 0, minQuantity: 5 });
      toast({ title: "تم إضافة المنتج للمخزون بنجاح" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "فشل في إضافة المنتج للمخزون" });
    },
  });

  const updateInventoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductInventory> }) =>
      apiPut(`/api/product-inventory/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/product-inventory', selectedWarehouse] });
      setEditingInventory(null);
      setInventoryFormData({ quantity: 0, minQuantity: 5 });
      toast({ title: "تم تحديث المخزون بنجاح" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "فشل في تحديث المخزون" });
    },
  });

  const deleteInventoryMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/product-inventory/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/product-inventory', selectedWarehouse] });
      toast({ title: "تم حذف المنتج من المخزون بنجاح" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "فشل في حذف المنتج من المخزون" });
    },
  });

  // Handle form submissions
  const handleWarehouseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouseFormData.name || !warehouseFormData.location) return;

    if (editingWarehouse) {
      updateWarehouseMutation.mutate({
        id: editingWarehouse.id,
        data: warehouseFormData
      });
    } else {
      createWarehouseMutation.mutate(warehouseFormData as InsertWarehouse);
    }
  };

  const handleInventorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inventoryFormData.productId || !selectedWarehouse) return;

    const data = {
      ...inventoryFormData,
      warehouseId: selectedWarehouse
    };

    if (editingInventory) {
      updateInventoryMutation.mutate({
        id: editingInventory.id,
        data: inventoryFormData
      });
    } else {
      createInventoryMutation.mutate(data as InsertProductInventory);
    }
  };

  // Filter functions
  const filteredWarehouses = warehouses?.filter((warehouse: Warehouse) => {
    const matchesSearch = warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         warehouse.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCenter = centerFilter === "all" || warehouse.centerId === centerFilter;
    return matchesSearch && matchesCenter;
  });

  const warehouseUsers = users?.filter((user: any) => user.role === 'warehouse_manager');
  const selectedWarehouseData = warehouses?.find((w: Warehouse) => w.id === selectedWarehouse);

  if (warehousesLoading) {
    return <div className="flex justify-center items-center min-h-screen">جارٍ التحميل...</div>;
  }

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">إدارة المخازن والمخزون</h1>
        <p className="text-muted-foreground">إدارة المخازن ومتابعة المخزون في كل مخزن</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="warehouses" className="flex items-center gap-2">
            <WarehouseIcon className="w-4 h-4" />
            المخازن
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            المخزون
          </TabsTrigger>
        </TabsList>

        {/* Warehouses Tab */}
        <TabsContent value="warehouses" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <div className="relative w-64">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث في المخازن..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Select value={centerFilter} onValueChange={setCenterFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="تصفية بالمركز" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المراكز</SelectItem>
                  {centers?.map((center: any) => (
                    <SelectItem key={center.id} value={center.id}>
                      {center.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {canCreateWarehouses && (
              <Dialog open={isWarehouseDialogOpen} onOpenChange={setIsWarehouseDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    إضافة مخزن جديد
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md" dir="rtl">
                  <DialogHeader>
                    <DialogTitle>{editingWarehouse ? 'تعديل المخزن' : 'إضافة مخزن جديد'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleWarehouseSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="warehouseName">اسم المخزن</Label>
                      <Input
                        id="warehouseName"
                        required
                        value={warehouseFormData.name || ""}
                        onChange={(e) => setWarehouseFormData({ ...warehouseFormData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="warehouseLocation">الموقع</Label>
                      <Input
                        id="warehouseLocation"
                        required
                        value={warehouseFormData.location || ""}
                        onChange={(e) => setWarehouseFormData({ ...warehouseFormData, location: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="warehouseManager">مدير المخزن</Label>
                      <Select
                        value={warehouseFormData.managerId || "none"}
                        onValueChange={(value) => setWarehouseFormData({ 
                          ...warehouseFormData, 
                          managerId: value === "none" ? undefined : value 
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر مدير المخزن" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">بدون مدير</SelectItem>
                          {warehouseUsers?.map((user: any) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="warehouseCenter">مركز الخدمة</Label>
                      <Select
                        value={warehouseFormData.centerId || "none"}
                        onValueChange={(value) => setWarehouseFormData({ 
                          ...warehouseFormData, 
                          centerId: value === "none" ? undefined : value 
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر مركز الخدمة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">بدون مركز</SelectItem>
                          {centers?.map((center: any) => (
                            <SelectItem key={center.id} value={center.id}>
                              {center.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => {
                        setIsWarehouseDialogOpen(false);
                        setEditingWarehouse(null);
                        setWarehouseFormData({});
                      }}>
                        إلغاء
                      </Button>
                      <Button type="submit">
                        {editingWarehouse ? 'تحديث' : 'إضافة'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredWarehouses?.map((warehouse: Warehouse) => (
              <Card key={warehouse.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{warehouse.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{warehouse.location}</p>
                      {warehouse.centerId && (
                        <Badge variant="outline" className="mt-2">
                          {centers?.find((c: any) => c.id === warehouse.centerId)?.name}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {canUpdateWarehouses && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingWarehouse(warehouse);
                            setWarehouseFormData(warehouse);
                            setIsWarehouseDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {canDeleteWarehouses && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteWarehouseMutation.mutate(warehouse.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {warehouse.managerId && (
                    <div className="text-sm text-muted-foreground">
                      <p>المدير: {users?.find((u: any) => u.id === warehouse.managerId)?.fullName}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-4 items-center">
              <div className="space-y-2">
                <Label>المخزن:</Label>
                <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="اختر المخزن" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses?.map((warehouse: Warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} - {warehouse.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {selectedWarehouse && canCreateInventory && (
              <Dialog open={isInventoryDialogOpen} onOpenChange={setIsInventoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    إضافة منتج للمخزون
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md" dir="rtl">
                  <DialogHeader>
                    <DialogTitle>{editingInventory ? 'تعديل المخزون' : 'إضافة منتج للمخزون'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleInventorySubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="inventoryProduct">المنتج</Label>
                      <Select
                        value={inventoryFormData.productId || ""}
                        onValueChange={(value) => setInventoryFormData({ ...inventoryFormData, productId: value })}
                        disabled={!!editingInventory}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المنتج" />
                        </SelectTrigger>
                        <SelectContent>
                          {products?.map((product: Product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quantity">الكمية</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="0"
                        required
                        value={inventoryFormData.quantity || 0}
                        onChange={(e) => setInventoryFormData({ 
                          ...inventoryFormData, 
                          quantity: parseInt(e.target.value) || 0 
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minQuantity">الحد الأدنى</Label>
                      <Input
                        id="minQuantity"
                        type="number"
                        min="0"
                        value={inventoryFormData.minQuantity || 5}
                        onChange={(e) => setInventoryFormData({ 
                          ...inventoryFormData, 
                          minQuantity: parseInt(e.target.value) || 5 
                        })}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => {
                        setIsInventoryDialogOpen(false);
                        setEditingInventory(null);
                        setInventoryFormData({ quantity: 0, minQuantity: 5 });
                      }}>
                        إلغاء
                      </Button>
                      <Button type="submit">
                        {editingInventory ? 'تحديث' : 'إضافة'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {selectedWarehouse && (
            <div className="mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    مخزون: {selectedWarehouseData?.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{selectedWarehouseData?.location}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {inventoryLoading ? (
            <div className="text-center py-8">جارٍ تحميل المخزون...</div>
          ) : selectedWarehouse ? (
            inventory?.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">لا يوجد منتجات في هذا المخزن</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {inventory?.map((item: ProductInventory) => {
                  const product = products?.find((p: Product) => p.id === item.productId);
                  const isLowStock = item.quantity <= (item.minQuantity || 5);
                  
                  return (
                    <Card key={item.id} className={`hover:shadow-md transition-shadow ${isLowStock ? 'border-destructive' : ''}`}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{product?.name}</CardTitle>
                            <div className="flex gap-2 mt-2">
                              <Badge variant={isLowStock ? "destructive" : "default"}>
                                الكمية: {item.quantity}
                              </Badge>
                              <Badge variant="outline">
                                الحد الأدنى: {item.minQuantity}
                              </Badge>
                            </div>
                            {isLowStock && (
                              <div className="flex items-center gap-1 mt-2 text-destructive">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-sm">كمية منخفضة!</span>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1">
                            {canUpdateInventory && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingInventory(item);
                                  setInventoryFormData({
                                    productId: item.productId,
                                    quantity: item.quantity,
                                    minQuantity: item.minQuantity
                                  });
                                  setIsInventoryDialogOpen(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                            {canDeleteInventory && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteInventoryMutation.mutate(item.id)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            )
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <WarehouseIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">اختر مخزن لعرض محتوياته</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}