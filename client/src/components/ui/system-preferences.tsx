import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { Settings, RefreshCw } from 'lucide-react';

export function SystemPreferences() {
  const { preferences, isLoading, actions: preferenceActions } = useUserPreferences();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        جاري التحميل...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            إعدادات المظهر
          </CardTitle>
          <CardDescription>
            اختر التيم المناسب لك
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeToggle variant="cards" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>إعدادات الإشعارات</CardTitle>
          <CardDescription>تحكم في أنواع الإشعارات التي تريد تلقيها</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">إشعارات البريد الإلكتروني</h4>
              <p className="text-sm text-muted-foreground">تلقي الإشعارات عبر البريد الإلكتروني</p>
            </div>
            <Switch
              checked={preferences.notifications.emailNotifications}
              onCheckedChange={(checked) => 
                preferenceActions.updateNotifications({ emailNotifications: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">الإشعارات الفورية</h4>
              <p className="text-sm text-muted-foreground">تلقي إشعارات فورية في المتصفح</p>
            </div>
            <Switch
              checked={preferences.notifications.pushNotifications}
              onCheckedChange={(checked) => 
                preferenceActions.updateNotifications({ pushNotifications: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">تنبيهات النظام</h4>
              <p className="text-sm text-muted-foreground">تلقي تنبيهات حول حالة النظام</p>
            </div>
            <Switch
              checked={preferences.notifications.systemAlerts}
              onCheckedChange={(checked) => 
                preferenceActions.updateNotifications({ systemAlerts: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">تنبيهات الأمان</h4>
              <p className="text-sm text-muted-foreground">تلقي تنبيهات حول المشاكل الأمنية</p>
            </div>
            <Switch
              checked={preferences.notifications.securityAlerts}
              onCheckedChange={(checked) => 
                preferenceActions.updateNotifications({ securityAlerts: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>إعدادات الأداء</CardTitle>
          <CardDescription>تحسين أداء النظام حسب احتياجاتك</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">التحديث التلقائي</h4>
              <p className="text-sm text-muted-foreground">تحديث البيانات تلقائياً</p>
            </div>
            <Switch
              checked={preferences.performance.autoRefresh}
              onCheckedChange={(checked) => 
                preferenceActions.updatePerformance({ autoRefresh: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">الرسوم المتحركة</h4>
              <p className="text-sm text-muted-foreground">تفعيل الحركات والانتقالات</p>
            </div>
            <Switch
              checked={preferences.performance.animationsEnabled}
              onCheckedChange={(checked) => 
                preferenceActions.updatePerformance({ animationsEnabled: checked })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">فترة التحديث (بالثواني)</label>
            <select 
              value={preferences.performance.refreshInterval}
              onChange={(e) => 
                preferenceActions.updatePerformance({ refreshInterval: Number(e.target.value) })
              }
              className="w-full p-2 border rounded-md bg-background"
            >
              <option value={15}>15 ثانية</option>
              <option value={30}>30 ثانية</option>
              <option value={60}>60 ثانية</option>
              <option value={300}>5 دقائق</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button 
          variant="outline" 
          onClick={preferenceActions.resetToDefaults}
        >
          إعادة تعيين
        </Button>
        <Button onClick={preferenceActions.reload}>
          <RefreshCw className="h-4 w-4 mr-2" />
          تحديث
        </Button>
      </div>
    </div>
  );
}