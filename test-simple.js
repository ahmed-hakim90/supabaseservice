// اختبار مبسط لإضافة قطعة غيار بدون اختبار الاتصال
import axios from 'axios';

const baseURL = 'http://localhost:3000';

async function testCreateSparePartDirectly() {
  try {
    console.log('🧪 محاولة إضافة قطعة غيار مع بيانات المخزون...\n');

    // محاولة تسجيل الدخول أولاً
    console.log('🔐 محاولة تسجيل الدخول...');
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'admin@sokany.com',
      password: 'Admin123!'
    }, {
      withCredentials: true,
      timeout: 10000
    });
    
    console.log('✅ تم تسجيل الدخول بنجاح');

    // بيانات قطعة الغيار مع المخزون
    const testData = {
      name: "قطعة اختبار جديدة",
      partNumber: "TEST-001",
      categoryId: 1,
      price: 100,
      description: "قطعة غيار للاختبار",
      inventory: {
        warehouseId: "f8442b7f-9455-4f0a-8ef2-e7cac45c9eb4", // معرف مخزن حقيقي من لوج الخادم
        quantity: 10,
        minQuantity: 2
      }
    };

    console.log('📤 إرسال البيانات:', JSON.stringify(testData, null, 2));

    const response = await axios.post(`${baseURL}/api/spare-parts`, testData, {
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
      timeout: 10000
    });

    console.log('✅ تم إنشاء قطعة الغيار بنجاح!');
    console.log('📝 استجابة الخادم:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    
    if (error.response) {
      console.error('📄 تفاصيل الخطأ:', JSON.stringify(error.response.data, null, 2));
      console.error('🔢 كود الحالة:', error.response.status);
    } else if (error.request) {
      console.error('📡 لا توجد استجابة من الخادم');
      console.error('تأكد من أن الخادم يعمل على:', baseURL);
    }
  }
}

testCreateSparePartDirectly().catch(console.error);