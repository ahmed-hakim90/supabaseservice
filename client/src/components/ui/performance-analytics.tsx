import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MetricCard {
  title: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: string;
  color: string;
  description?: string;
}

interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface PerformanceAnalyticsProps {
  systemMetrics: {
    totalUsers: number;
    activeUsers: number;
    totalRequests: number;
    completedRequests: number;
    totalTransfers: number;
    pendingTransfers: number;
    totalProducts: number;
    lowStockProducts: number;
    totalRevenue: number;
    monthlyRevenue: number;
  };
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function PerformanceAnalytics({
  systemMetrics,
  onRefresh,
  isLoading = false
}: PerformanceAnalyticsProps) {
  const [timeRange, setTimeRange] = useState('7d');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  // Calculate performance metrics
  const calculateMetrics = (): MetricCard[] => {
    const completionRate = systemMetrics.totalRequests > 0 
      ? (systemMetrics.completedRequests / systemMetrics.totalRequests) * 100 
      : 0;

    const transferPendingRate = systemMetrics.totalTransfers > 0
      ? (systemMetrics.pendingTransfers / systemMetrics.totalTransfers) * 100
      : 0;

    const userActiveRate = systemMetrics.totalUsers > 0
      ? (systemMetrics.activeUsers / systemMetrics.totalUsers) * 100
      : 0;

    const stockAlertRate = systemMetrics.totalProducts > 0
      ? (systemMetrics.lowStockProducts / systemMetrics.totalProducts) * 100
      : 0;

    return [
      {
        title: 'إجمالي المستخدمين',
        value: systemMetrics.totalUsers.toLocaleString(),
        change: 12.5,
        changeType: 'increase',
        icon: 'bi-people',
        color: 'text-blue-600',
        description: `${systemMetrics.activeUsers} نشط حالياً`
      },
      {
        title: 'طلبات الخدمة',
        value: systemMetrics.totalRequests.toLocaleString(),
        change: completionRate,
        changeType: completionRate > 80 ? 'increase' : completionRate > 60 ? 'neutral' : 'decrease',
        icon: 'bi-clipboard-check',
        color: 'text-green-600',
        description: `${completionRate.toFixed(1)}% معدل الإنجاز`
      },
      {
        title: 'التحويلات',
        value: systemMetrics.totalTransfers.toLocaleString(),
        change: transferPendingRate,
        changeType: transferPendingRate < 20 ? 'increase' : transferPendingRate < 40 ? 'neutral' : 'decrease',
        icon: 'bi-arrow-left-right',
        color: 'text-purple-600',
        description: `${systemMetrics.pendingTransfers} في الانتظار`
      },
      {
        title: 'المنتجات',
        value: systemMetrics.totalProducts.toLocaleString(),
        change: stockAlertRate,
        changeType: stockAlertRate < 10 ? 'increase' : stockAlertRate < 25 ? 'neutral' : 'decrease',
        icon: 'bi-box',
        color: 'text-orange-600',
        description: `${systemMetrics.lowStockProducts} منخفض المخزون`
      },
      {
        title: 'الإيرادات الشهرية',
        value: `${systemMetrics.monthlyRevenue.toLocaleString()} ريال`,
        change: 8.2,
        changeType: 'increase',
        icon: 'bi-graph-up',
        color: 'text-emerald-600',
        description: 'مقارنة بالشهر السابق'
      },
      {
        title: 'معدل النشاط',
        value: `${userActiveRate.toFixed(1)}%`,
        change: userActiveRate,
        changeType: userActiveRate > 70 ? 'increase' : userActiveRate > 50 ? 'neutral' : 'decrease',
        icon: 'bi-activity',
        color: 'text-indigo-600',
        description: 'المستخدمون النشطون'
      }
    ];
  };

  const metrics = calculateMetrics();

  // Generate sample chart data based on time range
  useEffect(() => {
    const generateChartData = () => {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const data: ChartDataPoint[] = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const value = Math.floor(Math.random() * 100) + 50;
        
        data.push({
          label: date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' }),
          value,
          color: `hsl(${200 + (i * 10)}, 70%, 60%)`
        });
      }
      
      setChartData(data);
    };

    generateChartData();
  }, [timeRange]);

  const maxValue = Math.max(...chartData.map(d => d.value));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">تحليل الأداء</h3>
          <p className="text-muted-foreground">نظرة شاملة على أداء النظام</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">آخر 7 أيام</SelectItem>
              <SelectItem value="30d">آخر 30 يوم</SelectItem>
              <SelectItem value="90d">آخر 90 يوم</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="loading-spinner w-4 h-4 mr-2"></div>
            ) : (
              <i className="bi bi-arrow-clockwise mr-2"></i>
            )}
            تحديث
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center ${metric.color}`}>
                    <i className={`bi ${metric.icon} text-lg`}></i>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{metric.title}</p>
                    <p className="text-2xl font-bold">{metric.value}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  {metric.changeType === 'increase' && (
                    <i className="bi bi-arrow-up text-green-600"></i>
                  )}
                  {metric.changeType === 'decrease' && (
                    <i className="bi bi-arrow-down text-red-600"></i>
                  )}
                  {metric.changeType === 'neutral' && (
                    <i className="bi bi-dash text-gray-600"></i>
                  )}
                  <span className={`text-sm font-medium ${
                    metric.changeType === 'increase' ? 'text-green-600' :
                    metric.changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {metric.change.toFixed(1)}%
                  </span>
                </div>
              </div>
              
              {metric.description && (
                <p className="text-xs text-muted-foreground">{metric.description}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trends">اتجاهات الأداء</TabsTrigger>
          <TabsTrigger value="distribution">التوزيع</TabsTrigger>
          <TabsTrigger value="comparison">المقارنة</TabsTrigger>
        </TabsList>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="bi bi-graph-up"></i>
                اتجاهات النشاط ({timeRange === '7d' ? 'آخر 7 أيام' : timeRange === '30d' ? 'آخر 30 يوم' : 'آخر 90 يوم'})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 relative">
                <div className="absolute inset-0 flex items-end justify-between px-4 pb-4">
                  {chartData.map((point, index) => (
                    <div key={index} className="flex flex-col items-center gap-2 flex-1">
                      <div 
                        className="w-full max-w-6 bg-blue-500 rounded-t-lg relative group cursor-pointer hover:bg-blue-600 transition-colors"
                        style={{ 
                          height: `${(point.value / maxValue) * 200}px`,
                          backgroundColor: point.color || '#3b82f6'
                        }}
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {point.value}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground text-center">
                        {point.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Distribution Tab */}
        <TabsContent value="distribution" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>توزيع طلبات الخدمة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">مكتملة</span>
                    <span className="text-sm font-medium">{systemMetrics.completedRequests}</span>
                  </div>
                  <Progress value={systemMetrics.totalRequests > 0 ? (systemMetrics.completedRequests / systemMetrics.totalRequests) * 100 : 0} className="h-2" />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">قيد التنفيذ</span>
                    <span className="text-sm font-medium">{systemMetrics.totalRequests - systemMetrics.completedRequests}</span>
                  </div>
                  <Progress value={systemMetrics.totalRequests > 0 ? ((systemMetrics.totalRequests - systemMetrics.completedRequests) / systemMetrics.totalRequests) * 100 : 0} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>حالة المخزون</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">مخزون عادي</span>
                    <span className="text-sm font-medium">{systemMetrics.totalProducts - systemMetrics.lowStockProducts}</span>
                  </div>
                  <Progress value={systemMetrics.totalProducts > 0 ? ((systemMetrics.totalProducts - systemMetrics.lowStockProducts) / systemMetrics.totalProducts) * 100 : 0} className="h-2" />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-red-600">مخزون منخفض</span>
                    <span className="text-sm font-medium text-red-600">{systemMetrics.lowStockProducts}</span>
                  </div>
                  <Progress value={systemMetrics.totalProducts > 0 ? (systemMetrics.lowStockProducts / systemMetrics.totalProducts) * 100 : 0} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>مقارنة الأداء</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">معدل إنجاز الطلبات</span>
                      <span className="text-sm text-green-600">+5.2%</span>
                    </div>
                    <Progress value={85} className="h-3" />
                    <p className="text-xs text-muted-foreground mt-1">مقارنة بالشهر السابق</p>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">سرعة الاستجابة</span>
                      <span className="text-sm text-blue-600">+12.8%</span>
                    </div>
                    <Progress value={78} className="h-3" />
                    <p className="text-xs text-muted-foreground mt-1">متوسط وقت الاستجابة</p>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">رضا العملاء</span>
                      <span className="text-sm text-purple-600">+3.1%</span>
                    </div>
                    <Progress value={92} className="h-3" />
                    <p className="text-xs text-muted-foreground mt-1">تقييمات العملاء</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>أهداف الأداء</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <i className="bi bi-check-circle text-green-600"></i>
                      <span className="text-sm font-medium">إنجاز 90% من الطلبات</span>
                    </div>
                    <Badge variant="default" className="bg-green-500">محقق</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-2">
                      <i className="bi bi-clock text-yellow-600"></i>
                      <span className="text-sm font-medium">تقليل وقت الاستجابة</span>
                    </div>
                    <Badge variant="secondary" className="bg-yellow-500 text-white">جاري</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                      <i className="bi bi-target text-blue-600"></i>
                      <span className="text-sm font-medium">زيادة الإيرادات 15%</span>
                    </div>
                    <Badge variant="outline" className="border-blue-500 text-blue-600">قيد المتابعة</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}