import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { ShoppingCart, Plus, Minus, Trash2, User, Package } from "lucide-react";

interface Customer {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
}

interface SparePart {
  id: string;
  name: string;
  partNumber: string;
  price: number;
  quantity: number;
}

interface SaleItem {
  sparePartId: string;
  sparePart: SparePart;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface SaleData {
  customerId: string;
  items: Array<{
    sparePartId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  totalAmount: number;
  notes?: string;
}

export default function QuickSale() {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();

  // Fetch customers
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const response = await fetch("/api/customers", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch customers");
      }
      return response.json();
    },
  });

  // Fetch spare parts with inventory
  const { data: spareParts = [] } = useQuery<SparePart[]>({
    queryKey: ["/api/spare-parts-with-inventory"],
    queryFn: async () => {
      const response = await fetch("/api/spare-parts-with-inventory", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch spare parts");
      }
      return response.json();
    },
  });

  // Create sale mutation
  const createSaleMutation = useMutation({
    mutationFn: async (saleData: SaleData) => {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(saleData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create sale");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم البيع بنجاح! ✅",
        description: "تم إنشاء فاتورة البيع وتحديث المخزون",
      });
      
      // Reset form
      setSelectedCustomer(null);
      setSaleItems([]);
      setNotes("");
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/spare-parts-with-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "خطأ في البيع ❌",
        description: error.message,
      });
    },
  });

  const addSaleItem = (sparePart: SparePart) => {
    const existingItem = saleItems.find(item => item.sparePartId === sparePart.id);
    
    if (existingItem) {
      updateItemQuantity(sparePart.id, existingItem.quantity + 1);
    } else {
      const newItem: SaleItem = {
        sparePartId: sparePart.id,
        sparePart,
        quantity: 1,
        unitPrice: sparePart.price,
        totalPrice: sparePart.price,
      };
      setSaleItems([...saleItems, newItem]);
    }
  };

  const updateItemQuantity = (sparePartId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeSaleItem(sparePartId);
      return;
    }

    const sparePart = spareParts.find(sp => sp.id === sparePartId);
    if (!sparePart) return;

    if (newQuantity > sparePart.quantity) {
      toast({
        variant: "destructive",
        title: "كمية غير كافية",
        description: `الكمية المتاحة: ${sparePart.quantity}`,
      });
      return;
    }

    setSaleItems(items =>
      items.map(item =>
        item.sparePartId === sparePartId
          ? {
              ...item,
              quantity: newQuantity,
              totalPrice: newQuantity * item.unitPrice,
            }
          : item
      )
    );
  };

  const removeSaleItem = (sparePartId: string) => {
    setSaleItems(items => items.filter(item => item.sparePartId !== sparePartId));
  };

  const updateItemPrice = (sparePartId: string, newPrice: number) => {
    setSaleItems(items =>
      items.map(item =>
        item.sparePartId === sparePartId
          ? {
              ...item,
              unitPrice: newPrice,
              totalPrice: item.quantity * newPrice,
            }
          : item
      )
    );
  };

  const getTotalAmount = () => {
    return saleItems.reduce((total, item) => total + item.totalPrice, 0);
  };

  const handleSubmit = async () => {
    if (!selectedCustomer) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "يجب اختيار العميل",
      });
      return;
    }

    if (saleItems.length === 0) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "يجب إضافة عنصر واحد على الأقل للبيع",
      });
      return;
    }

    const saleData: SaleData = {
      customerId: selectedCustomer.id,
      items: saleItems.map(item => ({
        sparePartId: item.sparePartId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
      totalAmount: getTotalAmount(),
      notes: notes.trim() || undefined,
    };

    setIsSubmitting(true);
    try {
      await createSaleMutation.mutateAsync(saleData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center gap-2 mb-6">
        <ShoppingCart className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">بيع سريع - قطع الغيار</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              اختيار العميل
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select onValueChange={(customerId) => {
              const customer = customers.find(c => c.id === customerId);
              setSelectedCustomer(customer || null);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="اختر العميل" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    <div>
                      <div className="font-medium">{customer.fullName}</div>
                      <div className="text-sm text-muted-foreground">{customer.phone}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedCustomer && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <h4 className="font-medium">{selectedCustomer.fullName}</h4>
                <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                {selectedCustomer.address && (
                  <p className="text-sm text-muted-foreground">{selectedCustomer.address}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Spare Parts Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              قطع الغيار المتاحة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {spareParts
                .filter(sp => sp.quantity > 0)
                .map((sparePart) => (
                <div
                  key={sparePart.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted cursor-pointer"
                  onClick={() => addSaleItem(sparePart)}
                >
                  <div className="flex-1">
                    <div className="font-medium">{sparePart.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {sparePart.partNumber}
                    </div>
                    <div className="text-sm">
                      <Badge variant="secondary">{sparePart.quantity} متوفر</Badge>
                      <span className="mr-2 text-green-600 font-medium">
                        {sparePart.price} ج.م
                      </span>
                    </div>
                  </div>
                  <Button size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sale Cart */}
        <Card>
          <CardHeader>
            <CardTitle>سلة البيع</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {saleItems.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  لم يتم إضافة أي عناصر للبيع
                </p>
              ) : (
                <>
                  {saleItems.map((item) => (
                    <div key={item.sparePartId} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">{item.sparePart.name}</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSaleItem(item.sparePartId)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label>الكمية:</Label>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateItemQuantity(item.sparePartId, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateItemQuantity(item.sparePartId, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Label>السعر:</Label>
                          <Input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updateItemPrice(item.sparePartId, Number(e.target.value))}
                            className="w-20"
                          />
                          <span>ج.م</span>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span>الإجمالي:</span>
                          <span className="font-medium">{item.totalPrice} ج.م</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>الإجمالي الكلي:</span>
                      <span>{getTotalAmount()} ج.م</span>
                    </div>

                    <div>
                      <Label>ملاحظات (اختياري)</Label>
                      <Textarea
                        placeholder="أدخل أي ملاحظات إضافية..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>

                    <Button
                      onClick={handleSubmit}
                      disabled={!selectedCustomer || saleItems.length === 0 || isSubmitting}
                      className="w-full"
                      size="lg"
                    >
                      {isSubmitting ? "جاري إتمام البيع..." : "إتمام البيع"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}