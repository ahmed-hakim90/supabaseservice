import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost, apiPut, apiDelete } from "../lib/db";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Transfer {
  id: string;
  transferNumber: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  sparePartId: string;
  quantity: number;
  reason: string;
  status: "pending" | "approved" | "rejected" | "completed";
  requestedBy: string;
  approvedBy?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  fromWarehouse?: {
    id: string;
    name: string;
    centerId: string;
  };
  toWarehouse?: {
    id: string;
    name: string;
    centerId: string;
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

interface InsertTransfer {
  fromWarehouseId: string;
  toWarehouseId: string;
  sparePartId: string;
  quantity: number;
  reason: string;
  notes?: string;
}

interface SparePart {
  id: string;
  name: string;
  partNumber: string;
  description?: string;
  categoryId: string;
  minQuantity: number;
  currentQuantity: number;
  unitPrice: number;
}

interface Warehouse {
  id: string;
  name: string;
  location: string;
  managerId: string;
  centerId: string;
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  completed: "bg-green-100 text-green-800"
};

const statusLabels = {
  pending: "في الانتظار",
  approved: "موافق عليه",
  rejected: "مرفوض",
  completed: "مكتمل"
};

export default function Transfers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<Transfer | null>(null);
  const [formData, setFormData] = useState<Partial<InsertTransfer>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch transfers data
  const { data: transfers = [] } = useQuery({
    queryKey: ["parts-transfers"],
    queryFn: async () => {
      const data = await apiGet("/api/parts-transfers");
      return data.map((transfer: any) => ({
        ...transfer,
        createdAt: new Date(transfer.createdAt),
        updatedAt: new Date(transfer.updatedAt),
      }));
    },
  });

  // Fetch spare parts data
  const { data: spareParts = [] } = useQuery({
    queryKey: ["spare-parts"],
    queryFn: async () => await apiGet("/api/spare-parts"),
  });

  // Fetch warehouses data
  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => await apiGet("/api/warehouses"),
  });

  const createTransferMutation = useMutation({
    mutationFn: async (data: InsertTransfer) => {
      return await apiPost("/api/parts-transfers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parts-transfers"] });
      setIsAddDialogOpen(false);
      setFormData({});
      toast({ title: "تم إنشاء طلب التحويل بنجاح" });
    },
    onError: (error: any) => {
      toast({ 
        title: "خطأ في إنشاء طلب التحويل", 
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const updateTransferMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Transfer> }) => {
      return await apiPut(`/api/parts-transfers/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parts-transfers"] });
      setEditingTransfer(null);
      setFormData({});
      toast({ title: "تم تحديث طلب التحويل بنجاح" });
    },
    onError: (error: any) => {
      toast({ 
        title: "خطأ في تحديث طلب التحويل", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const deleteTransferMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiDelete(`/api/parts-transfers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parts-transfers"] });
      toast({ title: "تم حذف طلب التحويل بنجاح" });
    },
    onError: (error: any) => {
      toast({ 
        title: "خطأ في حذف طلب التحويل", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fromWarehouseId || !formData.toWarehouseId || !formData.sparePartId || !formData.quantity || !formData.reason) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    if (formData.fromWarehouseId === formData.toWarehouseId) {
      toast({
        title: "خطأ في البيانات",
        description: "لا يمكن أن يكون المخزن المرسل والمستقبل نفس المخزن",
        variant: "destructive"
      });
      return;
    }

    if (editingTransfer) {
      updateTransferMutation.mutate({ 
        id: editingTransfer.id, 
        data: formData as Partial<Transfer>
      });
    } else {
      createTransferMutation.mutate(formData as InsertTransfer);
    }
  };

  const handleStatusChange = (transferId: string, newStatus: string) => {
    updateTransferMutation.mutate({
      id: transferId,
      data: { status: newStatus as Transfer["status"] }
    });
  };

  const filteredTransfers = transfers.filter((transfer: Transfer) => {
    const matchesSearch = 
      transfer.transferNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.sparePart?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.requester?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || transfer.status === statusFilter;

    const matchesWarehouse = warehouseFilter === "all" || 
      transfer.fromWarehouseId === warehouseFilter || 
      transfer.toWarehouseId === warehouseFilter;

    return matchesSearch && matchesStatus && matchesWarehouse;
  });

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">تحويلات قطع الغيار</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingTransfer(null);
              setFormData({});
            }}>
              إضافة طلب تحويل جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle>
                {editingTransfer ? "تحديث طلب التحويل" : "إضافة طلب تحويل جديد"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fromWarehouse">من مخزن</Label>
                  <Select 
                    value={formData.fromWarehouseId || ""} 
                    onValueChange={(value) => setFormData({...formData, fromWarehouseId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المخزن المرسل" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse: Warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="toWarehouse">إلى مخزن</Label>
                  <Select 
                    value={formData.toWarehouseId || ""} 
                    onValueChange={(value) => setFormData({...formData, toWarehouseId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المخزن المستقبل" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse: Warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sparePart">قطعة الغيار</Label>
                  <Select 
                    value={formData.sparePartId || ""} 
                    onValueChange={(value) => setFormData({...formData, sparePartId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر قطعة الغيار" />
                    </SelectTrigger>
                    <SelectContent>
                      {spareParts.map((part: SparePart) => (
                        <SelectItem key={part.id} value={part.id}>
                          {part.name} - {part.partNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">الكمية</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.quantity || ""}
                    onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                    placeholder="أدخل الكمية"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">سبب التحويل</Label>
                <Input
                  value={formData.reason || ""}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  placeholder="أدخل سبب التحويل"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">ملاحظات</Label>
                <Textarea
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="ملاحظات إضافية (اختياري)"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">
                  {editingTransfer ? "تحديث" : "إنشاء"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex gap-4 items-center">
        <Input
          placeholder="البحث في طلبات التحويل..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="تصفية بالحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="pending">في الانتظار</SelectItem>
            <SelectItem value="approved">موافق عليه</SelectItem>
            <SelectItem value="rejected">مرفوض</SelectItem>
            <SelectItem value="completed">مكتمل</SelectItem>
          </SelectContent>
        </Select>
        <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="تصفية بالمخزن" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع المخازن</SelectItem>
            {warehouses.map((warehouse: Warehouse) => (
              <SelectItem key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Transfers List */}
      <div className="grid gap-4">
        {filteredTransfers.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">لا توجد طلبات تحويل</p>
            </CardContent>
          </Card>
        ) : (
          filteredTransfers.map((transfer: Transfer) => (
            <Card key={transfer.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      طلب تحويل #{transfer.transferNumber}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge 
                        variant="secondary" 
                        className={statusColors[transfer.status]}
                      >
                        {statusLabels[transfer.status]}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {transfer.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleStatusChange(transfer.id, "approved")}
                        >
                          موافق
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleStatusChange(transfer.id, "rejected")}
                        >
                          رفض
                        </Button>
                      </>
                    )}
                    {transfer.status === "approved" && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(transfer.id, "completed")}
                      >
                        تم التسليم
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingTransfer(transfer);
                        setFormData({
                          fromWarehouseId: transfer.fromWarehouseId,
                          toWarehouseId: transfer.toWarehouseId,
                          sparePartId: transfer.sparePartId,
                          quantity: transfer.quantity,
                          reason: transfer.reason,
                          notes: transfer.notes
                        });
                        setIsAddDialogOpen(true);
                      }}
                    >
                      تعديل
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (confirm("هل أنت متأكد من حذف هذا الطلب؟")) {
                          deleteTransferMutation.mutate(transfer.id);
                        }
                      }}
                    >
                      حذف
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground">من مخزن</p>
                    <p>{transfer.fromWarehouse?.name || "غير محدد"}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">إلى مخزن</p>
                    <p>{transfer.toWarehouse?.name || "غير محدد"}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">قطعة الغيار</p>
                    <p>{transfer.sparePart?.name || "غير محدد"}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">الكمية</p>
                    <p>{transfer.quantity}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">السبب</p>
                    <p>{transfer.reason}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">طالب التحويل</p>
                    <p>{transfer.requester?.fullName || "غير محدد"}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">تاريخ الطلب</p>
                    <p>{format(transfer.createdAt, "dd/MM/yyyy", { locale: ar })}</p>
                  </div>
                  {transfer.notes && (
                    <div className="col-span-2 md:col-span-4">
                      <p className="font-medium text-muted-foreground">ملاحظات</p>
                      <p>{transfer.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}