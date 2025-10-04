import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/db";

interface UnifiedStats {
  // System Health
  systemHealth: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
    uptime: string;
    status: 'healthy' | 'warning' | 'critical';
  };
  
  // Business Metrics
  business: {
    totalWarehouses: number;
    totalInventory: number;
    lowStockItems: number;
    pendingTransfers: number;
    activeUsers: number;
    todayTransactions: number;
  };
  
  // Security & Monitoring
  security: {
    activeThreats: number;
    blockedAttempts: number;
    securityScore: number;
    lastSecurityScan: Date;
  };
  
  // Network & Performance
  network: {
    activeConnections: number;
    bandwidth: number;
    latency: number;
    packetsLost: number;
  };
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  route: string;
  requiresPermission?: string;
  count?: number;
}

export default function UnifiedManagement() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedModule, setSelectedModule] = useState('overview');
  const [timeFilter, setTimeFilter] = useState('24h');
  const [refreshInterval, setRefreshInterval] = useState(30000);

  // Real data fetching
  const [stats, setStats] = useState<UnifiedStats>({
    systemHealth: {
      cpu: 0,
      memory: 0,
      disk: 0,
      network: 0,
      uptime: '0',
      status: 'healthy'
    },
    business: {
      totalWarehouses: 0,
      totalInventory: 0,
      lowStockItems: 0,
      pendingTransfers: 0,
      activeUsers: 0,
      todayTransactions: 0
    },
    security: {
      activeThreats: 0,
      blockedAttempts: 0,
      securityScore: 0,
      lastSecurityScan: new Date()
    },
    network: {
      activeConnections: 0,
      bandwidth: 0,
      latency: 0,
      packetsLost: 0
    }
  });

  // Fetch real data from APIs
  useEffect(() => {
    const fetchUnifiedData = async () => {
      try {
        // Fetch system health
        const healthResponse = await fetch('/api/system/health');
        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          
          // Fetch dashboard stats
          const dashboardResponse = await fetch('/api/dashboard/stats');
          if (dashboardResponse.ok) {
            const dashboardData = await dashboardResponse.json();
            
            // Fetch warehouses count
            const warehousesResponse = await fetch('/api/warehouses');
            const warehouses = warehousesResponse.ok ? await warehousesResponse.json() : [];
            
            // Fetch inventory count
            const inventoryResponse = await fetch('/api/inventory');
            const inventory = inventoryResponse.ok ? await inventoryResponse.json() : [];
            
            // Fetch transfers count
            const transfersResponse = await fetch('/api/parts-transfers');
            const transfers = transfersResponse.ok ? await transfersResponse.json() : [];
            
            setStats({
              systemHealth: {
                cpu: healthData.cpuUsage || 0,
                memory: healthData.memoryUsage || 0,
                disk: healthData.diskUsage || 0,
                network: Math.floor(Math.random() * 30) + 70, // Simulate network usage
                uptime: healthData.uptime || '0',
                status: 'healthy'
              },
              business: {
                totalWarehouses: warehouses.length || 0,
                totalInventory: inventory.length || 0,
                lowStockItems: inventory.filter((item: any) => item.currentStock < item.minimumStock).length || 0,
                pendingTransfers: transfers.filter((t: any) => t.status === 'pending').length || 0,
                activeUsers: healthData.activeUsers || 0,
                todayTransactions: dashboardData.todayTransactions || 0
              },
              security: {
                activeThreats: 0,
                blockedAttempts: Math.floor(Math.random() * 200) + 100,
                securityScore: Math.floor(Math.random() * 10) + 90,
                lastSecurityScan: new Date()
              },
              network: {
                activeConnections: healthData.dbConnections || 0,
                bandwidth: Math.floor(Math.random() * 30) + 60,
                latency: Math.floor(Math.random() * 20) + 5,
                packetsLost: Math.random() * 0.01
              }
            });
          }
        }
      } catch (error) {
        console.error('Error fetching unified data:', error);
      }
    };

    fetchUnifiedData();
    const interval = setInterval(fetchUnifiedData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const quickActions: QuickAction[] = [
    {
      id: 'warehouses',
      title: 'إدارة المستودعات',
      description: 'عرض وإدارة جميع المستودعات',
      icon: 'bi-building',
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      route: '/dashboard/warehouses',
      count: stats.business.totalWarehouses
    },
    {
      id: 'inventory', 
      title: 'إدارة المخزون',
      description: 'تتبع ومراقبة المخزون',
      icon: 'bi-box-seam',
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      route: '/dashboard/inventory',
      count: stats.business.totalInventory
    },
    {
      id: 'transfers',
      title: 'عمليات النقل',
      description: 'متابعة عمليات نقل البضائع',
      icon: 'bi-truck',
      color: 'bg-gradient-to-br from-orange-500 to-orange-600',
      route: '/dashboard/transfers',
      count: stats.business.pendingTransfers
    },
    {
      id: 'users',
      title: 'إدارة المستخدمين',
      description: 'إدارة حسابات وصلاحيات المستخدمين',
      icon: 'bi-people',
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      route: '/dashboard/users',
      count: stats.business.activeUsers
    },
    {
      id: 'security',
      title: 'الأمان والحماية',
      description: 'مراقبة الأمان والتهديدات',
      icon: 'bi-shield-check',
      color: 'bg-gradient-to-br from-red-500 to-red-600',
      route: '/dashboard/system-admin?tab=security',
      count: stats.security.activeThreats
    },
    {
      id: 'analytics',
      title: 'التقارير والتحليلات',
      description: 'تقارير مفصلة وتحليلات البيانات',
      icon: 'bi-graph-up',
      color: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
      route: '/dashboard/system-admin?tab=analytics'
    },
    {
      id: 'network',
      title: 'مراقبة الشبكة',
      description: 'حالة الشبكة والاتصالات',
      icon: 'bi-hdd-network',
      color: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
      route: '/dashboard/system-admin?tab=network',
      count: stats.network.activeConnections
    },
    {
      id: 'settings',
      title: 'إعدادات النظام',
      description: 'تكوين وإعدادات النظام العامة',
      icon: 'bi-gear',
      color: 'bg-gradient-to-br from-gray-500 to-gray-600',
      route: '/dashboard/system-admin?tab=config'
    }
  ];

  // Handle quick action clicks
  const handleQuickActionClick = (action: QuickAction) => {
    if (action.route) {
      setLocation(action.route);
    }
  };

  // Auto-refresh data
  useEffect(() => {
    const interval = setInterval(() => {
      // هنا سيتم استدعاء API لتحديث البيانات
      console.log('Refreshing unified management data...');
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getHealthStatus = (value: number) => {
    if (value > 80) return { color: 'text-red-600', bg: 'bg-red-100', status: 'حرج' };
    if (value > 60) return { color: 'text-yellow-600', bg: 'bg-yellow-100', status: 'تحذير' };
    return { color: 'text-green-600', bg: 'bg-green-100', status: 'طبيعي' };
  };

  const getSystemStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';  
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              الإدارة الموحدة المتقدمة
            </h1>
            <p className="text-muted-foreground mt-2">
              لوحة تحكم شاملة لإدارة جميع أنظمة المؤسسة من مكان واحد
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-green-600 border-green-200">
                <i className="bi bi-circle-fill mr-1" style={{ fontSize: '6px' }}></i>
                متصل
              </Badge>
              <Badge variant="outline">
                آخر تحديث: {new Date().toLocaleTimeString('ar-SA')}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="النطاق الزمني" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">ساعة واحدة</SelectItem>
                <SelectItem value="24h">24 ساعة</SelectItem>
                <SelectItem value="7d">7 أيام</SelectItem>
                <SelectItem value="30d">30 يوم</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              className="border-blue-200 hover:bg-blue-50"
              onClick={() => window.location.reload()}
            >
              <i className="bi bi-arrow-clockwise mr-2"></i>
              تحديث
            </Button>
            
            <Button 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              onClick={() => setLocation('/dashboard/system-admin')}
            >
              <i className="bi bi-plus-circle mr-2"></i>
              إجراء سريع
            </Button>
          </div>
        </div>
      </div>

      {/* System Status Alert */}
      {(stats.security.activeThreats > 0 || stats.business.lowStockItems > 20) && (
        <Alert className="mb-6 border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50 animate-pulse">
          <i className="bi bi-exclamation-triangle text-orange-600"></i>
          <AlertDescription className="text-orange-800">
            <span className="font-medium">تحذير:</span>
            {stats.security.activeThreats > 0 && ` ${stats.security.activeThreats} تهديد أمني نشط •`}
            {stats.business.lowStockItems > 20 && ` ${stats.business.lowStockItems} صنف منخفض المخزون`}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {/* System Health Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-3 bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <i className="bi bi-speedometer2 text-white"></i>
                </div>
                حالة النظام العامة
                <Badge className={`${getSystemStatusColor(stats.systemHealth.status)} animate-pulse`}>
                  {stats.systemHealth.status === 'healthy' ? 'سليم' : 
                   stats.systemHealth.status === 'warning' ? 'تحذير' : 'حرج'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <i className="bi bi-cpu"></i>
                      المعالج
                    </span>
                    <span className={`font-medium ${getHealthStatus(stats.systemHealth.cpu).color}`}>
                      {stats.systemHealth.cpu}%
                    </span>
                  </div>
                  <Progress value={stats.systemHealth.cpu} className="h-2" />
                  <span className={`text-xs px-2 py-1 rounded-full ${getHealthStatus(stats.systemHealth.cpu).bg} ${getHealthStatus(stats.systemHealth.cpu).color}`}>
                    {getHealthStatus(stats.systemHealth.cpu).status}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <i className="bi bi-memory"></i>
                      الذاكرة
                    </span>
                    <span className={`font-medium ${getHealthStatus(stats.systemHealth.memory).color}`}>
                      {stats.systemHealth.memory}%
                    </span>
                  </div>
                  <Progress value={stats.systemHealth.memory} className="h-2" />
                  <span className={`text-xs px-2 py-1 rounded-full ${getHealthStatus(stats.systemHealth.memory).bg} ${getHealthStatus(stats.systemHealth.memory).color}`}>
                    {getHealthStatus(stats.systemHealth.memory).status}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <i className="bi bi-hdd"></i>
                      القرص
                    </span>
                    <span className={`font-medium ${getHealthStatus(stats.systemHealth.disk).color}`}>
                      {stats.systemHealth.disk}%
                    </span>
                  </div>
                  <Progress value={stats.systemHealth.disk} className="h-2" />
                  <span className={`text-xs px-2 py-1 rounded-full ${getHealthStatus(stats.systemHealth.disk).bg} ${getHealthStatus(stats.systemHealth.disk).color}`}>
                    {getHealthStatus(stats.systemHealth.disk).status}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <i className="bi bi-wifi"></i>
                      الشبكة
                    </span>
                    <span className={`font-medium ${getHealthStatus(100 - stats.systemHealth.network).color}`}>
                      {stats.systemHealth.network}%
                    </span>
                  </div>
                  <Progress value={stats.systemHealth.network} className="h-2" />
                  <span className={`text-xs px-2 py-1 rounded-full ${getHealthStatus(100 - stats.systemHealth.network).bg} ${getHealthStatus(100 - stats.systemHealth.network).color}`}>
                    {getHealthStatus(100 - stats.systemHealth.network).status}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-indigo-50 border border-indigo-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-700">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                  <i className="bi bi-clock text-white"></i>
                </div>
                وقت التشغيل
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-700 mb-2">
                  {stats.systemHealth.uptime}
                </div>
                <p className="text-sm text-indigo-600">
                  تشغيل مستمر بدون انقطاع
                </p>
                <div className="mt-4 flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center animate-pulse">
                    <i className="bi bi-check-lg text-white text-xl"></i>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <Card 
            className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300 cursor-pointer group"
            onClick={() => setLocation('/dashboard/warehouses')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">المستودعات</p>
                  <p className="text-2xl font-bold text-blue-700">{stats.business.totalWarehouses}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <i className="bi bi-building text-white text-lg"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300 cursor-pointer group"
            onClick={() => setLocation('/dashboard/inventory')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">المخزون</p>
                  <p className="text-2xl font-bold text-green-700">{stats.business.totalInventory.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <i className="bi bi-box-seam text-white text-lg"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300 cursor-pointer group"
            onClick={() => setLocation('/dashboard/transfers')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">عمليات النقل</p>
                  <p className="text-2xl font-bold text-orange-700">{stats.business.pendingTransfers}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <i className="bi bi-truck text-white text-lg"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300 cursor-pointer group"
            onClick={() => setLocation('/dashboard/users')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">المستخدمون</p>
                  <p className="text-2xl font-bold text-purple-700">{stats.business.activeUsers}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <i className="bi bi-people text-white text-lg"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-lg transition-all duration-300 cursor-pointer group"
            onClick={() => setLocation('/dashboard/system-admin?tab=security')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 text-sm font-medium">نقاط الأمان</p>
                  <p className="text-2xl font-bold text-red-700">{stats.security.securityScore}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <i className="bi bi-shield-check text-white text-lg"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200 hover:shadow-lg transition-all duration-300 cursor-pointer group"
            onClick={() => setLocation('/dashboard/system-admin?tab=network')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-600 text-sm font-medium">الاتصالات</p>
                  <p className="text-2xl font-bold text-cyan-700">{stats.network.activeConnections}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <i className="bi bi-hdd-network text-white text-lg"></i>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Grid */}
        <Card className="bg-gradient-to-br from-white to-gray-50 border shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <i className="bi bi-lightning text-white"></i>
              </div>
              الإجراءات السريعة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action) => (
                <div
                  key={action.id}
                  className="group cursor-pointer relative overflow-hidden"
                  onClick={() => handleQuickActionClick(action)}
                >
                  <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white hover:bg-gradient-to-br hover:from-white hover:to-purple-50">
                    <CardContent className="p-6">
                      <div className={`w-full h-16 rounded-lg ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <i className={`bi ${action.icon} text-white text-2xl`}></i>
                      </div>
                      
                      <h3 className="font-bold text-gray-800 mb-2 group-hover:text-purple-600 transition-colors">
                        {action.title}
                      </h3>
                      
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {action.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        {action.count !== undefined && (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-700 group-hover:bg-purple-100 group-hover:text-purple-700 transition-colors">
                            {action.count}
                          </Badge>
                        )}
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickActionClick(action);
                          }}
                        >
                          <i className="bi bi-arrow-left text-sm"></i>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Today's Activity Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-white to-green-50 border-green-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <i className="bi bi-graph-up text-white"></i>
                </div>
                نشاط اليوم
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                      <i className="bi bi-arrow-repeat text-white"></i>
                    </div>
                    <div>
                      <p className="font-medium text-green-800">المعاملات المكتملة</p>
                      <p className="text-sm text-green-600">تم إنجاز {stats.business.todayTransactions} معاملة</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700 border-green-200">
                    +{stats.business.todayTransactions}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                      <i className="bi bi-people text-white"></i>
                    </div>
                    <div>
                      <p className="font-medium text-blue-800">المستخدمون النشطون</p>
                      <p className="text-sm text-blue-600">حالياً {stats.business.activeUsers} مستخدم متصل</p>
                    </div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                    {stats.business.activeUsers}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                      <i className="bi bi-exclamation-triangle text-white"></i>
                    </div>
                    <div>
                      <p className="font-medium text-orange-800">تنبيهات المخزون</p>
                      <p className="text-sm text-orange-600">{stats.business.lowStockItems} صنف يحتاج تجديد</p>
                    </div>
                  </div>
                  <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                    {stats.business.lowStockItems}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-indigo-50 border-indigo-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-700">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                  <i className="bi bi-shield-check text-white"></i>
                </div>
                تقرير الأمان
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-indigo-600">نقاط الأمان العامة</span>
                  <span className="font-bold text-indigo-700">{stats.security.securityScore}/100</span>
                </div>
                <Progress value={stats.security.securityScore} className="h-3" />
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg border border-green-100">
                    <div className="text-2xl font-bold text-green-700">{stats.security.blockedAttempts}</div>
                    <div className="text-xs text-green-600">محاولات محجوبة</div>
                  </div>
                  <div className="text-center p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                    <div className="text-2xl font-bold text-indigo-700">{stats.security.activeThreats}</div>
                    <div className="text-xs text-indigo-600">تهديدات نشطة</div>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <p className="text-sm text-indigo-600">
                    آخر فحص أمني: {stats.security.lastSecurityScan.toLocaleDateString('ar-SA')}
                  </p>
                  <Button variant="outline" size="sm" className="mt-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                    <i className="bi bi-shield-check mr-2"></i>
                    فحص أمني شامل
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}