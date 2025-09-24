# تحديثات النظام - نظام الموافقات والمخازن المستقلة

## ✅ الميزات الجديدة المُنجزة

### 1. نظام الموافقات للمستخدمين الجدد
- **حالة المستخدمين الجدد**: يبدأ المستخدمون الجدد بحالة `pending`
- **صفحة الموافقات**: `/dashboard/user-approvals` للمدراء والمديرين العامين
- **عملية الموافقة**: اختيار الدور، المركز، والمخزن مع إمكانية إضافة ملاحظات
- **سجل الموافقات**: حفظ تفاصيل كل موافقة في جدول `user_approvals`

### 2. فصل المخازن عن المراكز
- **مخازن مستقلة**: يمكن للمدير مخزن أن يكون غير مرتبط بمركز معين
- **حقل warehouseId**: إضافة حقل `warehouse_id` للمستخدمين
- **صلاحيات محددة**: مديرو المخازن يمكنهم الوصول لمخازنهم فقط

### 3. تحسين اختيار قطع الغيار
- **قطع الغيار من المخزن**: الفني يرى قطع الغيار من مخزنه فقط
- **API محدث**: `/api/warehouse/:warehouseId/spare-parts`
- **فئات متعددة**: إمكانية اختيار قطع من فئات مختلفة
- **عرض محسن**: عرض الفئات والكميات المتاحة

## 🔧 التغييرات التقنية

### قاعدة البيانات
```sql
-- جدول جديد للموافقات
CREATE TABLE user_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  approved_by UUID NOT NULL REFERENCES users(id),
  role user_role NOT NULL,
  center_id UUID,
  warehouse_id UUID,
  notes TEXT,
  approved_at TIMESTAMP DEFAULT NOW()
);

-- حقل جديد في جدول المستخدمين
ALTER TABLE users ADD COLUMN warehouse_id UUID;
```

### Schema Updates
```typescript
// إضافة warehouseId للمستخدمين
export const users = pgTable("users", {
  // ... existing fields
  warehouseId: uuid("warehouse_id"), // New field
});

// جدول الموافقات
export const userApprovals = pgTable("user_approvals", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull(),
  approvedBy: uuid("approved_by").notNull(),
  role: userRoleEnum("role").notNull(),
  centerId: uuid("center_id"),
  warehouseId: uuid("warehouse_id"),
  notes: text("notes"),
  approvedAt: timestamp("approved_at").defaultNow(),
});
```

### API Endpoints الجديدة
```typescript
// المستخدمين المعلقين
GET /api/pending-users

// الموافقة على مستخدم
POST /api/approve-user/:userId

// قطع الغيار في مخزن محدد
GET /api/warehouse/:warehouseId/spare-parts

// مستخدمي مخزن محدد
GET /api/warehouse/:warehouseId/users
```

### الواجهات الجديدة
- **صفحة الموافقات**: `UserApprovals` component
- **محدث SparePartsSelector**: يستخدم قطع الغيار من المخزن
- **تحديث الصلاحيات**: إضافة `user-approvals` للمدراء

## 📋 البيانات التجريبية

### مستخدمين معلقين للاختبار
```sql
INSERT INTO users (email, password, full_name, phone, address, role, status) VALUES
('technician.pending@example.com', '...', 'أحمد محمد', '+966501234567', 'جدة، حي الصفا', 'technician', 'pending'),
('receptionist.pending@example.com', '...', 'فاطمة علي', '+966507654321', 'الرياض، حي الملز', 'receptionist', 'pending'),
('warehouse.pending@example.com', '...', 'محمد حسن', '+966509876543', 'الدمام، حي الشاطئ', 'warehouse_manager', 'pending');
```

## 🔐 نظام الصلاحيات المحدث

### المدير العام (admin)
- ✅ جميع الصلاحيات
- ✅ الموافقة على جميع المستخدمين
- ✅ إدارة جميع المخازن والمراكز

### المدير (manager)
- ✅ الموافقة على المستخدمين لمركزه
- ✅ إدارة مخازن مركزه
- ✅ مراقبة طلبات الصيانة

### مدير المخزن (warehouse_manager)
- ✅ إدارة مخزنه فقط
- ✅ مراقبة قطع الغيار
- ✅ طلبات التحويل

### الفني (technician)
- ✅ رؤية قطع الغيار من مخزنه
- ✅ إضافة متابعات للطلبات
- ✅ اختيار قطع من فئات متعددة

## 🎯 كيفية الاستخدام

### 1. تسجيل مستخدم جديد
```typescript
// المستخدم يسجل ويحصل على حالة 'pending'
const newUser = await createUser({
  email: "new@example.com",
  fullName: "مستخدم جديد",
  // ... other fields
});
// status: 'pending'
```

### 2. الموافقة من المدير
```typescript
// المدير يوافق ويحدد الدور والمخزن
await approveUser(userId, {
  role: 'technician',
  centerId: 'center-uuid',
  warehouseId: 'warehouse-uuid',
  notes: 'موافقة على العمل كفني'
});
```

### 3. الفني يختار قطع الغيار
```typescript
// الفني يرى قطع الغيار من مخزنه فقط
const warehouseParts = await fetch(`/api/warehouse/${user.warehouseId}/spare-parts`);
// يمكنه اختيار من فئات مختلفة
```

## 📊 التقارير والإحصائيات

### إحصائيات الموافقات
- عدد المستخدمين المعلقين
- عدد الموافقات الشهرية
- توزيع الأدوار

### إحصائيات المخازن
- قطع الغيار في كل مخزن
- التحويلات بين المخازن
- الاستخدام حسب الفئات

## 🔄 التحديثات المستقبلية

1. **إشعارات**: تنبيهات عند وجود مستخدمين معلقين
2. **سير العمل**: موافقات متعددة المستويات
3. **تقارير**: تحليلات مفصلة للموافقات والمخازن
4. **API**: واجهات برمجية للتكامل مع أنظمة أخرى

## ✅ الاختبار والتحقق

### اختبار النظام
1. **صفحة الاختبار**: `http://localhost:3000/test`
2. **إدراج البيانات**: `/api/insert-test-data`
3. **صفحة الموافقات**: `/dashboard/user-approvals`

### التحقق من الصلاحيات
- ✅ المدراء يرون صفحة الموافقات
- ✅ الفنيين يرون قطع غيارهم فقط
- ✅ مديرو المخازن يديرون مخازنهم فقط

---
**تم تطبيق جميع المتطلبات بنجاح! 🎉**</content>
<parameter name="filePath">d:\hakim\dev\SupabaseService\APPROVALS_SYSTEM_REPORT.md