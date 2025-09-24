import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, FileJson, AlertCircle, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { queryClient } from "@/lib/queryClient";

interface DataType {
  key: string;
  name: string;
  description: string;
  count?: number;
}

const dataTypes: DataType[] = [
  { key: 'users', name: 'المستخدمين', description: 'حسابات المستخدمين وبيانات الدخول' },
  { key: 'serviceCenters', name: 'مراكز الخدمة', description: 'مراكز الصيانة والخدمة' },
  { key: 'customers', name: 'العملاء', description: 'بيانات العملاء' },
  { key: 'categories', name: 'الفئات', description: 'فئات المنتجات' },
  { key: 'products', name: 'المنتجات', description: 'كاتالوج المنتجات' },
  { key: 'warehouses', name: 'المخازن', description: 'مخازن قطع الغيار' },
  { key: 'spareParts', name: 'قطع الغيار', description: 'قطع الغيار المتاحة' },
  { key: 'inventory', name: 'المخزون', description: 'مخزون قطع الغيار' },
  { key: 'serviceRequests', name: 'طلبات الصيانة', description: 'طلبات الصيانة وحالتها' },
  { key: 'serviceRequestFollowUps', name: 'متابعات الطلبات', description: 'متابعات طلبات الصيانة' }
];

export default function DataManagement() {
  const { toast } = useToast();
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResults, setImportResults] = useState<any>(null);
  const [selectedExportTypes, setSelectedExportTypes] = useState<string[]>(dataTypes.map(type => type.key));
  const [selectedImportTypes, setSelectedImportTypes] = useState<string[]>([]);
  const [fileData, setFileData] = useState<any>(null);
  const [showAdvancedImport, setShowAdvancedImport] = useState(false);

  const exportDataMutation = useMutation({
    mutationFn: async (selectedTypes: string[]) => {
      const params = new URLSearchParams();
      selectedTypes.forEach(type => params.append('types', type));
      
      const response = await fetch(`/api/export?${params.toString()}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "فشل تصدير البيانات");
      }
      
      // Convert response to blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const typesLabel = selectedTypes.length === dataTypes.length ? 'all' : selectedTypes.join('-');
      link.download = `sokany-backup-${typesLabel}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "نجح التصدير",
        description: "تم تصدير البيانات المحددة بنجاح"
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في التصدير",
        description: error.message || "حدث خطأ أثناء تصدير البيانات",
        variant: "destructive"
      });
    }
  });

  const importDataMutation = useMutation({
    mutationFn: async ({ fileData, selectedTypes }: { fileData: any, selectedTypes: string[] }) => {
      // Filter the data to only include selected types
      const filteredData: any = {};
      selectedTypes.forEach(type => {
        if (fileData[type]) {
          filteredData[type] = fileData[type];
        }
      });

      const response = await fetch("/api/import", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(filteredData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "فشل استيراد البيانات");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setImportResults(data.imported);
      toast({
        title: "نجح الاستيراد",
        description: "تم استيراد البيانات المحددة بنجاح"
      });
      // Invalidate all queries to refresh data
      queryClient.invalidateQueries();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الاستيراد",
        description: error.message || "حدث خطأ أثناء استيراد البيانات",
        variant: "destructive"
      });
    }
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/json') {
        toast({
          title: "نوع ملف غير صحيح",
          description: "يجب أن يكون الملف بصيغة JSON",
          variant: "destructive"
        });
        return;
      }
      setImportFile(file);
      
      // Read file and analyze its content
      try {
        const fileContent = await file.text();
        const data = JSON.parse(fileContent);
        setFileData(data);
        
        // Auto-select available data types from file
        const availableTypes = dataTypes.filter(type => data[type.key] && Array.isArray(data[type.key]) && data[type.key].length > 0);
        setSelectedImportTypes(availableTypes.map(type => type.key));
        
        if (availableTypes.length > 0) {
          setShowAdvancedImport(true);
        }
      } catch (error) {
        toast({
          title: "خطأ في قراءة الملف",
          description: "تأكد من أن الملف صحيح وبصيغة JSON",
          variant: "destructive"
        });
        setFileData(null);
        setSelectedImportTypes([]);
      }
    }
  };

  const handleImport = async () => {
    if (!importFile || !fileData) {
      toast({
        title: "لم يتم اختيار ملف",
        description: "الرجاء اختيار ملف للاستيراد",
        variant: "destructive"
      });
      return;
    }

    if (selectedImportTypes.length === 0) {
      toast({
        title: "لم يتم اختيار نوع بيانات",
        description: "الرجاء اختيار نوع واحد على الأقل لاستيراده",
        variant: "destructive"
      });
      return;
    }

    importDataMutation.mutate({ fileData, selectedTypes: selectedImportTypes });
  };

  const toggleExportType = (typeKey: string) => {
    setSelectedExportTypes(prev => 
      prev.includes(typeKey) 
        ? prev.filter(key => key !== typeKey)
        : [...prev, typeKey]
    );
  };

  const toggleImportType = (typeKey: string) => {
    setSelectedImportTypes(prev => 
      prev.includes(typeKey) 
        ? prev.filter(key => key !== typeKey)
        : [...prev, typeKey]
    );
  };

  const selectAllExport = () => {
    setSelectedExportTypes(dataTypes.map(type => type.key));
  };

  const selectNoneExport = () => {
    setSelectedExportTypes([]);
  };

  const selectAllImport = () => {
    if (fileData) {
      const availableTypes = dataTypes.filter(type => fileData[type.key] && Array.isArray(fileData[type.key]) && fileData[type.key].length > 0);
      setSelectedImportTypes(availableTypes.map(type => type.key));
    }
  };

  const selectNoneImport = () => {
    setSelectedImportTypes([]);
  };

  return (
    <div className="container mx-auto p-4" dir="rtl">
      <h1 className="text-3xl font-bold mb-6">إدارة البيانات</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Export Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              تصدير البيانات
            </CardTitle>
            <CardDescription>
              اختر نوع البيانات التي تريد تصديرها
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <Button variant="outline" size="sm" onClick={selectAllExport}>
                تحديد الكل
              </Button>
              <Button variant="outline" size="sm" onClick={selectNoneExport}>
                إلغاء التحديد
              </Button>
              <Badge variant="secondary">
                {selectedExportTypes.length} من {dataTypes.length} محدد
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
              {dataTypes.map((dataType) => (
                <div key={dataType.key} className="flex items-start space-x-2 space-x-reverse p-2 rounded border">
                  <Checkbox
                    id={`export-${dataType.key}`}
                    checked={selectedExportTypes.includes(dataType.key)}
                    onCheckedChange={() => toggleExportType(dataType.key)}
                  />
                  <div className="flex-1">
                    <Label 
                      htmlFor={`export-${dataType.key}`} 
                      className="font-medium cursor-pointer"
                    >
                      {dataType.name}
                    </Label>
                    <p className="text-sm text-gray-600">{dataType.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Separator />
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>معلومة مهمة</AlertTitle>
              <AlertDescription>
                سيتم تصدير البيانات المحددة فقط كملف JSON.
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={() => exportDataMutation.mutate(selectedExportTypes)}
              disabled={exportDataMutation.isPending || selectedExportTypes.length === 0}
              className="w-full"
            >
              <Download className="h-4 w-4 ml-2" />
              {exportDataMutation.isPending ? "جاري التصدير..." : `تصدير البيانات المحددة (${selectedExportTypes.length})`}
            </Button>
          </CardContent>
        </Card>

        {/* Import Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              استيراد البيانات
            </CardTitle>
            <CardDescription>
              اختر ملف واختر نوع البيانات التي تريد استيرادها
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-800">تحذير</AlertTitle>
              <AlertDescription className="text-yellow-700">
                استيراد البيانات قد يؤدي إلى تكرار البيانات الموجودة. تأكد من أخذ نسخة احتياطية قبل الاستيراد.
              </AlertDescription>
            </Alert>
            
            <div>
              <Label htmlFor="import-file">اختيار ملف JSON</Label>
              <Input
                id="import-file"
                type="file"
                accept=".json,application/json"
                onChange={handleFileSelect}
                className="cursor-pointer mt-1"
              />
              {importFile && (
                <p className="text-sm text-gray-600 mt-2">
                  الملف المحدد: {importFile.name}
                </p>
              )}
            </div>

            {showAdvancedImport && fileData && (
              <div className="space-y-4">
                <Separator />
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    اختيار البيانات للاستيراد
                  </h4>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <Button variant="outline" size="sm" onClick={selectAllImport}>
                      تحديد الكل
                    </Button>
                    <Button variant="outline" size="sm" onClick={selectNoneImport}>
                      إلغاء التحديد
                    </Button>
                    <Badge variant="secondary">
                      {selectedImportTypes.length} محدد
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                    {dataTypes.map((dataType) => {
                      const hasData = fileData[dataType.key] && Array.isArray(fileData[dataType.key]);
                      const count = hasData ? fileData[dataType.key].length : 0;
                      
                      return (
                        <div 
                          key={dataType.key} 
                          className={`flex items-start space-x-2 space-x-reverse p-2 rounded border ${
                            !hasData || count === 0 ? 'opacity-50 bg-gray-50' : ''
                          }`}
                        >
                          <Checkbox
                            id={`import-${dataType.key}`}
                            checked={selectedImportTypes.includes(dataType.key)}
                            onCheckedChange={() => toggleImportType(dataType.key)}
                            disabled={!hasData || count === 0}
                          />
                          <div className="flex-1">
                            <Label 
                              htmlFor={`import-${dataType.key}`} 
                              className={`font-medium cursor-pointer ${!hasData || count === 0 ? 'text-gray-400' : ''}`}
                            >
                              {dataType.name}
                              {hasData && count > 0 && (
                                <Badge variant="outline" className="mr-2 text-xs">
                                  {count} عنصر
                                </Badge>
                              )}
                            </Label>
                            <p className={`text-sm ${!hasData || count === 0 ? 'text-gray-400' : 'text-gray-600'}`}>
                              {dataType.description}
                              {(!hasData || count === 0) && ' - غير متوفر في الملف'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            
            <Button 
              onClick={handleImport}
              disabled={!importFile || importDataMutation.isPending || selectedImportTypes.length === 0}
              className="w-full"
            >
              <Upload className="h-4 w-4 ml-2" />
              {importDataMutation.isPending ? "جاري الاستيراد..." : 
               selectedImportTypes.length > 0 ? `استيراد البيانات المحددة (${selectedImportTypes.length})` : "استيراد البيانات"}
            </Button>

            {importResults && (
              <Card className="mt-4 bg-green-50 border-green-200">
                <CardHeader>
                  <CardTitle className="text-green-800 text-lg">نتائج الاستيراد</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-sm text-green-700">
                    {Object.entries(importResults).map(([key, count]) => {
                      const dataType = dataTypes.find(type => type.key === key);
                      return (
                        <div key={key} className="flex justify-between">
                          <span>{dataType?.name || key}:</span>
                          <Badge variant="outline">{count as number}</Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            دليل الاستخدام المتقدم
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3 text-blue-700">للتصدير المخصص:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                <li>اختر أنواع البيانات التي تريد تصديرها</li>
                <li>يمكنك استخدام "تحديد الكل" أو "إلغاء التحديد" للسرعة</li>
                <li>اضغط على "تصدير البيانات المحددة"</li>
                <li>سيحتوي اسم الملف على أنواع البيانات المصدرة</li>
                <li>احتفظ بالملف في مكان آمن</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold mb-3 text-green-700">للاستيراد المخصص:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                <li>اختر ملف JSON المراد استيراده</li>
                <li>سيتم تحليل الملف وعرض البيانات المتاحة</li>
                <li>اختر أنواع البيانات التي تريد استيرادها</li>
                <li>ستظهر عدد العناصر لكل نوع بيانات</li>
                <li>اضغط على "استيراد البيانات المحددة"</li>
                <li>ستظهر نتائج الاستيراد بعد الانتهاء</li>
              </ol>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-blue-700">نصيحة للتصدير</AlertTitle>
              <AlertDescription>
                يمكنك تصدير أنواع مختلفة من البيانات في ملفات منفصلة لسهولة الإدارة
              </AlertDescription>
            </Alert>
            
            <Alert className="border-green-200 bg-green-50">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-700">نصيحة للاستيراد</AlertTitle>
              <AlertDescription className="text-green-600">
                يمكنك استيراد بيانات جزئية من ملفات مختلفة دون الحاجة لاستيراد كل شيء
              </AlertDescription>
            </Alert>
            
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-700">تحذير مهم</AlertTitle>
              <AlertDescription className="text-yellow-600">
                تأكد من أخذ نسخة احتياطية قبل أي عملية استيراد لتجنب فقدان البيانات
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}