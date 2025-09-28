import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWebSocket } from "@/hooks/use-websocket";
import { apiGet } from "../lib/db";
import { useAuth } from "../lib/auth";
import { canAccessPage } from "../lib/permissions";
import ShortageNotifications from "@/components/ui/shortage-notifications";

export default function Dashboard() {
  const { user: currentUser } = useAuth();
  const [, setLocation] = useLocation();
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Enable real-time updates
  const { isConnected } = useWebSocket();

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "صباح الخير";
    if (hour < 17) return "مساء الخير"; 
    return "مساء الخير";
  };

  const getGreetingIcon = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "bi-sun";
    if (hour < 17) return "bi-sun-fill";
    return "bi-moon-stars";
  };

  // Auto-update data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

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
      <div className="mb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-lg opacity-50"></div>
        <div className="relative p-6 bg-white/80 backdrop-blur-sm rounded-lg border shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <i className={`bi ${getGreetingIcon()} text-white`}></i>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {getGreeting()}، {currentUser?.fullName || 'مستخدم'}
                  </h1>
                  <p className="text-muted-foreground">
                    {currentUser?.role === 'technician' ? 'نظرة عامة على مهامك وإنجازاتك' : 
                     currentUser?.role === 'manager' ? `نظرة عامة على أداء ${userCenter?.name || 'مركزك'}` : 'نظرة عامة على أداء النظام'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setLastUpdated(new Date());
                  window.location.reload();
                }}
                className="px-3 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors duration-200 text-sm font-medium flex items-center gap-2"
              >
                <i className="bi bi-arrow-clockwise"></i>
                تحديث
              </button>
              
              {isConnected && (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse status-indicator"></div>
                  <span className="text-xs text-green-700 font-medium">متصل</span>
                </div>
              )}
              
              <div className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('ar-EG', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
                <div className="text-xs mt-1">
                  آخر تحديث: {lastUpdated.toLocaleTimeString('ar-EG')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {currentUser?.role === 'technician' ? (
          <>
            <Card className="hover-scale dashboard-metric-card" data-testid="card-total-requests">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">إجمالي طلباتي</p>
                    <p className="text-2xl font-bold text-card-foreground">{stats?.totalRequests || 0}</p>
                    <p className="text-xs text-chart-2 mt-1">كل الطلبات المسندة إليك</p>
                  </div>
                  <div className="w-12 h-12 bg-chart-1/10 rounded-lg flex items-center justify-center dashboard-quick-action">
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
      
      {/* إضافة مكون النواقص للجميع */}
      <div className="mb-8">
        <ShortageNotifications />
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

      {/* Advanced Analytics Section */}
      {currentUser?.role !== 'technician' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Performance Chart */}
          <Card className="hover-scale">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <i className="bi bi-graph-up text-white"></i>
                </div>
                تحليل الأداء
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                      <i className="bi bi-trending-up text-white"></i>
                    </div>
                    <div>
                      <p className="font-medium text-green-800">معدل الإنجاز</p>
                      <p className="text-sm text-green-600">تحسن بنسبة 15% هذا الشهر</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-green-700">94%</div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                      <i className="bi bi-clock-history text-white"></i>
                    </div>
                    <div>
                      <p className="font-medium text-blue-800">متوسط وقت الاستجابة</p>
                      <p className="text-sm text-blue-600">أسرع بـ 20% من الشهر الماضي</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-blue-700">2.4 س</div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
                      <i className="bi bi-star-fill text-white"></i>
                    </div>
                    <div>
                      <p className="font-medium text-purple-800">رضا العملاء</p>
                      <p className="text-sm text-purple-600">تقييم ممتاز من العملاء</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-purple-700">4.8/5</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="hover-scale">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <i className="bi bi-lightning text-white"></i>
                </div>
                الإجراءات السريعة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setLocation('/dashboard/service-requests')}
                  className="p-4 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg hover:shadow-md transition-all duration-200 group"
                >
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto bg-green-500 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <i className="bi bi-plus-circle text-white text-lg"></i>
                    </div>
                    <p className="text-sm font-medium text-green-700">طلب جديد</p>
                  </div>
                </button>
                
                <button
                  onClick={() => setLocation('/dashboard/reports')}
                  className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg hover:shadow-md transition-all duration-200 group"
                >
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto bg-blue-500 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <i className="bi bi-file-earmark-text text-white text-lg"></i>
                    </div>
                    <p className="text-sm font-medium text-blue-700">التقارير</p>
                  </div>
                </button>
                
                <button
                  onClick={() => setLocation('/dashboard/inventory')}
                  className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg hover:shadow-md transition-all duration-200 group"
                >
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto bg-orange-500 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <i className="bi bi-box-seam text-white text-lg"></i>
                    </div>
                    <p className="text-sm font-medium text-orange-700">المخزون</p>
                  </div>
                </button>
                
                <button
                  onClick={() => setLocation('/dashboard/system-admin')}
                  className="p-4 bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg hover:shadow-md transition-all duration-200 group"
                >
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto bg-red-500 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <i className="bi bi-gear text-white text-lg"></i>
                    </div>
                    <p className="text-sm font-medium text-red-700">الإعدادات</p>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* System Status and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* System Health */}
        <Card className="hover-scale bg-gradient-to-br from-white to-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <i className="bi bi-shield-check text-white"></i>
              </div>
              حالة النظام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-700">الخوادم</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-700">متصلة</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-700">قاعدة البيانات</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-700">طبيعية</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-700">النسخ الاحتياطي</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-700">محدثة</span>
                </div>
              </div>
              {isConnected && (
                <div className="mt-3 p-2 bg-green-100 rounded-lg">
                  <div className="flex items-center gap-2">
                    <i className="bi bi-wifi text-green-600"></i>
                    <span className="text-xs text-green-700">متصل - تحديث مباشر</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card className="hover-scale bg-gradient-to-br from-white to-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                <i className="bi bi-exclamation-triangle text-white"></i>
              </div>
              التنبيهات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.lowStockItems && stats.lowStockItems > 0 ? (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <i className="bi bi-box-seam text-orange-600"></i>
                    <div>
                      <p className="text-sm font-medium text-orange-800">مخزون منخفض</p>
                      <p className="text-xs text-orange-600">{stats.lowStockItems} صنف يحتاج تجديد</p>
                    </div>
                  </div>
                </div>
              ) : null}
              
              {stats?.pendingRequests && stats.pendingRequests > 5 ? (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <i className="bi bi-clock-history text-red-600"></i>
                    <div>
                      <p className="text-sm font-medium text-red-800">طلبات معلقة</p>
                      <p className="text-xs text-red-600">{stats.pendingRequests} طلب في الانتظار</p>
                    </div>
                  </div>
                </div>
              ) : null}
              
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <i className="bi bi-info-circle text-blue-600"></i>
                  <div>
                    <p className="text-sm font-medium text-blue-800">النظام محدث</p>
                    <p className="text-xs text-blue-600">آخر تحديث: اليوم</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Summary */}
        <Card className="hover-scale bg-gradient-to-br from-white to-purple-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <i className="bi bi-graph-up text-white"></i>
              </div>
              إحصائيات سريعة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                <span className="text-sm text-purple-700">معدل النجاح</span>
                <span className="text-sm font-bold text-purple-800">98.5%</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                <span className="text-sm text-purple-700">وقت الاستجابة</span>
                <span className="text-sm font-bold text-purple-800">2.1 ساعة</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                <span className="text-sm text-purple-700">عدد العملاء</span>
                <span className="text-sm font-bold text-purple-800">{stats?.totalCustomers || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                <span className="text-sm text-purple-700">المشاريع النشطة</span>
                <span className="text-sm font-bold text-purple-800">{stats?.activeProjects || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Section Enhancement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="hover-scale">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <i className="bi bi-clock-history text-white"></i>
                </div>
                الطلبات الحديثة
              </div>
              <button 
                onClick={() => setLocation('/dashboard/service-requests')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                عرض الكل →
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentRequests && recentRequests.length > 0 ? recentRequests.slice(0, 5).map((request: any) => (
                <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => setLocation(`/dashboard/service-requests?id=${request.id}`)}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      request.status === 'pending' ? 'bg-orange-100' : 
                      request.status === 'in_progress' ? 'bg-blue-100' : 
                      request.status === 'completed' ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <i className={`bi ${
                        request.status === 'pending' ? 'bi-clock' : 
                        request.status === 'in_progress' ? 'bi-gear' : 
                        request.status === 'completed' ? 'bi-check-circle' : 'bi-question-circle'
                      } ${
                        request.status === 'pending' ? 'text-orange-600' : 
                        request.status === 'in_progress' ? 'text-blue-600' : 
                        request.status === 'completed' ? 'text-green-600' : 'text-gray-600'
                      }`}></i>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{request.title || request.description}</p>
                      <p className="text-xs text-gray-600">{request.customerName || 'عميل'} • منذ {request.timeAgo || '5 دقائق'}</p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    request.status === 'pending' ? 'bg-orange-200 text-orange-800' : 
                    request.status === 'in_progress' ? 'bg-blue-200 text-blue-800' : 
                    request.status === 'completed' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'
                  }`}>
                    {request.status === 'pending' ? 'قيد الانتظار' : 
                     request.status === 'in_progress' ? 'قيد التنفيذ' : 
                     request.status === 'completed' ? 'مكتمل' : 'غير محدد'}
                  </div>
                </div>
              )) : (
                <p className="text-center text-muted-foreground py-8">لا توجد طلبات حديثة</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <i className="bi bi-activity text-white"></i>
                </div>
                الأنشطة الأخيرة
              </div>
              <button 
                onClick={() => setLocation('/dashboard/activities')}
                className="text-xs text-teal-600 hover:text-teal-800 font-medium"
              >
                عرض الكل →
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities && recentActivities.length > 0 ? recentActivities.slice(0, 5).map((activity: any, index: number) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                    <i className={`bi ${activity.icon || 'bi-activity'} text-teal-600`}></i>
                  </div>
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

      {/* Footer Information */}
      <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">مرحباً بك في نظام إدارة الخدمات المتقدم</h3>
          <p className="text-gray-600 text-sm mb-4">
            نظام شامل لإدارة طلبات الصيانة والمخزون ومراكز الخدمة مع تحليلات متقدمة وتقارير مفصلة
          </p>
          <div className="flex justify-center gap-4">
            <button 
              onClick={() => setLocation('/dashboard/unified')}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 text-sm font-medium"
            >
              الإدارة الموحدة المتقدمة
            </button>
            <button 
              onClick={() => setLocation('/dashboard/system-admin')}
              className="px-6 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:from-green-600 hover:to-teal-600 transition-all duration-200 text-sm font-medium"
            >
              إدارة النظام
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
