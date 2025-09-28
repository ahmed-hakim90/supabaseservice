import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Warehouse, Product, Category, Inventory, PartsTransfer } from '../../../../shared/schema';

// Warehouse Form
interface WarehouseFormProps {
  warehouse?: Warehouse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<Warehouse>) => Promise<void>;
}

export function WarehouseForm({ warehouse, open, onOpenChange, onSubmit }: WarehouseFormProps) {
  const [formData, setFormData] = useState({
    name: warehouse?.name || '',
    location: warehouse?.location || ''
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.location.trim()) {
      toast({ 
        title: "خطأ في البيانات", 
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
      setFormData({ name: '', location: '' });
    } catch (error) {
      toast({ 
        title: "خطأ في العملية", 
        description: "حدث خطأ أثناء حفظ البيانات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {warehouse ? 'تعديل المخزن' : 'إضافة مخزن جديد'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">اسم المخزن *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="ادخل اسم المخزن"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">الموقع *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="ادخل موقع المخزن"
              required
            />
          </div>
          
          <div className="flex justify-end space-x-2 space-x-reverse">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="loading-spinner mr-2"></div>
                  جاري الحفظ...
                </>
              ) : (
                warehouse ? 'تحديث' : 'إضافة'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Product Form
interface ProductFormProps {
  product?: Product | null;
  categories: Category[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<Product>) => Promise<void>;
}

export function ProductForm({ product, categories, open, onOpenChange, onSubmit }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    categoryId: product?.categoryId || '',
    model: product?.model || ''
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.categoryId) {
      toast({ 
        title: "خطأ في البيانات", 
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
      setFormData({ name: '', description: '', categoryId: '', model: '' });
    } catch (error) {
      toast({ 
        title: "خطأ في العملية", 
        description: "حدث خطأ أثناء حفظ البيانات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {product ? 'تعديل المنتج' : 'إضافة منتج جديد'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم المنتج *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="ادخل اسم المنتج"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryId">الفئة *</Label>
              <Select 
                value={formData.categoryId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفئة" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="model">الموديل</Label>
            <Input
              id="model"
              value={formData.model}
              onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
              placeholder="ادخل موديل المنتج"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">الوصف</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="ادخل وصف المنتج (اختياري)"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-2 space-x-reverse">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="loading-spinner mr-2"></div>
                  جاري الحفظ...
                </>
              ) : (
                product ? 'تحديث' : 'إضافة'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Category Form
interface CategoryFormProps {
  category?: Category | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<Category>) => Promise<void>;
}

export function CategoryForm({ category, open, onOpenChange, onSubmit }: CategoryFormProps) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || ''
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ 
        title: "خطأ في البيانات", 
        description: "يرجى ملء اسم الفئة",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
      setFormData({ name: '', description: '' });
    } catch (error) {
      toast({ 
        title: "خطأ في العملية", 
        description: "حدث خطأ أثناء حفظ البيانات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {category ? 'تعديل الفئة' : 'إضافة فئة جديدة'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">اسم الفئة *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="ادخل اسم الفئة"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">الوصف</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="ادخل وصف الفئة (اختياري)"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-2 space-x-reverse">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="loading-spinner mr-2"></div>
                  جاري الحفظ...
                </>
              ) : (
                category ? 'تحديث' : 'إضافة'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Parts Transfer Form
interface TransferFormProps {
  transfer?: PartsTransfer | null;
  warehouses: Warehouse[];
  products: Product[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<PartsTransfer>) => Promise<void>;
}

export function TransferForm({ transfer, warehouses, products, open, onOpenChange, onSubmit }: TransferFormProps) {
  const [formData, setFormData] = useState({
    fromWarehouseId: transfer?.fromWarehouseId || '',
    toWarehouseId: transfer?.toWarehouseId || '',
    sparePartId: transfer?.sparePartId || '',
    quantity: transfer?.quantity || 1,
    reason: transfer?.reason || '',
    notes: transfer?.notes || ''
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fromWarehouseId || !formData.toWarehouseId || !formData.sparePartId || formData.quantity < 1) {
      toast({ 
        title: "خطأ في البيانات", 
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    if (formData.fromWarehouseId === formData.toWarehouseId) {
      toast({ 
        title: "خطأ في البيانات", 
        description: "لا يمكن التحويل من وإلى نفس المخزن",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
      setFormData({ 
        fromWarehouseId: '', 
        toWarehouseId: '', 
        sparePartId: '', 
        quantity: 1, 
        reason: '', 
        notes: '' 
      });
    } catch (error) {
      toast({ 
        title: "خطأ في العملية", 
        description: "حدث خطأ أثناء حفظ البيانات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {transfer ? 'تعديل طلب التحويل' : 'إنشاء طلب تحويل جديد'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fromWarehouseId">من مخزن *</Label>
              <Select 
                value={formData.fromWarehouseId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, fromWarehouseId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المخزن المرسل" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="toWarehouseId">إلى مخزن *</Label>
              <Select 
                value={formData.toWarehouseId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, toWarehouseId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المخزن المستقبل" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sparePartId">قطعة الغيار *</Label>
              <Select 
                value={formData.sparePartId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, sparePartId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر قطعة الغيار" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">الكمية *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                placeholder="ادخل الكمية"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reason">سبب التحويل</Label>
            <Input
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="ادخل سبب التحويل"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="ادخل أي ملاحظات إضافية (اختياري)"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-2 space-x-reverse">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="loading-spinner mr-2"></div>
                  جاري الحفظ...
                </>
              ) : (
                transfer ? 'تحديث' : 'إنشاء طلب'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}