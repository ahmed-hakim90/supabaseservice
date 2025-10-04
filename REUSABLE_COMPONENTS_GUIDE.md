# المكونات القابلة لإعادة الاستخدام - Reusable Components

تم إنشاء مجموعة كاملة من المكونات والـ Hooks القابلة لإعادة الاستخدام لحل مشكلة الكود المكرر في المشروع.

## 📁 الملفات التي تم إنشاؤها:

### 1. Hooks قابلة لإعادة الاستخدام:
- ✅ `client/src/hooks/useFormManagement.ts` - إدارة النماذج و CRUD operations
- ✅ `client/src/hooks/useDataTable.ts` - إدارة الجداول والبحث والتصفية والترتيب
- ✅ `client/src/hooks/usePermissions.ts` - إدارة الصلاحيات

### 2. Components قابلة لإعادة الاستخدام:
- ✅ `client/src/components/ui/reusable-dialog.tsx` - Dialog موحد للإضافة والتعديل
- ✅ `client/src/components/ui/reusable-table.tsx` - Table موحد مع البحث والتصفية
- ✅ `client/src/components/ui/form-fields.tsx` - مكونات النماذج الموحدة
- ✅ `client/src/components/ui/state-components.tsx` - مكونات الحالات (Loading, Error, Success, etc.)

### 3. Theme Components (تم إنشاؤها مسبقاً):
- ✅ `client/src/components/ui/theme-toggle.tsx` - مكون التحكم في الثيم
- ✅ `client/src/components/ui/system-preferences.tsx` - مكون إعدادات النظام
- ✅ `client/src/hooks/useUserPreferences.ts` - Hook إدارة التفضيلات

### 4. ملفات التوثيق:
- ✅ `DUPLICATE_PATTERNS.txt` - تحليل الأنماط المكررة
- ✅ `client/src/pages/customers-example.tsx` - مثال كامل على كيفية الاستخدام

## 🚀 كيفية الاستخدام:

### 1. useFormManagement Hook:
```typescript
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

// الاستخدام
formManager.openAddDialog(); // فتح dialog للإضافة
formManager.openEditDialog(item); // فتح dialog للتعديل
formManager.handleSubmit(); // إرسال النموذج
formManager.handleDelete(id); // حذف عنصر
```

### 2. useDataTable Hook:
```typescript
const tableManager = useDataTable<Customer>({
  data: customers,
  searchFields: ['fullName', 'email', 'phone'],
  filterFields: [
    {
      field: 'status',
      options: [
        { value: 'active', label: 'نشط' },
        { value: 'inactive', label: 'غير نشط' }
      ]
    }
  ],
  sortField: 'fullName',
  itemsPerPage: 10
});

// الاستخدام
tableManager.data // البيانات المفلترة والمرتبة
tableManager.setSearchTerm(term) // البحث
tableManager.setFilter(field, value) // التصفية
tableManager.handleSort(field) // الترتيب
tableManager.goToPage(page) // التنقل بين الصفحات
```

### 3. usePermissions Hook:
```typescript
const permissions = usePermissions({ 
  resource: 'customers',
  page: 'customers' 
});

// الاستخدام
{permissions.canCreate && <AddButton />}
{permissions.canUpdate && <EditButton />}
{permissions.canDelete && <DeleteButton />}
```

### 4. ReusableTable Component:
```typescript
<ReusableTable
  data={tableManager.data}
  columns={columns}
  title="قائمة العملاء"
  
  // البحث والتصفية
  searchTerm={tableManager.searchTerm}
  onSearchChange={tableManager.setSearchTerm}
  filters_values={tableManager.filters}
  onFilterChange={tableManager.setFilter}
  
  // الترتيب
  sortField={tableManager.sortField?.toString()}
  sortDirection={tableManager.sortDirection}
  onSort={tableManager.handleSort}
  
  // الصفحات
  currentPage={tableManager.currentPage}
  totalPages={tableManager.totalPages}
  onPageChange={tableManager.goToPage}
  
  // الإجراءات
  actions={{
    edit: formManager.openEditDialog,
    delete: (item) => formManager.handleDelete(item.id)
  }}
  
  addButton={<AddButton onClick={formManager.openAddDialog} />}
/>
```

