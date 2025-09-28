import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PartsTransfer, Warehouse, Product } from '../../../../shared/schema';

interface TransferDetailsProps {
  transfer: PartsTransfer | null;
  warehouses: Warehouse[];
  products: Product[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (transfer: PartsTransfer) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onExecute?: (id: string) => void;
  userRole?: string;
}

export function TransferDetails({
  transfer,
  warehouses,
  products,
  open,
  onOpenChange,
  onEdit,
  onApprove,
  onReject,
  onExecute,
  userRole = 'user'
}: TransferDetailsProps) {
  if (!transfer) return null;

  const fromWarehouse = warehouses.find(w => w.id === transfer.fromWarehouseId);
  const toWarehouse = warehouses.find(w => w.id === transfer.toWarehouseId);
  const product = products.find(p => p.id === transfer.sparePartId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'approved': return 'default';
      case 'in_transit': return 'outline';
      case 'completed': return 'default';
      case 'cancelled': return 'destructive';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'في الانتظار';
      case 'approved': return 'موافق عليه';
      case 'in_transit': return 'في الطريق';
      case 'completed': return 'مكتمل';
      case 'cancelled': return 'ملغي';
      case 'rejected': return 'مرفوض';
      default: return status;
    }
  };

  const canApprove = userRole === 'admin' || (userRole === 'manager' && transfer.status === 'pending');
  const canExecute = userRole === 'admin' || (userRole === 'warehouse_manager' && transfer.status === 'approved');
  const canEdit = userRole === 'admin' || transfer.status === 'pending';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>تفاصيل طلب التحويل</span>
            <Badge variant={getStatusColor(transfer.status)}>
              {getStatusLabel(transfer.status)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Transfer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">معلومات التحويل</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">رقم التحويل</label>
                  <p className="font-mono bg-muted px-3 py-2 rounded text-sm">
                    {transfer.transferNumber}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">تاريخ الإنشاء</label>
                  <p className="px-3 py-2">
                    {new Date(transfer.createdAt!).toLocaleDateString('ar-SA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">من مخزن</label>
                  <p className="px-3 py-2 bg-blue-50 rounded">
                    <i className="bi bi-box-arrow-right text-blue-600 mr-2"></i>
                    {fromWarehouse?.name || 'غير محدد'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">إلى مخزن</label>
                  <p className="px-3 py-2 bg-green-50 rounded">
                    <i className="bi bi-box-arrow-in-right text-green-600 mr-2"></i>
                    {toWarehouse?.name || 'غير محدد'}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">قطعة الغيار</label>
                  <p className="px-3 py-2 bg-orange-50 rounded">
                    <i className="bi bi-gear text-orange-600 mr-2"></i>
                    {product?.name || 'غير محدد'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">الكمية</label>
                  <p className="px-3 py-2 bg-purple-50 rounded font-bold text-lg">
                    {transfer.quantity}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reason and Notes */}
          {(transfer.reason || transfer.notes) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">تفاصيل إضافية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {transfer.reason && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">سبب التحويل</label>
                    <p className="px-3 py-2 bg-muted/50 rounded">{transfer.reason}</p>
                  </div>
                )}
                {transfer.notes && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">ملاحظات</label>
                    <p className="px-3 py-2 bg-muted/50 rounded">{transfer.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">التسلسل الزمني</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mt-1.5"></div>
                  <div>
                    <p className="font-medium">تم إنشاء الطلب</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(transfer.createdAt!).toLocaleDateString('ar-SA')} - 
                      {new Date(transfer.createdAt!).toLocaleTimeString('ar-SA')}
                    </p>
                  </div>
                </div>

                {transfer.approvedAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5"></div>
                    <div>
                      <p className="font-medium">تمت الموافقة</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transfer.approvedAt).toLocaleDateString('ar-SA')} - 
                        {new Date(transfer.approvedAt).toLocaleTimeString('ar-SA')}
                      </p>
                    </div>
                  </div>
                )}

                {transfer.completedAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mt-1.5"></div>
                    <div>
                      <p className="font-medium">تم التنفيذ</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transfer.completedAt).toLocaleDateString('ar-SA')} - 
                        {new Date(transfer.completedAt).toLocaleTimeString('ar-SA')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2 justify-end border-t pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              إغلاق
            </Button>
            
            {canEdit && onEdit && (
              <Button variant="outline" onClick={() => onEdit(transfer)}>
                <i className="bi bi-pencil mr-2"></i>
                تعديل
              </Button>
            )}
            
            {canApprove && onApprove && transfer.status === 'pending' && (
              <>
                <Button variant="destructive" onClick={() => onReject?.(transfer.id)}>
                  <i className="bi bi-x-circle mr-2"></i>
                  رفض
                </Button>
                <Button onClick={() => onApprove(transfer.id)}>
                  <i className="bi bi-check-circle mr-2"></i>
                  موافقة
                </Button>
              </>
            )}
            
            {canExecute && onExecute && transfer.status === 'approved' && (
              <Button onClick={() => onExecute(transfer.id)} className="bg-green-600 hover:bg-green-700">
                <i className="bi bi-arrow-right-circle mr-2"></i>
                تنفيذ التحويل
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}