import 'dotenv/config';
import { pool } from './db';

async function testDatabaseConnection() {
  console.log('🔌 اختبار الاتصال بقاعدة البيانات...\n');

  try {
    // اختبار الاتصال الأساسي
    console.log('1️⃣ اختبار الاتصال الأساسي...');
    const client = await pool.connect();
    console.log('✅ نجح الاتصال بقاعدة البيانات');

    // اختبار استعلام بسيط
    console.log('\n2️⃣ اختبار استعلام بسيط...');
    const timeResult = await client.query('SELECT NOW() as current_time');
    console.log('✅ الوقت الحالي:', timeResult.rows[0].current_time);

    // اختبار جدول المستخدمين
    console.log('\n3️⃣ اختبار جدول المستخدمين...');
    const usersResult = await client.query('SELECT COUNT(*) as user_count FROM users');
    console.log('✅ عدد المستخدمين:', usersResult.rows[0].user_count);

    // اختبار جدول قطع الغيار
    console.log('\n4️⃣ اختبار جدول قطع الغيار...');
    const sparePartsResult = await client.query('SELECT COUNT(*) as parts_count FROM spare_parts');
    console.log('✅ عدد قطع الغيار:', sparePartsResult.rows[0].parts_count);

    // اختبار جدول المخزون
    console.log('\n5️⃣ اختبار جدول المخزون...');
    const inventoryResult = await client.query('SELECT COUNT(*) as inventory_count FROM inventory');
    console.log('✅ عدد سجلات المخزون:', inventoryResult.rows[0].inventory_count);

    // اختبار الجداول الجديدة
    console.log('\n6️⃣ اختبار الجداول الجديدة...');
    const scrapResult = await client.query('SELECT COUNT(*) as scrap_count FROM spare_parts_scrap');
    console.log('✅ عدد سجلات الهالك:', scrapResult.rows[0].scrap_count);

    const shortagesResult = await client.query('SELECT COUNT(*) as shortage_count FROM spare_parts_shortages');
    console.log('✅ عدد سجلات النواقص:', shortagesResult.rows[0].shortage_count);

    // تحرير الاتصال
    client.release();
    
    console.log('\n🎉 جميع الاختبارات نجحت! قاعدة البيانات تعمل بشكل سليم.');

  } catch (error) {
    console.error('\n❌ خطأ في الاتصال بقاعدة البيانات:');
    console.error('📝 رسالة الخطأ:', error.message);
    console.error('🔍 كود الخطأ:', error.code);
    console.error('📍 Stack trace:', error.stack);

    // اقتراحات للإصلاح
    console.log('\n💡 اقتراحات للإصلاح:');
    if (error.code === 'ENOTFOUND') {
      console.log('- تحقق من رابط قاعدة البيانات في ملف .env');
      console.log('- تأكد من أن Supabase project يعمل');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('- قاعدة البيانات قد تكون متوقفة');
      console.log('- تحقق من المنفذ في رابط الاتصال');
    } else if (error.message.includes('password')) {
      console.log('- تحقق من كلمة المرور في رابط قاعدة البيانات');
      console.log('- قد تحتاج لإعادة تعيين كلمة مرور قاعدة البيانات');
    } else if (error.message.includes('SSL')) {
      console.log('- تحقق من إعدادات SSL');
      console.log('- جرب إضافة ?sslmode=require لرابط قاعدة البيانات');
    }
    
    process.exit(1);
  } finally {
    // إغلاق Pool
    console.log('\n🔚 إغلاق اتصال قاعدة البيانات...');
    await pool.end();
  }
}

// تشغيل الاختبار
testDatabaseConnection().catch(console.error);