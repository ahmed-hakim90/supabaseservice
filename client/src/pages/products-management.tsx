import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost, apiPut, apiDelete } from "../lib/db";
import { useAuth } from "../lib/auth";
import { canCreate, canUpdate, canDelete } from "../lib/permissions";
import type { Category, InsertCategory, Product, InsertProduct, SparePart, InsertSparePart } from "@shared/schema";
import { Package, Wrench, Grid3X3, Plus, Edit, Trash2, Search } from "lucide-react";

export default function ProductsManagement() {
  const [activeTab, setActiveTab] = useState("products");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  
  // Category states
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryFormData, setCategoryFormData] = useState<Partial<InsertCategory>>({});
  
  // Product states
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productFormData, setProductFormData] = useState<Partial<InsertProduct>>({});
  
  // Spare parts states
  const [isSparePartDialogOpen, setIsSparePartDialogOpen] = useState(false);
  const [editingSparePart, setEditingSparePart] = useState<SparePart | null>(null);
  const [sparePartFormData, setSparePartFormData] = useState<Partial<InsertSparePart>>({
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
  const canCreateCategories = currentUser ? canCreate(currentUser.role, 'categories') : false;
  const canUpdateCategories = currentUser ? canUpdate(currentUser.role, 'categories') : false;
  const canDeleteCategories = currentUser ? canDelete(currentUser.role, 'categories') : false;
  const canCreateSpareParts = currentUser ? canCreate(currentUser.role, 'spareParts') : false;
  const canUpdateSpareParts = currentUser ? canUpdate(currentUser.role, 'spareParts') : false;
  const canDeleteSpareParts = currentUser ? canDelete(currentUser.role, 'spareParts') : false;

  // Data queries
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: () => apiGet('/api/categories'),
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products'],
    queryFn: () => apiGet('/api/products'),
  });

  const { data: spareParts, isLoading: sparePartsLoading } = useQuery({
    queryKey: ['/api/spare-parts'],
    queryFn: () => apiGet('/api/spare-parts'),
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
      toast({ title: "خطأ في إضافة الفئة", variant: "destructive" });
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) =>
      apiPut(`/api/categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setEditingCategory(null);
      setCategoryFormData({});
      toast({ title: "تم تحديث الفئة بنجاح" });
    },
    onError: () => {
      toast({ title: "خطأ في تحديث الفئة", variant: "destructive" });
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({ title: "تم حذف الفئة بنجاح" });
    },
    onError: () => {
      toast({ title: "خطأ في حذف الفئة", variant: "destructive" });
    }
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
      toast({ title: "خطأ في إضافة المنتج", variant: "destructive" });
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
      apiPut(`/api/products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setEditingProduct(null);
      setProductFormData({});
      toast({ title: "تم تحديث المنتج بنجاح" });
    },
    onError: () => {
      toast({ title: "خطأ في تحديث المنتج", variant: "destructive" });
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({ title: "تم حذف المنتج بنجاح" });
    },
    onError: () => {
      toast({ title: "خطأ في حذف المنتج", variant: "destructive" });
    }
  });

  // Spare parts mutations
  const createSparePartMutation = useMutation({
    mutationFn: (data: InsertSparePart) => apiPost('/api/spare-parts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/spare-parts'] });
      setIsSparePartDialogOpen(false);
      setSparePartFormData({
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
      toast({ title: "خطأ في إضافة قطعة الغيار", variant: "destructive" });
    }
  });

  const updateSparePartMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SparePart> }) =>
      apiPut(`/api/spare-parts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/spare-parts'] });
      setEditingSparePart(null);
      setSparePartFormData({
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
      toast({ title: "خطأ في تحديث قطعة الغيار", variant: "destructive" });
    }
  });

  const deleteSparePartMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/spare-parts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/spare-parts'] });
      toast({ title: "تم حذف قطعة الغيار بنجاح" });
    },
    onError: () => {
      toast({ title: "خطأ في حذف قطعة الغيار", variant: "destructive" });
    }
  });

  // Handle form submissions
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormData.name) return;

    if (editingCategory) {
      updateCategoryMutation.mutate({
        id: editingCategory.id,
        data: categoryFormData
      });
    } else {
      createCategoryMutation.mutate(categoryFormData as InsertCategory);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productFormData.name || !productFormData.categoryId) return;

    if (editingProduct) {
      updateProductMutation.mutate({
        id: editingProduct.id,
        data: productFormData
      });
    } else {
      createProductMutation.mutate(productFormData as InsertProduct);
    }
  };

  const handleSparePartSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sparePartFormData.name || !sparePartFormData.partNumber) return;

    // Clean the form data - convert "none" to null
    const cleanFormData = {
      ...sparePartFormData,
      categoryId: sparePartFormData.categoryId === "none" ? null : sparePartFormData.categoryId,
      productId: sparePartFormData.productId === "none" ? null : sparePartFormData.productId,
    };

    if (editingSparePart) {
      updateSparePartMutation.mutate({
        id: editingSparePart.id,
        data: cleanFormData
      });
    } else {
      createSparePartMutation.mutate(cleanFormData as InsertSparePart);
    }
  };

  // Filter functions
  const filteredCategories = categories?.filter((category: Category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = products?.filter((product: Product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.categoryId === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredSpareParts = spareParts?.filter((sparePart: SparePart) => {
    const matchesSearch = sparePart.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sparePart.partNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProduct = selectedProduct === "all" || sparePart.productId === selectedProduct;
    return matchesSearch && matchesProduct;
  });

  if (categoriesLoading || productsLoading || sparePartsLoading) {
    return <div className="flex justify-center items-center min-h-screen">جارٍ التحميل...</div>;
  }

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">إدارة المنتجات وقطع الغيار</h1>
        <p className="text-muted-foreground">إدارة الفئات والمنتجات وقطع الغيار المسجلة في النظام</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Grid3X3 className="w-4 h-4" />
            الفئات
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            المنتجات
          </TabsTrigger>
          <TabsTrigger value="spare-parts" className="flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            قطع الغيار
          </TabsTrigger>
        </TabsList>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="relative w-64">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث في الفئات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            {canCreateCategories && (
              <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    إضافة فئة جديدة
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md" dir="rtl">
                  <DialogHeader>
                    <DialogTitle>{editingCategory ? 'تعديل الفئة' : 'إضافة فئة جديدة'}</DialogTitle>
                    <DialogDescription>
                      {editingCategory ? 'قم بتعديل بيانات الفئة' : 'أدخل بيانات الفئة الجديدة'}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCategorySubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="categoryName">اسم الفئة</Label>
                      <Input
                        id="categoryName"
                        required
                        value={categoryFormData.name || ""}
                        onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="categoryDescription">الوصف</Label>
                      <Textarea
                        id="categoryDescription"
                        value={categoryFormData.description || ""}
                        onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => {
                        setIsCategoryDialogOpen(false);
                        setEditingCategory(null);
                        setCategoryFormData({});
                      }}>
                        إلغاء
                      </Button>
                      <Button type="submit">
                        {editingCategory ? 'تحديث' : 'إضافة'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCategories?.map((category: Category) => (
              <Card key={category.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <Badge variant="outline" className="mt-1">
                        فئة
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      {canUpdateCategories && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingCategory(category);
                            setCategoryFormData(category);
                            setIsCategoryDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {canDeleteCategories && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteCategoryMutation.mutate(category.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                {category.description && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <div className="relative w-64">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث في المنتجات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="تصفية بالفئة" />
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
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  إضافة منتج جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md" dir="rtl">
                <DialogHeader>
                  <DialogTitle>{editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleProductSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="productName">اسم المنتج</Label>
                    <Input
                      id="productName"
                      required
                      value={productFormData.name || ""}
                      onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="productCategory">الفئة</Label>
                    <Select
                      value={productFormData.categoryId || ""}
                      onValueChange={(value) => setProductFormData({ ...productFormData, categoryId: value })}
                    >
                      <SelectTrigger>
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
                  <div className="space-y-2">
                    <Label htmlFor="productModel">الموديل</Label>
                    <Input
                      id="productModel"
                      value={productFormData.model || ""}
                      onChange={(e) => setProductFormData({ ...productFormData, model: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="productDescription">الوصف</Label>
                    <Textarea
                      id="productDescription"
                      value={productFormData.description || ""}
                      onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => {
                      setIsProductDialogOpen(false);
                      setEditingProduct(null);
                      setProductFormData({});
                    }}>
                      إلغاء
                    </Button>
                    <Button type="submit">
                      {editingProduct ? 'تحديث' : 'إضافة'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProducts?.map((product: Product) => (
              <Card key={product.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline">
                          {categories?.find((cat: Category) => cat.id === product.categoryId)?.name}
                        </Badge>
                        {product.model && (
                          <Badge variant="secondary">{product.model}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingProduct(product);
                          setProductFormData(product);
                          setIsProductDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteProductMutation.mutate(product.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {product.description && (
                    <p className="text-sm text-muted-foreground">{product.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Spare Parts Tab */}
        <TabsContent value="spare-parts" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <div className="relative w-64">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث في قطع الغيار..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="تصفية بالمنتج" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المنتجات</SelectItem>
                  {products?.map((product: Product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {canCreateSpareParts && (
              <Dialog open={isSparePartDialogOpen} onOpenChange={setIsSparePartDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    إضافة قطعة غيار جديدة
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md" dir="rtl">
                  <DialogHeader>
                    <DialogTitle>{editingSparePart ? 'تعديل قطعة الغيار' : 'إضافة قطعة غيار جديدة'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSparePartSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="sparePartName">اسم قطعة الغيار</Label>
                      <Input
                        id="sparePartName"
                        required
                        value={sparePartFormData.name || ""}
                        onChange={(e) => setSparePartFormData({ ...sparePartFormData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="partNumber">رقم القطعة</Label>
                      <Input
                        id="partNumber"
                        required
                        value={sparePartFormData.partNumber || ""}
                        onChange={(e) => setSparePartFormData({ ...sparePartFormData, partNumber: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sparePartCategory">الفئة</Label>
                      <Select
                        value={sparePartFormData.categoryId || "none"}
                        onValueChange={(value) => setSparePartFormData({ ...sparePartFormData, categoryId: value === "none" ? "none" : value })}
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
                    <div className="space-y-2">
                      <Label htmlFor="sparePartProduct">المنتج</Label>
                      <Select
                        value={sparePartFormData.productId || "none"}
                        onValueChange={(value) => setSparePartFormData({ ...sparePartFormData, productId: value === "none" ? "none" : value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المنتج" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">بدون منتج محدد</SelectItem>
                          {products?.map((product: Product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sparePartPrice">السعر</Label>
                      <Input
                        id="sparePartPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        value={sparePartFormData.price || ""}
                        onChange={(e) => setSparePartFormData({ ...sparePartFormData, price: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sparePartDescription">الوصف</Label>
                      <Textarea
                        id="sparePartDescription"
                        value={sparePartFormData.description || ""}
                        onChange={(e) => setSparePartFormData({ ...sparePartFormData, description: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => {
                        setIsSparePartDialogOpen(false);
                        setEditingSparePart(null);
                        setSparePartFormData({
                          name: "",
                          partNumber: "",
                          categoryId: "none",
                          productId: "none",
                          price: 0,
                          description: ""
                        });
                      }}>
                        إلغاء
                      </Button>
                      <Button type="submit">
                        {editingSparePart ? 'تحديث' : 'إضافة'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSpareParts?.map((sparePart: SparePart) => (
              <Card key={sparePart.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{sparePart.name}</CardTitle>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        <Badge variant="outline">{sparePart.partNumber}</Badge>
                        {sparePart.categoryId && sparePart.categoryId !== "none" && (
                          <Badge variant="secondary">
                            {categories?.find((cat: Category) => cat.id === sparePart.categoryId)?.name}
                          </Badge>
                        )}
                        {sparePart.productId && sparePart.productId !== "none" && (
                          <Badge variant="default">
                            {products?.find((prod: Product) => prod.id === sparePart.productId)?.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {canUpdateSpareParts && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingSparePart(sparePart);
                            setSparePartFormData(sparePart);
                            setIsSparePartDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {canDeleteSpareParts && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteSparePartMutation.mutate(sparePart.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {sparePart.price && sparePart.price > 0 && (
                      <p className="text-lg font-semibold text-primary">
                        {sparePart.price.toFixed(2)} ريال
                      </p>
                    )}
                    {sparePart.description && (
                      <p className="text-sm text-muted-foreground">{sparePart.description}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}