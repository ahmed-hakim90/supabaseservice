import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiGet } from "../lib/db";
import { useAuth } from "@/lib/auth";
import { canRead, canAccessPage } from "@/lib/permissions";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const activityTypes = [
  { key: 'all', name: 'جميع الأنشطة', icon: 'bi-activity' },
  { key: 'user', name: 'أنشطة المستخدمين', icon: 'bi-person' },
  { key: 'service-request', name: 'أنشطة طلبات الصيانة', icon: 'bi-tools' },
  { key: 'center', name: 'أنشطة المراكز', icon: 'bi-building' },
  { key: 'warehouse', name: 'أنشطة المخازن', icon: 'bi-shop' },
  { key: 'customer', name: 'أنشطة العملاء', icon: 'bi-person-badge' },
  { key: 'auth', name: 'أنشطة تسجيل الدخول', icon: 'bi-shield-check' },
  { key: 'system', name: 'أنشطة النظام', icon: 'bi-gear' },
];

const actionTypes = {
  create: { name: 'إنشاء', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  update: { name: 'تحديث', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  delete: { name: 'حذف', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
  login: { name: 'تسجيل دخول', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
  logout: { name: 'تسجيل خروج', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
  view: { name: 'عرض', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' },
  export: { name: 'تصدير', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300' },
};

// Removed mock activities; data now fetched from backend

export default function Activities() {
  const { user: currentUser } = useAuth();
  const [, setLocation] = useLocation();
  // Simple guard
  if (currentUser && (!canAccessPage(currentUser.role, 'activities') || !canRead(currentUser.role, 'activities'))) {
    setLocation('/dashboard/not-found');
  }
  const [selectedType, setSelectedType] = useState("all");
  const [selectedAction, setSelectedAction] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState("last-7-days");

  const { data: users } = useQuery({
    queryKey: ['/api/users'],
    queryFn: () => apiGet('/api/users'),
  });

  const { data: rawActivities, isLoading } = useQuery({
    queryKey: ['/api/activities'],
    queryFn: () => apiGet('/api/activities'),
  });

  // Map backend shape to UI shape
  const activities = useMemo(() => {
    if (!rawActivities) return [];
    return rawActivities.map((a: any) => {
      const user = users?.find((u: any) => u.id === a.userId);
      return {
        id: a.id,
        type: a.entityType, // mapping entityType -> filter type
        action: a.action,
        userId: a.userId,
        userName: user?.fullName || 'مستخدم',
        userRole: user?.role || 'unknown',
        description: a.description,
        resourceId: a.entityId,
        createdAt: a.createdAt,
      };
    });
  }, [rawActivities, users]);

  const filteredActivities = activities.filter((activity: any) => {
    const matchesType = selectedType === 'all' || activity.type === selectedType;
    const matchesAction = selectedAction === 'all' || activity.action === selectedAction;
    const matchesSearch = 
      activity.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (activity.resourceId || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesAction && matchesSearch;
  }) || [];

  const getActivityIcon = (type: string, action: string) => {
    const typeConfig = activityTypes.find(t => t.key === type);
    if (action === 'create') return 'bi-plus-circle';
    if (action === 'update') return 'bi-pencil-square';
    if (action === 'delete') return 'bi-trash';
    if (action === 'login') return 'bi-box-arrow-in-right';
    if (action === 'logout') return 'bi-box-arrow-right';
    return typeConfig?.icon || 'bi-activity';
  };

  const getUserRoleName = (role: string) => {
    const roleNames: Record<string, string> = {
      admin: 'مدير النظام',
      manager: 'مدير مركز',
      technician: 'فني',
      receptionist: 'موظف استقبال',
      warehouse_manager: 'مدير مخزن',
      customer: 'عميل'
    };
    return roleNames[role] || role;
  };

  const exportActivities = () => {
    // Mock export functionality
    console.log('Exporting activities...');
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">سجل الأنشطة</h1>
          <p className="text-muted-foreground">مراقبة جميع الأنشطة والعمليات في النظام</p>
        </div>
        <Button variant="outline" onClick={exportActivities} data-testid="button-export-activities">
          <i className="bi bi-download mr-2"></i>
          تصدير السجل
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="block text-sm font-medium text-card-foreground mb-2">نوع النشاط</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger data-testid="select-activity-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {activityTypes.map((type) => (
                    <SelectItem key={type.key} value={type.key}>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <i className={`bi ${type.icon}`}></i>
                        <span>{type.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="block text-sm font-medium text-card-foreground mb-2">نوع العملية</Label>
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger data-testid="select-action-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع العمليات</SelectItem>
                  {Object.entries(actionTypes).map(([key, action]) => (
                    <SelectItem key={key} value={key}>
                      {action.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="block text-sm font-medium text-card-foreground mb-2">الفترة الزمنية</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger data-testid="select-date-range">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">اليوم</SelectItem>
                  <SelectItem value="yesterday">أمس</SelectItem>
                  <SelectItem value="last-7-days">آخر 7 أيام</SelectItem>
                  <SelectItem value="last-30-days">آخر 30 يوم</SelectItem>
                  <SelectItem value="this-month">هذا الشهر</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="block text-sm font-medium text-card-foreground mb-2">البحث</Label>
              <Input
                placeholder="البحث في الأنشطة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-right"
                data-testid="input-search-activities"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-10 h-10 bg-chart-1/10 rounded-lg flex items-center justify-center">
                <i className="bi bi-activity text-chart-1"></i>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الأنشطة</p>
                <p className="text-2xl font-bold">{activities.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-10 h-10 bg-chart-2/10 rounded-lg flex items-center justify-center">
                <i className="bi bi-calendar-day text-chart-2"></i>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">أنشطة اليوم</p>
                <p className="text-2xl font-bold">
                  {activities.filter((a: any) => {
                    const today = new Date().toDateString();
                    return new Date(a.createdAt).toDateString() === today;
                  }).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-10 h-10 bg-chart-3/10 rounded-lg flex items-center justify-center">
                <i className="bi bi-people text-chart-3"></i>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">مستخدمين نشطين</p>
                <p className="text-2xl font-bold">
                  {new Set(activities.map((a: any) => a.userId)).size || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-10 h-10 bg-chart-4/10 rounded-lg flex items-center justify-center">
                <i className="bi bi-shield-check text-chart-4"></i>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">عمليات تسجيل دخول</p>
                <p className="text-2xl font-bold">
                  {activities.filter((a: any) => a.action === 'login').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activities List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>سجل الأنشطة</span>
            <span className="text-sm font-normal text-muted-foreground">
              عرض {filteredActivities.length} من {activities.length || 0} نشاط
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="loading-spinner mx-auto"></div>
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد أنشطة تطابق المعايير المحددة
              </div>
            ) : (
              filteredActivities.map((activity: any) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-4 space-x-reverse p-4 rounded-lg border hover:bg-muted/30 transition-colors"
                  data-testid={`activity-item-${activity.id}`}
                >
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <i className={`bi ${getActivityIcon(activity.type, activity.action)} text-primary`}></i>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <h4 className="font-medium text-card-foreground">
                          {activity.userName}
                        </h4>
                        <Badge className={actionTypes[activity.action as keyof typeof actionTypes]?.color}>
                          {actionTypes[activity.action as keyof typeof actionTypes]?.name}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {getUserRoleName(activity.userRole)}
                        </span>
                      </div>
                      <time className="text-sm text-muted-foreground">
                        {format(new Date(activity.createdAt), 'dd MMM yyyy HH:mm', { locale: ar })}
                      </time>
                    </div>

                    <p className="text-sm text-card-foreground mb-2">
                      {activity.description}
                    </p>

                    {activity.resourceId && (
                      <div className="flex items-center space-x-4 space-x-reverse text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1 space-x-reverse">
                          <i className="bi bi-link-45deg"></i>
                          <span>المعرف: {activity.resourceId}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {filteredActivities.length > 0 && (
            <div className="mt-6 flex items-center justify-center">
              <Button variant="outline" data-testid="button-load-more">
                <i className="bi bi-arrow-down-circle mr-2"></i>
                تحميل المزيد
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
