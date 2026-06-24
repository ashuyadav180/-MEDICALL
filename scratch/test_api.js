/**
 * test_api.js
 * Integration test script for the backend API
 */

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('🚀 Starting API Integration Tests...');

  const uniqueSuffix = Date.now();
  const testUserEmail = `user_${uniqueSuffix}@test.com`;
  const testUserPassword = 'password123';
  // Generate a unique 10-digit mobile number starting with 9
  const testUserPhone = '9' + String(uniqueSuffix).slice(-9);
  
  let customerToken = '';
  let adminToken = '';
  let testOrderId = '';
  let sampleMedicine = null;

  // 1. Test Customer Registration
  try {
    console.log(`\nTesting User Registration (Email: ${testUserEmail}, Phone: ${testUserPhone})...`);
    const registerRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Customer',
        email: testUserEmail,
        password: testUserPassword,
        mobile: testUserPhone
      })
    });
    const registerData = await registerRes.json();
    if (registerRes.status === 201) {
      console.log('✅ User Registration Succeeded!');
    } else {
      console.error('❌ User Registration Failed:', registerData);
    }
  } catch (err) {
    console.error('❌ User Registration Error:', err.message);
  }

  // 2. Test Customer Login
  try {
    console.log('\nTesting Customer Login...');
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testUserEmail,
        password: testUserPassword
      })
    });
    const loginData = await loginRes.json();
    if (loginRes.status === 200 && loginData.token) {
      customerToken = loginData.token;
      console.log('✅ Customer Login Succeeded!');
    } else {
      console.error('❌ Customer Login Failed:', loginData);
    }
  } catch (err) {
    console.error('❌ Customer Login Error:', err.message);
  }

  // 3. Test Admin Login
  try {
    console.log('\nTesting Admin Login...');
    const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'admin@bablu.com',
        password: 'AMIT@937149'
      })
    });
    const adminLoginData = await adminLoginRes.json();
    if (adminLoginRes.status === 200 && adminLoginData.token) {
      adminToken = adminLoginData.token;
      console.log('✅ Admin Login Succeeded!');
    } else {
      console.error('❌ Admin Login Failed:', adminLoginData);
    }
  } catch (err) {
    console.error('❌ Admin Login Error:', err.message);
  }

  // 4. Test Get Medicines & extract a sample
  try {
    console.log('\nTesting Fetch Medicines...');
    const medRes = await fetch(`${API_BASE}/medicines?limit=5`);
    const medData = await medRes.json();
    const list = medData.medicines || medData;
    if (medRes.status === 200 && Array.isArray(list) && list.length > 0) {
      sampleMedicine = list[0];
      console.log(`✅ Fetch Medicines Succeeded! Selected sample: ${sampleMedicine.name} (ID: ${sampleMedicine._id || sampleMedicine.id})`);
    } else {
      console.error('❌ Fetch Medicines Failed or Empty:', medData);
    }
  } catch (err) {
    console.error('❌ Fetch Medicines Error:', err.message);
  }

  // 5. Test Create Order (COD) using fetched medicine
  if (sampleMedicine && customerToken) {
    try {
      console.log('\nTesting Order Placement (COD)...');
      const medId = sampleMedicine._id || sampleMedicine.id;
      const orderRes = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${customerToken}`
        },
        body: JSON.stringify({
          orderItems: [
            {
              medicine: medId,
              name: sampleMedicine.name,
              quantity: 1,
              price: sampleMedicine.price,
              category: sampleMedicine.category || 'tablet'
            }
          ],
          customerName: 'Test Customer',
          customerPhone: testUserPhone,
          customerAddress: '123 Test Street, City, State - 110011',
          paymentMethod: 'cod',
          itemsPrice: sampleMedicine.price,
          shippingPrice: 40,
          totalPrice: sampleMedicine.price + 40
        })
      });
      const orderData = await orderRes.json();
      if (orderRes.status === 201) {
        testOrderId = orderData.id || orderData._id;
        console.log(`✅ Order Placement Succeeded! Order ID: ${testOrderId}`);
      } else {
        console.error('❌ Order Placement Failed:', orderData);
      }
    } catch (err) {
      console.error('❌ Order Placement Error:', err.message);
    }
  }

  // 6. Test Fetch My Orders
  if (customerToken) {
    try {
      console.log('\nTesting Fetch Customer Orders...');
      const myOrdersRes = await fetch(`${API_BASE}/orders/my`, {
        headers: { 'Authorization': `Bearer ${customerToken}` }
      });
      const myOrdersData = await myOrdersRes.json();
      if (myOrdersRes.status === 200 && Array.isArray(myOrdersData)) {
        console.log(`✅ Fetch Customer Orders Succeeded! Found ${myOrdersData.length} orders.`);
      } else {
        console.error('❌ Fetch Customer Orders Failed:', myOrdersData);
      }
    } catch (err) {
      console.error('❌ Fetch Customer Orders Error:', err.message);
    }
  }

  // 7. Test Admin Update Order Status
  if (testOrderId && adminToken) {
    try {
      console.log('\nTesting Admin Order Status Update...');
      const updateRes = await fetch(`${API_BASE}/orders/${testOrderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ status: 'delivered' })
      });
      const updateData = await updateRes.json();
      if (updateRes.status === 200) {
        console.log('✅ Admin Order Status Update Succeeded!');
      } else {
        console.error('❌ Admin Order Status Update Failed:', updateData);
      }
    } catch (err) {
      console.error('❌ Admin Order Status Update Error:', err.message);
    }
  }

  // 8. Test Support Message Submission
  try {
    console.log('\nTesting Support Message Submission...');
    const supportRes = await fetch(`${API_BASE}/support/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Customer',
        email: testUserEmail,
        subject: 'API Test Case',
        message: 'This is a test message to verify support API functionality.'
      })
    });
    const supportData = await supportRes.json();
    if (supportRes.status === 201) {
      console.log('✅ Support Message Submission Succeeded!');
    } else {
      console.error('❌ Support Message Submission Failed:', supportData);
    }
  } catch (err) {
    console.error('❌ Support Message Submission Error:', err.message);
  }

  console.log('\n🏁 Tests Completed.');
}

runTests();
