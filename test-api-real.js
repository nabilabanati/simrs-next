/**
 * API Test for SIMRS-Next with Real Credentials
 */

const BASE_URL = 'http://localhost:3000';

async function testAPI() {
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║     SIMRS-Next API Testing Suite              ║');
    console.log('╚════════════════════════════════════════════════╝\n');

    let passCount = 0;
    let failCount = 0;

    // Test 1: Login as Loket
    console.log('🧪 TEST 1: Login as Loket');
    console.log('─'.repeat(50));
    try {
        const response = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'loket1',
                password: 'password'
            })
        });

        const data = await response.json();

        console.log(`Status: ${response.status}`);
        if (response.ok && data.token) {
            console.log('✅ PASS - Login successful');
            console.log(`User: ${data.user.nama}`);
            console.log(`Role: ${data.user.role}`);
            console.log(`Token: ${data.token.substring(0, 30)}...`);
            passCount++;
        } else {
            console.log('❌ FAIL - Login failed');
            console.log(`Error: ${data.error}`);
            failCount++;
        }
    } catch (error) {
        console.log('❌ ERROR:', error.message);
        failCount++;
    }

    console.log('\n');

    // Test 2: Login as Doctor
    console.log('🧪 TEST 2: Login as Doctor');
    console.log('─'.repeat(50));
    try {
        const response = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'imesho',
                password: 'password'
            })
        });

        const data = await response.json();

        console.log(`Status: ${response.status}`);
        if (response.ok && data.token) {
            console.log('✅ PASS - Login successful');
            console.log(`User: ${data.user.nama}`);
            console.log(`Role: ${data.user.role}`);
            console.log(`Token: ${data.token.substring(0, 30)}...`);
            passCount++;
        } else {
            console.log('❌ FAIL - Login failed');
            console.log(`Error: ${data.error}`);
            failCount++;
        }
    } catch (error) {
        console.log('❌ ERROR:', error.message);
        failCount++;
    }

    console.log('\n');

    // Test 3: Login as Nurse
    console.log('🧪 TEST 3: Login as Nurse');
    console.log('─'.repeat(50));
    try {
        const response = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'nurse2',
                password: 'password'
            })
        });

        const data = await response.json();

        console.log(`Status: ${response.status}`);
        if (response.ok && data.token) {
            console.log('✅ PASS - Login successful');
            console.log(`User: ${data.user.nama}`);
            console.log(`Role: ${data.user.role}`);
            console.log(`Token: ${data.token.substring(0, 30)}...`);
            passCount++;
        } else {
            console.log('❌ FAIL - Login failed');
            console.log(`Error: ${data.error}`);
            failCount++;
        }
    } catch (error) {
        console.log('❌ ERROR:', error.message);
        failCount++;
    }

    console.log('\n');

    // Test 4: Invalid Login
    console.log('🧪 TEST 4: Invalid Login (Wrong Password)');
    console.log('─'.repeat(50));
    try {
        const response = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'loket1',
                password: 'wrongpassword'
            })
        });

        const data = await response.json();

        console.log(`Status: ${response.status}`);
        if (response.status === 401) {
            console.log('✅ PASS - Correctly rejected invalid password');
            console.log(`Error: ${data.error}`);
            passCount++;
        } else {
            console.log('❌ FAIL - Should return 401');
            failCount++;
        }
    } catch (error) {
        console.log('❌ ERROR:', error.message);
        failCount++;
    }

    console.log('\n');

    // Test 5: Logout
    console.log('🧪 TEST 5: Logout');
    console.log('─'.repeat(50));
    try {
        const response = await fetch(`${BASE_URL}/api/auth/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();

        console.log(`Status: ${response.status}`);
        if (response.ok) {
            console.log('✅ PASS - Logout successful');
            console.log(`Message: ${data.message}`);
            passCount++;
        } else {
            console.log('❌ FAIL - Logout failed');
            failCount++;
        }
    } catch (error) {
        console.log('❌ ERROR:', error.message);
        failCount++;
    }

    // Summary
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║              TEST SUMMARY                      ║');
    console.log('╚════════════════════════════════════════════════╝');
    console.log(`Total Tests: ${passCount + failCount}`);
    console.log(`✅ Passed: ${passCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`Success Rate: ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%`);
    console.log('');
}

testAPI().catch(console.error);
