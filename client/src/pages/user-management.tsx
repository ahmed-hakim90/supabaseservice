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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { apiGet, apiPost, apiPut, apiDelete } from "../lib/db";
import { useAuth } from "../lib/auth";
import { canCreate, canUpdate, canDelete } from "../lib/permissions";
import type { User, InsertUser } from "@shared/schema";

type RoleKey = 'admin' | 'manager' | 'technician' | 'receptionist' | 'warehouse_manager' | 'customer';

const roleNames: Record<RoleKey, string> = {
  admin: 'مدير النظام',
  manager: 'مدير مركز',
  technician: 'فني',
  receptionist: 'موظف استقبال',
  warehouse_manager: 'مدير مخزن',
  customer: 'عميل'
};

// Pagination constants
const TOTAL_ITEMS_TO_FETCH = 100; // تحميل 100 عنصر
const DEFAULT_ITEMS_PER_PAGE = 15; // عرض 15 سطر في كل صفحة بشكل افتراضي
const ITEMS_PER_PAGE_OPTIONS = [10, 15, 25, 50]; // خيارات عدد الصفوف

const permissions = [
  { key: 'users_view', name: 'عرض المستخدمين' },
  { key: 'users_create', name: 'إضافة مستخدم' },
  { key: 'users_edit', name: 'تعديل مستخدم' },
  { key: 'users_delete', name: 'حذف مستخدم' },
  { key: 'centers_view', name: 'عرض المراكز' },
  { key: 'centers_create', name: 'إضافة مركز' },
  { key: 'centers_edit', name: 'تعديل مركز' },
  { key: 'centers_delete', name: 'حذف مركز' },
  { key: 'requests_view', name: 'عرض طلبات الصيانة' },
  { key: 'requests_create', name: 'إضافة طلب صيانة' },
  { key: 'requests_edit', name: 'تعديل طلب صيانة' },
  { key: 'requests_delete', name: 'حذف طلب صيانة' },
  { key: 'warehouses_view', name: 'عرض المخازن' },
  { key: 'warehouses_create', name: 'إضافة مخزن' },
  { key: 'warehouses_edit', name: 'تعديل مخزن' },
  { key: 'warehouses_delete', name: 'حذف مخزن' },
  { key: 'customers_view', name: 'عرض العملاء' },
  { key: 'customers_create', name: 'إضافة عميل' },
  { key: 'customers_edit', name: 'تعديل عميل' },
  { key: 'customers_delete', name: 'حذف عميل' },
  { key: 'reports_view', name: 'عرض التقارير' },
  { key: 'activities_view', name: 'عرض سجل الأنشطة' },
  { key: 'settings_view', name: 'عرض الإعدادات' },
  { key: 'settings_edit', name: 'تعديل الإعدادات' }
];

