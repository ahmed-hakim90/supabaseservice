import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AlertRule {
  id: string;
  name: string;
  description: string;
  category: 'system' | 'security' | 'performance' | 'business' | 'custom';
  severity: 'low' | 'medium' | 'high' | 'critical';
  condition: string;
  threshold: number;
  operator: 'greater' | 'less' | 'equal' | 'not_equal';
  timeWindow: string; // '5m', '15m', '1h', '24h'
  enabled: boolean;
  actions: AlertAction[];
  lastTriggered?: Date;
  triggerCount: number;
}

interface AlertAction {
  type: 'email' | 'sms' | 'webhook' | 'notification';
  target: string;
  enabled: boolean;
}

interface AlertEvent {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  details: Record<string, any>;
}

interface AlertCenterProps {
  rules: AlertRule[];
  events: AlertEvent[];
  metrics: {
    systemLoad: number;
    memoryUsage: number;
    diskUsage: number;
    errorRate: number;
    responseTime: number;
    activeUsers: number;
  };
  onCreateRule: (rule: Omit<AlertRule, 'id' | 'triggerCount'>) => Promise<void>;
  onUpdateRule: (ruleId: string, updates: Partial<AlertRule>) => Promise<void>;
  onDeleteRule: (ruleId: string) => Promise<void>;
  onAcknowledgeEvent: (eventId: string) => Promise<void>;
  onResolveEvent: (eventId: string) => Promise<void>;
  isLoading?: boolean;
}

