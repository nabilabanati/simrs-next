/**
 * SIMRS-Next API Testing Suite - FINAL VERSION
 * With correct response format handling
 */

const BASE_URL = 'http://localhost:3000';

async function runAPITests() {
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║     SIMRS-Next API Testing Suite - FINAL      ║');
    console.log('╚════════════════════════════════════════════════╝\n');

    let passCount = 0;
    let failCount = 0;
    let token = '';

    // Test 1: Login as Loket
    console.log('🧪 TEST 1: POST /api/auth/login (Loket)');
    console.log('─'.repeat(60));
    try {
        const response = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'loket1', password: 'password' })
        });

        const result = await response.json();

        console.log(`Status: ${response.status}`);
        if (response.ok && result.success && result.data.token) {
            console.log('✅ PASS - Login successful');
            console.log(`User: ${result.data.user.nama}`);
            console.log(`Role: ${result.data.user.role}`);
            console.log(`Token: ${result.data.token.substring(0, 40)}...`);
            passCount++;
        } else {
            console.log('❌ FAIL');
            failCount++;
        }
    } catch (error) {
        console.log('❌ ERROR:', error.message);
        failCount++;
    }
    console.log('');

    // Test 2: Login as Doctor
    console.log('🧪 TEST 2: POST /api/auth/login (Doctor)');
    console.log('─'.repeat(60));
    try {
        const response = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'imesho', password: 'password' })
        });

        const result = await response.json();

        console.log(`Status: ${response.status}`);
        if (response.ok && result.success && result.data.token) {
            console.log('✅ PASS - Login successful');
            console.log(`User: ${result.data.user.nama}`);
            console.log(`Role: ${result.data.user.role}`);
            console.log(`Token: ${result.data.token.substring(0, 40)}...`);
            token = result.data.token; // Save for later tests
            passCount++;
        } else {
            console.log('❌ FAIL');
            failCount++;
        }
    } catch (error) {
        console.log('❌ ERROR:', error.message);
        failCount++;
    }
    console.log('');

    // Test 3: Login as Nurse
    console.log('🧪 TEST 3: POST /api/auth/login (Nurse)');
    console.log('─'.repeat(60));
    try {
        const response = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'nurse2', password: 'password' })
        });

        const result = await response.json();

        console.log(`Status: ${response.status}`);
        if (response.ok && result.success && result.data.token) {
            console.log('✅ PASS - Login successful');
            console.log(`User: ${result.data.user.nama}`);
            console.log(`Role: ${result.data.user.role}`);
            console.log(`Session Expires: ${new Date(result.data.sessionExpiresAt).toLocaleString('id-ID')}`);
            passCount++;
        } else {
            console.log('❌ FAIL');
            failCount++;
        }
    } catch (error) {
        console.log('❌ ERROR:', error.message);
        failCount++;
    }
    console.log('');

    // Test 4: Invalid Login
    console.log('🧪 TEST 4: POST /api/auth/login (Invalid Credentials)');
    console.log('─'.repeat(60));
    try {
        const response = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'loket1', password: 'wrongpassword' })
        });

        const result = await response.json();

        console.log(`Status: ${response.status}`);
        if (response.status === 401 && result.error) {
            console.log('✅ PASS - Correctly rejected invalid password');
            console.log(`Error: ${result.error}`);
            passCount++;
        } else {
            console.log('❌ FAIL - Should return 401');
            failCount++;
        }
    } catch (error) {
        console.log('❌ ERROR:', error.message);
        failCount++;
    }
    console.log('');

    // Test 5: Logout
    console.log('🧪 TEST 5: POST /api/auth/logout');
    console.log('─'.repeat(60));
    try {
        const response = await fetch(`${BASE_URL}/api/auth/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        console.log(`Status: ${response.status}`);
        if (response.ok && result.success) {
            console.log('✅ PASS - Logout successful');
            console.log(`Message: ${result.message}`);
            passCount++;
        } else {
            console.log('❌ FAIL');
            console.log(`Response:`, result);
            failCount++;
        }
    } catch (error) {
        console.log('❌ ERROR:', error.message);
        failCount++;
    }
    console.log('');

    // Summary
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║              TEST SUMMARY                      ║');
    console.log('╚════════════════════════════════════════════════╝');
    console.log(`Total Tests: ${passCount + failCount}`);
    console.log(`✅ Passed: ${passCount}`);
    console.log(`❌ Failed: ${failCount}`);
    const successRate = ((passCount / (passCount + failCount)) * 100).toFixed(1);
    console.log(`Success Rate: ${successRate}%`);

    if (successRate === '100.0') {
        console.log('\n🎉 ALL TESTS PASSED! 🎉\n');
    } else {
        console.log('\n⚠️  Some tests failed. Please review.\n');
    }
}

runAPITests().catch(console.error);
