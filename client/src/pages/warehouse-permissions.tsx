import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye, Edit2, Trash2, MoreHorizontal, Check, X, Play, PackagePlus, PackageMinus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hasPermission } from '@/lib/permissions';
import { useAuth } from '@/lib/auth';
import DataTable from '@/components/ui/data-table';

// Types
interface WarehousePermission {
  id: string;
  permissionNumber: string;
  type: 'addition' | 'withdrawal';
  warehouseId: string;
  sparePartId: string;
  quantity: number;
  reason: string;
  requestedBy: string;
  approvedBy?: string;
  executedBy?: string;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  notes?: string;
  createdAt: string;
  approvedAt?: string;
  executedAt?: string;
  warehouse?: {
    id: string;
    name: string;
  };
  sparePart?: {
    id: string;
    name: string;
    partNumber: string;
  };
  requester?: {
    id: string;
    fullName: string;
  };
}

interface WarehousePermissionFormData {
  type: 'addition' | 'withdrawal';
  warehouseId: string;
  sparePartId: string;
  quantity: number;
  reason: string;
  notes?: string;
}

// Status Badge Component
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusConfig = {
    pending: { 
      label: 'في الانتظار', 
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
    },
    approved: { 
      label: 'موافق عليه', 
      className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
    },
    rejected: { 
      label: 'مرفوض', 
      className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
    },
    executed: { 
      label: 'منفذ', 
      className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
    }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  
  return (
    <Badge variant="outline" className={`${config.className} font-medium`}>
      {config.label}
    </Badge>
  );
};

// Type Badge Component
const TypeBadge: React.FC<{ type: string }> = ({ type }) => {
  const typeConfig = {
    addition: { 
      label: 'إضافة', 
      icon: PackagePlus,
      className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
    },
    withdrawal: { 
      label: 'صرف', 
      icon: PackageMinus,
      className: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800'
    }
  };

  const config = typeConfig[type as keyof typeof typeConfig];
  const IconComponent = config?.icon;
  
  return (
    <Badge variant="outline" className={`${config?.className || ''} font-medium flex items-center gap-1`}>
      {IconComponent && <IconComponent className="h-3 w-3" />}
      {config?.label || type}
    </Badge>
  );
};

