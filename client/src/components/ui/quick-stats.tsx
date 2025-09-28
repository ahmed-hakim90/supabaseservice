import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface QuickStatsProps {
  title: string;
  stats: Array<{
    label: string;
    value: number;
    total?: number;
    color?: string;
    icon?: string;
    trend?: 'up' | 'down' | 'stable';
    percentage?: number;
  }>;
}

export function QuickStats({ title, stats }: QuickStatsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.map((stat, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {stat.icon && (
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  stat.color === 'red' ? 'bg-red-100 text-red-600' :
                  stat.color === 'green' ? 'bg-green-100 text-green-600' :
                  stat.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                  stat.color === 'orange' ? 'bg-orange-100 text-orange-600' :
                  'bg-primary/10 text-primary'
                }`}>
                  <i className={`bi ${stat.icon}`}></i>
                </div>
              )}
              <div>
                <p className="text-sm font-medium">{stat.label}</p>
                {stat.total && (
                  <p className="text-xs text-muted-foreground">
                    من أصل {stat.total}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xl font-bold">{stat.value}</p>
                {stat.percentage !== undefined && (
                  <p className={`text-xs flex items-center gap-1 ${
                    stat.trend === 'up' ? 'text-green-600' :
                    stat.trend === 'down' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {stat.trend === 'up' && <i className="bi bi-trending-up"></i>}
                    {stat.trend === 'down' && <i className="bi bi-trending-down"></i>}
                    {stat.percentage}%
                  </p>
                )}
              </div>
              
              {stat.total && (
                <div className="w-16">
                  <Progress 
                    value={(stat.value / stat.total) * 100} 
                    className="h-2"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

interface SystemHealthProps {
  data: {
    warehouses: number;
    inventory: number;
    lowStock: number;
    pendingTransfers: number;
    completedTransfers: number;
    products: number;
    categories: number;
  };
}

export function SystemHealth({ data }: SystemHealthProps) {
  const healthScore = Math.round(
    ((data.inventory - data.lowStock) / data.inventory) * 40 +
    (data.completedTransfers / (data.completedTransfers + data.pendingTransfers)) * 30 +
    (data.warehouses > 0 ? 20 : 0) +
    (data.products > 0 ? 10 : 0)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <i className="bi bi-shield-check"></i>
          صحة النظام
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className={`text-4xl font-bold mb-2 ${
            healthScore >= 80 ? 'text-green-600' :
            healthScore >= 60 ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {healthScore}%
          </div>
          <Badge variant={
            healthScore >= 80 ? 'default' :
            healthScore >= 60 ? 'secondary' :
            'destructive'
          }>
            {healthScore >= 80 ? 'ممتاز' :
             healthScore >= 60 ? 'جيد' :
             'يحتاج تحسين'}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span>المخزون</span>
            <span className={data.lowStock > 0 ? 'text-red-600' : 'text-green-600'}>
              {data.lowStock > 0 ? `${data.lowStock} نفدت` : 'مستقر'}
            </span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span>التحويلات</span>
            <span className={data.pendingTransfers > 5 ? 'text-yellow-600' : 'text-green-600'}>
              {data.pendingTransfers} معلقة
            </span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span>المخازن</span>
            <span className="text-blue-600">{data.warehouses} نشطة</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}