import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BackupJob {
  id: string;
  name: string;
  type: 'full' | 'incremental' | 'differential';
  schedule: string;
  lastRun: Date | null;
  nextRun: Date | null;
  status: 'active' | 'paused' | 'error';
  retentionDays: number;
  size: number;
  tables: string[];
}

interface BackupHistory {
  id: string;
  jobId: string;
  startTime: Date;
  endTime: Date | null;
  status: 'running' | 'completed' | 'failed';
  size: number;
  duration: number;
  errorMessage?: string;
  progress: number;
}

interface BackupManagerProps {
  jobs: BackupJob[];
  history: BackupHistory[];
  availableTables: string[];
  onCreateJob: (job: Omit<BackupJob, 'id'>) => Promise<void>;
  onUpdateJob: (jobId: string, updates: Partial<BackupJob>) => Promise<void>;
  onDeleteJob: (jobId: string) => Promise<void>;
  onRunJob: (jobId: string) => Promise<void>;
  onRestoreBackup: (historyId: string) => Promise<void>;
  isLoading?: boolean;
}

export function BackupManager({
  jobs,
  history,
  availableTables,
  onCreateJob,
  onUpdateJob,
  onDeleteJob,
  onRunJob,
  onRestoreBackup,
  isLoading = false
}: BackupManagerProps) {
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [selectedJob, setSelectedJob] = useState<BackupJob | null>(null);
  const [newJob, setNewJob] = useState({
    name: '',
    type: 'full' as 'full' | 'incremental' | 'differential',
    schedule: 'daily',
    retentionDays: 30,
    tables: [] as string[]
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'running': return 'text-blue-600 bg-blue-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'active': return 'text-green-600 bg-green-100';
      case 'paused': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'مكتمل';
      case 'running': return 'جاري';
      case 'failed': return 'فشل';
      case 'active': return 'نشط';
      case 'paused': return 'متوقف';
      case 'error': return 'خطأ';
      default: return status;
    }
  };

  const handleCreateJob = async () => {
    if (!newJob.name.trim()) return;

    await onCreateJob({
      name: newJob.name,
      type: newJob.type,
      schedule: newJob.schedule,
      lastRun: null,
      nextRun: null,
      status: 'active',
      retentionDays: newJob.retentionDays,
      size: 0,
      tables: newJob.tables
    });

    // Reset form
    setNewJob({
      name: '',
      type: 'full',
      schedule: 'daily',
      retentionDays: 30,
      tables: []
    });
    setShowCreateJob(false);
  };

  const runningJobs = history.filter(h => h.status === 'running');
  const recentBackups = history
    .filter(h => h.status === 'completed')
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">إدارة النسخ الاحتياطية</h3>
          <p className="text-muted-foreground">جدولة وإدارة النسخ الاحتياطية التلقائية</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant={runningJobs.length > 0 ? 'default' : 'secondary'}>
            {runningJobs.length} عملية جارية
          </Badge>
          <Button onClick={() => setShowCreateJob(true)}>
            <i className="bi bi-plus-circle mr-2"></i>
            مهمة جديدة
          </Button>
        </div>
      </div>

      {/* Running Jobs Alert */}
      {runningJobs.length > 0 && (
        <Alert>
          <i className="bi bi-arrow-clockwise animate-spin"></i>
          <AlertDescription>
            يتم حالياً تشغيل {runningJobs.length} مهمة نسخ احتياطي.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backup Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <i className="bi bi-calendar-event"></i>
              مهام النسخ الاحتياطي ({jobs.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {jobs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <i className="bi bi-calendar-x text-2xl mb-2 block"></i>
                لا توجد مهام نسخ احتياطي
              </div>
            ) : (
              jobs.map((job) => (
                <div
                  key={job.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedJob?.id === job.id ? 'border-primary bg-primary/10' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedJob(job)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{job.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {job.type === 'full' ? 'نسخة كاملة' : job.type === 'incremental' ? 'تزايدية' : 'تفاضلية'}
                        {' • '}
                        {job.schedule === 'daily' ? 'يومياً' : job.schedule === 'weekly' ? 'أسبوعياً' : 'شهرياً'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(job.status)}>
                        {getStatusLabel(job.status)}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRunJob(job.id);
                        }}
                        disabled={isLoading}
                      >
                        <i className="bi bi-play"></i>
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">آخر تشغيل</p>
                      <p className="font-medium">
                        {job.lastRun ? job.lastRun.toLocaleDateString('ar-SA') : 'لم يتم بعد'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">التشغيل التالي</p>
                      <p className="font-medium">
                        {job.nextRun ? job.nextRun.toLocaleDateString('ar-SA') : 'غير محدد'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">الحجم</p>
                      <p className="font-medium">{formatFileSize(job.size)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Job Details or Recent Backups */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedJob ? 'تفاصيل المهمة' : 'النسخ الاحتياطية الحديثة'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedJob ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">اسم المهمة</Label>
                    <p className="font-medium">{selectedJob.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">النوع</Label>
                    <p className="font-medium">
                      {selectedJob.type === 'full' ? 'نسخة كاملة' : 
                       selectedJob.type === 'incremental' ? 'تزايدية' : 'تفاضلية'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">الجدولة</Label>
                    <p className="font-medium">
                      {selectedJob.schedule === 'daily' ? 'يومياً' : 
                       selectedJob.schedule === 'weekly' ? 'أسبوعياً' : 'شهرياً'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">فترة الاحتفاظ</Label>
                    <p className="font-medium">{selectedJob.retentionDays} يوم</p>
                  </div>
                </div>

                {selectedJob.tables.length > 0 && (
                  <div>
                    <Label className="text-sm text-muted-foreground">الجداول المشمولة</Label>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedJob.tables.map((table) => (
                        <Badge key={table} variant="outline" className="text-xs">
                          {table}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                <div className="flex gap-2">
                  <Button 
                    onClick={() => onRunJob(selectedJob.id)}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    <i className="bi bi-play mr-2"></i>
                    تشغيل الآن
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => onUpdateJob(selectedJob.id, { 
                      status: selectedJob.status === 'active' ? 'paused' : 'active' 
                    })}
                    disabled={isLoading}
                  >
                    <i className={`bi ${selectedJob.status === 'active' ? 'bi-pause' : 'bi-play'} mr-2`}></i>
                    {selectedJob.status === 'active' ? 'إيقاف' : 'تشغيل'}
                  </Button>
                  <Button 
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => {
                      if (confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
                        onDeleteJob(selectedJob.id);
                        setSelectedJob(null);
                      }
                    }}
                    disabled={isLoading}
                  >
                    <i className="bi bi-trash"></i>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {recentBackups.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <i className="bi bi-archive text-2xl mb-2 block"></i>
                    لا توجد نسخ احتياطية حديثة
                  </div>
                ) : (
                  recentBackups.map((backup) => (
                    <div key={backup.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(backup.status)}`}></div>
                          <span className="font-medium">
                            {jobs.find(j => j.id === backup.jobId)?.name || 'مهمة محذوفة'}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {backup.startTime.toLocaleDateString('ar-SA')} • 
                          {formatFileSize(backup.size)} • 
                          {Math.round(backup.duration / 1000)} ثانية
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRestoreBackup(backup.id)}
                        disabled={isLoading}
                      >
                        <i className="bi bi-arrow-clockwise mr-1"></i>
                        استرجاع
                      </Button>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Running Jobs Progress */}
      {runningJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <i className="bi bi-arrow-clockwise animate-spin"></i>
              العمليات الجارية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {runningJobs.map((job) => (
              <div key={job.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {jobs.find(j => j.id === job.jobId)?.name || 'مهمة غير معروفة'}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {job.progress}%
                  </span>
                </div>
                <Progress value={job.progress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    بدأ في {job.startTime.toLocaleTimeString('ar-SA')}
                  </span>
                  <span>
                    {formatFileSize(job.size)} • 
                    {Math.round((Date.now() - job.startTime.getTime()) / 1000)} ثانية
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Create Job Modal */}
      {showCreateJob && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>إنشاء مهمة نسخ احتياطي جديدة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="jobName">اسم المهمة</Label>
                <Input
                  id="jobName"
                  value={newJob.name}
                  onChange={(e) => setNewJob({ ...newJob, name: e.target.value })}
                  placeholder="النسخة الاحتياطية اليومية"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="jobType">نوع النسخة</Label>
                  <Select
                    value={newJob.type}
                    onValueChange={(value: 'full' | 'incremental' | 'differential') => 
                      setNewJob({ ...newJob, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">نسخة كاملة</SelectItem>
                      <SelectItem value="incremental">تزايدية</SelectItem>
                      <SelectItem value="differential">تفاضلية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="jobSchedule">الجدولة</Label>
                  <Select
                    value={newJob.schedule}
                    onValueChange={(value) => setNewJob({ ...newJob, schedule: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">يومياً</SelectItem>
                      <SelectItem value="weekly">أسبوعياً</SelectItem>
                      <SelectItem value="monthly">شهرياً</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="retentionDays">فترة الاحتفاظ (أيام)</Label>
                <Input
                  id="retentionDays"
                  type="number"
                  min="1"
                  max="365"
                  value={newJob.retentionDays}
                  onChange={(e) => setNewJob({ ...newJob, retentionDays: parseInt(e.target.value) })}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCreateJob} disabled={!newJob.name.trim() || isLoading} className="flex-1">
                  إنشاء المهمة
                </Button>
                <Button variant="outline" onClick={() => setShowCreateJob(false)}>
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