export function AlertCenter({
  rules,
  events,
  metrics,
  onCreateRule,
  onUpdateRule,
  onDeleteRule,
  onAcknowledgeEvent,
  onResolveEvent,
  isLoading = false
}: AlertCenterProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showCreateRule, setShowCreateRule] = useState(false);
  const [selectedRule, setSelectedRule] = useState<AlertRule | null>(null);
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    category: 'system' as AlertRule['category'],
    severity: 'medium' as AlertRule['severity'],
    condition: 'system_load',
    threshold: 80,
    operator: 'greater' as AlertRule['operator'],
    timeWindow: '5m',
    enabled: true,
    actions: [] as AlertAction[]
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-700 bg-red-100 border-red-200';
      case 'high': return 'text-orange-700 bg-orange-100 border-orange-200';
      case 'medium': return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-blue-700 bg-blue-100 border-blue-200';
      default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bi-exclamation-triangle-fill';
      case 'high': return 'bi-exclamation-triangle';
      case 'medium': return 'bi-exclamation-circle';
      case 'low': return 'bi-info-circle';
      default: return 'bi-circle';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'system': return 'bi-cpu';
      case 'security': return 'bi-shield-check';
      case 'performance': return 'bi-speedometer2';
      case 'business': return 'bi-graph-up';
      case 'custom': return 'bi-gear';
      default: return 'bi-bell';
    }
  };

  const activeEvents = events.filter(e => !e.acknowledged && !e.resolvedAt);
  const criticalEvents = activeEvents.filter(e => e.severity === 'critical');
  const enabledRules = rules.filter(r => r.enabled);
  
  const recentEvents = events
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 10);

  const conditionOptions = [
    { value: 'system_load', label: 'حمولة النظام', unit: '%' },
    { value: 'memory_usage', label: 'استخدام الذاكرة', unit: '%' },
    { value: 'disk_usage', label: 'استخدام القرص', unit: '%' },
    { value: 'error_rate', label: 'معدل الأخطاء', unit: '%' },
    { value: 'response_time', label: 'زمن الاستجابة', unit: 'ms' },
    { value: 'active_users', label: 'المستخدمون النشطون', unit: '' }
  ];

  const handleCreateRule = async () => {
    if (!newRule.name.trim()) return;

    await onCreateRule({
      name: newRule.name,
      description: newRule.description,
      category: newRule.category,
      severity: newRule.severity,
      condition: newRule.condition,
      threshold: newRule.threshold,
      operator: newRule.operator,
      timeWindow: newRule.timeWindow,
      enabled: newRule.enabled,
      actions: newRule.actions
    });

    // Reset form
    setNewRule({
      name: '',
      description: '',
      category: 'system',
      severity: 'medium',
      condition: 'system_load',
      threshold: 80,
      operator: 'greater',
      timeWindow: '5m',
      enabled: true,
      actions: []
    });
    setShowCreateRule(false);
  };

  const getCurrentValue = (condition: string): number => {
    switch (condition) {
      case 'system_load': return metrics.systemLoad;
      case 'memory_usage': return metrics.memoryUsage;
      case 'disk_usage': return metrics.diskUsage;
      case 'error_rate': return metrics.errorRate;
      case 'response_time': return metrics.responseTime;
      case 'active_users': return metrics.activeUsers;
      default: return 0;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Key Metrics */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">مركز التنبيهات الذكية</h3>
            <p className="text-muted-foreground">مراقبة النظام والتنبيهات التلقائية</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant={criticalEvents.length > 0 ? 'destructive' : 'secondary'}>
              {criticalEvents.length} تنبيه حرج
            </Badge>
            <Badge variant="outline">
              {enabledRules.length} قاعدة نشطة
            </Badge>
            <Button onClick={() => setShowCreateRule(true)}>
              <i className="bi bi-plus-circle mr-2"></i>
              قاعدة جديدة
            </Button>
          </div>
        </div>

        {criticalEvents.length > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <i className="bi bi-exclamation-triangle-fill text-red-600"></i>
            <AlertDescription className="text-red-800">
              يوجد {criticalEvents.length} تنبيه حرج يتطلب انتباهاً فورياً!
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">لوحة المراقبة</TabsTrigger>
          <TabsTrigger value="events">التنبيهات النشطة</TabsTrigger>
          <TabsTrigger value="rules">قواعد التنبيه</TabsTrigger>
          <TabsTrigger value="history">سجل التنبيهات</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* System Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">حمولة النظام</p>
                    <p className="text-2xl font-bold">{metrics.systemLoad}%</p>
                  </div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    metrics.systemLoad > 80 ? 'bg-red-100 text-red-600' : 
                    metrics.systemLoad > 60 ? 'bg-yellow-100 text-yellow-600' : 
                    'bg-green-100 text-green-600'
                  }`}>
                    <i className="bi bi-cpu text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">استخدام الذاكرة</p>
                    <p className="text-2xl font-bold">{metrics.memoryUsage}%</p>
                  </div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    metrics.memoryUsage > 85 ? 'bg-red-100 text-red-600' : 
                    metrics.memoryUsage > 70 ? 'bg-yellow-100 text-yellow-600' : 
                    'bg-green-100 text-green-600'
                  }`}>
                    <i className="bi bi-memory text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">استخدام القرص</p>
                    <p className="text-2xl font-bold">{metrics.diskUsage}%</p>
                  </div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    metrics.diskUsage > 90 ? 'bg-red-100 text-red-600' : 
                    metrics.diskUsage > 75 ? 'bg-yellow-100 text-yellow-600' : 
                    'bg-green-100 text-green-600'
                  }`}>
                    <i className="bi bi-hdd text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">معدل الأخطاء</p>
                    <p className="text-2xl font-bold">{metrics.errorRate}%</p>
                  </div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    metrics.errorRate > 5 ? 'bg-red-100 text-red-600' : 
                    metrics.errorRate > 2 ? 'bg-yellow-100 text-yellow-600' : 
                    'bg-green-100 text-green-600'
                  }`}>
                    <i className="bi bi-exclamation-triangle text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">زمن الاستجابة</p>
                    <p className="text-2xl font-bold">{metrics.responseTime}ms</p>
                  </div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    metrics.responseTime > 1000 ? 'bg-red-100 text-red-600' : 
                    metrics.responseTime > 500 ? 'bg-yellow-100 text-yellow-600' : 
                    'bg-green-100 text-green-600'
                  }`}>
                    <i className="bi bi-speedometer2 text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">المستخدمون النشطون</p>
                    <p className="text-2xl font-bold">{metrics.activeUsers}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-100 text-blue-600">
                    <i className="bi bi-people text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Events */}
          <Card>
            <CardHeader>
              <CardTitle>التنبيهات الحديثة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentEvents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <i className="bi bi-bell text-2xl mb-2 block"></i>
                    لا توجد تنبيهات حديثة
                  </div>
                ) : (
                  recentEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`p-4 rounded-lg border ${
                        event.acknowledged ? 'opacity-60' : ''
                      } ${getSeverityColor(event.severity)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <i className={`bi ${getSeverityIcon(event.severity)}`}></i>
                            <span className="font-medium">{event.ruleName}</span>
                            <Badge variant="outline" className="text-xs">
                              {event.severity}
                            </Badge>
                          </div>
                          <p className="text-sm mb-2">{event.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {event.timestamp.toLocaleString('ar-SA')}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {!event.acknowledged && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onAcknowledgeEvent(event.id)}
                            >
                              إقرار
                            </Button>
                          )}
                          {event.acknowledged && !event.resolvedAt && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onResolveEvent(event.id)}
                            >
                              حل
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>التنبيهات النشطة ({activeEvents.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeEvents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <i className="bi bi-check-circle text-2xl mb-2 block"></i>
                    لا توجد تنبيهات نشطة
                  </div>
                ) : (
                  activeEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`p-4 rounded-lg border ${getSeverityColor(event.severity)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <i className={`bi ${getSeverityIcon(event.severity)}`}></i>
                            <span className="font-medium">{event.ruleName}</span>
                            <Badge variant="outline" className="text-xs">
                              {event.severity}
                            </Badge>
                          </div>
                          <p className="text-sm mb-2">{event.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {event.timestamp.toLocaleString('ar-SA')}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onAcknowledgeEvent(event.id)}
                          >
                            إقرار
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {rules.map((rule) => (
              <Card key={rule.id} className={rule.enabled ? '' : 'opacity-60'}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <i className={`bi ${getCategoryIcon(rule.category)}`}></i>
                      <CardTitle className="text-base">{rule.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(rule.severity)}>
                        {rule.severity}
                      </Badge>
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(enabled) => 
                          onUpdateRule(rule.id, { enabled })
                        }
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {rule.description}
                  </p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>الشرط:</span>
                      <span className="font-medium">
                        {conditionOptions.find(c => c.value === rule.condition)?.label} 
                        {' '}{rule.operator === 'greater' ? '>' : rule.operator === 'less' ? '<' : '='}{' '}
                        {rule.threshold}
                        {conditionOptions.find(c => c.value === rule.condition)?.unit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>القيمة الحالية:</span>
                      <span className={`font-medium ${
                        getCurrentValue(rule.condition) > rule.threshold ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {getCurrentValue(rule.condition)}
                        {conditionOptions.find(c => c.value === rule.condition)?.unit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>مرات التنبيه:</span>
                      <span className="font-medium">{rule.triggerCount}</span>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedRule(rule)}
                      className="flex-1"
                    >
                      تعديل
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600"
                      onClick={() => {
                        if (confirm('هل أنت متأكد من حذف هذه القاعدة؟')) {
                          onDeleteRule(rule.id);
                        }
                      }}
                    >
                      <i className="bi bi-trash"></i>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>سجل التنبيهات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {events.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <i className="bi bi-clock-history text-2xl mb-2 block"></i>
                    لا يوجد سجل تنبيهات
                  </div>
                ) : (
                  events.map((event) => (
                    <div
                      key={event.id}
                      className={`p-4 rounded-lg border ${
                        event.resolvedAt ? 'bg-green-50 border-green-200' :
                        event.acknowledged ? 'bg-blue-50 border-blue-200' :
                        getSeverityColor(event.severity)
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <i className={`bi ${getSeverityIcon(event.severity)}`}></i>
                            <span className="font-medium">{event.ruleName}</span>
                            <Badge variant="outline" className="text-xs">
                              {event.severity}
                            </Badge>
                            {event.resolvedAt && (
                              <Badge variant="outline" className="text-xs bg-green-100 text-green-700">
                                محلول
                              </Badge>
                            )}
                            {event.acknowledged && !event.resolvedAt && (
                              <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700">
                                مُقر
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm mb-2">{event.message}</p>
                          <div className="text-xs text-muted-foreground">
                            <span>وقت الحدوث: {event.timestamp.toLocaleString('ar-SA')}</span>
                            {event.acknowledgedBy && (
                              <span className="mr-4">أُقر بواسطة: {event.acknowledgedBy}</span>
                            )}
                            {event.resolvedAt && (
                              <span className="mr-4">حُل في: {event.resolvedAt.toLocaleString('ar-SA')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Rule Modal */}
      {showCreateRule && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>إنشاء قاعدة تنبيه جديدة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="ruleName">اسم القاعدة</Label>
                <Input
                  id="ruleName"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  placeholder="تنبيه حمولة النظام العالية"
                />
              </div>

              <div>
                <Label htmlFor="ruleDescription">الوصف</Label>
                <Textarea
                  id="ruleDescription"
                  value={newRule.description}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                  placeholder="تنبيه عندما تتجاوز حمولة النظام 80%"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ruleCategory">التصنيف</Label>
                  <Select
                    value={newRule.category}
                    onValueChange={(value: AlertRule['category']) => 
                      setNewRule({ ...newRule, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">نظام</SelectItem>
                      <SelectItem value="security">أمان</SelectItem>
                      <SelectItem value="performance">أداء</SelectItem>
                      <SelectItem value="business">عمل</SelectItem>
                      <SelectItem value="custom">مخصص</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="ruleSeverity">الخطورة</Label>
                  <Select
                    value={newRule.severity}
                    onValueChange={(value: AlertRule['severity']) => 
                      setNewRule({ ...newRule, severity: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">منخفض</SelectItem>
                      <SelectItem value="medium">متوسط</SelectItem>
                      <SelectItem value="high">عالي</SelectItem>
                      <SelectItem value="critical">حرج</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="ruleCondition">الشرط</Label>
                  <Select
                    value={newRule.condition}
                    onValueChange={(value) => setNewRule({ ...newRule, condition: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {conditionOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="ruleOperator">المشغل</Label>
                  <Select
                    value={newRule.operator}
                    onValueChange={(value: AlertRule['operator']) => 
                      setNewRule({ ...newRule, operator: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="greater">أكبر من</SelectItem>
                      <SelectItem value="less">أصغر من</SelectItem>
                      <SelectItem value="equal">يساوي</SelectItem>
                      <SelectItem value="not_equal">لا يساوي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="ruleThreshold">القيمة المحددة</Label>
                  <Input
                    id="ruleThreshold"
                    type="number"
                    value={newRule.threshold}
                    onChange={(e) => setNewRule({ ...newRule, threshold: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="ruleTimeWindow">النافزة الزمنية</Label>
                <Select
                  value={newRule.timeWindow}
                  onValueChange={(value) => setNewRule({ ...newRule, timeWindow: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1m">دقيقة واحدة</SelectItem>
                    <SelectItem value="5m">5 دقائق</SelectItem>
                    <SelectItem value="15m">15 دقيقة</SelectItem>
                    <SelectItem value="1h">ساعة واحدة</SelectItem>
                    <SelectItem value="24h">24 ساعة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={newRule.enabled}
                  onCheckedChange={(enabled) => setNewRule({ ...newRule, enabled })}
                />
                <Label>تفعيل القاعدة</Label>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleCreateRule} 
                  disabled={!newRule.name.trim() || isLoading} 
                  className="flex-1"
                >
                  إنشاء القاعدة
                </Button>
                <Button variant="outline" onClick={() => setShowCreateRule(false)}>
                  إلغاء
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}