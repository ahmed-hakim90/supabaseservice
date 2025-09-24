import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, FileText } from 'lucide-react';

interface FollowUpSparePart {
  id: string;
  quantityUsed: number;
  notes: string | null;
  sparePart: {
    id: string;
    name: string;
    partNumber: string;
    description?: string;
  };
}

interface FollowUpSparePartsViewProps {
  followUpId: string;
}

export function FollowUpSparePartsView({ followUpId }: FollowUpSparePartsViewProps) {
  const { data: followUpData, isLoading, error } = useQuery({
    queryKey: ['follow-up-spare-parts', followUpId],
    queryFn: async () => {
      const response = await fetch(`/api/service-request-follow-ups/${followUpId}/spare-parts`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('فشل في جلب بيانات قطع الغيار');
      }
      return response.json();
    },
    enabled: !!followUpId
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-gray-500">جاري تحميل قطع الغيار...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          حدث خطأ في تحميل قطع الغيار المستخدمة
        </AlertDescription>
      </Alert>
    );
  }

  const spareParts = followUpData?.spareParts || [];

  if (spareParts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5" />
            قطع الغيار المستخدمة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              لم يتم استخدام أي قطع غيار في هذه المتابعة
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Package className="h-5 w-5" />
          قطع الغيار المستخدمة ({spareParts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {spareParts.map((item: FollowUpSparePart) => (
          <div
            key={item.id}
            className="border rounded-lg p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium text-lg">
                  {item.sparePart.name}
                </div>
                <div className="text-sm text-gray-500">
                  رقم القطعة: {item.sparePart.partNumber}
                </div>
                {item.sparePart.description && (
                  <div className="text-sm text-gray-400 mt-1">
                    {item.sparePart.description}
                  </div>
                )}
              </div>
              <div className="text-left">
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {item.quantityUsed} قطعة
                </Badge>
              </div>
            </div>

            {item.notes && (
              <div className="bg-gray-50 rounded-md p-3">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-gray-500 mt-1 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">
                      ملاحظات:
                    </div>
                    <div className="text-sm text-gray-600">
                      {item.notes}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Summary */}
        <div className="border-t pt-4">
          <div className="flex justify-between text-sm text-gray-600">
            <span>إجمالي أنواع قطع الغيار:</span>
            <span className="font-medium">{spareParts.length}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-1">
            <span>إجمالي الكميات المستخدمة:</span>
            <span className="font-medium">
              {spareParts.reduce((sum: number, item: FollowUpSparePart) => sum + item.quantityUsed, 0)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}