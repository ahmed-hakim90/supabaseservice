import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { canCreate, canUpdate } from "@/lib/permissions";
import { apiGet, apiPost } from "../lib/db";
import type { User } from "@shared/schema";

export default function UserApprovals() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [approvalData, setApprovalData] = useState({
    role: "",
    centerId: "none",
    warehouseId: "none",
    notes: ""
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  // Check permissions
  const canApproveUsers = currentUser ? canCreate(currentUser.role, 'users') : false;

  const { data: pendingUsers, isLoading } = useQuery({
    queryKey: ['pending-users'],
    queryFn: () => apiGet('/api/pending-users'),
    enabled: canApproveUsers
  });

  const { data: centers } = useQuery({
    queryKey: ['/api/service-centers'],
    queryFn: () => apiGet('/api/service-centers'),
  });

  const { data: warehouses } = useQuery({
    queryKey: ['/api/warehouses'],
    queryFn: () => apiGet('/api/warehouses'),
  });

  const approveUserMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: any }) =>
      apiPost(`/api/approve-user/${userId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
      setIsApprovalDialogOpen(false);
      setSelectedUser(null);
      setApprovalData({ role: "", centerId: "none", warehouseId: "none", notes: "" });
      toast({ title: "تمت الموافقة على المستخدم بنجاح" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "فشل في الموافقة على المستخدم" });
    },
  });

  const handleApproveUser = () => {
    if (!selectedUser) return;

    // Convert "none" values back to null for the API
    const submitData = {
      ...approvalData,
      centerId: approvalData.centerId === "none" ? null : approvalData.centerId,
      warehouseId: approvalData.warehouseId === "none" ? null : approvalData.warehouseId,
    };

    approveUserMutation.mutate({
      userId: selectedUser.id,
      data: submitData
    });
  };

  if (!canApproveUsers) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-red-600 mb-2">غير مصرح</h2>
              <p className="text-gray-600">ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">إدارة المستخدمين المعلقين</h1>
        <p className="text-gray-600 mt-2">مراجعة واعتماد المستخدمين الجدد</p>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          <div className="text-center py-8">جاري تحميل البيانات...</div>
        ) : pendingUsers?.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-gray-600">لا توجد طلبات موافقة معلقة</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          pendingUsers?.map((pendingUser: User) => (
            <Card key={pendingUser.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{pendingUser.fullName}</CardTitle>
                    <p className="text-sm text-gray-600">{pendingUser.email}</p>
                    <p className="text-sm text-gray-600">{pendingUser.phone}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary">معلق</Badge>
                    <Button
                      onClick={() => {
                        setSelectedUser(pendingUser);
                        setIsApprovalDialogOpen(true);
                      }}
                      size="sm"
                    >
                      موافقة
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600">
                  <p>تاريخ التسجيل: {pendingUser.createdAt ? new Date(pendingUser.createdAt).toLocaleDateString('ar-SA') : 'غير محدد'}</p>
                  {pendingUser.address && <p>العنوان: {pendingUser.address}</p>}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Approval Dialog */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>الموافقة على المستخدم</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>المستخدم</Label>
              <p className="text-sm text-gray-600 mt-1">{selectedUser?.fullName}</p>
              <p className="text-sm text-gray-600">{selectedUser?.email}</p>
            </div>

            <div>
              <Label htmlFor="role">الدور</Label>
              <Select value={approvalData.role} onValueChange={(value) => setApprovalData({ ...approvalData, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الدور" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technician">فني</SelectItem>
                  <SelectItem value="receptionist">موظف استقبال</SelectItem>
                  <SelectItem value="warehouse_manager">مدير مخزن</SelectItem>
                  <SelectItem value="manager">مدير</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="center">المركز (اختياري)</Label>
              <Select value={approvalData.centerId || "none"} onValueChange={(value) => setApprovalData({ ...approvalData, centerId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المركز" />
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

            <div>
              <Label htmlFor="warehouse">المخزن (اختياري)</Label>
              <Select value={approvalData.warehouseId || "none"} onValueChange={(value) => setApprovalData({ ...approvalData, warehouseId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المخزن" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون مخزن</SelectItem>
                  {warehouses?.map((warehouse: any) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea
                id="notes"
                value={approvalData.notes}
                onChange={(e) => setApprovalData({ ...approvalData, notes: e.target.value })}
                placeholder="أي ملاحظات إضافية..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleApproveUser}
                disabled={approveUserMutation.isPending || !approvalData.role}
                className="flex-1"
              >
                {approveUserMutation.isPending ? "جاري الموافقة..." : "موافقة"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsApprovalDialogOpen(false)}
                className="flex-1"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}