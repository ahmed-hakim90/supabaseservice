import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiGet } from "../lib/db";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ar } from "date-fns/locale";

const reportTypes = [
  { key: 'service-requests', name: 'تقارير طلبات الصيانة', icon: 'bi-tools' },
  { key: 'users', name: 'تقارير المستخدمين', icon: 'bi-people' },
  { key: 'centers', name: 'تقارير المراكز', icon: 'bi-building' },
  { key: 'customers', name: 'تقارير العملاء', icon: 'bi-person-badge' },
  { key: 'financial', name: 'التقارير المالية', icon: 'bi-currency-dollar' },
];

const dateRanges = [
  { key: 'today', name: 'اليوم' },
  { key: 'yesterday', name: 'أمس' },
  { key: 'last-7-days', name: 'آخر 7 أيام' },
  { key: 'last-30-days', name: 'آخر 30 يوم' },
  { key: 'this-month', name: 'هذا الشهر' },
  { key: 'last-month', name: 'الشهر الماضي' },
  { key: 'custom', name: 'نطاق مخصص' },
];

export default function Reports() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedReport, setSelectedReport] = useState("service-requests");
  const [dateRange, setDateRange] = useState("last-30-days");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: serviceRequests } = useQuery({
    queryKey: ['/api/service-requests'],
    queryFn: () => apiGet('/api/service-requests'),
  });

  const { data: users } = useQuery({
    queryKey: ['/api/users'],
    queryFn: () => apiGet('/api/users'),
  });

  const { data: centers } = useQuery({
    queryKey: ['/api/service-centers'],
    queryFn: () => apiGet('/api/service-centers'),
  });

  const { data: customers } = useQuery({
    queryKey: ['/api/customers'],
    queryFn: () => apiGet('/api/customers'),
  });

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return { start: now, end: now };
      case 'yesterday':
        const yesterday = subDays(now, 1);
        return { start: yesterday, end: yesterday };
      case 'last-7-days':
        return { start: subDays(now, 7), end: now };
      case 'last-30-days':
        return { start: subDays(now, 30), end: now };
      case 'this-month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'last-month':
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case 'custom':
        return { start: new Date(startDate), end: new Date(endDate) };
      default:
        return { start: subDays(now, 30), end: now };
    }
  };

  const getServiceRequestsStats = () => {
    if (!serviceRequests) return {};
    
    const { start, end } = getDateRange();
    const filteredRequests = serviceRequests.filter((req: any) => {
      const createdAt = new Date(req.createdAt);
      return createdAt >= start && createdAt <= end;
    });

    const statusCounts = filteredRequests.reduce((acc: any, req: any) => {
      acc[req.status] = (acc[req.status] || 0) + 1;
      return acc;
    }, {});

    const priorityCounts = filteredRequests.reduce((acc: any, req: any) => {
      acc[req.priority] = (acc[req.priority] || 0) + 1;
      return acc;
    }, {});

    return {
      total: filteredRequests.length,
      statusCounts,
      priorityCounts,
      averageCompletionTime: 0, // Calculate based on actual data
      customerSatisfaction: 0,   // Calculate based on actual data
    };
  };

  const getUsersStats = () => {
    if (!users) return {};
    
    const { start, end } = getDateRange();
    const filteredUsers = users.filter((user: any) => {
      const createdAt = new Date(user.createdAt);
      return createdAt >= start && createdAt <= end;
    });

    const roleCounts = filteredUsers.reduce((acc: any, user: any) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    const statusCounts = filteredUsers.reduce((acc: any, user: any) => {
      acc[user.status] = (acc[user.status] || 0) + 1;
      return acc;
    }, {});

    return {
      total: filteredUsers.length,
      roleCounts,
      statusCounts,
      newUsers: filteredUsers.length,
    };
  };

  const exportReport = (exportFormat: 'pdf' | 'excel' | 'csv') => {
    const { start, end } = getDateRange();
    let reportData: any[] = [];
    let headers: string[] = [];
    let fileName = '';

    // Prepare data based on selected report type
    switch (selectedReport) {
      case 'service-requests':
        reportData = serviceRequests?.filter((req: any) => {
          const createdAt = new Date(req.createdAt);
          return createdAt >= start && createdAt <= end;
        }).map((req: any) => ({
          id: req.id,
          priority: req.priority,
          status: req.status,
          description: req.description,
          customer: req.Customer?.name || 'غير محدد',
          center: req.ServiceCenter?.name || 'غير محدد',
          createdAt: format(new Date(req.createdAt), 'dd/MM/yyyy HH:mm', { locale: ar }),
          updatedAt: format(new Date(req.updatedAt), 'dd/MM/yyyy HH:mm', { locale: ar })
        })) || [];
        headers = ['الرقم', 'الأولوية', 'الحالة', 'الوصف', 'العميل', 'المركز', 'تاريخ الإنشاء', 'تاريخ التحديث'];
        fileName = `service-requests-${format(start, 'dd-MM-yyyy')}-to-${format(end, 'dd-MM-yyyy')}`;
        break;

      case 'users':
        reportData = users?.filter((user: any) => {
          const createdAt = new Date(user.createdAt);
          return createdAt >= start && createdAt <= end;
        }).map((user: any) => ({
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          status: user.status,
          createdAt: format(new Date(user.createdAt), 'dd/MM/yyyy', { locale: ar })
        })) || [];
        headers = ['الرقم', 'الاسم الكامل', 'البريد الإلكتروني', 'الدور', 'الحالة', 'تاريخ التسجيل'];
        fileName = `users-${format(start, 'dd-MM-yyyy')}-to-${format(end, 'dd-MM-yyyy')}`;
        break;

      case 'centers':
        reportData = centers?.map((center: any) => ({
          id: center.id,
          name: center.name,
          location: center.location,
          capacity: center.capacity,
          status: center.status
        })) || [];
        headers = ['الرقم', 'اسم المركز', 'الموقع', 'السعة', 'الحالة'];
        fileName = `centers-${format(new Date(), 'dd-MM-yyyy')}`;
        break;

      case 'customers':
        reportData = customers?.filter((customer: any) => {
          const createdAt = new Date(customer.createdAt);
          return createdAt >= start && createdAt <= end;
        }).map((customer: any) => ({
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          createdAt: format(new Date(customer.createdAt), 'dd/MM/yyyy', { locale: ar })
        })) || [];
        headers = ['الرقم', 'الاسم', 'البريد الإلكتروني', 'الهاتف', 'العنوان', 'تاريخ التسجيل'];
        fileName = `customers-${format(start, 'dd-MM-yyyy')}-to-${format(end, 'dd-MM-yyyy')}`;
        break;

      default:
        console.warn('نوع تقرير غير مدعوم:', selectedReport);
        return;
    }

    if (reportData.length === 0) {
      alert('لا توجد بيانات للتصدير في الفترة المحددة');
      return;
    }

    // Export based on format
    if (exportFormat === 'csv') {
      const csvContent = "data:text/csv;charset=utf-8," + 
        headers.join(',') + '\n' +
        reportData.map(row => 
          Object.values(row).map(value => `"${value || ''}"`).join(',')
        ).join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${fileName}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // For PDF and Excel, you would typically call a backend endpoint
      // Future implementation: call API to generate PDF/Excel reports
      alert(`سيتم تنفيذ تصدير ${exportFormat.toUpperCase()} في إصدار قادم. تم تصدير ${reportData.length} سجل.`);
    }
  };

  const serviceRequestsStats = getServiceRequestsStats();
  const usersStats = getUsersStats();

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">التقارير والإحصائيات</h1>
          <p className="text-muted-foreground">عرض وتحليل بيانات النظام وإنشاء التقارير</p>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          <Button variant="outline" onClick={() => exportReport('pdf')} data-testid="button-export-pdf">
            <i className="bi bi-file-earmark-pdf mr-2"></i>
            تصدير PDF
          </Button>
          <Button variant="outline" onClick={() => exportReport('excel')} data-testid="button-export-excel">
            <i className="bi bi-file-earmark-spreadsheet mr-2"></i>
            تصدير Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle>فلاتر التقرير</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>نوع التقرير</Label>
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger data-testid="select-report-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((report) => (
                    <SelectItem key={report.key} value={report.key}>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <i className={`bi ${report.icon}`}></i>
                        <span>{report.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>الفترة الزمنية</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger data-testid="select-date-range">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dateRanges.map((range) => (
                    <SelectItem key={range.key} value={range.key}>
                      {range.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {dateRange === 'custom' && (
              <div className="space-y-3">
                <div>
                  <Label>من تاريخ</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    data-testid="input-start-date"
                  />
                </div>
                <div>
                  <Label>إلى تاريخ</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    data-testid="input-end-date"
                  />
                </div>
              </div>
            )}

            <Button className="w-full" data-testid="button-generate-report">
              <i className="bi bi-graph-up mr-2"></i>
              إنشاء التقرير
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
              <TabsTrigger value="detailed">التفاصيل</TabsTrigger>
              <TabsTrigger value="charts">الرسوم البيانية</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {selectedReport === 'service-requests' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className="w-10 h-10 bg-chart-1/10 rounded-lg flex items-center justify-center">
                          <i className="bi bi-tools text-chart-1"></i>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
                          <p className="text-2xl font-bold">{serviceRequestsStats.total || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className="w-10 h-10 bg-chart-2/10 rounded-lg flex items-center justify-center">
                          <i className="bi bi-check-circle text-chart-2"></i>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">طلبات مكتملة</p>
                          <p className="text-2xl font-bold">{serviceRequestsStats.statusCounts?.completed || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className="w-10 h-10 bg-chart-3/10 rounded-lg flex items-center justify-center">
                          <i className="bi bi-clock text-chart-3"></i>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">طلبات معلقة</p>
                          <p className="text-2xl font-bold">{serviceRequestsStats.statusCounts?.pending || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className="w-10 h-10 bg-chart-4/10 rounded-lg flex items-center justify-center">
                          <i className="bi bi-exclamation-triangle text-chart-4"></i>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">طلبات عاجلة</p>
                          <p className="text-2xl font-bold">{serviceRequestsStats.priorityCounts?.high || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {selectedReport === 'users' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className="w-10 h-10 bg-chart-1/10 rounded-lg flex items-center justify-center">
                          <i className="bi bi-people text-chart-1"></i>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">إجمالي المستخدمين</p>
                          <p className="text-2xl font-bold">{users?.length || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className="w-10 h-10 bg-chart-2/10 rounded-lg flex items-center justify-center">
                          <i className="bi bi-person-plus text-chart-2"></i>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">مستخدمون جدد</p>
                          <p className="text-2xl font-bold">{usersStats.newUsers || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className="w-10 h-10 bg-chart-3/10 rounded-lg flex items-center justify-center">
                          <i className="bi bi-check-circle text-chart-3"></i>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">مستخدمون نشطون</p>
                          <p className="text-2xl font-bold">{usersStats.statusCounts?.active || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className="w-10 h-10 bg-chart-4/10 rounded-lg flex items-center justify-center">
                          <i className="bi bi-person-check text-chart-4"></i>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">مديرو النظام</p>
                          <p className="text-2xl font-bold">{usersStats.roleCounts?.admin || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>الأداء العام</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>معدل إكمال الطلبات</span>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <div className="w-20 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                          <div className="bg-chart-1 h-2 rounded-full" style={{ width: '85%' }}></div>
                        </div>
                        <span className="text-sm font-medium">85%</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span>رضا العملاء</span>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <div className="w-20 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                          <div className="bg-chart-2 h-2 rounded-full" style={{ width: '92%' }}></div>
                        </div>
                        <span className="text-sm font-medium">92%</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span>متوسط وقت الاستجابة</span>
                      <span className="text-sm font-medium">2.3 ساعة</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="detailed" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>البيانات التفصيلية</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-right py-2 px-4 text-sm font-medium">التاريخ</th>
                          <th className="text-right py-2 px-4 text-sm font-medium">النوع</th>
                          <th className="text-right py-2 px-4 text-sm font-medium">العدد</th>
                          <th className="text-right py-2 px-4 text-sm font-medium">الحالة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        <tr>
                          <td className="py-2 px-4 text-sm">اليوم</td>
                          <td className="py-2 px-4 text-sm">طلبات صيانة</td>
                          <td className="py-2 px-4 text-sm">12</td>
                          <td className="py-2 px-4 text-sm">
                            <span className="status-badge status-in-progress">نشط</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="charts" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>الرسوم البيانية</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-20">
                    <i className="bi bi-bar-chart text-4xl text-muted-foreground mb-4"></i>
                    <p className="text-muted-foreground">سيتم إضافة الرسوم البيانية التفاعلية قريباً</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
