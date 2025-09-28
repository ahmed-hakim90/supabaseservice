// اختبار إضافة قطعة غيار مع بيانات مخزون
import axios from 'axios';

const baseURL = 'http://localhost:3000';

async function testCreateSparePartWithInventory() {
  try {
    console.log('🧪 اختبار إضافة قطعة غيار مع بيانات المخزون...\n');

    // بيانات قطعة الغيار مع المخزون
    const testData = {
      name: "مكبس هواء جديد",
      partNumber: "AIR-COMP-001",
      categoryId: 1,
      productId: 1,
      price: 150.75,
      description: "مكبس هواء للتبريد والتكييف",
      inventory: {
        warehouseId: "1", // معرف المخزن كـ string
        quantity: 15,     // الكمية الأولية
        minQuantity: 5    // الحد الأدنى
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
    console.log('📝 استجابة الخادم:', response.data);
    
    // التحقق من إنشاء سجل المخزون
    const inventoryResponse = await axios.get(`${baseURL}/api/inventory`, {
      withCredentials: true
    });
    
    console.log('\n📦 سجلات المخزون الحالية:');
    console.log(inventoryResponse.data);

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    
    if (error.response) {
      console.error('📄 تفاصيل الخطأ:', error.response.data);
      console.error('🔢 كود الحالة:', error.response.status);
    } else if (error.request) {
      console.error('📡 لا توجد استجابة من الخادم');
    }
  }
}

// اختبار الاتصال أولاً
async function testConnection() {
  try {
    console.log('🔌 اختبار الاتصال بالخادم...');
    const response = await axios.get(`${baseURL}/api/health`, { 
      timeout: 5000,
      withCredentials: true 
    });
    console.log('✅ الخادم متصل ويعمل\n');
    return true;
  } catch (error) {
    console.error('❌ فشل الاتصال بالخادم على:', baseURL);
    console.error('تأكد من تشغيل الخادم أولاً');
    return false;
  }
}

// تشغيل الاختبارات
async function runTests() {
  const isConnected = await testConnection();
  
  if (isConnected) {
    await testCreateSparePartWithInventory();
  }
}

runTests().catch(console.error);