const defaultRolePermissions: Record<RoleKey, string[]> = {
  admin: permissions.map(p => p.key),
  manager: [
    'users_view', 'users_create', 'centers_view', 'requests_view', 'requests_create', 'requests_edit',
    'warehouses_view', 'customers_view', 'customers_create', 'customers_edit', 'reports_view'
  ],
  technician: [
    'requests_view', 'requests_edit', 'customers_view'
  ],
  receptionist: [
    'customers_view', 'customers_create', 'customers_edit', 'requests_view', 'requests_create'
  ],
  warehouse_manager: [
    'warehouses_view', 'warehouses_edit', 'reports_view'
  ],
  customer: []
};

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState("users");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<InsertUser>>({});
  
  // Role management states
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});
  
  // Approval states
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

  // Enable real-time updates
  const { isConnected } = useWebSocket();

  // Check permissions
  const canCreateUsers = currentUser ? canCreate(currentUser.role, 'users') : false;
  const canUpdateUsers = currentUser ? canUpdate(currentUser.role, 'users') : false;
  const canDeleteUsers = currentUser ? canDelete(currentUser.role, 'users') : false;
  const canApproveUsers = currentUser ? canCreate(currentUser.role, 'users') : false;

  // Data queries
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users', TOTAL_ITEMS_TO_FETCH],
    queryFn: () => apiGet(`/api/users?limit=${TOTAL_ITEMS_TO_FETCH}`),
  });

  const { data: pendingUsers, isLoading: pendingLoading } = useQuery({
    queryKey: ['pending-users'],
    queryFn: () => apiGet('/api/pending-users'),
    enabled: canApproveUsers
  });

  const { data: serviceCenters } = useQuery({
    queryKey: ['/api/service-centers'],
    queryFn: () => apiGet('/api/service-centers'),
  });

  const { data: warehouses } = useQuery({
    queryKey: ['/api/warehouses'],
    queryFn: () => apiGet('/api/warehouses'),
  });

  // User mutations
  const createUserMutation = useMutation({
    mutationFn: (userData: Partial<InsertUser>) => apiPost('/api/users', userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsAddDialogOpen(false);
      setFormData({});
      toast({ title: "تم إنشاء المستخدم بنجاح" });
    },
    onError: () => {
      toast({ title: "خطأ في إنشاء المستخدم", variant: "destructive" });
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) =>
      apiPut(`/api/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setEditingUser(null);
      setFormData({});
      toast({ title: "تم تحديث المستخدم بنجاح" });
    },
    onError: () => {
      toast({ title: "خطأ في تحديث المستخدم", variant: "destructive" });
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({ title: "تم حذف المستخدم بنجاح" });
    },
    onError: () => {
      toast({ title: "خطأ في حذف المستخدم", variant: "destructive" });
    }
  });

  // Approval mutation
  const approveUserMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: any }) =>
      apiPost(`/api/approve-user/${userId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsApprovalDialogOpen(false);
      setSelectedUser(null);
      setApprovalData({ role: "", centerId: "none", warehouseId: "none", notes: "" });
      toast({ title: "تم اعتماد المستخدم بنجاح" });
    },
    onError: () => {
      toast({ title: "خطأ في اعتماد المستخدم", variant: "destructive" });
    }
  });

  // Role permissions mutation
  const updateRolePermissionsMutation = useMutation({
    mutationFn: ({ role, permissions }: { role: string; permissions: string[] }) =>
      apiPost(`/api/roles/${role}/permissions`, { permissions }),
    onSuccess: () => {
      toast({ title: "تم تحديث صلاحيات الدور بنجاح" });
      setEditingRole(null);
    },
    onError: () => {
      toast({ title: "خطأ في تحديث الصلاحيات", variant: "destructive" });
    }
  });

  // Filter functions
  const filteredUsers = users?.filter((user: User) => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Pagination calculations
  const totalItems = filteredUsers?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers?.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter, itemsPerPage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.fullName) return;

    if (editingUser) {
      updateUserMutation.mutate({
        id: editingUser.id,
        data: formData
      });
    } else {
      createUserMutation.mutate(formData);
    }
  };

  const handleApproval = () => {
    if (!selectedUser || !approvalData.role) return;
    
    approveUserMutation.mutate({
      userId: selectedUser.id,
      data: approvalData
    });
  };

  const handleRolePermissionChange = (role: string, permission: string, checked: boolean) => {
    setRolePermissions(prev => {
      const roleKey = role as RoleKey;
      const currentPermissions = prev[roleKey] || defaultRolePermissions[roleKey] || [];
      const updatedPermissions = checked 
        ? [...currentPermissions, permission]
        : currentPermissions.filter(p => p !== permission);
      
      return {
        ...prev,
        [roleKey]: updatedPermissions
      };
    });
  };

  const saveRolePermissions = (role: string) => {
    const roleKey = role as RoleKey;
    const permissions = rolePermissions[roleKey] || defaultRolePermissions[roleKey] || [];
    updateRolePermissionsMutation.mutate({ role, permissions });
  };

  if (usersLoading) {
    return <div className="flex justify-center items-center min-h-screen">جارٍ التحميل...</div>;
  }

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">إدارة المستخدمين</h1>
        <p className="text-muted-foreground">إدارة المستخدمين والموافقات والأدوار والصلاحيات</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">المستخدمين</TabsTrigger>
          <TabsTrigger value="approvals">الموافقات</TabsTrigger>
          <TabsTrigger value="roles">الأدوار</TabsTrigger>
          <TabsTrigger value="permissions">الصلاحيات</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <Input
                placeholder="البحث بالاسم أو البريد الإلكتروني..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="تصفية بالدور" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأدوار</SelectItem>
                  {Object.entries(roleNames).map(([key, name]) => (
                    <SelectItem key={key} value={key}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="تصفية بالحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="inactive">غير نشط</SelectItem>
                  <SelectItem value="pending">في الانتظار</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* {canCreateUsers && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>إضافة مستخدم جديد</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md" dir="rtl">
                  <DialogHeader>
                    <DialogTitle>إضافة مستخدم جديد</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">الاسم الكامل</Label>
                      <Input
                        id="fullName"
                        required
                        value={formData.fullName || ""}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">البريد الإلكتروني</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={formData.email || ""}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">رقم الهاتف</Label>
                      <Input
                        id="phone"
                        value={formData.phone || ""}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        إلغاء
                      </Button>
                      <Button type="submit" disabled={createUserMutation.isPending}>
                        {createUserMutation.isPending ? "جارٍ الإضافة..." : "إضافة"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )} */}
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-right font-semibold">الاسم الكامل</TableHead>
                  <TableHead className="text-right font-semibold">البريد الإلكتروني</TableHead>
                  <TableHead className="text-right font-semibold">رقم الهاتف</TableHead>
                  <TableHead className="text-right font-semibold">الدور</TableHead>
                  <TableHead className="text-right font-semibold">الحالة</TableHead>
                  <TableHead className="text-right font-semibold">تاريخ التسجيل</TableHead>
                  <TableHead className="text-right font-semibold">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        جارٍ تحميل البيانات...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedUsers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      لا يوجد مستخدمين مطابقين لمعايير البحث
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsers?.map((user: User) => (
                    <TableRow key={user.id} className="hover:bg-muted/20">
                      <TableCell className="font-medium">{user.fullName}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell className="text-muted-foreground">{user.phone || 'غير محدد'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {roleNames[user.role as keyof typeof roleNames]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                          {user.status === 'active' ? 'نشط' : user.status === 'pending' ? 'في الانتظار' : 'غير نشط'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-SA') : 'غير محدد'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {canUpdateUsers && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setEditingUser(user);
                                setFormData(user);
                              }}
                            >
                              تعديل
                            </Button>
                          )}
                          {canDeleteUsers && (
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => deleteUserMutation.mutate(user.id)}
                            >
                              حذف
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Info and Controls */}
          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                عرض {totalItems > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, totalItems)} من {totalItems} مستخدم
                {totalItems > TOTAL_ITEMS_TO_FETCH && (
                  <span className="text-amber-600 mr-2">
                    (محدود بـ {TOTAL_ITEMS_TO_FETCH} عنصر)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">عرض</span>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEMS_PER_PAGE_OPTIONS.map(option => (
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
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                      }}
                      className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {/* First page */}
                  {currentPage > 2 && (
                    <>
                      <PaginationItem>
                        <PaginationLink 
                          href="#" 
                          onClick={(e) => { e.preventDefault(); setCurrentPage(1); }}
                        >
                          1
                        </PaginationLink>
                      </PaginationItem>
                      {currentPage > 3 && <PaginationEllipsis />}
                    </>
                  )}
                  
                  {/* Current and adjacent pages */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => 
                      page === currentPage || 
                      page === currentPage - 1 || 
                      page === currentPage + 1
                    )
                    .map(page => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          isActive={page === currentPage}
                          onClick={(e) => { e.preventDefault(); setCurrentPage(page); }}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                  
                  {/* Last page */}
                  {currentPage < totalPages - 1 && (
                    <>
                      {currentPage < totalPages - 2 && <PaginationEllipsis />}
                      <PaginationItem>
                        <PaginationLink 
                          href="#" 
                          onClick={(e) => { e.preventDefault(); setCurrentPage(totalPages); }}
                        >
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}
                  
                  <PaginationItem>
                    <PaginationNext 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                      }}
                      className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </TabsContent>

        {/* Approvals Tab */}
        <TabsContent value="approvals" className="space-y-4">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">المستخدمين في انتظار الموافقة</h2>
            <p className="text-muted-foreground">اعتماد المستخدمين الجدد وتحديد أدوارهم</p>
          </div>

          {pendingLoading ? (
            <div className="text-center py-8">جارٍ تحميل المستخدمين...</div>
          ) : pendingUsers?.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">لا يوجد مستخدمين في انتظار الموافقة</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingUsers?.map((user: User) => (
                <Card key={user.id}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>{user.fullName}</CardTitle>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <Badge variant="secondary">في انتظار الموافقة</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="text-sm space-y-1">
                        <p>الهاتف: {user.phone || 'غير محدد'}</p>
                        <p>تاريخ التسجيل: {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-SA') : 'غير محدد'}</p>
                      </div>
                      <Dialog open={isApprovalDialogOpen && selectedUser?.id === user.id} 
                             onOpenChange={(open) => {
                               setIsApprovalDialogOpen(open);
                               if (!open) setSelectedUser(null);
                             }}>
                        <DialogTrigger asChild>
                          <Button onClick={() => setSelectedUser(user)}>
                            اعتماد المستخدم
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md" dir="rtl">
                          <DialogHeader>
                            <DialogTitle>اعتماد المستخدم: {user.fullName}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>الدور</Label>
                              <Select 
                                value={approvalData.role} 
                                onValueChange={(value) => setApprovalData({...approvalData, role: value})}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر الدور" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(roleNames).map(([key, name]) => (
                                    <SelectItem key={key} value={key}>{name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            {(approvalData.role === 'manager' || approvalData.role === 'technician' || approvalData.role === 'receptionist') && (
                              <div className="space-y-2">
                                <Label>مركز الخدمة</Label>
                                <Select 
                                  value={approvalData.centerId} 
                                  onValueChange={(value) => setApprovalData({...approvalData, centerId: value})}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="اختر مركز الخدمة" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">لا يوجد</SelectItem>
                                    {serviceCenters?.map((center: any) => (
                                      <SelectItem key={center.id} value={center.id}>
                                        {center.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {approvalData.role === 'warehouse_manager' && (
                              <div className="space-y-2">
                                <Label>المخزن</Label>
                                <Select 
                                  value={approvalData.warehouseId} 
                                  onValueChange={(value) => setApprovalData({...approvalData, warehouseId: value})}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="اختر المخزن" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">لا يوجد</SelectItem>
                                    {warehouses?.map((warehouse: any) => (
                                      <SelectItem key={warehouse.id} value={warehouse.id}>
                                        {warehouse.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            <div className="space-y-2">
                              <Label>ملاحظات</Label>
                              <Textarea
                                placeholder="ملاحظات إضافية..."
                                value={approvalData.notes}
                                onChange={(e) => setApprovalData({...approvalData, notes: e.target.value})}
                                rows={3}
                              />
                            </div>

                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                onClick={() => setIsApprovalDialogOpen(false)}
                              >
                                إلغاء
                              </Button>
                              <Button 
                                onClick={handleApproval}
                                disabled={!approvalData.role || approveUserMutation.isPending}
                              >
                                {approveUserMutation.isPending ? "جارٍ الاعتماد..." : "اعتماد"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">إدارة الأدوار</h2>
            <p className="text-muted-foreground">عرض وإدارة أدوار النظام المختلفة</p>
          </div>

          <div className="grid gap-4">
            {Object.entries(roleNames).map(([roleKey, roleName]) => (
              <Card key={roleKey}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>{roleName}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        عدد المستخدمين: {users?.filter((user: User) => user.role === roleKey).length || 0}
                      </p>
                    </div>
                    <Badge variant="outline">{roleKey}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="font-medium">الصلاحيات الحالية:</h4>
                    <div className="flex flex-wrap gap-2">
                      {(rolePermissions[roleKey as RoleKey] || defaultRolePermissions[roleKey as RoleKey] || []).map(permission => {
                        const permissionObj = permissions.find(p => p.key === permission);
                        return permissionObj ? (
                          <Badge key={permission} variant="secondary" className="text-xs">
                            {permissionObj.name}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-4">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">إدارة الصلاحيات</h2>
            <p className="text-muted-foreground">تحديد الصلاحيات لكل دور في النظام</p>
          </div>

          <div className="space-y-6">
            {Object.entries(roleNames).map(([roleKey, roleName]) => (
              <Card key={roleKey}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>{roleName}</CardTitle>
                    <div className="flex gap-2">
                      {editingRole === roleKey ? (
                        <>
                          <Button size="sm" onClick={() => saveRolePermissions(roleKey)}>
                            حفظ
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingRole(null)}>
                            إلغاء
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => {
                          setEditingRole(roleKey);
                          setRolePermissions(prev => ({
                            ...prev,
                            [roleKey]: prev[roleKey as RoleKey] || defaultRolePermissions[roleKey as RoleKey] || []
                          }));
                        }}>
                          تعديل الصلاحيات
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {permissions.map(permission => {
                      const currentPermissions = editingRole === roleKey 
                        ? (rolePermissions[roleKey as RoleKey] || defaultRolePermissions[roleKey as RoleKey] || [])
                        : (defaultRolePermissions[roleKey as RoleKey] || []);
                      const hasPermission = currentPermissions.includes(permission.key);
                      
                      return (
                        <div key={permission.key} className="flex items-center space-x-2 space-x-reverse">
                          <Switch
                            id={`${roleKey}-${permission.key}`}
                            checked={hasPermission}
                            disabled={editingRole !== roleKey}
                            onCheckedChange={(checked) => 
                              handleRolePermissionChange(roleKey, permission.key, checked)
                            }
                          />
                          <Label 
                            htmlFor={`${roleKey}-${permission.key}`}
                            className="text-sm font-normal"
                          >
                            {permission.name}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      {editingUser && (
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>تعديل المستخدم</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-fullName">الاسم الكامل</Label>
                <Input
                  id="edit-fullName"
                  required
                  value={formData.fullName || ""}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">البريد الإلكتروني</Label>
                <Input
                  id="edit-email"
                  type="email"
                  required
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">رقم الهاتف</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">الدور</Label>
                <Select 
                  value={formData.role || ""} 
                  onValueChange={(value) => setFormData({ ...formData, role: value as RoleKey })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الدور" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleNames).map(([key, name]) => (
                      <SelectItem key={key} value={key}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                  إلغاء
                </Button>
                <Button type="submit" disabled={updateUserMutation.isPending}>
                  {updateUserMutation.isPending ? "جارٍ التحديث..." : "تحديث"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}