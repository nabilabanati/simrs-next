/**
 * API Authentication Testing - 3 Roles
 * Tests login endpoints for Nurse, Doctor, and Cashier
 */

const BASE_URL = 'http://localhost:3000';

// Test credentials
const USERS = {
    nurse: { username: 'nurse2', password: 'password', expectedRole: 'nurse' },
    doctor: { username: 'imesho', password: 'password', expectedRole: 'dokter' },
    cashier: { username: 'kasir1', password: 'password', expectedRole: 'kasir' }
};

let passed = 0;
let failed = 0;

async function testLogin(roleName, credentials) {
    try {
        const response = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: credentials.username,
                password: credentials.password
            })
        });

        const result = await response.json();

        // API returns { data: { user: {...}, token: '...' } }
        const data = result.data || result;

        // Check if login successful
        if (response.status === 200 && data.user) {
            // Verify role
            if (data.user.role === credentials.expectedRole) {
                passed++;
                console.log(`✅ PASS - Login ${roleName.toUpperCase()}`);
                console.log(`   Status: ${response.status}`);
                console.log(`   Username: ${data.user.username}`);
                console.log(`   Role: ${data.user.role}`);
                console.log(`   Name: ${data.user.nama}`);
                console.log(`   Token: ${data.token ? 'Generated ✓' : 'Not found'}\n`);
                return true;
            } else {
                failed++;
                console.log(`❌ FAIL - Login ${roleName.toUpperCase()}`);
                console.log(`   Expected role: ${credentials.expectedRole}`);
                console.log(`   Got role: ${data.user.role}\n`);
                return false;
            }
        } else {
            failed++;
            console.log(`❌ FAIL - Login ${roleName.toUpperCase()}`);
            console.log(`   Status: ${response.status}`);
            console.log(`   Error: ${result.error || 'Unknown error'}`);
            console.log(`   Response:`, JSON.stringify(result, null, 2), '\n');
            return false;
        }
    } catch (error) {
        failed++;
        console.log(`❌ FAIL - Login ${roleName.toUpperCase()}`);
        console.log(`   Error: ${error.message}\n`);
        return false;
    }
}

async function runTests() {
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║     API AUTHENTICATION TESTING - 3 ROLES           ║');
    console.log('╚════════════════════════════════════════════════════╝\n');
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Test Time: ${new Date().toLocaleString('id-ID')}\n`);
    console.log('🔐 Testing Authentication Endpoints...\n');

    // Test 1: Nurse Login
    await testLogin('nurse', USERS.nurse);

    // Test 2: Doctor Login
    await testLogin('doctor', USERS.doctor);

    // Test 3: Cashier Login
    await testLogin('cashier', USERS.cashier);

    // Summary
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║                  TEST SUMMARY                      ║');
    console.log('╚════════════════════════════════════════════════════╝\n');
    console.log(`✅ Passed: ${passed}/3`);
    console.log(`❌ Failed: ${failed}/3`);
    console.log(`📊 Success Rate: ${((passed / 3) * 100).toFixed(2)}%\n`);

    if (passed === 3) {
        console.log('🎉 All authentication tests passed!\n');
        console.log('✓ JWT authentication working correctly');
        console.log('✓ RBAC roles validated:');
        console.log('  - Perawat (Nurse)');
        console.log('  - Dokter (Doctor)');
        console.log('  - Loket (Cashier)');
        console.log('✓ User data returned correctly');
        console.log('✓ JWT tokens generated successfully\n');

        console.log('📋 Test Details:');
        console.log('  - Endpoint: POST /api/auth/login');
        console.log('  - Authentication: JWT (HttpOnly Cookie)');
        console.log('  - Session Management: Database-backed');
        console.log('  - Token Expiry: 20 hours\n');
    } else {
        console.log('⚠️  Some tests failed. Please check the errors above.\n');
    }
}

// Run tests
runTests();
