// Test User Registration Endpoint
// Story 2.2 - Task 2.2.7: Test Registration Flow

const BASE_URL = 'http://localhost:3000';

async function testRegister(testName, body, expectedStatus) {
  console.log(`\n${testName}`);
  try {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    const data = await response.json().catch(() => null);
    
    if (response.status === expectedStatus) {
      console.log(`✅ PASS - Status ${response.status}`);
      if (data) {
        console.log(`   User: ${data.firstName} ${data.lastName} (${data.email})`);
        console.log(`   ID: ${data.id}, Role: ${data.role}`);
        console.log(`   Password excluded: ${!data.passwordHash ? 'YES ✅' : 'NO ❌'}`);
      }
    } else {
      console.log(`❌ FAIL - Expected ${expectedStatus}, got ${response.status}`);
      if (data) console.log(`   Response: ${JSON.stringify(data)}`);
    }
  } catch (error) {
    console.log(`❌ ERROR - ${error.message}`);
  }
}

async function runTests() {
  console.log('=== Testing POST /auth/register ===\n');
  
  // Test 1: Valid Registration
  await testRegister(
    '1. Valid registration',
    {
      email: 'john.doe@gcredit.com',
      password: 'SecurePass123',
      firstName: 'John',
      lastName: 'Doe'
    },
    201
  );
  
  // Test 2: Duplicate Email
  await testRegister(
    '2. Duplicate email (should fail)',
    {
      email: 'john.doe@gcredit.com',
      password: 'AnotherPass123',
      firstName: 'Jane',
      lastName: 'Smith'
    },
    409
  );
  
  // Test 3: Weak Password
  await testRegister(
    '3. Weak password (should fail)',
    {
      email: 'jane.doe@gcredit.com',
      password: 'weak',
      firstName: 'Jane',
      lastName: 'Doe'
    },
    400
  );
  
  // Test 4: Invalid Email Format
  await testRegister(
    '4. Invalid email format (should fail)',
    {
      email: 'not-an-email',
      password: 'SecurePass123',
      firstName: 'Test',
      lastName: 'User'
    },
    400
  );
  
  // Test 5: Missing Required Field
  await testRegister(
    '5. Missing firstName (should fail)',
    {
      email: 'test@gcredit.com',
      password: 'SecurePass123',
      lastName: 'User'
    },
    400
  );
  
  console.log('\n=== Test Suite Complete ===\n');
}

runTests().catch(console.error);
