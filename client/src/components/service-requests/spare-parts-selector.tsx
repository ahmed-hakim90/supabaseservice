import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Plus, Search } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SparePart {
  id: string;
  name: string;
  partNumber: string;
  description?: string;
  currentStock: number;
  isAvailableInWarehouse?: boolean;
}

interface SelectedSparePart extends SparePart {
  quantityUsed: number;
  notes?: string;
  isCustom?: boolean; // للقطع المضافة يدوياً
}

interface SparePartsSelector {
  followUpId?: string;
  initialSelectedParts?: SelectedSparePart[];
  onSelectionChange: (selectedParts: SelectedSparePart[]) => void;
}

export function SparePartsSelector({ 
  followUpId, 
  initialSelectedParts = [], 
  onSelectionChange 
}: SparePartsSelector) {
  const [selectedParts, setSelectedParts] = useState<SelectedSparePart[]>(initialSelectedParts || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAvailable, setFilterAvailable] = useState(false);
  const [isAddingCustomPart, setIsAddingCustomPart] = useState(false);
  const [customPartForm, setCustomPartForm] = useState({
    name: '',
    partNumber: '',
    description: '',
    quantityUsed: 1,
    notes: ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  // Fetch all registered spare parts from the system
  const { data: registeredSpareParts = [], isLoading: isLoadingRegistered } = useQuery({
    queryKey: ['spare-parts'],
    queryFn: async () => {
      const response = await fetch('/api/spare-parts', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('فشل في جلب قطع الغيار المسجلة');
      }
      return response.json();
    }
  });

  // Fetch available spare parts from user's warehouse
  const { data: warehouseSpareParts = [], isLoading: isLoadingWarehouse } = useQuery({
    queryKey: ['warehouse-spare-parts', currentUser?.warehouseId],
    queryFn: async () => {
      if (!currentUser?.warehouseId) {
        return [];
      }
      
      const response = await fetch(`/api/warehouse/${currentUser.warehouseId}/spare-parts`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('فشل في جلب قطع الغيار من المخزن');
      }
      return response.json();
    },
    enabled: !!currentUser?.warehouseId
  });

  // Combine registered parts with warehouse availability info
  const spareParts = registeredSpareParts.map((registeredPart: SparePart) => {
    const warehousePart = warehouseSpareParts.find((wp: any) => wp.sparePartId === registeredPart.id);
    return {
      ...registeredPart,
      currentStock: warehousePart ? warehousePart.quantity : 0,
      isAvailableInWarehouse: !!warehousePart && warehousePart.quantity > 0
    };
  });

  const isLoadingSpareParts = isLoadingRegistered || isLoadingWarehouse;

  // Filter and sort spare parts based on search term and availability
  const filteredSpareParts = spareParts
    .filter((part: SparePart) => {
      const matchesSearch = part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           part.partNumber.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (filterAvailable) {
        return matchesSearch && part.isAvailableInWarehouse;
      }
      
      return matchesSearch;
    })
    .sort((a: SparePart, b: SparePart) => {
      // Sort by availability first (available items first), then by name
      if (a.isAvailableInWarehouse && !b.isAvailableInWarehouse) return -1;
      if (!a.isAvailableInWarehouse && b.isAvailableInWarehouse) return 1;
      return a.name.localeCompare(b.name);
    });

  // Add custom spare part (manual entry)
  const addCustomSparePart = () => {
    if (!customPartForm.name.trim() || !customPartForm.partNumber.trim()) {
      toast({
        title: "خطأ",
        description: "يجب إدخال اسم القطعة ورقمها",
        variant: "destructive"
      });
      return;
    }

    const customPart: SelectedSparePart = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: customPartForm.name,
      partNumber: customPartForm.partNumber,
      description: customPartForm.description,
      currentStock: 999, // قيمة افتراضية للقطع المخصصة
      quantityUsed: customPartForm.quantityUsed,
      notes: customPartForm.notes,
      isCustom: true
    };

    const updatedSelection = [...selectedParts, customPart];
    setSelectedParts(updatedSelection);
    onSelectionChange(updatedSelection);

    // Reset form
    setCustomPartForm({
      name: '',
      partNumber: '',
      description: '',
      quantityUsed: 1,
      notes: ''
    });
    setIsAddingCustomPart(false);

    toast({
      title: "تم الإضافة",
      description: "تم إضافة قطعة الغيار بنجاح"
    });
  };

  // Add spare part to selection
  const addSparePart = (part: SparePart) => {
    const isAlreadySelected = selectedParts.some(selected => selected.id === part.id);
    if (isAlreadySelected) {
      toast({
        title: "تحذير",
        description: "قطعة الغيار مضافة بالفعل",
        variant: "destructive"
      });
      return;
    }

    const newSelectedPart: SelectedSparePart = {
      ...part,
      quantityUsed: 1,
      notes: ''
    };

    const updatedSelection = [...selectedParts, newSelectedPart];
    setSelectedParts(updatedSelection);
    onSelectionChange(updatedSelection);
  };

  // Remove spare part from selection
  const removeSparePart = (partId: string) => {
    const updatedSelection = selectedParts.filter(part => part.id !== partId);
    setSelectedParts(updatedSelection);
    onSelectionChange(updatedSelection);
  };

  // Update quantity or notes for a selected part
  const updateSelectedPart = (partId: string, field: 'quantityUsed' | 'notes', value: number | string) => {
    const updatedSelection = selectedParts.map(part => 
      part.id === partId 
        ? { ...part, [field]: value }
        : part
    );
    setSelectedParts(updatedSelection);
    onSelectionChange(updatedSelection);
  };

  return (
    <div className="space-y-4">
      {/* Information Alert */}
      <Alert className="border-blue-200 bg-blue-50">
        <AlertDescription className="text-blue-700">
          <strong>ملاحظة:</strong> يتم عرض جميع قطع الغيار المسجلة في النظام. 
          القطع المتوفرة في مخزنك ستظهر مع علامة "متوفر في المخزن".
        </AlertDescription>
      </Alert>

      {/* Available Spare Parts Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>قطع الغيار المسجلة في النظام</span>
            <div className="flex gap-2">
              <Badge variant="secondary" className="text-xs">
                مجموع: {spareParts.length}
              </Badge>
              <Badge variant="outline" className="text-xs text-green-700">
                متوفر: {spareParts.filter((p: SparePart) => p.isAvailableInWarehouse).length}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter Controls */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="البحث عن قطعة غيار..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="filter-available"
                  checked={filterAvailable}
                  onCheckedChange={(checked) => setFilterAvailable(checked === true)}
                />
                <Label htmlFor="filter-available" className="text-sm">
                  إظهار المتوفر في المخزن فقط
                </Label>
              </div>
              
              <div className="text-sm text-gray-500">
                {filteredSpareParts.length} من {spareParts.length} قطعة غيار
              </div>
            </div>
          </div>

          {/* Spare Parts List */}
          {isLoadingSpareParts ? (
            <div className="text-center py-4">جاري التحميل...</div>
          ) : (
            <div className="grid gap-2 max-h-60 overflow-y-auto">
              {filteredSpareParts.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    {searchTerm ? (
                      `لا توجد قطع غيار تطابق "${searchTerm}"`
                    ) : filterAvailable ? (
                      "لا توجد قطع غيار متوفرة في المخزن حالياً"
                    ) : (
                      "لا توجد قطع غيار مسجلة في النظام"
                    )}
                  </AlertDescription>
                </Alert>
              ) : (
                filteredSpareParts.map((part: SparePart) => (
                  <div
                    key={part.id}
                    className={`flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 ${
                      !part.isAvailableInWarehouse ? 'border-orange-200 bg-orange-50' : ''
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{part.name}</span>
                        {part.isAvailableInWarehouse ? (
                          <Badge variant="default" className="text-xs bg-green-100 text-green-700">
                            متوفر في المخزن
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                            غير متوفر في المخزن
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        رقم القطعة: {part.partNumber}
                      </div>
                      {part.description && (
                        <div className="text-sm text-gray-400 mt-1">
                          {part.description}
                        </div>
                      )}
                      <div className={`text-sm mt-1 ${
                        part.currentStock > 0 ? 'text-blue-600' : 'text-orange-600'
                      }`}>
                        المخزون: {part.currentStock} قطعة
                        {part.currentStock === 0 && ' (نفدت الكمية)'}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => addSparePart(part)}
                      disabled={selectedParts.some(selected => selected.id === part.id)}
                      variant={part.isAvailableInWarehouse ? "default" : "outline"}
                    >
                      <Plus className="h-4 w-4 ml-1" />
                      إضافة
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Spare Parts Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              قطع الغيار المختارة ({selectedParts.length})
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAddingCustomPart(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              إضافة سطر جديد
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Custom Part Form */}
          {isAddingCustomPart && (
            <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-blue-900">إضافة قطعة غيار جديدة</h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsAddingCustomPart(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="custom-name">اسم القطعة *</Label>
                  <Input
                    id="custom-name"
                    placeholder="مثال: مروحة التبريد"
                    value={customPartForm.name}
                    onChange={(e) => setCustomPartForm({
                      ...customPartForm,
                      name: e.target.value
                    })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="custom-part-number">رقم القطعة *</Label>
                  <Input
                    id="custom-part-number"
                    placeholder="مثال: FAN-001"
                    value={customPartForm.partNumber}
                    onChange={(e) => setCustomPartForm({
                      ...customPartForm,
                      partNumber: e.target.value
                    })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="custom-description">الوصف</Label>
                  <Input
                    id="custom-description"
                    placeholder="وصف القطعة (اختياري)"
                    value={customPartForm.description}
                    onChange={(e) => setCustomPartForm({
                      ...customPartForm,
                      description: e.target.value
                    })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="custom-quantity">الكمية المستخدمة</Label>
                  <Input
                    id="custom-quantity"
                    type="number"
                    min="1"
                    value={customPartForm.quantityUsed}
                    onChange={(e) => setCustomPartForm({
                      ...customPartForm,
                      quantityUsed: Math.max(1, parseInt(e.target.value) || 1)
                    })}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="custom-notes">ملاحظات</Label>
                  <Textarea
                    id="custom-notes"
                    placeholder="ملاحظات حول استخدام هذه القطعة..."
                    value={customPartForm.notes}
                    onChange={(e) => setCustomPartForm({
                      ...customPartForm,
                      notes: e.target.value
                    })}
                    rows={2}
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-4">
                <Button
                  size="sm"
                  onClick={addCustomSparePart}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  إضافة القطعة
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsAddingCustomPart(false)}
                >
                  إلغاء
                </Button>
              </div>
            </div>
          )}

          {selectedParts.length === 0 && !isAddingCustomPart ? (
            <div className="text-center py-8 text-gray-500">
              لم يتم اختيار أي قطع غيار بعد
            </div>
          ) : (
            selectedParts.map((part) => (
              <div
                key={part.id}
                className={`border rounded-lg p-4 space-y-3 ${
                  part.isCustom ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{part.name}</div>
                      {part.isCustom ? (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                          مخصص
                        </Badge>
                      ) : part.isAvailableInWarehouse ? (
                        <Badge variant="default" className="text-xs bg-green-100 text-green-700">
                          من المخزن
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                          غير متوفر في المخزن
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      رقم القطعة: {part.partNumber}
                    </div>
                    {part.description && (
                      <div className="text-sm text-gray-400 mt-1">
                        {part.description}
                      </div>
                    )}
                    {!part.isCustom && (
                      <div className={`text-sm mt-1 ${
                        part.currentStock > 0 ? 'text-blue-600' : 'text-orange-600'
                      }`}>
                        المخزون المتاح: {part.currentStock} قطعة
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeSparePart(part.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`quantity-${part.id}`}>
                      الكمية المستخدمة
                    </Label>
                    <Input
                      id={`quantity-${part.id}`}
                      type="number"
                      min="1"
                      max={part.isCustom ? undefined : part.currentStock}
                      value={part.quantityUsed}
                      onChange={(e) => updateSelectedPart(
                        part.id, 
                        'quantityUsed', 
                        Math.max(1, parseInt(e.target.value) || 1)
                      )}
                    />
                    {!part.isCustom && (
                      <div className="text-xs text-gray-500 mt-1">
                        الحد الأقصى: {part.currentStock}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor={`notes-${part.id}`}>
                      ملاحظات (اختياري)
                    </Label>
                    <Textarea
                      id={`notes-${part.id}`}
                      placeholder="ملاحظات حول استخدام هذه القطعة..."
                      value={part.notes || ''}
                      onChange={(e) => updateSelectedPart(
                        part.id, 
                        'notes', 
                        e.target.value
                      )}
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      {selectedParts.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-gray-600">إجمالي القطع</div>
                <div className="text-lg font-semibold text-blue-600">
                  {selectedParts.length}
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-600">إجمالي الكميات</div>
                <div className="text-lg font-semibold text-green-600">
                  {selectedParts.reduce((sum, part) => sum + part.quantityUsed, 0)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-600">من المخزن</div>
                <div className="text-lg font-semibold text-emerald-600">
                  {selectedParts.filter(part => !part.isCustom && part.isAvailableInWarehouse).length}
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-600">قطع مخصصة</div>
                <div className="text-lg font-semibold text-purple-600">
                  {selectedParts.filter(part => part.isCustom).length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}