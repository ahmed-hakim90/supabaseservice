import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost, apiPut, apiDelete } from "../lib/db";
import type { Category, InsertCategory, Product, InsertProduct } from "@shared/schema";

export default function Categories() {
  const [activeTab, setActiveTab] = useState("categories");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  // Category states
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryFormData, setCategoryFormData] = useState<Partial<InsertCategory>>({});
  
  // Product states
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productFormData, setProductFormData] = useState<Partial<InsertProduct>>({});
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: () => apiGet('/api/categories'),
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products'],
    queryFn: () => apiGet('/api/products'),
  });

  // Category mutations
  const createCategoryMutation = useMutation({
    mutationFn: (data: InsertCategory) => apiPost('/api/categories', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setIsCategoryDialogOpen(false);
      setCategoryFormData({});
      toast({ title: "تم إضافة الفئة بنجاح" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "فشل في إضافة الفئة" });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertCategory> }) => 
      apiPut(`/api/categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setEditingCategory(null);
      setCategoryFormData({});
      toast({ title: "تم تحديث الفئة بنجاح" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "فشل في تحديث الفئة" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({ title: "تم حذف الفئة بنجاح" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "فشل في حذف الفئة" });
    },
  });

  // Product mutations
  const createProductMutation = useMutation({
    mutationFn: (data: InsertProduct) => apiPost('/api/products', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setIsProductDialogOpen(false);
      setProductFormData({});
      toast({ title: "تم إضافة المنتج بنجاح" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "فشل في إضافة المنتج" });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertProduct> }) => 
      apiPut(`/api/products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setEditingProduct(null);
      setProductFormData({});
      toast({ title: "تم تحديث المنتج بنجاح" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "فشل في تحديث المنتج" });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({ title: "تم حذف المنتج بنجاح" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "فشل في حذف المنتج" });
    },
  });

  // Handlers
  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data: categoryFormData });
    } else {
      createCategoryMutation.mutate(categoryFormData as InsertCategory);
    }
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data: productFormData });
    } else {
      createProductMutation.mutate(productFormData as InsertProduct);
    }
  };

  const handleCategoryEdit = (category: Category) => {
    setEditingCategory(category);
    setCategoryFormData(category);
    setIsCategoryDialogOpen(true);
  };

  const handleProductEdit = (product: Product) => {
    setEditingProduct(product);
    setProductFormData(product);
    setIsProductDialogOpen(true);
  };

  const handleCategoryDelete = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذه الفئة؟")) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const handleProductDelete = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا المنتج؟")) {
      deleteProductMutation.mutate(id);
    }
  };

  const filteredCategories = categories?.filter((category: Category) => 
    category.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredProducts = products?.filter((product: Product) => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.model?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.categoryId === categoryFilter;
    return matchesSearch && matchesCategory;
  }) || [];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">الفئات والمنتجات</h1>
          <p className="text-muted-foreground">إدارة فئات المنتجات والمنتجات المختلفة</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="categories">الفئات</TabsTrigger>
          <TabsTrigger value="products">المنتجات</TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 space-x-reverse">
                <Input
                  placeholder="البحث في الفئات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-right max-w-sm"
                  data-testid="input-search-categories"
                />
              </div>
              <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="flex items-center space-x-2 space-x-reverse"
                    onClick={() => {
                      setEditingCategory(null);
                      setCategoryFormData({});
                    }}
                    data-testid="button-add-category"
                  >
                    <i className="bi bi-plus-circle"></i>
                    <span>إضافة فئة</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingCategory ? "تعديل الفئة" : "إضافة فئة جديدة"}</DialogTitle>
                    <DialogDescription>
                      {editingCategory ? "تعديل بيانات الفئة المحددة" : "إضافة فئة جديدة للمنتجات"}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCategorySubmit} className="space-y-4">
                    <div>
                      <Label>اسم الفئة</Label>
                      <Input
                        value={categoryFormData.name || ""}
                        onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                        required
                        className="text-right"
                        data-testid="input-category-name"
                      />
                    </div>
                    <div>
                      <Label>وصف الفئة</Label>
                      <Textarea
                        value={categoryFormData.description || ""}
                        onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                        className="text-right resize-none"
                        rows={3}
                        data-testid="textarea-category-description"
                      />
                    </div>
                    <Button type="submit" className="w-full" data-testid="button-save-category">
                      {editingCategory ? "تحديث" : "إضافة"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoriesLoading ? (
                <div className="col-span-full text-center py-8">
                  <div className="loading-spinner mx-auto"></div>
                </div>
              ) : filteredCategories.length === 0 ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  لا توجد فئات
                </div>
              ) : (
                filteredCategories.map((category: Category) => (
                  <Card key={category.id} className="hover-scale" data-testid={`card-category-${category.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <div className="w-10 h-10 bg-chart-1/10 rounded-lg flex items-center justify-center">
                            <i className="bi bi-diagram-3 text-chart-1"></i>
                          </div>
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCategoryEdit(category)}
                            className="p-2 text-chart-1 hover:bg-chart-1/10"
                            data-testid={`button-edit-category-${category.id}`}
                          >
                            <i className="bi bi-pencil text-sm"></i>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCategoryDelete(category.id)}
                            className="p-2 text-destructive hover:bg-destructive/10"
                            data-testid={`button-delete-category-${category.id}`}
                          >
                            <i className="bi bi-trash text-sm"></i>
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm">
                        {category.description || 'لا يوجد وصف'}
                      </p>
                      <div className="mt-3 text-xs text-muted-foreground">
                        المنتجات: {products?.filter((p: Product) => p.categoryId === category.id).length || 0}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="products">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 space-x-reverse">
                <Input
                  placeholder="البحث في المنتجات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-right max-w-sm"
                  data-testid="input-search-products"
                />
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-48" data-testid="select-filter-category">
                    <SelectValue placeholder="فلترة بالفئة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الفئات</SelectItem>
                    {categories?.map((category: Category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="flex items-center space-x-2 space-x-reverse"
                    onClick={() => {
                      setEditingProduct(null);
                      setProductFormData({});
                    }}
                    data-testid="button-add-product"
                  >
                    <i className="bi bi-plus-circle"></i>
                    <span>إضافة منتج</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingProduct ? "تعديل المنتج" : "إضافة منتج جديد"}</DialogTitle>
                    <DialogDescription>
                      {editingProduct ? "تعديل بيانات المنتج المحدد" : "إضافة منتج جديد للفئة المحددة"}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleProductSubmit} className="space-y-4">
                    <div>
                      <Label>اسم المنتج</Label>
                      <Input
                        value={productFormData.name || ""}
                        onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                        required
                        className="text-right"
                        data-testid="input-product-name"
                      />
                    </div>
                    <div>
                      <Label>رقم الموديل</Label>
                      <Input
                        value={productFormData.model || ""}
                        onChange={(e) => setProductFormData({ ...productFormData, model: e.target.value })}
                        className="text-right"
                        data-testid="input-product-model"
                      />
                    </div>
                    <div>
                      <Label>الفئة</Label>
                      <Select value={productFormData.categoryId || ""} onValueChange={(value) => setProductFormData({ ...productFormData, categoryId: value })}>
                        <SelectTrigger data-testid="select-product-category">
                          <SelectValue placeholder="اختر الفئة" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories?.map((category: Category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>وصف المنتج</Label>
                      <Textarea
                        value={productFormData.description || ""}
                        onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                        className="text-right resize-none"
                        rows={3}
                        data-testid="textarea-product-description"
                      />
                    </div>
                    <Button type="submit" className="w-full" data-testid="button-save-product">
                      {editingProduct ? "تحديث" : "إضافة"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">اسم المنتج</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الموديل</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الفئة</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الوصف</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {productsLoading ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8">
                          <div className="loading-spinner mx-auto"></div>
                        </td>
                      </tr>
                    ) : filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-muted-foreground">
                          لا توجد منتجات
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((product: Product) => (
                        <tr key={product.id} className="hover:bg-muted/50" data-testid={`row-product-${product.id}`}>
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-3 space-x-reverse">
                              <div className="w-8 h-8 bg-chart-2/10 rounded-lg flex items-center justify-center">
                                <i className="bi bi-box text-chart-2 text-sm"></i>
                              </div>
                              <span className="font-medium text-card-foreground">{product.name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-card-foreground">{product.model || 'غير محدد'}</td>
                          <td className="py-4 px-4 text-card-foreground">
                            {categories?.find((c: Category) => c.id === product.categoryId)?.name || 'غير محدد'}
                          </td>
                          <td className="py-4 px-4 text-card-foreground max-w-xs truncate">
                            {product.description || 'لا يوجد وصف'}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleProductEdit(product)}
                                className="p-2 text-chart-1 hover:bg-chart-1/10"
                                data-testid={`button-edit-product-${product.id}`}
                              >
                                <i className="bi bi-pencil text-sm"></i>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleProductDelete(product.id)}
                                className="p-2 text-destructive hover:bg-destructive/10"
                                data-testid={`button-delete-product-${product.id}`}
                              >
                                <i className="bi bi-trash text-sm"></i>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