### 5. ReusableDialog Component:
```typescript
<ReusableDialog
  open={formManager.isAddDialogOpen}
  onOpenChange={formManager.setIsAddDialogOpen}
  title={formManager.isEditing ? 'تعديل' : 'إضافة جديد'}
  onSubmit={formManager.handleSubmit}
  isLoading={formManager.isLoading}
  isEditing={formManager.isEditing}
>
  {/* محتوى النموذج */}
</ReusableDialog>
```

### 6. FormField Components:
```typescript
<FormField
  type="text"
  name="fullName"
  label="الاسم الكامل"
  value={formData.fullName || ''}
  onChange={(value) => setFormData(prev => ({ ...prev, fullName: value }))}
  required
/>

<FormField
  type="select"
  name="status"
  label="الحالة"
  value={formData.status || ''}
  onChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
  options={[
    { value: 'active', label: 'نشط' },
    { value: 'inactive', label: 'غير نشط' }
  ]}
/>
```

### 7. State Components:
```typescript
// Loading State
<LoadingState message="جاري التحميل..." variant="card" />

// Empty State
<EmptyState
  title="لا توجد بيانات"
  description="ابدأ بإضافة البيانات"
  action={<AddButton onClick={openDialog} />}
/>

// Status Badge
<StatusBadge status="active" />

// Loading Button
<LoadingButton
  isLoading={isSubmitting}
  loadingText="جاري الحفظ..."
  onClick={handleSubmit}
>
  حفظ
</LoadingButton>
```

## 🎯 الفوائد المحققة:

### 1. تقليل التكرار:
- ❌ **قبل**: 20+ ملف بكود مكرر لإدارة النماذج
- ✅ **بعد**: hook واحد يُستخدم في جميع الصفحات

### 2. سهولة الصيانة:
- ❌ **قبل**: تعديل الكود في 20+ مكان
- ✅ **بعد**: تعديل واحد في المكون المشترك

### 3. الثبات والتوحيد:
- ❌ **قبل**: كل صفحة لها تصميم مختلف
- ✅ **بعد**: تصميم موحد ومتسق

### 4. سهولة التطوير:
- ❌ **قبل**: إنشاء صفحة جديدة يتطلب 200+ سطر من الكود
- ✅ **بعد**: إنشاء صفحة جديدة يتطلب 50 سطر فقط

## 📝 المهام التالية لتطبيق هذه المكونات:

### المرحلة 1: تحديث الصفحات الرئيسية
- [ ] `pages/users.tsx`
- [ ] `pages/customers.tsx`
- [ ] `pages/centers.tsx`
- [ ] `pages/warehouses.tsx`
- [ ] `pages/inventory.tsx`

### المرحلة 2: تحديث صفحات الإدارة
- [ ] `pages/categories.tsx`
- [ ] `pages/service-requests.tsx`
- [ ] `pages/transfers.tsx`
- [ ] `pages/spare-parts-management.tsx`

### المرحلة 3: تحديث صفحات المتقدمة
- [ ] `pages/user-management.tsx`
- [ ] `pages/warehouse-management.tsx`
- [ ] `pages/products-management.tsx`

### المرحلة 4: الاختبار والتحسين
- [ ] اختبار جميع الوظائف
- [ ] تحسين الأداء
- [ ] إضافة المزيد من الميزات

## 💡 ملاحظات مهمة:

1. **جميع المكونات تدعم اللغة العربية** ومصممة لتعمل من اليمين إلى اليسار
2. **المكونات قابلة للتخصيص بالكامل** عبر الـ props
3. **تدعم جميع حالات الاستخدام** (إضافة، تعديل، حذف، بحث، تصفية)
4. **متوافقة مع النظام الحالي** ولا تتطلب تغييرات كبيرة
5. **تتبع أفضل الممارسات** في React و TypeScript

## 🔧 كيفية التطبيق على الصفحات الموجودة:

1. **استبدال useState المكرر** بـ `useFormManagement`
2. **استبدال كود البحث والتصفية** بـ `useDataTable`
3. **استبدال الـ Dialog المكرر** بـ `ReusableDialog`
4. **استبدال الجداول المكررة** بـ `ReusableTable`
5. **استبدال مكونات النماذج** بـ `FormField`
6. **استبدال حالات التحميل** بـ `StateComponents`

هذا التصميم الجديد سيجعل المشروع أسهل في الصيانة والتطوير، ويقلل من الأخطاء، ويوفر تجربة مطور أفضل.