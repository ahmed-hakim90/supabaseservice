import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiPost } from '@/lib/db';

export default function TestSparePartCreation() {
  const [formData, setFormData] = useState({
    name: 'قطعة تجريبية',
    partNumber: 'TEST-001',
    categoryId: 1,
    price: 100,
    description: 'قطعة غيار تجريبية'
  });
  
  const [inventoryData, setInventoryData] = useState({
    warehouseId: '',
    quantity: 10,
    minQuantity: 3
  });

  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Real warehouses data from API
  const [warehouses, setWarehouses] = useState<any[]>([]);

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const response = await fetch('/api/warehouses');
        if (response.ok) {
          const data = await response.json();
          setWarehouses(data);
        }
      } catch (error) {
        console.error('Error fetching warehouses:', error);
      }
    };

    fetchWarehouses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inventoryData.warehouseId) {
      toast({ variant: "destructive", title: "يرجى اختيار المخزن" });
      return;
    }

    setIsLoading(true);
    
    try {
      const submitData = {
        ...formData,
        inventory: inventoryData
      };

      console.log('📤 إرسال البيانات:', submitData);

      const result = await apiPost('/api/spare-parts', submitData);
      
      console.log('✅ نتيجة الإضافة:', result);
      
      toast({ 
        title: "تم إضافة قطعة الغيار بنجاح",
        description: `تم إنشاء قطعة ${formData.name} مع ${inventoryData.quantity} قطع في المخزن`
      });

      // إعادة تعيين النموذج
      setFormData({
        name: '',
        partNumber: '',
        categoryId: 1,
        price: 0,
        description: ''
      });
      setInventoryData({
        warehouseId: '',
        quantity: 0,
        minQuantity: 1
      });

    } catch (error: any) {
      console.error('❌ خطأ في إضافة قطعة الغيار:', error);
      toast({ 
        variant: "destructive", 
        title: "فشل في إضافة قطعة الغيار", 
        description: error.response?.data?.message || error.message 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testWithoutInventory = async () => {
    setIsLoading(true);
    
    try {
      const submitData = {
        name: 'قطعة بدون مخزون',
        partNumber: 'NO-INV-001',
        categoryId: 1,
        price: 50,
        description: 'قطعة بدون بيانات مخزون'
        // لا نرسل inventory data
      };

      console.log('📤 إرسال قطعة بدون مخزون:', submitData);

      const result = await apiPost('/api/spare-parts', submitData);
      
      console.log('✅ نتيجة إضافة قطعة بدون مخزون:', result);
      
      toast({ 
        title: "تم إضافة قطعة الغيار بدون مخزون",
        description: "تم إنشاء القطعة بدون سجل مخزون"
      });

    } catch (error: any) {
      console.error('❌ خطأ:', error);
      toast({ 
        variant: "destructive", 
        title: "فشل في الإضافة", 
        description: error.response?.data?.message || error.message 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>اختبار إضافة قطع الغيار مع المخزون</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">اسم القطعة</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="partNumber">رقم القطعة</Label>
              <Input
                id="partNumber"
                value={formData.partNumber}
                onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="price">السعر</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">الوصف</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* بيانات المخزون */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">بيانات المخزون</h3>
              
              <div>
                <Label htmlFor="warehouse">المخزن</Label>
                <Select
                  value={inventoryData.warehouseId}
                  onValueChange={(value) => setInventoryData({ ...inventoryData, warehouseId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المخزن" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((warehouse: any) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quantity">الكمية الأولية</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={inventoryData.quantity}
                  onChange={(e) => setInventoryData({ ...inventoryData, quantity: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div>
                <Label htmlFor="minQuantity">الحد الأدنى للكمية</Label>
                <Input
                  id="minQuantity"
                  type="number"
                  min="0"
                  value={inventoryData.minQuantity}
                  onChange={(e) => setInventoryData({ ...inventoryData, minQuantity: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'جاري الحفظ...' : 'إضافة قطعة مع مخزون'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={testWithoutInventory}
                disabled={isLoading}
              >
                اختبار بدون مخزون
              </Button>
            </div>
          </form>

          <div className="mt-4 p-4 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">
              📝 هذه صفحة اختبار لتجريب إضافة قطع الغيار مع بيانات المخزون.
              تحقق من Developer Console للحصول على تفاصيل أكثر.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}