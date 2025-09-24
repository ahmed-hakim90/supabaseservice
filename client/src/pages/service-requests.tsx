import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Download, Eye, Edit2, Trash2, MoreHorizontal, Wrench, MessageSquarePlus, Filter, Users, Clock, CheckCircle, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hasPermission } from '@/lib/permissions';
import { useAuth } from '@/lib/auth';
import DataTable from '@/components/ui/data-table';

// Types
interface ServiceRequest {
  id: string;
  requestNumber: string;
  customerId: string;
  deviceName: string;
  model?: string;
  issue: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  estimatedCost?: number;
  actualCost?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ServiceRequestFormData {
  requestNumber: string;
  customerId: string;
  deviceName: string;
  model?: string;
  issue: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  estimatedCost?: number;
  actualCost?: number;
  notes?: string;
}

interface SparePartItem {
  id: string;
  name: string;
  quantity: number;
}

// Status Badge Component
const StatusBadge: React.FC<{ status: string; animate?: boolean }> = ({ status, animate = false }) => {
  const statusConfig = {
    pending: { 
      label: 'في الانتظار', 
      variant: 'secondary' as const,
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
    },
    in_progress: { 
      label: 'قيد التنفيذ', 
      variant: 'default' as const,
      className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
    },
    completed: { 
      label: 'مكتمل', 
      variant: 'outline' as const,
      className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
    },
    cancelled: { 
      label: 'ملغي', 
      variant: 'destructive' as const,
      className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
    }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  
  return (
    <Badge 
      variant={config.variant} 
      className={`${config.className} ${animate ? 'animate-pulse' : ''} font-medium`}
    >
      {config.label}
    </Badge>
  );
};

// Spare Parts Selector Component
const SparePartsSelector: React.FC<{
  selectedSpareParts: SparePartItem[];
  onSelectionChange: (parts: SparePartItem[]) => void;
}> = ({ selectedSpareParts, onSelectionChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Mock spare parts data - replace with actual API call
  const availableSpareParts = [
    { id: '1', name: 'مستشعر الضغط', stock: 15 },
    { id: '2', name: 'كابل التوصيل', stock: 8 },
    { id: '3', name: 'شاشة العرض', stock: 3 },
    { id: '4', name: 'بطارية ليثيوم', stock: 12 }
  ];

  const addSparePart = (part: any) => {
    const existingPart = selectedSpareParts.find(p => p.id === part.id);
    if (existingPart) {
      onSelectionChange(
        selectedSpareParts.map(p => 
          p.id === part.id 
            ? { ...p, quantity: Math.min(p.quantity + 1, part.stock) }
            : p
        )
      );
    } else {
      onSelectionChange([...selectedSpareParts, { ...part, quantity: 1 }]);
    }
  };

  const removeSparePart = (partId: string) => {
    onSelectionChange(selectedSpareParts.filter(p => p.id !== partId));
  };

  const updateQuantity = (partId: string, quantity: number) => {
    onSelectionChange(
      selectedSpareParts.map(p => 
        p.id === partId ? { ...p, quantity: Math.max(0, quantity) } : p
      ).filter(p => p.quantity > 0)
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <Input
          placeholder="البحث عن قطع الغيار..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="text-right"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
        {availableSpareParts
          .filter(part => part.name.toLowerCase().includes(searchTerm.toLowerCase()))
          .map(part => (
            <Button
              key={part.id}
              variant="outline"
              size="sm"
              onClick={() => addSparePart(part)}
              className="text-right justify-between"
              disabled={part.stock === 0}
            >
              <span>{part.name}</span>
              <Badge variant="secondary" className="mr-2">
                {part.stock}
              </Badge>
            </Button>
          ))
        }
      </div>

      {selectedSpareParts.length > 0 && (
        <div className="space-y-2">
          <Label>قطع الغيار المحددة:</Label>
          {selectedSpareParts.map(part => (
            <div key={part.id} className="flex items-center justify-between bg-muted p-2 rounded">
              <span>{part.name}</span>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Input
                  type="number"
                  min="1"
                  value={part.quantity}
                  onChange={(e) => updateQuantity(part.id, parseInt(e.target.value))}
                  className="w-16 text-center"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSparePart(part.id)}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function ServiceRequestsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // State
  const [editingRequest, setEditingRequest] = useState<ServiceRequest | null>(null);
  const [deletingRequest, setDeletingRequest] = useState<ServiceRequest | null>(null);
  const [viewingRequest, setViewingRequest] = useState<ServiceRequest | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [followingUpRequest, setFollowingUpRequest] = useState<ServiceRequest | null>(null);
  const [isFollowUpDialogOpen, setIsFollowUpDialogOpen] = useState(false);
  const [followUpText, setFollowUpText] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [selectedSpareParts, setSelectedSpareParts] = useState<SparePartItem[]>([]);

  const [formData, setFormData] = useState<ServiceRequestFormData>({
    requestNumber: '',
    customerId: '',
    deviceName: '',
    model: '',
    issue: '',
    status: 'pending',
    estimatedCost: 0,
    actualCost: 0,
    notes: ''
  });

  // Permissions
    const canViewRequests = user?.role ? hasPermission(user.role, 'service_requests', 'read') : false;
    const canCreateRequests = user?.role ? hasPermission(user.role, 'service_requests', 'create') : false;
    const canUpdateRequests = user?.role ? hasPermission(user.role, 'service_requests', 'update') : false;
    const canDeleteRequests = user?.role ? hasPermission(user.role, 'service_requests', 'delete') : false;

  // Data fetching
  const { data: serviceRequests = [], isLoading, error } = useQuery({
    queryKey: ['serviceRequests'],
    queryFn: async () => {
      const response = await fetch('/api/service-requests', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch service requests');
      return response.json();
    },
    enabled: canViewRequests
  });

  const { data: customerUsers = [] } = useQuery({
    queryKey: ['customerUsers'],
    queryFn: async () => {
      const response = await fetch('/api/users?role=customer', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch customers');
      return response.json();
    }
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: ServiceRequestFormData) => {
      const response = await fetch('/api/service-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create service request');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceRequests'] });
      toast({ title: 'تم إنشاء طلب الصيانة بنجاح' });
      setFormData({
        requestNumber: '',
        customerId: '',
        deviceName: '',
        model: '',
        issue: '',
        status: 'pending',
        estimatedCost: 0,
        actualCost: 0,
        notes: ''
      });
    },
    onError: (error) => {
      toast({ 
        title: 'خطأ في إنشاء طلب الصيانة', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ServiceRequestFormData> }) => {
      const response = await fetch(`/api/service-requests/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update service request');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceRequests'] });
      toast({ title: 'تم تحديث طلب الصيانة بنجاح' });
      setEditingRequest(null);
    },
    onError: (error) => {
      toast({ 
        title: 'خطأ في تحديث طلب الصيانة', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/service-requests/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to delete service request');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceRequests'] });
      toast({ title: 'تم حذف طلب الصيانة بنجاح' });
      setDeletingRequest(null);
    },
    onError: (error) => {
      toast({ 
        title: 'خطأ في حذف طلب الصيانة', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  // Event handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRequest) {
      updateMutation.mutate({ id: editingRequest.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = () => {
    if (deletingRequest) {
      deleteMutation.mutate(deletingRequest.id);
    }
  };

  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followingUpRequest) return;

    try {
      const followUpData = {
        serviceRequestId: followingUpRequest.id,
        text: followUpText,
        spareParts: selectedSpareParts,
        ...(newStatus && { newStatus })
      };

      const response = await fetch('/api/service-requests/follow-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(followUpData)
      });

      if (!response.ok) throw new Error('Failed to add follow-up');

      queryClient.invalidateQueries({ queryKey: ['serviceRequests'] });
      toast({ title: 'تم إضافة المتابعة بنجاح' });
      setIsFollowUpDialogOpen(false);
      setFollowUpText('');
      setNewStatus('');
      setSelectedSpareParts([]);
      setFollowingUpRequest(null);
    } catch (error) {
      toast({ 
        title: 'خطأ في إضافة المتابعة', 
        description: (error as Error).message,
        variant: 'destructive' 
      });
    }
  };

  const exportToExcel = async () => {
    try {
      const response = await fetch('/api/service-requests/export', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to export data');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `service-requests-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({ title: 'تم تصدير البيانات بنجاح' });
    } catch (error) {
      toast({ 
        title: 'خطأ في تصدير البيانات', 
        description: (error as Error).message,
        variant: 'destructive' 
      });
    }
  };

  // Stats calculation
  const stats = {
    total: serviceRequests.length,
    pending: serviceRequests.filter((r: ServiceRequest) => r.status === 'pending').length,
    inProgress: serviceRequests.filter((r: ServiceRequest) => r.status === 'in_progress').length,
    completed: serviceRequests.filter((r: ServiceRequest) => r.status === 'completed').length,
    cancelled: serviceRequests.filter((r: ServiceRequest) => r.status === 'cancelled').length
  };

  // Column definitions for DataTable
  const columns = [
    {
        key: "requestNumber",
      header: "رقم الطلب",
        render: (request: ServiceRequest) => (
          <div className="font-medium text-primary">
            {request.requestNumber}
          </div>
        ),
        sortable: true,
        searchable: true
    },
    {
        key: "customerId",
      header: "العميل",
        render: (request: ServiceRequest) => {
          const customer = customerUsers?.find((c: any) => c.id === request.customerId);
          return <div>{customer?.fullName || '-'}</div>;
        },
        sortable: true
    },
    {
        key: "deviceName",
      header: "الجهاز",
        render: (request: ServiceRequest) => {
        return (
          <div>
            <div className="font-medium">{request.deviceName}</div>
            {request.model && (
              <div className="text-sm text-muted-foreground">{request.model}</div>
            )}
          </div>
        );
      },
        sortable: true,
        searchable: true
    },
    {
        key: "issue",
      header: "المشكلة",
        render: (request: ServiceRequest) => (
          <div className="max-w-xs truncate" title={request.issue}>
            {request.issue}
        </div>
      ),
        searchable: true
    },
    {
        key: "status",
      header: "الحالة",
        render: (request: ServiceRequest) => (
          <StatusBadge status={request.status} />
      ),
        sortable: true
    },
    {
        key: "createdAt",
      header: "التاريخ",
        render: (request: ServiceRequest) => {
          return request.createdAt ? new Date(request.createdAt).toLocaleDateString('ar-SA') : '-';
        },
        sortable: true
    },
    {
        key: "actions",
      header: "الإجراءات",
        render: (request: ServiceRequest) => {
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setViewingRequest(request);
                  setIsViewDialogOpen(true);
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                عرض التفاصيل
              </DropdownMenuItem>
              
              {canUpdateRequests && (
                <>
                  <DropdownMenuItem
                    onClick={() => {
                      setEditingRequest(request);
                      setFormData(request);
                    }}
                  >
                    <Edit2 className="mr-2 h-4 w-4" />
                    تعديل
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem
                    onClick={() => {
                      setFollowingUpRequest(request);
                      setIsFollowUpDialogOpen(true);
                      setFollowUpText('');
                      setNewStatus('');
                      setSelectedSpareParts([]);
                    }}
                  >
                    <MessageSquarePlus className="mr-2 h-4 w-4" />
                    إضافة متابعة
                  </DropdownMenuItem>
                </>
              )}
              
              {canDeleteRequests && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setDeletingRequest(request)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    حذف
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Filter options for DataTable

  if (!canViewRequests) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">ليس لديك صلاحية لعرض طلبات الصيانة</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">خطأ في تحميل البيانات</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">طلبات الصيانة</h1>
          <p className="text-muted-foreground">
            إدارة ومتابعة طلبات الصيانة للأجهزة الطبية
          </p>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <Button 
            variant="outline" 
            onClick={exportToExcel}
            className="flex items-center space-x-2 space-x-reverse"
          >
            <Download className="w-4 h-4" />
            <span>تصدير Excel</span>
          </Button>
          
          {canCreateRequests && (
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة طلب جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>طلب صيانة جديد</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>رقم الطلب</Label>
                      <Input
                        value={formData.requestNumber || ""}
                        onChange={(e) => setFormData({ ...formData, requestNumber: e.target.value })}
                        required
                        className="text-right"
                        placeholder="مثال: REQ-2024-001"
                      />
                    </div>
                    
                    <div>
                      <Label>العميل</Label>
                      <Select
                        value={formData.customerId}
                        onValueChange={(value) => setFormData({ ...formData, customerId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر العميل" />
                        </SelectTrigger>
                        <SelectContent>
                          {customerUsers?.map((customer: any) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>اسم الجهاز</Label>
                      <Input
                        value={formData.deviceName || ""}
                        onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })}
                        required
                        className="text-right"
                        placeholder="مثال: جهاز الضغط الرقمي"
                      />
                    </div>
                    
                    <div>
                      <Label>الموديل</Label>
                      <Input
                        value={formData.model || ""}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        className="text-right"
                        placeholder="مثال: BP-2020-X"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>وصف المشكلة</Label>
                    <Textarea
                      value={formData.issue || ""}
                      onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
                      required
                      className="text-right"
                      placeholder="أدخل تفاصيل المشكلة..."
                      rows={4}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>التكلفة المتوقعة (ريال)</Label>
                      <Input
                        type="number"
                        value={formData.estimatedCost || ""}
                        onChange={(e) => setFormData({ ...formData, estimatedCost: parseFloat(e.target.value) || 0 })}
                        min="0"
                        step="0.01"
                        className="text-right"
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div>
                      <Label>الحالة</Label>
                      <Select
                        value={formData.status}
                          onValueChange={(value: 'pending' | 'in_progress' | 'completed' | 'cancelled') => 
                            setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">في الانتظار</SelectItem>
                          <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                          <SelectItem value="completed">مكتمل</SelectItem>
                          <SelectItem value="cancelled">ملغي</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label>ملاحظات</Label>
                    <Textarea
                      value={formData.notes || ""}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="text-right"
                      placeholder="ملاحظات إضافية..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        إلغاء
                      </Button>
                    </DialogClose>
                    <Button type="submit">
                      إضافة الطلب
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">إجمالي الطلبات</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">في الانتظار</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">قيد التنفيذ</p>
              <p className="text-2xl font-bold">{stats.inProgress}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">مكتملة</p>
              <p className="text-2xl font-bold">{stats.completed}</p>
            </div>
          </div>
        </Card>
      </div>

      <DataTable
        data={serviceRequests}
        columns={columns}
          searchable={true}
          searchPlaceholder="البحث في الطلبات..."
          searchKeys={['requestNumber', 'deviceName', 'issue']}
          loading={isLoading}
          onItemClick={(request: ServiceRequest) => {
          setViewingRequest(request);
          setIsViewDialogOpen(true);
        }}
          emptyMessage="لا توجد طلبات صيانة"
          pagination={{
            totalItemsToFetch: 100,
            defaultItemsPerPage: 20,
            itemsPerPageOptions: [10, 20, 50, 100]
          }}
      />

      {/* Edit Dialog */}
      {editingRequest && (
        <Dialog open={!!editingRequest} onOpenChange={(open) => !open && setEditingRequest(null)}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>تعديل طلب الصيانة</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>رقم الطلب</Label>
                <Input
                  value={formData.requestNumber || ""}
                  onChange={(e) => setFormData({ ...formData, requestNumber: e.target.value })}
                  required
                  className="text-right"
                />
              </div>
              <div>
                <Label>اسم الجهاز</Label>
                <Input
                  value={formData.deviceName || ""}
                  onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })}
                  required
                  className="text-right"
                />
              </div>
              <div>
                <Label>المشكلة</Label>
                <Textarea
                  value={formData.issue || ""}
                  onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
                  required
                  className="text-right"
                />
              </div>
              <div className="flex justify-end space-x-2 space-x-reverse">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditingRequest(null)}
                >
                  إلغاء
                </Button>
                <Button type="submit">
                  حفظ التغييرات
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* View Details Dialog */}
      {viewingRequest && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                تفاصيل طلب الصيانة
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex justify-center">
                <StatusBadge 
                  status={viewingRequest.status} 
                  animate={true}
                />
              </div>

              {/* Main Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">رقم الطلب</p>
                  <p className="font-medium text-lg">{viewingRequest.requestNumber}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">العميل</p>
                  <p className="font-medium text-lg">
                    {customerUsers?.find((c: any) => c.id === viewingRequest.customerId)?.fullName || '-'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">الجهاز</p>
                  <p className="font-medium">{viewingRequest.deviceName}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">الموديل</p>
                  <p className="font-medium">{viewingRequest.model || '-'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">تاريخ الإنشاء</p>
                  <p className="font-medium">
                    {viewingRequest.createdAt ? new Date(viewingRequest.createdAt).toLocaleDateString('ar-SA') : '-'}
                  </p>
                </div>
              </div>

              {/* Issue Description */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">وصف المشكلة</p>
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-card-foreground">{viewingRequest.issue}</p>
                </div>
              </div>

              {/* Cost Information */}
              {(viewingRequest.estimatedCost || viewingRequest.actualCost) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {viewingRequest.estimatedCost && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">التكلفة المتوقعة</p>
                      <p className="font-medium text-lg">{viewingRequest.estimatedCost} ريال</p>
                    </div>
                  )}
                  {viewingRequest.actualCost && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">التكلفة الفعلية</p>
                      <p className="font-medium text-lg">{viewingRequest.actualCost} ريال</p>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              {viewingRequest.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">ملاحظات</p>
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <p className="text-card-foreground">{viewingRequest.notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 space-x-reverse pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setIsViewDialogOpen(false)}
              >
                إغلاق
              </Button>
              
              {canUpdateRequests && (
                <Button
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    setEditingRequest(viewingRequest);
                    setFormData(viewingRequest);
                  }}
                >
                  تعديل الطلب
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Follow-up Dialog */}
      <Dialog open={isFollowUpDialogOpen} onOpenChange={setIsFollowUpDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إضافة متابعة</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFollowUpSubmit} className="space-y-4">
            <div>
              <Label>نص المتابعة</Label>
              <Textarea
                value={followUpText}
                onChange={(e) => setFollowUpText(e.target.value)}
                rows={4}
                required
                className="text-right"
              />
            </div>
            
            <div>
              <Label>تحديث الحالة (اختياري)</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحالة الجديدة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">بدون تغيير</SelectItem>
                  <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                  <SelectItem value="completed">مكتمل</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>قطع الغيار المستخدمة</Label>
              <SparePartsSelector
                selectedSpareParts={selectedSpareParts}
                onSelectionChange={setSelectedSpareParts}
              />
            </div>

            <div className="flex justify-end space-x-2 space-x-reverse">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsFollowUpDialogOpen(false)}
              >
                إلغاء
              </Button>
              <Button type="submit">
                إضافة المتابعة
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingRequest} onOpenChange={() => setDeletingRequest(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف طلب الصيانة "{deletingRequest?.requestNumber}"؟
              هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="space-x-2 space-x-reverse">
            <AlertDialogCancel onClick={() => setDeletingRequest(null)}>
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