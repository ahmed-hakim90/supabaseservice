import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SystemConfig {
  system: {
    appName: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
    timezone: string;
    language: string;
    maintenanceMode: boolean;
  };
  database: {
    maxConnections: number;
    connectionTimeout: number;
    backupSchedule: string;
    autoBackup: boolean;
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    defaultLanguage: string;
    retryAttempts: number;
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordMinLength: number;
    twoFactorRequired: boolean;
    allowedDomains: string[];
  };
  features: {
    realtimeUpdates: boolean;
    darkMode: boolean;
    exportEnabled: boolean;
    importEnabled: boolean;
    auditLogging: boolean;
  };
}

interface SystemConfiguratorProps {
  config: SystemConfig;
  onConfigChange: (config: SystemConfig) => void;
  onSave: () => Promise<void>;
  isLoading?: boolean;
}

export function SystemConfigurator({
  config,
  onConfigChange,
  onSave,
  isLoading = false
}: SystemConfiguratorProps) {
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const updateConfig = (section: keyof SystemConfig, key: string, value: any) => {
    const newConfig = {
      ...config,
      [section]: {
        ...config[section],
        [key]: value
      }
    };
    onConfigChange(newConfig);
    setUnsavedChanges(true);
  };

  const validateConfig = (): string[] => {
    const errors: string[] = [];
    
    if (!config.system.appName.trim()) {
      errors.push('اسم التطبيق مطلوب');
    }
    
    if (config.database.maxConnections < 1 || config.database.maxConnections > 100) {
      errors.push('عدد الاتصالات يجب أن يكون بين 1 و 100');
    }
    
    if (config.database.connectionTimeout < 5000) {
      errors.push('مهلة الاتصال يجب أن تكون 5 ثوانٍ على الأقل');
    }
    
    if (config.security.sessionTimeout < 300) {
      errors.push('مهلة الجلسة يجب أن تكون 5 دقائق على الأقل');
    }
    
    if (config.security.passwordMinLength < 6) {
      errors.push('طول كلمة المرور يجب أن يكون 6 أحرف على الأقل');
    }
    
    return errors;
  };

  const handleSave = async () => {
    const errors = validateConfig();
    setValidationErrors(errors);
    
    if (errors.length === 0) {
      await onSave();
      setUnsavedChanges(false);
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (unsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [unsavedChanges]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إعدادات النظام</h2>
          <p className="text-muted-foreground">تكوين إعدادات النظام والميزات</p>
        </div>
        <div className="flex items-center gap-3">
          {unsavedChanges && (
            <Badge variant="secondary">
              <i className="bi bi-dot text-orange-500 mr-1"></i>
              تغييرات غير محفوظة
            </Badge>
          )}
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="loading-spinner w-4 h-4 mr-2"></div>
                جاري الحفظ...
              </>
            ) : (
              <>
                <i className="bi bi-save mr-2"></i>
                حفظ الإعدادات
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <i className="bi bi-exclamation-triangle-fill text-red-600"></i>
          <AlertDescription>
            <div className="font-medium mb-2">يرجى تصحيح الأخطاء التالية:</div>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <i className="bi bi-gear"></i>
              إعدادات النظام
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="appName">اسم التطبيق</Label>
                <Input
                  id="appName"
                  value={config.system.appName}
                  onChange={(e) => updateConfig('system', 'appName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="version">الإصدار</Label>
                <Input
                  id="version"
                  value={config.system.version}
                  onChange={(e) => updateConfig('system', 'version', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="environment">البيئة</Label>
                <Select
                  value={config.system.environment}
                  onValueChange={(value) => updateConfig('system', 'environment', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="development">التطوير</SelectItem>
                    <SelectItem value="staging">الاختبار</SelectItem>
                    <SelectItem value="production">الإنتاج</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">المنطقة الزمنية</Label>
                <Select
                  value={config.system.timezone}
                  onValueChange={(value) => updateConfig('system', 'timezone', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Riyadh">الرياض</SelectItem>
                    <SelectItem value="Asia/Dubai">دبي</SelectItem>
                    <SelectItem value="Asia/Kuwait">الكويت</SelectItem>
                    <SelectItem value="Africa/Cairo">القاهرة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="maintenanceMode"
                checked={config.system.maintenanceMode}
                onCheckedChange={(checked) => updateConfig('system', 'maintenanceMode', checked)}
              />
              <Label htmlFor="maintenanceMode">وضع الصيانة</Label>
            </div>
          </CardContent>
        </Card>

        {/* Database Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <i className="bi bi-database"></i>
              إعدادات قاعدة البيانات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxConnections">الحد الأقصى للاتصالات</Label>
                <Input
                  id="maxConnections"
                  type="number"
                  min="1"
                  max="100"
                  value={config.database.maxConnections}
                  onChange={(e) => updateConfig('database', 'maxConnections', parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="connectionTimeout">مهلة الاتصال (مللي ثانية)</Label>
                <Input
                  id="connectionTimeout"
                  type="number"
                  min="5000"
                  value={config.database.connectionTimeout}
                  onChange={(e) => updateConfig('database', 'connectionTimeout', parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="backupSchedule">جدولة النسخ الاحتياطي</Label>
              <Select
                value={config.database.backupSchedule}
                onValueChange={(value) => updateConfig('database', 'backupSchedule', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">كل ساعة</SelectItem>
                  <SelectItem value="daily">يومياً</SelectItem>
                  <SelectItem value="weekly">أسبوعياً</SelectItem>
                  <SelectItem value="monthly">شهرياً</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="autoBackup"
                checked={config.database.autoBackup}
                onCheckedChange={(checked) => updateConfig('database', 'autoBackup', checked)}
              />
              <Label htmlFor="autoBackup">النسخ الاحتياطي التلقائي</Label>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <i className="bi bi-shield-lock"></i>
              إعدادات الأمان
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">مهلة الجلسة (ثانية)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  min="300"
                  value={config.security.sessionTimeout}
                  onChange={(e) => updateConfig('security', 'sessionTimeout', parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxLoginAttempts">الحد الأقصى لمحاولات تسجيل الدخول</Label>
                <Input
                  id="maxLoginAttempts"
                  type="number"
                  min="1"
                  max="10"
                  value={config.security.maxLoginAttempts}
                  onChange={(e) => updateConfig('security', 'maxLoginAttempts', parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="passwordMinLength">الحد الأدنى لطول كلمة المرور</Label>
              <Input
                id="passwordMinLength"
                type="number"
                min="6"
                max="32"
                value={config.security.passwordMinLength}
                onChange={(e) => updateConfig('security', 'passwordMinLength', parseInt(e.target.value))}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="twoFactorRequired"
                checked={config.security.twoFactorRequired}
                onCheckedChange={(checked) => updateConfig('security', 'twoFactorRequired', checked)}
              />
              <Label htmlFor="twoFactorRequired">المصادقة الثنائية مطلوبة</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="allowedDomains">النطاقات المسموحة (كل نطاق في سطر)</Label>
              <Textarea
                id="allowedDomains"
                value={config.security.allowedDomains.join('\n')}
                onChange={(e) => updateConfig('security', 'allowedDomains', e.target.value.split('\n').filter(d => d.trim()))}
                placeholder="company.com\npartner.com"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <i className="bi bi-bell"></i>
              إعدادات التنبيهات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="emailEnabled"
                  checked={config.notifications.emailEnabled}
                  onCheckedChange={(checked) => updateConfig('notifications', 'emailEnabled', checked)}
                />
                <Label htmlFor="emailEnabled">تنبيهات البريد الإلكتروني</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="smsEnabled"
                  checked={config.notifications.smsEnabled}
                  onCheckedChange={(checked) => updateConfig('notifications', 'smsEnabled', checked)}
                />
                <Label htmlFor="smsEnabled">تنبيهات الرسائل النصية</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="pushEnabled"
                  checked={config.notifications.pushEnabled}
                  onCheckedChange={(checked) => updateConfig('notifications', 'pushEnabled', checked)}
                />
                <Label htmlFor="pushEnabled">التنبيهات الفورية</Label>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="defaultLanguage">اللغة الافتراضية</Label>
                <Select
                  value={config.notifications.defaultLanguage}
                  onValueChange={(value) => updateConfig('notifications', 'defaultLanguage', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ar">العربية</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="retryAttempts">محاولات الإعادة</Label>
                <Input
                  id="retryAttempts"
                  type="number"
                  min="0"
                  max="5"
                  value={config.notifications.retryAttempts}
                  onChange={(e) => updateConfig('notifications', 'retryAttempts', parseInt(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Settings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <i className="bi bi-toggles2"></i>
              إعدادات الميزات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="realtimeUpdates"
                  checked={config.features.realtimeUpdates}
                  onCheckedChange={(checked) => updateConfig('features', 'realtimeUpdates', checked)}
                />
                <Label htmlFor="realtimeUpdates" className="text-sm">التحديثات الفورية</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="darkMode"
                  checked={config.features.darkMode}
                  onCheckedChange={(checked) => updateConfig('features', 'darkMode', checked)}
                />
                <Label htmlFor="darkMode" className="text-sm">الوضع المظلم</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="exportEnabled"
                  checked={config.features.exportEnabled}
                  onCheckedChange={(checked) => updateConfig('features', 'exportEnabled', checked)}
                />
                <Label htmlFor="exportEnabled" className="text-sm">تصدير البيانات</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="importEnabled"
                  checked={config.features.importEnabled}
                  onCheckedChange={(checked) => updateConfig('features', 'importEnabled', checked)}
                />
                <Label htmlFor="importEnabled" className="text-sm">استيراد البيانات</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="auditLogging"
                  checked={config.features.auditLogging}
                  onCheckedChange={(checked) => updateConfig('features', 'auditLogging', checked)}
                />
                <Label htmlFor="auditLogging" className="text-sm">تسجيل العمليات</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reset to Defaults */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <i className="bi bi-exclamation-triangle text-yellow-600"></i>
              <div>
                <p className="font-medium text-yellow-900">إعادة تعيين الإعدادات</p>
                <p className="text-sm text-yellow-700">سيؤدي هذا إلى إعادة جميع الإعدادات إلى القيم الافتراضية</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              onClick={() => {
                if (confirm('هل أنت متأكد من إعادة تعيين جميع الإعدادات؟')) {
                  // Reset to default config
                  console.log('Reset to defaults');
                }
              }}
            >
              إعادة تعيين
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}