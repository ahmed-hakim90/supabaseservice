import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SystemUpdate {
  id: string;
  name: string;
  version: string;
  currentVersion: string;
  category: 'security' | 'feature' | 'bugfix' | 'performance';
  priority: 'low' | 'medium' | 'high' | 'critical';
  size: number; // in MB
  description: string;
  releaseDate: Date;
  status: 'available' | 'downloading' | 'installing' | 'installed' | 'failed';
  progress?: number;
  requiresRestart: boolean;
  dependencies?: string[];
  changelog: string[];
}

interface UpdateChannel {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'manual';
  lastCheck: Date | null;
  nextCheck: Date | null;
}

interface UpdateHistory {
  id: string;
  updateId: string;
  updateName: string;
  version: string;
  installedDate: Date;
  installedBy: string;
  status: 'success' | 'failed' | 'rollback';
  duration: number; // in minutes
  notes?: string;
}

interface UpdateSettings {
  autoUpdate: boolean;
  downloadAutomatic: boolean;
  installScheduled: boolean;
  maintenanceWindow: {
    start: string; // HH:MM
    end: string; // HH:MM
    days: string[]; // ['monday', 'tuesday', ...]
  };
  backupBeforeUpdate: boolean;
  rollbackEnabled: boolean;
  notifications: {
    available: boolean;
    installed: boolean;
    failed: boolean;
  };
}

interface UpdateManagerProps {
  updates: SystemUpdate[];
  channels: UpdateChannel[];
  history: UpdateHistory[];
  settings: UpdateSettings;
  onInstallUpdate: (updateId: string) => Promise<void>;
  onRollbackUpdate: (historyId: string) => Promise<void>;
  onCheckUpdates: () => Promise<void>;
  onUpdateSettings: (settings: Partial<UpdateSettings>) => Promise<void>;
  onUpdateChannel: (channelId: string, updates: Partial<UpdateChannel>) => Promise<void>;
  isLoading?: boolean;
}

