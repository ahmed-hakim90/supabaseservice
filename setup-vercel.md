# إعداد المشروع على Vercel

## خطوات النشر على Vercel:

### 0. المتطلبات المسبقة:
- حساب على [Vercel](https://vercel.com)
- المشروع موجود على GitHub/GitLab/Bitbucket
- حساب [Supabase](https://supabase.com) مع قاعدة بيانات PostgreSQL

### 1. ربط المشروع بـ Vercel:
1. اذهب إلى [vercel.com](https://vercel.com) وسجل الدخول
2. اضغط على **"New Project"**
3. اختر **"Import Git Repository"**
4. اختر المستودع `supabaseservice` من GitHub
5. اضغط **"Import"**

### 2. إعداد متغيرات البيئة في Vercel:
في لوحة تحكم Vercel، اذهب إلى Settings → Environment Variables وأضف:

```
DATABASE_URL = postgresql://postgres.xyz:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
NODE_ENV = production
PORT = 5000
```

**ملاحظة**: احصل على `DATABASE_URL` من Supabase Dashboard → Settings → Database → Connection Pooling

### 3. إعداد Build Commands في Vercel:
في إعدادات المشروع على Vercel، اذهب إلى Settings → General:

- **Framework Preset:** `Other`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`
- **Development Command:** `npm run dev`

**ملاحظة مهمة**: تأكد من وجود ملف `vercel.json` في جذر المشروع (موجود بالفعل)

### 4. إعداد قاعدة البيانات:
بعد النشر، شغل الأوامر دي محلياً لإعداد قاعدة البيانات:

```bash
# إعداد رابط قاعدة البيانات
export DATABASE_URL="your_supabase_database_url"

# إنشاء الجداول
npm run db:push

# إنشاء المستخدم الإداري
npx tsx server/init-db.ts
```

### 5. نشر المشروع:
1. في Vercel Dashboard، اضغط **"Deploy"**
2. انتظر حتى ينتهي النشر (عادة 2-5 دقائق)
3. احصل على رابط المشروع من Vercel (مثال: `https://your-project.vercel.app`)

### 6. معلومات تسجيل الدخول:
- **البريد الإلكتروني:** admin@sokany.com
- **كلمة المرور:** Admin123!

### 7. التحقق من نجاح النشر:
1. افتح الرابط المنشور على Vercel
2. تأكد من تحميل الصفحة الرئيسية بشكل صحيح
3. جرب تسجيل الدخول باستخدام بيانات المدير
4. تأكد من أن API يعمل بالذهاب إلى `/api/health`

### 8. ملاحظات مهمة:
- تأكد من أن رابط قاعدة البيانات صحيح
- استخدم Transaction Pooler URL من Supabase (المنفذ 6543)
- تأكد من أن SSL مفعل في قاعدة البيانات
- لا تنس إعداد متغيرات البيئة قبل النشر
- المشروع يحتاج إلى Node.js 18+ للعمل بشكل صحيح

### 9. في حالة مشاكل النشر:
إذا واجهت مشاكل، جرب:
- احذف `.vercel` folder وأعد النشر
- تأكد من أن جميع ملفات المشروع موجودة في GitHub
- تحقق من logs في Vercel Dashboard
- تأكد من أن Node.js version مضبوطة على 18+ في Vercel
- تحقق من أن متغيرات البيئة مضبوطة بشكل صحيح
- في حالة خطأ في Build، تحقق من وجود جميع التبعيات في `package.json`

### 10. نصائح لتحسين الأداء:
- فعّل **Edge Functions** في إعدادات Vercel للحصول على أداء أفضل
- استخدم **Vercel Analytics** لمتابعة الأداء
- فعّل **Automatic HTTPS** (مفعل افتراضياً)
- استخدم **Custom Domain** إذا كان متاحاً

### 11. التحديثات التلقائية:
- أي تغيير في branch `main` سيؤدي إلى نشر تلقائي جديد
- يمكن تعطيل النشر التلقائي من إعدادات Git في Vercel
- استخدم **Preview Deployments** لاختبار التغييرات قبل النشر الرسمي