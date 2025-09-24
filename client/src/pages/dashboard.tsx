import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWebSocket } from "@/hooks/use-websocket";
import { apiGet } from "../lib/db";
import { useAuth } from "../lib/auth";
import { canAccessPage } from "../lib/permissions";

export default function Dashboard() {
  const { user: currentUser } = useAuth();
  const [, setLocation] = useLocation();

  // Enable real-time updates
  const { isConnected } = useWebSocket();

  // Redirect customers away from dashboard
  useEffect(() => {
    if (currentUser && !canAccessPage(currentUser.role, 'dashboard')) {
      setLocation('/dashboard/service-requests');
    }
  }, [currentUser, setLocation]);
  
  const { data: stats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: () => apiGet('/api/dashboard/stats'),
  });

  const { data: recentRequests } = useQuery({
    queryKey: ['/api/dashboard/recent-requests'],
    queryFn: () => apiGet('/api/dashboard/recent-requests'),
  });

  const { data: recentActivities } = useQuery({
    queryKey: ['/api/dashboard/recent-activities'],
    queryFn: () => apiGet('/api/dashboard/recent-activities'),
  });

  const { data: userCenter } = useQuery({
    queryKey: ['/api/service-centers', currentUser?.centerId],
    queryFn: () => currentUser?.centerId ? apiGet(`/api/service-centers/${currentUser.centerId}`) : Promise.resolve(null),
    enabled: !!currentUser?.centerId,
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">لوحة التحكم</h1>
        <p className="text-muted-foreground">
          {currentUser?.role === 'technician' ? 'نظرة عامة على مهامك وإنجازاتك' : 
           currentUser?.role === 'manager' ? `نظرة عامة على أداء ${userCenter?.name || 'مركزك'}` : 'نظرة عامة على أداء النظام'}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {currentUser?.role === 'technician' ? (
          <>
            <Card className="hover-scale" data-testid="card-total-requests">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">إجمالي طلباتي</p>
                    <p className="text-2xl font-bold text-card-foreground">{stats?.totalRequests || 0}</p>
                    <p className="text-xs text-chart-2 mt-1">كل الطلبات المسندة إليك</p>
                  </div>
                  <div className="w-12 h-12 bg-chart-1/10 rounded-lg flex items-center justify-center">
                    <i className="bi bi-clipboard-check text-xl text-chart-1"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover-scale" data-testid="card-pending-requests">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">في الانتظار</p>
                    <p className="text-2xl font-bold text-card-foreground">{stats?.pendingRequests || 0}</p>
                    <p className="text-xs text-orange-500 mt-1">بحاجة للبدء</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <i className="bi bi-clock-history text-xl text-orange-500"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover-scale" data-testid="card-in-progress-requests">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">قيد التنفيذ</p>
                    <p className="text-2xl font-bold text-card-foreground">{stats?.inProgressRequests || 0}</p>
                    <p className="text-xs text-blue-500 mt-1">العمل جارٍ عليها</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <i className="bi bi-gear-fill text-xl text-blue-500"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover-scale" data-testid="card-completed-requests">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">مكتملة</p>
                    <p className="text-2xl font-bold text-card-foreground">{stats?.completedRequests || 0}</p>
                    <p className="text-xs text-green-500 mt-1">تم إنجازها بنجاح</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <i className="bi bi-check-circle-fill text-xl text-green-500"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : currentUser?.role === 'manager' ? (
          <>
            <Card className="hover-scale" data-testid="card-center-users">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">مستخدمي المركز</p>
                    <p className="text-2xl font-bold text-card-foreground">{stats?.totalUsers || 0}</p>
                    <p className="text-xs text-chart-2 mt-1">الموظفين في مركزك</p>
                  </div>
                  <div className="w-12 h-12 bg-chart-1/10 rounded-lg flex items-center justify-center">
                    <i className="bi bi-people text-xl text-chart-1"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover-scale" data-testid="card-center-requests">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">طلبات المركز</p>
                    <p className="text-2xl font-bold text-card-foreground">{stats?.serviceRequests || 0}</p>
                    <p className="text-xs text-chart-3 mt-1">كل طلبات الصيانة</p>
                  </div>
                  <div className="w-12 h-12 bg-chart-2/10 rounded-lg flex items-center justify-center">
                    <i className="bi bi-tools text-xl text-chart-2"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover-scale" data-testid="card-center-only">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">مركز الخدمة</p>
                    <p className="text-2xl font-bold text-card-foreground">{stats?.serviceCenters || 1}</p>
                    <p className="text-xs text-chart-4 mt-1">مركزك فقط</p>
                  </div>
                  <div className="w-12 h-12 bg-chart-3/10 rounded-lg flex items-center justify-center">
                    <i className="bi bi-building text-xl text-chart-3"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover-scale" data-testid="card-center-revenue">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">إيرادات المركز</p>
                    <p className="text-2xl font-bold text-card-foreground">{stats?.revenue || 0} ج.م</p>
                    <p className="text-xs text-chart-5 mt-1">من طلبات مركزك</p>
                  </div>
                  <div className="w-12 h-12 bg-chart-4/10 rounded-lg flex items-center justify-center">
                    <i className="bi bi-currency-dollar text-xl text-chart-4"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card className="hover-scale" data-testid="card-total-users">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">إجمالي المستخدمين</p>
                    <p className="text-2xl font-bold text-card-foreground">{stats?.totalUsers || 0}</p>
                    <p className="text-xs text-chart-2 mt-1">+12% من الشهر الماضي</p>
                  </div>
                  <div className="w-12 h-12 bg-chart-1/10 rounded-lg flex items-center justify-center">
                    <i className="bi bi-people text-xl text-chart-1"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover-scale" data-testid="card-service-requests">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">طلبات الصيانة</p>
                    <p className="text-2xl font-bold text-card-foreground">{stats?.serviceRequests || 0}</p>
                    <p className="text-xs text-chart-3 mt-1">+5% من الشهر الماضي</p>
                  </div>
                  <div className="w-12 h-12 bg-chart-2/10 rounded-lg flex items-center justify-center">
                    <i className="bi bi-tools text-xl text-chart-2"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover-scale" data-testid="card-service-centers">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">مراكز الخدمة</p>
                    <p className="text-2xl font-bold text-card-foreground">{stats?.serviceCenters || 0}</p>
                    <p className="text-xs text-chart-4 mt-1">+2 مراكز جديدة</p>
                  </div>
                  <div className="w-12 h-12 bg-chart-3/10 rounded-lg flex items-center justify-center">
                    <i className="bi bi-building text-xl text-chart-3"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover-scale" data-testid="card-revenue">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">الإيرادات</p>
                    <p className="text-2xl font-bold text-card-foreground">{stats?.revenue || 0} ج.م</p>
                    <p className="text-xs text-chart-5 mt-1">+18% من الشهر الماضي</p>
                  </div>
                  <div className="w-12 h-12 bg-chart-4/10 rounded-lg flex items-center justify-center">
                    <i className="bi bi-currency-dollar text-xl text-chart-4"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card data-testid="card-recent-requests">
          <CardHeader>
            <CardTitle>
              {currentUser?.role === 'technician' ? 'طلبات الصيانة المسندة إليك' : 
               currentUser?.role === 'manager' ? 'أحدث طلبات الصيانة في مركزك' : 'أحدث طلبات الصيانة'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentRequests?.length ? recentRequests.slice(0,5).map((request: any) => (
                <div key={request.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <i className="bi bi-tools text-primary"></i>
                    </div>
                    <div>
                      <p className="font-medium text-card-foreground">{request.deviceName}</p>
                      <p className="text-sm text-muted-foreground">
                        {request.requestNumber} - {request.customerName || 'عميل'}
                      </p>
                    </div>
                  </div>
                  <span className={`status-badge status-${request.status}`}>
                    {request.status === 'pending' ? 'في الانتظار' : 
                     request.status === 'in_progress' ? 'قيد التنفيذ' : 
                     request.status === 'completed' ? 'مكتمل' : 'ملغي'}
                  </span>
                </div>
              )) : (
                <p className="text-center text-muted-foreground py-8">
                  {currentUser?.role === 'technician' ? 'لا توجد طلبات مسندة إليك' : 'لا توجد طلبات حديثة'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card data-testid="card-recent-activities">
          <CardHeader>
            <CardTitle>
              {currentUser?.role === 'technician' ? 'أنشطتك الأخيرة' : 'آخر الأنشطة'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities?.length ? recentActivities.slice(0, 5).map((activity: any) => (
          <div key={activity.id} className="flex items-start space-x-4 space-x-reverse">
            <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
            <div className="flex-1">
              <p className="text-sm text-card-foreground">{activity.description}</p>
              <p className="text-xs text-muted-foreground mt-1">{activity.timestamp || new Date(activity.createdAt).toLocaleString('ar-EG')}</p>
            </div>
          </div>
              )) : (
          <p className="text-center text-muted-foreground py-8">
            {currentUser?.role === 'technician' ? 'لا توجد أنشطة لك حتى الآن' : 'لا توجد أنشطة حديثة'}
          </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
