# إعداد المشروع على Vercel

## خطوات النشر على Vercel:

### 1. إعداد متغيرات البيئة في Vercel:
في لوحة تحكم Vercel، اذهب إلى Settings → Environment Variables وأضف:

```
DATABASE_URL = postgresql://postgres.xyz:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
NODE_ENV = production
```

### 2. إعداد Build Commands في Vercel:
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### 3. إعداد قاعدة البيانات:
بعد النشر، شغل الأوامر دي محلياً لإعداد قاعدة البيانات:

```bash
# إعداد رابط قاعدة البيانات
export DATABASE_URL="your_supabase_database_url"

# إنشاء الجداول
npm run db:push

# إنشاء المستخدم الإداري
npx tsx server/init-db.ts
```

### 4. معلومات تسجيل الدخول:
- **البريد الإلكتروني:** admin@sokany.com
- **كلمة المرور:** Admin123!

### 5. ملاحظات مهمة:
- تأكد من أن رابط قاعدة البيانات صحيح
- استخدم Transaction Pooler URL من Supabase (المنفذ 6543)
- تأكد من أن SSL مفعل في قاعدة البيانات

### 6. في حالة مشاكل النشر:
إذا واجهت مشاكل، جرب:
- احذف `.vercel` folder وأعد النشر
- تأكد من أن جميع ملفات المشروع موجودة في GitHub
- تحقق من logs في Vercel Dashboard