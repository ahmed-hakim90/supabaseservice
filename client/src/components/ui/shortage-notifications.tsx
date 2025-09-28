import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Package, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Types
interface SparePartsShortage {
  id: string;
  centerId: string;
  warehouseId: string;
  sparePartId: string;
  quantityNeeded: number;
  createdAt: string;
  status: 'open' | 'resolved';
  resolvedAt?: string;
}

export default function ShortageNotifications() {
  // جلب النواقص من API
  const { data: shortages = [], isLoading, refetch } = useQuery({
    queryKey: ['sparePartsShortages'],
    queryFn: async () => {
      const response = await fetch('/api/spare-parts/shortages', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch shortages');
      return response.json();
    },
    refetchInterval: 30000, // تحديث كل 30 ثانية
  });

  // دالة لحل النقص
  const resolveShortage = async (shortageId: string) => {
    try {
      const response = await fetch(`/api/spare-parts/shortage/${shortageId}/resolve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to resolve shortage');

      toast({ title: 'تم حل النقص بنجاح' });
      refetch(); // تحديث البيانات
    } catch (error) {
      toast({ 
        title: 'خطأ في حل النقص', 
        description: (error as Error).message,
        variant: 'destructive' 
      });
    }
  };

  // تصفية النواقص المفتوحة فقط
  const openShortages = shortages.filter((s: SparePartsShortage) => s.status === 'open');

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <Package className="w-5 h-5" />
            <span>نواقص قطع الغيار</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">جاري تحميل النواقص...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (openShortages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <Package className="w-5 h-5 text-green-600" />
            <span>نواقص قطع الغيار</span>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              لا توجد نواقص
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <p className="text-muted-foreground">لا توجد نواقص في قطع الغيار حالياً</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 space-x-reverse">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <span>نواقص قطع الغيار</span>
          <Badge variant="destructive">
            {openShortages.length} نقص
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {openShortages.map((shortage: SparePartsShortage) => (
          <Alert key={shortage.id} className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  نقص في قطعة الغيار: {shortage.sparePartId}
                </p>
                <p className="text-sm text-muted-foreground">
                  الكمية المطلوبة: {shortage.quantityNeeded} • 
                  التاريخ: {new Date(shortage.createdAt).toLocaleDateString('ar-SA')}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => resolveShortage(shortage.id)}
                className="text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                تم الحل
              </Button>
            </AlertDescription>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
}