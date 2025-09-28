import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { NotificationCenter, SystemAlerts, WorkflowProgress } from "@/components/ui/notifications-center";
import { SystemConfigurator } from "@/components/ui/system-configurator";
import { ImportExportManager } from "@/components/ui/import-export-manager";
import { LogViewer } from "@/components/ui/log-viewer";
import { PerformanceAnalytics } from "@/components/ui/performance-analytics";
import { AdvancedPermissionManager } from "@/components/ui/advanced-permission-manager";
import { BackupManager } from "@/components/ui/backup-manager";
import { AlertCenter } from "@/components/ui/alert-center";
import { SecurityDashboard } from "@/components/ui/security-dashboard";
import { NetworkMonitor } from "@/components/ui/network-monitor";
import { UpdateManager } from "@/components/ui/update-manager";
import { useAuth } from "@/lib/auth";
import { hasPermission, type UserRole } from "@/lib/permissions";

interface SystemStats {
  uptime: string;
  memoryUsage: number;
  diskUsage: number;
  cpuUsage: number;
  activeUsers: number;
  totalUsers: number;
  dbConnections: number;
  apiCalls: number;
  lastBackup: Date | null;
  totalProducts?: number;
  lowStockProducts?: number;
}

export default function SystemAdministrationPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  
  // System state
  const [systemStats, setSystemStats] = useState<SystemStats>({
    uptime: '0',
    memoryUsage: 0,
    diskUsage: 0,
    cpuUsage: 0,
    activeUsers: 0,
    totalUsers: 0,
    dbConnections: 0,
    apiCalls: 0,
    lastBackup: null
  });

  // Configuration state
  const [systemConfig, setSystemConfig] = useState({
    system: {
      appName: 'نظام إدارة المؤسسات',
      version: '2.1.0',
      environment: 'production' as 'development' | 'staging' | 'production',
      timezone: 'Asia/Riyadh',
      language: 'ar',
      maintenanceMode: false,
    },
    database: {
      maxConnections: 20,
      connectionTimeout: 30000,
      backupSchedule: 'daily',
      autoBackup: true,
    },
    notifications: {
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: true,
      defaultLanguage: 'ar',
      retryAttempts: 3,
    },
    security: {
      sessionTimeout: 3600,
      maxLoginAttempts: 5,
      passwordMinLength: 8,
      twoFactorRequired: false,
      allowedDomains: ['company.com'],
    },
    features: {
      realtimeUpdates: true,
      darkMode: false,
      exportEnabled: true,
      importEnabled: true,
      auditLogging: true,
    }
  });

  // Sample data for components
  const [notifications] = useState([
    {
      id: '1',
      type: 'warning' as const,
      title: 'مساحة القرص منخفضة',
      message: 'مساحة القرص الصلب أصبحت أقل من 10%',
      timestamp: new Date(),
      priority: 'high' as const,
      action: {
        label: 'تنظيف الملفات',
        onClick: () => console.log('Clean files')
      }
    },
    {
      id: '2',
      type: 'info' as const,
      title: 'تحديث متوفر',
      message: 'إصدار جديد من النظام متوفر للتحديث',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      priority: 'medium' as const,
    }
  ]);

  const [systemAlerts] = useState([
    {
      id: '1',
      level: 'warning' as const,
      message: 'استخدام الذاكرة مرتفع',
      details: 'استخدام الذاكرة وصل إلى 85% من الحد الأقصى',
      timestamp: new Date(),
      resolved: false,
    }
  ]);

  const [workflowSteps] = useState([
    {
      id: '1',
      title: 'إعداد قاعدة البيانات',
      description: 'تكوين الاتصال وإنشاء الجداول',
      status: 'completed' as const,
      estimatedTime: '2 دقائق',
      completedAt: new Date(Date.now() - 1000 * 60 * 10)
    },
    {
      id: '2',
      title: 'تشغيل الخدمات',
      description: 'بدء تشغيل خدمات النظام الأساسية',
      status: 'in_progress' as const,
      estimatedTime: '1 دقيقة'
    },
    {
      id: '3',
      title: 'تهيئة الواجهة',
      description: 'تحميل الواجهة وإعداد المكونات',
      status: 'pending' as const,
      estimatedTime: '30 ثانية'
    }
  ]);

  // Check permissions
  const canManageSystem = user && hasPermission(user.role as UserRole, 'users', 'update');

  if (!canManageSystem) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <i className="bi bi-shield-x text-4xl text-red-500 mb-4"></i>
          <h2 className="text-xl font-semibold mb-2">غير مصرح لك</h2>
          <p className="text-muted-foreground">لا تملك صلاحية الوصول لإدارة النظام</p>
        </div>
      </div>
    );
  }

  // Fetch system stats
  useEffect(() => {
    const fetchSystemStats = async () => {
      try {
        // Simulate fetching system stats
        setSystemStats({
          uptime: '2 أيام، 14 ساعة',
          memoryUsage: 72,
          diskUsage: 45,
          cpuUsage: 23,
          activeUsers: 8,
          totalUsers: 125,
          dbConnections: 12,
          apiCalls: 15420,
          lastBackup: new Date(Date.now() - 1000 * 60 * 60 * 6) // 6 hours ago
        });
      } catch (error) {
        console.error('Error fetching system stats:', error);
      }
    };

    fetchSystemStats();
    const interval = setInterval(fetchSystemStats, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleConfigSave = async () => {
    setIsLoading(true);
    try {
      // Simulate saving configuration
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Configuration saved:', systemConfig);
    } catch (error) {
      console.error('Error saving configuration:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة النظام</h1>
          <p className="text-muted-foreground">لوحة التحكم المتقدمة لإدارة النظام</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="default" className="bg-green-500">
            <i className="bi bi-circle-fill text-xs mr-1 animate-pulse"></i>
            النظام يعمل
          </Badge>
          <Button variant="outline" size="sm">
            <i className="bi bi-arrow-clockwise mr-2"></i>
            تحديث
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 lg:grid-cols-12 gap-1">
          <TabsTrigger value="dashboard" className="flex items-center gap-1 text-xs">
            <i className="bi bi-speedometer2"></i>
            <span className="hidden lg:inline">لوحة التحكم</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-1 text-xs">
            <i className="bi bi-graph-up"></i>
            <span className="hidden lg:inline">التحليلات</span>
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-1 text-xs">
            <i className="bi bi-exclamation-triangle"></i>
            <span className="hidden lg:inline">التنبيهات الذكية</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-1 text-xs">
            <i className="bi bi-bell"></i>
            <span className="hidden lg:inline">الإشعارات</span>
            {notifications.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs">
                {notifications.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-1 text-xs">
            <i className="bi bi-shield-check"></i>
            <span className="hidden lg:inline">الأمان</span>
          </TabsTrigger>
          <TabsTrigger value="network" className="flex items-center gap-1 text-xs">
            <i className="bi bi-hdd-network"></i>
            <span className="hidden lg:inline">الشبكة</span>
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-1 text-xs">
            <i className="bi bi-shield-lock"></i>
            <span className="hidden lg:inline">الصلاحيات</span>
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-1 text-xs">
            <i className="bi bi-gear"></i>
            <span className="hidden lg:inline">الإعدادات</span>
          </TabsTrigger>
          <TabsTrigger value="updates" className="flex items-center gap-1 text-xs">
            <i className="bi bi-arrow-up-circle"></i>
            <span className="hidden lg:inline">التحديثات</span>
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center gap-1 text-xs">
            <i className="bi bi-archive"></i>
            <span className="hidden lg:inline">النسخ الاحتياطية</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-1 text-xs">
            <i className="bi bi-database"></i>
            <span className="hidden lg:inline">البيانات</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-1 text-xs">
            <i className="bi bi-journal-text"></i>
            <span className="hidden lg:inline">السجلات</span>
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6 mt-6">
          {/* System Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">وقت التشغيل</p>
                    <p className="text-2xl font-bold">{systemStats.uptime}</p>
                  </div>
                  <i className="bi bi-clock text-2xl text-blue-600"></i>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">المستخدمون النشطون</p>
                    <p className="text-2xl font-bold">{systemStats.activeUsers}/{systemStats.totalUsers}</p>
                  </div>
                  <i className="bi bi-people text-2xl text-green-600"></i>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${(systemStats.activeUsers / systemStats.totalUsers) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">استدعاءات API</p>
                    <p className="text-2xl font-bold">{systemStats.apiCalls.toLocaleString()}</p>
                  </div>
                  <i className="bi bi-graph-up text-2xl text-purple-600"></i>
                </div>
                <p className="text-xs text-muted-foreground mt-2">اليوم</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">آخر نسخة احتياطية</p>
                    <p className="text-lg font-bold">
                      {systemStats.lastBackup 
                        ? systemStats.lastBackup.toLocaleDateString('ar-SA')
                        : 'غير متوفرة'
                      }
                    </p>
                  </div>
                  <i className="bi bi-shield-check text-2xl text-orange-600"></i>
                </div>
                {systemStats.lastBackup && (
                  <p className="text-xs text-muted-foreground mt-2">
                    منذ {Math.round((Date.now() - systemStats.lastBackup.getTime()) / (1000 * 60 * 60))} ساعة
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Resource Usage */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <i className="bi bi-memory"></i>
                  استخدام الذاكرة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>المستخدم</span>
                    <span>{systemStats.memoryUsage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${
                        systemStats.memoryUsage > 80 ? 'bg-red-600' : 
                        systemStats.memoryUsage > 60 ? 'bg-yellow-600' : 'bg-green-600'
                      }`}
                      style={{ width: `${systemStats.memoryUsage}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <i className="bi bi-hdd"></i>
                  استخدام القرص
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>المستخدم</span>
                    <span>{systemStats.diskUsage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${
                        systemStats.diskUsage > 80 ? 'bg-red-600' : 
                        systemStats.diskUsage > 60 ? 'bg-yellow-600' : 'bg-green-600'
                      }`}
                      style={{ width: `${systemStats.diskUsage}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <i className="bi bi-cpu"></i>
                  استخدام المعالج
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>المستخدم</span>
                    <span>{systemStats.cpuUsage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${
                        systemStats.cpuUsage > 80 ? 'bg-red-600' : 
                        systemStats.cpuUsage > 60 ? 'bg-yellow-600' : 'bg-green-600'
                      }`}
                      style={{ width: `${systemStats.cpuUsage}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity & Workflow */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SystemAlerts
              alerts={systemAlerts}
              onResolve={(id) => console.log('Resolve alert:', id)}
              onViewDetails={(alert) => console.log('View details:', alert)}
            />
            
            <WorkflowProgress
              title="تهيئة النظام"
              steps={workflowSteps}
              currentStep={1}
              onStepClick={(step) => console.log('Step clicked:', step)}
            />
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-6">
          <PerformanceAnalytics
            systemMetrics={{
              totalUsers: systemStats.totalUsers,
              activeUsers: systemStats.activeUsers,
              totalRequests: 1250,
              completedRequests: 1100,
              totalTransfers: 485,
              pendingTransfers: 45,
              totalProducts: systemStats.totalProducts || 850,
              lowStockProducts: systemStats.lowStockProducts || 23,
              totalRevenue: 125000,
              monthlyRevenue: 28500
            }}
            onRefresh={() => window.location.reload()}
            isLoading={isLoading}
          />
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <NotificationCenter
              notifications={notifications}
              onMarkAsRead={(id) => console.log('Mark as read:', id)}
              onMarkAllAsRead={() => console.log('Mark all as read')}
              onDismiss={(id) => console.log('Dismiss:', id)}
            />
            
            <SystemAlerts
              alerts={systemAlerts}
              onResolve={(id) => console.log('Resolve alert:', id)}
              onViewDetails={(alert) => console.log('View details:', alert)}
            />
          </div>
        </TabsContent>

        {/* Permissions Management Tab */}
        <TabsContent value="permissions" className="mt-6">
          <AdvancedPermissionManager
            users={[
              {
                id: '1',
                name: 'أحمد محمد',
                email: 'ahmed@company.com',
                role: 'admin',
                permissions: ['users_read', 'users_create'],
                isActive: true,
                lastLogin: new Date(Date.now() - 1000 * 60 * 30),
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)
              },
              {
                id: '2',
                name: 'فاطمة علي',
                email: 'fatima@company.com',
                role: 'manager',
                permissions: ['inventory_read'],
                isActive: true,
                lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 2),
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15)
              }
            ]}
            roles={[
              {
                id: 'admin',
                name: 'admin',
                displayName: 'مدير النظام',
                description: 'صلاحيات كاملة للنظام',
                permissions: ['users_read', 'users_create', 'users_update', 'users_delete'],
                isSystem: true
              },
              {
                id: 'manager',
                name: 'manager',
                displayName: 'مدير',
                description: 'إدارة العمليات اليومية',
                permissions: ['inventory_read', 'transfers_create'],
                isSystem: false
              }
            ]}
            permissions={[
              {
                id: 'users_read',
                name: 'users_read',
                displayName: 'عرض المستخدمين',
                category: 'إدارة المستخدمين',
                description: 'إمكانية عرض قائمة المستخدمين'
              },
              {
                id: 'users_create',
                name: 'users_create',
                displayName: 'إضافة مستخدمين',
                category: 'إدارة المستخدمين',
                description: 'إمكانية إضافة مستخدمين جدد'
              },
              {
                id: 'inventory_read',
                name: 'inventory_read',
                displayName: 'عرض المخزون',
                category: 'إدارة المخزون',
                description: 'إمكانية عرض بيانات المخزون'
              }
            ]}
            onUpdateUserRole={async (userId, roleId) => console.log('Update user role:', userId, roleId)}
            onUpdateUserPermissions={async (userId, permissions) => console.log('Update user permissions:', userId, permissions)}
            onUpdateRolePermissions={async (roleId, permissions) => console.log('Update role permissions:', roleId, permissions)}
            onCreateRole={async (role) => console.log('Create role:', role)}
            onDeleteRole={async (roleId) => console.log('Delete role:', roleId)}
            onToggleUserStatus={async (userId, isActive) => console.log('Toggle user status:', userId, isActive)}
            isLoading={isLoading}
          />
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config" className="mt-6">
          <SystemConfigurator
            config={systemConfig}
            onConfigChange={setSystemConfig}
            onSave={handleConfigSave}
            isLoading={isLoading}
          />
        </TabsContent>

        {/* Data Management Tab */}
        <TabsContent value="data" className="mt-6">
          <ImportExportManager
            backups={[]}
            restorePoints={[]}
            onCreateBackup={async (options) => console.log('Create backup:', options)}
            onRestore={async (id) => console.log('Restore:', id)}
            onImport={async (file, options) => console.log('Import:', file, options)}
            onExport={async (options) => console.log('Export:', options)}
            availableTables={['users', 'roles', 'permissions', 'warehouses', 'inventory', 'parts_transfers']}
            isLoading={isLoading}
          />
        </TabsContent>

        {/* Alert Center Tab */}
        <TabsContent value="alerts" className="mt-6">
          <AlertCenter
            rules={[
              {
                id: '1',
                name: 'تنبيه حمولة النظام العالية',
                description: 'تنبيه عندما تتجاوز حمولة المعالج 80%',
                category: 'system',
                severity: 'high',
                condition: 'system_load',
                threshold: 80,
                operator: 'greater',
                timeWindow: '5m',
                enabled: true,
                actions: [
                  { type: 'email', target: 'admin@company.com', enabled: true }
                ],
                lastTriggered: new Date(Date.now() - 1000 * 60 * 30),
                triggerCount: 12
              },
              {
                id: '2',
                name: 'تنبيه استخدام الذاكرة',
                description: 'تنبيه عندما تتجاوز الذاكرة 85%',
                category: 'performance',
                severity: 'medium',
                condition: 'memory_usage',
                threshold: 85,
                operator: 'greater',
                timeWindow: '10m',
                enabled: true,
                actions: [
                  { type: 'notification', target: 'system', enabled: true }
                ],
                triggerCount: 5
              }
            ]}
            events={[
              {
                id: '1',
                ruleId: '1',
                ruleName: 'تنبيه حمولة النظام العالية',
                severity: 'high',
                message: 'حمولة المعالج تجاوزت 85% لأكثر من 5 دقائق',
                timestamp: new Date(Date.now() - 1000 * 60 * 15),
                acknowledged: false,
                details: { currentValue: 87, threshold: 80 }
              },
              {
                id: '2',
                ruleId: '2',
                ruleName: 'تنبيه استخدام الذاكرة',
                severity: 'medium',
                message: 'استخدام الذاكرة وصل إلى 88%',
                timestamp: new Date(Date.now() - 1000 * 60 * 45),
                acknowledged: true,
                acknowledgedBy: 'أحمد محمد',
                details: { currentValue: 88, threshold: 85 }
              }
            ]}
            metrics={{
              systemLoad: systemStats.cpuUsage,
              memoryUsage: systemStats.memoryUsage,
              diskUsage: systemStats.diskUsage,
              errorRate: 2.1,
              responseTime: 245,
              activeUsers: systemStats.activeUsers
            }}
            onCreateRule={async (rule) => console.log('Create rule:', rule)}
            onUpdateRule={async (ruleId, updates) => console.log('Update rule:', ruleId, updates)}
            onDeleteRule={async (ruleId) => console.log('Delete rule:', ruleId)}
            onAcknowledgeEvent={async (eventId) => console.log('Acknowledge event:', eventId)}
            onResolveEvent={async (eventId) => console.log('Resolve event:', eventId)}
            isLoading={isLoading}
          />
        </TabsContent>

        {/* Security Dashboard Tab */}
        <TabsContent value="security" className="mt-6">
          <SecurityDashboard
            threats={[
              {
                id: '1',
                type: 'brute_force',
                severity: 'high',
                source: '192.168.1.100',
                target: 'login-server',
                timestamp: new Date(Date.now() - 1000 * 60 * 15),
                status: 'active',
                description: 'محاولة اختراق بالقوة الغاشمة على خادم تسجيل الدخول',
                details: { attempts: 50, duration: '15 minutes' }
              },
              {
                id: '2',
                type: 'suspicious_activity',
                severity: 'medium',
                source: '10.0.0.25',
                target: 'database-server',
                timestamp: new Date(Date.now() - 1000 * 60 * 45),
                status: 'investigating',
                description: 'نشاط مشبوه في قاعدة البيانات خارج ساعات العمل',
                details: { queries: 147, tables: ['users', 'financial_data'] }
              }
            ]}
            policies={[
              {
                id: '1',
                name: 'سياسة كلمات المرور القوية',
                category: 'authentication',
                description: 'فرض استخدام كلمات مرور قوية مع تجديد دوري',
                enabled: true,
                rules: [
                  { id: '1', condition: 'length >= 8', action: 'allow', priority: 1, enabled: true },
                  { id: '2', condition: 'contains_special_chars', action: 'allow', priority: 2, enabled: true }
                ],
                lastModified: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
                modifiedBy: 'أحمد محمد'
              }
            ]}
            auditLogs={[
              {
                id: '1',
                type: 'login',
                userId: '1',
                userName: 'أحمد محمد',
                action: 'تسجيل دخول ناجح',
                resource: 'لوحة الإدارة',
                ipAddress: '192.168.1.50',
                userAgent: 'Chrome 120.0',
                timestamp: new Date(Date.now() - 1000 * 60 * 30),
                success: true,
                riskLevel: 'low',
                details: { location: 'الرياض، السعودية' }
              }
            ]}
            metrics={{
              threatsBlocked: 127,
              loginAttempts: 1543,
              failedLogins: 23,
              suspiciousActivities: 8,
              securityScore: 87,
              vulnerabilities: 2,
              patchLevel: 92,
              lastSecurityScan: new Date(Date.now() - 1000 * 60 * 60 * 12)
            }}
            onMitigateThreat={async (threatId) => console.log('Mitigate threat:', threatId)}
            onUpdatePolicy={async (policyId, updates) => console.log('Update policy:', policyId, updates)}
            onRunSecurityScan={async () => console.log('Run security scan')}
            onExportAuditLog={async (filters) => console.log('Export audit log:', filters)}
            isLoading={isLoading}
          />
        </TabsContent>

        {/* Network Monitor Tab */}
        <TabsContent value="network" className="mt-6">
          <NetworkMonitor
            connections={[
              {
                id: '1',
                sourceIP: '192.168.1.100',
                destinationIP: '10.0.0.1',
                port: 443,
                protocol: 'TCP',
                status: 'active',
                bandwidth: 15.7,
                latency: 25,
                packets: { sent: 15420, received: 15398, dropped: 2 },
                timestamp: new Date(),
                duration: 1847
              },
              {
                id: '2',
                sourceIP: '192.168.1.50',
                destinationIP: '8.8.8.8',
                port: 53,
                protocol: 'UDP',
                status: 'active',
                bandwidth: 2.1,
                latency: 8,
                packets: { sent: 847, received: 845, dropped: 0 },
                timestamp: new Date(Date.now() - 1000 * 60 * 5),
                duration: 320
              }
            ]}
            devices={[
              {
                id: '1',
                name: 'خادم الويب الرئيسي',
                ipAddress: '192.168.1.10',
                macAddress: '00:1B:44:11:3A:B7',
                type: 'server',
                status: 'online',
                lastSeen: new Date(),
                operatingSystem: 'Ubuntu 22.04',
                openPorts: [22, 80, 443],
                vulnerabilities: 0
              },
              {
                id: '2',
                name: 'محطة عمل المدير',
                ipAddress: '192.168.1.100',
                macAddress: '00:1E:8C:12:34:56',
                type: 'workstation',
                status: 'online',
                lastSeen: new Date(Date.now() - 1000 * 60 * 2),
                operatingSystem: 'Windows 11',
                openPorts: [135, 445],
                vulnerabilities: 1
              }
            ]}
            trafficHistory={[
              {
                timestamp: new Date(Date.now() - 1000 * 60 * 60),
                inbound: 2.5,
                outbound: 1.8,
                totalConnections: 147,
                protocols: { http: 45, https: 78, ftp: 3, ssh: 12, dns: 9, other: 0 }
              }
            ]}
            alerts={[
              {
                id: '1',
                type: 'high_traffic',
                severity: 'medium',
                message: 'استخدام عالي للنطاق الترددي من 192.168.1.100',
                source: '192.168.1.100',
                timestamp: new Date(Date.now() - 1000 * 60 * 10),
                acknowledged: false,
                details: { bandwidth: '85 Mbps', threshold: '50 Mbps' }
              }
            ]}
            currentBandwidth={{
              download: 45.2,
              upload: 12.8,
              total: 58.0,
              limit: 100.0
            }}
            onBlockConnection={async (connectionId) => console.log('Block connection:', connectionId)}
            onScanNetwork={async () => console.log('Scan network')}
            onAcknowledgeAlert={async (alertId) => console.log('Acknowledge alert:', alertId)}
            onExportReport={async (type) => console.log('Export report:', type)}
            isLoading={isLoading}
          />
        </TabsContent>

        {/* Update Manager Tab */}
        <TabsContent value="updates" className="mt-6">
          <UpdateManager
            updates={[
              {
                id: '1',
                name: 'Windows Security Update',
                version: '2024-03-12',
                currentVersion: '2024-02-14',
                category: 'security',
                priority: 'critical',
                size: 45.7,
                description: 'تحديث أمني مهم يصلح ثغرات أمنية حرجة في النظام',
                releaseDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
                status: 'available',
                requiresRestart: true,
                dependencies: ['KB5034439'],
                changelog: [
                  'إصلاح CVE-2024-26169 في kernel',
                  'تحسين أداء التشفير',
                  'إصلاح مشاكل الذاكرة'
                ]
              },
              {
                id: '2',
                name: 'Node.js Runtime Update',
                version: '20.11.1',
                currentVersion: '20.10.0',
                category: 'performance',
                priority: 'medium',
                size: 28.3,
                description: 'تحديث بيئة Node.js مع تحسينات الأداء وإصلاحات الأخطاء',
                releaseDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
                status: 'downloading',
                progress: 67,
                requiresRestart: true,
                changelog: [
                  'تحسين أداء V8 Engine',
                  'إصلاح تسريبات الذاكرة',
                  'دعم أفضل للـ ES modules'
                ]
              }
            ]}
            channels={[
              {
                id: '1',
                name: 'التحديثات الأمنية',
                description: 'تحديثات الأمان الحرجة والمهمة',
                enabled: true,
                frequency: 'daily',
                lastCheck: new Date(Date.now() - 1000 * 60 * 60 * 4),
                nextCheck: new Date(Date.now() + 1000 * 60 * 60 * 20)
              },
              {
                id: '2',
                name: 'تحديثات الميزات',
                description: 'التحديثات التي تضيف ميزات جديدة',
                enabled: false,
                frequency: 'weekly',
                lastCheck: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
                nextCheck: null
              }
            ]}
            history={[
              {
                id: '1',
                updateId: '1',
                updateName: 'System Framework Update',
                version: '2024-02-14',
                installedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
                installedBy: 'أحمد محمد',
                status: 'success',
                duration: 15,
                notes: 'تم التثبيت بنجاح مع إعادة تشغيل واحدة'
              }
            ]}
            settings={{
              autoUpdate: false,
              downloadAutomatic: true,
              installScheduled: false,
              maintenanceWindow: {
                start: '02:00',
                end: '04:00',
                days: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday']
              },
              backupBeforeUpdate: true,
              rollbackEnabled: true,
              notifications: {
                available: true,
                installed: true,
                failed: true
              }
            }}
            onInstallUpdate={async (updateId) => console.log('Install update:', updateId)}
            onRollbackUpdate={async (historyId) => console.log('Rollback update:', historyId)}
            onCheckUpdates={async () => console.log('Check updates')}
            onUpdateSettings={async (settings) => console.log('Update settings:', settings)}
            onUpdateChannel={async (channelId, updates) => console.log('Update channel:', channelId, updates)}
            isLoading={isLoading}
          />
        </TabsContent>

        {/* Backup Manager Tab */}
        <TabsContent value="backup" className="mt-6">
          <BackupManager
            jobs={[
              {
                id: '1',
                name: 'النسخة اليومية الكاملة',
                type: 'full',
                schedule: 'daily',
                lastRun: new Date(Date.now() - 1000 * 60 * 60 * 12),
                nextRun: new Date(Date.now() + 1000 * 60 * 60 * 12),
                status: 'active',
                retentionDays: 30,
                size: 2048000000, // 2GB
                tables: ['users', 'warehouses', 'inventory', 'transfers']
              },
              {
                id: '2',
                name: 'النسخة الأسبوعية التزايدية',
                type: 'incremental',
                schedule: 'weekly',
                lastRun: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
                nextRun: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4),
                status: 'active',
                retentionDays: 90,
                size: 512000000, // 512MB
                tables: ['inventory_logs', 'user_activities']
              }
            ]}
            history={[
              {
                id: '1',
                jobId: '1',
                startTime: new Date(Date.now() - 1000 * 60 * 60 * 12),
                endTime: new Date(Date.now() - 1000 * 60 * 60 * 12 + 1000 * 60 * 15),
                status: 'completed',
                size: 2048000000,
                duration: 900000, // 15 minutes
                progress: 100
              },
              {
                id: '2',
                jobId: '1',
                startTime: new Date(),
                endTime: null,
                status: 'running',
                size: 1024000000,
                duration: 0,
                progress: 65
              }
            ]}
            availableTables={['users', 'roles', 'warehouses', 'inventory', 'transfers', 'logs']}
            onCreateJob={async (job) => console.log('Create backup job:', job)}
            onUpdateJob={async (jobId, updates) => console.log('Update backup job:', jobId, updates)}
            onDeleteJob={async (jobId) => console.log('Delete backup job:', jobId)}
            onRunJob={async (jobId) => console.log('Run backup job:', jobId)}
            onRestoreBackup={async (historyId) => console.log('Restore backup:', historyId)}
            isLoading={isLoading}
          />
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="mt-6">
          <LogViewer
            auditLogs={[
              {
                id: '1',
                userId: '1',
                userName: 'أحمد محمد',
                userRole: 'admin',
                action: 'تحديث المستخدم',
                resource: 'المستخدمون',
                resourceId: '2',
                details: { field: 'role', oldValue: 'user', newValue: 'manager' },
                ipAddress: '192.168.1.100',
                userAgent: 'Mozilla/5.0...',
                timestamp: new Date(Date.now() - 1000 * 60 * 30),
                status: 'success',
                duration: 245
              }
            ]}
            systemLogs={[
              {
                id: '1',
                level: 'info',
                message: 'تم بدء تشغيل الخادم بنجاح',
                source: 'server.js',
                details: { port: 3001, environment: 'development' },
                timestamp: new Date(Date.now() - 1000 * 60 * 60),
                resolved: true
              },
              {
                id: '2',
                level: 'warning',
                message: 'استخدام مرتفع للذاكرة',
                source: 'monitor.js',
                details: { usage: '85%', threshold: '80%' },
                timestamp: new Date(Date.now() - 1000 * 60 * 15),
                resolved: false
              }
            ]}
            onExportLogs={async (options) => console.log('Export logs:', options)}
            onClearLogs={async (type) => console.log('Clear logs:', type)}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}