import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiGet } from "../lib/db";
import { useFormManagement } from "@/hooks/useFormManagement";
import { useDataTable } from "@/hooks/useDataTable";
import { usePermissions } from "@/hooks/usePermissions";
import { ReusableDialog, AddButton } from "@/components/ui/reusable-dialog";
import { ReusableTable } from "@/components/ui/reusable-table";
import { FormField } from "@/components/ui/form-fields";
import { StatusBadge, LoadingState, EmptyState } from "@/components/ui/state-components";
import type { Customer, InsertCustomer } from "@shared/schema";

export default function CustomersExample() {
  const permissions = usePermissions({ resource: 'customers' });

  // Data fetching
  const { data: rawCustomers = [], isLoading, error } = useQuery({
    queryKey: ['/api/customers'],
    queryFn: () => apiGet('/api/customers'),
  });

  // Form management
  const formManager = useFormManagement<Customer, InsertCustomer>({
    queryKey: ['/api/customers'],
    apiEndpoint: '/api/customers',
    successMessages: {
      create: 'تم إنشاء العميل بنجاح',
      update: 'تم تحديث العميل بنجاح',
      delete: 'تم حذف العميل بنجاح'
    },
    errorMessages: {
      create: 'خطأ في إنشاء العميل',
      update: 'خطأ في تحديث العميل',
      delete: 'خطأ في حذف العميل'
    }
  });

  // Data table management
  const tableManager = useDataTable<Customer>({
    data: rawCustomers,
    searchFields: ['fullName', 'email', 'phone'],
    filterFields: [
      {
        field: 'email',
        options: [
          { value: 'active', label: 'نشط' },
          { value: 'inactive', label: 'غير نشط' }
        ]
      }
    ],
    sortField: 'fullName',
    itemsPerPage: 10
  });

  // Table columns configuration
  const columns = [
    {
      key: 'fullName' as keyof Customer,
      label: 'الاسم الكامل',
      sortable: true,
      searchable: true,
    },
    {
      key: 'email' as keyof Customer,
      label: 'البريد الإلكتروني',
      sortable: true,
    },
    {
      key: 'phone' as keyof Customer,
      label: 'رقم الهاتف',
    },
    {
      key: 'email' as keyof Customer,
      label: 'الحالة',
      render: (value: string) => (
        <StatusBadge status={value ? 'active' : 'inactive'} />
      )
    },
    {
      key: 'createdAt' as keyof Customer,
      label: 'تاريخ الإنشاء',
      render: (value: Date) => new Date(value).toLocaleDateString('ar-EG')
    }
  ];

  // Form fields configuration
  const getFormFields = () => [
    <FormField
      key="fullName"
      type="text"
      name="fullName"
      label="الاسم الكامل"
      value={formManager.formData.fullName || ''}
      onChange={(value) => formManager.setFormData(prev => ({ ...prev, fullName: value }))}
      required
      placeholder="أدخل الاسم الكامل"
    />,
    <FormField
      key="email"
      type="email"
      name="email"
      label="البريد الإلكتروني"
      value={formManager.formData.email || ''}
      onChange={(value) => formManager.setFormData(prev => ({ ...prev, email: value }))}
      required
      placeholder="example@domain.com"
    />,
    <FormField
      key="phone"
      type="tel"
      name="phone"
      label="رقم الهاتف"
      value={formManager.formData.phone || ''}
      onChange={(value) => formManager.setFormData(prev => ({ ...prev, phone: value }))}
      placeholder="01xxxxxxxxx"
    />,
    <FormField
      key="address"
      type="textarea"
      name="address"
      label="العنوان"
      value={formManager.formData.address || ''}
      onChange={(value) => formManager.setFormData(prev => ({ ...prev, address: value }))}
      placeholder="أدخل العنوان"
      rows={3}
    />
  ];

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              خطأ في تحميل البيانات: {error.message}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة العملاء</h1>
          <p className="text-muted-foreground">إدارة بيانات العملاء</p>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="جاري تحميل بيانات العملاء..." variant="card" />
      ) : rawCustomers.length === 0 ? (
        <EmptyState
          title="لا يوجد عملاء"
          description="لم يتم إضافة أي عملاء بعد. ابدأ بإضافة عميل جديد."
          action={
            permissions.canCreate && (
              <AddButton
                onClick={formManager.openAddDialog}
                label="إضافة عميل جديد"
              />
            )
          }
        />
      ) : (
        <ReusableTable
          data={tableManager.data}
          columns={columns}
          title="قائمة العملاء"
          searchPlaceholder="البحث في العملاء..."
          
          // Search & Filter integration
          searchTerm={tableManager.searchTerm}
          onSearchChange={tableManager.setSearchTerm}
          filters_values={tableManager.filters}
          onFilterChange={tableManager.setFilter}
          
          // Sorting integration
          sortField={tableManager.sortField?.toString()}
          sortDirection={tableManager.sortDirection}
          onSort={(field) => tableManager.handleSort(field as keyof Customer)}
          
          // Pagination integration
          currentPage={tableManager.currentPage}
          totalPages={tableManager.totalPages}
          onPageChange={tableManager.goToPage}
          totalItems={tableManager.totalItems}
          startIndex={tableManager.startIndex}
          endIndex={tableManager.endIndex}
          
          // Filters configuration
          filters={[
            {
              field: 'email',
              label: 'الحالة',
              options: [
                { value: 'active', label: 'نشط' },
                { value: 'inactive', label: 'غير نشط' }
              ]
            }
          ]}
          
          // Actions configuration
          actions={{
            ...(permissions.canUpdate && { 
              edit: (customer: Customer) => formManager.openEditDialog(customer) 
            }),
            ...(permissions.canDelete && { 
              delete: (customer: Customer) => formManager.handleDelete(customer.id) 
            })
          }}
          
          // Header actions
          addButton={
            permissions.canCreate && (
              <AddButton
                onClick={formManager.openAddDialog}
                label="إضافة عميل"
              />
            )
          }
        />
      )}

      {/* Add/Edit Dialog */}
      <ReusableDialog
        open={formManager.isAddDialogOpen}
        onOpenChange={formManager.setIsAddDialogOpen}
        title={formManager.isEditing ? 'تعديل العميل' : 'إضافة عميل جديد'}
        onSubmit={formManager.handleSubmit}
        onCancel={formManager.closeDialog}
        isLoading={formManager.isLoading}
        isEditing={formManager.isEditing}
        maxWidth="md"
      >
        <div className="grid gap-4">
          {getFormFields()}
        </div>
      </ReusableDialog>
    </div>
  );
}