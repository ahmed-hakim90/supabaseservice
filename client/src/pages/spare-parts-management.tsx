import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost, apiPut, apiDelete } from "../lib/db";
import { useAuth } from "../lib/auth";
import { canCreate, canUpdate, canDelete } from "../lib/permissions";
import type { SparePart, InsertSparePart, Product, Category } from "@shared/schema";
import { Wrench, Plus, Edit, Trash2, Package, Search } from "lucide-react";

export default function SparePartsManagement() {
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSparePart, setEditingSparePart] = useState<SparePart | null>(null);
  const [formData, setFormData] = useState<Partial<InsertSparePart>>({
    name: "",
    partNumber: "",
    categoryId: "none",
    productId: "none",
    price: 0,
    description: ""
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  // Check permissions
  const canCreateSpareParts = currentUser ? canCreate(currentUser.role, 'spareParts') : false;
  const canUpdateSpareParts = currentUser ? canUpdate(currentUser.role, 'spareParts') : false;
  const canDeleteSpareParts = currentUser ? canDelete(currentUser.role, 'spareParts') : false;

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products'],
    queryFn: () => apiGet('/api/products'),
  });

  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: () => apiGet('/api/categories'),
  });

  const { data: spareParts, isLoading: sparePartsLoading } = useQuery({
    queryKey: ['/api/spare-parts'],
    queryFn: () => apiGet('/api/spare-parts'),
  });

  // Filter spare parts by selected product
  const filteredSpareParts = spareParts?.filter((part: SparePart) => {
    const matchesProduct = !selectedProduct || selectedProduct === "all" || part.productId === selectedProduct;
    const matchesSearch = !searchTerm ||
      part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.description?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesProduct && matchesSearch;
  }) || [];

  // Get product details for display
  const getProductDetails = (productId: string | null) => {
    if (!productId) return null;
    return products?.find((p: Product) => p.id === productId);
  };

  // Get category details for display
  const getCategoryDetails = (categoryId: string | null) => {
    if (!categoryId) return null;
    return categories?.find((c: Category) => c.id === categoryId);
  };

  const createSparePartMutation = useMutation({
    mutationFn: (data: InsertSparePart) => apiPost('/api/spare-parts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/spare-parts'] });
      setIsAddDialogOpen(false);
      setFormData({
        name: "",
        partNumber: "",
        categoryId: "none",
        productId: "none",
        price: 0,
        description: ""
      });
      toast({ title: "تم إضافة قطعة الغيار بنجاح" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "فشل في إضافة قطعة الغيار" });
    },
  });

  const updateSparePartMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertSparePart> }) =>
      apiPut(`/api/spare-parts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/spare-parts'] });
      setEditingSparePart(null);
      setFormData({
        name: "",
        partNumber: "",
        categoryId: "none",
        productId: "none",
        price: 0,
        description: ""
      });
      toast({ title: "تم تحديث قطعة الغيار بنجاح" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "فشل في تحديث قطعة الغيار" });
    },
  });

  const deleteSparePartMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/spare-parts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/spare-parts'] });
      toast({ title: "تم حذف قطعة الغيار بنجاح" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "فشل في حذف قطعة الغيار" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Convert "none" values back to null for the API
    const submitData = {
      ...formData,
      categoryId: formData.categoryId === "none" ? null : formData.categoryId,
      productId: formData.productId === "none" ? null : formData.productId,
    };

    if (editingSparePart) {
      updateSparePartMutation.mutate({
        id: editingSparePart.id,
        data: submitData
      });
    } else {
      createSparePartMutation.mutate(submitData as InsertSparePart);
    }
  };

  const handleEdit = (sparePart: SparePart) => {
    setEditingSparePart(sparePart);
    setFormData({
      name: sparePart.name,
      partNumber: sparePart.partNumber,
      categoryId: sparePart.categoryId || "none",
      productId: sparePart.productId || "none",
      price: sparePart.price || 0,
      description: sparePart.description || ""
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("هل أنت متأكد من حذف قطعة الغيار؟")) {
      deleteSparePartMutation.mutate(id);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">إدارة قطع الغيار</h1>
        <p className="text-gray-600 mt-2">إضافة وإدارة قطع الغيار للمنتجات</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="product-filter">فلترة حسب المنتج</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع المنتجات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المنتجات</SelectItem>
                  {products?.map((product: Product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} {product.model ? `- ${product.model}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="search">البحث</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="ابحث في قطع الغيار..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-end">
              {canCreateSpareParts && (
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      إضافة قطعة غيار
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {editingSparePart ? "تعديل قطعة الغيار" : "إضافة قطعة غيار جديدة"}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="name">اسم قطعة الغيار</Label>
                        <Input
                          id="name"
                          value={formData.name || ""}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="partNumber">رقم القطعة</Label>
                        <Input
                          id="partNumber"
                          value={formData.partNumber || ""}
                          onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="product">المنتج المرتبط</Label>
                        <Select
                          value={formData.productId || "none"}
                          onValueChange={(value) => setFormData({ ...formData, productId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="اختر المنتج" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">غير مرتبط بمنتج محدد</SelectItem>
                            {products?.map((product: Product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} {product.model ? `- ${product.model}` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="category">الفئة</Label>
                        <Select
                          value={formData.categoryId || "none"}
                          onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الفئة" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">بدون فئة</SelectItem>
                            {categories?.map((category: Category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="price">السعر (ريال)</Label>
                        <Input
                          id="price"
                          type="number"
                          value={formData.price || 0}
                          onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                        />
                      </div>

                      <div>
                        <Label htmlFor="description">الوصف</Label>
                        <Textarea
                          id="description"
                          value={formData.description || ""}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button
                          type="submit"
                          disabled={createSparePartMutation.isPending || updateSparePartMutation.isPending}
                          className="flex-1"
                        >
                          {createSparePartMutation.isPending || updateSparePartMutation.isPending
                            ? "جاري الحفظ..."
                            : editingSparePart ? "تحديث" : "إضافة"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsAddDialogOpen(false);
                            setEditingSparePart(null);
                            setFormData({
                              name: "",
                              partNumber: "",
                              categoryId: "",
                              productId: "",
                              price: 0,
                              description: ""
                            });
                          }}
                          className="flex-1"
                        >
                          إلغاء
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spare Parts List */}
      <div className="grid gap-4">
        {sparePartsLoading ? (
          <div className="text-center py-8">جاري تحميل قطع الغيار...</div>
        ) : filteredSpareParts.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {selectedProduct ? "لا توجد قطع غيار لهذا المنتج" : "لا توجد قطع غيار"}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredSpareParts.map((sparePart: SparePart) => {
            const product = getProductDetails(sparePart.productId);
            const category = getCategoryDetails(sparePart.categoryId);

            return (
              <Card key={sparePart.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Wrench className="h-5 w-5" />
                        {sparePart.name}
                      </CardTitle>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{sparePart.partNumber}</Badge>
                        {product && (
                          <Badge variant="secondary">
                            منتج: {product.name}
                          </Badge>
                        )}
                        {category && (
                          <Badge variant="outline">
                            فئة: {category.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {canUpdateSpareParts && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(sparePart)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {canDeleteSpareParts && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(sparePart.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      {sparePart.description && (
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>الوصف:</strong> {sparePart.description}
                        </p>
                      )}
                      {sparePart.price && (
                        <p className="text-sm text-gray-600">
                          <strong>السعر:</strong> {sparePart.price} ريال
                        </p>
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-gray-500">
                        تم الإنشاء: {sparePart.createdAt ? new Date(sparePart.createdAt).toLocaleDateString('ar-SA') : 'غير محدد'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}