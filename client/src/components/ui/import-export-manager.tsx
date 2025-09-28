import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

interface BackupFile {
  id: string;
  name: string;
  size: number;
  createdAt: Date;
  type: 'full' | 'partial' | 'schema';
  status: 'completed' | 'in_progress' | 'failed';
  downloadUrl?: string;
}

interface RestorePoint {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  dataSize: number;
  tablesCount: number;
}

interface ImportExportManagerProps {
  backups: BackupFile[];
  restorePoints: RestorePoint[];
  onCreateBackup: (options: {
    name: string;
    type: 'full' | 'partial' | 'schema';
    tables?: string[];
    includeData: boolean;
  }) => Promise<void>;
  onRestore: (backupId: string) => Promise<void>;
  onImport: (file: File, options: {
    format: 'csv' | 'xlsx' | 'json' | 'sql';
    table: string;
    mode: 'replace' | 'append' | 'update';
  }) => Promise<void>;
  onExport: (options: {
    format: 'csv' | 'xlsx' | 'json' | 'sql';
    tables: string[];
    includeSchema: boolean;
  }) => Promise<void>;
  availableTables: string[];
  isLoading?: boolean;
}

export function ImportExportManager({
  backups,
  restorePoints,
  onCreateBackup,
  onRestore,
  onImport,
  onExport,
  availableTables,
  isLoading = false
}: ImportExportManagerProps) {
  const [activeTab, setActiveTab] = useState<'backup' | 'import' | 'export'>('backup');
  const [backupOptions, setBackupOptions] = useState({
    name: '',
    type: 'full' as 'full' | 'partial' | 'schema',
    tables: [] as string[],
    includeData: true
  });
  const [importOptions, setImportOptions] = useState({
    format: 'csv' as 'csv' | 'xlsx' | 'json' | 'sql',
    table: '',
    mode: 'append' as 'replace' | 'append' | 'update'
  });
  const [exportOptions, setExportOptions] = useState({
    format: 'csv' as 'csv' | 'xlsx' | 'json' | 'sql',
    tables: [] as string[],
    includeSchema: false
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleCreateBackup = async () => {
    if (!backupOptions.name.trim()) return;
    await onCreateBackup(backupOptions);
    setBackupOptions({
      name: '',
      type: 'full',
      tables: [],
      includeData: true
    });
  };

  const handleImport = async () => {
    if (!selectedFile || !importOptions.table) return;
    await onImport(selectedFile, importOptions);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExport = async () => {
    if (exportOptions.tables.length === 0) return;
    await onExport(exportOptions);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">إدارة البيانات</h2>
        <p className="text-muted-foreground">استيراد وتصدير ونسخ احتياطي للبيانات</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === 'backup' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('backup')}
        >
          <i className="bi bi-shield-check mr-2"></i>
          النسخ الاحتياطي
        </Button>
        <Button
          variant={activeTab === 'import' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('import')}
        >
          <i className="bi bi-upload mr-2"></i>
          الاستيراد
        </Button>
        <Button
          variant={activeTab === 'export' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('export')}
        >
          <i className="bi bi-download mr-2"></i>
          التصدير
        </Button>
      </div>

      {/* Backup Tab */}
      {activeTab === 'backup' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create Backup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="bi bi-plus-circle"></i>
                إنشاء نسخة احتياطية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="backupName">اسم النسخة الاحتياطية</Label>
                <Input
                  id="backupName"
                  placeholder="النسخة الاحتياطية اليومية..."
                  value={backupOptions.name}
                  onChange={(e) => setBackupOptions(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="backupType">نوع النسخة الاحتياطية</Label>
                <Select
                  value={backupOptions.type}
                  onValueChange={(value: 'full' | 'partial' | 'schema') => 
                    setBackupOptions(prev => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">نسخة كاملة</SelectItem>
                    <SelectItem value="partial">نسخة جزئية</SelectItem>
                    <SelectItem value="schema">هيكل قاعدة البيانات فقط</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {backupOptions.type === 'partial' && (
                <div className="space-y-2">
                  <Label>الجداول المختارة</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {availableTables.map((table) => (
                      <label key={table} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={backupOptions.tables.includes(table)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBackupOptions(prev => ({
                                ...prev,
                                tables: [...prev.tables, table]
                              }));
                            } else {
                              setBackupOptions(prev => ({
                                ...prev,
                                tables: prev.tables.filter(t => t !== table)
                              }));
                            }
                          }}
                        />
                        <span>{table}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeData"
                  checked={backupOptions.includeData}
                  onChange={(e) => setBackupOptions(prev => ({ ...prev, includeData: e.target.checked }))}
                />
                <Label htmlFor="includeData">تضمين البيانات</Label>
              </div>

              <Button 
                onClick={handleCreateBackup} 
                disabled={!backupOptions.name.trim() || isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <div className="loading-spinner w-4 h-4 mr-2"></div>
                    جاري الإنشاء...
                  </>
                ) : (
                  <>
                    <i className="bi bi-shield-plus mr-2"></i>
                    إنشاء نسخة احتياطية
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Existing Backups */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="bi bi-archive"></i>
                النسخ الاحتياطية الموجودة
              </CardTitle>
            </CardHeader>
            <CardContent>
              {backups.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <i className="bi bi-archive text-2xl mb-2 block"></i>
                  لا توجد نسخ احتياطية
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {backups.map((backup) => (
                    <div key={backup.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{backup.name}</h4>
                        <Badge variant={
                          backup.status === 'completed' ? 'default' :
                          backup.status === 'in_progress' ? 'secondary' : 'destructive'
                        }>
                          {backup.status === 'completed' ? 'مكتملة' :
                           backup.status === 'in_progress' ? 'جارية' : 'فشلت'}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground mb-3">
                        <p>النوع: {backup.type === 'full' ? 'كاملة' : backup.type === 'partial' ? 'جزئية' : 'هيكل'}</p>
                        <p>الحجم: {formatFileSize(backup.size)}</p>
                        <p>التاريخ: {backup.createdAt.toLocaleDateString('ar-SA')}</p>
                      </div>

                      <div className="flex gap-2">
                        {backup.status === 'completed' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => onRestore(backup.id)}>
                              <i className="bi bi-arrow-clockwise mr-1"></i>
                              استرجاع
                            </Button>
                            {backup.downloadUrl && (
                              <Button size="sm" variant="outline" asChild>
                                <a href={backup.downloadUrl} download>
                                  <i className="bi bi-download mr-1"></i>
                                  تحميل
                                </a>
                              </Button>
                            )}
                          </>
                        )}
                        {backup.status === 'in_progress' && (
                          <div className="flex-1">
                            <Progress value={65} className="h-2" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Import Tab */}
      {activeTab === 'import' && (
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="bi bi-upload"></i>
                استيراد البيانات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <i className="bi bi-info-circle"></i>
                <AlertDescription>
                  تأكد من أن ملف البيانات يتوافق مع هيكل الجدول المختار. يمكن أن يؤثر الاستيراد على البيانات الموجودة.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="importFile">اختر الملف</Label>
                <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="importFile"
                    className="hidden"
                    accept=".csv,.xlsx,.json,.sql"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  {selectedFile ? (
                    <div className="space-y-2">
                      <i className="bi bi-file-earmark-text text-2xl text-green-600"></i>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(selectedFile.size)}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                      >
                        إزالة
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <i className="bi bi-cloud-upload text-2xl text-muted-foreground"></i>
                      <p>اسحب الملف هنا أو</p>
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        اختر ملف
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        CSV, XLSX, JSON, SQL
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {selectedFile && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="importFormat">نوع الملف</Label>
                      <Select
                        value={importOptions.format}
                        onValueChange={(value: 'csv' | 'xlsx' | 'json' | 'sql') => 
                          setImportOptions(prev => ({ ...prev, format: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="sql">SQL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="importTable">الجدول المستهدف</Label>
                      <Select
                        value={importOptions.table}
                        onValueChange={(value) => 
                          setImportOptions(prev => ({ ...prev, table: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الجدول" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTables.map((table) => (
                            <SelectItem key={table} value={table}>{table}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="importMode">طريقة الاستيراد</Label>
                    <Select
                      value={importOptions.mode}
                      onValueChange={(value: 'replace' | 'append' | 'update') => 
                        setImportOptions(prev => ({ ...prev, mode: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="append">إضافة (لا يحذف البيانات الموجودة)</SelectItem>
                        <SelectItem value="replace">استبدال (يحذف البيانات الموجودة)</SelectItem>
                        <SelectItem value="update">تحديث (يحديث البيانات المطابقة)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={handleImport} 
                    disabled={!importOptions.table || isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <div className="loading-spinner w-4 h-4 mr-2"></div>
                        جاري الاستيراد...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-upload mr-2"></i>
                        بدء الاستيراد
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Export Tab */}
      {activeTab === 'export' && (
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="bi bi-download"></i>
                تصدير البيانات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="exportFormat">تنسيق التصدير</Label>
                  <Select
                    value={exportOptions.format}
                    onValueChange={(value: 'csv' | 'xlsx' | 'json' | 'sql') => 
                      setExportOptions(prev => ({ ...prev, format: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="sql">SQL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="includeSchema"
                    checked={exportOptions.includeSchema}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeSchema: e.target.checked }))}
                  />
                  <Label htmlFor="includeSchema" className="text-sm">تضمين هيكل الجداول</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>الجداول للتصدير</Label>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded p-3">
                  <label className="flex items-center space-x-2 text-sm col-span-2 mb-2 pb-2 border-b">
                    <input
                      type="checkbox"
                      checked={exportOptions.tables.length === availableTables.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setExportOptions(prev => ({ ...prev, tables: [...availableTables] }));
                        } else {
                          setExportOptions(prev => ({ ...prev, tables: [] }));
                        }
                      }}
                    />
                    <span className="font-medium">تحديد الكل</span>
                  </label>
                  {availableTables.map((table) => (
                    <label key={table} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={exportOptions.tables.includes(table)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setExportOptions(prev => ({
                              ...prev,
                              tables: [...prev.tables, table]
                            }));
                          } else {
                            setExportOptions(prev => ({
                              ...prev,
                              tables: prev.tables.filter(t => t !== table)
                            }));
                          }
                        }}
                      />
                      <span>{table}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleExport} 
                disabled={exportOptions.tables.length === 0 || isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <div className="loading-spinner w-4 h-4 mr-2"></div>
                    جاري التصدير...
                  </>
                ) : (
                  <>
                    <i className="bi bi-download mr-2"></i>
                    بدء التصدير
                  </>
                )}
              </Button>

              {exportOptions.tables.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  <p>سيتم تصدير {exportOptions.tables.length} جدول بتنسيق {exportOptions.format.toUpperCase()}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}