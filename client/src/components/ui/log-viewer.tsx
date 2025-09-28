import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: any;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  status: 'success' | 'failed' | 'warning';
  duration?: number;
}

interface SystemLog {
  id: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  source: string;
  details?: any;
  timestamp: Date;
  resolved: boolean;
}

interface LogViewerProps {
  auditLogs: AuditLog[];
  systemLogs: SystemLog[];
  onExportLogs: (options: {
    type: 'audit' | 'system' | 'both';
    dateRange: { from: Date; to: Date };
    format: 'csv' | 'json';
  }) => Promise<void>;
  onClearLogs: (type: 'audit' | 'system' | 'both') => Promise<void>;
  isLoading?: boolean;
}

export function LogViewer({
  auditLogs,
  systemLogs,
  onExportLogs,
  onClearLogs,
  isLoading = false
}: LogViewerProps) {
  const [activeTab, setActiveTab] = useState<'audit' | 'system' | 'analytics'>('audit');
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('today');
  const [selectedLog, setSelectedLog] = useState<AuditLog | SystemLog | null>(null);

  // Filter functions
  const getFilteredAuditLogs = () => {
    let filtered = [...auditLogs];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // User filter
    if (userFilter !== 'all') {
      filtered = filtered.filter(log => log.userId === userFilter);
    }

    // Date filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (dateFilter) {
      case 'today':
        filtered = filtered.filter(log => log.timestamp >= today);
        break;
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        filtered = filtered.filter(log => log.timestamp >= weekAgo);
        break;
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        filtered = filtered.filter(log => log.timestamp >= monthAgo);
        break;
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  const getFilteredSystemLogs = () => {
    let filtered = [...systemLogs];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.source.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Level filter
    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.level === levelFilter);
    }

    // Date filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (dateFilter) {
      case 'today':
        filtered = filtered.filter(log => log.timestamp >= today);
        break;
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        filtered = filtered.filter(log => log.timestamp >= weekAgo);
        break;
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        filtered = filtered.filter(log => log.timestamp >= monthAgo);
        break;
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  // Analytics calculations
  const getAnalytics = () => {
    const totalAuditLogs = auditLogs.length;
    const totalSystemLogs = systemLogs.length;
    
    const todayAuditLogs = auditLogs.filter(log => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return log.timestamp >= today;
    }).length;

    const errorLogs = systemLogs.filter(log => log.level === 'error').length;
    const warningLogs = systemLogs.filter(log => log.level === 'warning').length;
    
    const failedActions = auditLogs.filter(log => log.status === 'failed').length;
    const successRate = totalAuditLogs > 0 ? ((totalAuditLogs - failedActions) / totalAuditLogs * 100) : 100;

    const userActivity = auditLogs.reduce((acc, log) => {
      acc[log.userName] = (acc[log.userName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topUsers = Object.entries(userActivity)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const actionActivity = auditLogs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topActions = Object.entries(actionActivity)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return {
      totalAuditLogs,
      totalSystemLogs,
      todayAuditLogs,
      errorLogs,
      warningLogs,
      successRate,
      topUsers,
      topActions
    };
  };

  const analytics = getAnalytics();
  const uniqueUsers = Array.from(new Set(auditLogs.map(log => log.userId)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">سجلات النظام</h2>
          <p className="text-muted-foreground">مراقبة أنشطة المستخدمين وأحداث النظام</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => onExportLogs({
              type: 'both',
              dateRange: {
                from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
                to: new Date()
              },
              format: 'csv'
            })}
            disabled={isLoading}
          >
            <i className="bi bi-download mr-2"></i>
            تصدير السجلات
          </Button>
          
          <Button
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => {
              if (confirm('هل أنت متأكد من حذف جميع السجلات؟ هذا الإجراء لا يمكن التراجع عنه.')) {
                onClearLogs('both');
              }
            }}
            disabled={isLoading}
          >
            <i className="bi bi-trash mr-2"></i>
            مسح السجلات
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === 'audit' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('audit')}
        >
          <i className="bi bi-person-check mr-2"></i>
          سجل المراجعة
          <Badge variant="secondary" className="mr-2">{auditLogs.length}</Badge>
        </Button>
        <Button
          variant={activeTab === 'system' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('system')}
        >
          <i className="bi bi-cpu mr-2"></i>
          سجل النظام
          <Badge variant="secondary" className="mr-2">{systemLogs.length}</Badge>
        </Button>
        <Button
          variant={activeTab === 'analytics' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('analytics')}
        >
          <i className="bi bi-graph-up mr-2"></i>
          التحليلات
        </Button>
      </div>

      {/* Filters */}
      {(activeTab === 'audit' || activeTab === 'system') && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">البحث</Label>
                <Input
                  id="search"
                  placeholder="ابحث في السجلات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {activeTab === 'audit' && (
                <div className="space-y-2">
                  <Label htmlFor="userFilter">المستخدم</Label>
                  <Select value={userFilter} onValueChange={setUserFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع المستخدمين</SelectItem>
                      {uniqueUsers.map((userId) => {
                        const user = auditLogs.find(log => log.userId === userId);
                        return (
                          <SelectItem key={userId} value={userId}>
                            {user?.userName || userId}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {activeTab === 'system' && (
                <div className="space-y-2">
                  <Label htmlFor="levelFilter">مستوى السجل</Label>
                  <Select value={levelFilter} onValueChange={setLevelFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع المستويات</SelectItem>
                      <SelectItem value="error">خطأ</SelectItem>
                      <SelectItem value="warning">تحذير</SelectItem>
                      <SelectItem value="info">معلومات</SelectItem>
                      <SelectItem value="debug">تصحيح</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="dateFilter">الفترة الزمنية</Label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">اليوم</SelectItem>
                    <SelectItem value="week">آخر أسبوع</SelectItem>
                    <SelectItem value="month">آخر شهر</SelectItem>
                    <SelectItem value="all">جميع الفترات</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setLevelFilter('all');
                    setUserFilter('all');
                    setDateFilter('today');
                  }}
                >
                  <i className="bi bi-arrow-clockwise mr-2"></i>
                  إعادة تعيين
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit Logs Tab */}
      {activeTab === 'audit' && (
        <Card>
          <CardHeader>
            <CardTitle>سجل المراجعة ({getFilteredAuditLogs().length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {getFilteredAuditLogs().length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <i className="bi bi-journal-text text-2xl mb-2 block"></i>
                  لا توجد سجلات مراجعة
                </div>
              ) : (
                getFilteredAuditLogs().map((log) => (
                  <div
                    key={log.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Badge variant={
                          log.status === 'success' ? 'default' :
                          log.status === 'failed' ? 'destructive' : 'secondary'
                        }>
                          {log.status === 'success' ? 'نجح' :
                           log.status === 'failed' ? 'فشل' : 'تحذير'}
                        </Badge>
                        <span className="font-medium">{log.action}</span>
                        <span className="text-muted-foreground">على {log.resource}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {log.timestamp.toLocaleString('ar-SA')}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span>
                          <i className="bi bi-person mr-1"></i>
                          {log.userName} ({log.userRole})
                        </span>
                        <span>
                          <i className="bi bi-geo-alt mr-1"></i>
                          {log.ipAddress}
                        </span>
                        {log.duration && (
                          <span>
                            <i className="bi bi-clock mr-1"></i>
                            {log.duration}ms
                          </span>
                        )}
                      </div>
                      <i className="bi bi-chevron-left"></i>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Logs Tab */}
      {activeTab === 'system' && (
        <Card>
          <CardHeader>
            <CardTitle>سجل النظام ({getFilteredSystemLogs().length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {getFilteredSystemLogs().length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <i className="bi bi-cpu text-2xl mb-2 block"></i>
                  لا توجد سجلات نظام
                </div>
              ) : (
                getFilteredSystemLogs().map((log) => (
                  <div
                    key={log.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Badge variant={
                          log.level === 'error' ? 'destructive' :
                          log.level === 'warning' ? 'secondary' : 'default'
                        }>
                          {log.level === 'error' ? 'خطأ' :
                           log.level === 'warning' ? 'تحذير' :
                           log.level === 'info' ? 'معلومات' : 'تصحيح'}
                        </Badge>
                        <span className="font-medium">{log.message}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {log.timestamp.toLocaleString('ar-SA')}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span>
                          <i className="bi bi-code-square mr-1"></i>
                          {log.source}
                        </span>
                        {!log.resolved && log.level === 'error' && (
                          <Badge variant="destructive" className="text-xs">
                            غير محلول
                          </Badge>
                        )}
                      </div>
                      <i className="bi bi-chevron-left"></i>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Overview Cards */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي أنشطة المراجعة</p>
                  <p className="text-2xl font-bold">{analytics.totalAuditLogs}</p>
                </div>
                <i className="bi bi-journal-check text-2xl text-blue-600"></i>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {analytics.todayAuditLogs} اليوم
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">سجلات النظام</p>
                  <p className="text-2xl font-bold">{analytics.totalSystemLogs}</p>
                </div>
                <i className="bi bi-cpu text-2xl text-green-600"></i>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {analytics.errorLogs} أخطاء، {analytics.warningLogs} تحذيرات
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">معدل النجاح</p>
                  <p className="text-2xl font-bold">{analytics.successRate.toFixed(1)}%</p>
                </div>
                <i className="bi bi-check-circle text-2xl text-green-600"></i>
              </div>
              <Progress value={analytics.successRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">المستخدمون النشطون</p>
                  <p className="text-2xl font-bold">{uniqueUsers.length}</p>
                </div>
                <i className="bi bi-people text-2xl text-purple-600"></i>
              </div>
            </CardContent>
          </Card>

          {/* Top Users */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">المستخدمون الأكثر نشاطاً</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analytics.topUsers.map(([userName, count], index) => (
                  <div key={userName} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">#{index + 1}</span>
                      <span className="text-sm">{userName}</span>
                    </div>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Actions */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">الأنشطة الأكثر تكراراً</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analytics.topActions.map(([action, count], index) => (
                  <div key={action} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">#{index + 1}</span>
                      <span className="text-sm">{action}</span>
                    </div>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                {'action' in selectedLog ? 'تفاصيل سجل المراجعة' : 'تفاصيل سجل النظام'}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedLog(null)}
              >
                <i className="bi bi-x-lg"></i>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {'action' in selectedLog ? (
                // Audit log details
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">الإجراء</Label>
                      <p className="font-medium">{selectedLog.action}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">الحالة</Label>
                      <Badge variant={
                        selectedLog.status === 'success' ? 'default' :
                        selectedLog.status === 'failed' ? 'destructive' : 'secondary'
                      }>
                        {selectedLog.status === 'success' ? 'نجح' :
                         selectedLog.status === 'failed' ? 'فشل' : 'تحذير'}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">المستخدم</Label>
                      <p>{selectedLog.userName} ({selectedLog.userRole})</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">الوقت</Label>
                      <p>{selectedLog.timestamp.toLocaleString('ar-SA')}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">المورد</Label>
                      <p>{selectedLog.resource}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">عنوان IP</Label>
                      <p>{selectedLog.ipAddress}</p>
                    </div>
                  </div>

                  {selectedLog.details && (
                    <div>
                      <Label className="text-sm text-muted-foreground">التفاصيل</Label>
                      <Textarea
                        value={JSON.stringify(selectedLog.details, null, 2)}
                        readOnly
                        rows={6}
                        className="font-mono text-xs"
                      />
                    </div>
                  )}
                </>
              ) : (
                // System log details
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">المستوى</Label>
                      <Badge variant={
                        selectedLog.level === 'error' ? 'destructive' :
                        selectedLog.level === 'warning' ? 'secondary' : 'default'
                      }>
                        {selectedLog.level === 'error' ? 'خطأ' :
                         selectedLog.level === 'warning' ? 'تحذير' :
                         selectedLog.level === 'info' ? 'معلومات' : 'تصحيح'}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">المصدر</Label>
                      <p>{selectedLog.source}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm text-muted-foreground">الرسالة</Label>
                    <p className="font-medium">{selectedLog.message}</p>
                  </div>

                  <div>
                    <Label className="text-sm text-muted-foreground">الوقت</Label>
                    <p>{selectedLog.timestamp.toLocaleString('ar-SA')}</p>
                  </div>

                  {selectedLog.details && (
                    <div>
                      <Label className="text-sm text-muted-foreground">التفاصيل التقنية</Label>
                      <Textarea
                        value={JSON.stringify(selectedLog.details, null, 2)}
                        readOnly
                        rows={6}
                        className="font-mono text-xs"
                      />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}