import axios from 'axios';

async function testSparePartCreation() {
  try {
    console.log('Testing spare part creation with inventory...');
    
    const testData = {
      name: "مكبس جديد",
      partNumber: "COMP-2024-001", 
      categoryId: 1,
      price: 250.50,
      description: "مكبس كهربائي عالي الكفاءة",
      inventory: {
        warehouseId: "1", // تحديث ليكون string كما هو متوقع
        quantity: 10,
        minQuantity: 3
      }
    };

    const response = await axios.post('http://localhost:5000/api/spare-parts', testData, {
      headers: {
        'Content-Type': 'application/json'
      },
      // Add session cookie if needed
      withCredentials: true
    });

    console.log('✅ Success! Spare part created:', response.data);
    console.log('This should also create an inventory record automatically.');

  } catch (error) {
    console.error('❌ Error creating spare part with inventory:');
    console.error('Message:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    if (error.response?.data?.errors) {
      console.error('Validation errors:', error.response.data.errors);
    }
  }
}

// Test without inventory data
async function testSparePartWithoutInventory() {
  try {
    console.log('\nTesting spare part creation WITHOUT inventory...');
    
    const testData = {
      name: "قطعة بدون مخزون",
      partNumber: "NO-INV-001", 
      categoryId: 1,
      price: 50.00,
      description: "قطعة غيار بدون إنشاء سجل مخزون"
    };

    const response = await axios.post('http://localhost:5000/api/spare-parts', testData, {
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });

    console.log('✅ Success! Spare part created:', response.data);
    console.log('No inventory record should be created for this one.');

  } catch (error) {
    console.error('❌ Error creating spare part without inventory:');
    console.error('Message:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    if (error.response?.data?.errors) {
      console.error('Validation errors:', error.response.data.errors);
    }
  }
}

// Run tests
testSparePartCreation()
  .then(() => testSparePartWithoutInventory())
  .catch(console.error);