export function UpdateManager({
  updates,
  channels,
  history,
  settings,
  onInstallUpdate,
  onRollbackUpdate,
  onCheckUpdates,
  onUpdateSettings,
  onUpdateChannel,
  isLoading = false
}: UpdateManagerProps) {
  const [activeTab, setActiveTab] = useState('updates');
  const [selectedUpdate, setSelectedUpdate] = useState<SystemUpdate | null>(null);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-700 bg-red-100 border-red-200';
      case 'high': return 'text-orange-700 bg-orange-100 border-orange-200';
      case 'medium': return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-blue-700 bg-blue-100 border-blue-200';
      default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security': return 'bi-shield-check';
      case 'feature': return 'bi-stars';
      case 'bugfix': return 'bi-bug';
      case 'performance': return 'bi-speedometer2';
      default: return 'bi-arrow-up-circle';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-blue-600 bg-blue-100';
      case 'downloading': return 'text-purple-600 bg-purple-100';
      case 'installing': return 'text-orange-600 bg-orange-100';
      case 'installed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const availableUpdates = updates.filter(u => u.status === 'available');
  const criticalUpdates = availableUpdates.filter(u => u.priority === 'critical');
  const securityUpdates = availableUpdates.filter(u => u.category === 'security');
  const installingUpdates = updates.filter(u => u.status === 'downloading' || u.status === 'installing');

  const formatSize = (sizeInMB: number): string => {
    if (sizeInMB < 1024) return `${sizeInMB} MB`;
    return `${(sizeInMB / 1024).toFixed(1)} GB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">إدارة التحديثات</h3>
          <p className="text-muted-foreground">تحديثات النظام والتطبيقات</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant={criticalUpdates.length > 0 ? 'destructive' : 'secondary'}>
            {criticalUpdates.length} تحديث حرج
          </Badge>
          <Badge variant={securityUpdates.length > 0 ? 'default' : 'secondary'}>
            {securityUpdates.length} تحديث أمني
          </Badge>
          <Button onClick={onCheckUpdates} disabled={isLoading}>
            <i className="bi bi-arrow-clockwise mr-2"></i>
            فحص التحديثات
          </Button>
        </div>
      </div>

      {/* Critical Updates Alert */}
      {criticalUpdates.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <i className="bi bi-exclamation-triangle-fill text-red-600"></i>
          <AlertDescription className="text-red-800">
            يوجد {criticalUpdates.length} تحديث حرج متاح. يُنصح بتثبيتها فوراً لضمان الأمان.
          </AlertDescription>
        </Alert>
      )}

      {/* Installing Updates Alert */}
      {installingUpdates.length > 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <i className="bi bi-arrow-clockwise animate-spin text-blue-600"></i>
          <AlertDescription className="text-blue-800">
            يتم حالياً تثبيت {installingUpdates.length} تحديث. لا تقم بإيقاف النظام.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="updates">التحديثات المتاحة</TabsTrigger>
          <TabsTrigger value="channels">قنوات التحديث</TabsTrigger>
          <TabsTrigger value="history">سجل التحديثات</TabsTrigger>
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
        </TabsList>

        <TabsContent value="updates" className="space-y-4">
          {/* Update Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">التحديثات المتاحة</p>
                    <p className="text-2xl font-bold">{availableUpdates.length}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <i className="bi bi-arrow-up-circle text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">تحديثات أمنية</p>
                    <p className="text-2xl font-bold">{securityUpdates.length}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                    <i className="bi bi-shield-check text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">تحديثات حرجة</p>
                    <p className="text-2xl font-bold">{criticalUpdates.length}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    criticalUpdates.length > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
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
                    <p className="text-sm text-muted-foreground">جاري التثبيت</p>
                    <p className="text-2xl font-bold">{installingUpdates.length}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                    <i className="bi bi-arrow-clockwise animate-spin text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Updates List */}
          <Card>
            <CardHeader>
              <CardTitle>التحديثات المتاحة ({updates.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {updates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <i className="bi bi-check-circle text-2xl mb-2 block"></i>
                    جميع التحديثات محدثة
                  </div>
                ) : (
                  updates.map((update) => (
                    <div
                      key={update.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedUpdate?.id === update.id ? 'border-primary bg-primary/10' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedUpdate(update)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <i className={`bi ${getCategoryIcon(update.category)} text-xl mt-1`}></i>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium">{update.name}</span>
                              <Badge variant="outline">{update.currentVersion} → {update.version}</Badge>
                              <Badge className={getPriorityColor(update.priority)}>
                                {update.priority}
                              </Badge>
                              <Badge className={getStatusColor(update.status)}>
                                {update.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {update.description}
                            </p>
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>الحجم: {formatSize(update.size)}</span>
                              <span>الإصدار: {update.releaseDate.toLocaleDateString('ar-SA')}</span>
                              {update.requiresRestart && (
                                <span className="text-orange-600">يتطلب إعادة تشغيل</span>
                              )}
                            </div>
                            
                            {(update.status === 'downloading' || update.status === 'installing') && (
                              <div className="mt-3">
                                <div className="flex justify-between text-xs mb-1">
                                  <span>{update.status === 'downloading' ? 'جاري التحميل' : 'جاري التثبيت'}</span>
                                  <span>{update.progress || 0}%</span>
                                </div>
                                <Progress value={update.progress || 0} className="h-2" />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          {update.status === 'available' && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                onInstallUpdate(update.id);
                              }}
                              disabled={isLoading}
                              size="sm"
                            >
                              <i className="bi bi-download mr-1"></i>
                              تثبيت
                            </Button>
                          )}
                          
                          {selectedUpdate?.id === update.id && (
                            <Button variant="ghost" size="sm">
                              <i className="bi bi-eye"></i>
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

        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>قنوات التحديث</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {channels.map((channel) => (
                <div key={channel.id} className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{channel.name}</h4>
                      <p className="text-sm text-muted-foreground">{channel.description}</p>
                    </div>
                    <Switch
                      checked={channel.enabled}
                      onCheckedChange={(enabled) => 
                        onUpdateChannel(channel.id, { enabled })
                      }
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">التكرار:</span>
                      <span className="mr-2 font-medium">{channel.frequency}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">آخر فحص:</span>
                      <span className="mr-2 font-medium">
                        {channel.lastCheck ? channel.lastCheck.toLocaleDateString('ar-SA') : 'لم يتم بعد'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">الفحص التالي:</span>
                      <span className="mr-2 font-medium">
                        {channel.nextCheck ? channel.nextCheck.toLocaleDateString('ar-SA') : 'غير محدد'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>سجل التحديثات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {history.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <i className="bi bi-clock-history text-2xl mb-2 block"></i>
                    لا يوجد سجل تحديثات
                  </div>
                ) : (
                  history.map((item) => (
                    <div key={item.id} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            item.status === 'success' ? 'bg-green-500' :
                            item.status === 'failed' ? 'bg-red-500' :
                            'bg-yellow-500'
                          }`}></div>
                          <span className="font-medium">{item.updateName}</span>
                          <Badge variant="outline">{item.version}</Badge>
                        </div>
                        
                        {item.status === 'success' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onRollbackUpdate(item.id)}
                            disabled={isLoading}
                            className="text-orange-600 border-orange-200 hover:bg-orange-50"
                          >
                            <i className="bi bi-arrow-counterclockwise mr-1"></i>
                            تراجع
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">تاريخ التثبيت:</span>
                          <span className="mr-2">{item.installedDate.toLocaleDateString('ar-SA')}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">المثبت بواسطة:</span>
                          <span className="mr-2">{item.installedBy}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">المدة:</span>
                          <span className="mr-2">{item.duration} دقيقة</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">الحالة:</span>
                          <Badge className={
                            item.status === 'success' ? 'bg-green-100 text-green-700' :
                            item.status === 'failed' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }>
                            {item.status}
                          </Badge>
                        </div>
                      </div>
                      
                      {item.notes && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          <span>ملاحظات: </span>
                          {item.notes}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات التحديث</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Auto Update Settings */}
              <div className="space-y-4">
                <h4 className="font-medium">التحديث التلقائي</h4>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>تفعيل التحديث التلقائي</Label>
                    <p className="text-sm text-muted-foreground">تحديث النظام تلقائياً عند توفر تحديثات</p>
                  </div>
                  <Switch
                    checked={settings.autoUpdate}
                    onCheckedChange={(autoUpdate) => onUpdateSettings({ autoUpdate })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>تحميل تلقائي</Label>
                    <p className="text-sm text-muted-foreground">تحميل التحديثات تلقائياً في الخلفية</p>
                  </div>
                  <Switch
                    checked={settings.downloadAutomatic}
                    onCheckedChange={(downloadAutomatic) => onUpdateSettings({ downloadAutomatic })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>تثبيت مجدول</Label>
                    <p className="text-sm text-muted-foreground">تثبيت التحديثات في وقت محدد</p>
                  </div>
                  <Switch
                    checked={settings.installScheduled}
                    onCheckedChange={(installScheduled) => onUpdateSettings({ installScheduled })}
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium mb-4">النسخ الاحتياطي والاستعادة</h4>
                
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Label>نسخ احتياطي قبل التحديث</Label>
                    <p className="text-sm text-muted-foreground">إنشاء نسخة احتياطية قبل تثبيت التحديثات</p>
                  </div>
                  <Switch
                    checked={settings.backupBeforeUpdate}
                    onCheckedChange={(backupBeforeUpdate) => onUpdateSettings({ backupBeforeUpdate })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>تفعيل التراجع</Label>
                    <p className="text-sm text-muted-foreground">السماح بالتراجع عن التحديثات</p>
                  </div>
                  <Switch
                    checked={settings.rollbackEnabled}
                    onCheckedChange={(rollbackEnabled) => onUpdateSettings({ rollbackEnabled })}
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium mb-4">إعدادات التنبيهات</h4>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>تنبيه التحديثات المتاحة</Label>
                    <Switch
                      checked={settings.notifications.available}
                      onCheckedChange={(available) => 
                        onUpdateSettings({
                          notifications: { ...settings.notifications, available }
                        })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>تنبيه التحديثات المثبتة</Label>
                    <Switch
                      checked={settings.notifications.installed}
                      onCheckedChange={(installed) => 
                        onUpdateSettings({
                          notifications: { ...settings.notifications, installed }
                        })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>تنبيه فشل التحديثات</Label>
                    <Switch
                      checked={settings.notifications.failed}
                      onCheckedChange={(failed) => 
                        onUpdateSettings({
                          notifications: { ...settings.notifications, failed }
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}