import requests
import json

BASE_URL = "http://localhost:3000/auth/register"

print("\n========================================")
print(" POST /auth/register - Test Suite")
print("========================================\n")

tests_passed = 0
tests_failed = 0

# Test 1: Valid Registration
print("Test 1: Valid Registration")
try:
    response = requests.post(BASE_URL, json={
        "email": "python.test@gcredit.com",
        "password": "SecurePass123",
        "firstName": "Python",
        "lastName": "Test"
    })
    
    if response.status_code == 201:
        data = response.json()
        print("✅ PASS - User created successfully")
        print(f"   User ID: {data.get('id')}")
        print(f"   Email: {data.get('email')}")
        print(f"   Name: {data.get('firstName')} {data.get('lastName')}")
        print(f"   Role: {data.get('role')}")
        print(f"   Active: {data.get('isActive')}")
        
        if 'passwordHash' in data:
            print("   ❌ SECURITY ISSUE: Password hash exposed!")
            tests_failed += 1
        else:
            print("   ✅ Password hash correctly excluded")
            tests_passed += 1
            
        global_test_email = data.get('email')
    else:
        print(f"❌ FAIL - Expected 201, got {response.status_code}")
        tests_failed += 1
except Exception as e:
    print(f"❌ FAIL - {str(e)}")
    tests_failed += 1

# Test 2: Duplicate Email
print("\nTest 2: Duplicate Email (should return 409)")
try:
    response = requests.post(BASE_URL, json={
        "email": "python.test@gcredit.com",
        "password": "AnotherPass123",
        "firstName": "Jane",
        "lastName": "Doe"
    })
    
    if response.status_code == 409:
        print("✅ PASS - Correctly returned 409 Conflict")
        print(f"   Message: {response.json().get('message')}")
        tests_passed += 1
    else:
        print(f"❌ FAIL - Expected 409, got {response.status_code}")
        tests_failed += 1
except Exception as e:
    print(f"❌ FAIL - {str(e)}")
    tests_failed += 1

# Test 3: Weak Password
print("\nTest 3: Weak Password (should return 400)")
try:
    response = requests.post(BASE_URL, json={
        "email": "weak.password@gcredit.com",
        "password": "weak",
        "firstName": "Weak",
        "lastName": "Password"
    })
    
    if response.status_code == 400:
        print("✅ PASS - Correctly returned 400 Bad Request")
        tests_passed += 1
    else:
        print(f"❌ FAIL - Expected 400, got {response.status_code}")
        tests_failed += 1
except Exception as e:
    print(f"❌ FAIL - {str(e)}")
    tests_failed += 1

# Test 4: Invalid Email
print("\nTest 4: Invalid Email Format (should return 400)")
try:
    response = requests.post(BASE_URL, json={
        "email": "not-an-email",
        "password": "SecurePass123",
        "firstName": "Invalid",
        "lastName": "Email"
    })
    
    if response.status_code == 400:
        print("✅ PASS - Correctly returned 400 Bad Request")
        tests_passed += 1
    else:
        print(f"❌ FAIL - Expected 400, got {response.status_code}")
        tests_failed += 1
except Exception as e:
    print(f"❌ FAIL - {str(e)}")
    tests_failed += 1

# Test 5: Missing Required Field
print("\nTest 5: Missing Required Field (firstName)")
try:
    response = requests.post(BASE_URL, json={
        "email": "missing.field@gcredit.com",
        "password": "SecurePass123",
        "lastName": "User"
    })
    
    if response.status_code == 400:
        print("✅ PASS - Correctly returned 400 Bad Request")
        tests_passed += 1
    else:
        print(f"❌ FAIL - Expected 400, got {response.status_code}")
        tests_failed += 1
except Exception as e:
    print(f"❌ FAIL - {str(e)}")
    tests_failed += 1

# Summary
print("\n========================================")
print(" Test Results Summary")
print("========================================")
print(f"Total Tests: {tests_passed + tests_failed}")
print(f"Passed: {tests_passed}")
print(f"Failed: {tests_failed}")

if tests_failed == 0:
    print("\n✅ All tests passed! Registration endpoint is working correctly.\n")
else:
    print("\n⚠️ Some tests failed. Please review the errors above.\n")
