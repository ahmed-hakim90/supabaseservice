import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

interface NotificationItem {
  id: string;
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  action?: {
    label: string;
    onClick: () => void;
  };
  priority: 'high' | 'medium' | 'low';
}

interface NotificationCenterProps {
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDismiss: (id: string) => void;
}

export function NotificationCenter({ 
  notifications, 
  onMarkAsRead, 
  onMarkAllAsRead, 
  onDismiss 
}: NotificationCenterProps) {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning': return 'bi-exclamation-triangle-fill';
      case 'info': return 'bi-info-circle-fill';
      case 'success': return 'bi-check-circle-fill';
      case 'error': return 'bi-x-circle-fill';
      default: return 'bi-bell-fill';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'info': return 'text-blue-600 bg-blue-100';
      case 'success': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const priorityOrder = { high: 3, medium: 2, low: 1 };
  const sortedNotifications = [...notifications].sort((a, b) => 
    priorityOrder[b.priority] - priorityOrder[a.priority]
  );

  const unreadCount = notifications.length;
  const highPriorityCount = notifications.filter(n => n.priority === 'high').length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <i className="bi bi-bell"></i>
          التنبيهات
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount}
            </Badge>
          )}
        </CardTitle>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onMarkAllAsRead}>
            تمييز الكل كمقروء
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="space-y-3">
        {unreadCount === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <i className="bi bi-check-circle text-2xl mb-2 block text-green-500"></i>
            لا توجد تنبيهات جديدة
          </div>
        ) : (
          <>
            {/* High Priority Alerts */}
            {highPriorityCount > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  تنبيهات عاجلة ({highPriorityCount})
                </div>
                <div className="space-y-2">
                  {sortedNotifications
                    .filter(notification => notification.priority === 'high')
                    .slice(0, 3)
                    .map((notification) => (
                      <div key={notification.id} className="bg-white p-2 rounded border border-red-100">
                        <p className="text-sm font-medium text-red-900">{notification.title}</p>
                        <p className="text-xs text-red-700">{notification.message}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-red-600">
                            {notification.timestamp.toLocaleTimeString('ar-SA')}
                          </span>
                          <div className="flex gap-1">
                            {notification.action && (
                              <Button size="sm" variant="outline" onClick={notification.action.onClick}>
                                {notification.action.label}
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => onDismiss(notification.id)}>
                              <i className="bi bi-x"></i>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Regular Notifications */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {sortedNotifications
                .filter(notification => notification.priority !== 'high')
                .slice(0, 5)
                .map((notification) => (
                  <div key={notification.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                      <i className={`bi ${getNotificationIcon(notification.type)}`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{notification.title}</p>
                      <p className="text-xs text-muted-foreground">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.timestamp.toLocaleDateString('ar-SA')} - 
                        {notification.timestamp.toLocaleTimeString('ar-SA', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      {notification.priority === 'high' && (
                        <Badge variant="destructive" className="text-xs">عاجل</Badge>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => onDismiss(notification.id)}>
                        <i className="bi bi-x"></i>
                      </Button>
                    </div>
                  </div>
                ))}
            </div>

            {notifications.length > 5 && (
              <div className="text-center pt-2">
                <Button variant="outline" size="sm">
                  عرض جميع التنبيهات ({notifications.length})
                  <i className="bi bi-arrow-left mr-1"></i>
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface SystemAlert {
  id: string;
  level: 'critical' | 'warning' | 'info';
  message: string;
  details: string;
  timestamp: Date;
  resolved: boolean;
}

interface SystemAlertsProps {
  alerts: SystemAlert[];
  onResolve: (id: string) => void;
  onViewDetails: (alert: SystemAlert) => void;
}

export function SystemAlerts({ alerts, onResolve, onViewDetails }: SystemAlertsProps) {
  const activeAlerts = alerts.filter(alert => !alert.resolved);
  const criticalAlerts = activeAlerts.filter(alert => alert.level === 'critical');
  
  if (activeAlerts.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <i className="bi bi-shield-check text-4xl text-green-500 mb-2 block"></i>
          <p className="text-green-600 font-medium">النظام يعمل بشكل طبيعي</p>
          <p className="text-sm text-muted-foreground">لا توجد تنبيهات نظام حالياً</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <i className="bi bi-shield-exclamation text-orange-600"></i>
          تنبيهات النظام
          <Badge variant={criticalAlerts.length > 0 ? 'destructive' : 'secondary'}>
            {activeAlerts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {activeAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 rounded-lg border-l-4 ${
              alert.level === 'critical' 
                ? 'bg-red-50 border-l-red-500' 
                : alert.level === 'warning'
                ? 'bg-yellow-50 border-l-yellow-500'
                : 'bg-blue-50 border-l-blue-500'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <i className={`bi ${
                  alert.level === 'critical' 
                    ? 'bi-exclamation-triangle-fill text-red-600' 
                    : alert.level === 'warning'
                    ? 'bi-exclamation-circle-fill text-yellow-600'
                    : 'bi-info-circle-fill text-blue-600'
                }`}></i>
                <span className={`font-medium text-sm ${
                  alert.level === 'critical' 
                    ? 'text-red-900' 
                    : alert.level === 'warning'
                    ? 'text-yellow-900'
                    : 'text-blue-900'
                }`}>
                  {alert.message}
                </span>
              </div>
              <Badge variant={alert.level === 'critical' ? 'destructive' : 'secondary'}>
                {alert.level === 'critical' ? 'حرج' : alert.level === 'warning' ? 'تحذير' : 'معلومات'}
              </Badge>
            </div>
            
            <p className="text-xs text-muted-foreground mb-3">{alert.details}</p>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {alert.timestamp.toLocaleDateString('ar-SA')} - 
                {alert.timestamp.toLocaleTimeString('ar-SA')}
              </span>
              
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => onViewDetails(alert)}
                >
                  التفاصيل
                </Button>
                <Button 
                  size="sm" 
                  variant="default"
                  onClick={() => onResolve(alert.id)}
                >
                  حل المشكلة
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  estimatedTime?: string;
  completedAt?: Date;
}

interface WorkflowProgressProps {
  title: string;
  steps: WorkflowStep[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
}

export function WorkflowProgress({ 
  title, 
  steps, 
  currentStep, 
  onStepClick 
}: WorkflowProgressProps) {
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const progress = (completedSteps / steps.length) * 100;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <div className="flex items-center gap-3">
          <Progress value={progress} className="flex-1" />
          <span className="text-sm text-muted-foreground">
            {completedSteps}/{steps.length}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
              index === currentStep 
                ? 'bg-primary/10 border border-primary/20' 
                : step.status === 'completed'
                ? 'bg-green-50 border border-green-200'
                : step.status === 'failed'
                ? 'bg-red-50 border border-red-200'
                : 'bg-muted/30'
            }`}
            onClick={() => onStepClick?.(index)}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step.status === 'completed' 
                ? 'bg-green-500 text-white' 
                : step.status === 'failed'
                ? 'bg-red-500 text-white'
                : step.status === 'in_progress'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-300 text-gray-600'
            }`}>
              {step.status === 'completed' ? (
                <i className="bi bi-check"></i>
              ) : step.status === 'failed' ? (
                <i className="bi bi-x"></i>
              ) : step.status === 'in_progress' ? (
                <div className="loading-spinner w-4 h-4"></div>
              ) : (
                <span className="text-xs font-bold">{index + 1}</span>
              )}
            </div>
            
            <div className="flex-1">
              <h4 className="font-medium">{step.title}</h4>
              <p className="text-sm text-muted-foreground">{step.description}</p>
              
              <div className="flex items-center gap-4 mt-2">
                {step.estimatedTime && (
                  <span className="text-xs text-muted-foreground">
                    <i className="bi bi-clock mr-1"></i>
                    {step.estimatedTime}
                  </span>
                )}
                
                {step.completedAt && (
                  <span className="text-xs text-green-600">
                    <i className="bi bi-check-circle mr-1"></i>
                    مكتمل في {step.completedAt.toLocaleTimeString('ar-SA')}
                  </span>
                )}
                
                <Badge variant={
                  step.status === 'completed' ? 'default' :
                  step.status === 'failed' ? 'destructive' :
                  step.status === 'in_progress' ? 'secondary' : 'outline'
                }>
                  {step.status === 'completed' ? 'مكتمل' :
                   step.status === 'failed' ? 'فشل' :
                   step.status === 'in_progress' ? 'جاري' : 'في الانتظار'}
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}