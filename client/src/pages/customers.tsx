import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { apiGet, apiPost, apiPut, apiDelete } from "../lib/db";
import type { Customer, InsertCustomer } from "@shared/schema";

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<Partial<InsertCustomer>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Enable real-time updates
  const { isConnected } = useWebSocket();

  const { data: customers, isLoading } = useQuery({
    queryKey: ['/api/customers'],
    queryFn: () => apiGet('/api/customers'),
  });

  const createCustomerMutation = useMutation({
    mutationFn: (data: InsertCustomer) => apiPost('/api/customers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      setIsAddDialogOpen(false);
      setFormData({});
      toast({ title: "تم إضافة العميل بنجاح" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "فشل في إضافة العميل" });
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertCustomer> }) => 
      apiPut(`/api/customers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      setEditingCustomer(null);
      setFormData({});
      toast({ title: "تم تحديث العميل بنجاح" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "فشل في تحديث العميل" });
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      toast({ title: "تم حذف العميل بنجاح" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "فشل في حذف العميل" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomer) {
      updateCustomerMutation.mutate({ id: editingCustomer.id, data: formData });
    } else {
      createCustomerMutation.mutate(formData as InsertCustomer);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData(customer);
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا العميل؟")) {
      deleteCustomerMutation.mutate(id);
    }
  };

  const filteredCustomers = customers?.filter((customer: Customer) => {
    const matchesSearch = customer.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) || [];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">العملاء</h1>
          <p className="text-muted-foreground">إدارة بيانات العملاء والاتصال بهم</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="flex items-center space-x-2 space-x-reverse"
              onClick={() => {
                setEditingCustomer(null);
                setFormData({});
              }}
              data-testid="button-add-customer"
            >
              <i className="bi bi-plus-circle"></i>
              <span>إضافة عميل</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingCustomer ? "تعديل العميل" : "إضافة عميل جديد"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>الاسم بالكامل</Label>
                <Input
                  value={formData.fullName || ""}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  className="text-right"
                  data-testid="input-customer-name"
                />
              </div>
              <div>
                <Label>رقم الهاتف</Label>
                <Input
                  type="tel"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="text-right"
                  data-testid="input-customer-phone"
                />
              </div>
              <div>
                <Label>البريد الإلكتروني</Label>
                <Input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="text-right"
                  data-testid="input-customer-email"
                />
              </div>
              <div>
                <Label>العنوان</Label>
                <Textarea
                  value={formData.address || ""}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="text-right resize-none"
                  rows={3}
                  data-testid="textarea-customer-address"
                />
              </div>
              <Button type="submit" className="w-full" data-testid="button-save-customer">
                {editingCustomer ? "تحديث" : "إضافة"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label className="block text-sm font-medium text-card-foreground mb-2">البحث</Label>
              <Input
                placeholder="البحث بالاسم أو الهاتف أو البريد الإلكتروني..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-right"
                data-testid="input-search-customers"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <Card className="p-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 bg-chart-1/10 rounded-lg flex items-center justify-center">
              <i className="bi bi-people text-chart-1"></i>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي العملاء</p>
              <p className="text-xl font-bold text-card-foreground">
                {customers?.length || 0}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 bg-chart-2/10 rounded-lg flex items-center justify-center">
              <i className="bi bi-person-plus text-chart-2"></i>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">عملاء جدد هذا الشهر</p>
              <p className="text-xl font-bold text-card-foreground">
                {customers?.filter((c: Customer) => {
                  const createdAt = new Date(c.createdAt || '');
                  const now = new Date();
                  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                  return createdAt >= thisMonth;
                }).length || 0}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 bg-chart-3/10 rounded-lg flex items-center justify-center">
              <i className="bi bi-envelope text-chart-3"></i>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">عملاء بـ بريد إلكتروني</p>
              <p className="text-xl font-bold text-card-foreground">
                {customers?.filter((c: Customer) => c.email).length || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>
      
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الاسم</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الهاتف</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">البريد الإلكتروني</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">العنوان</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">تاريخ الإضافة</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    <div className="loading-spinner mx-auto"></div>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">
                    لا توجد عملاء
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer: Customer) => (
                  <tr key={customer.id} className="hover:bg-muted/50" data-testid={`row-customer-${customer.id}`}>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {customer.fullName?.charAt(0) || 'ع'}
                          </span>
                        </div>
                        <span className="font-medium text-card-foreground">{customer.fullName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-card-foreground">{customer.phone}</td>
                    <td className="py-4 px-4 text-card-foreground">{customer.email || 'غير متوفر'}</td>
                    <td className="py-4 px-4 text-card-foreground">{customer.address || 'غير محدد'}</td>
                    <td className="py-4 px-4 text-muted-foreground text-sm">
                      {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('ar-EG') : ''}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(customer)}
                          className="p-2 text-chart-1 hover:bg-chart-1/10"
                          data-testid={`button-edit-customer-${customer.id}`}
                        >
                          <i className="bi bi-pencil text-sm"></i>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(customer.id)}
                          className="p-2 text-destructive hover:bg-destructive/10"
                          data-testid={`button-delete-customer-${customer.id}`}
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
  );
}