export default function WarehousePermissionsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // State
  const [editingPermission, setEditingPermission] = useState<WarehousePermission | null>(null);
  const [deletingPermission, setDeletingPermission] = useState<WarehousePermission | null>(null);
  const [viewingPermission, setViewingPermission] = useState<WarehousePermission | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);

  const [formData, setFormData] = useState<WarehousePermissionFormData>({
    type: 'addition',
    warehouseId: '',
    sparePartId: '',
    quantity: 1,
    reason: '',
    notes: ''
  });

  // Permissions
  const canViewPermissions = user?.role ? hasPermission(user.role, 'warehousePermissions', 'read') : false;
  const canCreatePermissions = user?.role ? hasPermission(user.role, 'warehousePermissions', 'create') : false;
  const canUpdatePermissions = user?.role ? hasPermission(user.role, 'warehousePermissions', 'update') : false;
  const canDeletePermissions = user?.role ? hasPermission(user.role, 'warehousePermissions', 'delete') : false;

  // Data fetching
  const { data: permissions = [], isLoading, error } = useQuery({
    queryKey: ['warehousePermissions'],
    queryFn: async () => {
      const response = await fetch('/api/warehouse-permissions', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch permissions');
      return response.json();
    },
    enabled: canViewPermissions
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const response = await fetch('/api/warehouses', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch warehouses');
      return response.json();
    }
  });

  const { data: spareParts = [] } = useQuery({
    queryKey: ['spareParts'],
    queryFn: async () => {
      const response = await fetch('/api/spare-parts', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch spare parts');
      return response.json();
    }
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: WarehousePermissionFormData) => {
      const response = await fetch('/api/warehouse-permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create permission');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehousePermissions'] });
      toast({ title: 'تم إنشاء الإذن بنجاح' });
      setIsFormDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({ 
        title: 'خطأ في إنشاء الإذن', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/warehouse-permissions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update permission');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehousePermissions'] });
      toast({ title: 'تم تحديث الإذن بنجاح' });
    },
    onError: (error) => {
      toast({ 
        title: 'خطأ في تحديث الإذن', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/warehouse-permissions/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete permission');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehousePermissions'] });
      toast({ title: 'تم حذف الإذن بنجاح' });
      setDeletingPermission(null);
    },
    onError: (error) => {
      toast({ 
        title: 'خطأ في حذف الإذن', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  // Event handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleDelete = () => {
    if (deletingPermission) {
      deleteMutation.mutate(deletingPermission.id);
    }
  };

  const handleStatusChange = (permission: WarehousePermission, status: string) => {
    updateMutation.mutate({
      id: permission.id,
      data: { status }
    });
  };

  const resetForm = () => {
    setFormData({
      type: 'addition',
      warehouseId: '',
      sparePartId: '',
      quantity: 1,
      reason: '',
      notes: ''
    });
    setEditingPermission(null);
  };

  // Column definitions for DataTable
  const columns = [
    {
      key: "permissionNumber",
      header: "رقم الإذن",
      render: (permission: WarehousePermission) => (
        <div className="font-medium text-primary">
          {permission.permissionNumber}
        </div>
      ),
      sortable: true,
      searchable: true
    },
    {
      key: "type",
      header: "نوع العملية",
      render: (permission: WarehousePermission) => (
        <TypeBadge type={permission.type} />
      ),
      sortable: true
    },
    {
      key: "warehouse",
      header: "المخزن",
      render: (permission: WarehousePermission) => (
        <div>{permission.warehouse?.name || '-'}</div>
      ),
      sortable: true
    },
    {
      key: "sparePart",
      header: "قطعة الغيار",
      render: (permission: WarehousePermission) => (
        <div>
          <div className="font-medium">{permission.sparePart?.name || '-'}</div>
          {permission.sparePart?.partNumber && (
            <div className="text-sm text-muted-foreground">{permission.sparePart.partNumber}</div>
          )}
        </div>
      ),
      sortable: true,
      searchable: true
    },
    {
      key: "quantity",
      header: "الكمية",
      render: (permission: WarehousePermission) => (
        <div className="font-medium">{permission.quantity}</div>
      ),
      sortable: true
    },
    {
      key: "status",
      header: "الحالة",
      render: (permission: WarehousePermission) => (
        <StatusBadge status={permission.status} />
      ),
      sortable: true
    },
    {
      key: "requester",
      header: "طلب بواسطة",
      render: (permission: WarehousePermission) => (
        <div>{permission.requester?.fullName || '-'}</div>
      ),
      sortable: true
    },
    {
      key: "createdAt",
      header: "تاريخ الطلب",
      render: (permission: WarehousePermission) => {
        return permission.createdAt ? new Date(permission.createdAt).toLocaleDateString('ar-SA') : '-';
      },
      sortable: true
    },
    {
      key: "actions",
      header: "الإجراءات",
      render: (permission: WarehousePermission) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                setViewingPermission(permission);
                setIsViewDialogOpen(true);
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              عرض التفاصيل
            </DropdownMenuItem>

            {canUpdatePermissions && permission.status === 'pending' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleStatusChange(permission, 'approved')}
                  className="text-blue-600"
                >
                  <Check className="mr-2 h-4 w-4" />
                  موافقة
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleStatusChange(permission, 'rejected')}
                  className="text-red-600"
                >
                  <X className="mr-2 h-4 w-4" />
                  رفض
                </DropdownMenuItem>
              </>
            )}

            {canUpdatePermissions && permission.status === 'approved' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleStatusChange(permission, 'executed')}
                  className="text-green-600"
                >
                  <Play className="mr-2 h-4 w-4" />
                  تنفيذ
                </DropdownMenuItem>
              </>
            )}

            {canDeletePermissions && permission.status === 'pending' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeletingPermission(permission)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  حذف
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (!canViewPermissions) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">ليس لديك صلاحية لعرض أذونات المخزن</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">خطأ في جلب البيانات</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">أذونات المخزن</h1>
          <p className="text-muted-foreground">
            إدارة أذونات الإضافة والصرف للمخازن
          </p>
        </div>

        {canCreatePermissions && (
          <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                إذن جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>إنشاء إذن جديد</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="type">نوع العملية</Label>
                  <Select value={formData.type} onValueChange={(value: 'addition' | 'withdrawal') => 
                    setFormData({ ...formData, type: value })
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="addition">إضافة للمخزن</SelectItem>
                      <SelectItem value="withdrawal">صرف من المخزن</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="warehouseId">المخزن</Label>
                  <Select value={formData.warehouseId} onValueChange={(value) => 
                    setFormData({ ...formData, warehouseId: value })
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المخزن" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse: any) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sparePartId">قطعة الغيار</Label>
                  <Select value={formData.sparePartId} onValueChange={(value) => 
                    setFormData({ ...formData, sparePartId: value })
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر قطعة الغيار" />
                    </SelectTrigger>
                    <SelectContent>
                      {spareParts.map((part: any) => (
                        <SelectItem key={part.id} value={part.id}>
                          {part.name} ({part.partNumber})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="quantity">الكمية</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="reason">سبب الطلب</Label>
                  <Textarea
                    id="reason"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="اذكر سبب طلب الإذن..."
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="notes">ملاحظات إضافية</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="ملاحظات اختيارية..."
                  />
                </div>

                <div className="flex justify-end space-x-2 space-x-reverse">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsFormDialogOpen(false);
                      resetForm();
                    }}
                  >
                    إلغاء
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء الإذن'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الأذونات</CardTitle>
          <CardDescription>
            جميع أذونات الإضافة والصرف للمخازن
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={permissions}
            columns={columns}
            loading={isLoading}
            searchPlaceholder="البحث في الأذونات..."
          />
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تفاصيل الإذن #{viewingPermission?.permissionNumber}</DialogTitle>
          </DialogHeader>
          
          {viewingPermission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">نوع العملية</Label>
                  <div className="mt-1">
                    <TypeBadge type={viewingPermission.type} />
                  </div>
                </div>
                <div>
                  <Label className="font-semibold">الحالة</Label>
                  <div className="mt-1">
                    <StatusBadge status={viewingPermission.status} />
                  </div>
                </div>
                <div>
                  <Label className="font-semibold">المخزن</Label>
                  <p>{viewingPermission.warehouse?.name}</p>
                </div>
                <div>
                  <Label className="font-semibold">قطعة الغيار</Label>
                  <p>{viewingPermission.sparePart?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {viewingPermission.sparePart?.partNumber}
                  </p>
                </div>
                <div>
                  <Label className="font-semibold">الكمية</Label>
                  <p>{viewingPermission.quantity}</p>
                </div>
                <div>
                  <Label className="font-semibold">طالب الإذن</Label>
                  <p>{viewingPermission.requester?.fullName}</p>
                </div>
              </div>

              <div>
                <Label className="font-semibold">سبب الطلب</Label>
                <p className="mt-1">{viewingPermission.reason}</p>
              </div>

              {viewingPermission.notes && (
                <div>
                  <Label className="font-semibold">ملاحظات</Label>
                  <p className="mt-1">{viewingPermission.notes}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <Label className="font-semibold">تاريخ الطلب</Label>
                  <p>{new Date(viewingPermission.createdAt).toLocaleString('ar-SA')}</p>
                </div>
                {viewingPermission.approvedAt && (
                  <div>
                    <Label className="font-semibold">تاريخ الموافقة</Label>
                    <p>{new Date(viewingPermission.approvedAt).toLocaleString('ar-SA')}</p>
                  </div>
                )}
                {viewingPermission.executedAt && (
                  <div>
                    <Label className="font-semibold">تاريخ التنفيذ</Label>
                    <p>{new Date(viewingPermission.executedAt).toLocaleString('ar-SA')}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingPermission} onOpenChange={() => setDeletingPermission(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف الإذن رقم "{deletingPermission?.permissionNumber}"؟
              هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="space-x-2 space-x-reverse">
            <AlertDialogCancel onClick={() => setDeletingPermission(null)}>
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}